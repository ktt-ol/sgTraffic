/// <reference path="typings/tsd.d.ts"/>
require('source-map-support').install();

import events = require('events');
import http = require('http');
import fs = require('fs');
import rrd = require('./rrd');

export interface SSE {
  message:string;
  channel:string;
}

export class Client {
  private messageCounter:number = 1;

  constructor(private req:http.ServerRequest, private res:http.ServerResponse) {
    req.once('close', () => {
      this.res = null;
      this.req = null;
    });

    this.writeStreamHeaders();
  }

  private writeStreamHeaders():void {
    this.res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    this.res.write('\n');
  }

  sendEvent(event:SSE) {
    if (!this.isActive()) {
      throw new Error('This client is not active anymore! Check this with #isActive() before.');
    }

    this.res.write(
        'event: ' + event.channel + '\n' +
        'id: ' + this.messageCounter + '\n' +
        'data: ' + event.message + '\n\n');
    this.messageCounter++;
  }

  isActive():boolean {
    return this.req !== null;
  }
}


export class Server {

  private em:events.EventEmitter = new events.EventEmitter();
  private connectedClients:Client[] = [];

  constructor(private port:number, private graphSource:rrd.GraphSource) {
  }

  // removes all inactive clients from the internal list
  private removeInactiveClients() {
    var clientCount = this.connectedClients.length;
    this.connectedClients = this.connectedClients.filter((client):boolean => {
      return client.isActive();
    });

//    if (this.connectedClients.length !== clientCount) {
//      console.log((clientCount - this.connectedClients.length), ' inactive clients removed.');
//    }
  }

  private send404(res:http.ServerResponse, reason:string) {
    res.statusCode = 404;
    res.end(reason);
  }


  private sendRrd(req:http.ServerRequest, res:http.ServerResponse) {
    this.graphSource.getGraph().then(
      file => {
        var stat = fs.statSync(file);

        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Content-Length': stat.size
        });

        var readStream = fs.createReadStream(file);
        readStream.pipe(res);
      },
      error => {
        console.log('send 404, because', error);
        this.send404(res, '');
      });
  }

  start():void {
    http.createServer((req, res) => {
//      console.log('Client connected', req.url);

      if (req.url.lastIndexOf('/rrd.png') === 0) {
        return this.sendRrd(req, res);
      }

      if (req.url.lastIndexOf('/updates') === 0) {
        var c = new Client(req, res);
        this.connectedClients.push(c);
        this.em.emit('connect', c);
        return;
      }

      this.send404(res, 'Not found.');
    }).listen(this.port);
    console.log('Server has started on port ', this.port);
  }

  sendToClients(event:SSE): void {
    this.removeInactiveClients();
//    console.log('Sending ', event, ' to ', this.connectedClients.length, ' clients.');
    this.connectedClients.forEach(client => {
      client.sendEvent(event);
    });
  }

  onNewClient(listenFn:Function):void {
    this.em.on('connect', listenFn);
  }
}


