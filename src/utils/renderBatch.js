import BatchManager from './BatchManager';
import { processBatch } from './lifecycle';
import logger from './logger';

export default (config, isClosing) => (req, res) => {
  // istanbul ignore if
  if (isClosing()) {
    logger.info('Starting request when closing!');
  }
  const jobs = req.body;

  const manager = new BatchManager(req, res, jobs, config);

  return processBatch(jobs, config.plugins, manager, config.processJobsConcurrently)
    .then(() => {
      // istanbul ignore if
      if (isClosing()) {
        logger.info('Ending request when closing!');
      }
      return res.status(manager.statusCode).json(manager.getResults()).end();
    })
    .catch(() => res.status(manager.statusCode).end());
};
