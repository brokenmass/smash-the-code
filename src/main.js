'use strict';

var GameMap = require('./GameMap');
var Evolution = require('./Evolution');

var colors = require('./colors');

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

  for (i = 0; i < 2; i++) {
    var map = [[], [], [], [], [], []];
    for (y = 11; y >= 0; y--) {
      var cols = readline().split('');
      for (x = 0; x < 6; x++) {
        if (cols[x] !== '.') {
          var color = +cols[x];
          map[x].unshift({
            color: color,
            colorName: colors[color]
          });
        }
      }
    }

    maps[i] = new GameMap(map);
  }

  var evo = new Evolution(maps[0], blocks);
  var best = evo.best();
  printErr(JSON.stringify(best));

  print(best.phenotype[0].join(' '), 'meh');
}
