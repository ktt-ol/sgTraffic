/// <reference path="typings/tsd.d.ts"/>
require('source-map-support').install();

import events = require('events');
import http = require('http');


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

  constructor(private port:number) {
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

  start():void {
    http.createServer((req, res) => {
//      console.log('Client connected');
      var c = new Client(req, res);
      this.connectedClients.push(c);
      this.em.emit('connect', c);

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


