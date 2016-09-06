import { assert } from 'chai';
import path from 'path';

import { getFiles } from '../server';

describe('getFiles', () => {
  it('retrieves files', () => {
    const files = getFiles(path.join('test', 'components'));
    assert(files.length, 2);
    assert.property(files[0], 'name');
    assert.property(files[0], 'path');
  });
});
