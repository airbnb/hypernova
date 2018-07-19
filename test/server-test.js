import { assert } from 'chai';
import express from 'express';

describe('Hypernova server', () => {
  let hypernova;
  const getComponent = () => {};

  beforeEach(() => {
    try {
      [
        '../lib/utils/logger.js',
        '../lib/worker.js',
        '../lib/server.js',
        '../server.js',
      ].forEach(module => delete require.cache[require.resolve(module)]);

      hypernova = require('../server.js'); // eslint-disable-line global-require
    } catch (e) {
      console.error('Couldnt remove dependecy or load the hypernova module.');
    }
  });

  it('blows up if hypernova does not get getComponent', () => {
    assert.throws(hypernova, TypeError);
  });

  it('blows up if hypernova gets `createApplication` that isnt a function', () => {
    assert.throws(
      () => hypernova({
        devMode: true,
        getComponent,
        createApplication: {} }),
      TypeError);
  });

  it('blows up if hypernova gets `createApplication` that doesnt return an express app', () => {
    assert.throws(
      () => hypernova({
        devMode: true,
        getComponent,
        createApplication: () => {} }),
      TypeError);
  });

  it('starts up the hypernova server without blowing up', () => {
    hypernova({ devMode: true, getComponent });
  });

  it('starts up the hypernova server and an express instance without blowing up', () => {
    const APP_TITLE = 'my custom express instance';

    const createApplication = () => {
      const app = express();
      app.locals.name = APP_TITLE;

      return app;
    };

    const hypernovaServer = hypernova({
      devMode: true,
      getComponent,
      createApplication,
      port: 8090,
    });

    assert.equal(APP_TITLE, hypernovaServer.locals.name);
  });
});
