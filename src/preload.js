
global.saeae = window.saeae = {

}
console.log('saeae:', window.saeae)

// const customTitlebar = require('custom-electron-titlebar');


// window.addEventListener('DOMContentLoaded', () => {
//   new customTitlebar.Titlebar({
//     backgroundColor: customTitlebar.Color.fromHex('#2f3241'),
//   });

//   const replaceText = (selector, text) => {
//     const element = document.getElementById(selector)
//     if (element) element.innerText = text
//   }

//   for (const type of ['chrome', 'node', 'electron']) {
//     replaceText(`${type}-version`, process.versions[type])
//   }
// })

//   contextBridge only works when contextIsolation: true,
// but breaks nodeIntegration: true from working
// const {
//   contextBridge,
//   ipcRenderer
// } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
// contextBridge.exposeInMainWorld(
//   "api", {
//       send: (channel, data) => {
//           // whitelist channels
//           let validChannels = ["toMain"];
//           if (validChannels.includes(channel)) {
//               ipcRenderer.send(channel, data);
//           }
//       },
//       receive: (channel, func) => {
//           let validChannels = ["fromMain"];
//           if (validChannels.includes(channel)) {
//               // Deliberately strip event as it includes `sender`
//               ipcRenderer.on(channel, (event, ...args) => func(...args));
//           }
//       },
//   },
// )
