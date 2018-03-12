import bodyParser from 'body-parser';

import './environment';
import logger from './utils/logger';
import renderBatch from './utils/renderBatch';
import { runAppLifecycle, errorSync, raceTo } from './utils/lifecycle';
import BatchManager from './utils/BatchManager';

const attachMiddleware = (app, config) => {
  app.use(bodyParser.json(config.bodyParser));
};

const attachEndpoint = (app, config, callback) => {
  app.post(config.endpoint, renderBatch(config, callback));
};

function exit(code) {
  return () => process.exit(code);
}

class Server {
  constructor(app, config, callback) {
    this.server = null;
    this.app = app;
    this.config = config;
    this.callback = callback;

    this.closing = false;

    this.close = this.close.bind(this);
    this.errorHandler = this.errorHandler.bind(this);
    this.shutDownSequence = this.shutDownSequence.bind(this);
  }

  close() {
    return new Promise((resolve) => {
      if (!this.server) {
        resolve();
        return;
      }

      try {
        this.closing = true;
        this.server.close((e) => {
          if (e) { logger.info('Ran into error during close', { stack: e.stack }); }
          resolve();
        });
      } catch (e) {
        logger.info('Ran into error on close', { stack: e.stack });
        resolve();
      }
    });
  }

  shutDownSequence(error, req, code = 1) {
    if (error) {
      logger.info(error.stack);
    }

    raceTo(this.close(), 1000, 'Closing the worker took too long.')
      .then(() => runAppLifecycle('shutDown', this.config.plugins, this.config, error, req))
      .then(exit(code))
      .catch(exit(code));
  }

  errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
    // If there is an error with body-parser and the status is set then we can safely swallow
    // the error and report it.
    // Here are a list of errors https://github.com/expressjs/body-parser#errors
    if (err.status && err.status >= 400 && err.status < 600) {
      logger.info('Non-fatal error encountered.');
      logger.info(err.stack);

      res.status(err.status).end();

      // In a promise in case one of the plugins throws an error.
      new Promise(() => { // eslint-disable-line no-new
        const manager = new BatchManager(req, res, req.body, this.config);
        errorSync(err, this.config.plugins, manager);
      });

      return;
    }
    this.shutDownSequence(err, req, 1);
  }

  initialize() {
    // run through the initialize methods of any plugins that define them
    runAppLifecycle('initialize', this.config.plugins, this.config)
      .then(() => {
        this.server = this.app.listen(...this.config.listenArgs, this.callback);
        return null;
      })
      .catch(this.shutDownSequence);
  }
}

const initServer = (app, config, callback) => {
  const server = new Server(app, config, callback);

  // Middleware
  app.use(server.errorHandler);

  // Last safety net
  process.on('uncaughtException', server.errorHandler);

  // if all the workers are ready then we should be good to start accepting requests
  process.on('message', (msg) => {
    if (msg === 'kill') {
      server.shutDownSequence(null, null, 0);
    }
  });

  server.initialize();

  return server;
};

const worker = (app, config, onServer, workerId) => {
  // ===== Middleware =========================================================
  attachMiddleware(app, config);

  if (onServer) {
    onServer(app, process);
  }

  let server;

  // ===== Routes =============================================================
  // server.closing
  attachEndpoint(app, config, () => server && server.closing);

  // ===== initialize server's nuts and bolts =================================
  server = initServer(app, config, () => {
    if (process.send) {
      // tell our coordinator that we're ready to start receiving requests
      process.send({ workerId, ready: true });
    }

    logger.info('Connected', { listen: config.listenArgs });
  });
};

worker.attachMiddleware = attachMiddleware;
worker.attachEndpoint = attachEndpoint;
worker.initServer = initServer;
worker.Server = Server;

export default worker;
