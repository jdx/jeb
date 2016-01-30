'use strict';

let _        = require('lodash');
let registry = require('./registry');
let path     = require('path');
let archy    = require('archy');
let config   = require('./config');

function dedupe (tree) {
  return tree;
}

function getDepTree (packages) {
  let tree = new Map();
  return Promise.all(_.map(packages, (v,p) => {
    return registry.getPackageVersion(p,v)
    .then(p => {
      if (!p.dependencies) return tree.set(p.name, {dependencies: new Map(), version: p.version});
      return getDepTree(p.dependencies)
      .then(dependencies => tree.set(p.name, {dependencies, version: p.version}));
    });
  }))
  .then(() => dedupe(tree));
}

function printDepTree (tree) {
  let traverse = node => {
    return Array.from(node.keys()).sort()
    .map(name => {
      let p = node.get(name);
      return {
        label: `${name}@${p.version}`,
        nodes: traverse(p.dependencies),
      };
    });
  };
  console.log(archy({
    label: path.basename(config.cwd),
    nodes: traverse(tree),
  }));
}

module.exports = {
  getDepTree,
  printDepTree,
};
