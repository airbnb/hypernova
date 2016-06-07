import Module from './Module';

function load(file, parent) {
  if (!file) return parent;

  const module = new Module(file, parent);
  module.load(file);
  module.run(file);
  return module;
}

function resolve(require, name) {
  try {
    return require.resolve(name);
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') return null;
    throw e;
  }
}

export default function loadModules(require, files) {
  return () => files.reduce((module, file) => load(resolve(require, file), module), null);
}
