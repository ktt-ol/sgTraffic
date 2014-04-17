/// <reference path="typings/tsd.d.ts"/>
require('source-map-support').install();

import Q = require('q');
import fs = require('fs');
import util = require('util');
var exec = require('child_process').exec;

export interface Entry {
  upload:number;
  download:number;
}

export interface GraphSource {
  getGraph():Q.Promise<string>;
}

export class DB implements GraphSource {

  private RRD_CMD = 'rrdtool';
  // in seconds
  private GRAPH_CACHE_TIME = 60;

  private rrdEnabled = false;
  private rrdFile:string = null;
  private lastGraphUpdate:number = 0;

  constructor(private dbFile:string, private graphDir:string) {

    // check file
    if (!fs.existsSync(this.dbFile)) {
      console.warn('rrd database (' + this.dbFile + ') not found. Check the path or create a new db, you find some help in the readme file.');
      return;
    }

    this.rrdFile = this.graphDir + '/currentRrd.png';

    // check tool
    exec(this.RRD_CMD, (error:Error, stdout:NodeBuffer, stderr:NodeBuffer) => {
      if (error) {
        console.warn('No working rrdtool found.', error);
        return;
      }

      console.info('Found rrdtool, using tmp file:', this.rrdFile);
      this.rrdEnabled = true;
    });
  }

  addEntry(entry:Entry) {
    if (!this.rrdEnabled) {
      return;
    }

    var cmd = util.format('%s update %s N:%s:%s', this.RRD_CMD, this.dbFile, entry.upload, entry.download);
//    console.log(cmd);
    exec(cmd, (error:Error, stdout:NodeBuffer, stderr:NodeBuffer) => {
      if (error) {
        console.error('Can\'t add data row to rrd: ', error);
        return;
      }

//      console.log('ok', stdout.toString());
    });
  }

  getGraph():Q.Promise<string> {
    if (!this.rrdEnabled) {
      return Q.reject('rrd not enabled');
    }

    if (Date.now() - this.lastGraphUpdate < this.GRAPH_CACHE_TIME * 1000) {
      return Q.resolve(this.rrdFile);
    }

    this.lastGraphUpdate = Date.now();
    var timeParam = '--start end-7d --end now';
    var cmd = util.format(
        '%s graph %s %s --height 600 --width 1000 ' +
        'DEF:u=%s:upload:AVERAGE DEF:d=%s:download:AVERAGE ' +
        'LINE1:u#0000FF:"upload\l" LINE1:d#00CCFF:"download\l"',
      this.RRD_CMD, this.rrdFile, timeParam, this.dbFile, this.dbFile
    );
//    console.log(cmd);

    var deferred = Q.defer<string>();
    exec(cmd, (error:Error, stdout:NodeBuffer, stderr:NodeBuffer) => {
      if (error) {
        console.error('Can\'t create rrd graph: ', error);
        deferred.reject(error);
        return;
      }

      console.log('DEBUG: graph created', stdout);
      deferred.resolve(this.rrdFile);
    });

    return deferred.promise;
  }
}