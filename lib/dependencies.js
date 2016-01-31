'use strict';

let _        = require('lodash');
let registry = require('./registry');
let path     = require('path');
let archy    = require('archy');
let config   = require('./config');

function depsByMostUsed (tree, all) {
  all = all || new Map();
  Array.from(tree.entries()).forEach(i => {
    let key  = `${i[0]}@${i[1].version}`;
    all.set(key, all.get(key)+1 || 1);
    depsByMostUsed(i[1].dependencies, all);
  });
  return _.orderBy(Array.from(all.entries()), ['[1]', '[0]'], ['desc', 'asc']).map(e => e[0]);
}

function getDir (tree, p) {
  if (p.indexOf('/') === -1) return tree;
  let node = tree;
  for (let dir of path.dirname(p).split('/')) {
    node = node.get(dir).dependencies;
  }
  return node;
}

function pop (tree, p) {
  let dir = getDir(tree, p);
  let n = dir.get(path.basename(p));
  dir.delete(path.basename(p));
  return n;
}

function search (node, name, version, dir) {
  dir = dir || '';
  return _.flatMap(Array.from(node.entries()), node => {
    let d = path.join(dir, node[0]);
    let subpaths = search(node[1].dependencies, name, version, d);
    if (node[0] === name && node[1].version === version) return subpaths.concat(d);
    return subpaths;
  });
}

function moveup (tree, name, version) {
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
    //console.log(`move ${name} up`);
  } else {
    // no version of this package is here
    // move it here to keep as flat as possible
    tree.set(name, pop(tree, paths.pop()));
    paths.forEach(p => pop(tree, p));
  }
}

function dedupe (tree) {
  depsByMostUsed(tree).forEach(pkg => {
    moveup(tree, ...pkg.split('@'));
  });
  return tree;
}

function get (packages) {
  let tree = new Map();
  return Promise.all(_.map(packages, (v,p) => {
    return registry.getPackageVersion(p, v)
    .then(pkg => {
      return get(pkg.dependencies || {})
      .then(deps => tree.set(pkg.name, {
        dependencies: deps,
        version: pkg.version
      }));
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
