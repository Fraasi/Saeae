const {
  contextBridge,
  ipcRenderer,
  shell,
} = require("electron");
const customTitlebar = require('custom-electron-titlebar');

window.addEventListener('DOMContentLoaded', () => {
  new customTitlebar.Titlebar({
    backgroundColor: customTitlebar.Color.fromHex('#444'),
    icon: 'images/weather-cloudy-black.png',
    maximizable: false,
    titleHorizontalAlignment: 'left',
    menu: null
  })
})

// contextBridge only works when contextIsolation: true,
// but breaks nodeIntegration: true from working
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  "api", {
  ipcSend: (channel, data) => {
    let validChannels = ['fetch-error', 'update-info', 'prompt-city', 'update-tray-data-url']
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data)
    }
  },
  ipcOn: (channel, func) => {
    let validChannels = ['fetch-error', 'update-info']
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (...args) => func(...args))
    }
  },
  openExternal: (link) => {
    shell.openExternal(link)
  },
}
)
