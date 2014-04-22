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
  getGraph(start:string, width:number, height:number):Q.Promise<string>;
}

export class DB implements GraphSource {

  private RRD_CMD = 'rrdtool';
  // in seconds
  private GRAPH_CACHE_TIME = 60;

  private rrdEnabled = false;
  private lastGraphUpdate = {};

  constructor(private dbFile:string, private graphDir:string) {

    // check file
    if (!fs.existsSync(this.dbFile)) {
      console.warn('rrd database (' + this.dbFile + ') not found. Check the path or create a new db, you find some help in the readme file.');
      return;
    }


    // check tool
    exec(this.RRD_CMD, (error:Error, stdout:NodeBuffer, stderr:NodeBuffer) => {
      if (error) {
        console.warn('No working rrdtool found.', error);
        return;
      }

      console.info('Found rrdtool, using folder for tmp graphs:', this.graphDir);
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

  getGraph(start, width, height):Q.Promise<string> {
    if (!this.rrdEnabled) {
      return Q.reject('rrd not enabled');
    }

    start = start.match(/[0-9a-z-]+/)[0];
    if (!start || start.length === 0) {
      console.warn('Invalid start param', start);
      return Q.reject('Invalid start param');
    }

    var file = util.format('%s/graph_%dx%d_%s.png',
      this.graphDir, width, height, start);

    var key = start + '/' + width + '/' + height;
    if (this.lastGraphUpdate[key] && (Date.now() - this.lastGraphUpdate[key] < this.GRAPH_CACHE_TIME * 1000)) {
//      console.log('DEBUG: resolve with file ', file);
      return Q.resolve(file);
    }
    this.lastGraphUpdate[key] = Date.now();

    var cmd = util.format(
        '%s graph %s --start %s --end now --height %d --width %d ' +
        '--upper-limit=1682176 --lower-limit=0 --imgformat=PNG ' +
        'DEF:u=%s:upload:AVERAGE DEF:d=%s:download:AVERAGE ' +
        'AREA:d#008080:download AREA:u#FFA500:upload',
      this.RRD_CMD, file, start, height, width, this.dbFile, this.dbFile
    );

//    console.log(cmd);

    var deferred = Q.defer<string>();
    exec(cmd, (error:Error, stdout:NodeBuffer, stderr:NodeBuffer) => {
      if (error) {
        console.error('Can\'t create rrd graph: ', error);
        deferred.reject(stderr.toString());
        return;
      }

      console.log('DEBUG: graph created', stdout);
      deferred.resolve(file);
    });

    return deferred.promise;
  }
}