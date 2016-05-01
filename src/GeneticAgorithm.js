'use strict';

var utils = require('./utils');

var DEFAULTS = {
  generations: 100,

  populationSize: 100,
  seedFunction: function (index) {
    return index;
  },

  elitarism: 2,

  mutationRate: 0.1,
  mutationFunction: function (phenotype) {
    return phenotype;
  },

  crossoverRate: 0.6,
  crossoverFunction: function (phenotypeA, phenotypeB) {
    return [phenotypeA, phenotypeB];
  },

  fitnessFunction: function (phenotype) {
    return phenotype || 0;
  },

  comparisonFunction: function (fitnessA, fitnessB) {
    return fitnessA > fitnessB ? -1 : 1;
  },

  terminationFunction: function (generation, population, stats) {
    return false;
  }
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
  var self = this;
  var next = true;
  for (var generation = 0; generation < this._generations && next; ++generation) {
    // reset for each generation
    this._internalState = {};

    // score and sort
    var population = this.entities
      .map(function (entity) {
        return {
          fitness: self.fitness(entity),
          entity: entity
        };
      })
      .sort(this._comparisonFunction);

    var stats = {
      'maximum': pop[0].fitness,
      'minimum': pop[pop.length-1].fitness
    };

    if (this.terminationFunction(generation, population, stats)) {
      break;
    }

    var i = 0;
    var newEntities = new Array(this._populationSize);
    while(i < this._elitarism) {
      newEntities[i] = population[i].entity;
      i++;
    }
    while(i < this._populationSize - 1) {
      if (
        (Math.random() < this._crossoverRate) &&
        ((i + 2) < (this.populationSize - 1))
      ) {
        var childs = this.select2(this, population);
        newEntities[i] = childs[0];
        newEntities[i+1] = childs[1];
        i += 2;
      } else {
        var entity = this.select1(this, population);
        if (Math.random() < this._mutationRate) {
          entity = this._mut
        }
      }
    }

  }

};





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

module.exports = GeneticAlgorithm;
