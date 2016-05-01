'use strict';

function tournamentX(size) {
  return function (scope, population) {
    var n = population.length;
    var group = new Array(size);
    for (var i = 0; i < size; i++) {
      group[i] = population[Math.floor(Math.random() * n)];
    }

    return group.sort(scope._comparisonFunction)[0].entity;
  };
}

var select1 = {
  tournament2: tournamentX(2),

  tournament3: tournamentX(3),

  fittest: function (scope, population) {
    return population[0].entity;
  },

  random: function (scope, population) {
    return population[Math.floor(Math.random() * population.length)].entity;
  },

  randomLinearRank: function (scope, population) {
    this._internalState.rlr = this._internalState.rlr || 0;
    var index = Math.floor(Math.random() * Math.min(population.length, (this._internalState.rlr++)));
    return population[index].entity;
  },

  sequential: function (scope, population) {
    this._internalState.seq = this._internalState.seq || 0;
    return population[(this._internalState.seq++) % population.length].entity;
  }
};

var select2 = {
  tournament2: function (scope, population) {
    return [
      select1.tournament2(scope, population),
      select1.tournament2(scope, population)
    ];
  },

  tournament3: function (scope, population) {
    return [
      select1.tournament3(scope, population),
      select1.tournament3(scope, population)
    ];
  },

  random: function (scope, population) {
    return [
      select1.random(scope, population),
      select1.random(scope, population)
    ];
  },

  randomLinearRank: function (scope, population) {
    return [
      select1.randomLinearRank(scope, population),
      select1.randomLinearRank(scope, population)
    ];
  },

  sequential: function (scope, population) {
    return [
      select1.sequential(scope, population),
      select1.sequential(scope, population)
    ];
  },

  fittestRandom: function (scope, population) {
    return [
      select1.fittest(scope, population),
      select1.random(scope, population)
    ];
  }
};

module.export = {
  tournamentX: tournamentX,
  select1: select1,
  select2: select2
};
