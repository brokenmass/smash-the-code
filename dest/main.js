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

	var GameMap = __webpack_require__(2);
	var Evolution = __webpack_require__(3);

	var colors = __webpack_require__(5);

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


/***/ },
/* 1 */,
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var colors = __webpack_require__(5);
	var utils = __webpack_require__(6);

	var MAX_HEIGHT = 10;

	var turnCache = {};
	var roundCache = {};

	function GameMap(initialStatus) {
	  this._map = initialStatus;
	  this._debug = false;
	}

	GameMap.prototype.debug = function debug(message) {
	  if (this._debug) {
	    printErr(message);
	  }
	};

	GameMap.prototype.clone = function clone() {
	  return new GameMap(utils.cloneJSON(this._map));
	};

	var rotations = [1, 0, -1, 0];
	GameMap.prototype.add = function add(block, action) {
	  var column = action[0];
	  var rotation = action[1];
	  var column2 = column + rotations[rotation];
	  this.debug([action, column2]);
	  if (column2 < 0 || column2 >= 6) {
	    //printErr(action + ' - out of bound');
	    return false;
	  }

	  if (this._map[column].length > MAX_HEIGHT || this._map[column2].length > MAX_HEIGHT) { // dont make thing too high
	    //printErr(action + ' - too tall');
	    return false;
	  }

	  if (rotation === 3) {
	    var tmp = block[0];
	    block[0] = block[1];
	    block[1] = tmp;
	  }

	  this._map[column].push({
	    color: block[0],
	    colorName: colors[block[0]]
	  });
	  this._map[column2].push({
	    color: block[1],
	    colorName: colors[block[1]]
	  });

	  return this.calcTurnScore();
	};

	GameMap.prototype.calcTurnScore = function calcTurnScore() {
	  var id = JSON.stringify(this._map);
	  if (turnCache[id]) {
	    this._map = JSON.parse(turnCache[id].map);
	    return turnCache[id].turnScore;
	  }

	  var turnScore = {
	    points: 0,
	    chains: -1
	  };

	  var roundScore = this.calcRoundScore();
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

	    roundScore = this.calcRoundScore();
	  }

	  turnCache[id] = {
	    map: JSON.stringify(this._map),
	    turnScore: turnScore
	  };

	  return turnScore;
	};

	GameMap.prototype.calcRoundScore = function calcRoundScore() {
	  var id = JSON.stringify(this._map);
	  var x, y, i, cell;
	  if (roundCache[id]) {
	    this._map = JSON.parse(roundCache[id].map);
	    return roundCache[id].roundScore;
	  }

	  this._labels = [];
	  this._labelsMap = [[], [], [], [], [], []];
	  for (x = 0; x < 6; x++) {
	    for (y = 0; y < this._map[x].length; y++) {
	      this._map[x][y].id = x + '-' + y;
	    }
	  }

	  for (x = 0; x < 6; x++) {
	    for (y = 0; y < this._map[x].length; y++) {
	      cell = this._map[x][y];

	      if (cell.color !== 0 && !this._labelsMap[x][y]) {
	        var newLabel = {
	          color: cell.color,
	          colorName: cell.colorName,
	          cellCount: 0,
	          cellToRemove: {}
	        };
	        this._labels.push(newLabel);
	        this.dfs(x, y, newLabel);
	      }
	    }
	  }

	  var points = 0;
	  var groupBonus = 0;
	  var destroyedColors = {};
	  for (i = 0; i < this._labels.length; i++) {
	    var label = this._labels[i];
	    if (label.cellCount >= 4) {
	      // happy time !
	      points += (10 * label.cellCount);
	      if (label.cellCount >= 11) {
	        groupBonus += 8;
	      } else {
	        groupBonus += label.cellCount - 4;
	      }

	      destroyedColors[label.color] = true;
	      for (x = 0; x < 6; x++) {
	        this._map[x] = this._map[x].filter(function (cell) {
	          return !label.cellToRemove[cell.id];
	        });
	      }
	    }
	  }

	  var colorBonus = Object.keys(destroyedColors).length - 1;

	  var roundScore = {
	    points: points,
	    colorBonus: colorBonus,
	    groupBonus: groupBonus
	  };

	  roundCache[id] = {
	    map: JSON.stringify(this._map),
	    roundScore: roundScore
	  };

	  return roundScore;
	};

	var dx = [+1, 0, -1, 0];
	var dy = [0, +1, 0, -1];
	GameMap.prototype.dfs = function dfs(x, y, currentLabel) {
	  if ((x < 0 || x >= 6) || // out of bounds
	      (y < 0 || y >= 12) || // out of bounds
	      (!this._map[x][y]) || // invalid cell
	      (this._labelsMap[x][y]) // already labeled
	    ) {
	    return;
	  }

	  if (this._map[x][y].color === 0) {
	    // mark the cell only as one to remove
	    currentLabel.cellToRemove[this._map[x][y].id] = true;
	  }

	  if (this._map[x][y].color === currentLabel.color) {
	    // mark the current cell
	    currentLabel.cellToRemove[this._map[x][y].id] = true;
	    this._labelsMap[x][y] = true;

	    // increment cell counter
	    currentLabel.cellCount++;

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
	      row += this._map[x][y] ? this._map[x][y].colorName[0] : '.';
	    }

	    printErr(row);
	  }

	  printErr('------');
	};

	module.exports = GameMap;


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var GeneticAlgorithm = __webpack_require__(4);

	var POPULATION_SIZE = 10;
	var STEPS = 4;
	var GENERATIONS = 20;

	function Evolution(map, blocks) {
	  var i, m;

	  var population = new Array(POPULATION_SIZE);
	  for (i = 0; i < POPULATION_SIZE; i++) {
	    population[i] = new Array(STEPS);
	    for (m = 0; m < STEPS; m++) {
	      population[i][m] = [Math.floor(Math.random() * 6), Math.floor(Math.random() * 4)];
	    }
	  }

	  this._debug = false;
	  this._map = map;
	  this._blocks = blocks;
	  this._algorithm = new GeneticAlgorithm({
	    fitnessFunction: this.fitness.bind(this),
	    crossoverFunction: this.crossover.bind(this),
	    mutationFunction: this.mutation.bind(this),
	    population: population,
	    populationSize: POPULATION_SIZE
	  });
	}

	Evolution.prototype.debug = function debug(message) {
	  if (this._debug) {
	    printErr(message);
	  }
	};

	Evolution.prototype.fitness = function fitness(phenotype) {
	  var map = this._map.clone();
	  var results = [];
	  var fitness = 0;
	  for (var x = 0; x < STEPS; x++) {
	    var result = map.add(this._blocks[x], phenotype[x]);

	    if (!result) {
	      return -100;
	    } else {
	      results.push(result);
	      fitness += (result.points);
	    }
	  }

	  return fitness;
	};

	Evolution.prototype.crossover = function crossover(phenotypeA, phenotypeB) {
	  var result1 = new Array(STEPS);
	  var result2 = new Array(STEPS);
	  for (var x = 0; x < STEPS; x++) {
	    if (Math.random() >= 0.5) {
	      result1[x] = [phenotypeA[x][0], phenotypeA[x][1]];
	      result2[x] = [phenotypeB[x][0], phenotypeB[x][1]];
	    } else {
	      result1[x] = [phenotypeB[x][0], phenotypeB[x][1]];
	      result2[x] = [phenotypeA[x][0], phenotypeA[x][1]];
	    }
	  }

	  return [result1, result2];
	};

	Evolution.prototype.mutation = function mutation(phenotype) {
	  if (Math.random() > 0.05) {
	    var step = Math.floor(Math.random() * STEPS);
	    if (Math.random() > 0.5) {
	      phenotype[step][0] = Math.floor(Math.random() * 6); // mutate column
	    } else {
	      phenotype[step][1] = Math.floor(Math.random() * 4); // mutate rotation
	    }
	  }

	  return phenotype;
	};

	Evolution.prototype.best = function best() {
	  for (var x = 0; x < GENERATIONS; x++) {
	    this._algorithm = this._algorithm.evolve();
	  }

	  //printErr(JSON.stringify(this._algorithm.scoredPopulation()));
	  return {
	    phenotype: this._algorithm.best(),
	    score: this._algorithm.bestScore()
	  };
	};

	module.exports = Evolution;


