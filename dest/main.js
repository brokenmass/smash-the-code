/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var GameMap = __webpack_require__(1);
	var Evolution = __webpack_require__(4);

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


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var colors = __webpack_require__(2);

	var turnCache = { _hits: 0 };
	var roundCache = { _hits: 0 };

	function GameMap(initalMap) {
	  this._map = initalMap;
	  this._debug = false;
	}

	GameMap.prototype.debug = function debug(message) {
	  if (this._debug) {
	    printErr(message);
	  }
	};

	GameMap.prototype.serialize = function serialize() {
	  var x, y, row, rowLen, out = '';
	  for (x = 0; x < 6; x++) {
	    row = this._map[x];
	    rowLen = row.length;
	    for (y = 0; y < rowLen; y++) {
	      out += row[y];
	    }

	    out += '|';
	  }

	  return out;
	};

	GameMap.prototype.clone = function clone() {
	  return new GameMap(this.cloneMap(this._map));
	};

	GameMap.prototype.cloneMap = function cloneMap(original) {
	  var map = new Array(6);
	  for (var x = 0; x < 6; x++) {
	    map[x] = [].concat(original[x]);
	  }

	  return map;
	};

	var rotations = [1, 0, -1, 0];
	GameMap.prototype.add = function add(block, column1, rotation) {

	  var column2 = column1 + rotations[rotation];
	  if (column2 < 0 || column2 >= 6) {
	    //printErr(action + ' - out of bound');
	    return false;
	  }

	  if (
	    (column1 === column2 && (this._map[column1].length > 10)) ||
	    (column1 !== column2 && (this._map[column1].length > 11 || this._map[column2].length > 11))
	  ) {
	    return false;
	  }

	  if (rotation === 3) {
	    this._map[column1].push(block[1]);
	    this._map[column2].push(block[0]);
	  } else {
	    this._map[column1].push(block[0]);
	    this._map[column2].push(block[1]);
	  }

	  return this.calcTurnScore();
	};

	GameMap.prototype.calcTurnScore = function calcTurnScore() {
	  var id = this.serialize();
	  var tc = turnCache[id];
	  if (tc) {
	    turnCache._hits++;
	    this._map = this.cloneMap(tc.map);
	    return tc.turnScore;
	  }

	  var turnScore = {
	    points: 0,
	    labelPoints: 0,
	    destroyedSkulls: 0,
	    chains: -1
	  };

	  var roundScore = this.calcRoundScore();
	  turnScore.labelPoints = roundScore.labelPoints;
	  while (roundScore.points) {
	    turnScore.chains++;
	    var bonus = roundScore.groupBonus;
	    if (roundScore.colorBonus) {
	      bonus += Math.pow(2, roundScore.colorBonus);
	    }

	    if (turnScore.chains) {
	      bonus += (Math.pow(2, turnScore.chains - 1) * 8);
	    }

	    bonus = Math.max(1, Math.min(999, bonus));
	    turnScore.points += roundScore.points * bonus;

	    turnScore.destroyedSkulls += roundScore.destroyedSkulls;

	    roundScore = this.calcRoundScore();
	    turnScore.labelPoints = roundScore.labelPoints;
	  }

	  turnCache[id] = {
	    map: this.cloneMap(this._map),
	    turnScore: turnScore
	  };

	  return turnScore;
	};

	GameMap.prototype.calcRoundScore = function calcRoundScore() {
	  var id = this.serialize();
	  var x, y, i, cell, len;
	  var rc = roundCache[id];

	  if (rc) {
	    roundCache._hits++;
	    this._map = this.cloneMap(rc.map);
	    return rc.roundScore;
	  }

	  this._labels = [];
	  this._labelsMap = [[], [], [], [], [], []];

	  for (x = 0; x < 6; x++) {
	    len = this._map[x].length;
	    for (y = 0; y < len; y++) {
	      cell = this._map[x][y];

	      if (cell !== 0 && !this._labelsMap[x][y]) {
	        var newLabel = {
	          color: cell,
	          cellsCount: 0,
	          skullsCount: 0,
	          cellsToRemove: []
	        };
	        this._labels.push(newLabel);
	        this.dfs(x, y, newLabel);
	      }
	    }
	  }

	  var points = 0;
	  var labelPoints = 0;
	  var groupBonus = 0;
	  var destroyedColors = {};
	  var destroyedSkulls = 0;

	  var labelsLength = this._labels.length;
	  for (i = 0; i < labelsLength; i++) {
	    var label = this._labels[i];
	    if (label.cellsCount >= 4) {
	      // happy time !
	      points += (10 * label.cellsCount);
	      destroyedSkulls += label.skullsCount;
	      if (label.cellsCount >= 11) {
	        groupBonus += 8;
	      } else {
	        groupBonus += label.cellsCount - 4;
	      }

	      destroyedColors[label.color] = true;
	      var cellsToRemoveLength = label.cellsToRemove.length;
	      for (x = 0; x < cellsToRemoveLength; x++) {
	        cell = label.cellsToRemove[x];
	        this._map[cell[0]][cell[1]] = null;
	      }
	    } else {
	      labelPoints += label.cellsCount * label.cellsCount * label.cellsCount;
	    }
	  }

	  if (points) {
	    for (x = 0; x < 6; x++) {
	      this._map[x] = this._map[x].filter(function (cell) {
	        return cell !== null;
	      });
	    }
	  }

	  //printErr(JSON.stringify(this._labels));
	  var colorBonus = Object.keys(destroyedColors).length - 1;

	  var roundScore = {
	    points: points,
	    labelPoints: labelPoints,
	    destroyedSkulls: destroyedSkulls,
	    labelsCount: this._labels.length,
	    colorBonus: colorBonus,
	    groupBonus: groupBonus
	  };

	  roundCache[id] = {
	    map: this.cloneMap(this._map),
	    roundScore: roundScore
	  };

	  return roundScore;
	};

	var dx = [+1, 0, -1, 0];
	var dy = [0, +1, 0, -1];
	GameMap.prototype.dfs = function dfs(x, y, currentLabel) {
	  if (
	      (x < 0 || x >= 6) || // out of bounds
	      (y < 0 || y >= 12) // out of bounds
	    ) {
	    return;
	  }

	  var cell = this._map[x][y];
	  if (
	      (cell === undefined) || // invalid cell
	      (this._labelsMap[x][y]) // already labeled
	    ) {
	    return;
	  }

	  if (cell === 0) {
	    // mark the cell only as one to remove
	    currentLabel.cellsToRemove.push([x, y]);

	    // increment skull counter
	    currentLabel.skullsCount++;
	  }

	  if (cell === currentLabel.color) {
	    // mark the current cell
	    currentLabel.cellsToRemove.push([x, y]);
	    this._labelsMap[x][y] = true;

	    // increment cell counter
	    currentLabel.cellsCount++;

	    // recursively mark the neighbors
	    for (var direction = 0; direction < 4; ++direction) {
	      this.dfs(x + dx[direction], y + dy[direction], currentLabel);
	    }
	  }
	};

	GameMap.prototype.debugMap = function debugMap() {
	  printErr('------');
	  for (var y = 11; y >= 0; y--) {
	    var row = '';
	    for (var x = 0; x < 6; x++) {
	      row += this._map[x][y] ? colors[this._map[x][y]][0] : '.';
	    }

	    printErr(row);
	  }

	  printErr('------');
	};

	GameMap.resetCache = function () {
	  turnCache = { _hits: 0 };
	  roundCache = { _hits: 0 };
	  GameMap.turnCache = turnCache;
	  GameMap.roundCache = roundCache;
	};

	GameMap.turnCache = turnCache;
	GameMap.roundCache = roundCache;
	module.exports = GameMap;


