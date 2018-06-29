import { app, Menu, Tray, shell } from 'electron'
import path from 'path'
import mergeImg from 'merge-img'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config()

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit()
}

let mainWindow
let tray = null
const city = 'tampere'

function parseTime(time) {
  return (time < 10) ? `0${time}` : time
}

function buildContextMenu(json) {
  const contextMenu = Menu.buildFromTemplate([
    { label: `${json.name} weather` },
    { label: `${json.weather[0].description}` },
    { label: `Clouds: ${json.clouds.all}%` },
    { label: `Visibility: ${json.visibility}m` },
    { label: `Humidity: ${json.main.humidity}%` },
    { label: `Pressure: ${json.main.pressure} hPa` },
    { label: `Wind: ${json.wind.speed} m/s @ ${json.wind.deg}°` },
    { label: `Sunrise: ${parseTime(new Date(json.sys.sunrise * 1000).getHours())}:${parseTime(new Date(json.sys.sunrise * 1000).getMinutes())}` },
    { label: `Sunset: ${parseTime(new Date(json.sys.sunset * 1000).getHours())}:${parseTime(new Date(json.sys.sunset * 1000).getMinutes())}` },
    {
      label: 'Data from openweathermap.org',
      click() {
        shell.openExternal(`https://openweathermap.org/city/${city}`)
      },
    },
    {
      label: 'Sää authored by Fraasi',
      click() {
        shell.openExternal('https://github.com/Fraasi')
      },
    },
    {
      label: 'Quit app',
      click() {
        tray.destroy()
        app.quit()
      },
    },
  ])
  tray.setContextMenu(contextMenu)
}

function updateTrayIcon(numString) {
  const numberPaths = numString.split('')
    .map((n) => {
      if (n === '-') {
        return path.join(__dirname, 'assets/numbers/minus.png')
      }
      return path.join(__dirname, `assets/numbers/${n}.png`)
    })
  numberPaths.push(path.join(__dirname, 'assets/numbers/deg.png'))

  mergeImg(numberPaths, { margin: '0 5 0 0' })
    .then((img) => {
      const numericalIcon = path.join(__dirname, 'assets/numerical-icon.png')
      img.write(numericalIcon, () => {
        tray.setImage(numericalIcon)
      })
    })
}

function fetchWeather() {
  const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.OPENWEATHER_APIKEY}&units=metric`
  fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error('404')
      return response.json()
    })
    .then((json) => {
      updateTrayIcon(Math.round(json.main.temp).toString())
      buildContextMenu(json)
    })
    .catch((err) => {
      const contextMenu = Menu.buildFromTemplate([
        { label: 'Bad Weather at the intertubes' },
        { label: 'Something went terribly wrong fetching weather data' },
        { label: err.message },
        { label: 'Try restarting the app and/or check your internet connection' },
        {
          label: 'You can file a bug report at github.com/Fraasi/Saeae',
          click() {
            shell.openExternal('https://github.com/Fraasi/Saeae')
          },
        },
        {
          label: 'Quit app',
          click() {
            tray.destroy()
            app.quit()
          },
        },
      ])
      tray.setContextMenu(contextMenu)
      tray.setToolTip('Bad weather, rigth click for more info')
      const badWeather = path.join(__dirname, 'assets/weather-downpour.png')
      tray.setImage(badWeather)
    })
}

function createTray() {
  // save for debugging
  // mainWindow = new BrowserWindow({
  // width: 800,
  // height: 600,
  // })
  // mainWindow.loadURL(`file://${__dirname}/index.html`)
  // mainWindow.webContents.openDevTools()
  // mainWindow.on('closed', () => {
  // mainWindow = null
  // })

  const trayIconPath = path.join(__dirname, './assets/weather-cloudy.png')
  tray = new Tray(trayIconPath)
  tray.setToolTip('Sää')
  setTimeout(() => {
    fetchWeather()
  }, 1000)
}

app.on('ready', createTray)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createTray()
  }
});
