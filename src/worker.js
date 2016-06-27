import './environment';
import bodyParser from 'body-parser';
import logger from './utils/logger';
import renderBatch from './utils/renderBatch';
import { runAppLifecycle, errorSync, raceTo } from './utils/lifecycle';
import BatchManager from './utils/BatchManager';

let closing = false;

export default (app, config, onServer, workerId) => {
  let server;

  // ===== Middleware =========================================================
  app.use(bodyParser.json(config.bodyParser));

  if (onServer) {
    onServer(app, process);
  }

  // ===== Routes =============================================================
  app.post(config.endpoint, renderBatch(config, () => closing));

  // ===== Exceptions =========================================================
  function exit(code) {
    return () => process.exit(code);
  }

  function close() {
    return new Promise(resolve => {
      if (!server) {
        resolve();
        return;
      }

      try {
        closing = true;
        server.close((e) => {
          if (e) { logger.info('Ran into error during close', { stack: e.stack }); }
          resolve();
        });
      } catch (e) {
        logger.info('Ran into error on close', { stack: e.stack });
        resolve();
      }
    });
  }

  function shutDownSequence(error, req, code = 1) {
    if (error) {
      logger.info(error.stack);
    }

    raceTo(close(), 1000, 'Closing the worker took too long.')
      .then(() => runAppLifecycle('shutDown', config.plugins, config, error, req))
      .then(exit(code))
      .catch(exit(code));
  }

  function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
    // If there is an error with body-parser and the status is set then we can safely swallow
    // the error and report it.
    // Here are a list of errors https://github.com/expressjs/body-parser#errors
    if (err.status && err.status >= 400 && err.status < 600) {
      logger.info('Non-fatal error encountered.');
      logger.info(err.stack);

      res.status(err.status).end();

      // In a promise in case one of the plugins throws an error.
      new Promise(() => { // eslint-disable-line no-new
        const manager = new BatchManager(req, res, req.body, config);
        errorSync(err, config.plugins, manager);
      });

      return;
    }
    shutDownSequence(err, req, 1);
  }

  // Middleware
  app.use(errorHandler);

  // Last safety net
  process.on('uncaughtException', errorHandler);

  // if all the workers are ready then we should be good to start accepting requests
  process.on('message', (msg) => {
    if (msg === 'kill') {
      shutDownSequence(null, null, 0);
    }
  });

   // run through the initialize methods of any plugins that define them
  runAppLifecycle('initialize', config.plugins, config)
    .then(() => {
      server = app.listen(config.port, () => {
        if (process.send) {
          // tell our coordinator that we're ready to start receiving requests
          process.send({ workerId, ready: true });
        }

        logger.info('Connected', { port: config.port });
      });
    })
    .catch(shutDownSequence);
};
