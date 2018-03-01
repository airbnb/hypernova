import logger from './logger';

const MAX_LIFECYCLE_EXECUTION_TIME_IN_MS = 300;
const PROMISE_TIMEOUT = {};

/**
 * @typedef {Object} HypernovaPlugin
 */

/**
 * Returns a predicate function to filter objects based on whether a method of the provided
 * name is present.
 * @param {String} name - the method name to find
 * @returns {Function} - the resulting predicate function
 */
export function hasMethod(name) {
  return obj => typeof obj[name] === 'function';
}

/**
 * Creates a promise that resolves at the specified number of ms.
 *
 * @param ms
 * @returns {Promise}
 */
export function raceTo(promise, ms, msg) {
  let timeout;

  return Promise.race([
    promise,
    new Promise((resolve) => {
      timeout = setTimeout(() => resolve(PROMISE_TIMEOUT), ms);
    }),
  ]).then((res) => {
    if (res === PROMISE_TIMEOUT) logger.info(msg, { timeout: ms });
    if (timeout) clearTimeout(timeout);

    return res;
  }).catch((err) => {
    if (timeout) clearTimeout(timeout);

    return Promise.reject(err);
  });
}

/**
 * Iterates through the plugins and calls the specified asynchronous lifecycle event,
 * returning a promise that resolves when they all are completed, or rejects if one of them
 * fails.
 *
 * The third `config` param gets passed into the lifecycle methods as the first argument. In
 * this case, the app lifecycle events expect the config instance to be passed in.
 *
 * This function is currently used for the lifecycle events `initialize` and `shutdown`.
 *
 * @param {String} lifecycle
 * @param {Array<HypernovaPlugin>} plugins
 * @param {Config} config
 * @returns {Promise}
 * @param err {Error}
 */
export function runAppLifecycle(lifecycle, plugins, config, error, ...args) {
  try {
    const promise = Promise.all(
      plugins.filter(hasMethod(lifecycle)).map(plugin => plugin[lifecycle](config, error, ...args)),
    );

    return raceTo(
      promise,
      MAX_LIFECYCLE_EXECUTION_TIME_IN_MS,
      `App lifecycle method ${lifecycle} took too long.`,
    );
  } catch (err) {
    return Promise.reject(err);
  }
}

/**
 * Iterates through the plugins and calls the specified asynchronous lifecycle event,
 * returning a promise that resolves when they are all completed, or rejects if one of them
 * fails.
 *
 * This is meant to be used on lifecycle events both at the batch level and the job level. The
 * passed in BatchManager is used to get the corresponding context object for the plugin/job and
 * is passed in as the first argument to the plugin's method.
 *
 * This function is currently used for `batchStart/End` and `jobStart/End`.
 *
 * @param {String} lifecycle
 * @param {Array<HypernovaPlugin>} plugins
 * @param {BatchManager} manager
 * @param {String} [token] - If provided, the job token to use to get the context
 * @returns {Promise}
 */
export function runLifecycle(lifecycle, plugins, manager, token) {
  try {
    const promise = Promise.all(
      plugins
        .filter(hasMethod(lifecycle))
        .map(plugin => plugin[lifecycle](manager.contextFor(plugin, token))),
    );

    return raceTo(
      promise,
      MAX_LIFECYCLE_EXECUTION_TIME_IN_MS,
      `Lifecycle method ${lifecycle} took too long.`,
    );
  } catch (err) {
    return Promise.reject(err);
  }
}

/**
 * Iterates through the plugins and calls the specified synchronous lifecycle event (when present).
 * Passes in the appropriate context object for the plugin/job.
 *
 * This function is currently being used for `afterRender` and `beforeRender`.
 *
 * @param {String} lifecycle
 * @param {Array<HypernovaPlugin>} plugins
 * @param {BatchManager} manager
 * @param {String} [token]
 */
export function runLifecycleSync(lifecycle, plugins, manager, token) {
  plugins
    .filter(hasMethod(lifecycle))
    .forEach(plugin => plugin[lifecycle](manager.contextFor(plugin, token)));
}

/**
 * Iterates through the plugins and calls the specified synchronous `onError` handler
 * (when present).
 *
 * Passes in the appropriate context object, as well as the error.
 *
 * @param {Error} err
 * @param {Array<HypernovaPlugin>} plugins
 * @param {BatchManager} manager
 * @param {String} [token]
 */
export function errorSync(err, plugins, manager, token) {
  plugins
    .filter(hasMethod('onError'))
    .forEach(plugin => plugin.onError(manager.contextFor(plugin, token), err));
}

/**
 * Runs through the job-level lifecycle events of the job based on the provided token. This includes
 * the actual rendering of the job.
 *
 * Returns a promise resolving when the job completes.
 *
 * @param {String} token
 * @param {Array<HypernovaPlugin>} plugins
 * @param {BatchManager} manager
 * @returns {Promise}
 */
export function processJob(token, plugins, manager) {
  return (
    // jobStart
    runLifecycle('jobStart', plugins, manager, token)

      .then(() => {
        // beforeRender
        runLifecycleSync('beforeRender', plugins, manager, token);

        // render
        return manager.render(token);
      })
      // jobEnd
      .then(() => {
        // afterRender
        runLifecycleSync('afterRender', plugins, manager, token);

        return runLifecycle('jobEnd', plugins, manager, token);
      })
      .catch((err) => {
        manager.recordError(err, token);
        errorSync(err, plugins, manager, token);
      })
  );
}

function processJobsSerially(jobs, plugins, manager) {
  return Object.keys(jobs).reduce(
    (chain, token) => chain.then(() => processJob(token, plugins, manager)),
    Promise.resolve(),
  );
}

function processJobsConcurrently(jobs, plugins, manager) {
  return Promise.all(
    Object.keys(jobs).map(token => processJob(token, plugins, manager)),
  );
}

/**
 * Runs through the batch-level lifecycle events of a batch. This includes the processing of each
 * individual job.
 *
 * Returns a promise resolving when all jobs in the batch complete.
 *
 * @param jobs
 * @param {Array<HypernovaPlugin>} plugins
 * @param {BatchManager} manager
 * @returns {Promise}
 */
export function processBatch(jobs, plugins, manager, concurrent) {
  return (
    // batchStart
    runLifecycle('batchStart', plugins, manager)

      // for each job, processJob
      .then(() => {
        if (concurrent) {
          return processJobsConcurrently(jobs, plugins, manager);
        }

        return processJobsSerially(jobs, plugins, manager);
      })

      // batchEnd
      .then(() => runLifecycle('batchEnd', plugins, manager))
      .catch((err) => {
        manager.recordError(err);
        errorSync(err, plugins, manager);
      })
  );
}
