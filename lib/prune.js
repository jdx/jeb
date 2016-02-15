'use strict';

let Promise = require('bluebird');
let fs      = require('mz/fs');
let rimraf  = Promise.promisify(require('rimraf'));
let log     = require('./log');
let path    = require('path');
let config  = require('./config');
let _       = require('lodash');
let chalk   = require('chalk');
let io      = require('./io');

const ignore = ['.bin'];

function prune (tree) {
  let count = 0;
  function status () {
    process.stdout.write(`\rPruning extraneous packages... ${chalk.yellow(count)} pruned`);
    count++;
  }
  function done () {
    if (count === 0) return;
    process.stdout.write('\r' + ' '.repeat(`Pruning extraneous packages... ${count} pruned`.length + '\r'));
    console.log(`\rPruned ${chalk.red(count)} extraneous ${io.plural('package', count)}.`);
  }
  function next (dir, tree) {
    return fs.readdir(path.join(dir, 'node_modules'))
    .then(function (modules) {
      return Promise.map(modules, m => {
        if (_.includes(ignore, m)) return;
        let node = tree.get(m);
        let nextDir = path.join(dir, 'node_modules', m);
        if (node) return next(nextDir, node.dependencies);
        else {
          return rimraf(nextDir)
          .then(() => {log(`pruned ${nextDir}`); status();});
        }
      });
    })
    .catch(err => { if (err.code !== 'ENOENT') throw err; });
  }
  return next(config.root(), tree)
  .then(() => done());
}

module.exports = prune;
