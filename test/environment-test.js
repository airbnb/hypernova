import { assert } from 'chai';
import Promise from 'bluebird';
import '../src/environment';

describe('environment', () => {
  it('does not modify the Promise package', () => {
    assert.notStrictEqual(Promise, global.Promise);
  });

  describe('global promise', () => {
    it('has ES6 methods', () => {
      assert.isFunction(global.Promise.prototype.then);
      assert.isFunction(global.Promise.prototype.catch);
      assert.isFunction(global.Promise.prototype.constructor);
    });

    it('has ES6 static methods', () => {
      assert.isFunction(global.Promise.all);
      assert.isFunction(global.Promise.race);
      assert.isFunction(global.Promise.resolve);
      assert.isFunction(global.Promise.reject);
      assert.isFunction(global.Promise.cast);
    });

    it('removes extraneous methods', () => {
      assert.isUndefined(global.Promise.promisifyAll);
    });
  });
});
