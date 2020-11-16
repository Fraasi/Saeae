export default function resizeWindow() {
  const contentEl = document.querySelector('#bg-radial')
  const contentHeight = contentEl.clientHeight
  const contentWidth = contentEl.clientWidth
  const titlebarHeight = 30
  const margs = 8 * 2
  const newHeight = contentHeight + titlebarHeight + margs
  window.resizeTo(contentWidth + margs, newHeight)
}
