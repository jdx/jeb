'use strict';

let Promise  = require('bluebird');
let _        = require('lodash');
let registry = require('./registry');
let path     = require('path');
let archy    = require('archy');
let config   = require('./config');

let contains = (arr, i) =>  arr.indexOf(i) !== -1;

function depsByMostUsed (tree, all) {
  all = all || new Map();
  for (let i of tree) {
    let key  = `${i[0]}@${i[1].version}`;
    all.set(key, all.get(key)+1 || 1);
    depsByMostUsed(i[1].dependencies, all);
  }
  return Array.from(all.entries())
  .sort((a,b) => {
    if (a[1] > b[1]) return -1;
    if (a[1] < b[1]) return 1;
    if (a[0] < b[0]) return -1;
    if (a[0] > b[0]) return 1;
  })
  .map(e => e[0]);
}

function getNode (tree, p) {
  let node = tree;
  for (let dir of p.split('/')) {
    node = node.get(dir).dependencies;
  }
  return node;
}

function pop (tree, p) {
  let dir = getNode(tree, path.dirname(p));
  let n = dir.get(path.basename(p));
  dir.delete(path.basename(p));
  return n;
}

function search (root, name, version, dir, paths) {
  paths = paths || [];
  dir = dir || '';
  for (let node of root) {
    let d = path.join(dir, node[0]);
    search(node[1].dependencies, name, version, d, paths);
    if (node[0] === name && node[1].version === version) paths.push(d);
  }
  return paths;
}

function moveup (tree, name, version, dir) {
  dir = dir || '/';
  let paths = search(tree, name, version).sort();
  let existing = tree.get(name);
  if (existing && existing.version === version) {
    // matching version found, clear out other references
    // since they can just point to this one
    paths.filter(p => p !== name).forEach(p => pop(tree, p));
  } else if (existing) {
    // package is already at this level
    // but it is the wrong version
    // move up one directory and try again
    _(paths)
    .map(p => p.split('/')[0])
    .uniq()
    .forEach(p => moveup(getNode(tree, p), name, version, path.join(dir, p)));
  } else {
    // no version of this package is here
    // move it here to keep as flat as possible
    tree.set(name, pop(tree, paths.pop()));
    paths.forEach(p => pop(tree, p));
  }
}

function dedupe (tree) {
  for (let dep of depsByMostUsed(tree)) {
    moveup(tree, ...dep.split('@'));
  }
  return tree;
}

function get (packages, parents) {
  parents = parents || [];
  let tree = new Map();
  return Promise.map(_.toPairs(packages), p => {
    // skip cyclical dependency
    if (contains(parents, p[0])) return;
    return registry.getPackageVersion(p[0], p[1])
    .then(pkg => {
      let p = parents.concat(pkg.name);
      return get(pkg.dependencies || {}, p)
      .then(deps => {
        tree.set(pkg.name, {version: pkg.version, dependencies: deps, path: p});
      });
    });
  }, {concurrency: 15})
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
