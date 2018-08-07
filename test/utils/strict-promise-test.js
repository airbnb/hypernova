import { assert } from 'chai';
import StrictPromise from '../../src/utils/strict-promise';

describe('StrictPromise', () => {
  describe('static resolve', () => {
    it('resolves with a given reason', (done) => {
      const message = 'fulfilled';

      StrictPromise.reject(message).catch((resolvedWith) => {
        assert.isStrictEqual(resolvedWith, message);
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
        assert.isStrictEqual(resolvedWith, message);
        done();
      });

      resolveWith();
    });

    it('has a rejection callback', (done) => {
      let rejectWith;
      const message = 'rejected';

      const promise = new StrictPromise((resolve, reject) => {
        rejectWith = reject;
      });

      promise.then(() => {}, (rejectedWith) => {
        assert.isStrictEqual(rejectedWith, message);
        done();
      });

      rejectWith();
    });
  });

  it('is catchable', (done) => {
    let rejectWith;
    const message = 'rejected';

    const promise = new StrictPromise((resolve, reject) => {
      rejectWith = reject;
    });

    promise.catch((rejectedWith) => {
      assert.isStrictEqual(rejectedWith, message);
      done();
    });

    rejectWith();
  });
});
