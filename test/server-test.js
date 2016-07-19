import { assert } from 'chai';

import hypernova from '../server';

describe('Hypernova server', () => {
  it('blows up if hypernova does not get getComponent', () => {
    assert.throws(hypernova, TypeError);
  });

  it('starts up the hypernova server without blowing up', () => {
    hypernova({ getComponent: () => {} });
  });
});
