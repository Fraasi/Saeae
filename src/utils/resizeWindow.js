export default function resizeWindow() {
  const contentEl = document.querySelector('#bg-radial')
  const contentHeight = contentEl.clientHeight
  // const contentWidth = contentEl.clientWidth
  const titlebarHeight = 30
  const margs = 9 * 2
  const newHeight = contentHeight + titlebarHeight + margs
  window.resizeTo(330, newHeight)
}
