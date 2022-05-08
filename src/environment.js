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

Object.keys(Promise.prototype).filter(isNotMethod).forEach(del(Promise.prototype));
Object.keys(Promise).filter(isNotMethod).forEach(del(Promise));
toFastProperties(Promise);
toFastProperties(Promise.prototype);

global.Promise = Promise;
