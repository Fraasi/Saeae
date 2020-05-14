
// from http://myscope.net/taupunkttemperatur/

// Taupunkt Berechnung
module.exports = function taupunkt(t, r) {
  // t = Luft-Temperatur (°C)
  // r = relative Luftfeuchtigkeit (%)
  // Konstante
  // const mw = 18.016; // Molekulargewicht des Wasserdampfes (kg/kmol)
  // const gk = 8214.3; // universelle Gaskonstante (J/(kmol*K))
  // const t0 = 273.15; // Absolute Temperatur von 0 °C (Kelvin)
  // const tk = t + t0; // Temperatur in Kelvin

  let a;
  let b;
  if (t >= 0) {
    a = 7.5;
    b = 237.3;
  } else if (t < 0) {
    a = 7.6;
    b = 240.7;
  }

  // Sättigungsdampfdruck (hPa)
  const sdd = 6.1078 * Math.pow(10, (a * t) / (b + t));

  // Dampfdruck (hPa)
  const dd = sdd * (r / 100);

  // Wasserdampfdichte bzw. absolute Feuchte (g/m3)
  // const af = Math.pow(10, 5) * mw / gk * dd / tk;

  // v-Parameter
  const v = Math.log10(dd / 6.1078);

  // Taupunkttemperatur (°C)
  const td = (b * v) / (a - v);

  // return only dew point
  return td;
}
