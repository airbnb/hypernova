import fs from 'fs';
import has from 'has';

import createVM from './createVM';

// This function takes in an Object of files and an Object that configures the VM. It will return
// a function that can be used as `getComponent` for Hypernova.
// The file's object structure is [componentName]: 'AbsolutePath.js'
export default (files, vmOptions) => {
  const fileEntries = Object.entries(files);

  const vm = createVM({
    cacheSize: fileEntries.length,
    ...vmOptions,
  });

  const resolvedFiles = fileEntries.reduce((components, [fileName, filePath]) => {
    const code = fs.readFileSync(filePath, 'utf-8');

    try {
      // Load the bundle on startup so we can cache its exports.
      vm.run(filePath, code);

      // Cache the code as well as the path to it.
      components[fileName] = { // eslint-disable-line no-param-reassign
        filePath,
        code,
      };
    } catch (err) {
      // If loading the component failed then we'll skip it.
      // istanbul ignore next
      console.error(err.stack);
    }

    return components;
  }, {});

  return (name) => {
    if (has(resolvedFiles, name)) {
      const { filePath, code } = resolvedFiles[name];
      return vm.run(filePath, code);
    }

    // The requested package was not found.
    return null;
  };
};
