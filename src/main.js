import { app, Menu, Tray, shell, BrowserWindow, ipcMain, nativeImage } from 'electron'
import path from 'path'
import fetch from 'node-fetch'
import prompt from 'electron-prompt'
import Store from 'electron-store'
import dotenv from 'dotenv'

dotenv.config()


const store = new Store({
  name: 'saeae-city',
  defaults: {
    storePath: app.getPath('userData'),
    weatherCity: 'tampere',
  },
})

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit()
}

let mainWindow
let tray = null
let city = store.get('weatherCity')
let interval
let close = false

function parseTime(time) {
  return (time < 10) ? `0${time}` : time
}

function promptCity() {
  prompt({
    alwaysOnTop: true,
    title: 'Sää',
    label: `Current city: ${city}`,
    type: 'input',
    inputAttrs: {
      type: 'text',
      placeholder: 'New city',
    },
    icon: path.join(__dirname, 'assets/weather-cloudy-black.png'),
  })
    .then((input) => {
      // null if window was closed or user clicked Cancel
      if (input === null) return
      city = input
      store.set('weatherCity', city)
      fetchWeather()
    })
    .catch(console.error);
}

function buildContextMenu(json) {
  const { name, weather, main, sys, wind } = json
  const contextMenu = Menu.buildFromTemplate([
    { label: `${name} weather` },
    { label: `${weather[0].description.charAt(0).toUpperCase() + weather[0].description.slice(1)}` },
    { label: `Temperature: ${main.temp.toFixed(1)}°C` },
    { label: `Clouds: ${json.clouds.all}%` },
    { label: `Visibility: ${json.visibility}m` },
    { label: `Humidity: ${main.humidity}%` },
    { label: `Pressure: ${main.pressure} hPa` },
    { label: `Wind: ${wind.speed} m/s @ ${wind.deg}°` },
    { label: `Sunrise: ${parseTime(new Date(sys.sunrise * 1000).getHours())}:${parseTime(new Date(sys.sunrise * 1000).getMinutes())}` },
    { label: `Sunset: ${parseTime(new Date(sys.sunset * 1000).getHours())}:${parseTime(new Date(sys.sunset * 1000).getMinutes())}` },
    { type: 'separator' },
    {
      label: 'Data from openweathermap.org',
      click() {
        shell.openExternal(`https://openweathermap.org/city/${store.get('cityId')}`)
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
      label: 'Sää authored by Fraasi',
      click() {
        shell.openExternal('https://github.com/Fraasi')
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

function fetchWeather() {
  tray.setImage(path.join(__dirname, './assets/weather-cloudy.png'))
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.OPENWEATHER_APIKEY}&units=metric`
  fetch(url)
    .then(response => response.json())
    .then((json) => {
      if (json.cod !== 200) throw new Error(`${json.cod}, ${json.message}`)
      clearInterval(interval)
      store.set('lat', json.coord.lat)
      store.set('lon', json.coord.lon)
      store.set('cityId', json.id)
      tray.setToolTip(`Sää for ${json.name} ${json.main.temp.toFixed(1)}°C`)
      buildContextMenu(json)
      mainWindow.webContents.send('create-new-tray-icon', Math.round(json.main.temp).toString())
      interval = setInterval(fetchWeather, 1000 * 60 * 20)
    })
    .catch((err) => {
      const contextMenu = Menu.buildFromTemplate([
        { label: 'Bad Weather at the intertubes' },
        { label: 'Something went terribly wrong fetching weather data' },
        { label: 'Double click icon to see error message' }, // needed?
        { label: 'Try restarting the app and/or check your internet connection' },
        { label: `Or maybe you just misspelled your city (${city})` },
        { type: 'separator' },
        {
          label: 'You can file a bug report at github.com/Fraasi/Saeae',
          click() {
            shell.openExternal('https://github.com/Fraasi/Saeae')
          },
        },
        {
          label: 'Change city',
          click() {
            promptCity()
          },
        },
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
      tray.setToolTip('Bad weather, rigth click for more info')
      const badWeather = path.join(__dirname, 'assets/weather-downpour.png')
      tray.setImage(badWeather)
      mainWindow.webContents.send('fetchError', { msg: err.message, stack: err.stack })
    })
}

function createTray() {
  mainWindow = new BrowserWindow({
    width: 330,
    height: 410,
    icon: path.join(__dirname, 'assets/weather-cloudy-black.png'),
    title: 'Sää',
    show: false,
    resizable: false,
  })
  mainWindow.loadURL(`file://${__dirname}/index.html`)
  // mainWindow.webContents.openDevTools()
  mainWindow.on('close', (e) => {
    if (!close) {
      e.preventDefault()
      mainWindow.hide()
      return false
    }
  })
  mainWindow.on('closed', () => {
    if (close) mainWindow = null
  })
  mainWindow.setMenu(null)

  const trayIconPath = path.join(__dirname, './assets/weather-cloudy.png')
  tray = new Tray(trayIconPath)
  tray.on('double-click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
    }
  })
  mainWindow.webContents.on('did-finish-load', fetchWeather)
}

app.on('ready', createTray)

app.on('activate', () => {
  if (mainWindow === null) createTray()
})

ipcMain.on('tray-update-data-url', (event, dataUrl) => {
  const url = nativeImage.createFromDataURL(dataUrl)
  url.resize({ width: 16, height: 16 })
  tray.setImage(url)
})
