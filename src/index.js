/* globals document */

const LEFT = '<!--';
const RIGHT = '-->';

const ENCODE = [
  ['&', '&amp;'],
  ['>', '&gt;'],
];

const DATA_KEY = 'hypernova-key';
const DATA_ID = 'hypernova-id';

// https://gist.github.com/jed/982883
function uuid() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(
    /[018]/g,
    x => (x ^ Math.random() * 16 >> x / 4).toString(16), // eslint-disable-line no-mixed-operators, no-bitwise, max-len
  );
}

function encode(obj) {
  return ENCODE.reduce((str, coding) => {
    const [encodeChar, htmlEntity] = coding;
    return str.replace(new RegExp(encodeChar, 'g'), htmlEntity);
  }, JSON.stringify(obj));
}

function decode(res) {
  const jsonPayload = ENCODE.reduceRight((str, coding) => {
    const [encodeChar, htmlEntity] = coding;
    return str.replace(new RegExp(htmlEntity, 'g'), encodeChar);
  }, res);

  return JSON.parse(jsonPayload);
}

function makeValidDataAttribute(attr, value) {
  const encodedAttr = attr.toLowerCase().replace(/[^0-9a-z_-]/g, '');
  const encodedValue = value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return `data-${encodedAttr}="${encodedValue}"`;
}

function toScript(attrs, data) {
  const dataAttributes = Object.keys(attrs).map(name => makeValidDataAttribute(name, attrs[name]));
  return `<script type="application/json" ${dataAttributes.join(' ')}>${LEFT}${encode(data)}${RIGHT}</script>`; // eslint-disable-line max-len
}

function fromScript(attrs) {
  const selectors = Object.keys(attrs)
    .map(name => `[${makeValidDataAttribute(name, attrs[name])}]`)
    .join('');
  const node = document.querySelector(`script${selectors}`);
  if (!node) return null;
  const jsonPayload = node.innerHTML;

  return decode(jsonPayload.slice(LEFT.length, jsonPayload.length - RIGHT.length));
}

function serialize(name, html, data) {
  const key = name.replace(/\W/g, '');
  const id = uuid();
  const markup = `<div data-${DATA_KEY}="${key}" data-${DATA_ID}="${id}">${html}</div>`;
  const script = toScript({
    [DATA_KEY]: key,
    [DATA_ID]: id,
  }, data);
  return `${markup}\n${script}`;
}

function load(name) {
  const key = name.replace(/\W/g, '');
  const nodes = document.querySelectorAll(`div[data-${DATA_KEY}="${key}"]`);

  return Array.prototype.map.call(nodes, (node) => {
    const id = node.getAttribute(`data-${DATA_ID}`);
    const data = fromScript({
      [DATA_KEY]: key,
      [DATA_ID]: id,
    });
    return { node, data };
  });
}

export default function hypernova(runner) {
  return typeof window === 'undefined'
    ? runner.server()
    : runner.client();
}

hypernova.toScript = toScript;
hypernova.fromScript = fromScript;
hypernova.serialize = serialize;
hypernova.load = load;
