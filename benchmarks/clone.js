'use strict';
var x, y, out;
var a = new Array(6);

var BENCHMARK_COUNT = 1000000;

for (x = 0; x < 6; x++) {
  a[x] = [];
  for (var y = 0; y < (5 + Math.random() * 7); y++) {
    a[x].push(y);
  }
}

console.log(a);

function clone1(array) {
  return JSON.parse(JSON.stringify(array));
}

function clone2(array) {
  var b = new Array(6);
  for (x = 0; x < 6; x++) {
    b[x] = [].concat(array[x]);
  }

  var c = new Array(6);
  for (x = 0; x < 6; x++) {
    c[x] = [].concat(b[x]);
  }

  return c;
}

function serialize3(array) {
  var x,z,out = '';
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

function clone3(array) {
  var b = serialize3(array);

  var c = [[],[],[],[],[],[]];
  var i = 0, x = 0, y = 0;
  for (i = 0; i < b.length; i++, y++) {
    if(b[i] === '|') {
      x++;
      y = -1;
    } else {
      c[x][y] = +b[i];
    }
  }

  return c;
}

console.time('clone1');
for (y = 0; y < BENCHMARK_COUNT; y++) {
  out = clone1(a);
}

console.timeEnd('clone1');
console.log(out);

console.time('clone2');
for (y = 0; y < BENCHMARK_COUNT; y++) {
  out = clone2(a);
}

console.timeEnd('clone2');
console.log(out);

console.time('clone3');
for (y = 0; y < BENCHMARK_COUNT; y++) {
  out = clone3(a);
}

console.timeEnd('clone3');
console.log(out);
