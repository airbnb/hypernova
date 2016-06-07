import glob from 'glob';
import path from 'path';

export default function getFiles(fullPathStr) {
  return glob.sync(path.join(fullPathStr, '**', '*.js')).map((file) => {
    const name = path.relative(fullPathStr, file);
    return {
      name,
      path: file,
    };
  });
}
