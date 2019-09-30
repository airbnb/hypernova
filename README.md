# Hypernova

> A service for server-side rendering your JavaScript views

[![Join the chat at https://gitter.im/airbnb/hypernova](https://badges.gitter.im/airbnb/hypernova.svg)](https://gitter.im/airbnb/hypernova?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[![NPM version](https://badge.fury.io/js/hypernova.svg)](http://badge.fury.io/js/hypernova)
[![Build Status](https://secure.travis-ci.org/airbnb/hypernova.svg?branch=master)](http://travis-ci.org/airbnb/hypernova)
[![Dependency Status](https://david-dm.org/airbnb/hypernova.svg)](https://david-dm.org/airbnb/hypernova)

## Why?

First and foremost, server-side rendering is a better user experience compared to just client-side rendering. The user gets the content faster, the webpage is more accessible when JS fails or is disabled, and search engines have an easier time indexing it.

Secondly, it provides a better developer experience. Writing the same markup twice both on the server in your preferred templating library and in JavaScript can be tedious and hard to maintain. Hypernova lets you write all of your view code in a single place without having to sacrifice the user’s experience.

## How?

![Diagram that visually explains how hypernova works](docs/hypernova-how-it-works.png)

1. A user requests a page on your server.
1. Your server then gathers all the data it needs to render the page.
1. Your server uses a Hypernova client to submit an HTTP request to a Hypernova server.
1. Hypernova server computes all the views into an HTML string and sends them back to the client.
1. Your server then sends down the markup plus the JavaScript to the browser.
1. On the browser, JavaScript is used to progressively enhance the application and make it dynamic.

## Terminology

* **hypernova/server** - Service that accepts data via HTTP request and responds with HTML.
* **hypernova** - The universal component that takes care of turning your view into the HTML structure it needs to server-render. On the browser it bootstraps the server-rendered markup and runs it.
* **hypernova-${client}** - This can be something like `hypernova-ruby` or `hypernova-node`. It is the client which gives your application the superpower of querying Hypernova and understanding how to fallback to client-rendering in case there is a failure.

## Get Started

First you’ll need to install a few packages: the server, the browser component, and the client. For development purposes it is recommended to install either alongside the code you wish to server-render or in the same application.

From here on out we’ll assume you’re using [`hypernova-ruby`](https://github.com/airbnb/hypernova-ruby) and `React` with [`hypernova-react`](https://github.com/airbnb/hypernova-react).

### Node

```sh
npm install hypernova --save
```

This package contains both the server and the client.

Next, lets configure the development server. To keep things simple we can put the configuration in your root folder, it can be named something like `hypernova.js`.

```js
var hypernova = require('hypernova/server');

hypernova({
  devMode: true,

  getComponent(name) {
    if (name === 'MyComponent.js') {
      return require('./app/assets/javascripts/MyComponent.js');
    }
    return null;
  },

  port: 3030,
});
```

Only the `getComponent` function is required for Hypernova. All other configuration options are optional. [Notes on `getComponent` can be found below](#getcomponent).

We can run this server by starting it up with node.

```sh
node hypernova.js
```

If all goes well you should see a message that says "Connected". If there is an issue, a stack trace should appear in `stderr`.

### Rails

If your server code is written in a language other than Ruby, then you can build your own client for Hypernova. A [spec](docs/client-spec.md) exists and details on how clients should function as well as fall-back in case of failure.

Add this line to your application’s Gemfile:

```ruby
gem 'hypernova'
```

And then execute:

    $ bundle

Or install it yourself as:

    $ gem install hypernova

Now lets add support on the Rails side for Hypernova. First, we’ll need to create an initializer.

`config/initializers/hypernova_initializer.rb`

```ruby
Hypernova.configure do |config|
  config.host = "localhost"
  config.port = 3030            # The port where the node service is listening
end
```

In your controller, you’ll need an `:around_filter` so you can opt into Hypernova rendering of view partials.

```ruby
class SampleController < ApplicationController
  around_filter :hypernova_render_support
end
```

And then in your view we `render_react_component`.

```ruby
<%= render_react_component('MyComponent.js', :name => 'Hypernova The Renderer') %>
```

### JavaScript

Finally, lets set up `MyComponent.js` to be server-rendered. We will be using React to render.

```js
const React = require('react');
const renderReact = require('hypernova-react').renderReact;

function MyComponent(props) {
  return <div>Hello, {props.name}!</div>;
}

module.exports = renderReact('MyComponent.js', MyComponent);
```

Visit the page and you should see your React component has been server-rendered. If you’d like to confirm, you can view the source of the page and look for `data-hypernova-key`. If you see a `div` filled with HTML then your component was server-rendered, if the `div` is empty then there was a problem and your component was client-rendered as a fall-back strategy.

If the `div` was empty, you can check `stderr` where you’re running the node service.

## Debugging

The [developer plugin](https://github.com/airbnb/hypernova-ruby/blob/master/lib/hypernova/plugins/development_mode_plugin.rb) for [`hypernova-ruby`](https://github.com/airbnb/hypernova-ruby) is useful for debugging issues with Hypernova and why it falls back to client-rendering. It’ll display a warning plus a stack trace on the page whenever a component fails to render server-side.

You can install the developer plugin in `examples/simple/config/environments/development.rb`

```ruby
require 'hypernova'
require 'hypernova/plugins/development_mode_plugin'

Hypernova.add_plugin!(DevelopmentModePlugin.new)
```

You can also check the output of the server. The server outputs to `stdout` and `stderr` so if there is an error, check the process where you ran `node hypernova.js` and you should see the error.

## Deploying

The recommended approach is running two separate servers, one that contains your server code and another that contains the Hypernova service. You’ll need to deploy the JavaScript code to the server that contains the Hypernova service as well.

Depending on how you have `getComponent` configured, you might need to restart your Hypernova service on every deploy. If `getComponent` caches any code then a restart is paramount so that Hypernova receives the new changes. Caching is recommended because it helps speed up the service.

## FAQ

> Isn’t sending an HTTP request slow?

There isn’t a lot of overhead or latency, especially if you keep the servers in close proximity to each other. It’s as fast as compiling many ERB templates and gives you the benefit of unifying your view code.

> Why not an in-memory JS VM?

This is a valid option. If you’re looking for a siloed experience where the JS service is kept separate, then Hypernova is right for you. This approach also lends itself better to environments that don’t already have a JS VM available.

> What if the server blows up?

If something bad happens while Hypernova is attempting to server-render your components it’ll default to failure mode where your page will be client-rendered instead. While this is a comfortable safety net, the goal is to server-render every request.

## Pitfalls

These are pitfalls of server-rendering JavaScript code and are not specific to Hypernova.

* You’ll want to do any DOM-related manipulations in `componentDidMount`. `componentDidMount` runs
  on the browser but not the server, which means it’s safe to put DOM logic in there.
  Putting logic outside of the component, in the constructor, or in `componentWillMount` will
  cause the code to fail since the DOM isn’t present on the server.

* It is recommended that you run your code in a VM sandbox so that requests get a fresh new
  JavaScript environment. In the event that you decide not to use a VM, you should be aware that
  singleton patterns and globals run the risk of leaking memory and/or leaking data
  between requests. If you use `createGetComponent` you’ll get VM by default.

## Clients

See [clients.md](docs/clients.md)

## Browser

The included browser package is a barebones helper which renders markup on the server and then loads it on the browser.

List of compatible browser packages:

* [`hypernova-react`](https://github.com/airbnb/hypernova-react)
* [`hypernova-aphrodite`](https://github.com/airbnb/hypernova-aphrodite)
* [`hypernova-styled-components`](https://github.com/viatsko/hypernova-styled-components)

## Server

Starting up a Hypernova server

```js
const hypernova = require('hypernova/server');

hypernova({
  getComponent: require,
});
```

Options, and their defaults

```js
{
  // the limit at which body parser will throw
  bodyParser: {
    limit: 1024 * 1000,
  },
  // runs on a single process
  devMode: false,
  // how components will be retrieved,
  getComponent: undefined,
  // if not overridden, default will return the number of reported cpus  - 1
  getCPUs: undefined,
  // the host the app will bind to
  host: '0.0.0.0',
  // configure the default winston logger
  logger: {},
  // logger instance to use instead of the default winston logger
  loggerInstance: undefined,
  // the port the app will start on
  port: 8080,
  // default endpoint path
  endpoint: '/batch',
  // whether jobs in a batch are processed concurrently
  processJobsConcurrently: true,
  // arguments for server.listen, by default set to the configured [port, host]
  listenArgs: null,
  // default function to create an express app
  createApplication: () => express()
}
```

#### `getComponent`

This lets you provide your own implementation on how components are retrieved.

The most common use-case would be to use a VM to keep each module sandboxed between requests. You can use `createGetComponent` from Hypernova to retrieve a `getComponent` function that does this.

`createGetComponent` receives an Object whose keys are the component’s registered name and the value is the absolute path to the component.

```js
const path = require('path');

hypernova({
  getComponent: createGetComponent({
    MyComponent: path.resolve(path.join('app', 'assets', 'javascripts', 'MyComponent.js')),
  }),
});
```

The simplest `getComponent` would be to use `require`. One drawback here is that your components would be cached between requests and thus could leak memory and/or data. Another drawback is that the files would have to exist relative to where this require is being used.

```js
hypernova({
  getComponent: require,
});
```

You can also fetch components asynchronously if you wish, and/or cache them. Just return a `Promise` from `getComponent`.

```js
hypernova({
  getComponent(name) {
    return promiseFetch('https://MyComponent');
  },
});
```

#### `getCPUs`

This lets you specify the number of cores Hypernova will run workers on. Receives an argument containing the number of cores as reported by the OS.

If this method is not overridden, or if a falsy value is passed, the default method will return the number of reported cores minus 1.

#### `loggerInstance`
This lets you provide your own implementation of a logger as long as it has a `log()` method.

```js
const winston = require('winston');
const options = {};

hypernova({
  loggerInstance: new winston.Logger({
        transports: [
          new winston.transports.Console(options),
        ],
      }),
});
```

#### `processJobsConcurrently`

This determines whether jobs in a batch are processed concurrently or serially.  Serial execution is preferable if you use a renderer that is CPU bound and your plugins do not perform IO in the per job hooks.

#### `createApplication`
This lets you provide your own function that creates an express app.
You are able to add your own express stuff like more routes, middlewares, etc.
Notice that you __must__ pass a function that returns an express app without calling the `listen` method!

```js
const express = require('express');
const yourOwnAwesomeMiddleware = require('custom-middleware');

hypernova({
  createApplication: function() {
    const app = express();
    app.use(yourOwnAwesomeMiddleware);

    app.get('/health', function(req, res) {
      return res.status(200).send('OK');
    });

    // this is mandatory.
    return app;
  }
```

## API

### Browser

#### load

```typescript
type DeserializedData = { [x: string]: any };
type ServerRenderedPair = { node: HTMLElement, data: DeserializedData };

function load(name: string): Array<ServerRenderedPair> {}
```

Looks up the server-rendered DOM markup and its corresponding `script` JSON payload and returns it.

#### serialize

```typescript
type DeserializedData = { [x: string]: any };

function serialize(name: string, html: string, data: DeserializedData): string {}
```

Generates the markup that the browser will need to bootstrap your view on the browser.

#### toScript

```typescript
type DeserializedData = { [x: string]: any };
type Attributes = { [x: string]: string };

function toScript(attrs: Attributes, props: DeserializedData): string {}
```

An interface that allows you to create extra `script` tags for loading more data on the browser.

#### fromScript

```typescript
type DeserializedData = { [x: string]: any };
type Attributes = { [x: string]: string };

function fromScript(attrs: Attributes): DeserializedData {}
```

The inverse of `toScript`, this function runs on the browser and attempts to find and `JSON.parse` the contents of the server generated script.
`attrs` is an object where the key will be a `data-key` to be placed on the element, and the value is the data attribute's value.

The `serialize` function uses the attributes `DATA_KEY` and `DATA_ID` to generate the data markup. They can be used in the `fromScript` function to get the serialized data.

```typescript
import { DATA_KEY, DATA_ID } from 'hypernova'

fromScript({
    [DATA_KEY]: key,
    [DATA_ID]: id,
 });
```

### Server

#### [createGetComponent](src/createGetComponent.js)

```typescript
type Files = { [key: string]: string };
type VMOptions = { cacheSize: number, environment?: () => any };
type GetComponent = (name: string) => any;

function createGetComponent(files: Files, vmOptions: VMOptions): GetComponent {}
```

Creates a `getComponent` function which can then be passed into Hypernova so it knows how to retrieve your components. `createGetComponent` will create a VM so all your bundles can run independently from each other on each request so they don’t interfere with global state. Each component is also cached at startup in order to help speed up run time. The files Object key is the component’s name and its value is the absolute path to the component.

#### [createVM](src/createVM.js)

```typescript
type VMOptions = { cacheSize: number, environment?: () => any };
type Run = (name: string, code: string) => any;
type VMContainer = { exportsCache: any, run: Run };

function createVM(options: VMOptions): VMContainer {}
```

Creates a VM using Node’s [`vm`](https://nodejs.org/api/vm.html) module. Calling `run` will run the provided code and return its `module.exports`. `exportsCache` is an instance of [`lru-cache`](https://github.com/isaacs/node-lru-cache).

#### [getFiles](src/getFiles.js)

```typescript
function getFiles(fullPathStr: string): Array<{name: string, path: string}> {}
```

A utility function that allows you to retrieve all JS files recursively given an absolute path.

#### [Module](src/Module.js)

`Module` is a class that mimics Node’s [`module`](https://github.com/nodejs/node/blob/master/lib/module.js) interface. It makes `require` relative to whatever directory it’s run against and makes sure that each JavaScript module runs in its own clean sandbox.

#### [loadModules](src/loadModules.js)

```typescript
function loadModules(require: any, files: Array<string>): () => Module? {}
```

Loads all of the provided files into a `Module` that can be used as a parent `Module` inside a `VM`. This utility is useful when you need to pre-load a set of shims, shams, or JavaScript files that alter the runtime context. The `require` parameter is Node.js’ `require` function.




                                 Apache License
                           Version 2.0, January 2004
                        https://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   APPENDIX: How to apply the Apache License to your work.

      To apply the Apache License to your work, attach the following
      boilerplate notice, with the fields enclosed by brackets "[]"
      replaced with your own identifying information. (Don't include
      the brackets!)  The text should be enclosed in the appropriate
      comment syntax for the file format. We also recommend that a
      file or class name and description of purpose be included on the
      same "printed page" as the copyright notice for easier
      identification within third-party archives.

   Copyright [2019] [Rolando Gopez Lacuata]

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       https://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
