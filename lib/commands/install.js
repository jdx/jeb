'use strict';

let dependencies = require('../dependencies');
let _            = require('lodash');

function run (args) {
  let packages = _.reduce(args._.slice(1), (l, p) => {
    l[p] = null;
    return l;
  }, {});
  return dependencies.get(packages)
  .then(tree => {
    dependencies.print(tree);
    dependencies.print(dependencies.dedupe(tree));
  });
}

module.exports = {
  run,
};
