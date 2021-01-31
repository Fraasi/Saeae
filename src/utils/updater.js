const { app, dialog } = require('electron')
const { autoUpdater, CancellationToken } = require("electron-updater")
const { updaterLog, logFilePath } = require('./logger.js')
const cancellationToken = new CancellationToken()

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
      message: `New version found v${version}`,
      detail: `release notes: ${releaseNotes}`,
      buttons: ['download and install', 'cancel'],
    })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.downloadUpdate(cancellationToken)
            .then(pathToFile => {
              updaterLog.info(`update downloaded to ${pathToFile}`)
            })
        }
      })
  })

  autoUpdater.on('update-downloaded', () => {
    autoUpdater.quitAndInstall()
    app.exit()
  })

  autoUpdater.on('error', (err) => {
    // ENOENT: dev-app-update.yml file missing
    // skip update error dialog in developement
    if (err.message.includes('ENOENT')) return
    dialog.showMessageBox({
      type: 'error',
      title: 'Saeae update error',
      message: `Something went wrong, will try again next time app launches`,
      detail: `Log file can be found at ${logFilePath}`,
      buttons: ['ok'],
    })
  })

  return autoUpdater
}

module.exports.autoUpdater = updater()
