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

  //GameMap.resetCache();

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
    generations: 20,
    populationSize: 40,
    immigration: 2,
    maxRuntime: 20
  });
  var totalEnemyNuisance = 0;
  var enemyNuisance = [0, 0, 0, 0, 0, 0, 0, 0];
  var attackingAt = null;
  var enemyEvolutionResult = enemyEvolution.evolve();
  stores[1] = enemyEvolution.store;
  if (enemyEvolutionResult.best) {
    var enemyResults = enemyEvolutionResult.best.results;
    printErr(enemyEvolutionResult.best.results)
    for (i = 0; i < enemyResults.length; i++) {
      if (enemyResults[i].points) {
        totalEnemyNuisance += (enemyResults[i].points / 70);
        if (totalEnemyNuisance > 6) {
          enemyNuisance[i] = ~~(totalEnemyNuisance / 6);
          totalEnemyNuisance -= (enemyNuisance[i] * 6);
          attackingAt = attackingAt !== null ? attackingAt : i;
        }
      }
    }
  }

  printErr('enemyNuisance', enemyNuisance);
  var evolutionConfig = {
    enemyNuisance: enemyNuisance,
    map: maps[0],
    blocks: blocks,
    phenotypes: stores[0],
    maxRuntime: 85 - enemyEvolutionResult.runStats.totalRunTime
  };
  var message = ' ';
  if (attackingAt !== null) {
    message += 'ENEMY will attack in ' + attackingAt + ' turns';
    printErr('PREVENTION MODE');
  }

  var evolution = new Evolution(evolutionConfig);
  var result = evolution.evolve();
  stores[0] = result.store;
  printErr(JSON.stringify(result.lastGenerationStats));
  printErr(JSON.stringify(result.runStats.testedPhenotypes));
  if (result.best) {
    var bestAction = result.best.phenotype[0] + ' ' + result.best.phenotype[1];
    var roundPoint = result.best.results[0].points;
    points[0] += roundPoint;
    printErr('ROUND', roundPoint);
    printErr('TOTAL', points[0]);
    print(bestAction, ~~(result.best.fitness) + message);
  } else {
    print('3 0');
  }
}
