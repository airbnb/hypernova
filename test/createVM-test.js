import { assert } from 'chai';
import { createVM } from '../server';

describe('createVM', () => {
  let vm;

  beforeEach(() => {
    vm = createVM();
  });

  it('runs the code', () => {
    const code = `
      module.exports = 12;
    `;
    const num = vm.run('test.js', code);

    assert(num === 12, 'returned value was given');
  });

  it('caches module.exports', () => {
    process.foo = 0;
    const code = `
      process.foo += 1;
      module.exports = process.foo;
    `;

    const num = vm.run('test.js', code);

    assert(num === 1, 'the resulting code was incremented');

    const nextNum = vm.run('test.js', code);

    assert(nextNum === 1, 'the module.exports was cached');
  });

  it('flushes the cache', () => {
    vm.run('test.js', '');
    assert(vm.exportsCache.itemCount === 1, 'the cache has 1 entry');
    vm.exportsCache.reset();
    assert(vm.exportsCache.itemCount === 0, 'the cache was reset');
  });
});
