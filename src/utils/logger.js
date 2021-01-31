const electronLog  = require('electron-log')


const updaterLog = electronLog.create('updaterLog')
updaterLog.variables.updater = 'auto-updater'
updaterLog.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] ({updater}) {text}'
updaterLog.transports.file.level = 'info'
updaterLog.catchErrors({ showDialog: false })

const mainLog = electronLog.create('mainLog')
mainLog.variables.main = 'main'
mainLog.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] ({main}) {text}'
mainLog.transports.file.level = 'info'
mainLog.catchErrors({ showDialog: false })

const logFilePath = mainLog.transports.file.getFile().path


module.exports = {
  updaterLog,
  mainLog,
  logFilePath
}