/***/ },
/* 2 */
/***/ function(module, exports) {

	'use strict';

	module.exports = ['Skull', 'Blue', 'Green', 'Purple', 'Red', 'Yellow'];


/***/ },
/* 3 */,
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var GeneticAlgorithm = __webpack_require__(5);

	var phenotypesStore = [];

	function Evolution(map, blocks) {
	  this._debug = false;
	  this._map = map;
	  this._blocks = blocks;

	  this._steps = 6;
	  this._generations = 1000;
	  this._populationSize = 40;

	  this._maxRuntime = 90;

	  this._algorithm = new GeneticAlgorithm({
	    immigration: 5,
	    phenotypes: phenotypesStore,
	    generations: this._generations,
	    populationSize: this._populationSize,
	    seedFunction: this.seedFunction.bind(this),
	    fitnessFunction: this.fitnessFunction.bind(this),
	    crossoverFunction: this.crossoverFunction.bind(this),
	    mutationFunction: this.mutationFunction.bind(this),
	    surviveFunction: this.surviveFunction.bind(this),
	    terminationFunction: this.terminationFunction.bind(this)
	  });
	}

	Evolution.prototype.debug = function debug(message) {
	  if (this._debug) {
	    printErr(message);
	  }
	};

	Evolution.prototype.seedFunction = function seedFunction(index, reseedCount) {
	  var length = Math.max(1, this._steps - reseedCount) * 2;
	  var phenotype = new Array(length);
	  for (var i = 0; i < length; i += 2) {
	    var rotation = Math.floor(Math.random() * 4);
	    var minColumn = 0;
	    var colcount = 6;
	    if (rotation === 0) {
	      minColumn = 0;
	      colcount = 5;
	    } else if (rotation === 2) {
	      minColumn = 1;
	      colcount = 5;
	    }

	    var column = minColumn + Math.floor(Math.random() * colcount);
	    phenotype[i] = column;
	    phenotype[i + 1] = rotation;
	  }

	  return phenotype;
	};

	Evolution.prototype.fitnessFunction = function fitnessFunction(phenotype) {
	  var map = this._map.clone();
	  var results = [];
	  var fitness = 0;
	  var blockIndex = 0;
	  var len = phenotype.length;
	  for (var x = 0; x < len; x += 2, blockIndex++) {
	    var result = map.add(this._blocks[blockIndex], phenotype[x], phenotype[x + 1]);
	    if (!result) {
	      return -100;
	    } else {
	      results.push(result);
	      fitness += (result.points + result.labelPoints + result.destroyedSkulls) / (1 + blockIndex / 2);
	    }
	  }

	  this._testedPhenotypes++;
	  return fitness;
	};

	Evolution.prototype.crossoverFunction = function crossoverFunction(phenotypeA, phenotypeB) {
	  var length = Math.max(phenotypeA.length, phenotypeB.length);
	  var child1 = new Array(length);
	  var child2 = new Array(length);
	  var mother, father;

	  for (var x = 0; x < length; x += 2) {
	    if (!phenotypeA[x]) {
	      mother = phenotypeB;
	      father = phenotypeB;
	    } else if (!phenotypeB[x]) {
	      mother = phenotypeA;
	      father = phenotypeA;
	    } else if (Math.random() >= 0.5) {
	      mother = phenotypeA;
	      father = phenotypeB;
	    } else {
	      mother = phenotypeB;
	      father = phenotypeA;
	    }

	    child1[x] = mother[x];
	    child1[x + 1] = mother[x + 1];
	    child2[x] = father[x];
	    child2[x + 1] = father[x + 1];
	  }

	  return [child1, child2];
	};

	Evolution.prototype.mutationFunction = function mutationFunction(phenotype) {
	  var mutation = [].concat(phenotype);
	  var step = Math.floor(Math.random() * mutation.length / 2) * 2; // randomly select a step to mutate

	  var rotation = Math.floor(Math.random() * 4);
	  var minColumn = 0;
	  var colcount = 6;
	  if (rotation === 0) {
	    minColumn = 0;
	    colcount = 5;
	  } else if (rotation === 2) {
	    minColumn = 1;
	    colcount = 5;
	  }

	  var column = minColumn + Math.floor(Math.random() * colcount);
	  mutation[step] = column;
	  mutation[step + 1] = rotation;
	  return mutation;
	};

	Evolution.prototype.surviveFunction = function surviveFunction(entity) {
	  return entity.fitness >= 0;
	};

	Evolution.prototype.terminationFunction = function terminationFunction(generation, population, stats) {
	  var now = Date.now();
	  var runTime = now - this._prevRun;
	  this._prevRun = now;
	  this._runTimes.push(runTime);

	  var timeout = (this._maxRuntime - (now - this._startTime)) < runTime;

	  if (generation % 10 === 0 || timeout) {
	    printErr('GA STATS', generation, JSON.stringify(stats));
	  }

	  if (timeout) {
	    printErr('TERMINATING', generation, JSON.stringify(stats));
	  }

	  return timeout;
	};

	Evolution.prototype.evolve = function evolve() {
	  this._startTime = Date.now();
	  this._testedPhenotypes = 0;
	  this._runTimes = [];
	  this._prevRun = this._startTime;

	  var result = this._algorithm.evolve();

	  phenotypesStore = [];
	  for (var i = 0; i < result.population.length / 2; i++) {
	    var phenotype = [].concat(result.population[i].phenotype);
	    phenotype.shift();
	    phenotype.shift(); // remove first, obsolete, action
	    var rotation = Math.floor(Math.random() * 4);
	    var minColumn = 0;
	    var colcount = 6;
	    if (rotation === 0) {
	      minColumn = 0;
	      colcount = 5;
	    } else if (rotation === 2) {
	      minColumn = 1;
	      colcount = 5;
	    }

	    var column = minColumn + Math.floor(Math.random() * colcount);
	    phenotype.push(column);
	    phenotype.push(rotation);
	    phenotypesStore.push(phenotype);
	  }

	  return {
	    best: result.population[0],
	    lastGenerationStats: result.stats,
	    runStats: {
	      generations: result.generation + 1,
	      testedPhenotypes: this._testedPhenotypes,
	      runTimes: this._runTimes,
	      totalRunTime: Date.now() - this._startTime
	    }
	  };
	};

	module.exports = Evolution;


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var selectors = __webpack_require__(6);

	var DEFAULTS = {
	  generations: 100,

	  populationSize: 100,
	  phenotypes: [],

	  // reseedCount it's used to indicate how many reseed happened so far so that
	  // the seed function can act accordingly and eventuall simplify the pheonotype
	  // to increase survivability ratio

	  seedFunction: function (index, reseedCount) {
	    return index;
	  },

	  // At every generation, <elitarism> best individuals are guaranteed to
	  // be propagated to the next generation untouched
	  elitarism: 1,

	  // At every generation, <immigration> new individuals are generated and
	  // added to the next generation
	  immigration: 2,

	  // At every generation ~<( <crossoverRate> * <populationSize> )> individuals will breed and generate
	  // new individual using the <crossoverFunction> to mix their phenotypes
	  // and the new indivuals will be added to the next generation.
	  crossoverRate: 0.6,
	  crossoverFunction: function (phenotypeA, phenotypeB) {
	    return [phenotypeA, phenotypeB];
	  },

	  // At every generation, ~<( (1 - <crossoverRate>) * <populationSize> )> individuals
	  // moves to the next generation
	  // Of these <(<mutationRate> * 100)>% mutates using <mutationFunction>
	  // and the mutation result will be added to the next generation
	  mutationRate: 0.1,
	  mutationFunction: function (phenotype) {
	    return phenotype;
	  },

	  // Calculate the fitness score of a phenotype
	  fitnessFunction: function (phenotype) {
	    return phenotype || 0;
	  },

	  // After every generation it's possible to kill the unfitted individual
	  // in this way their phenotype will not be propagated to the next generation
	  // return false to 'kill' an individual
	  surviveFunction: function (phenotype, fitness) {
	    return true;
	  },

	  // How the algorithm should compare (sort) the individual fitness
	  comparisonFunction: function (entityA, entityB) {
	    return entityB.fitness - entityA.fitness;
	  },

	  // Early termination of the algorithm based on specific condition
	  // return true to terminate
	  terminationFunction: function (generation, population, stats) {
	    return false;
	  },

	  select1: selectors.select1.tournament3,
	  select2: selectors.select2.tournament3
	};

	function GeneticAlgorithm(options) {
	  var i;
	  var configKeys = Object.keys(DEFAULTS);
	  for (i = 0; i < configKeys.length; i++) {
	    var key = configKeys[i];
	    this['_' + key] = options[key] || DEFAULTS[key];
	  }

	  var len = this._phenotypes.length;
	  for (i = this._populationSize - 1; i >= len; i--)  {
	    this._phenotypes[i] = this._seedFunction(i, 0);
	  }
	}

	GeneticAlgorithm.prototype.evolve = function evolve() {
	  var _this = this;
	  var reseedCount = 0;
	  var generation, population, stats;
	  for (generation = 0; generation < this._generations; ++generation) {
	    // reset for each generation
	    this._internalState = {};

	    // score and sort
	    var totalFitness = 0;
	    population = this._phenotypes
	      .map(function (phenotype) {
	        var fitness = _this._fitnessFunction(phenotype);
	        totalFitness += fitness;
	        return {
	          fitness: fitness,
	          phenotype: phenotype
	        };
	      })
	      .sort(this._comparisonFunction);

	    var mean = totalFitness / population.length;
	    var stDev = Math.sqrt(population
	      .map(function (entity) {
	        return (entity.fitness - mean) * (entity.fitness - mean);
	      })
	      .reduce(function (a, b) { return a + b; }) / population.length);

	    population = population.filter(this._surviveFunction);

	    if (population.length === 0) {
	      // All dead ! reseed
	      reseedCount++;
	      for (i = 0; i < this._populationSize; ++i)  {
	        this._phenotypes[i] = this._seedFunction(i, reseedCount);
	      }

	      printErr('GA STATS', generation, 'ALL DEAD');
	      continue;
	    }

	    var deaths = this._populationSize - population.length;

	    stats = {
	      maximum: population[0].fitness,
	      minimum: population[population.length - 1].fitness,
	      mean: mean,
	      stDev: stDev,
	      deaths: deaths
	    };

	    if (this._terminationFunction(generation, population, stats)) {
	      break;
	    }

	    var i = 0;
	    var nextPhenotypes = new Array(this._populationSize);
	    while (i < this._elitarism) {
	      nextPhenotypes[i] = population[i].phenotype;
	      i++;
	    }

	    while (i < this._elitarism + this._immigration) {
	      nextPhenotypes[i] = this._seedFunction(i, 0);
	      i++;
	    }

	    while (i <= this._populationSize - 1) {
	      if (
	        (Math.random() < this._crossoverRate) &&
	        ((i + 1) <= (this.populationSize - 1))
	      ) {
	        var parents = this._select2(this, population);
	        var childs = this._crossoverFunction(parents[0], parents[1]);
	        nextPhenotypes[i] = childs[0];
	        nextPhenotypes[i + 1] = childs[1];
	        i += 2;
	      } else {
	        var phenotype = this._select1(this, population);
	        if (Math.random() < this._mutationRate) {
	          phenotype = this._mutationFunction(phenotype);
	        }

	        nextPhenotypes[i] = phenotype;
	        i++;
	      }
	    }

	    this._phenotypes = nextPhenotypes;
	  }

	  return {
	    generation: generation,
	    population: population,
	    stats: stats
	  };
	};

	module.exports = GeneticAlgorithm;


