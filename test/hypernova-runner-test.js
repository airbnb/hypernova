import { assert } from 'chai';
import hypernova from '..';
import sinon from 'sinon-sandbox';
import wrap from 'mocha-wrap';

describe('the runner', () => {
  it('runs server if window is not defined', () => {
    const server = sinon.spy();
    hypernova({ server });
    assert.ok(server.calledOnce);
  });

  wrap().withGlobal('window', () => ({})).it('runs client when window exists', () => {
    const client = sinon.spy();
    hypernova({ client });
    assert.ok(client.calledOnce);
  });
});
