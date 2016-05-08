'use strict';
var x, y, out;
var a = new Array(6);

var BENCHMARK_COUNT = 100000000;

console.time('round1');
for (y = 0; y < BENCHMARK_COUNT; y++) {
  out = ~~Math.random();
}

console.timeEnd('round1');
console.log(out);

console.time('round2');
for (y = 0; y < BENCHMARK_COUNT; y++) {
  out = Math.round(Math.random());
}

console.timeEnd('round2');
console.log(out);
