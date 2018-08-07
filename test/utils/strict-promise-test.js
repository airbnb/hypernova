import { assert } from 'chai';
import StrictPromise from '../../src/utils/strict-promise';

describe('StrictPromise', () => {
  describe('static reject', () => {
    it('rejects with a given reason', (done) => {
      const message = 'rejected';

      StrictPromise.reject(message).catch((rejectedWith) => {
        assert.strictEqual(rejectedWith, message);
        done();
      });
    });
  });

  describe('static resolve', () => {
    it('resolves with a given reason', (done) => {
      const message = 'fulfilled';

      StrictPromise.resolve(message).then((resolvedWith) => {
        assert.strictEqual(resolvedWith, message);
        done();
      });
    });
  });

  describe('thennable', () => {
    it('has a fulfillment callback', (done) => {
      let resolveWith;
      const message = 'fulfilled';

      const promise = new StrictPromise((resolve) => {
        resolveWith = resolve;
      });

      promise.then((resolvedWith) => {
        assert.strictEqual(resolvedWith, message);
        done();
      });

      resolveWith(message);
    });

    it('has a rejection callback', (done) => {
      let rejectWith;
      const message = 'rejected';

      const promise = new StrictPromise((resolve, reject) => {
        rejectWith = reject;
      });

      promise.then(() => {}, (rejectedWith) => {
        assert.strictEqual(rejectedWith, message);
        done();
      });

      rejectWith(message);
    });
  });

  it('is catchable', (done) => {
    let rejectWith;
    const message = 'rejected';

    const promise = new StrictPromise((resolve, reject) => {
      rejectWith = reject;
    });
    promise.catch((rejectedWith) => {
      assert.strictEqual(rejectedWith, message);
      done();
    });

    rejectWith(message);
  });
});
