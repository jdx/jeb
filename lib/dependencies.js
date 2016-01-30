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

function pop (node, p) {
  for (let dir of path.dirname(p).split('/')) {
    node = node.get(dir).dependencies;
  }
  let n = node.get(path.basename(p));
  node.delete(path.basename(p));
  return n;
}

function search (tree, name, version, dir) {
  dir = dir || '';
  return _.flatMap(Array.from(tree.entries()), node => {
    let d = path.join(dir, node[0]);
    let subpaths = search(node[1].dependencies, name, version, d);
    if (node[0] === name && node[1].version === version) return subpaths.concat(d);
    return subpaths;
  });
}

function moveup (tree, name, version) {
  let paths = search(tree, name, version).sort();
  let existing = tree.get(name);
  if (existing) {
    console.log(`move ${name} up`);
    console.dir(paths);
  } else {
    tree.set(name, pop(tree, paths.pop()));
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
