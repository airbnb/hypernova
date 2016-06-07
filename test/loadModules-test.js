import { loadModules, createVM } from '../server';

describe('loadModules', () => {
  it('loads the respective environment', () => {
    const environment = loadModules(require, [
      './a.js',
      './b.js',
    ]);

    const vm = createVM({
      environment,
    });

    vm.run('test/loadModules-test.js', `
      const assert = require('chai').assert;

      assert.isDefined(global.a);
      assert.isDefined(global.b);
    `);
  });

  it('works if one module is passed', () => {
    const environment = loadModules(require, [
      './a.js',
    ]);

    const vm = createVM({
      environment,
    });

    vm.run('test/loadModules-test.js', `
      const assert = require('chai').assert;

      assert.isDefined(global.a);
    `);
  });

  it('still works if a module that does not exist is passed', () => {
    const environment = loadModules(require, [
      './a.js',
      './does-not-exist.js',
    ]);

    const vm = createVM({
      environment,
    });

    vm.run('test/loadModules-test.js', `
      const assert = require('chai').assert;

      assert.isDefined(global.a);
    `);
  });

  it('still works if a module that does not exist is passed in first', () => {
    const environment = loadModules(require, [
      './does-not-exist.js',
      './a.js',
    ]);

    const vm = createVM({
      environment,
    });

    vm.run('test/loadModules-test.js', `
      const assert = require('chai').assert;

      assert.isDefined(global.a);
    `);
  });
});
