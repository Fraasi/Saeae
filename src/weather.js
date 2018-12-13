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

function update(json) {
  const date = new Date()
  const { name, weather, main, sys, wind, id } = json

  // if error
  if (json.errMsg) {
    _qs('.legend').innerHTML = ` Error - ${date.toLocaleString('DE').replace(/\./g, '/')}`

    _qs('.weather').innerHTML = `
      ${json.errText}
      <hr>
      message: ${json.errMsg}<br />
      stack: ${json.errStack}
    `

    _qs('.forecast').innerHTML = json.bugReport
    _qs('.link').innerHTML = 'github.com/Fraasi/Saeae/issues'
    _qs('.link').addEventListener('click', () => {
      console.log('link clicked');
      shell.openExternal('github.com/Fraasi/Saeae/issues')
    })
    return
  }

  _qs('.legend').innerHTML = ` ${name} - ${date.toLocaleString('DE').replace(/\./g, '/')}`

  _qs('.weather').innerHTML = `
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

  _qs('.forecast').innerHTML = 'Forecast at openweathermap.org'
  _qs('.forecast').addEventListener('click', () => {
    shell.openExternal(`https://openweathermap.org/city/${id}`)
  })
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
