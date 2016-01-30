'use strict';

let _        = require('lodash');
let registry = require('./registry');

function getDepTree (packages) {
  let tree = new Map();
  return Promise.all(_.map(packages, (v,p) => {
    return registry.getPackageVersion(p,v)
    .then(p => {
      let k = {name: p.name, version: v || p.version};
      if (!p.dependencies) return tree.set(k, new Map());
      return getDepTree(p.dependencies)
      .then(deps => tree.set(k, deps));
    });
  }))
  .then(() => tree);
}

let printVersion = v => /^[0-9]/.test(v) ? `@${v}` : v;
let printKey = k => k.name + printVersion(k.version);

function printDepTree (tree, level) {
  level = level || 0;
  _.sortBy(Array.from(tree.keys()), 'name')
  .forEach((k,i,a) => {
    let subtree = tree.get(k);
    let last = a.length === i+1;
    let pipe = last ? '└── ' : (subtree.size === 0 ? '├── ' : '├─┬ ');
    let pre = level === 0 ? '' : '│ '.repeat(level-1)+pipe;
    console.log(`${pre}${printKey(k)}`);
    if (subtree) printDepTree(subtree, level+1);
  });
}

module.exports = {
  getDepTree,
  printDepTree,
};
