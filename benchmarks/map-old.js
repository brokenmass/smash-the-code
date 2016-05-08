'use strict';

var turnCache = { _hits: 0 };
var roundCache = { _hits: 0 };

function GameMap() {
  this._map = [[], [], [], [], [], []];
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

  return this.calcRoundScore();
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

GameMap.prototype.calcRoundScore = function calcRoundScore() {
  var id = this.serialize();
  var rc = roundCache[id];
  if (rc) {
    roundCache._hits++;
    this._map = this.cloneMap(rc.map);
    return rc.points;
  }

  var x, y, cell, len;
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

  var i;
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

    roundCache[id] = {
      map: this.cloneMap(this._map),
      points: points
    };
  }

  return points;
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

var colors = ['Skull', 'Blue', 'Green', 'Purple', 'Red', 'Yellow'];
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

GameMap.turnCache = turnCache;
GameMap.roundCache = roundCache;
module.exports = GameMap;
