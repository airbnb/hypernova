import { assert } from 'chai';
import sinon from 'sinon-sandbox';

import { makeJob, COMPONENT_NAME } from './helper';
import BatchManager from '../lib/utils/BatchManager';

function mockPlugin() {
  return {
    initialize: sinon.stub(),
    batchStart: sinon.stub(),
    jobStart: sinon.stub(),
    beforeRender: sinon.stub(),
    afterRender: sinon.stub(),
    onError: sinon.stub(),
    jobEnd: sinon.stub(),
    batchEnd: sinon.stub(),
    shutDown: sinon.stub(),
  };
}

const jobs = {
  foo: makeJob(),
  bar: makeJob(),
  baz: {
    name: 'baz',
    data: {},
  },
};

jobs.bar.name = 'bar'; // component not registered

const req = {};
const res = {};
const _strategies = {
  [COMPONENT_NAME]: sinon.stub().returns('html'),
  baz: sinon.stub().returns(undefined),
};
const config = {
  getComponent(name) {
    return _strategies[name];
  },
  plugins: {},
};

describe('BatchManager', () => {
  let plugins;
  let manager;

  beforeEach(() => {
    plugins = [
      mockPlugin(),
      mockPlugin(),
    ];
    config.plugins = plugins;
    manager = new BatchManager(req, res, jobs, config);
  });

  context('request contexts', () => {
    it('returns a plugin data map that persists across the plugin', () => {
      const context1 = manager.contextFor(plugins[0], 'foo');
      const context2 = manager.contextFor(plugins[0], 'foo');
      const context3 = manager.contextFor(plugins[1], 'foo');

      context1.data.set('foo', 'bar');
      assert.equal(context2.data.get('foo'), 'bar');
      assert.isUndefined(context3.data.get('foo'));
    });

    it('contains information about the specific job', () => {
      const context1 = manager.contextFor(plugins[0], 'foo');
      assert.equal(context1.token, 'foo');
      const context2 = manager.contextFor(plugins[0], 'bar');
      assert.equal(context2.token, 'bar');
    });
  });

  context('request contexts', () => {
    it('contains information about the batch', () => {
      const context1 = manager.contextFor(plugins[0]);
      assert.deepEqual(context1.tokens, Object.keys(jobs));
    });
  });

  describe('.render()', () => {
    it('sets the html and duration for the right context', (done) => {
      manager.render('foo').then(() => {
        const context = manager.jobContexts.foo;
        assert.equal(context.html, 'html');
        assert.equal(context.statusCode, 200);
        assert.isNotNull(context.duration);

        done();
      });
    });

    it('fails if component is not registered', (done) => {
      manager.render('bar').catch((err) => {
        assert.equal(err.message, 'Component "bar" not registered');
        done();
      });
    });

    it('fails when a component returns falsy html', (done) => {
      manager.render('baz').catch((err) => {
        assert.equal(
          err.message,
          'HTML was not returned to Hypernova, this is most likely an error within your application. Check your logs for any uncaught errors and/or rejections.',
        );
        done();
      });
    });
  });

  describe('.recordError()', () => {
    it('sets error and status code for the jobContext, when token is present', () => {
      manager.recordError(new Error(), 'foo');
      const context = manager.contextFor(plugins[0], 'foo');
      assert.equal(context.statusCode, 500);
    });

    it('sets error and status code for the batch, when no token is present', () => {
      manager.recordError(new Error());
      assert.equal(manager.statusCode, 500);
    });
  });

  describe('.getResult()', () => {
    it('returns an object with the html of the right jobContext', (done) => {
      manager.render('foo').then(() => {
        const result = manager.getResult('foo');
        assert.equal(result.html, 'html');
        assert.isTrue(result.success);
        assert.isNull(result.error);
        done();
      });
    });
    it('returns an object with the html of the right jobContext', () => {
      manager.recordError(new Error(), 'bar');
      const result = manager.getResult('bar');
      assert.isFalse(result.success);
      assert.isNotNull(result.error);
    });
  });

  describe('.getResults()', () => {
    it('returns an object with keys of tokens of each job', (done) => {
      manager.render('foo').then(() => {
        manager.recordError(new Error(), 'bar');
        const response = manager.getResults();
        assert.isDefined(response.success);
        assert.isDefined(response.error);
        assert.isDefined(response.results);
        assert.isDefined(response.results.foo);
        assert.isDefined(response.results.bar);
        assert.equal(response.results.foo.html, 'html');

        done();
      });
    });

    it('contains a duration even if there is an error', (done) => {
      manager.render('bar').catch(() => {
        const response = manager.getResults();
        assert.isDefined(response.results.bar.duration);
        assert.isNumber(response.results.bar.duration);

        done();
      });
    });
  });
});
