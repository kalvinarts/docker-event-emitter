# docker-event-emitter

## Subscribe to events from a [dockerode](https://github.com/apocas/dockerode) instance in a meaningful way

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

### Installation

`npm i -S docker-event-emitter`

### Usage

You can subscribe to:

* __event__: recieves all events
* __\<Type\>__: recieves all events for the selected Type (container, volume, network, ...)
* __\<Type\>.\<Action\>__: recieves all events for the seleced Type and Action

For a complete list of all available Types and Actions check the [events section of the Docker API docs](https://docs.docker.com/engine/api/v1.37/#operation/SystemEvents).

This example is pretty much self explanatory:

```javascript
const Docker = require('dockerode');
const DockerEventEmitter = require('docker-event-emitter');

(async function main() {

  // Setup a dockerode
  const docker = new Docker({
    socketPath: '/var/run/docker.sock',
  });
  
  // Setup the DockerEventEmitter
  const events = new DockerEvents(docker);

  // Subscribe to events
  events
    .on('event', ev => {
      // This will be triggered on any event
      console.log(ev);
    })
    .on('container', ev => {
      // This will be triggered on any  Type='container' event
      console.log(ev);
    })
    .on('network.connect', ev => {
      // This will be triggered on any  Type='network' and Action='connect' event
      console.log(ev);
    });

  // Start recieving events
  await events.start();

}).catch(err =>
  console.log(err.message, err.stack) && process.exit(1)
);
```
