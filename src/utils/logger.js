import winston from 'winston';

let logger = null;

const OPTIONS = {
  level: 'info',
  colorize: true,
  timestamp: true,
  prettyPrint: process.env.NODE_ENV !== 'production',
};

const loggerInterface = {
  init(config, loggerInstance) {
    if (loggerInstance) {
      logger = loggerInstance;
    } else {
      const options = { ...OPTIONS, ...config };

      logger = new winston.Logger({
        transports: [
          new winston.transports.Console(options),
        ],
      });
    }

    delete loggerInterface.init;
  },

  error(message, meta) {
    return logger.log('error', message, meta);
  },

  info(message, meta) {
    return logger.log('info', message, meta);
  },
};

export default loggerInterface;