/***/ },
/* 4 */
/***/ function(module, exports) {

	module.exports = function geneticAlgorithmConstructor(options) {

	    function settingDefaults() { return {
	 
	        mutationFunction : function(phenotype) { return phenotype },
	 
	        crossoverFunction : function(a,b) { return [a,b] },
	 
	        fitnessFunction : function(phenotype) { return 0 },

	        doesABeatBFunction : undefined,
	 
	        population : [],
	        populationSize : 100,
	    }}

	    function settingWithDefaults( settings , defaults ) {
	        settings = settings || {}

	        settings.mutationFunction = settings.mutationFunction || defaults.mutationFunction
	        settings.crossoverFunction = settings.crossoverFunction || defaults.crossoverFunction
	        settings.fitnessFunction = settings.fitnessFunction || defaults.fitnessFunction

	        settings.doesABeatBFunction = settings.doesABeatBFunction || defaults.doesABeatBFunction

	        settings.population = settings.population || defaults.population
	        if ( settings.population.length <= 0 ) throw Error("population must be an array and contain at least 1 phenotypes")

	        settings.populationSize = settings.populationSize || defaults.populationSize
	        if ( settings.populationSize <= 0 ) throw Error("populationSize must be greater than 0")

	        return settings
	    }

	    var settings = settingWithDefaults(options,settingDefaults())

	    function populate () {
	        var size = settings.population.length
	        while( settings.population.length < settings.populationSize ) {
	            settings.population.push(
	                mutate(
	                    cloneJSON( settings.population[ Math.floor( Math.random() * size ) ] )
	                )
	            )
	        }
	    }

	    function cloneJSON( object ) {
	        return JSON.parse ( JSON.stringify ( object ) )
	    }

	    function mutate(phenotype) {
	        return settings.mutationFunction(cloneJSON(phenotype))
	    }

	    function crossover(phenotype) {
	        phenotype = cloneJSON(phenotype)
	        var mate = settings.population[ Math.floor(Math.random() * settings.population.length ) ]
	        mate = cloneJSON(mate)
	        return settings.crossoverFunction(phenotype,mate)[0]
	    }

	    function doesABeatB(a,b) {
	        var doesABeatB = false;
	        if ( settings.doesABeatBFunction ) {
	            return settings.doesABeatBFunction(a,b)
	        } else {
	            return settings.fitnessFunction(a) >= settings.fitnessFunction(b)
	        }
	    }

	    function compete( ) {
	        var nextGeneration = []

	        for( var p = 0 ; p < settings.population.length - 1 ; p+=2 ) {
	            var phenotype = settings.population[p];
	            var competitor = settings.population[p+1];

	            nextGeneration.push(phenotype)
	            if ( doesABeatB( phenotype , competitor )) {
	                if ( Math.random() < 0.5 ) {
	                    nextGeneration.push(mutate(phenotype))
	                } else {
	                    nextGeneration.push(crossover(phenotype))
	                }
	            } else {
	                nextGeneration.push(competitor)
	            }
	        }

	        settings.population = nextGeneration;
	    }



	    function randomizePopulationOrder( ) {

	        for( var index = 0 ; index < settings.population.length ; index++ ) {
	            var otherIndex = Math.floor( Math.random() * settings.population.length )
	            var temp = settings.population[otherIndex]
	            settings.population[otherIndex] = settings.population[index]
	            settings.population[index] = temp
	        }
	    }

	    return {
	        evolve : function (options) {

	            if ( options ) { 
	                settings = settingWithDefaults(options,settings)
	            }
	            
	            populate()
	            randomizePopulationOrder()
	            compete()
	            return this
	        },
	        best : function() {
	            var scored = this.scoredPopulation()
	            var result = scored.reduce(function(a,b){
	                return a.score >= b.score ? a : b
	            },scored[0]).phenotype
	            return cloneJSON(result)
	        },
	        bestScore : function() {
	            return settings.fitnessFunction( this.best() )
	        },
	        population : function() {
	            return cloneJSON( this.config().population )
	        },
	        scoredPopulation : function() {
	            return this.population().map(function(phenotype) {
	                return {
	                    phenotype : cloneJSON( phenotype ),
	                    score : settings.fitnessFunction( phenotype )
	                }
	            })
	        },
	        config : function() {
	            return cloneJSON( settings )
	        },
	        clone : function(options) {
	            return geneticAlgorithmConstructor( 
	                settingWithDefaults(options, 
	                    settingWithDefaults( this.config(), settings ) 
	                    )
	                )
	        }
	    }
	}


/***/ },
/* 5 */
/***/ function(module, exports) {

	'use strict';

	module.exports = ['Skull', 'Blue', 'Green', 'Purple', 'Red', 'Yellow'];


/***/ },
/* 6 */
/***/ function(module, exports) {

	'use strict';

	function cloneJSON(object) {
	  return JSON.parse(JSON.stringify(object));
	}

	module.exports = {
	  cloneJSON: cloneJSON
	};


/***/ }
/******/ ]);