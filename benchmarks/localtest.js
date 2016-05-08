var actions = [];
for (var z = 0; z < 20; z++) {
  var test = new GameMap();
  var rotation = Math.floor(Math.random() * 4);
  var minColumn = 0;
  var colCount = 6;
  if (rotation === 0) {
    minColumn = 0;
    colCount = 5;
  } else if (rotation === 2) {
    minColumn = 1;
    colCount = 5;
  }

  var column = minColumn + Math.floor(Math.random() * colCount);
  var block = [Math.floor(2 + Math.random() * 5), Math.floor(2 + Math.random() * 5)];

  actions.push({ block: block, column: column, rotation: rotation });
}
console.time('round1');
for (var i = 0; i < 5000; i++) {
  var test = new GameMap();
  for (var z = 0; z < 8; z++) {

    test.add(actions[z].block, actions[z].column, actions[z].rotation);
  }


}
console.timeEnd('round1');
