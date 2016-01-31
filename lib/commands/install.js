'use strict';

let dependencies = require('../dependencies');
let _            = require('lodash');
let registry     = require('../registry');
let config       = require('../config');
let path         = require('path');

function installPackages (tree, dir) {
  let gatherDependencies = (node, root) => {
    return _.flatMap(Array.from(node.entries()), pkg => {
      let dir = path.join(root, pkg[0]);
      return gatherDependencies(pkg[1].dependencies, path.join(dir, 'node_modules'))
      .concat({
        name: pkg[0],
        version: pkg[1].version,
        path: dir,
      });
    });
  };
  return Promise.all(gatherDependencies(tree, dir).map(pkg => {
    return registry.fetchPackageTarball(pkg.name, pkg.version, pkg.path);
  }));
}

function run (args) {
  let packages = _.reduce(args._.slice(1), (l, p) => {
    l[p] = null;
    return l;
  }, {});
  return dependencies.get(packages)
  .then(tree => {
    return dependencies.dedupe(tree);
  })
  .then(tree => {
    dependencies.print(tree);
    let dir = path.join(config.root(), 'node_modules');
    return installPackages(tree, dir);
  })
  .then(() => console.log('done'));
}

module.exports = {
  run,
};
