import lruCache from 'lru-cache';
import crypto from 'crypto';
import Module from './Module';

function defaultGetKey(name, code) {
  const hash = crypto.createHash('sha1').update(code).digest('hex');
  return `${name}::${hash}`;
}

export default (options = {}) => {
  // This is to cache the entry point of all bundles which makes running on a vm blazing fast.
  // Everyone gets their own sandbox to play with and nothing is leaked between requests.
  // We're caching with `code` as the key to ensure that if the code changes we break the cache.
  const exportsCache = lruCache({
    max: options.cacheSize,
  });

  const getKey = options.getKey || defaultGetKey;

  return {
    exportsCache,

    run(name, code) {
      const key = getKey(name, code);

      if (exportsCache.has(key)) return exportsCache.get(key);

      const environment = options.environment && options.environment(name);

      const module = new Module(name, environment);
      module.load(name);
      module._compile(code, name);

      exportsCache.set(key, module.exports);

      return module.exports;
    },
  };
};
