import { assert } from 'chai';
import os from 'os';
import sinon from 'sinon';
import { getDefaultCPUs, getWorkerCount } from '../lib/coordinator';

describe('coordinator', () => {
  it('default method returns correct number of cpus', () => {
    assert.equal(getDefaultCPUs(5), 4, 'getDefaultCPUs returns n - 1 CPUs');

    assert.throws(getDefaultCPUs, TypeError, 'getDefaultCPUs must accept a positive integer');

    assert.throws(() => {
      getDefaultCPUs('three');
    }, TypeError, 'getDefaultCPUs must accept a positive integer');

    assert.throws(() => {
      getDefaultCPUs(0);
    }, TypeError, 'getDefaultCPUs must accept a positive integer');
  });

  it('uses the correct number of cpus', () => {
    const sandbox = sinon.sandbox.create();
    const dummyCPUs = Array.from({ length: 5 }, () => ({}));
    sandbox.stub(os, 'cpus').returns(dummyCPUs);

    assert.equal(getWorkerCount(), dummyCPUs.length - 1, 'getWorkerCount defaults to all available cpus minus one');
    assert.equal(getWorkerCount(() => 3), 3, 'getWorkerCount uses specified cpus');

    assert.throws(() => {
      getWorkerCount(3);
    }, TypeError, 'getCPUs must be a function');

    assert.throws(() => {
      getWorkerCount(() => 'three');
    }, TypeError, 'getCPUs must return a positive integer');

    assert.throws(() => {
      getWorkerCount(() => 0);
    }, TypeError, 'getCPUs must return a positive integer');

    sandbox.restore();
  });
});
