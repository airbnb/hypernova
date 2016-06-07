import cheerio from 'cheerio';
import { assert } from 'chai';

export default {
  isIsomorphic(html) {
    const $ = cheerio.load(html);
    assert.ok(/___iso-html___/.test($('div').first().attr('class')), 'iso html exists');
    assert.ok(/___iso-state___/.test($('div').last().attr('class')), 'iso state exists');
  },

  isNotIsomorphic(html) {
    const $ = cheerio.load(html);
    assert.notOk(/___iso-html___/.test($('div').first().attr('class')), 'iso html does not exist');
    assert.notOk(/___iso-state___/.test($('div').last().attr('class')), 'iso state does not exist');
  },
};
