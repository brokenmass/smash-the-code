'use strict';

function cloneJSON(object) {
  return JSON.parse(JSON.stringify(object));
}

module.exports = {
  cloneJSON: cloneJSON
};
