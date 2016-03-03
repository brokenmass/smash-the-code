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