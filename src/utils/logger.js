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

  const transports = transportKeys.map(transportKey =>
    new winston.transports[transportKey](transportConfigs[transportKey]));

  return [].concat(...transports);
};

const loggerInterface = {
  init(config) {
    const options = { ...OPTIONS, ...config };

    const transports = options.transports.map(transportMapper);

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
