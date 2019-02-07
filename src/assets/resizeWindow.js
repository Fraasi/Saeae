import { remote } from 'electron'
import Positioner from 'electron-positioner'

export default function resizeWindow() {
  const padding = 18 // title bar height without menu
  const heightDiff = (document.body.clientHeight - document.documentElement.clientHeight) + padding
  window.resizeBy(0, heightDiff)
  const position = new Positioner(remote.getCurrentWindow())
  position.move('bottomRight')
}
