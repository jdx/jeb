'use strict';

let pkg = require('../package');
let _   = require('lodash');

function run (args) {
  let packages = _.reduce(args.slice(3), (l, p) => {
    l[p] = null;
    return l;
  }, {});
  return pkg.getDepTree(packages)
  .then(function (tree) {
    console.dir(tree);
  });
}

module.exports = {
  run: run,
};
