import cluster from 'cluster';
import express from 'express';

import './environment';
import Module from './Module';
import coordinator from './coordinator';
import createGetComponent from './createGetComponent';
import getFiles from './getFiles';
import loadModules from './loadModules';
import logger from './utils/logger';
import createVM from './createVM';
import worker from './worker';
import { raceTo } from './utils/lifecycle';

const defaultConfig = {
  bodyParser: {
    limit: 1024 * 1000,
  },
  devMode: false,
  endpoint: '/batch',
  files: [],
  logger: {},
  plugins: [],
  port: 8080,
  host: '0.0.0.0',
  processJobsConcurrent: true,
  listenArgs: null,
};

function createApplication() {
  return express();
}

export default function hypernova(userConfig, onServer) {
  const config = { ...defaultConfig, ...userConfig };

  if (typeof config.getComponent !== 'function') {
    throw new TypeError('Hypernova requires a `getComponent` property and it must be a function');
  }

  if (!config.listenArgs) {
    config.listenArgs = [config.port, config.host];
  }

  logger.init(config.logger);

  const app = createApplication();

  if (config.devMode) {
    worker(app, config, onServer);
  } else if (cluster.isMaster) {
    coordinator(config.getCPUs);
  } else {
    worker(app, config, onServer, cluster.worker.id);
  }

  return app;
}

// I'm "exporting" them here because I want to export these but still have a default export.
// And I want it to work on CJS.
// I want my cake and to eat it all.
hypernova.Module = Module;
hypernova.createApplication = createApplication;
hypernova.createGetComponent = createGetComponent;
hypernova.createVM = createVM;
hypernova.getFiles = getFiles;
hypernova.loadModules = loadModules;
hypernova.worker = worker;
hypernova.logger = logger;
hypernova.defaultConfig = defaultConfig;
hypernova.raceTo = raceTo;
