const {
  app, Menu, Tray, shell, BrowserWindow, ipcMain, nativeImage,
} = require('electron')
const path = require('path')
const fetch = require('node-fetch')
const prompt = require('electron-prompt')
const Store = require('electron-store')
const deBounce = require('futility/lib/deBounce')
const Positioner = require('./utils/electron-positioner-fixed.js')
const { is } = require('electron-util')
const debug = require('electron-debug')
debug({showDevTools: true})

const dotenv = require('dotenv')
dotenv.config()
const store = new Store({
  name: 'saeae',
  defaults: {
    weatherCity: 'helsinki',
    lat: 61.5,
    lon: 23.76,
    cityId: 634964,
    lastInput: '',
  },
})

console.log(path.join(__dirname, 'preload.js'), path.resolve(__dirname, 'preload.js'))

let astralWindow
let weatherWindow
let tray = null
let updateInterval
let close = false

function promptCity() {
  prompt({
    alwaysOnTop: true,
    height: 150,
    title: 'Saeae - input new city or city id',
    label: `Current city: ${store.get('weatherCity')}`,
    type: 'input',
    inputAttrs: {
      type: 'text',
      placeholder: `last input: ${store.get('lastInput')}`,
    },
    icon: path.join(__dirname, 'images/weather-cloudy-black.png'),
    customStylesheet: path.join(__dirname, 'styles.css'),
  })
    .then((input) => { // null if window was closed or user clicked Cancel
      if (input === null) return
      if (input === '') input = store.get('lastInput') ? store.get('lastInput') : store.get('weatherCity')
      else store.set('lastInput', input)
      fetchWeather(input)
    })
    .catch(console.error)
}

function buildContextMenu() {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: `Saeae v${app.getVersion()} by Fraasi`,
      icon: path.join(__dirname, 'images/fraasi-16x16.png'),
      click() {
        shell.openExternal('https://github.com/Fraasi/Saeae#readme')
      },
    },
    {
      label: 'Data from openweathermap.org',
      click() {
        shell.openExternal('https://openweathermap.org/')
      },
    },
    {
      label: 'Change city',
      click() {
        promptCity()
      },
    },
    { type: 'separator' },
    {
      label: 'Quit app',
      click() {
        close = true
        tray.destroy()
        app.quit()
      },
    },
  ])
  tray.setContextMenu(contextMenu)
}

function fetchWeather(input) {
  tray.setImage(path.join(__dirname, './images/weather-cloudy.png'))
  const queryOrId = isNaN(parseInt(input, 10)) ? 'q' : 'id'
  const url = `https://api.openweathermap.org/data/2.5/weather?${queryOrId}=${input}&units=metric&appid=${process.env.OPENWEATHER_APIKEY}`
  fetch(url)
    .then(response => response.json())
    .then((json) => {
      clearInterval(updateInterval)
      if (json.cod !== 200) throw new Error(`${json.cod}, ${json.message}`)
      store.set({
        lat: json.coord.lat,
        lon: json.coord.lon,
        cityId: json.id,
        weatherCity: json.name,
      })
      tray.setToolTip(`Saeae for ${json.name} ${json.main.temp.toFixed(1)}°C`)

      weatherWindow.webContents.send('update-info', json)
      astralWindow.webContents.send('update-info', json)
      updateInterval = setInterval(fetchWeather.bind(null, store.get('weatherCity')), 1000 * 60 * 20)
    })
    .catch((err) => {
      const error = {
        errText: `
          Bad Weather at the intertubes.<br />
          Something went terribly wrong fetching weather data.<br />
          Check your internet connection, or maybe you just misspelled your city (${store.get('lastInput')})?<br />
          See error below.
        `,
        bugReport: 'You can file a bug report at ',
        errMsg: err.message.replace(/&appid=.+2eb/, ''), // hide api in error message
        errStack: err.stack.replace(/&appid=.+2eb/, ''),
      }

      store.set('weatherCity', '<error>')
      tray.setToolTip('Bad weather, click for error info')
      const badWeather = path.join(__dirname, 'images/weather-downpour.png')
      tray.setImage(badWeather)
      weatherWindow.webContents.send('fetch-error', error)
      astralWindow.webContents.send('fetch-error', error)
    })
}

function createApp() {
  // weatherWindow
  weatherWindow = new BrowserWindow({
    width: is.development ? 600 : 330,
    height: is.development ? 500 : 297,
    icon: path.join(__dirname, 'images/weather-cloudy-black.png'),
    title: 'Saeae Weather',
    backgroundColor: 'rgb(51 ,51, 71)',
    show: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      devTools: is.development ? true :  false,
      nodeIntegration: true,
      contextIsolation: false
    }
  })
  weatherWindow.loadURL(`file://${__dirname}/weather.html`)
  weatherWindow.on('close', (e) => {
    if (!close) {
      e.preventDefault()
      weatherWindow.hide()
      return false
    }
  })
  weatherWindow.on('closed', () => {
    if (close) weatherWindow = null
  })
  weatherWindow.setMenu(null)
  const weatherPos = new Positioner(weatherWindow)
  weatherPos.move('bottomRight')
  weatherWindow.webContents.on('did-finish-load', fetchWeather.bind(null, store.get('weatherCity')))

  // astralWindow
  astralWindow = new BrowserWindow({
    width: is.development ? 600 : 330, // 330
    height: is.development ? 500 : 483, // 483
    icon: path.join(__dirname, 'images/baseline_brightness_high_black_18dp.png'),
    title: 'Saeae Astral',
    backgroundColor: 'rgb(51 ,51, 71)',
    show: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      devTools: is.development ? true :  false,
      nodeIntegration: true,
      contextIsolation: false
    }
  })
  astralWindow.loadURL(`file://${__dirname}/astral.html`)
  astralWindow.on('close', (e) => {
    if (!close) {
      e.preventDefault()
      astralWindow.hide()
      return false
    }
  })
  astralWindow.on('closed', () => {
    if (close) astralWindow = null
  })
  astralWindow.setMenu(null)
  const astroPos = new Positioner(astralWindow)
  astroPos.move('bottomRight')
  astralWindow.webContents.on('did-finish-load', () => {
    astralWindow.webContents.send('update-info', null)
  })

  // tray
  tray = new Tray(path.join(__dirname, './images/weather-cloudy.png'))
  buildContextMenu()

  let dblClick = false
  tray.on('click', () => {
    dblClick = false
    deBounce(() => {
      if (!dblClick) {
        if (weatherWindow.isVisible()) weatherWindow.hide()
        else weatherWindow.show()
      }
    }, 250)
  })
  tray.on('double-click', () => {
    dblClick = true
    if (astralWindow.isVisible()) astralWindow.hide()
    else astralWindow.show()
  })
}

app.on('ready', createApp)

app.on('activate', () => {
  if (weatherWindow === null) createApp()
})

ipcMain.on('update-tray-data-url', (event, dataUrl) => {
  const url = nativeImage.createFromDataURL(dataUrl)
  url.resize({ width: 16, height: 16 })
  tray.setImage(url)
})
