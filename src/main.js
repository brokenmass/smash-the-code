'use strict';

var GameMap = require('./GameMap');
var Evolution = require('./Evolution');

// game loop
while (true) {
  var i, x, y;
  var maps = new Array(2);
  var blocks = new Array(8);
  for (i = 0; i < 8; i++) {
    blocks[i] = readline().split(' ');
    blocks[i][0] = +blocks[i][0];
    blocks[i][1] = +blocks[i][1];
  }

  GameMap.resetCache();

  for (i = 0; i < 2; i++) {
    var map = [[], [], [], [], [], []];
    for (y = 11; y >= 0; y--) {
      var cols = readline().split('');
      for (x = 0; x < 6; x++) {
        if (cols[x] !== '.') {
          var color = +cols[x];
          map[x].unshift(color);
        }
      }
    }

    maps[i] = new GameMap(map);
  }

  var evolution = new Evolution(maps[0], blocks);
  var result = evolution.evolve();

  printErr(JSON.stringify(result.lastGenerationStats));
  printErr(JSON.stringify(result.runStats));
  printErr('roundCache', GameMap.roundCache._hits);
  printErr('turnCache', GameMap.turnCache._hits);
  printErr(JSON.stringify(result.best));

  var bestAction = result.best.phenotype[0] + ' ' + result.best.phenotype[1];
  print(bestAction, Math.round(result.best.fitness));
}
