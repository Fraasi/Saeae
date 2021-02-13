const { dialog, shell } = require('electron')
const { autoUpdater } = require("electron-updater")
const { updaterLog, logFilePath } = require('./logger.js')

/**
 * returns configured autoUpdater
 */
function updater() {

  autoUpdater.logger = updaterLog
  autoUpdater.allowPrerelease = true // alpha, beta ...
  autoUpdater.autoDownload = false

  autoUpdater.on('update-available', (releaseInfo) => {
    const { version, releaseNotes } = releaseInfo
    dialog.showMessageBox({
      type: 'info',
      title: 'Saeae update',
      message: `New version found: v${version}`,
      detail: `${releaseNotes.replace(/<[a-z0-9 /"=*]+>/g, '')}`,
      buttons: ['Take me to downloads', 'Cancel'],
    })
      .then(({ response }) => {
        if (response === 0) {
          shell.openExternal('https://github.com/Fraasi/Saeae/releases')
        }
      })
  })

  autoUpdater.on('error', (err) => {
    // ENOENT: dev-app-update.yml file missing
    // skip update error dialog in developement
    if (err.message.includes('ENOENT')) return
    dialog.showMessageBox({
      type: 'error',
      title: 'Saeae update error',
      message: `Something went wrong fetching update info, will try again next time app launches`,
      detail: `Log file can be found at ${logFilePath}`,
      buttons: ['ok'],
    })
  })

  return autoUpdater
}

module.exports.autoUpdater = updater()
