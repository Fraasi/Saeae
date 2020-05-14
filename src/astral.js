const { ipcRenderer, shell } = require('electron')
const SunCalc = require('suncalc')
const Store = require('electron-store')
const { phase_hunt } = require('./utils/lune.js')
const resizeWindow = require('./utils/resizeWindow.js')

const store = new Store({ name: 'saeae' })


function getZodiacSign(day, month) {
  if ((month === 1 && day <= 20) || (month === 12 && day >= 22)) return 'Capricorn'
  if ((month === 1 && day >= 21) || (month === 2 && day <= 18)) return 'Aquarius'
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Pisces'
  if ((month === 3 && day >= 21) || (month === 4 && day <= 20)) return 'Aries'
  if ((month === 4 && day >= 21) || (month === 5 && day <= 20)) return 'Taurus'
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini'
  if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) return 'Cancer'
  if ((month === 7 && day >= 23) || (month === 8 && day <= 23)) return 'Leo'
  if ((month === 8 && day >= 24) || (month === 9 && day <= 23)) return 'Virgo'
  if ((month === 9 && day >= 24) || (month === 10 && day <= 23)) return 'Libra'
  if ((month === 10 && day >= 24) || (month === 11 && day <= 22)) return 'Scorpio'
  if ((month === 11 && day >= 23) || (month === 12 && day <= 21)) return 'Sagittarius'
  return 'Zodiac not found'
}

function getData(lat, lon) {
  const date = new Date()
  const day = date.getDate()
  const month = date.getMonth()
  return {
    date,
    illumination: SunCalc.getMoonIllumination(date),
    moonTimes: SunCalc.getMoonTimes(date, lat, lon),
    moonPosition: SunCalc.getMoonPosition(date, lat, lon),
    sunTimes: SunCalc.getTimes(date, lat, lon),
    sunPosition: SunCalc.getPosition(date, lat, lon),
    zodiac: getZodiacSign(day, month + 1),
    luneJS: phase_hunt(date),
  }
}

function getPhase(p) {
  if (p === 0) return 'New Moon'
  if (p < 0.25) return 'Waxing Crescent'
  if (p === 0.25) return 'First Quarter'
  if (p < 0.5) return 'Waxing Gibbous'
  if (p === 0.5) return 'Full Moon'
  if (p < 0.75) return 'Waning Gibbous'
  if (p === 0.75) return 'Last Quarter'
  if (p < 1) return 'Waning Crescent'
  return 'New Moon'
}

function _q(id) {
  return document.querySelector(id)
}

const cityEl = _q('.city')
const time = _q('.time')
const moon = _q('.moon')
const sun = _q('.sun')

time.addEventListener('click', () => {
  shell.openExternal('https://www.timeanddate.com/moon/phases/')
})

function update(err) {
  const city = store.get('weatherCity')
  const latitude = store.get('lat')
  const longitude = store.get('lon')
  const data = getData(latitude, longitude)
  if (err) {
    cityEl.innerHTML = 'Error - '
    time.innerHTML = data.date.toLocaleString('en-GB').slice(0, -3)
    moon.innerHTML = `
    message: ${err.errMsg} <br /> stack: ${err.errStack}
    `
    sun.innerHTML = ''
    return
  }

  cityEl.innerHTML = `${city} - `
  time.innerHTML = data.date.toLocaleString('en-GB').slice(0, -3)

  const { moonPosition, moonTimes, illumination, zodiac, luneJS } = data

  moon.innerHTML = `
    Moon Phase: <span class="ta-right">${getPhase(illumination.phase)}</span> <br />
    Moon Illumination: <span class="ta-right">${(illumination.fraction * 100).toFixed(1)}%</span> <br />
    Moon Azimuth: <span class="ta-right">${(moonPosition.azimuth * 180 / Math.PI + 180).toFixed(1)/* to degrees */}&deg;</span> <br />
    Moon Altitude: <span class="ta-right">${(moonPosition.altitude * 180 / Math.PI).toFixed(1)}&deg;</span> <br />
    Moon Distance: <span class="ta-right">${moonPosition.distance.toFixed(1)} km</span> <br />
    Moonrise: <span class="ta-right">${moonTimes.rise ? moonTimes.rise.toLocaleTimeString('en-GB').slice(0, -3) : 'N/A'}</span> <br />
    Moonset: <span class="ta-right">${moonTimes.set ? moonTimes.set.toLocaleTimeString('en-GB').slice(0, -3) : 'N/A'}</span> <br />
    New Moon: <span class="ta-right">${luneJS.nextnew_date.toLocaleString('en-GB').slice(0, -3)}</span> <br />
    Full Moon <span class="ta-right">${luneJS.full_date.toLocaleString('en-GB').slice(0, -3)}</span> <br />
    Zodiac: <span class="ta-right">${zodiac}</span> <br /><hr />
  `

  const {
    goldenHour, goldenHourEnd, sunriseEnd, sunsetStart, sunrise, sunset, solarNoon,
  } = data.sunTimes
  const sunRisePos = SunCalc.getPosition(sunrise, latitude, longitude)
  const sunSetPos = SunCalc.getPosition(sunset, latitude, longitude)

  sun.innerHTML = `
    GoldenHour AM: <span class="ta-right">${sunriseEnd.toLocaleTimeString('en-GB').slice(0, -3)} - ${goldenHourEnd == 'Invalid Date' ? 'N/A' : goldenHourEnd.toLocaleTimeString('en-GB').slice(0, -3)}</span><br />
    GoldenHour PM: <span class="ta-right">${goldenHour == 'Invalid Date' ? 'N/A' : goldenHour.toLocaleTimeString('en-GB').slice(0, -3)} - ${sunsetStart.toLocaleTimeString('en-GB').slice(0, -3)}</span> <br />
    Sunrise Azimuth: <span class="ta-right">${(sunRisePos.azimuth * 180 / Math.PI + 180).toFixed(1)}&deg;</span><br />
    Sunset Azimuth: <span class="ta-right">${(sunSetPos.azimuth * 180 / Math.PI + 180).toFixed(1)}&deg;</span><br />
    Sun Altitude: <span class="ta-right">${(data.sunPosition.altitude * 180 / Math.PI).toFixed(1)}&deg;</span><br />
    Solar noon: <span class="ta-right">${solarNoon.toLocaleTimeString('en-GB').slice(0, -3)}</span><br />
    Sunrise: <span class="ta-right">${sunrise.toLocaleTimeString('en-GB').slice(0, -3)}</span><br />
    Sunset: <span class="ta-right">${sunset.toLocaleTimeString('en-GB').slice(0, -3)}</span><br />
  `
  resizeWindow()
}

ipcRenderer.on('fetch-error', (sender, err) => { update(err) })
ipcRenderer.on('update-info', () => { update() })
