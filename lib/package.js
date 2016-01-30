'use strict';

let _        = require('lodash');
let registry = require('./registry');

function getDepTree (packages) {
  return Promise.all(_.map(packages, (v,p) => {
    return registry.getPackageVersion(p,v)
    .then(p => {
      let k = `${p.name}@${p.version}`;
      if (!p.dependencies) return {[k]: {}};
      return getDepTree(p.dependencies)
      .then(tree => { return {[k]: tree}; });
    });
  }))
  .then(packages => _.reduce(packages, (c,p) => _.merge(c,p), {}));
}

module.exports = {
  getDepTree,
};
