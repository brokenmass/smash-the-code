'use strict';

var colors = require('./colors');

var turnCache = { _hits: 0 };
var roundCache = { _hits: 0 };

function GameMap(initalMap) {
  this._map = initalMap;
  this._debug = false;
}

GameMap.prototype.debug = function debug(message) {
  if (this._debug) {
    printErr(message);
  }
};

GameMap.prototype.serialize = function serialize() {
  var x, y, row, rowLen, out = '';
  for (x = 0; x < 6; x++) {
    row = this._map[x];
    rowLen = row.length;
    for (y = 0; y < rowLen; y++) {
      out += row[y];
    }

    out += '|';
  }

  return out;
};

GameMap.prototype.clone = function clone() {
  return new GameMap(this.cloneMap(this._map));
};

GameMap.prototype.cloneMap = function cloneMap(original) {
  var map = new Array(6);
  for (var x = 0; x < 6; x++) {
    map[x] = [].concat(original[x]);
  }

  return map;
};

var rotations = [1, 0, -1, 0];
GameMap.prototype.add = function add(block, column1, rotation) {

  var column2 = column1 + rotations[rotation];
  if (column2 < 0 || column2 >= 6) {
    return false;
  }

  var col1Len = this._map[column1].length;
  var col2Len = this._map[column2].length;

  if (
    (column1 === column2 && col1Len > 10) ||
    (column1 !== column2 && (col1Len > 11 || col2Len > 11))
  ) {
    return false;
  }

  if (rotation === 3) {
    this._map[column1].push(block[1]);
    this._map[column2].push(block[0]);
  } else {
    this._map[column1].push(block[0]);
    this._map[column2].push(block[1]);
  }

  return this.calcTurnScore();
};

GameMap.prototype.addNuisance = function (nuisanceLines) {
  var nuisance = (new Array(nuisanceLines)).fill(0);
  for (var x = 0; x < 6; x++) {
    this._map[x] = this._map[x].concat(nuisance);
  }
};

GameMap.prototype.calcTurnScore = function calcTurnScore() {
  var id = this.serialize();
  var tc = turnCache[id];
  if (tc) {
    turnCache._hits++;
    if (tc.turnScore.points) {
      this._map = this.cloneMap(tc.map);
    }

    return tc.turnScore;
  }

  var turnScore = {
    points: 0,
    labelPoints: 0,
    heightPoints: 0,
    destroyedSkulls: 0,
    chains: -1
  };

  var roundScore = this.calcRoundScore();
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

  }

  turnScore.labelPoints = roundScore.labelPoints;

  var maxHeight = 0;
  for (var i = 0; i < 6; i++) {
    var height = this._map[i].length;
    if (height > maxHeight) {
      maxHeight = height;
    }
  }

  turnScore.heightPoints = maxHeight;

  turnCache[id] = {
    map: turnScore.points ? this.cloneMap(this._map) : null,
    turnScore: turnScore
  };

  return turnScore;
};

GameMap.prototype.calcRoundScore = function calcRoundScore() {
  var id = this.serialize();
  var x, y, i, cell, len;
  var rc = roundCache[id];

  if (rc) {
    roundCache._hits++;
    if (rc.roundScore.points) {
      this._map = this.cloneMap(rc.map);
    }

    return rc;
  }

  var labels = [];
  var labelsMap = [[], [], [], [], [], []];

  for (x = 0; x < 6; x++) {
    len = this._map[x].length;
    for (y = 0; y < len; y++) {
      cell = this._map[x][y];

      if (cell !== 0 && !labelsMap[x][y]) {
        // cell, reachable, cellsCount, skullsCount, removeX, removeY,...
        var newLabel = [cell, 0, 0, 0];
        labels.push(newLabel);
        this.dfs(x, y, newLabel, labelsMap);
      }
    }
  }

  var points = 0;
  var labelPoints = 0;
  var groupBonus = 0;
  var destroyedColors = {};
  var destroyedSkulls = 0;

  var labelsLength = labels.length;
  for (i = 0; i < labelsLength; i++) {
    var label = labels[i];
    var cellsCount = label[2];
    if (cellsCount >= 4) {
      // happy time !
      points += (10 * cellsCount);
      destroyedSkulls += label[3];
      if (cellsCount >= 11) {
        groupBonus += 8;
      } else {
        groupBonus += cellsCount - 4;
      }

      destroyedColors[label[0]] = true;
      var cellsToRemoveLength = label.length;
      for (x = 4; x < cellsToRemoveLength; x += 2) {
        this._map[label[x]][label[x + 1]] = null;
      }
    } else {
      var groupPoint = cellsCount * cellsCount * cellsCount / 10;
      labelPoints += groupPoint * (label[1] ? cellsCount : 1);
    }
  }

  if (points) {
    for (x = 0; x < 6; x++) {
      this._map[x] = this._map[x].filter(function (cell) {
        return cell !== null;
      });
    }
  }

  var colorBonus = Object.keys(destroyedColors).length - 1;

  var roundScore = {
    points: points,
    labelPoints: labelPoints,
    destroyedSkulls: destroyedSkulls,
    labelsCount: labels.length,
    colorBonus: colorBonus,
    groupBonus: groupBonus
  };

  roundCache[id] = {
    map: points ? this.cloneMap(this._map) : null,
    roundScore: roundScore
  };

  return roundScore;
};

var dx = [+1, 0, -1, 0];
var dy = [0, +1, 0, -1];
GameMap.prototype.dfs = function dfs(x, y, currentLabel, labelsMap) {
  if (
      (x < 0 || x >= 6) || // out of bounds
      (y < 0 || y >= 12) // out of bounds
    ) {
    return;
  }

  var cell = this._map[x][y];
  if (cell === undefined) { // empty cell
    currentLabel[1]++;
    return;
  }

  if (labelsMap[x][y]) { // already labeled
    return;
  }

  if (cell === 0) {
    // mark the cell only as one to remove
    currentLabel.push(x);
    currentLabel.push(y);

    // increment skull counter
    currentLabel[3]++;
  }

  if (cell === currentLabel[0]) {
    // mark the current cell
    currentLabel.push(x);
    currentLabel.push(y);
    labelsMap[x][y] = true;

    // increment cell counter
    currentLabel[2]++;

    // recursively mark the neighbors
    for (var direction = 0; direction < 4; ++direction) {
      this.dfs(x + dx[direction], y + dy[direction], currentLabel, labelsMap);
    }
  }
};

GameMap.prototype.debugMap = function debugMap() {
  printErr('------');
  for (var y = 11; y >= 0; y--) {
    var row = '';
    for (var x = 0; x < 6; x++) {
      row += this._map[x][y] !== undefined ? colors[this._map[x][y]][0] : '.';
    }

    printErr(row);
  }

  printErr('------');
};

GameMap.resetCache = function () {
  turnCache = { _hits: 0 };
  roundCache = { _hits: 0 };
  GameMap.turnCache = turnCache;
  GameMap.roundCache = roundCache;
};

GameMap.turnCache = turnCache;
GameMap.roundCache = roundCache;

module.exports = GameMap;
