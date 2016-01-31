'use strict';

let Promise = require('bluebird');
let fs      = require('mz/fs');
let rimraf  = Promise.promisify(require('rimraf'));
let log     = require('./log');
let path    = require('path');
let chalk   = require('chalk');
let config  = require('./config');

const ignore = ['.bin'];

function prune (tree) {
  let task  = new log.Task('pruning');
  let count = 0;

  function next (dir) {
    return fs.readdir(path.join(dir, 'node_modules'))
    .then(function (modules) {
      return Promise.map(modules, m => {
        if (ignore.indexOf(m) !== -1) return;
        let node = tree.get(m);
        let nextDir = path.join(dir, 'node_modules', m);
        if (node) return next(nextDir);
        else {
          count++;
          task.info(chalk.yellow(`${count} modules pruned`));
          return rimraf(nextDir);
        }
      });
    })
    .catch(err => { if (err.code !== 'ENOENT') throw err; })
    .then(() => task.info(chalk.green(`${count} modules pruned`)));
  }
  return next(config.root());
}

module.exports = prune;
