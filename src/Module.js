import NativeModule from 'module';
import has from 'has';
import path from 'path';
import { ok } from 'assert';
import { runInNewContext } from 'vm';

const NativeModules = process.binding('natives');

// This means that you won't be able to affect VM extensions by mutating require.extensions
// this is cool since we can now have different extensions for VM than for where your program is
// running.
// If you want to add an extension then you can use addExtension defined and exported below.
const moduleExtensions = { ...NativeModule._extensions };

function isNativeModule(id) {
  return has(NativeModules, id);
}

// Creates a sandbox so we don't share globals across different runs.
function createContext() {
  const sandbox = {
    Buffer,
    clearImmediate,
    clearInterval,
    clearTimeout,
    setImmediate,
    setInterval,
    setTimeout,
    console,
    process,
  };
  sandbox.global = sandbox;
  return sandbox;
}

// This class should satisfy the Module interface that NodeJS defines in their native module.js
// implementation.
class Module {
  constructor(id, parent) {
    const cache = parent ? parent.cache : null;
    this.id = id;
    this.exports = {};
    this.cache = cache || {};
    this.parent = parent;
    this.filename = null;
    this.loaded = false;
    this.context = parent ? parent.context : createContext();
  }

  load(filename) {
    ok(!this.loaded);
    this.filename = filename;
    this.paths = NativeModule._nodeModulePaths(path.dirname(filename));
  }

  run(filename) {
    const ext = path.extname(filename);
    const extension = moduleExtensions[ext] ? ext : '.js';
    moduleExtensions[extension](this, filename);
    this.loaded = true;
  }

  require(filePath) {
    ok(typeof filePath === 'string', 'path must be a string');
    return Module.loadFile(filePath, this);
  }

  _compile(content, filename) {
    const self = this;

    function require(filePath) {
      return self.require(filePath);
    }
    require.resolve = request => NativeModule._resolveFilename(request, this);
    require.main = process.mainModule;
    require.extensions = moduleExtensions;
    require.cache = this.cache;

    const dirname = path.dirname(filename);

    // create wrapper function
    const wrapper = NativeModule.wrap(content);

    const options = {
      filename,
      displayErrors: true,
    };

    const compiledWrapper = runInNewContext(wrapper, this.context, options);
    return compiledWrapper.call(this.exports, this.exports, require, this, filename, dirname);
  }

  static load(id, filename = id) {
    const module = new Module(id);
    module.load(filename);
    module.run(filename);
    return module;
  }

  static loadFile(file, parent) {
    const filename = NativeModule._resolveFilename(file, parent);

    if (parent) {
      const cachedModule = parent.cache[filename];
      if (cachedModule) return cachedModule.exports;
    }

    if (isNativeModule(filename)) {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      return require(filename);
    }

    const module = new Module(filename, parent);

    module.cache[filename] = module;

    let hadException = true;

    try {
      module.load(filename);
      module.run(filename);
      hadException = false;
    } finally {
      if (hadException) {
        delete module.cache[filename];
      }
    }

    return module.exports;
  }

  static addExtension(ext, f) {
    moduleExtensions[ext] = f;
  }
}

export default Module;
