import { assert } from 'chai';
import sinon from 'sinon';

import hypernova from '../server';

describe('Hypernova server', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(process, 'exit');
  });

  afterEach(() => {
    sandbox.restore();
  });

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
