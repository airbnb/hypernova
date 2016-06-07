import cheerio from 'cheerio';
import wrap from 'mocha-wrap';
import { assert } from 'chai';
import { serialize, toScript, fromScript } from '..';

describe('escaping', () => {
  it('escapes', () => {
    const html = serialize('foo', '', { foo: '</script>', bar: '&gt;' });

    assert.include(html, '</script&gt;');
    assert.include(html, '&amp;gt;');
  });

  wrap().withGlobal('document', () => ({})).it('loads the escaped content correctly', () => {
    const html = toScript('a', 'b', { foo: '</script>', bar: '&gt;', baz: '&amp;' });
    const $ = cheerio.load(html);

    global.document.querySelector = () => ({ innerHTML: $($('script')[0]).html() });

    const res = fromScript('a', 'b');

    assert.isObject(res);

    assert.equal(res.foo, '</script>');
    assert.equal(res.bar, '&gt;');
    assert.equal(res.baz, '&amp;');
  });
});
