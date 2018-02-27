import { assert } from 'chai';
import renderBatch from '../lib/utils/renderBatch';

class Response {
  status(status) {
    this._status = status;
    return this;
  }

  json(res) {
    this._json = res;
    return this;
  }

  end() {} // eslint-disable-line class-methods-use-this

  getResponse() {
    return {
      status: this._status,
      json: this._json,
    };
  }
}

class Request {
  constructor() {
    this.body = {
      a: {
        name: 'HypernovaExample',
        data: {},
      },
    };
  }
}

function makeExpress() {
  const req = new Request();
  const res = new Response();

  return { req, res };
}

describe('renderBatch', () => {
  [true, false].forEach((processJobsConcurrently) => {
    describe(`when processJobsConcurrently is ${processJobsConcurrently}`, () => {
      it('returns a batch properly', (done) => {
        const expressRoute = renderBatch({
          getComponent() {
            return null;
          },
          plugins: [],
          processJobsConcurrently,
        }, () => false);

        const { req, res } = makeExpress();

        expressRoute(req, res).then(() => {
          assert.isObject(res.getResponse());

          const { status, json } = res.getResponse();

          assert.isDefined(status);

          assert.equal(status, 200);

          assert.isTrue(json.success);
          assert.isNull(json.error);

          const { a } = json.results;
          assert.isDefined(a);
          assert.property(a, 'html');
          assert.property(a, 'meta');
          assert.property(a, 'duration');
          assert.property(a, 'success');
          assert.property(a, 'error');

          done();
        });
      });

      it('rejects a Promise with a string and its ok', (done) => {
        const expressRoute = renderBatch({
          getComponent() {
            return Promise.reject('Nope');
          },
          plugins: [],
          processJobsConcurrently,
        }, () => false);

        const { req, res } = makeExpress();

        expressRoute(req, res).then(() => {
          const { json } = res.getResponse();
          const { a } = json.results;

          assert.equal(a.error.name, 'Error');
          assert.equal(a.error.message, 'Nope');

          done();
        });
      });

      it('rejects a Promise with a ReferenceError', (done) => {
        const expressRoute = renderBatch({
          getComponent() {
            return Promise.reject(new ReferenceError());
          },
          plugins: [],
          processJobsConcurrently,
        }, () => false);

        const { req, res } = makeExpress();

        expressRoute(req, res).then(() => {
          const { json } = res.getResponse();
          const { a } = json.results;

          assert.equal(a.error.name, 'ReferenceError');

          done();
        });
      });

      it('rejects a Promise with an Array', (done) => {
        const expressRoute = renderBatch({
          getComponent() {
            return Promise.reject([1, 2, 3]);
          },
          plugins: [],
          processJobsConcurrently,
        }, () => false);

        const { req, res } = makeExpress();

        expressRoute(req, res).then(() => {
          const { json } = res.getResponse();
          const { a } = json.results;

          assert.equal(a.error.name, 'Error');
          assert.equal(a.error.message, '1,2,3');

          done();
        });
      });
    });
  });
});
