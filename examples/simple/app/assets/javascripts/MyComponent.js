const React = require('react');
const { renderReact } = require('hypernova-react');

function MyComponent(props) {
  return React.createElement('div', {
    onClick() {
      alert('Click handlers work.');
    },
  }, `Hello, ${props.name}!`);
}

module.exports = renderReact('MyComponent.js', MyComponent);
