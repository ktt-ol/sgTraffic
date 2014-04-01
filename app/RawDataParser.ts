/// <reference path="typings/tsd.d.ts"/>
require('source-map-support').install();

export var TRAFFIC_IN = 'TRAFFIC_ACCT_IN';
export var TRAFFIC_OUT = 'TRAFFIC_ACCT_OUT';

export class Stats {
  totalIn:number = 0;
  totalOut:number = 0;

  // last ip byte
  inPerIp:number[] = [];
  outPerIp:number[] = [];

  constructor() {
    // init the array with 0
    for (var ip = 0; ip < 256; ip++) {
      this.inPerIp[ip] = 0;
      this.outPerIp[ip] = 0;
    }
  }

  print() {
    console.log('total in/out', this.totalIn, this.totalOut);
    console.log('in/out perIp with > 0 bytes');
    var ipIndex, bin, bout;
    for (ipIndex = 0; ipIndex < 256; ipIndex++) {
      bin = this.inPerIp[ipIndex];
      bout = this.outPerIp[ipIndex];
      if (bin > 0 || bout > 0) {
        console.log('x.x.x.' + (ipIndex + 1), bin, bout);
      }
    }
  }
}

enum TrafficType {
  IN, OUT
}

export function parse(rawData:string):Stats {
  var result:Stats = new Stats();
  var lines:string[];

  function parseTraffic(lineNumber:number, type:TrafficType):number {
    lineNumber++;
    var i, column, bytes, destination, lastByte;
    for (i = lineNumber + 1; i < lines.length; i++) {
      column = splitBySpace(lines[i]);
      if (column.length != 8) {
        return i;
      }
      bytes = parseInt(column[1], 10);
      destination = column[type === TrafficType.IN ? 7 : 6];
      lastByte = getLastByteFromIp(destination);
      (type === TrafficType.IN ? result.inPerIp : result.outPerIp)[lastByte - 1] = bytes;
    }

    return i;
  }

  // split the line by spaces and I don't want to have any spaces in the array left
  function splitBySpace(input:string):string[] {
    return input.split(/\s+/).filter(val => val !== '');
  }

  function getLastByteFromIp(ip:string):number {
    var value = ip.substring(ip.lastIndexOf('.') + 1);
    return parseInt(value, 10);
  }

  function parseTotal(lineNumber:number) {
    lineNumber++;
    [lines[lineNumber + 1], lines[lineNumber + 2]].forEach(line => {
      var columns = splitBySpace(line);
      var target = columns[2];
      var bytes = parseInt(columns[1], 10);
      if (target === TRAFFIC_IN) {
        result.totalIn = bytes;
      } else if (target === TRAFFIC_OUT) {
        result.totalOut = bytes;
      } else {
        throw new Error('Unexpected target: ' + target);
      }
    });
    return lineNumber + 3;
  }

  lines = rawData.split(/\n/);

  var lineCounter, line;
  for (lineCounter = 0; lineCounter < lines.length; lineCounter++) {
    line = lines[lineCounter];
    if (line.indexOf('Chain FORWARD') === 0) {
      lineCounter = parseTotal(lineCounter);
    } else if (line.indexOf('Chain ' + TRAFFIC_IN) === 0) {
      lineCounter = parseTraffic(lineCounter, TrafficType.IN);
    } else if (line.indexOf('Chain ' + TRAFFIC_OUT) === 0) {
      lineCounter = parseTraffic(lineCounter, TrafficType.OUT);
    } else {
//      console.log('Unexpected line: ' + line);
    }
  }

  return result;
}
