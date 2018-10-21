
export default function createTempImage(num) {
  const hexadecimals = [0x7E, 0x30, 0x6D, 0x79, 0x33, 0x5B, 0x5F, 0x70, 0x7F, 0x7B]
  const canvas = document.createElement('canvas') // memoryleak over time?
  const ctx = canvas.getContext('2d')
  canvas.width = '50'
  canvas.height = '45'
  ctx.fillStyle = 'rgba(0,0,0,0.5)' // black, 0.5 alpha seems about right
  ctx.fillRect(0, 0, 50, 45)
  ctx.scale(0.4, 0.4)
  let minus = false

  function sevenSegment(hex) {
    // A
    roundedRect(10, 10, 40, 8, 5)
    ctx.fillStyle = getColor(hex, 6)
    ctx.fill()
    // B
    roundedRect(47, 15, 8, 40, 5)
    ctx.fillStyle = getColor(hex, 5)
    ctx.fill()
    // C
    roundedRect(47, 55, 8, 40, 5)
    ctx.fillStyle = getColor(hex, 4)
    ctx.fill()
    // D
    roundedRect(10, 92, 40, 8, 5)
    ctx.fillStyle = getColor(hex, 3)
    ctx.fill()
    // E
    roundedRect(5, 55, 8, 40, 5)
    ctx.fillStyle = getColor(hex, 2)
    ctx.fill()
    // F
    roundedRect(5, 15, 8, 40, 5)
    ctx.fillStyle = getColor(hex, 1)
    ctx.fill()
    // G
    roundedRect(10, 50, 40, 8, 5)
    ctx.fillStyle = getColor(hex, 0)
    ctx.fill()
  }

  function roundedRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x, y + radius);
    ctx.lineTo(x, y + height - radius);
    ctx.arcTo(x, y + height, x + radius, y + height, radius);
    ctx.lineTo(x + width - radius, y + height);
    ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
    ctx.lineTo(x + width, y + radius);
    ctx.arcTo(x + width, y, x + width - radius, y, radius);
    ctx.lineTo(x + radius, y);
    ctx.arcTo(x, y, x, y + radius, radius);
  }

  function getColor(hex, shift) {
    let r = minus ? 100 : 255
    let g = minus ? 100 : 45
    let b = minus ? 255 : 0
    let a = ((hex >> shift) & 1) ? 1 : 0.1
    return `rgba(${r}, ${g}, ${b}, ${a})`
  }

  if (num.charAt(0) === '-') {
    minus = true
    num = num.slice(1)
  }

  const nums = num.split('')
  sevenSegment(hexadecimals[nums[1]] ? hexadecimals[nums[0]] : 0x7E)
  ctx.translate(63, 0)
  sevenSegment(hexadecimals[nums[1]] ? hexadecimals[nums[1]] : hexadecimals[nums[0]])

  const dataUrl = canvas.toDataURL()
  canvas.remove()
  return dataUrl
}
