/* globals document */

const LEFT = '<!--';
const RIGHT = '-->';

const ENCODE = [
  ['&', '&amp;'],
  ['>', '&gt;'],
];

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

function backwardCompat(node, attr, key) {
  return `${node}[data-mystique-key="${key}"],${node}[data-${attr}="${key}"]`;
}

function toScript(attr, key, props) {
  return `<script type="application/json" data-${attr}="${key}">${LEFT}${encode(props)}${RIGHT}</script>`; // eslint-disable-line max-len
}

function fromScript(attr, key) {
  const node = document.querySelector(backwardCompat('script', attr, key));
  if (!node) return null;
  const jsonPayload = node.innerHTML;
  return decode(jsonPayload.slice(LEFT.length, jsonPayload.length - RIGHT.length));
}

function serialize(name, html, data) {
  const key = name.replace(/\W/g, '');
  const markup = `<div data-hypernova-key="${key}">${html}</div>`;
  const script = toScript('hypernova-key', key, data);
  return `${markup}\n${script}`;
}

function load(name) {
  const key = name.replace(/\W/g, '');
  const node = document.querySelector(backwardCompat('div', 'hypernova-key', key));
  if (!node) return {};

  const data = fromScript('hypernova-key', key);
  return { node, data };
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
