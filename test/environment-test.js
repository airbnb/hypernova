import { assert } from 'chai';
import '../src/environment';

describe('environment', () => {
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
    });
  });
});
