# Change Log

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [2.4.0] - 2018-08-04

### Added
- Add option to pass an express instance in the configuration (#132)

### Docs
- Update README.md: correctly use curly quotation marks (#143)

## [2.3.0] - 2018-08-04

### Added
- [deps] allow `airbnb-js-shims v2 or v3

## [2.2.6] - 2018-05-10

### Added

- Allow logger instance to be injected

## [2.2.5] - 2018-04-05

### Added

- Handle timeout in coordinator shutdown to kill workers that have not shut down.

## [2.2.4] - 2018-03-20

### Changed

- Refactor server/worker configuration into smaller pieces to be exported

## [2.2.3] - 2018-03-01

### Changed

- Clear timeout set in raceTo

## [2.2.2] - 2018-02-26

### Added

- Option to execute jobs in a batch serially, rather than concurrently

## [2.2.1] - 2018-02-26

Bit of a flub with dist-tags, skipped version

## [2.2.0] - 2017-10-06

### Changed

- If no HTML is returned from the render function then Hypernova will reject the Promise.

## [2.1.3] - 2017-06-16

### Added

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
