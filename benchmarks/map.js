'use strict';

var turnCache = { _hits: 0 };
//var roundCache = { _hits: 0 };

var stateCache = new Map();

function GameMap(id, buffer) {
  this._buffer = buffer || new ArrayBuffer(6 + 72);
  this._map = new Uint8ClampedArray(this._buffer);
}
GameMap.rcHits = 0;

GameMap.prototype.clone = function () {
  return new GameMap(this._id, this._buffer);
};

GameMap.prototype.serialize = function serialize() {
  var x, y, rowLen, out = '';
  for (x = 0; x < 6; x++) {

    rowLen = this._map[x];
    for (y = 0; y < rowLen; y++) {
      out += this._map[6 + (x * 12) + y];
    }

    out += '|';
  }

  return out;
};

var rotations = [1, 0, -1, 0];
GameMap.prototype.add = function add(block, column1, rotation) {
  var column2 = column1 + rotations[rotation];
  if (column2 < 0 || column2 >= 6) {
    return false;
  }

  var moveid ='' + block[0] + block[1] + column1 + column2;
  var sc = stateCache.get(this._buffer);
  if (sc && sc[moveid]) {
    GameMap.rcHits++;
    this._buffer = sc[moveid];
  } else {
    var col1Len = this._map[column1];
    var col2Len = this._map[column2];
    if (
      (column1 === column2 && col1Len > 10) ||
      (column1 !== column2 && (col1Len > 11 || col2Len > 11))
    ) {
      return false;
    }

    var newBuffer = this._buffer.slice();
    this._map = new Uint8ClampedArray(newBuffer);

    var pos1 = 6 + (column1 * 12) + this._map[column1]++;
    var pos2 = 6 + (column2 * 12) + this._map[column2]++;

    if (rotation === 3) {
      this._map[pos1] = block[1];
      this._map[pos2] = block[0];
    } else {
      this._map[pos1] = block[0];
      this._map[pos2] = block[1];
    }

    sc = sc || {};
    sc[moveid] = newBuffer;
    stateCache.set(this._buffer, sc);

    this._buffer = newBuffer;
  }

  return this.calcRoundScore();
};

GameMap.prototype.calcRoundScore = function calcRoundScore() {
  /*
  var sc = stateCache.get(this._buffer);
  if (sc && sc.destBuffer) {
    GameMap.rcHits++;
    this._buffer = sc.destBuffer;
    return sc.points;
  }*/
  var map = new Uint8ClampedArray(this._buffer);

  var x, y, cell, len, base;
  var labels = [];
  var labelsMap = new Uint8ClampedArray(new ArrayBuffer(6 + 72));

  for (x = 0; x < 6; x++) {
    len = map[x];
    base = 6 + (x * 12);
    for (y = 0; y < len; y++) {
      i = base + y;
      cell = map[i];
      if (cell > 1 && !labelsMap[i]) {
        // cell, reachable, cellsCount, skullsCount, removeiI1, removeI2,...
        var newLabel = [cell, 0, 0, 0];
        labels.push(newLabel);
        this.dfs(i, newLabel, labelsMap);
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
      for (x = 4; x < cellsToRemoveLength; x++) {
        map[label[x]] = 0;
      }
    } else {
      var groupPoint = cellsCount * cellsCount * cellsCount / 10;
      labelPoints += groupPoint * (label[1] ? cellsCount : 1);
    }
  }

  if (points) {
    //var newBuffer = this._buffer.slice();

    var r, w;
    for (x = 0; x < 6; x++) {
      len = map[x];
      base = 6 + (x * 12);
      for (r = w = 0; r < len; r++, w++) {
        while (!map[base + r] && r < len) {
          r++;
        }

        map[base + w] = map[base + r];
      }

      map[x] = w;
      for (w; w < len; w++) {
        map[base + w] = 0;
      }
    }
    /*
    stateCache.set(this._buffer, {
      destBuffer: newBuffer,
      points: points
    });
    */
  }

  return points;
};

var neighborsMap = new Array(78);
for (var i = 6; i < 78; i++) {
  var left = i - 12;
  var right = i + 12;
  var bottom = i - 1;
  var top = i + 1;

  neighborsMap[i] = [];
  if (i >= 18) {
    neighborsMap[i].push(left);
  }

  if (i < 66) {
    neighborsMap[i].push(right);
  }

  if ((i - 6) % 12 !== 0) {
    neighborsMap[i].push(bottom);
  }

  if ((i - 5) % 12 !== 0) {
    neighborsMap[i].push(top);
  }
}

GameMap.prototype.dfs = function dfs(i, currentLabel, labelsMap) {
  if (i < 6 || i >= 78) {
    return;
  }

  var cell = this._map[i];
  if (!cell) { // empty cell
    currentLabel[1]++;
    return;
  }

  if (labelsMap[i]) { // already labeled
    return;
  }

  if (cell === 1) {
    // mark the cell only as one to remove
    currentLabel.push(i);

    // increment skull counter
    currentLabel[3]++;
  }

  if (cell === currentLabel[0]) {
    // mark the current cell
    currentLabel.push(i);
    labelsMap[i] = 1;

    // increment cell counter
    currentLabel[2]++;

    // recursively mark the neighbors
    var neighbors = neighborsMap[i];
    for (var l = 0; l < neighbors.length; ++l) {
      this.dfs(neighbors[l], currentLabel, labelsMap);
    }
  }
};

var colors = ['.', 'Skull', 'Blue', 'Green', 'Purple', 'Red', 'Yellow'];
GameMap.prototype.debugMap = function debugMap() {
  printErr();
  printErr('------');
  for (var y = 11; y >= 0; y--) {
    var row = '';
    for (var x = 0; x < 6; x++) {
      var cell = this._map[6 + (x * 12) + y];
      row += cell ? (cell -1) : '.';
    }

    printErr(row);
  }

  printErr('------');
  for (var x = 0; x < 6; x++) {
    var cell = this._map[x];
    row += cell ? (cell -1) : '.';
  }
  printErr('------');
};

GameMap.turnCache = turnCache;
GameMap.roundCache = stateCache;
module.exports = GameMap;
