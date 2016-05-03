'use strict';
var x, y, z, out;
var a = new Array(6);

var BENCHMARK_COUNT = 1000000;

for (x = 0; x < 6; x++) {
  a[x] = [];
  for (var y = 0; y < (5 + Math.random() * 7); y++) {
    a[x].push(y);
  }
}
console.log(a)
function serialize1(array) {
  return JSON.stringify(array);
}

function serialize2(array) {
  var b = new Array(6);
  for (x = 0; x < 6; x++) {
    b[x] = array[x].join(',');
  }

  return b.join('|');
}

function serialize3(array) {
  var out = '';
  for (x = 0; x < 6; x++) {
    var row = array[x];
    var rowLen = row.length;
    for (z = 0; z < rowLen; z++) {
      out += row[z];
    }
    out += '|';
  }
  return out
}

console.time('serialize1');
for (y = 0; y < BENCHMARK_COUNT; y++) {
  out = serialize1(a);
}

console.timeEnd('serialize1');
console.log(out);


console.time('serialize2');
for (y = 0; y < BENCHMARK_COUNT; y++) {
  out = serialize2(a);
}

console.timeEnd('serialize2');
console.log(out);


console.time('serialize3');
for (y = 0; y < BENCHMARK_COUNT; y++) {
  out = serialize3(a);
}

console.timeEnd('serialize3');
console.log(out);
