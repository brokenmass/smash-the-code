'use strict';

var array = [
  ['1', '2', '3', '4', '5'],
  ['1', '2', '.', '.', '5'],
  ['1', '2', '.', '.', '5'],
  ['.', '.', '.', '.', '5']
];

var newArray = array[0].map(function (col, i) {
  return array.map(function (row) {
    if(row[i] !== '.') {
      return row[i];
    }
  });
});

console.log(newArray);
