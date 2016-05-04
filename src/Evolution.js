'use strict';

var GeneticAlgorithm = require('./GeneticAlgorithm');

var DEFAULTS = {
  debug: false,
  map: null,
  blocks: null,
  steps: 8,
  optimizeFor: 4,
  generations: 60,
  populationSize: 60,
  immigration: 10,
  maxRuntime: 90,
  minPoints: 800,
  phenotypes: []
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
    var rotation = ~~(Math.random() * 4);
    var minColumn = 0;
    var colcount = 6;
    if (rotation === 0) {
      minColumn = 0;
      colcount = 5;
    } else if (rotation === 2) {
      minColumn = 1;
      colcount = 5;
    }

    var column = minColumn + (~~(Math.random() * colcount));
    phenotype[i] = column;
    phenotype[i + 1] = rotation;
  }

  return phenotype;
};

var roundMultiplier = [20, 15, 10, 8, 6, 4, 2, 1];
Evolution.prototype.fitnessFunction = function fitnessFunction(phenotype) {
  var map = this._map.clone();
  var totalFitness = 0;
  var turnIndex = 0;
  var len = phenotype.length;
  var results = [];
  for (var x = 0; x < len && turnIndex < this._steps; x += 2, turnIndex++) {
    var result = map.add(this._blocks[turnIndex], phenotype[x], phenotype[x + 1]);
    if (!result) {
      totalFitness = -100;
      break;
    } else {
      results[turnIndex] = result;
      var turnFitness = result.labelPoints + result.heightPoints;
      if (result.points > this._minPoints) {
        turnFitness += result.points + result.destroyedSkulls;
      }

      if (turnIndex > this._optimizeFor) {
        turnFitness /= (1 + turnIndex);
      } else {
        turnFitness /= (1 + turnIndex / 10);
      }

      totalFitness += ~~turnFitness;
    }
  }

  this._testedPhenotypes++;
  return {
    summary: totalFitness,
    results: results
  };
};

Evolution.prototype.comparisonFunction = function comparisonFunction(entityA, entityB) {
  return entityB.fitness.summary - entityA.fitness.summary;
},

Evolution.prototype.statsFunction = function statsFunction(generation, population) {
  var deaths = this._populationSize - population.length;

  return {
    maximum: population[0].fitness.summary,
    minimum: population[population.length - 1].fitness.summary,
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
  var mutation = [].concat(phenotype);
  var step = ~~(Math.random() * mutation.length / 2) * 2; // randomly select a step to mutate

  var rotation = ~~(Math.random() * 4);
  var minColumn = 0;
  var colcount = 6;
  if (rotation === 0) {
    minColumn = 0;
    colcount = 5;
  } else if (rotation === 2) {
    minColumn = 1;
    colcount = 5;
  }

  var column = minColumn + (~~(Math.random() * colcount));
  mutation[step] = column;
  mutation[step + 1] = rotation;
  return mutation;
};

Evolution.prototype.surviveFunction = function surviveFunction(entity) {
  return entity.fitness.summary >= 0;
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

  var storeLen = ~~(result.population.length / 2);
  var phenotypesStore = new Array(storeLen);
  for (var i = 0; i < storeLen; i++) {
    var phenotype = result.population[i].phenotype.slice(2); // remove first, obsolete, action
    var rotation = ~~(Math.random() * 4);
    var minColumn = 0;
    var colcount = 6;
    if (rotation === 0) {
      minColumn = 0;
      colcount = 5;
    } else if (rotation === 2) {
      minColumn = 1;
      colcount = 5;
    }

    var column = minColumn + (~~(Math.random() * colcount));
    phenotype.concat([column, rotation]);
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
