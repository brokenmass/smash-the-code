/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var Bot = __webpack_require__(1);

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

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var utils = __webpack_require__(2);

	function Bot(index, name, checkpoints) {
	    this.index = index;
	    this.name = name;
	    this.checkpoints = checkpoints;
	    this.checkpointsCount = 0;
	}

	Bot.prototype.parse = function(inputs) {
	    this.command = null;
	    this.pos = {
	        x: parseInt(inputs[0]),
	        y: parseInt(inputs[1]),
	        angle: utils.normalizeAngle(parseInt(-inputs[4]) * utils.DEG2RAD)
	    };
	    this.speed = {
	        x: parseInt(inputs[2]),
	        y: parseInt(inputs[3]),
	        angle: Math.atan2(-inputs[3], inputs[2])
	    };
	    this.speed.abs = utils.calc2dDist(this.speed.x, this.speed.y);
	    if(this.checkPointId && this.checkPointId !==parseInt(inputs[5])) {
	        this.checkpointsCount++;
	    }
	    this.checkPointId = parseInt(inputs[5]);
	    this.setTarget(this.checkPointId);
	};

	Bot.prototype.setTarget = function(targetId) {
	    var checkpoint = this.checkpoints[targetId];
	    this.target = {
	        id: targetId,
	        x: checkpoint.x,
	        y: checkpoint.y
	    };

	    this.target.distance = utils.calc2dDist(this.target.x - this.pos.x, this.target.y - this.pos.y);

	    var correction = this.target.distance/4;
	    var dx = -Math.floor(correction*Math.cos(checkpoint.angleToNext));
	    var dy =  Math.floor(correction*Math.sin(checkpoint.angleToNext));

	    this.target.angle = Math.atan2(-(this.target.y - this.pos.y), this.target.x - this.pos.x);
	    this.target.optimalAngle = Math.atan2(-(this.target.y + dy - this.pos.y), this.target.x + dx - this.pos.x);

	    printErr('optimization',correction,dx,dy,checkpoint.angleToNext * utils.RAD2DEG);
	    this.calcDeltas();
	};

	Bot.prototype.nextTarget = function() {
	    var nextTargetId = ++this.target.id % this.checkpoints.length;
	    this.setTarget(nextTargetId);
	};

	Bot.prototype.calcDeltas = function() {
	    this.deltaPosTarget = {
	        x: this.target.x - this.pos.x,
	        y: this.target.y - this.pos.y,
	        angle: utils.normalizeAngle(this.target.angle - this.pos.angle),
	        optimalAngle: utils.normalizeAngle(this.target.optimalAngle - this.pos.angle)
	    };


	    this.deltaSpeedTarget = {
	        angle: utils.normalizeAngle(this.target.angle - this.speed.angle),
	        optimalAngle: utils.normalizeAngle(this.target.optimalAngle - this.speed.angle)
	    };
	};

	Bot.prototype.calcETA = function() {
	    var eta = (this.target.distance-400) / (this.speed.abs * Math.cos(this.deltaSpeedTarget.angle));
	    if(eta <0) {
	        eta = Infinity;
	    }
	    printErr('ETA' , eta);
	    return eta;
	};

	Bot.prototype.calcThrust = function() {

	    var speed = 0;
	    var eta = this.calcETA();

	    if(eta < (1 + Math.sqrt(this.speed.abs * Math.cos(this.deltaSpeedTarget.angle))/10)) {
	        //approach mode
	        var maxspeed = 200;
	        var angleRatio = utils.normalizeAngle(this.target.optimalAngle - this.deltaSpeedTarget.angle)*10/Math.PI; //0-10
	        this.nextTarget();
	        this.calcCommand();

	        speed = (maxspeed/ 1+(angleRatio)) * (1.05-Math.abs(this.deltaSpeedTarget.angle)/Math.PI);
	        printErr('approach mode', angleRatio, speed);
	        }
	    else {
	        this.calcCommand();
	        speed = 200 * (1.05-Math.abs(this.deltaSpeedTarget.optimalAngle)/Math.PI);
	        printErr('navigation mode', speed);
	    }

	    if(Math.abs(utils.normalizeAngle(this.command.angle - this.pos.angle)) > Math.PI/2) {
	        speed = (10 - Math.abs(this.deltaPosTarget.angle)*10/Math.PI);
	        speed=0;
	        printErr('brake mode', speed);
	    }

	    this.command.thrust = utils.speedBound(speed, 20);
	};

	Bot.prototype.calcCommand = function() {

	    var angle = this.target.optimalAngle;

	    if( this.deltaSpeedTarget.angle !== 0 &&
	        Math.abs(this.deltaSpeedTarget.angle) < Math.PI/2) {
	        // compensate vector
	        angle += this.deltaSpeedTarget.optimalAngle;
	    }


	    var dx =  Math.floor(4000*Math.cos(angle));
	    var dy = -Math.floor(4000*Math.sin(angle));
	    this.command = {
	        x: this.pos.x + dx,
	        y: this.pos.y + dy,
	        dx: dx,
	        dy: dy,
	        angle: angle
	    };
	};

	Bot.prototype.printCommand = function() {
	    if(!this.command) {
	        this.calcThrust();

	    }
	    this.debug();
	    print(this.command.x+' '+ this.command.y +' '+ this.command.thrust);
	};

	Bot.prototype.debug = function() {
	    printErr('---------------------');
	    printErr(this.name, this.checkpointsCount);
	    printErr('Pos    ', JSON.stringify(this.pos));
	    printErr('Speed  ', JSON.stringify(this.speed));
	    printErr('Target ', JSON.stringify(this.target));
	    printErr('DeltaPosTarget  ', JSON.stringify(this.deltaPosTarget));
	    printErr('DeltaSpeedTarget', JSON.stringify(this.deltaSpeedTarget));
	    printErr('Command', JSON.stringify(this.command));
	    printErr('---------------------');
	};





	module.exports = Bot;

/***/ },
/* 2 */
/***/ function(module, exports) {

	var DEG2RAD = Math.PI / 180;

	function speedBound(speed, minSpeed) {
	    return Math.floor(Math.max(minSpeed,Math.min(200,speed)));
	}

	function normalizeAngle(angle) {

	    while(angle>Math.PI) { angle-=2*Math.PI;}
	    while(angle<-Math.PI) { angle+=2*Math.PI;}
	    return angle;
	}
	function calc2dDist(dx,dy) {
	    return Math.sqrt(Math.pow(dx,2) + Math.pow(dy,2));
	}

	module.exports = {
		DEG2RAD: DEG2RAD,
		RAD2DEG: 1/DEG2RAD,
		speedBound: speedBound,
		normalizeAngle: normalizeAngle,
		calc2dDist: calc2dDist
	};

/***/ }
/******/ ]);