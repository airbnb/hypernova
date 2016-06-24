import hypernova from '../server';
import { assert } from 'chai';

describe('Hypernova server', () => {
  it('blows up if hypernova does not get getComponent', () => {
    assert.throws(hypernova, TypeError);
  });

  it('starts up the hypernova server without blowing up', () => {
    hypernova({ clustering: false, getComponent: () => {} });
  });
});
