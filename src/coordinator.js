import cluster from 'cluster';
import os from 'os';

import './environment';
import logger from './utils/logger';
import { raceTo } from './utils/lifecycle';

export function getDefaultCPUs(realCount) {
  if (!Number.isInteger(realCount) || realCount <= 0) {
    throw new TypeError('getDefaultCPUs must accept a positive integer');
  }

  return realCount - 1 || 1;
}

export function getWorkerCount(getCPUs = getDefaultCPUs) {
  const realCount = os.cpus().length;

  if (typeof getCPUs !== 'function') {
    throw new TypeError('getCPUs must be a function');
  }

  const requested = getCPUs(realCount);

  if (!Number.isInteger(requested) || requested <= 0) {
    throw new TypeError('getCPUs must return a positive integer');
  }

  return requested;
}

function close() {
  return Promise.all(Object.values(cluster.workers).map((worker) => {
    const promise = new Promise((resolve, reject) => {
      worker.once('disconnect', resolve);
      worker.once('exit', (code) => {
        if (code !== 0) reject();
      });
    });
    worker.send('kill');
    return promise;
  }));
}

function kill(signal) {
  const liveWorkers = Object.values(cluster.workers).filter(worker => !worker.isDead());

  if (liveWorkers.length > 0) {
    logger.info(`Coordinator killing ${liveWorkers.length} live workers with ${signal}`);

    return Promise.all(liveWorkers.map((worker) => {
      const promise = new Promise((resolve) => {
        worker.once('exit', () => resolve());
      });

      worker.process.kill(signal);
      return promise;
    }));
  }

  return Promise.resolve();
}

function killSequence(signal) {
  return () => raceTo(kill(signal), 2000, `Killing workers with ${signal} took too long`);
}

function shutdown() {
  return raceTo(close(), 5000, 'Closing the coordinator took too long.')
    .then(killSequence('SIGTERM'), killSequence('SIGTERM'))
    .then(killSequence('SIGKILL'), killSequence('SIGKILL'));
}

function workersReady(workerCount) {
  const workers = Object.values(cluster.workers);

  return workers.length === workerCount && workers.every(worker => worker.isReady);
}

export default (getCPUs) => {
  const workerCount = getWorkerCount(getCPUs);
  let closing = false;

  function onWorkerMessage(msg) {
    if (msg.ready) {
      cluster.workers[msg.workerId].isReady = true;
    }

    if (workersReady(workerCount)) {
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
    if (worker.exitedAfterDisconnect === true || code === 0) {
      logger.info(`Worker #${worker.id} shutting down.`);
    } else if (closing) {
      logger.error(
        `Worker #${worker.id} died with code ${signal || code} during close. Not restarting.`,
      );
    } else {
      logger.error(`Worker #${worker.id} died with code ${signal || code}. Restarting worker.`);
      const newWorker = cluster.fork();
      newWorker.on('message', onWorkerMessage);
    }
  });

  process.on('SIGTERM', () => {
    logger.info('Hypernova got SIGTERM. Going down.');
    closing = true;
    shutdown().then(() => process.exit(0), () => process.exit(1));
  });

  process.on('SIGINT', () => {
    closing = true;
    shutdown().then(() => process.exit(0), () => process.exit(1));
  });

  Array.from({ length: workerCount }, () => cluster.fork());

  Object.values(cluster.workers).forEach(worker => worker.on('message', onWorkerMessage));
};
