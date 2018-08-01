import { ipcRenderer } from 'electron'
import SunCalc from 'suncalc'
import Store from 'electron-store'
import { phase_hunt } from './assets/lune.js'


const store = new Store({ name: 'saeae-city' })

function getZodiacSign(day, month) {
  if ((month === 1 && day <= 20) || (month === 12 && day >= 22)) {
    return 'capricorn';
  } else if ((month === 1 && day >= 21) || (month === 2 && day <= 18)) {
    return 'aquarius';
  } else if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) {
    return 'pisces';
  } else if ((month === 3 && day >= 21) || (month === 4 && day <= 20)) {
    return 'aries';
  } else if ((month === 4 && day >= 21) || (month === 5 && day <= 20)) {
    return 'taurus';
  } else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) {
    return 'gemini';
  } else if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) {
    return 'cancer';
  } else if ((month === 7 && day >= 23) || (month === 8 && day <= 23)) {
    return 'leo';
  } else if ((month === 8 && day >= 24) || (month === 9 && day <= 23)) {
    return 'virgo';
  } else if ((month === 9 && day >= 24) || (month === 10 && day <= 23)) {
    return 'libra';
  } else if ((month === 10 && day >= 24) || (month === 11 && day <= 22)) {
    return 'scorpio';
  } else if ((month === 11 && day >= 23) || (month === 12 && day <= 21)) {
    return 'sagittarius';
  }
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
    luneJS: phase_hunt(new Date(new Date().setMonth(monthFromNow))),
  }
}

function getPhase(p) {
  if (p === 0) return 'New Moon'
  else if (p < 0.25) return 'Waxing Crescent'
  else if (p === 0.25) return 'First Quarter'
  else if (p < 0.5) return 'Waxing Gibbous'
  else if (p === 0.5) return 'Full Moon'
  else if (p < 0.75) return 'Waning Gibbous'
  else if (p === 0.75) return 'Last Quarter'
  else if (p < 1) return 'Waning Crescent'
  return 'New Moon'
}

function update(err) {
  const city = store.get('weatherCity')
  const latitude = store.get('lat')
  const longitude = store.get('lon')
  const data = getData(latitude, longitude)
  if (err) {
    document.querySelector('.legend').innerHTML = ` ${city} - ${data.date.toLocaleString('DE').replace(/\./g, '/')}`

    document.querySelector('.moon').innerHTML = `
    message: ${err.msg} </br> stack: ${err.stack}
    `
    document.querySelector('.sun').innerHTML = ''
    return
  }
  console.log('indexData', data)

  document.querySelector('.legend').innerHTML = ` ${city.charAt(0).toUpperCase() + city.slice(1)} - ${data.date.toLocaleString('DE').replace(/\./g, '/')}`

  const { moonPosition, moonTimes, illumination, zodiac } = data
  document.querySelector('.moon').innerHTML = `
Moon Phase: ${getPhase(data.illumination.phase)} </br>
Moon Illumination: ${(illumination.fraction * 100).toFixed(1)}% </br>
Moon Azimuth: ${(moonPosition.azimuth * 180 / Math.PI + 180).toFixed(1)/* to degrees */}&deg; </br>
Moon Altitude: ${(moonPosition.altitude * 180 / Math.PI).toFixed(1)}&deg; </br>
Moon Distance: ${moonPosition.distance.toFixed(1)} km </br>
Moonrise: ${moonTimes.rise ? moonTimes.rise.toLocaleTimeString('DE') : 'N/A'} <br />
Moonset: ${moonTimes.set ? moonTimes.set.toLocaleTimeString('DE') : 'N/A'} <br />
New Moon: ${data.luneJS.new_date.toLocaleString('DE').replace(/\./g, '/')} </br>
Full Moon ${data.luneJS.full_date.toLocaleString('DE').replace(/\./g, '/')} </br>
Zodiac: ${zodiac} </br>
`

  const {
    goldenHour, goldenHourEnd, sunriseEnd, sunsetStart, sunrise, sunset,
  } = data.sunTimes
  const sunRisePos = SunCalc.getPosition(sunrise, latitude, longitude)
  const sunSetPos = SunCalc.getPosition(sunset, latitude, longitude)

  document.querySelector('.sun').innerHTML = `
GoldenHour AM: ${sunriseEnd.toLocaleTimeString('DE')} - ${goldenHourEnd.toLocaleTimeString('DE')}<br />
GoldenHour PM: ${goldenHour.toLocaleTimeString('DE')} - ${sunsetStart.toLocaleTimeString('DE')} <br />
Sunrise Azimuth: ${(sunRisePos.azimuth * 180 / Math.PI + 180).toFixed(1)}&deg;</br>
Sunset Azimuth: ${(sunSetPos.azimuth * 180 / Math.PI + 180).toFixed(1)}&deg;</br>
Sun Altitude: ${(data.sunPosition.altitude * 180 / Math.PI).toFixed(1)}&deg; </br>
Sunrise: ${sunrise.toLocaleTimeString('DE')} <br />
Sunset: ${sunset.toLocaleTimeString('DE')} <br />
`
}

ipcRenderer.on('intervalUpdate', (sender, msg) => {
  console.log('intervalUpdate', sender, msg)
  update()
})
ipcRenderer.on('fetchError', (sender, err) => {
  console.log('fetchError', err)
  update(err)
})

update()
