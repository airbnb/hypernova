import { assert } from 'chai';
import { DATA_KEY, DATA_ID } from '../lib';

describe('hypernova', () => {
  it('DATA_KEY constant should be importable', () => {
    assert.equal(DATA_KEY, 'hypernova-key');
  });

  it('DATA_ID constant should be importable', () => {
    assert.equal(DATA_ID, 'hypernova-id');
  });
});
