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

function printDepTree (tree, prefix) {
  prefix = prefix || '';
  _.sortBy(Array.from(tree.keys()), 'name')
  .forEach(k => {
    console.log(`${prefix}${printKey(k)}`);
    let subtree = tree.get(k);
    if (subtree) printDepTree(subtree, prefix + ' ');
  });
}

module.exports = {
  getDepTree,
  printDepTree,
};
