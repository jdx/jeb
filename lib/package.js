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

function printDepTree (tree, prefix, root) {
  root = root === false ? false : true;
  prefix = prefix || '';
  _.sortBy(Array.from(tree.keys()), 'name')
  .forEach((k,i,a) => {
    let subtree = tree.get(k);
    let last = a.length === i+1;
    let pipe = last ? '└─' : '├─';
    if (subtree.size === 0) pipe += '─ ';
    else                    pipe += '┬ ';
    console.log(`${prefix}${root ? '' : pipe}${printKey(k)}`);
    if (subtree) printDepTree(subtree, root ? '' : (last ? prefix+'  ' : prefix+'│ '), false);
  });
}

module.exports = {
  getDepTree,
  printDepTree,
};
