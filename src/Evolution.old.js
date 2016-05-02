'use strict';

var GeneticAlgorithm = require('geneticalgorithm');

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
