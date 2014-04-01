/// <reference path="typings/tsd.d.ts"/>
require('source-map-support').install();

export interface DataSet {
  totalIn:number;
  totalOut:number;
  detailIn:number[];
  detailOut:number[];
}

export class Ring {
  private value:number[];
  private pointer:number = 0;
  private valuesCount:number = 0;

  constructor(private size:number) {
    this.value = [];
    for (var i = 0; i < size; i++) {
      this.value[i] = 0;
    }
  }

  add(entry:number) {
    if (typeof entry !== 'number') {
      entry = 0;
    }
    this.value[this.pointer] = entry;
    this.pointer = (this.pointer + 1) % this.size;

    // avoid number overflow ;)
    if (this.size > this.valuesCount) {
      this.valuesCount++;
    }
  }

  getAvgPerSecond(slots:number, secondsBetweenSlots:number):number {
    if (this.size < slots) {
      throw new Error('argument must not greater than size of this buffer');
    }
    if (slots === 0) {
      throw new Error('argument must greater than 0');
    }
    if (this.valuesCount < slots) {
      if (this.valuesCount === 0) {
        return 0;
      }

      // we have less values count as requested
      slots = this.valuesCount;
    }

    var index, sum = 0;
    for (var s = 1; s <= slots; s++) {
      // I want to have always a positive index
      index = (this.pointer - s + this.size) % this.size;
      sum += this.value[index];
    }
    return Math.round(sum / slots / secondsBetweenSlots);
  }
}

export class Storage {

  private tIn:Ring;
  private tOut:Ring;
  private dIn:Ring[] = [];
  private dOut:Ring[] = [];


  constructor(private size:number, private secondsBetweenSlots:number) {
    this.tIn = new Ring(size);
    this.tOut = new Ring(size);

    for (var i=0; i<256; i++) {
      this.dIn[i] = new Ring(size);
      this.dOut[i] = new Ring(size);
    }
  }

  addData(p:DataSet) {
    this.tIn.add(p.totalIn);
    this.tOut.add(p.totalOut);
    for (var i = 0; i < 256; i++) {
      this.dIn[i].add(p.detailIn[i]);
      this.dOut[i].add(p.detailOut[i]);
    }
  }

  getAvgPerSecond(amount:number):DataSet {
    if (this.size < amount) {
      throw new Error('entries must not greater than size of this buffer');
    }

    return {
      totalIn: this.tIn.getAvgPerSecond(amount, this.secondsBetweenSlots),
      totalOut: this.tOut.getAvgPerSecond(amount, this.secondsBetweenSlots),
      detailIn: this.dIn.map(entry => entry.getAvgPerSecond(amount, this.secondsBetweenSlots)),
      detailOut: this.dOut.map(entry => entry.getAvgPerSecond(amount, this.secondsBetweenSlots))
    };
  }
}
