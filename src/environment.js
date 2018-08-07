/* eslint func-names:0 no-extra-parens:0  */
import 'airbnb-js-shims';
import StrictPromise from './utils/strict-promise';

global.Promise = StrictPromise;
