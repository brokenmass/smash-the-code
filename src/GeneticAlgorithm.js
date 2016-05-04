'use strict';

var selectors = require('./selectors');

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
  crossoverRate: 0.5,
  crossoverFunction: function (phenotypeA, phenotypeB) {
    return [phenotypeA, phenotypeB];
  },

  // At every generation, ~<( (1 - <crossoverRate>) * <populationSize> )> individuals
  // moves to the next generation
  // Of these <(<mutationRate> * 100)>% mutates using <mutationFunction>
  // and the mutation result will be added to the next generation
  mutationRate: 0.3,
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

  statsFunction: function (generation, population) {
    var deaths = this._populationSize - population.length;

    return {
      maximum: population[0].fitness,
      minimum: population[population.length - 1].fitness,
      deaths: deaths
    };
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
    var phenotypesLen = this._phenotypes.length;
    population = new Array(phenotypesLen);
    for (var x = 0; x < phenotypesLen; x++) {
      var phenotype = this._phenotypes[x];
      var fitness = _this._fitnessFunction(phenotype);
      population[x] = {
        fitness: fitness,
        phenotype: phenotype
      };
    }

    population = population
      .filter(this._surviveFunction)
      .sort(this._comparisonFunction);

    if (population.length === 0) {
      // All dead ! reseed
      reseedCount++;
      for (i = 0; i < this._populationSize; ++i)  {
        this._phenotypes[i] = this._seedFunction(i, reseedCount);
      }

      printErr('GA STATS', generation, 'ALL DEAD');
      continue;
    }

    stats = this._statsFunction(generation, population);

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
      nextPhenotypes[i++] = this._seedFunction(i, 0);
      i++;
    }

    while (i <= this._populationSize - 1) {
      if (
        (Math.random() < this._crossoverRate) &&
        ((i + 1) <= (this.populationSize - 1))
      ) {
        var parents = this._select2(this, population);
        var childs = this._crossoverFunction(parents[0], parents[1]);
        nextPhenotypes[i++] = childs[0];
        nextPhenotypes[i++] = childs[1];
      } else {
        var selectedPhenotype = this._select1(this, population);
        if (Math.random() < this._mutationRate) {
          selectedPhenotype = this._mutationFunction(selectedPhenotype);
        }

        nextPhenotypes[i++] = selectedPhenotype;
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
