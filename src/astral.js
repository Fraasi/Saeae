import resizeWindow from './utils/resizeWindow.js'
const {
  SunCalc,
  phase_hunt,
  ipcSend,
  ipcOn,
  openExternal,
} = window.api
console.log('astral api:', window.api)
window.resizeWindow = resizeWindow


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

function getDayLength(milliseconds) {
  const totalMinutes = Math.round(milliseconds / 1000 / 60)
  const minutes = totalMinutes % 60
  const hours = Math.trunc(totalMinutes / 60)
  return `${hours}h ${minutes}min`
}

const cityEl = _q('.city')
const timeEl = _q('.time')
const moonEl = _q('.moon')
const sunEl = _q('.sun')

cityEl.addEventListener('click', () => {
  ipcSend('prompt-city')
})
timeEl.addEventListener('click', () => {
  openExternal('https://www.timeanddate.com/moon/phases/')
})

function update(json) {
  const { name: cityName, coord: { lat, lon } } = json
  const data = getData(lat, lon)
  console.log('data:', data, 'json:', json)

  if (json && json.errMsg) {
    cityEl.innerHTML = 'Error - '
    timeEl.innerHTML = data.date.toLocaleString('en-GB').slice(0, -3)
    moonEl.innerHTML = `
    message: ${json.errMsg} <br /> stack: ${json.errStack}
    `
    sunEl.innerHTML = ''
    return
  }

  cityEl.innerHTML = `${cityName} - `
  timeEl.innerHTML = data.date.toLocaleString('en-GB').slice(0, -3)

  const { moonPosition, moonTimes, illumination, zodiac, luneJS } = data

  moonEl.innerHTML = `
    Moon Phase: <span class="float-right">${getPhase(illumination.phase)}</span> <br />
    Moon Illumination: <span class="float-right">${(illumination.fraction * 100).toFixed(1)}%</span> <br />
    Moon Azimuth: <span class="float-right">${(moonPosition.azimuth * 180 / Math.PI + 180).toFixed(1)/* to degrees */}&deg;</span> <br />
    Moon Altitude: <span class="float-right">${(moonPosition.altitude * 180 / Math.PI).toFixed(1)}&deg;</span> <br />
    Moon Distance: <span class="float-right">${moonPosition.distance.toFixed(1)} km</span> <br />
    Moonrise: <span class="float-right">${moonTimes.rise ? moonTimes.rise.toLocaleTimeString('en-GB').slice(0, -3) : 'N/A'}</span> <br />
    Moonset: <span class="float-right">${moonTimes.set ? moonTimes.set.toLocaleTimeString('en-GB').slice(0, -3) : 'N/A'}</span> <br />
    New Moon: <span class="float-right">${luneJS.nextnew_date.toLocaleString('en-GB').slice(0, -3)}</span> <br />
    Full Moon <span class="float-right">${luneJS.full_date.toLocaleString('en-GB').slice(0, -3)}</span> <br />
    Zodiac: <span class="float-right">${zodiac}</span>
  `

  const {
    goldenHour, goldenHourEnd, sunriseEnd, sunsetStart, sunrise, sunset, solarNoon,
  } = data.sunTimes
  const sunRisePos = SunCalc.getPosition(sunrise, lat, lon)
  const sunSetPos = SunCalc.getPosition(sunset, lat, lon)

  sunEl.innerHTML = `
    GoldenHour AM: <span class="float-right">${sunriseEnd.toLocaleTimeString('en-GB').slice(0, -3)} - ${goldenHourEnd == 'Invalid Date' ? 'N/A' : goldenHourEnd.toLocaleTimeString('en-GB').slice(0, -3)}</span><br />
    GoldenHour PM: <span class="float-right">${goldenHour == 'Invalid Date' ? 'N/A' : goldenHour.toLocaleTimeString('en-GB').slice(0, -3)} - ${sunsetStart.toLocaleTimeString('en-GB').slice(0, -3)}</span> <br />
    Sunrise Azimuth: <span class="float-right">${(sunRisePos.azimuth * 180 / Math.PI + 180).toFixed(1)}&deg;</span><br />
    Sunset Azimuth: <span class="float-right">${(sunSetPos.azimuth * 180 / Math.PI + 180).toFixed(1)}&deg;</span><br />
    Sun Altitude: <span class="float-right">${(data.sunPosition.altitude * 180 / Math.PI).toFixed(1)}&deg;</span><br />
    Solar noon: <span class="float-right">${solarNoon.toLocaleTimeString('en-GB').slice(0, -3)}</span><br />
    Sunrise: <span class="float-right">${sunrise.toLocaleTimeString('en-GB').slice(0, -3)}</span><br />
    Sunset: <span class="float-right">${sunset.toLocaleTimeString('en-GB').slice(0, -3)}</span><br />
    Daylength: <span class="float-right">${getDayLength(sunset - sunrise)}</span><br />
  `
  resizeWindow()
}

ipcOn('fetch-error', (sender, err) => { update(err) })
ipcOn('update-info', (sender, json) => { if (json) update(json) })
