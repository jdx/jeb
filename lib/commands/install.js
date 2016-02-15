'use strict';

let Promise      = require('bluebird');
let dependencies = require('../dependencies');
let _            = require('lodash');
let registry     = require('../registry');
let config       = require('../config');
let path         = require('path');
let prune        = require('../prune');
let log          = require('../log');
let manifest     = require('../manifest');
let chalk        = require('chalk');
let io           = require('../io');

function installPackages (tree, dir) {
  process.stdout.write('\rDetermining packages to install...');
  let packages = [];
  let findPackagesToInstall = (node, root) => {
    Array.from(node.entries()).forEach(pkg => {
      let dir = path.join(root, pkg[0]);
      let addThis = () => packages = packages.concat({name: pkg[0], version: pkg[1].version, path: dir});
      try {
        let pjson = require(path.join(dir, 'package.json'));
        if (pjson.version !== pkg[1].version) addThis();
      } catch (err) {
        log(err.message);
        addThis();
      }
      findPackagesToInstall(pkg[1].dependencies, path.join(dir, 'node_modules'));
    });
  };
  findPackagesToInstall(tree, dir);
  if (packages.length === 0) {
    console.log('\rNo new packages to install.');
    return;
  }
  let count = 0;
  let total = packages.length;
  let status = () => {
    let padding = `${total}`.length - `${count}`.length;
    process.stdout.write(`\rInstalling new packages... ${' '.repeat(padding)}${chalk.yellow(count)}/${chalk.green(total)}`);
    count++;
  };
  status();
  return Promise.map(packages, pkg => {
    log(`installing ${pkg.name}`);
    return registry.fetchPackageTarball(pkg.name, pkg.version, pkg.path)
    .then(() => {
      log(`installed ${pkg.name}`);
      status();
    });
  }, {concurrency: 15})
  .then(() => {
    console.log(`\rInstalled ${chalk.green(count)} new ${io.plural('package', count)}.` + ' '.repeat(`${count}`.length+4));
  });
}

function run (args) {
  let toInstall = _.reduce(args._.slice(1), (l, p) => {
    l[p] = null;
    return l;
  }, {});
  return manifest.project()
  .then(p => p.dependencies)
  .then(p => dependencies.get(_.merge(toInstall, p)))
  .then(tree => dependencies.dedupe(tree))
  .then(tree => {
    let dir = path.join(config.root(), 'node_modules');
    return installPackages(tree, dir)
    .then(() => prune(tree));
  });
}

module.exports = {
  run,
};
