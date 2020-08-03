const winston = require('winston');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});


function Logger (file) {
  this.file = file;
  this.logger = winston.createLogger({
    level: 'info',
    format: combine(
      format.splat(),
      label({label: file}),
      timestamp(),
      myFormat
    ),
    defaultMeta: { service: 'user-service' },
    transports: [
      //
      // - Write all logs with level `error` and below to `error.log`
      // - Write all logs with level `info` and below to `combined.log`
      //
      new transports.File({ filename: './log/error.log', level: 'error' }),
      new transports.File({ filename: './log/combined.log' }),
    ],
  });
  //
  // If we're not in production then log to the `console` with the format:
  // `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
  //
  if (process.env.NODE_ENV !== 'production') {
    this.logger.add(new transports.Console({
      format: combine(
        format.splat(),
        label({label: file}),
        timestamp(),
        myFormat
      ),
    }));
  }
}

['debug', 'info', 'warn', 'error'].forEach(function (level) {
  Logger.prototype[level] = function (message, data) {
    this.logger.log(level, message + ': %s', data ? JSON.stringify(data) : '');
  };
});



module.exports = Logger;
