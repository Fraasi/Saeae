const { ipcRenderer } = require('electron')

ipcRenderer.on('eee', (event, msg) => {
  console.log('eee', event, msg)
})
