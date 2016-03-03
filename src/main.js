var Bot = require('./bot');

/**
 * Auto-generated code below aims at helping you parse
 * the standard input according to the problem statement.
 **/

var laps = parseInt(readline());
var checkpointCount = parseInt(readline());
var checkpoints = [];
for (var i = 0; i < checkpointCount; i++) {
    var inputs = readline().split(' ');
    var checkpointX = parseInt(inputs[0]);
    var checkpointY = parseInt(inputs[1]);
    checkpoints.push({x:checkpointX, y:checkpointY});

}
for (var i = 0; i < checkpointCount; i++) {
    var cur = checkpoints[i];
    var next = checkpoints[i+i];
    if(!next) {
        next = checkpoints[0];
    }
    cur.angleToNext = Math.atan2(-(next.y - cur.y), next.x - cur.x);
}





var myBots = [new Bot(0, 'POD_01', checkpoints), new Bot(1, 'POD_02', checkpoints)];
printErr(JSON.stringify(checkpoints));

// game loop
while (true) {
    for (var i = 0; i < 2; i++) {

        var inputs = readline().split(' ');
        myBots[i].parse(inputs);
    }
    for (var i = 0; i < 2; i++) {
        var inputs = readline().split(' ');
        var x = parseInt(inputs[0]);
        var y = parseInt(inputs[1]);
        var vx = parseInt(inputs[2]);
        var vy = parseInt(inputs[3]);
        var angle = parseInt(inputs[4]);
        var nextCheckPointId = parseInt(inputs[5]);
    }

    myBots[0].printCommand();
    myBots[1].printCommand();
}

function speedBound(speed, minSpeed) {
    return Math.floor(Math.max(minSpeed,Math.min(200,speed)));
}

function normalizeAngle(angle) {

    while(angle>Math.PI) { angle-=2*Math.PI;}
    while(angle<-Math.PI) { angle+=2*Math.PI;}
    return angle;
}