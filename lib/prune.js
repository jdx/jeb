'use strict';

let Promise = require('bluebird');
let fs      = require('mz/fs');
let rimraf  = Promise.promisify(require('rimraf'));
let log     = require('./log');
let path    = require('path');
let config  = require('./config');
let _       = require('lodash');

const ignore = ['.bin'];

function prune (tree) {
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
          .then(() => log.info(`pruned ${nextDir}`));
        }
      });
    })
    .catch(err => { if (err.code !== 'ENOENT') throw err; });
  }
  return next(config.root(), tree);
}

module.exports = prune;
