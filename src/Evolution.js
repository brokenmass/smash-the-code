'use strict';

var GeneticAlgorithm = require('./GeneticAlgorithm');

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
