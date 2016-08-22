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

  wrap()
  .withGlobal('document', () => ({}))
  .describe('with fromScript', () => {
    it('loads the escaped content correctly', () => {
      const html = toScript('a', 'b', { foo: '</script>', bar: '&gt;', baz: '&amp;' });
      const $ = cheerio.load(html);

      global.document.querySelector = () => ({ innerHTML: $($('script')[0]).html() });

      const res = fromScript('a', 'b');

      assert.isObject(res);

      assert.equal(res.foo, '</script>');
      assert.equal(res.bar, '&gt;');
      assert.equal(res.baz, '&amp;');
    });

    it('escapes multiple times the same, with interleaved decoding', () => {
      const makeHTML = () => toScript('attr', 'key', {
        props: 'yay',
        needsEncoding: '" &gt; </script>', // "needsEncoding" is necessary
      });
      const script1 = makeHTML();
      const script2 = makeHTML();
      assert.equal(script1, script2, 'two successive toScripts result in identical HTML');

      const $ = cheerio.load(script1);

      global.document.querySelector = () => ({ innerHTML: $($('script')[0]).html() });

      const res = fromScript('attr', 'key');

      const script3 = makeHTML();
      assert.equal(
        script1,
        script3,
        'third toScript after a fromScript call results in the same HTML'
      );

      assert.isObject(res);

      assert.equal(res.props, 'yay');
    });
  });
});
