'use strict';

let _       = require('lodash');
let got     = require('got');
let config  = require('./config');
let version = require('../package.json').version;
let url     = require('url');
let semver  = require('semver');

function request (path, opts) {
  opts = opts || {};
  _.defaultsDeep(opts, {
    headers: {'user-agent': `xep ${version}`}
  });

  return got(url.resolve(config.registry, path), opts);
}

function getPackage(pkg) {
  return request(`/${pkg}`, {json: true}).then(r => r.body);
}

function getPackageVersion (pkg, v) {
  return getPackage(pkg).then(pkg => {
    v = v || pkg['dist-tags'].latest;
    v = semver.maxSatisfying(Object.keys(pkg.versions), v);
    return pkg.versions[v];
  });
}

module.exports = {
  getPackage,
  getPackageVersion,
};
