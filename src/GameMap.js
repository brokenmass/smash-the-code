'use strict';
var colors = ['skull', 'blue', 'green', 'purple', 'red', 'yellow'];

function GameMap(initialStatus) {
  this._map = initialStatus;
}

GameMap.prototype.clone = function clone() {
  return new GameMap(JSON.parse(JSON.stringify(this._map)));
};

GameMap.prototype.add = function add(block, column) {
  if (this._map[column].length > 10) {
    return false;
  }

  this._map[column].push({
    color: +block[0]
  });
  this._map[column].push({
    color: +block[1]
  });

  return this.evaluate();
};

GameMap.prototype.evaluate = function evaluate(score) {
  var x, y, i, cell;
  var labels = [];
  score = score || {
    points: 0,
    chains: -1
  };
  printErr('----------------------------');

  for (x = 0; x < 6; x++) {
    for (y = 0; y < this._map[x].length; y++) {
      cell = this._map[x][y];
      cell.id = x + '-' + y;
      cell.colorName = colors[cell.color];
    }
  }

  this._labelsMap = [[], [], [], [], [], []];

  for (x = 0; x < 6; x++) {
    for (y = 0; y < this._map[x].length; y++) {
      cell = this._map[x][y];
      //printErr('checking:' + cell.id + ' - labelled: ' + this._labelsMap[x][y]);
      if (cell.color !== 0 && !this._labelsMap[x][y]) {
        var newLabel = {
          color: cell.color,
          colorName: cell.colorName,
          cellCount: 0,
          cellToRemove: {}
        };
        labels.push(newLabel);
        this.dfs(x, y, newLabel);
      }
    }
  }

  var roundPoints = 0;
  var groupBonus = 0;
  var destroyedColors = {};
  for (i = 0; i < labels.length; i++) {
    var label = labels[i];
    printErr(x + ') ' + label.colorName + ' : ' + label.cellCount);
    if (label.cellCount >= 4) {
      // happy time !
      roundPoints += (10 * label.cellCount);
      if (label.cellCount >= 11) {
        groupBonus += 8;
      } else {
        groupBonus += label.cellCount - 4;
      }

      destroyedColors[label.color] = true;
      for (x = 0; x < 6; x++) {
        this._map[x] = this._map[x].filter(function (cell) {
          return !label.cellToRemove[cell.id];
        });
      }
    }
  }

  var colorBonus = Object.keys(destroyedColors).length - 1;

  if (roundPoints) {
    score.chains++;
    var bonus = groupBonus;
    if (colorBonus) {
      printErr('colorBonus ' + colorBonus);
      bonus += Math.pow(2, colorBonus);
    }

    if (score.chains) {
      printErr('chainBonus ' + score.chains);
      bonus += (Math.pow(2, score.chains - 1) * 8);
    }

    bonus = Math.max(1, Math.min(999, bonus));
    printErr(' -- roundPoints ' + roundPoints);
    printErr(' -- bonus ' + bonus);
    score.points += roundPoints * bonus;
    return this.evaluate(score);
  } else {
    return score;
  }
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
  }

  if (this._map[x][y].color === currentLabel.color) {
    //printErr(' ---- DFS ' + this._map[x][y].id + ' - ' + JSON.stringify(currentLabel));

    // mark the current cell
    currentLabel.cellToRemove[this._map[x][y].id] = true;
    this._labelsMap[x][y] = true;

    // increment cell counter
    currentLabel.cellCount++;

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