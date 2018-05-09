import winston from 'winston';

let logger = null;

const OPTIONS = {
  transports: [
    {
      Console: {
        level: 'info',
        colorize: true,
        timestamp: true,
        prettyPrint: process.env.NODE_ENV !== 'production',
      },
    },
  ],
};

const transportMapper = (transportConfigs) => {
  const transportKeys = Object.keys(transportConfigs);

  return transportKeys.map(transportKey =>
    new winston.transports[transportKey](transportConfigs[transportKey]));
};

const loggerInterface = {
  init(config) {
    const options = { ...OPTIONS, ...config };

    let transports = options.transports.map(transportMapper);
    transports = [].concat(...transports);

    logger = new winston.Logger({
      transports,
    });

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
