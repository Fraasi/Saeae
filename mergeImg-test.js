const path = require('path')
const mergeImg = require('merge-img')


function updateTrayIcon(numString) {
  if (numString[0] !== '-') numString = `+${numString}`
  if (numString.length === 2) numString = ` ${numString}`
  const numberPaths = numString.split('').map((n) => {
    if (n === '-') {
      return path.join(__dirname, 'src/assets/digits/minus.png')
    } else if (n === '+') {
      return path.join(__dirname, 'src/assets/digits/plus.png')
    } else if (n === ' ') {
      return path.join(__dirname, 'src/assets/digits/empty.png')
    }
    return path.join(__dirname, `src/assets/digits/${n}.png`)
  })
  numberPaths.push(path.join(__dirname, 'src/assets/digits/deg.png'))

  mergeImg(numberPaths, { offset: 10, color: 0x0000ff })
    .then((img) => {
      const numericalIconPath = `./saeae-temperature${numString}.png`
      img.resize(32, 32)
      img.write(numericalIconPath, () => {
        console.log('numericalIconPath', numericalIconPath);
      })
    })
}

updateTrayIcon('26')
updateTrayIcon('-26')

