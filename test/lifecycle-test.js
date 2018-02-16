import { assert } from 'chai';
import sinon from 'sinon';

import '../lib/environment';
import { makeJob } from './helper';
import * as lifecycle from '../lib/utils/lifecycle';
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

function batchManagerInstance(jobs, plugins) {
  return new BatchManager({}, {}, jobs, { plugins });
}

describe('lifecycle', () => {
  const jobs = {
    foo: makeJob({ name: 'foo' }),
    bar: makeJob({ name: 'bar' }),
  };

  describe('.runAppLifecycle', () => {
    it('runs with sync methods', () => {
      const plugin = mockPlugin();
      const config = {};

      return lifecycle.runAppLifecycle('initialize', [plugin], config)
        .then(() => {
          assert.propertyVal(plugin.initialize, 'callCount', 1);
          assert.deepEqual(plugin.initialize.args[0][0], config);
        });
    });

    it('runs with async methods', () => {
      const config = {};
      const plugin = mockPlugin();
      let resolved = false;

      const promise = new Promise((resolve) => {
        setTimeout(() => {
          resolved = true;
          resolve();
        }, 20);
      });

      plugin.initialize = sinon.stub().returns(promise);

      return lifecycle.runAppLifecycle('initialize', [plugin], config)
        .then(() => {
          assert.propertyVal(plugin.initialize, 'callCount', 1);
          assert.deepEqual(plugin.initialize.args[0][0], config);
          assert.isTrue(resolved);
        });
    });

    it('runs with multiple plugins', () => {
      const config = {};
      const plugins = [mockPlugin(), mockPlugin(), mockPlugin()];
      plugins[0].initialize = sinon.stub().returns(Promise.resolve());
      plugins[1].initialize = sinon.stub().returns(Promise.resolve());

      return lifecycle.runAppLifecycle('initialize', plugins, config)
        .then(() => {
          assert.equal(plugins[0].initialize.callCount, 1);
          assert.deepEqual(plugins[0].initialize.args[0][0], config);
          assert.equal(plugins[1].initialize.callCount, 1);
          assert.deepEqual(plugins[1].initialize.args[0][0], config);
          assert.equal(plugins[2].initialize.callCount, 1);
          assert.deepEqual(plugins[2].initialize.args[0][0], config);
        });
    });
  });

  describe('.runLifecycle', () => {
    it('runs with sync methods', () => {
      const plugin = mockPlugin();
      const manager = batchManagerInstance(jobs, [plugin]);

      return lifecycle.runLifecycle('jobStart', [plugin], manager, 'foo')
        .then(() => {
          assert.equal(plugin.jobStart.callCount, 1, 'calls the method passed in');
          assert.deepEqual(plugin.jobStart.args[0][0], manager.contextFor(plugin, 'foo'));
        });
    });

    it('runs with async methods', () => {
      const plugins = [mockPlugin(), mockPlugin()];
      const manager = batchManagerInstance(jobs, plugins);

      let resolved = false;
      const promise = new Promise((resolve) => {
        setTimeout(() => {
          resolved = true;
          resolve();
        }, 20);
      });
      plugins[0].jobStart = sinon.stub().returns(promise);

      return lifecycle.runLifecycle('jobStart', plugins, manager, 'foo')
        .then(() => {
          const context = manager.contextFor(plugins[0], 'foo');
          assert.equal(plugins[0].jobStart.callCount, 1);
          assert.deepEqual(plugins[0].jobStart.args[0][0], context);
          assert.equal(plugins[1].jobStart.callCount, 1);
          assert.deepEqual(plugins[1].jobStart.args[0][0], context);
          assert.isTrue(resolved);
        });
    });

    it('runs with promises and sync methods', () => {
      const plugins = [mockPlugin(), mockPlugin(), mockPlugin()];
      plugins[0].jobStart = sinon.stub().returns(Promise.resolve());
      plugins[1].jobStart = sinon.stub().returns(Promise.resolve());
      const manager = batchManagerInstance(jobs, plugins);

      lifecycle.runLifecycle('jobStart', plugins, manager, 'foo')
        .then(() => {
          const context = manager.contextFor(plugins[0], 'foo');
          assert.equal(plugins[0].jobStart.callCount, 1);
          assert.deepEqual(plugins[0].jobStart.args[0][0], context);
          assert.equal(plugins[1].jobStart.callCount, 1);
          assert.deepEqual(plugins[1].jobStart.args[0][0], context);
          assert.equal(plugins[2].jobStart.callCount, 1);
          assert.deepEqual(plugins[2].jobStart.args[0][0], context);
        });
    });
  });

  describe('.runLifecycleSync', () => {
    it('runs methods synchronously', () => {
      const plugins = [mockPlugin(), mockPlugin(), mockPlugin()];
      const manager = batchManagerInstance(jobs, plugins);
      lifecycle.runLifecycleSync('beforeRender', plugins, manager, 'foo');
      const context = manager.contextFor(plugins[0], 'foo');
      assert.equal(plugins[0].beforeRender.callCount, 1);
      assert.deepEqual(plugins[0].beforeRender.args[0][0], context);

      assert.equal(plugins[1].beforeRender.callCount, 1);
      assert.deepEqual(plugins[1].beforeRender.args[0][0], context);

      assert.equal(plugins[2].beforeRender.callCount, 1);
      assert.deepEqual(plugins[2].beforeRender.args[0][0], context);
    });
  });

  describe('.errorSync', () => {
    it('calls onError synchronously with error object', () => {
      const err = new Error('message');
      const plugins = [mockPlugin(), mockPlugin(), mockPlugin()];
      const manager = batchManagerInstance(jobs, plugins);
      lifecycle.errorSync(err, plugins, manager, 'foo');

      const context = manager.contextFor(plugins[0], 'foo');
      assert.equal(plugins[0].onError.callCount, 1);
      assert.deepEqual(plugins[0].onError.args[0][0], context);
      assert.equal(plugins[0].onError.args[0][1], err);

      assert.equal(plugins[1].onError.callCount, 1);
      assert.deepEqual(plugins[1].onError.args[0][0], context);
      assert.equal(plugins[1].onError.args[0][1], err);

      assert.equal(plugins[1].onError.callCount, 1);
      assert.deepEqual(plugins[1].onError.args[0][0], context);
      assert.equal(plugins[1].onError.args[0][1], err);
    });
  });

  describe('.processJob', () => {
    let plugins;
    let manager;

    beforeEach(() => {
      plugins = [mockPlugin(), mockPlugin(), mockPlugin()];
      manager = batchManagerInstance(jobs, plugins);

      sinon.stub(manager, 'render');
      sinon.stub(manager, 'recordError');
    });

    it('calls lifecycle methods in correct order', () => (
      lifecycle.processJob('foo', plugins, manager).then(() => {
        sinon.assert.callOrder(
          plugins[0].jobStart,
          plugins[1].jobStart,
          plugins[2].jobStart,

          plugins[0].beforeRender,
          plugins[1].beforeRender,
          plugins[2].beforeRender,

          manager.render,

          plugins[0].afterRender,
          plugins[1].afterRender,
          plugins[2].afterRender,

          plugins[0].jobEnd,
          plugins[1].jobEnd,
          plugins[2].jobEnd,
        );
      })
    ));

    it('calls plugin methods with proper arguments', () => {
      const contexts = [
        manager.contextFor(plugins[0], 'foo'),
        manager.contextFor(plugins[1], 'foo'),
        manager.contextFor(plugins[2], 'foo'),
      ];

      return lifecycle.processJob('foo', plugins, manager).then(() => {
        sinon.assert.calledWith(plugins[0].jobStart, contexts[0]);
        sinon.assert.calledWith(plugins[1].jobStart, contexts[1]);
        sinon.assert.calledWith(plugins[2].jobStart, contexts[2]);

        sinon.assert.calledWith(plugins[0].beforeRender, contexts[0]);
        sinon.assert.calledWith(plugins[1].beforeRender, contexts[1]);
        sinon.assert.calledWith(plugins[2].beforeRender, contexts[2]);

        sinon.assert.calledWith(manager.render, 'foo');

        sinon.assert.calledWith(plugins[0].afterRender, contexts[0]);
        sinon.assert.calledWith(plugins[1].afterRender, contexts[1]);
        sinon.assert.calledWith(plugins[2].afterRender, contexts[2]);

        sinon.assert.calledWith(plugins[0].jobEnd, contexts[0]);
        sinon.assert.calledWith(plugins[1].jobEnd, contexts[1]);
        sinon.assert.calledWith(plugins[2].jobEnd, contexts[2]);
      });
    });

    it('on an error, fails fast', () => {
      plugins[0].beforeRender = sinon.stub().throws();

      return lifecycle.processJob('foo', plugins, manager)
        .then(() => {
          sinon.assert.called(plugins[0].jobStart);
          sinon.assert.called(plugins[1].jobStart);
          sinon.assert.called(plugins[2].jobStart);

          sinon.assert.notCalled(plugins[0].jobEnd);
          sinon.assert.notCalled(plugins[1].jobEnd);
          sinon.assert.notCalled(plugins[2].jobEnd);
        });
    });

    it('on an error, calls manager.recordError', () => {
      plugins[0].beforeRender = sinon.stub().throws();

      return lifecycle.processJob('foo', plugins, manager).then(() => {
        sinon.assert.called(manager.recordError);
      });
    });

    it('on an error, calls onError for plugins', () => {
      plugins[0].beforeRender = sinon.stub().throws();

      return lifecycle.processJob('foo', plugins, manager)
        .then(() => {
          sinon.assert.called(plugins[0].onError);
          sinon.assert.called(plugins[1].onError);
          sinon.assert.called(plugins[2].onError);
        });
    });
  });

  describe('.processBatch', () => {
    let plugins;
    let manager;

    beforeEach(() => {
      plugins = [mockPlugin(), mockPlugin(), mockPlugin()];
      manager = batchManagerInstance(jobs, plugins);

      sinon.stub(manager, 'render');
      sinon.stub(manager, 'recordError');
    });

    [true, false].forEach((concurrent) => {
      describe(`when concurrent is ${concurrent}`, () => {
        it('calls lifecycle methods in correct order', () => (
          lifecycle.processBatch(jobs, plugins, manager, concurrent)
            .then(() => {
              sinon.assert.callOrder(
                plugins[0].batchStart,
                plugins[1].batchStart,
                plugins[2].batchStart,

                // gets called once for each job
                manager.render,
                manager.render,

                plugins[0].batchEnd,
                plugins[1].batchEnd,
                plugins[2].batchEnd,
              );
            })
        ));

        it('on an error, fails fast', () => {
          plugins[0].batchStart = sinon.stub().throws();

          return lifecycle.processBatch(jobs, plugins, manager, concurrent)
            .then(() => {
              sinon.assert.called(plugins[0].batchStart);
              sinon.assert.notCalled(manager.render);
              sinon.assert.notCalled(plugins[0].batchEnd);
            });
        });

        it('on an error, calls manager.recordError', () => {
          plugins[0].batchStart = sinon.stub().throws();

          return lifecycle.processBatch(jobs, plugins, manager, concurrent)
            .then(() => {
              sinon.assert.called(manager.recordError);
            });
        });

        it('on an error, calls onError for plugins', () => {
          plugins[0].batchStart = sinon.stub().throws();

          return lifecycle.processBatch(jobs, plugins, manager, concurrent)
            .then(() => {
              sinon.assert.called(plugins[0].onError);
              sinon.assert.called(plugins[1].onError);
              sinon.assert.called(plugins[2].onError);
            });
        });
      });
    });
  });
});
