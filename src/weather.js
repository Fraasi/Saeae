import createTempImage from './utils/create-temp-image.js'
import taupunkt from './utils/taupunkt.js'
import resizeWindow from './utils/resizeWindow.js'
const {
  ipcOn,
  ipcSend,
  openExternal,
} = window.api
console.log('api:', window.api)

function parseTime(time) {
  return (time < 10) ? `0${time}` : time
}

function _qs(id) {
  return document.querySelector(id)
}

const cityEl = _qs('.city')
const timeEl = _qs('.time')
const weatherEl = _qs('.weather')
const githubEl = _qs('.github')
let cityId

cityEl.addEventListener('click', () => {
  ipcSend('prompt-city')
})
timeEl.addEventListener('click', () => {
  openExternal(`https://openweathermap.org/city/${cityId}`)
})
githubEl.addEventListener('click', () => {
  openExternal('https://github.com/Fraasi/Saeae/issues')
})

function update(json) {
  const date = new Date().toLocaleString('en-GB').slice(0, -3)
  const { name: cityName, weather, main, sys, wind, id } = json
  cityId = id

  if (json.errMsg) {
    cityEl.innerHTML = 'Error - '
    timeEl.innerHTML = date
    weatherEl.innerHTML = `
      ${json.errText}
      <hr>
      ${json.errStack}
      <hr>
      ${json.bugReport}
      `
    githubEl.style.display = 'inline-grid'
    githubEl.innerHTML = 'github.com/Fraasi/Saeae/issues'
    return
  }

  cityEl.innerHTML = `${cityName} - `
  timeEl.innerHTML = date
  weatherEl.innerHTML = `
    ${weather[0].description.charAt(0).toUpperCase() + weather[0].description.slice(1)}<br />
    Temperature: <span class="ta-right">${main.temp.toFixed(1)}°C</span><br />
    Clouds: <span class="ta-right">${json.clouds.all}%</span><br />
    Visibility: <span class="ta-right">${json.visibility ? json.visibility : 'N/A'}m</span><br />
    Humidity: <span class="ta-right">${main.humidity}%</span><br />
    Dew point: <span class="ta-right">${Math.round(taupunkt(main.temp, main.humidity))}°C</span><br />
    Pressure: <span class="ta-right">${main.pressure}hPa</span><br />
    Wind: <span class="ta-right">${wind.speed}m/s @ ${wind.deg ? wind.deg : 'N/A'}°</span><br />
    Sunrise: <span class="ta-right">${parseTime(new Date(sys.sunrise * 1000).getHours())}:${parseTime(new Date(sys.sunrise * 1000).getMinutes())}</span><br />
    Sunset: <span class="ta-right">${parseTime(new Date(sys.sunset * 1000).getHours())}:${parseTime(new Date(sys.sunset * 1000).getMinutes())}</span>
  `
  githubEl.innerHTML = ''
  githubEl.style.display = 'none'
  resizeWindow()
}

ipcOn('fetch-error', (sender, err) => {
  console.log('err:', err)
  update(err)
})

ipcOn('update-info', (sender, json) => {
  console.log('json:', json)
  const numString = Math.round(json.main.temp).toString()
  const dataUrl = createTempImage(numString)
  ipcSend('update-tray-data-url', dataUrl)
  update(json)
})

ipcOn('debug-log', (sender, data) => {
  console.log('debug-log:', JSON.parse(data))
})
