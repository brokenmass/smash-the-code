'use strict';

var GameMap = require('./GameMap');
var Evolution = require('./Evolution');

// game loop
var points = [0, 0];
var stores = [[], []];

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

  var enemyEvolution = new Evolution({
    map: maps[1],
    blocks: blocks,
    phenotypes: stores[1],
    steps: 4,
    //minPoints: 420,
    optimizeFor: 1,
    generations: 30,
    populationSize: 50,
    immigration: 2,
    maxRuntime: 20
  });
  var attackingAt = null;
  var enemyEvolutionResult = enemyEvolution.evolve();
  stores[1] = enemyEvolution.store;
  if (enemyEvolutionResult.best) {
    var enemyResults = enemyEvolutionResult.best.fitness.results;
    for (i = 0; i < enemyResults.length; i++) {
      if (enemyResults[i].points && enemyResults[i].points > 420) {
        attackingAt = i;
        break;
      }
    }
  }

  var evolutionConfig = {
    map: maps[0],
    blocks: blocks,
    phenotypes: stores[0],
    maxRuntime: 85 - enemyEvolutionResult.runStats.totalRunTime
  };
  var message = ' ';
  if (attackingAt !== null) {
    message += 'ENEMY ATTACKING in ' + attackingAt + ' turns';
    printErr('PREVENTION MODE');
    evolutionConfig.optimizeFor = Math.max(0, attackingAt - 1);
    if (attackingAt === 0) {
      evolutionConfig.steps = 1;
    }
  }

  var evolution = new Evolution(evolutionConfig);
  var result = evolution.evolve();
  stores[0] = result.store;
  printErr(JSON.stringify(result.lastGenerationStats));
  printErr(JSON.stringify(result.runStats.testedPhenotypes));
  printErr(JSON.stringify(result.best.phenotype));

  var bestAction = result.best.phenotype[0] + ' ' + result.best.phenotype[1];
  var roundPoint = result.best.fitness.results[0].points;
  points[0] += roundPoint;
  printErr('ROUND', roundPoint);
  printErr('TOTAL', points[0]);
  print(bestAction, ~~(result.best.fitness.summary) + message);
}
