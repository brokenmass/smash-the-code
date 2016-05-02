'use strict';

var GeneticAlgorithm = require('./GeneticAlgorithm');
var utils = require('./utils');

var phenotypesStore = [];

function Evolution(map, blocks) {
  this._debug = false;
  this._map = map;
  this._blocks = blocks;

  this._steps = 8;
  this._generations = 20;
  this._populationSize = 30;

  this._algorithm = new GeneticAlgorithm({
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
  var length = Math.max(1, this._steps - reseedCount);
  var phenotype = new Array(length);
  for (var i = 0; i < length; i++) {
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
    phenotype[i] = [column, rotation];
  }

  return phenotype;
};

Evolution.prototype.fitnessFunction = function fitnessFunction(phenotype) {
  var map = this._map.clone();
  var results = [];
  var fitness = 0;
  for (var x = 0; x < phenotype.length; x++) {
    var result = map.add(this._blocks[x], phenotype[x]);

    if (!result) {
      return -100;
    } else {
      results.push(result);
      fitness += (result.points + result.labelPoints + result.destroyedSkulls) / (1 + x/2);
    }
  }

  this._testedPhenotypes++;
  return fitness;
};

Evolution.prototype.crossoverFunction = function crossoverFunction(phenotypeA, phenotypeB) {
  var length = Math.max(phenotypeA.length, phenotypeB.length);
  var result1 = new Array(length);
  var result2 = new Array(length);
  for (var x = 0; x < length; x++) {
    if (!phenotypeA[x]) {
      result1[x] = [phenotypeB[x][0], phenotypeB[x][1]];
      result2[x] = [phenotypeB[x][0], phenotypeB[x][1]];
    } else if (!phenotypeB[x]) {
      result1[x] = [phenotypeA[x][0], phenotypeA[x][1]];
      result2[x] = [phenotypeA[x][0], phenotypeA[x][1]];
    } else if (Math.random() >= 0.5) {
      result1[x] = [phenotypeA[x][0], phenotypeA[x][1]];
      result2[x] = [phenotypeB[x][0], phenotypeB[x][1]];
    } else {
      result1[x] = [phenotypeB[x][0], phenotypeB[x][1]];
      result2[x] = [phenotypeA[x][0], phenotypeA[x][1]];
    }
  }

  return [result1, result2];
};

Evolution.prototype.mutationFunction = function mutationFunction(phenotype) {
  var step = Math.floor(Math.random() * phenotype.length); // randomly select a step to mutate

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
  phenotype[step] = [column, rotation];
  return phenotype;
};

Evolution.prototype.surviveFunction = function surviveFunction(entity) {
  return entity.fitness >= 0;
};

Evolution.prototype.terminationFunction = function terminationFunction() {
  var now = Date.now();
  var runTime = now - this._prevRun;
  this._prevRun = now;
  this._runTimes.push(runTime);
  return (85 - (now - this._startTime)) < runTime;
};

Evolution.prototype.evolve = function evolve() {
  this._startTime = Date.now();
  this._testedPhenotypes = 0;
  this._runTimes = [];
  this._prevRun = this._startTime;

  var result = this._algorithm.evolve();

  phenotypesStore = [];
  for (var i = 0; i < result.population.length; i++) {
    var phenotype = utils.cloneJSON(result.population[i].phenotype);
    phenotype.shift(); // remove first , obsolete, action
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
    phenotype.push([column, rotation]);
    phenotypesStore.push(phenotype);
  }

  return {
    best: result.population[0],
    lastGenerationStats: result.stats,
    runStats: {
      testedPhenotypes: this._testedPhenotypes,
      runTimes: this._runTimes,
      totalRunTime: Date.now() - this._startTime
    }
  };
};

module.exports = Evolution;
