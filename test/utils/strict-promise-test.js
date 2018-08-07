import { assert } from 'chai';
import StrictPromise from '../../src/utils/strict-promise';

describe('StrictPromise', () => {
  describe('thennable', () => {
    it('has a fulfillment callback', (done) => {
      let resolveWith;
      const message = 'rejected';

      const promise = new StrictPromise((resolve, reject) => {
        resolveWith = reject;
      });

      promise.catch((resolvedWith) => {
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

      promise.catch((rejectedWith) => {
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
