'use strict';

//////////////////////////////////////////////////////////////////////////////////

var GameMap = require('./benchmarks/map');

//////////////////////////////////////////////////////////////////////////////////

var actions = [];
for (var z = 0; z < 20; z++) {
  var test = new GameMap();
  var rotation = Math.floor(Math.random() * 4);
  var minColumn = 0;
  var colCount = 6;
  if (rotation === 0) {
    minColumn = 0;
    colCount = 5;
  } else if (rotation === 2) {
    minColumn = 1;
    colCount = 5;
  }

  var column = minColumn + Math.floor(Math.random() * colCount);
  var block = [Math.floor(2 + Math.random() * 5), Math.floor(2 + Math.random() * 5)];

  actions.push({ block: block, column: column, rotation: rotation });
}

var list = [];
var test = new GameMap();
while (true) {
  var blocks = new Array(8);
  for (var i = 0; i < 8; i++) {
    blocks[i] = readline().split(' ');
    blocks[i][0] = +blocks[i][0] + 1;
    blocks[i][1] = +blocks[i][1] + 1;
  }

  for (var i = 0; i < 12; i++) {
    var row = readline();
  }

  for (var i = 0; i < 12; i++) {
    var row = readline(); // One line of the map ('.' = empty, '0' = skull block, '1' to '5' = colored block)
  }

  // Write an action using print()
  // To debug: printErr('Debug messages...');



  var start = Date.now();
  var prev = start;
  var i = 0;

  var totalRunTime = 0;
  var runTime = 0;
  var runTimes = [];
  while (totalRunTime + runTime < 90) {
    var branch = test.clone();
    for (var z = 0; z < 4; z++) {
      branch.add(actions[z].block, actions[z].column, actions[z].rotation);
    }
    i++;
    if (i % 500 === 0) {
      var now = Date.now();
      totalRunTime = now - start;
      runTime = now - prev;
      prev = now;
      runTimes.push(runTime);
    }
  }


  list.push(i);
  printErr('cache size:', GameMap.roundCache.size || Object.keys(GameMap.roundCache).length);
  printErr('cache hits:', GameMap.roundCache._hits || GameMap.rcHits);
  printErr('round:', i);
  printErr('avg:',~~(list.reduce(function(a,b) {return a+b},0)/list.length));
  // "x rotation": the column in which to drop your pair of blocks folowed by its rotation (0, 1, 2 or 3)

  test.add(blocks[0], blocks[0][0] - 1, 1);
  //test.debugMap();

  print(( blocks[0][0] - 1) + ' 1');
}
