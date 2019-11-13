const { Transform, Writable } = require('stream');
const { EventEmitter } = require('events');

const debug = require('debug')('docker-event-emitter');

class DockerEventEmitter extends EventEmitter {
  constructor(docker) {
    super();
    this.docker = docker;
    this.running = false;
    this.eventsStream = null;
    this.transformStream = null;
    this.emitterStream = null;
  }

  async start() {
    debug('Starting events stream ...');

    let {
      docker, running,
      eventsStream, transformStream, emitterStream,
    } = this;

    if (running) return this;
    running = true;
    
    transformStream = new Transform({
      bufferStr: '',
      transform(chunk, enc, next) {
        const str = chunk.toString();

        if (!str) return next();

        this.bufferStr += str;

        if (/\n/.test(this.bufferStr)) {

          const events = this.bufferStr
            .split(/\n/)
            // WTF: ...something strange happens and undefined
            // is prepended to the string. Get rid of it
            .map(s => s.replace(/^undefined/, ''));

          for (let [i, json] of events.entries()) {
            if (i === events.length -1) {
              this.bufferStr = json;
            } else {
              try {
                this.push(json);
              } catch (err) {
                this.emit('error', err);
              }
            }
          }
        }

        next();
      },
      flush(done) {
        if (this.bufferStr) {
          try {
            JSON.parse(this.bufferStr);
            this.push(this.bufferStr);
            done(null, this.bufferStr);
          } catch (err) {
            done(err);
          }
        }
      },
    });

    emitterStream = new Writable({
      write: (json, enc, next) => {
        const obj = JSON.parse(json);
        const { Type, Action } = obj;

        this.emit(Type, obj);
        this.emit(`${Type}.${Action}`, obj);
        this.emit('event', obj);

        next();
      },
    });
    
    eventsStream = await docker.getEvents();
    transformStream.pipe(emitterStream);
    eventsStream.pipe(transformStream);

    debug('Events stream running');

    return this;
  }

  stop() {
    debug('Stopping events stream ...');

    let { running, eventsStream, transformStream, emitterStream } = this;

    if (!running) return this;
    
    eventsStream.unpipe(emitterStream);
    transformStream.unpipe(emitterStream);
    
    eventsStream.destroy();
    eventsStream = null;

    transformStream.destroy();
    transformStream = null;

    emitterStream.destroy();
    emitterStream = null;

    running = false;

    debug('Events stream halted');

    return this;
  }
}

module.exports = DockerEventEmitter;
