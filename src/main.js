'use strict';

var GameMap = require('./GameMap');

// game loop
while (true) {
  var i, x, y;
  var maps = new Array(2);
  var blocks = new Array(8);
  for (i = 0; i < 8; i++) {
    blocks[i] = readline().split(' ');
  }

  for (i = 0; i < 2; i++) {
    var map = [[], [], [], [], [], []];
    for (y = 11; y >= 0; y--) {
      var cols = readline().split('');
      for (x = 0; x < 6; x++) {
        if (cols[x] !== '.') {
          map[x].unshift({
            color: +cols[x]
          });
        }
      }
    }

    maps[i] = new GameMap(map);
  }

  var expectedScore = maps[0].add(blocks[0], blocks[0][0]);
  printErr(JSON.stringify(expectedScore));

  // Write an action using print()
  // To debug: printErr('Debug messages...');

  print(blocks[0][0]); // "x": the column in which to drop your blocks
}
