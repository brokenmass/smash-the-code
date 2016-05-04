'use strict';

var GameMap = require('./src/GameMap');
var Evolution = require('./src/Evolution')

global.printErr = print;

var map = new GameMap([[],[],[],[],[],[]]);
var blocks = [];
for (var x = 0; x < 8; x++) {
  blocks.push(~~(1 + Math.random() * 5), ~~(1 + Math.random() * 5));
}
print(blocks);
var evolution = new Evolution(map, blocks);
var result = evolution.evolve();

printErr(JSON.stringify(result.lastGenerationStats));
printErr(JSON.stringify(result.runStats));
printErr('roundCache', GameMap.roundCache._hits);
printErr('turnCache', GameMap.turnCache._hits);
printErr(JSON.stringify(result.best));

var bestAction = result.best.phenotype[0] + ' ' + result.best.phenotype[1];
