function errorToSerializable(error) {
  // istanbul ignore next
  if (error === undefined) throw new TypeError('No error was passed');

  // make sure it is an object that is Error-like so we can serialize it properly
  // if it's not an actual error then we won't create an Error so that there is no stack trace
  // because no stack trace is better than a stack trace that is generated here.
  const err = (
    Object.prototype.toString.call(error) === '[object Error]' &&
    typeof error.stack === 'string'
  ) ? error : { name: 'Error', type: 'Error', message: error, stack: '' };

  return {
    type: err.type,
    name: err.name,
    message: err.message,
    stack: err.stack.split('\n    '),
  };
}

function notFound(name) {
  const error = new ReferenceError(`Component "${name}" not registered`);
  const stack = error.stack.split('\n');

  error.stack = [stack[0]]
    .concat(
      `    at YOUR-COMPONENT-DID-NOT-REGISTER_${name}:1:1`,
      stack.slice(1),
    )
    .join('\n');

  return error;
}

function msSince(start) {
  const diff = process.hrtime(start);
  return (diff[0] * 1e3) + (diff[1] / 1e6);
}

function now() {
  return process.hrtime();
}

/**
 * The BatchManager is a class that is instantiated once per batch, and holds a lot of the
 * key data needed throughout the life of the request. This ends up cleaning up some of the
 * management needed for plugin lifecycle, and the handling of rendering multiple jobs in a
 * batch.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {Object} jobs - a map of token => Job
 * @param {Object} config
 * @constructor
 */
class BatchManager {
  constructor(request, response, jobs, config) {
    const tokens = Object.keys(jobs);

    this.config = config;
    this.plugins = config.plugins;
    this.error = null;
    this.statusCode = 200;

    // An object that all of the contexts will inherit from... one per instance.
    this.baseContext = {
      request,
      response,
      batchMeta: {},
    };

    // An object that will be passed into the context for batch-level methods, but not for job-level
    // methods.
    this.batchContext = {
      tokens,
      jobs,
    };

    // A map of token => JobContext, where JobContext is an object of data that is per-job,
    // and will be passed into plugins and used for the final result.
    this.jobContexts = tokens.reduce((obj, token) => {
      const { name, data, metadata } = jobs[token];
      /* eslint no-param-reassign: 1 */
      obj[token] = {
        name,
        token,
        props: data,
        metadata,
        statusCode: 200,
        duration: null,
        html: null,
        returnMeta: {},
      };
      return obj;
    }, {});


    // Each plugin receives it's own little key-value data store that is scoped privately
    // to the plugin for the life time of the request. This is achieved simply through lexical
    // closure.
    this.pluginContexts = new Map();
    this.plugins.forEach((plugin) => {
      this.pluginContexts.set(plugin, { data: new Map() });
    });
  }

  /**
   * Returns a context object scoped to a specific plugin and job (based on the plugin and
   * job token passed in).
   */
  getRequestContext(plugin, token) {
    return {
      ...this.baseContext,
      ...this.jobContexts[token],
      ...this.pluginContexts.get(plugin),
    };
  }

  /**
   * Returns a context object scoped to a specific plugin and batch.
   */
  getBatchContext(plugin) {
    return {
      ...this.baseContext,
      ...this.batchContext,
      ...this.pluginContexts.get(plugin),
    };
  }

  contextFor(plugin, token) {
    return token ? this.getRequestContext(plugin, token) : this.getBatchContext(plugin);
  }

  /**
   * Renders a specific job (from a job token). The end result is applied to the corresponding
   * job context. Additionally, duration is calculated.
   */
  render(token) {
    const start = now();
    const context = this.jobContexts[token];
    const name = context.name;

    const { getComponent } = this.config;

    const result = getComponent(name, context);

    return Promise.resolve(result).then((renderFn) => {
      // ensure that we have this component registered
      if (!renderFn || typeof renderFn !== 'function') {
        // component not registered
        context.statusCode = 404;
        context.duration = msSince(start);
        throw notFound(name);
      }

      let response = null;

      // render the component!
      try {
        context.html = renderFn(context.props);
      } catch (e) {
        response = Promise.reject(e);
      } finally {
        context.duration = msSince(start);
      }

      return response;
    });
  }

  recordError(error, token) {
    if (token && this.jobContexts[token]) {
      const context = this.jobContexts[token];
      context.statusCode = context.statusCode === 200 ? 500 : context.statusCode;
      context.error = error;
    } else {
      this.error = error;
      this.statusCode = 500;
    }
  }

  getResult(token) {
    const context = this.jobContexts[token];
    return {
      name: context.name,
      html: context.html,
      meta: context.returnMeta,
      duration: context.duration,
      statusCode: context.statusCode,
      success: context.html !== null,
      error: context.error ? errorToSerializable(context.error) : null,
    };
  }

  getResults() {
    return {
      success: this.error === null,
      error: this.error,
      results: Object.keys(this.jobContexts).reduce((result, token) => {
        /* eslint no-param-reassign: 1 */
        result[token] = this.getResult(token);
        return result;
      }, {}),
    };
  }
}

export default BatchManager;
