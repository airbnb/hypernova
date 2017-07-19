import { assert } from 'chai';

import hypernova from '../server';

describe('Hypernova server', () => {
  it('blows up if hypernova does not get getComponent', () => {
    assert.throws(hypernova, TypeError);
  });

  it('starts up the hypernova server without blowing up', (done) => {
    hypernova({
      devMode: true,
      getComponent: () => {},
      plugins: [
        {
          shutDown: () => {
            done();
          },
        },
      ],
      getClose: (close) => {
        close(null, null, 0);
      },
    });
  });

  it('starts up the hypernova server again without blowing up', (done) => {
    hypernova({
      devMode: true,
      getComponent: () => {},
      plugins: [
        {
          shutDown: () => {
            done();
          },
        },
      ],
      getClose: (close) => {
        close(null, null, 0);
      },
    });
  });
});