/***/ },
/* 6 */
/***/ function(module, exports) {

	'use strict';

	function tournamentX(size) {
	  return function (scope, population) {
	    var n = population.length;
	    var group = new Array(size);
	    for (var i = 0; i < size; i++) {
	      group[i] = population[Math.floor(Math.random() * n)];
	    }

	    return group.sort(scope._comparisonFunction)[0].phenotype;
	  };
	}

	var select1 = {
	  tournament2: tournamentX(2),

	  tournament3: tournamentX(3),

	  fittest: function (scope, population) {
	    return population[0].phenotype;
	  },

	  random: function (scope, population) {
	    return population[Math.floor(Math.random() * population.length)].phenotype;
	  },

	  randomLinearRank: function (scope, population) {
	    this._internalState.rlr = this._internalState.rlr || 0;
	    var index = Math.floor(Math.random() * Math.min(population.length, (this._internalState.rlr++)));
	    return population[index].phenotype;
	  },

	  sequential: function (scope, population) {
	    this._internalState.seq = this._internalState.seq || 0;
	    return population[(this._internalState.seq++) % population.length].phenotype;
	  }
	};

	var select2 = {
	  tournament2: function (scope, population) {
	    return [
	      select1.tournament2(scope, population),
	      select1.tournament2(scope, population)
	    ];
	  },

	  tournament3: function (scope, population) {
	    return [
	      select1.tournament3(scope, population),
	      select1.tournament3(scope, population)
	    ];
	  },

	  random: function (scope, population) {
	    return [
	      select1.random(scope, population),
	      select1.random(scope, population)
	    ];
	  },

	  randomLinearRank: function (scope, population) {
	    return [
	      select1.randomLinearRank(scope, population),
	      select1.randomLinearRank(scope, population)
	    ];
	  },

	  sequential: function (scope, population) {
	    return [
	      select1.sequential(scope, population),
	      select1.sequential(scope, population)
	    ];
	  },

	  fittestRandom: function (scope, population) {
	    return [
	      select1.fittest(scope, population),
	      select1.random(scope, population)
	    ];
	  }
	};

	module.exports = {
	  tournamentX: tournamentX,
	  select1: select1,
	  select2: select2
	};


/***/ }
/******/ ]);
