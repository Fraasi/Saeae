const { app, dialog } = require('electron')
const { autoUpdater, CancellationToken } = require("electron-updater")
const log = require('electron-log')
const cancellationToken = new CancellationToken()

/**
 * returns configured autoUpdater
 */
function updater() {

  autoUpdater.logger = log
  autoUpdater.logger.transports.file.level = 'info'
  autoUpdater.allowPrerelease = true // alpha, beta ...
  autoUpdater.autoDownload = false

  log.info('App starting...')

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
              log.info(`update downloaded to ${pathToFile}`)
            })
        }
      })
  })

  autoUpdater.on('update-downloaded', () => {
    autoUpdater.quitAndInstall()
    app.exit()
  })

  autoUpdater.on('error', (err) => {
    log.error('Error in auto-updater. ' + err)
    dialog.showMessageBox({
      type: 'error',
      title: 'Saeae update error',
      message: `Something went wrong, will try again next time app launches`,
      detail: `Log file can be found at ${app.getPath('logs')}`,
      buttons: ['ok'],
    })
  })

  return autoUpdater
}

module.exports.autoUpdater = updater()
