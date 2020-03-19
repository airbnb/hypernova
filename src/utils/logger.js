import winston from 'winston';

let logger = null;

const OPTIONS = {
  level: 'info',
  colorize: true,
  timestamp: true,
  prettyPrint: process.env.NODE_ENV !== 'production',
};

function convertOptionsToWinstonV3(opts) {
  const newOpts = {};
  const formatArray = [];
  const formatOptions = {
    stringify: () => winston.format((info) => { info.message = JSON.stringify(info.message); })(), // eslint-disable-line
    formatter: () => winston.format(
      (info) => { info.message = opts.formatter(Object.assign(info, opts)); })(), // eslint-disable-line
    json: () => winston.format.json(),
    raw: () => winston.format.json(),
    label: () => winston.format.label(opts.label),
    logstash: () => winston.format.logstash(),
    prettyPrint: () => winston.format.prettyPrint({ depth: opts.depth || 2 }),
    colorize: () => winston.format.colorize({
      level: opts.colorize === true || opts.colorize === 'level',
      all: opts.colorize === 'all',
      message: opts.colorize === 'message',
    }),
    timestamp: () => winston.format.timestamp(),
    align: () => winston.format.align(),
    showLevel: () => winston.format((info) => { info.message = `${info.level}: ${info.message}`; })(), // eslint-disable-line
  };
  Object.keys(opts)
    .filter(k => !Object.keys(formatOptions).includes(k))
    .forEach((k) => { newOpts[k] = opts[k]; });
  Object.keys(opts)
    .filter(k => Object.keys(formatOptions).includes(k) && formatOptions[k])
    .forEach(k => formatArray.push(formatOptions[k]()));
  newOpts.format = winston.format.combine(...formatArray);
  return newOpts;
}

const loggerInterface = {
  init(config, loggerInstance) {
    if (loggerInstance) {
      logger = loggerInstance;
    } else {
      const options = { ...OPTIONS, ...config };

      logger = winston.createLogger({
        transports: [
          new winston.transports.Console(convertOptionsToWinstonV3(options)),
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
