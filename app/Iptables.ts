/// <reference path="typings/tsd.d.ts"/>
require('source-map-support').install();

var exec = require('child_process').exec;
import Q = require('q');
import fs = require('fs');

export interface Do {
  readAndClear(): Q.Promise<string>;
  clear(): Q.Promise<string>;
}


export class Runner implements Do {
  constructor(private executable:string) {
  }


  readAndClear():Q.Promise<string> {
    var deferred = Q.defer<string>();
    var process = exec(this.executable, (error:Error, stdout:NodeBuffer, stderr:NodeBuffer) => {
      if (error) {
        deferred.reject({ msg: 'Could not call the iptables.', excp: error});
        return;
      }

      deferred.resolve(stdout.toString());
    });

    return deferred.promise;
  }

  clear():Q.Promise<string> {
    var deferred = Q.defer<string>();
    exec(this.executable, (error:Error, stdout:NodeBuffer, stderr:NodeBuffer) => {
      if (error) {
        deferred.reject({ msg: 'Could not call the iptables.', excp: error});
        return;
      }

      deferred.resolve(stdout.toString());
    });

    return deferred.promise;
  }
}


export class FakeRunner implements Do {

  private template:string;
  private ipInTemplate = '       0        {{BYTES}}            all  --  *      *       0.0.0.0/0            {{IP}}';
  private ipOutTemplate = '       0        {{BYTES}}            all  --  *      *       {{IP}}          0.0.0.0/0';

  constructor(private createIps:number) {
    this.template = fs.readFileSync(__dirname + '/fakeIptables.tpl').toString();
  }

  private getRandomInt(min:number, max:number):number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private makeIpLine(template:string, bytes:number, ip:string) {
    return template
      .replace('{{BYTES}}', bytes.toString())
      .replace('{{IP}}', ip)
      + '\n';
  }


  readAndClear():Q.Promise<string> {
    var min = 400;
    var max = 785 * 1000;

    var inIp = '', outIp = '', totalBytesIn = 0, totalBytesOut = 0;
    var ip, bytesIn, bytesOut, i;
    for (i = 1; i <= this.createIps; i++) {
      ip = '192.168.20.' + i;
      bytesIn = this.getRandomInt(min, max);
      totalBytesIn += bytesIn;
      bytesOut = this.getRandomInt(min, max);
      totalBytesOut += bytesOut;
      inIp += this.makeIpLine(this.ipInTemplate, bytesIn, ip);
      outIp += this.makeIpLine(this.ipOutTemplate, bytesOut, ip);
    }

    var result = this.template
      .replace('{{BYTES_IN}}', totalBytesIn.toString())
      .replace('{{BYTES_OUT}}', totalBytesOut.toString())
      .replace('{{IP_IN}}', inIp)
      .replace('{{IP_OUT}}', outIp);

    return Q.when(result);
  }

  clear():Q.Promise<string> {
    return Q.when('');
  }
}