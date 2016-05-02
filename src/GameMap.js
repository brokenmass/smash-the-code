'use strict';

var colors = require('./colors');
var utils = require('./utils');

var MAX_HEIGHT = 10;

var turnCache = {};
var roundCache = {};

function GameMap(initialStatus) {
  this._map = initialStatus;
  this._debug = false;
}

GameMap.prototype.debug = function debug(message) {
  if (this._debug) {
    printErr(message);
  }
};

GameMap.prototype.clone = function clone() {
  return new GameMap(utils.cloneJSON(this._map));
};

var rotations = [1, 0, -1, 0];
GameMap.prototype.add = function add(block, action) {
  var column1 = action[0];
  var rotation = action[1];
  var column2 = column1 + rotations[rotation];
  this.debug([action, column2]);
  if (column2 < 0 || column2 >= 6) {
    //printErr(action + ' - out of bound');
    return false;
  }

  if (
    (column1 === column2 && (this._map[column1].length > 10)) ||
    (column1 !== column2 && (this._map[column1].length > 11 || this._map[column2].length > 11))
  ) {
    return false;
  }

  var firstBlock = 0, secondBlock = 1;
  if (rotation === 3) {
    firstBlock = 1;
    secondBlock = 0;
  }

  this._map[column1].push({
    color: block[firstBlock],
    colorName: colors[block[firstBlock]]
  });
  this._map[column2].push({
    color: block[secondBlock],
    colorName: colors[block[secondBlock]]
  });

  return this.calcTurnScore();
};

GameMap.prototype.calcTurnScore = function calcTurnScore() {
  var id = JSON.stringify(this._map);
  if (turnCache[id]) {
    this._map = JSON.parse(turnCache[id].map);
    return turnCache[id].turnScore;
  }

  var turnScore = {
    points: 0,
    labelPoints: 0,
    destroyedSkulls: 0,
    chains: -1
  };

  var roundScore = this.calcRoundScore();
  turnScore.labelPoints = roundScore.labelPoints;
  while (roundScore.points) {
    turnScore.chains++;
    var bonus = roundScore.groupBonus;
    if (roundScore.colorBonus) {
      bonus += Math.pow(2, roundScore.colorBonus);
    }

    if (turnScore.chains) {
      bonus += (Math.pow(2, turnScore.chains - 1) * 8);
    }

    bonus = Math.max(1, Math.min(999, bonus));
    turnScore.points += roundScore.points * bonus;

    turnScore.destroyedSkulls += roundScore.destroyedSkulls;

    roundScore = this.calcRoundScore();
    turnScore.labelPoints = roundScore.labelPoints;
  }

  turnCache[id] = {
    map: JSON.stringify(this._map),
    turnScore: turnScore
  };

  return turnScore;
};

GameMap.prototype.calcRoundScore = function calcRoundScore() {
  var id = JSON.stringify(this._map);
  var x, y, i, cell;
  if (roundCache[id]) {
    this._map = JSON.parse(roundCache[id].map);
    return roundCache[id].roundScore;
  }

  this._labels = [];
  this._labelsMap = [[], [], [], [], [], []];
  for (x = 0; x < 6; x++) {
    for (y = 0; y < this._map[x].length; y++) {
      this._map[x][y].id = x + '-' + y;
    }
  }

  for (x = 0; x < 6; x++) {
    for (y = 0; y < this._map[x].length; y++) {
      cell = this._map[x][y];

      if (cell.color !== 0 && !this._labelsMap[x][y]) {
        var newLabel = {
          color: cell.color,
          colorName: cell.colorName,
          cellsCount: 0,
          skullsCount: 0,
          cellToRemove: {}
        };
        this._labels.push(newLabel);
        this.dfs(x, y, newLabel);
      }
    }
  }

  var points = 0;
  var labelPoints = 0;
  var groupBonus = 0;
  var destroyedColors = {};
  var destroyedSkulls = 0;
  for (i = 0; i < this._labels.length; i++) {
    var label = this._labels[i];
    if (label.cellsCount >= 4) {
      // happy time !
      points += (10 * label.cellsCount);
      destroyedSkulls += label.skullsCount;
      if (label.cellsCount >= 11) {
        groupBonus += 8;
      } else {
        groupBonus += label.cellsCount - 4;
      }

      destroyedColors[label.color] = true;
      for (x = 0; x < 6; x++) {
        this._map[x] = this._map[x].filter(function (cell) {
          return !label.cellToRemove[cell.id];
        });
      }
    } else {
      labelPoints += label.cellsCount * label.cellsCount;
    }
  }

  var colorBonus = Object.keys(destroyedColors).length - 1;

  var roundScore = {
    points: points,
    labelPoints: labelPoints,
    destroyedSkulls: destroyedSkulls,
    labelsCount: this._labels.length,
    colorBonus: colorBonus,
    groupBonus: groupBonus
  };

  roundCache[id] = {
    map: JSON.stringify(this._map),
    roundScore: roundScore
  };

  return roundScore;
};

var dx = [+1, 0, -1, 0];
var dy = [0, +1, 0, -1];
GameMap.prototype.dfs = function dfs(x, y, currentLabel) {
  if ((x < 0 || x >= 6) || // out of bounds
      (y < 0 || y >= 12) || // out of bounds
      (!this._map[x][y]) || // invalid cell
      (this._labelsMap[x][y]) // already labeled
    ) {
    return;
  }

  if (this._map[x][y].color === 0) {
    // mark the cell only as one to remove
    currentLabel.cellToRemove[this._map[x][y].id] = true;

    // increment skull counter
    currentLabel.skullsCount++;
  }

  if (this._map[x][y].color === currentLabel.color) {
    // mark the current cell
    currentLabel.cellToRemove[this._map[x][y].id] = true;
    this._labelsMap[x][y] = true;

    // increment cell counter
    currentLabel.cellsCount++;

    // recursively mark the neighbors
    for (var direction = 0; direction < 4; ++direction) {
      this.dfs(x + dx[direction], y + dy[direction], currentLabel);
    }
  }
};

GameMap.prototype.debugMap = function debugMap() {
  printErr('------');
  for (var y = 11; y >= 0; y--) {
    var row = '';
    for (var x = 0; x < 6; x++) {
      row += this._map[x][y] ? this._map[x][y].colorName[0] : '.';
    }

    printErr(row);
  }

  printErr('------');
};

module.exports = GameMap;
