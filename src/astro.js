import { ipcRenderer } from 'electron'
import SunCalc from 'suncalc'
import Store from 'electron-store'
import { phase_hunt } from './assets/lune.js'

const store = new Store({ name: 'saeae' })


function getZodiacSign(day, month) {
  if ((month === 1 && day <= 20) || (month === 12 && day >= 22)) return 'capricorn'
  if ((month === 1 && day >= 21) || (month === 2 && day <= 18)) return 'aquarius'
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'pisces'
  if ((month === 3 && day >= 21) || (month === 4 && day <= 20)) return 'aries'
  if ((month === 4 && day >= 21) || (month === 5 && day <= 20)) return 'taurus'
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'gemini'
  if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) return 'cancer'
  if ((month === 7 && day >= 23) || (month === 8 && day <= 23)) return 'leo'
  if ((month === 8 && day >= 24) || (month === 9 && day <= 23)) return 'virgo'
  if ((month === 9 && day >= 24) || (month === 10 && day <= 23)) return 'libra'
  if ((month === 10 && day >= 24) || (month === 11 && day <= 22)) return 'scorpio'
  if ((month === 11 && day >= 23) || (month === 12 && day <= 21)) return 'sagittarius'
  return 'zodiac not found'
}

function getData(lat, lon) {
  const date = new Date()
  const day = date.getDate()
  const monthFromNow = date.getMonth() + 1

  return {
    date,
    illumination: SunCalc.getMoonIllumination(date),
    moonTimes: SunCalc.getMoonTimes(date, lat, lon),
    moonPosition: SunCalc.getMoonPosition(date, lat, lon),
    sunTimes: SunCalc.getTimes(date, lat, lon),
    sunPosition: SunCalc.getPosition(date, lat, lon),
    zodiac: getZodiacSign(day, monthFromNow),
    luneJS: phase_hunt(new Date(new Date().setMonth(monthFromNow - 1))),
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

function update(err) {
  const city = store.get('weatherCity')
  const latitude = store.get('lat')
  const longitude = store.get('lon')
  const data = getData(latitude, longitude)
  if (err) {
    document.querySelector('.legend').innerHTML = `Error - ${data.date.toLocaleString('en-GB')}`

    document.querySelector('.moon').innerHTML = `
    message: ${err.errMsg} </br> stack: ${err.errStack}
    `
    document.querySelector('.sun').innerHTML = ''
    return
  }
  console.log('indexData', data)

  document.querySelector('.legend').innerHTML = `${city} - ${data.date.toLocaleString('en-GB')}`

  const { moonPosition, moonTimes, illumination, zodiac } = data
  document.querySelector('.moon').innerHTML = `
    Moon Phase: ${getPhase(data.illumination.phase)} </br>
    Moon Illumination: ${(illumination.fraction * 100).toFixed(1)}% </br>
    Moon Azimuth: ${(moonPosition.azimuth * 180 / Math.PI + 180).toFixed(1)/* to degrees */}&deg; </br>
    Moon Altitude: ${(moonPosition.altitude * 180 / Math.PI).toFixed(1)}&deg; </br>
    Moon Distance: ${moonPosition.distance.toFixed(1)} km </br>
    Moonrise: ${moonTimes.rise ? moonTimes.rise.toLocaleTimeString('DE') : 'N/A'} <br />
    Moonset: ${moonTimes.set ? moonTimes.set.toLocaleTimeString('DE') : 'N/A'} <br />
    New Moon: ${data.luneJS.new_date.toLocaleString('en-GB')} </br>
    Full Moon ${data.luneJS.full_date.toLocaleString('en-GB')} </br>
    Zodiac: ${zodiac} </br>
  `

  const {
    goldenHour, goldenHourEnd, sunriseEnd, sunsetStart, sunrise, sunset,
  } = data.sunTimes
  const sunRisePos = SunCalc.getPosition(sunrise, latitude, longitude)
  const sunSetPos = SunCalc.getPosition(sunset, latitude, longitude)

  document.querySelector('.sun').innerHTML = `
    GoldenHour AM: ${sunriseEnd.toLocaleTimeString('en-GB')} - ${goldenHourEnd.toLocaleTimeString('en-GB')}<br />
    GoldenHour PM: ${goldenHour.toLocaleTimeString('en-GB')} - ${sunsetStart.toLocaleTimeString('en-GB')} <br />
    Sunrise Azimuth: ${(sunRisePos.azimuth * 180 / Math.PI + 180).toFixed(1)}&deg;</br>
    Sunset Azimuth: ${(sunSetPos.azimuth * 180 / Math.PI + 180).toFixed(1)}&deg;</br>
    Sun Altitude: ${(data.sunPosition.altitude * 180 / Math.PI).toFixed(1)}&deg; </br>
    Sunrise: ${sunrise.toLocaleTimeString('en-GB')} <br />
    Sunset: ${sunset.toLocaleTimeString('en-GB')} <br />
  `
}

ipcRenderer.on('fetch-error', (sender, err) => { update(err) })
ipcRenderer.on('update-info', () => { update() })
