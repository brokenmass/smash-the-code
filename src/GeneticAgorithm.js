'use strict';

var selectors = require('./selectors');
var utils = require('./utils');

var DEFAULTS = {
  generations: 100,

  populationSize: 100,
  seedFunction: function (index) {
    return index;
  },

  // At every generation the <elitarism> best individuals are guaranteed to
  // be propagated to the next generation untouched
  elitarism: 2,

  // At every generation (1 - <crossoverRate>) * <mutationRate> individuals
  // will mutate using <mutationFunction> and the mutation will be added
  // to the next generation
  mutationRate: 0.1,
  mutationFunction: function (phenotype) {
    return phenotype;
  },

  // At every generation <crossoverRate> individuals will breed and generate
  // new individual using the <crossoverFunction> to mix their phenotypes
  // and the new indivuals will be added to the next generation.
  crossoverRate: 0.6,
  crossoverFunction: function (phenotypeA, phenotypeB) {
    return [phenotypeA, phenotypeB];
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
  comparisonFunction: function (fitnessA, fitnessB) {
    return fitnessA > fitnessB ? -1 : 1;
  },

  // Early termination of the algorithm based on specific condition
  // return true to terminate
  terminationFunction: function (generation, population, stats) {
    return false;
  },

  select1: selectors.select1.tournament3,
  select2: selectors.select2.randomLinearRank
};

function GeneticAlgorithm(options) {
  var i;
  var configKeys = Object.keys(DEFAULTS);
  for (i = 0; i < configKeys.length; i++) {
    var key = configKeys[i];
    this['_' + key] = options[key] || DEFAULTS[key];
  }

  if (options.entities) {
    this._entities = options.entities;
  } else {
    this._entities = new Array(this._populationSize);
    for (i = 0; i < this._populationSize; ++i)  {
      this.entities[i] = this._seedFunction();
    }
  }
}

GeneticAlgorithm.prototype.start = function start() {
  var _this = this;
  var generation, population, stats;
  for (generation = 0; generation < this._generations; ++generation) {
    // reset for each generation
    this._internalState = {};

    // score and sort
    var totalFitness = 0;
    population = this.entities
      .map(function (entity) {
        var fitness = _this.fitness(entity);
        totalFitness += fitness;
        return {
          fitness: fitness,
          entity: entity
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

    var deaths = this._populationSize - population.length;
    stats = {
      maximum: population[0].fitness,
      minimum: population[population.length - 1].fitness,
      mean: mean,
      stDev: stDev,
      deaths: deaths
    };

    if (this.terminationFunction(generation, population, stats)) {
      break;
    }

    var i = 0;
    var newEntities = new Array(this._populationSize);
    while (i < this._elitarism) {
      newEntities[i] = population[i].entity;
      i++;
    }

    while (i < this._populationSize - 1) {
      if (
        (Math.random() < this._crossoverRate) &&
        ((i + 1) < (this.populationSize - 1))
      ) {
        var parents = this._select2(this, population);
        var childs = this._crossoverFunction(parents[0], parents[1]);
        newEntities[i] = childs[0];
        newEntities[i + 1] = childs[1];
        i += 2;
      } else {
        var entity = this._select1(this, population);
        if (Math.random() < this._mutationRate) {
          entity = this._mutationFunction(utils.cloneJSON(entity));
        }

        newEntities[i] = entity;
        i++;
      }
    }
  }

  return {
    generation: generation,
    population: population,
    stats: stats
  };
};

module.exports = GeneticAlgorithm;