import { ipcRenderer, shell } from 'electron'
import createTempImage from './assets/create-temp-image'


function parseTime(time) {
  return (time < 10) ? `0${time}` : time
}

function _qs(id) {
  return document.querySelector(id)
}

// get elements
const legend = _qs('.legend')
const weatherEl = _qs('.weather')
const forecast = _qs('.forecast')
const link = _qs('.link')
const bugReport = _qs('.bug-report')
let cityId

forecast.addEventListener('click', () => {
  shell.openExternal(`https://openweathermap.org/city/${cityId}`)
})
link.addEventListener('click', () => {
  shell.openExternal('https://github.com/Fraasi/Saeae/issues')
})

function update(json) {
  const date = new Date()
  const { name, weather, main, sys, wind, id } = json
  cityId = id
  // if error
  if (json.errMsg) {
    legend.innerHTML = ` Error - ${date.toLocaleString('en-GB')}`
    weatherEl.innerHTML = `
      ${json.errText}
      <hr>
      message: ${json.errMsg}<br />
      stack: ${json.errStack}
    `
    forecast.innerHTML = ''
    bugReport.innerHTML = json.bugReport
    link.innerHTML = 'github.com/Fraasi/Saeae/issues'
    return
  }

  legend.innerHTML = `${name} - ${date.toLocaleString('en-GB').slice(0, -3)}`
  weatherEl.innerHTML = `
    ${weather[0].description.charAt(0).toUpperCase() + weather[0].description.slice(1)}<br />
    Temperature: <span class="ta-right">${main.temp.toFixed(1)}°C</span><br />
    Clouds: <span class="ta-right">${json.clouds.all}%</span><br />
    Visibility: <span class="ta-right">${json.visibility ? json.visibility : 'N/A'}m</span><br />
    Humidity: <span class="ta-right">${main.humidity}%</span><br />
    Pressure: <span class="ta-right">${main.pressure}hPa</span><br />
    Wind: <span class="ta-right">${wind.speed}m/s @ ${wind.deg ? wind.deg : 'N/A'}°</span><br />
    Sunrise: <span class="ta-right">${parseTime(new Date(sys.sunrise * 1000).getHours())}:${parseTime(new Date(sys.sunrise * 1000).getMinutes())}</span><br />
    Sunset: <span class="ta-right">${parseTime(new Date(sys.sunset * 1000).getHours())}:${parseTime(new Date(sys.sunset * 1000).getMinutes())}</span>
  `
  bugReport.innerHTML = ''
  link.innerHTML = ''
  forecast.innerHTML = 'Forecast at openweathermap.org'
}


ipcRenderer.on('fetch-error', (sender, err) => {
  console.log('fetchError', err)
  update(err)
})
ipcRenderer.on('update-info', (sender, json) => {
  console.log('json', json)
  const numString = Math.round(json.main.temp).toString()
  const dataUrl = createTempImage(numString)
  ipcRenderer.send('update-tray-data-url', dataUrl)
  update(json)
})


ipcRenderer.on('log', (main, input) => console.log('input', input))
