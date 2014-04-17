/// <reference path="typings/tsd.d.ts"/>
require('source-map-support').install();

import rawDataParser = require('./RawDataParser');
import Iptables = require('./Iptables');
import data = require('./data');
import rrd = require('./rrd');
import web = require('./web');
//import os = require('os');

// everything in SECONDS!
var TIMEOUT = 10;
var SHORT_STORAGE_TIME = 60;
var LONG_STORAGE_TIME = 60 * 10;

var storage = new data.Storage(LONG_STORAGE_TIME / TIMEOUT, TIMEOUT);
var rrdDb = new rrd.DB(__dirname + '/rrd/bandwidth.rrd', __dirname + '/rrd');
var server:web.Server = new web.Server(1337, rrdDb);
var clientList = [];


console.log('It`s now ', new Date());

var ipt;
if (process.env.NODE_ENV === 'test') {
  console.log('Starting in test mode!');
  ipt = new Iptables.FakeRunner(10);
} else {
  console.log('Starting in PRODUCTION mode!');
  ipt = new Iptables.Runner('sudo /usr/local/sbin/listAndClearStats.sh');
}


function runner() {
  ipt.readAndClear().done(
    data => {
      var result = rawDataParser.parse(data);
      var p:data.DataSet = {
        totalIn: result.totalIn,
        totalOut: result.totalOut,
        detailIn: result.inPerIp,
        detailOut: result.outPerIp
      };
      storage.addData(p);
      var avgShort:data.DataSet = storage.getAvgPerSecond(SHORT_STORAGE_TIME / TIMEOUT);
      var avgLong:data.DataSet = storage.getAvgPerSecond(LONG_STORAGE_TIME / TIMEOUT);

      var now = {
        totalIn: Math.round(p.totalIn / TIMEOUT),
        totalOut: Math.round(p.totalOut / TIMEOUT)
      };

      rrdDb.addEntry({
        upload: now.totalOut,
        download: now.totalIn
      });

      server.sendToClients({
        message: JSON.stringify({
          now: now,
          short: avgShort,
          long: avgLong
        }),
        channel: 'stats'
      });
      setTimeout(runner, TIMEOUT * 1000);
    },
    err => {
      console.error(err)
    });
}


console.log('Clearing iptables...');
ipt.clear();
setTimeout(runner, TIMEOUT * 1000);


//server.onNewClient(client => {
//});

server.start();

