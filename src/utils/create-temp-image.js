
export default function createTempImage(num) {
  let ctx
  let minus = false

  if (num.charAt(0) === '-') {
    num = num.slice(1)
    minus = true
  }
  if (num.length === 1) num = `0${num}`

  function _getColor() {
    let r = minus ? 100 : 255
    let g = minus ? 100 : 50
    let b = minus ? 255 : 50
    return `rgba(${r}, ${g}, ${b}, 1)`
  }

  const canvas = document.createElement('canvas')
  ctx = canvas.getContext('2d')
  canvas.width = '32'
  canvas.height = '32'
  // ctx.fillStyle = 'rgba(0,0,0,0)' // no need for bg anymore
  // ctx.fillRect(0, 0, 32, 32)


  // ctx.font = '38px Inconsolata' // best
  // ctx.font = '38px Arial' // äää
  // ctx.font = '38px Courier' // ok
  // ctx.font = '38px Consolas' // ok
  ctx.font = '38px Segoe UI' //

  ctx.shadowColor = 'black'
  ctx.shadowBlur = 4
  ctx.strokeStyle = 'white'
  ctx.lineWidth = 1 // 0 total shit, 2 a bit too much
  ctx.fillStyle = _getColor()
  ctx.strokeText(`${num}\xB0`, 1, 27, 32)
  ctx.fillText(`${num}\xB0`, 1, 27, 32)

  const dataUrl = canvas.toDataURL()
  canvas.remove()
  return dataUrl
}
