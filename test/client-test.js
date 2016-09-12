import cheerio from 'cheerio';
import sinon from 'sinon-sandbox';
import wrap from 'mocha-wrap';
import { assert } from 'chai';
import { serialize, load } from '..';

function cheerioToDOM($, className) {
  return $(className).map((i, cheerioObj) => {
    const node = cheerioObj;
    node.nodeName = node.name.toUpperCase();
    node.innerHTML = $(node).html();
    node.getAttribute = attr => $(node).data(attr.replace('data-', ''));
    return node;
  })[0];
}

wrap().withGlobal('document', () => ({}))
  .withGlobal('window', () => ({}))
  .describe('hypernova client', () => {
    let result;
    beforeEach(() => {
      result = serialize('Component3', '<div>Hello World!</div>', { name: 'Serenity' });
    });

    it('should load up the DOM', () => {
      const $ = cheerio.load(result);

      const spy = sinon.spy();

      global.document.querySelector = (className) => {
        spy(className);
        return cheerioToDOM($, className);
      };
      global.document.querySelectorAll = classname => [cheerioToDOM($, classname)];

      // Calling it again for the client.
      load('Component3');

      assert.ok(spy.calledOnce, 'our spy was called');
    });

    it('should not be called unless there is a node', () => {
      global.document = {
        querySelector() {
          return null;
        },
        querySelectorAll() {
          return [];
        },
      };

      const arr = load('foo');

      assert.ok(arr.length === 0);

      delete global.document;
    });

    it('should be called if there is a node', () => {
      const $ = cheerio.load(result);

      global.document = {
        querySelector(className) {
          return cheerioToDOM($, className);
        },
        querySelectorAll(className) {
          return [cheerioToDOM($, className)];
        },
      };

      load('Component3').forEach(({ node, data }) => {
        assert.isDefined(node);
        assert.isObject(data, 'state is an object');
        assert.equal(data.name, 'Serenity', 'state obj has proper state');
      });
    });
  });
