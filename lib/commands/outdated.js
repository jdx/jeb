'use strict';

let Promise  = require('bluebird');
let david    = Promise.promisifyAll(require('david'));
let manifest = require('../manifest');

function run () {
  return manifest.project()
  .then(david.getDependenciesAsync)
  .then(deps => {
    for (let name of Object.keys(deps)) {
      let dep = deps[name];
      if (dep.required !== dep.latest) {
        console.log(name, dep);
      }
    }
  });
}

module.exports = {
  run,
};
