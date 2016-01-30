'use strict';

let _       = require('lodash');
let got     = require('got');
let config  = require('./config');
let version = require('../package.json').version;
let url     = require('url');
let semver  = require('semver');
let fs      = require('mz/fs');
let path    = require('path');
let debug   = require('./debug');

function request (path, opts) {
  opts = opts || {};
  _.defaultsDeep(opts, {
    headers: {'user-agent': `xep ${version}`}
  });

  return got(url.resolve(config.registry, path), opts);
}

function fetchPackageFromCache (pkg, fetch) {
  let f = path.join(path.join(config.cache.dir, `${pkg}.json`));
  return fs.readFile(f).then(JSON.parse)
  .catch(() => {
    debug(`fetching ${pkg}`);
    return fetch()
    .then(pkg => {
      return fs.writeFile(f, JSON.stringify(pkg, null, 2))
      .then(() => pkg);
    });
  });
}

function getPackage(pkg) {
  return fetchPackageFromCache(pkg, () => request(`/${pkg}`, {json: true}).then(r => r.body));
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
