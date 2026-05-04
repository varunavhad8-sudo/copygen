const winston = require('winston');
const path = require('path');

/**
 * Structured Logger using Winston.
 * Logs to console and files (errors only and combined).
 */
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'copygen-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Only add file logging if explicitly requested (e.g., local debugging)
if (process.env.WRITE_LOGS_TO_FILE === 'true') {
  logger.add(new winston.transports.File({ 
    filename: path.join(__dirname, '../logs/error.log'), 
    level: 'error' 
  }));
  logger.add(new winston.transports.File({ 
    filename: path.join(__dirname, '../logs/combined.log') 
  }));
}

module.exports = logger;
