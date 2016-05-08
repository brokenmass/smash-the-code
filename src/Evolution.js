'use strict';

var GeneticAlgorithm = require('./GeneticAlgorithm');

var DEFAULTS = {
  debug: false,
  map: null,
  blocks: null,
  steps: 6,
  generations: 50,
  populationSize: 200,
  immigration: 10,
  maxRuntime: 85,
  minPoints: 600,
  phenotypes: [],
  enemyNuisance: [0, 0, 0, 0, 0, 0, 0, 0]
};

function Evolution(options) {

  var i;
  var configKeys = Object.keys(DEFAULTS);
  for (i = 0; i < configKeys.length; i++) {
    var key = configKeys[i];
    this['_' + key] = options[key] || DEFAULTS[key];
  }

  this._algorithm = new GeneticAlgorithm({
    immigration: this._immigration,
    phenotypes: this._phenotypes,
    generations: this._generations,
    populationSize: this._populationSize,
    seedFunction: this.seedFunction.bind(this),
    fitnessFunction: this.fitnessFunction.bind(this),
    comparisonFunction: this.comparisonFunction.bind(this),
    statsFunction: this.statsFunction.bind(this),
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
    var colCount = 6;
    if (rotation === 0) {
      minColumn = 0;
      colCount = 5;
    } else if (rotation === 2) {
      minColumn = 1;
      colCount = 5;
    }

    var column = minColumn + Math.floor(Math.random() * colCount);
    phenotype[i] = column;
    phenotype[i + 1] = rotation;
  }

  return phenotype;
};

Evolution.prototype.fitnessFunction = function fitnessFunction(phenotype) {
  var map = this._map.clone();
  var fitness = 0;
  var turnIndex = 0;
  var len = phenotype.length;
  var results = [];
  for (var x = 0; x < len; x += 2, turnIndex++) {
    var result = map.add(this._blocks[turnIndex], phenotype[x], phenotype[x + 1]);
    if (!result) {
      fitness = fitness || -100;
      phenotype = phenotype.slice(0, x);
      break;
    } else if (results.points > 0 && results.points < 420) {
      phenotype = phenotype.slice(0, x);
      break;
    } else {
      results[turnIndex] = result;
      var turnFitness = result.labelPoints;
      if (!result.points || result.points > this._minPoints ) {
        turnFitness += result.points + result.destroyedSkulls;
      }
      fitness += Math.floor(turnFitness / (1 + turnIndex*2));
    }

    if (this._enemyNuisance[x]) {
      map.addNuisance(this._enemyNuisance[x]);
    }
  }

  this._testedPhenotypes++;
  return {
    phenotype: phenotype,
    fitness: fitness,
    results: results
  };
};

Evolution.prototype.comparisonFunction = function comparisonFunction(entityA, entityB) {
  return entityB.fitness - entityA.fitness;
},

Evolution.prototype.statsFunction = function statsFunction(generation, population) {
  var deaths = this._populationSize - population.length;

  return {
    maximum: population[0] && population[0].fitness,
    minimum: population[0] && population[population.length - 1].fitness,
    deaths: deaths
  };
};

Evolution.prototype.crossoverFunction = function crossoverFunction(phenotypeA, phenotypeB) {
  var length = Math.max(phenotypeA.length, phenotypeB.length);
  var child1 = new Array(length);
  var child2 = new Array(length);
  var mother, father;

  for (var x = 0; x < length; x++) {
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
    child2[x] = father[x];
  }

  return [child1, child2];
};

Evolution.prototype.mutationFunction = function mutationFunction(phenotype) {
  var mutation = phenotype.slice();
  var step = Math.floor(Math.random() * mutation.length / 2) * 2; // randomly select a step to mutate

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
  mutation[step] = column;
  mutation[step + 1] = rotation;
  return mutation;
};

Evolution.prototype.surviveFunction = function surviveFunction(entity) {
  return entity.phenotype.length && entity.fitness >= 0;
};

Evolution.prototype.terminationFunction = function terminationFunction(generation, population, stats) {
  var now = Date.now();
  var runTime = now - this._prevRun;
  this._prevRun = now;
  this._runTimes.push(runTime);

  var timeout = (this._maxRuntime - (now - this._startTime)) < runTime;

  if (generation % 10 === 0 || timeout) {
    printErr(generation, stats.maximum, stats.minimum);
  }

  if (timeout) {
    printErr(generation, population[0], stats.minimum);
    printErr('TERMINATING');
  }

  return timeout;
};

Evolution.prototype.evolve = function evolve() {
  this._startTime = Date.now();
  this._testedPhenotypes = 0;
  this._runTimes = [];
  this._prevRun = this._startTime;

  var result = this._algorithm.evolve();

  var storeLen = Math.floor(result.population.length / 10);
  var phenotypesStore = new Array(storeLen);
  for (var i = 0; i < storeLen; i++) {
    var phenotype = result.population[i].phenotype.slice(2); // remove first, obsolete, action
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
    phenotype.push(column);
    phenotype.push(rotation);
    phenotypesStore[i] = phenotype;
  }

  return {
    best: result.population[0],
    store: phenotypesStore,
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
