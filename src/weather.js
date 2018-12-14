import { ipcRenderer, shell } from 'electron'
// import Store from 'electron-store'
import createTempImage from './assets/create-temp-image'

// const store = new Store({ name: 'saeae' })


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

  legend.innerHTML = ` ${name} - ${date.toLocaleString('en-GB')}`
  weatherEl.innerHTML = `
    &#128712; &#8505; and &#9432; &#x1F6C8</br>
    ${weather[0].description.charAt(0).toUpperCase() + weather[0].description.slice(1)}<br />
    Temperature: ${main.temp.toFixed(1)}°C<br />
    Clouds: ${json.clouds.all}%<br />
    Visibility: ${json.visibility}m<br />
    Humidity: ${main.humidity}%<br />
    Pressure: ${main.pressure} hPa<br />
    Wind: ${wind.speed} m/s @ ${wind.deg}°<br />
    Sunrise: ${parseTime(new Date(sys.sunrise * 1000).getHours())}:${parseTime(new Date(sys.sunrise * 1000).getMinutes())}<br />
    Sunset: ${parseTime(new Date(sys.sunset * 1000).getHours())}:${parseTime(new Date(sys.sunset * 1000).getMinutes())}
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
  console.log('json', json);
  const numString = Math.round(json.main.temp).toString()
  const dataUrl = createTempImage(numString)
  ipcRenderer.send('update-tray-data-url', dataUrl)
  update(json)
})


ipcRenderer.on('log', (main, input) => console.log('input', input))
