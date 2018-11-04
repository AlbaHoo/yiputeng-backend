var winston = require('winston');

// single logger instance internally
var logger = winston.createLogger();

logger.add(new winston.transports.Console({
  format: winston.format.simple()
}));

function Logger(fileName) {
  this.fileName = fileName;
}

Logger.prototype.log = function (level, message, data, callback) {
  logger.log(level, message, data, callback || function () {});
};

['debug', 'info', 'warn', 'error'].forEach(function (level) {
  Logger.prototype[level] = function (message, data, callback) {
    this.log(level, message, data, callback);
  };
});

module.exports = Logger;

