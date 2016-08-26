const LEFT = '<!--';
const RIGHT = '-->';

const ENCODE = [
  ['&', '&amp;'],
  ['>', '&gt;'],
];

const DATA_KEY = 'hypernova-key';

// https://gist.github.com/jed/982883
function uuid() {
  return (
    [1e7] +
    -1e3 +
    -4e3 +
    -8e3 +
    -1e11
  ).replace(
    /[018]/g,
    x => (x ^ Math.random() * 16 >> x / 4).toString(16)
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

function toScript(attr, key, props, id) {
  return `<script type="application/json" data-${attr}="${key}" data-hypernova-id=${id}>${LEFT}${encode(props)}${RIGHT}</script>`; // eslint-disable-line max-len
}

function fromScript(attr, key, id) {
  const idSelector = id ? `[data-hypernova-id="${id}"]` : '';
  const node = document.querySelector(`script[data-${attr}="${key}"]${idSelector}`);
  if (!node) return null;
  const jsonPayload = node.innerHTML;

  return decode(jsonPayload.slice(LEFT.length, jsonPayload.length - RIGHT.length));
}

function serialize(name, html, data) {
  const key = name.replace(/\W/g, '');
  const id = uuid();
  const markup = `<div data-${DATA_KEY}="${key}" data-hypernova-id=${id}>${html}</div>`;
  const script = toScript(DATA_KEY, key, data, id);
  return `${markup}\n${script}`;
}

function load(name) {
  const key = name.replace(/\W/g, '');
  const nodes = document.querySelectorAll(`div[data-${DATA_KEY}="${key}"]`);

  return Array.prototype.map.call(nodes, (node) => {
    const id = node.getAttribute('data-hypernova-id');
    const data = fromScript(DATA_KEY, key, id);
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
