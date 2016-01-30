'use strict';

let _        = require('lodash');
let registry = require('./registry');
let path     = require('path');
let archy    = require('archy');
let config   = require('./config');

function paths (tree) {
  let paths = [];
  Array.from(tree.keys()).forEach((n, p) => {
    paths.push(n);
  });
  return paths;
}

function dedupe (old) {
  let tree = new Map();
  console.dir(paths(old));
  return tree;
}

function get (packages) {
  let tree = new Map();
  return Promise.all(_.map(packages, (v,p) => {
    return registry.getPackageVersion(p, v)
    .then(p => {
      if (!p.dependencies) return tree.set(p.name, {dependencies: new Map(), version: p.version});
      return get(p.dependencies)
      .then(dependencies => tree.set(p.name, {dependencies, version: p.version}));
    });
  }))
  .then(() => tree);
}

function print (tree) {
  let traverse = node => {
    return Array.from(node.keys()).sort()
    .map(name => {
      let p = node.get(name);
      return {
        label: `${name}@${p.version}`,
        nodes: traverse(p.dependencies || new Map()),
      };
    });
  };
  console.log(archy({
    label: path.basename(config.root()),
    nodes: traverse(tree),
  }));
}

module.exports = {
  get: get,
  print,
  dedupe,
};
