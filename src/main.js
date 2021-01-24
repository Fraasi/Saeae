const path = require('path')
const {
  app, Menu, Tray, shell, BrowserWindow, ipcMain, nativeImage
} = require('electron')
const fetch = require('node-fetch')
const prompt = require('electron-prompt')
const Store = require('electron-store')
const deBounce = require('futility/lib/deBounce')
const positioner = require('electron-traywindow-positioner')
const { is } = require('electron-util')
const debug = require('electron-debug')
const { autoUpdater } = require('./utils/updater.js')


try { // doesn't break in ptoduction build
  require('electron-reloader')(module);
} catch { }
debug({ showDevTools: true, devToolsMode: 'detach' })
const { OPENWEATHER_APIKEY } = require('../env.js')

const storeSchema = {
  name: 'saeae',
  schema: {
    cityName: { type: 'string' },
    cityId: { type: 'number' },
    lat: { type: 'number' },
    lon: { type: 'number' },
    lastInput: { type: 'string' },
  },
  defaults: {
    cityName: 'Helsinki',
    cityId: 658226,
    lat: 60.18,
    lon: 24.93,
    lastInput: '',
  },
}
const store = new Store(storeSchema)

let astralWindow
let weatherWindow
let tray = null
let updateInterval
let closeApp = false

function promptCity() {
  prompt({
    alwaysOnTop: true,
    skipTaskbar: false,
    height: 180,
    title: 'Saeae - input new city or city id',
    label: `Current city: ${store.get('cityName')}`,
    type: 'input',
    inputAttrs: {
      type: 'text',
      placeholder: `last input: ${store.get('lastInput')}`,
    },
    icon: path.join(__dirname, 'images/cloud-outline.png'),
    customStylesheet: path.join(__dirname, 'styles.css'),
    menuBarVisible: false, // default in 1.6.0
  })
    .then((input) => { // null if window was closed or user clicked Cancel
      if (input === null) return
      if (input === '') input = store.get('lastInput') ? store.get('lastInput') : store.get('cityName')
      else store.set('lastInput', input)
      fetchWeather(input)
    })
    .catch(console.error)
}

function buildTrayContextMenu() {
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
      label: 'Quit Saeae',
      click() {
        closeApp = true
        tray.destroy()
        app.quit()
      },
    },
  ])
  tray.setContextMenu(contextMenu)
}

function fetchWeather(input) {
  tray.setImage(path.join(__dirname, './images/cloud-sync-outline.png'))
  const queryOrId = isNaN(parseInt(input, 10)) ? 'q' : 'id'
  const url = `https://api.openweathermap.org/data/2.5/weather?${queryOrId}=${input}&units=metric&appid=${OPENWEATHER_APIKEY}`
  fetch(url)
    .then(response => response.json())
    .then((json) => {
      clearInterval(updateInterval)
      if (json.cod !== 200) throw new Error(`${json.cod}, ${json.message}`)
      store.set({
        cityName: json.name,
        cityId: json.id,
        lat: json.coord.lat,
        lon: json.coord.lon,
      })
      tray.setToolTip(`Saeae for ${json.name} ${json.main.temp.toFixed(1)}°C`)

      weatherWindow.webContents.send('update-info', json)
      astralWindow.webContents.send('update-info', json)
      updateInterval = setInterval(fetchWeather.bind(null, store.get('cityId')), 1000 * 60 * 20)
    })
    .catch((err) => {
      console.log('fetch-err:', err)
      const error = {
        errText: `
          Bad Weather at the intertubes.<br />
          Something went terribly wrong fetching weather data.<br />
          Check your internet connection, or maybe you just misspelled your city (${store.get('lastInput')})?<br />
          See error below.
        `,
        bugReport: 'You can file a bug report at ',
        // hide appid in error message
        errMsg: err.message.replace(/&appid=.+2eb/, ''),
        errStack: err.stack.replace(/&appid=.+2eb/, ''),
      }
      tray.setToolTip('Bad weather, click for error info')
      const badWeather = path.join(__dirname, 'images/cloud-off-outline.png')
      tray.setImage(badWeather)
      weatherWindow.webContents.send('fetch-error', error)
      astralWindow.webContents.send('fetch-error', error)
    })
}

function createApp() {

  tray = new Tray(path.join(__dirname, './images/cloud-outline.png'))
  buildTrayContextMenu()

  // weatherWindow
  weatherWindow = new BrowserWindow({
    width: 330,
    height: 300,
    title: 'Saeae Weather',
    backgroundColor: 'rgb(51 ,51, 71)',
    show: is.development ? true : false,
    resizable: false,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'weather-preload.js'),
      contextIsolation: true,
      worldSafeExecuteJavaScript: true,
      enableRemoteModule: true, // custom titlebar needs this
    }
  })
  weatherWindow.loadURL(`file://${__dirname}/weather.html`)
  weatherWindow.on('close', (e) => {
    if (!closeApp) {
      e.preventDefault()
      weatherWindow.hide()
      return false
    }
  })
  weatherWindow.on('closed', () => {
    if (closeApp) weatherWindow = null
  })
  weatherWindow.setMenu(null)
  weatherWindow.webContents.on('did-finish-load', fetchWeather.bind(null, store.get('cityId')))

  // astralWindow
  astralWindow = new BrowserWindow({
    width: 330,
    height: 530, // old: 483,
    title: 'Saeae Astral',
    backgroundColor: 'rgb(51 ,51, 71)',
    show: false,
    resizable: false,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'astral-preload.js'),
      contextIsolation: true,
      worldSafeExecuteJavaScript: true,
      enableRemoteModule: true,
    }
  })
  astralWindow.loadURL(`file://${__dirname}/astral.html`)
  astralWindow.on('close', (e) => {
    if (!closeApp) {
      e.preventDefault()
      astralWindow.hide()
      return false
    }
  })
  astralWindow.on('closed', () => {
    if (closeApp) astralWindow = null
  })
  astralWindow.setMenu(null)
  astralWindow.webContents.on('did-finish-load', () => {
    astralWindow.webContents.send('update-info', null)
  })

  positioner.position(weatherWindow, tray.getBounds())
  positioner.position(astralWindow, tray.getBounds())

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

app.on('ready', () => {
  createApp()
  autoUpdater.checkForUpdates()
})

app.on('activate', () => {
  if (weatherWindow === null) createApp()
})

ipcMain.on('update-tray-data-url', (event, dataUrl) => {
  const url = nativeImage.createFromDataURL(dataUrl)
  url.resize({ width: 18, height: 18 })
  tray.setImage(url)
})

ipcMain.on('prompt-city', () => { promptCity() })
