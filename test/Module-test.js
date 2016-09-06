import { assert } from 'chai';
import has from 'has';
import { Module } from '../server';
import mutableArray from './mutableArray';

function run(code) {
  const name = __filename;

  const module = new Module(name);
  module.load(name);
  module._compile(code, name);

  return module.exports;
}

describe('Module', () => {
  it('does not leak globals across requests', () => {
    global.foo = 10;
    const code = `
      global.foo = global.foo || 0;
      global.foo += 1;
    `;
    run(code);
    assert(global.foo === 10, 'our environment\'s global was unaffected');
    run(code);
    assert(global.foo === 10, 'our environment\'s global was unaffected after a second run');
  });

  it('loads a module and return the instance', () => {
    const module = Module.load('./test/mutableArray.js');
    assert(has(module, 'exports') === true, 'module has exports property');
    assert.isArray(module.exports, 'module.exports is our array');
  });

  it('should not be able to mutate singletons', () => {
    assert(mutableArray.length === 0, 'our array is empty');

    mutableArray.push(1, 2, 3);

    assert(mutableArray.length === 3, 'our array has a length of 3');

    const code = `
      var mutableArray = require('./mutableArray');
      mutableArray.push(1);
      module.exports = mutableArray;
    `;

    const arr = run(code);

    assert(mutableArray !== arr, 'both arrays do not equal each other');
    assert(arr.length === 1, 'returned mutableArray has length of 1');
    assert(mutableArray.length === 3, 'our array still has a length of 3');
  });
});
