'use strict';

var colors = require('./colors');

var turnCache = { _hits: 0 };
var roundCache = { _hits: 0 };

function GameMap(initalMap) {
  this._map = new Array(6);
  for (var x = 0; x < 6; x++) {
    this._map[x] = [].concat(initalMap[x]);
  }

  this._debug = false;
}

GameMap.prototype.debug = function debug(message) {
  if (this._debug) {
    printErr(message);
  }
};

GameMap.prototype.clone = function clone() {
  return new GameMap(this._map);
};

var rotations = [1, 0, -1, 0];
GameMap.prototype.add = function add(block, column1, rotation) {

  var column2 = column1 + rotations[rotation];
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

  this._map[column1].push(block[firstBlock]);
  this._map[column2].push(block[secondBlock]);

  return this.calcTurnScore();
};

GameMap.prototype.calcTurnScore = function calcTurnScore() {
  var id = JSON.stringify(this._map);
  if (turnCache[id]) {
    turnCache._hits++;
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
    roundCache._hits++;
    this._map = JSON.parse(roundCache[id].map);
    return roundCache[id].roundScore;
  }

  this._labels = [];
  this._labelsMap = [[], [], [], [], [], []];

  for (x = 0; x < 6; x++) {
    for (y = 0; y < this._map[x].length; y++) {
      cell = this._map[x][y];

      if (cell !== 0 && !this._labelsMap[x][y]) {
        var newLabel = {
          color: cell,
          cellsCount: 0,
          skullsCount: 0,
          cellsToRemove: []
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
      for (x = 0; x < label.cellsToRemove.length; x++) {
        cell = label.cellsToRemove[x];
        this._map[cell[0]][cell[1]] = null;
      }
    } else {
      labelPoints += label.cellsCount * label.cellsCount * label.cellsCount;
    }
  }

  if (points) {
    for (x = 0; x < 6; x++) {
      this._map[x] = this._map[x].filter(function (cell) {
        return cell !== null;
      });
    }
  }

  //printErr(JSON.stringify(this._labels));
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
  if (
      (x < 0 || x >= 6) || // out of bounds
      (y < 0 || y >= 12) // out of bounds
    ) {
    return;
  }

  var cell = this._map[x][y];
  if (
      (cell === undefined) || // invalid cell
      (this._labelsMap[x][y]) // already labeled
    ) {
    return;
  }

  if (cell === 0) {
    // mark the cell only as one to remove
    currentLabel.cellsToRemove.push([x, y]);

    // increment skull counter
    currentLabel.skullsCount++;
  }

  if (cell === currentLabel.color) {
    // mark the current cell
    currentLabel.cellsToRemove.push([x, y]);
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
      row += this._map[x][y] ? colors[this._map[x][y]][0] : '.';
    }

    printErr(row);
  }

  printErr('------');
};

GameMap.turnCache = turnCache;
GameMap.roundCache = roundCache;
module.exports = GameMap;
