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

function clone1(serialized) {
  return JSON.parse(serialized);
}

function clone2(input) {
  var c = new Array(6);
  for (x = 0; x < 6; x++) {
    c[x] = [].concat(input[x]);
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

function clone3(serialized) {
  var c = [[],[],[],[],[],[]];
  var i = 0, x = 0, y = 0;
  for (i = 0; i < serialized.length; i++, y++) {
    if(serialized[i] === '|') {
      x++;
      y = -1;
    } else {
      c[x][y] = +serialized[i];
    }
  }

  return c;
}


var serialized;

serialized = JSON.stringify(a)
console.time('clone1');
for (y = 0; y < BENCHMARK_COUNT; y++) {
  out = clone1(serialized);
}

console.timeEnd('clone1');
console.log(out);

var input = new Array(6);
for (x = 0; x < 6; x++) {
  input[x] = [].concat(a[x]);
}
console.time('clone2');
for (y = 0; y < BENCHMARK_COUNT; y++) {
  out = clone2(input);
}

console.timeEnd('clone2');
console.log(out);



serialized = serialize3(a);
console.time('clone3');
for (y = 0; y < BENCHMARK_COUNT; y++) {
  out = clone3(serialized);
}

console.timeEnd('clone3');
console.log(out);
