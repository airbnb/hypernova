# Change Log

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [2.1.2] - 2017-06-16

### Changed

- Number of CPUs is now configurable.
- Host is configurable.

## [2.1.1] - 2017-06-15

### Changed

- You may now return a Promise from the top-level render function.


## [2.0.0] - 2016-09-15

### Breaking Changes

- `toScript` function signature changed. It now expects an object of data attributes to value.

  ```js
  // before
  toScript('foo', 'bar', { hello: 'world' })

  // now
  toScript({ foo: 'bar' }, { hello: 'world' })
  ```

- `fromScript` function signature changed.

  ```js
  // before
  fromScript('foo', 'bar')

  // now
  fromScript({ foo: 'bar' })
  ```

## [1.2.0] - 2016-09-08

### Changed

- Exceptions that are not Errors are no longer wrapped in an Error so the stack trace does not
  include the Hypernova callsite.

### Added

- Passing in `context` into `getComponent` which contains things like the `props` that the
  component will receive.

## [1.1.0] - 2016-06-15

### Changed

- Documentation fixes.
- Allows non-errors to be rejected from Promises in getComponent.
- Sets worker count to 1 when cpu count is 1.
- Makes the endpoint configurable.
- Exports worker functions so you can customize your own worker.

## [1.0.0] - 2016-06-06

Initial Release
