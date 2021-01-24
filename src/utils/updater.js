const { app, dialog } = require('electron')
const { autoUpdater } = require("electron-updater")
const log = require('electron-log')


/**
 * returns configured autoUpdater
 */
function updater() {

  autoUpdater.logger = log
  autoUpdater.logger.transports.file.level = 'info'
  autoUpdater.allowPrerelease = true // alpha, beta ...
  autoUpdater.autoDownload = false

  log.info('App starting...')

  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...')
  })

  autoUpdater.on('update-available', (releaseInfo) => {
    const { version, releaseNotes, releaseName, releaseDate } = releaseInfo
    log.info(`Update available: ${releaseName + version + releaseDate}`, releaseNotes)
    dialog.showMessageBox({
      type: 'info',
      title: 'Saeae update',
      message: `New version found v${version}`,
      detail: `release notes: ${releaseNotes}`,
      buttons: ['download & install', 'cancel'],
    })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.downloadUpdate('cancelToken')
            .then(pathToFile => {
              log.info(`update downloaded to ${pathToFile}`)
            })
        }
      })
  })

  autoUpdater.on('update-not-available', () => {
    log.info('Update not available.')
  })

  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%'
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')'
    log.info(log_message)
  })

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded', info)
    autoUpdater.quitAndInstall()
  })

  autoUpdater.on('error', (err) => {
    log.error('Error in auto-updater. ' + err)
    dialog.showMessageBox({
      type: 'error',
      title: 'Saeae update error',
      message: `Something went wrong updating Saeae`,
      detail: `Log file can be found at ${app.getAppPath()}`,
      buttons: ['ok'],
    })
  })

  return autoUpdater
}

module.exports.autoUpdater = updater()
