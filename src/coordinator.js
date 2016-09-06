import cluster from 'cluster';
import os from 'os';

import './environment';
import logger from './utils/logger';
import { raceTo } from './utils/lifecycle';

const WORKER_COUNT = os.cpus().length - 1 || 1;

function close() {
  return Promise.all(Object.values(cluster.workers).map((worker) => {
    const promise = new Promise((resolve, reject) => {
      worker.on('disconnect', resolve);
      worker.on('exit', (code) => {
        if (code !== 0) reject();
      });
    });
    worker.send('kill');
    return promise;
  }));
}

function shutdown() {
  return raceTo(close(), 5000, 'Closing the coordinator took too long.');
}

function workersReady() {
  const workers = Object.values(cluster.workers);

  return (
    workers.length === WORKER_COUNT &&
    workers.every(worker => worker.isReady)
  );
}

export default () => {
  function onWorkerMessage(msg) {
    if (msg.ready) {
      cluster.workers[msg.workerId].isReady = true;
    }

    if (workersReady()) {
      Object.values(cluster.workers).forEach(worker => worker.send('healthy'));
    }
  }

  cluster.on('online', worker => logger.info(`Worker #${worker.id} is now online`));

  cluster.on('listening', (worker, address) => {
    logger.info(`Worker #${worker.id} is now connected to ${address.address}:${address.port}`);
  });

  cluster.on('disconnect', (worker) => {
    logger.info(`Worker #${worker.id} has disconnected`);
  });

  cluster.on('exit', (worker, code, signal) => {
    if (worker.suicide === true || code === 0) {
      logger.info(`Worker #${worker.id} shutting down.`);
    } else {
      logger.error(`Worker #${worker.id} died with code ${signal || code}. Restarting worker.`);
      const newWorker = cluster.fork();
      newWorker.on('message', onWorkerMessage);
    }
  });

  process.on('SIGTERM', () => {
    logger.info('Hypernova got SIGTERM. Going down.');
    shutdown().then(() => process.exit(0), () => process.exit(1));
  });

  process.on('SIGINT', () => {
    shutdown().then(() => process.exit(0), () => process.exit(1));
  });

  Array.from({ length: WORKER_COUNT }, () => cluster.fork());

  Object.values(cluster.workers).forEach(worker => worker.on('message', onWorkerMessage));
};
