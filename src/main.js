import {
  app, Menu, Tray, shell, BrowserWindow, ipcMain, nativeImage,
} from 'electron'
import path from 'path'
import fetch from 'node-fetch'
import prompt from 'electron-prompt'
import Positioner from 'electron-positioner'
import Store from 'electron-store'
import dotenv from 'dotenv'
import deBounce from 'futility/lib/deBounce'

dotenv.config()
const store = new Store({
  name: 'saeae',
  defaults: {
    storePath: app.getPath('userData'),
    weatherCity: 'Tampere',
    lat: 61.5,
    lon: 23.76,
    cityId: 634964,
    lastInput: 'tampere',
  },
})

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit()
}

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
    icon: path.join(__dirname, 'assets/weather-cloudy-black.png'),
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
      icon: path.join(__dirname, 'assets/fraasi-16x16.png'),
      click() {
        shell.openExternal('https://github.com/Fraasi/Saeae')
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
  tray.setImage(path.join(__dirname, './assets/weather-cloudy.png'))
  const queryOrId = isNaN(parseInt(input, 10)) ? 'q' : 'id'
  const url = `https://api.openweathermap.org/data/2.5/weather?${queryOrId}=${input}&units=metric&appid=${process.env.OPENWEATHER_APIKEY}`
  // weatherWindow.webContents.send('log', { input, url })
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
        errStack: err.stack,
      }

      store.set('weatherCity', '<error>')
      tray.setToolTip('Bad weather, click for error info')
      const badWeather = path.join(__dirname, 'assets/weather-downpour.png')
      tray.setImage(badWeather)
      weatherWindow.webContents.send('fetch-error', error)
      astralWindow.webContents.send('fetch-error', error)
    })
}

function createApp() {
  // weatherWindow
  weatherWindow = new BrowserWindow({
    width: 330, // 330
    height: 317, // 317
    icon: path.join(__dirname, 'assets/weather-cloudy-black.png'),
    title: 'Saeae Weather',
    backgroundColor: 'rgb(51 ,51, 71)',
    show: false,
    resizable: false,
  })
  weatherWindow.loadURL(`file://${__dirname}/weather.html`)
  // weatherWindow.webContents.openDevTools()
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
    width: 330, // 330
    height: 485, // 485
    icon: path.join(__dirname, 'assets/baseline_brightness_high_black_18dp.png'),
    title: 'Saeae Astral',
    backgroundColor: 'rgb(51 ,51, 71)',
    show: false,
    resizable: false,
  })
  astralWindow.loadURL(`file://${__dirname}/astral.html`)
  // astralWindow.webContents.openDevTools()
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
  tray = new Tray(path.join(__dirname, './assets/weather-cloudy.png'))
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
