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
  genotypes: [],
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
    genotypes: this._genotypes,
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
  var genotype = new Array(length);
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
    genotype[i] = column;
    genotype[i + 1] = rotation;
  }

  return genotype;
};

Evolution.prototype.fitnessFunction = function fitnessFunction(genotype) {
  var map = this._map.clone();
  var fitness = 0;
  var turnIndex = 0;
  var len = genotype.length;
  var results = [];
  for (var x = 0; x < len; x += 2, turnIndex++) {
    var result = map.add(this._blocks[turnIndex], genotype[x], genotype[x + 1]);
    if (!result) {
      fitness = -100;
      break;
    } else {
      results[turnIndex] = result;
      var turnFitness = result.labelPoints;
      if (!result.points || result.points > this._minPoints ) {
        turnFitness += result.points + 5*result.destroyedSkulls;
      } else {
        fitness = 0;
        break;
      }

      fitness += Math.floor(turnFitness / (1 + turnIndex));
    }

    if (this._enemyNuisance[x]) {
      map.addNuisance(this._enemyNuisance[x]);
    }
  }

  this._testedgenotypes++;
  return {
    fitness: fitness,
    results: results
  };
};

Evolution.prototype.comparisonFunction = function comparisonFunction(entityA, entityB) {
  if (entityB.fitness > 3000 && entityA.fitness > 3000) {
    // for high scoring solution just pick the one scoring first
    for (var x = 0; x < Math.min(entityA.results.length, entityB.results.length); x++) {
      var diff = entityB.results[x].points - entityA.results[x].points;
      if (diff !== 0) {
        return diff;
      }
    }
  }

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

Evolution.prototype.crossoverFunction = function crossoverFunction(genotypeA, genotypeB) {
  var length = Math.max(genotypeA.length, genotypeB.length);
  var child1 = new Array(length);
  var child2 = new Array(length);
  var mother, father;

  for (var x = 0; x < length; x += 2) {
    if (!genotypeA[x]) {
      mother = genotypeB;
      father = genotypeB;
    } else if (!genotypeB[x]) {
      mother = genotypeA;
      father = genotypeA;
    } else if (Math.random() >= 0.5) {
      mother = genotypeA;
      father = genotypeB;
    } else {
      mother = genotypeB;
      father = genotypeA;
    }

    child1[x] = mother[x];
    child1[x + 1] = mother[x + 1];
    child2[x] = father[x];
    child2[x + 1] = father[x + 1];
  }

  return [child1, child2];
};

Evolution.prototype.mutationFunction = function mutationFunction(genotype) {
  var mutation = genotype.slice();
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
  return entity.fitness >= 0;
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
  this._testedgenotypes = 0;
  this._runTimes = [];
  this._prevRun = this._startTime;

  var result = this._algorithm.evolve();

  // storing the best 10% of the population to kick start the next round
  var storeLen = Math.floor(result.population.length / 10);
  var genotypesStore = new Array(storeLen);
  for (var i = 0; i < storeLen; i++) {
    // remove first, obsolete, action and replace with a new random one
    var genotype = result.population[i].genotype.slice(2);
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
    genotype.push(column);
    genotype.push(rotation);
    genotypesStore[i] = genotype;
  }

  return {
    best: result.population[0],
    store: genotypesStore,
    lastGenerationStats: result.stats,
    runStats: {
      generations: result.generation + 1,
      testedgenotypes: this._testedgenotypes,
      runTimes: this._runTimes,
      totalRunTime: Date.now() - this._startTime
    }
  };
};

module.exports = Evolution;
