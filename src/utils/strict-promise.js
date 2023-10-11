/* eslint-disable no-underscore-dangle */

import Promise from 'bluebird';

export default class StrictPromise {
  constructor(executor) {
    this._promise = new Promise(executor);
  }

  static all(iterable) {
    const newPromise = Promise.all(iterable);

    const strictPromise = new StrictPromise((resolve, reject) => {
      newPromise.then(resolve, reject);
    });

    return strictPromise;
  }

  static race(iterable) {
    const newPromise = Promise.race(iterable);

    const strictPromise = new StrictPromise((resolve, reject) => {
      newPromise.then(resolve, reject);
    });

    return strictPromise;
  }

  static reject(value) {
    const newPromise = Promise.reject(value);

    const strictPromise = new StrictPromise((resolve, reject) => {
      newPromise.then(resolve, reject);
    });

    return strictPromise;
  }

  static resolve(value) {
    const newPromise = Promise.resolve(value);

    const strictPromise = new StrictPromise((resolve, reject) => {
      newPromise.then(resolve, reject);
    });

    return strictPromise;
  }

  then(onFulfilled, onRejected) {
    const newPromise = this._promise.then(onFulfilled, onRejected);

    const strictPromise = new StrictPromise((resolve, reject) => {
      newPromise.then(resolve, reject);
    });

    return strictPromise;
  }

  catch(onRejected) {
    const newPromise = this._promise.catch(onRejected);

    const strictPromise = new StrictPromise((resolve, reject) => {
      newPromise.then(resolve, reject);
    });

    return strictPromise;
  }
}
