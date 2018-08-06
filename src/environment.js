/* eslint func-names:0 no-extra-parens:0  */
import 'airbnb-js-shims';
import Promise from 'bluebird';

const es6methods = ['then', 'catch', 'constructor'];
const es6StaticMethods = ['all', 'race', 'resolve', 'reject', 'cast'];

function isNotMethod(name) {
  return !(es6methods.includes(name) || es6StaticMethods.includes(name) || name.charAt(0) === '_');
}

function del(obj) {
  /* eslint no-param-reassign: 0 */
  return (key) => { delete obj[key]; };
}

function toFastProperties(obj) {
  (function () {}).prototype = obj;
}

const PromiseCopy = Object.assign({}, Promise);
PromiseCopy.prototype = Object.assign({}, Promise.prototype);

Object.keys(Promise.prototype).filter(isNotMethod).forEach(del(PromiseCopy.prototype));
Object.keys(Promise).filter(isNotMethod).forEach(del(PromiseCopy));
toFastProperties(PromiseCopy);
toFastProperties(PromiseCopy.prototype);

global.Promise = PromiseCopy;
