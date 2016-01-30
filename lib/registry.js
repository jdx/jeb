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

let promises = {};

function request (path, opts) {
  opts = opts || {};
  _.defaultsDeep(opts, {
    headers: {'user-agent': `jeb ${version}`}
  });

  return got(url.resolve(config.registry, path), opts);
}

function fetchPackageFromCache (pkg, fetch) {
  let f = path.join(path.join(config.cache.dir, `${pkg}.json`));
  function save (rsp) {
    let pkg = JSON.parse(rsp.body);
    pkg._etag = rsp.headers.etag;
    return fs.writeFile(f, JSON.stringify(pkg, null, 2)).then(() => pkg);
  }
  return fs.readFile(f).then(JSON.parse)
  .then(pkg => {
    if (!promises[pkg.name]) {
      promises[pkg.name] = fetch({headers: {'If-None-Match': pkg._etag}}).then(save)
      .catch(err => {
        if (err.statusCode === 304) return pkg;
        else throw err;
      });
    }
    return promises[pkg.name];
  })
  .catch(err => {
    debug(err);
    if (!promises[pkg]) {
      debug(`fetching ${pkg}`);
      promises[pkg] = fetch().then(save);
    }
    return promises[pkg];
  });
}

function getPackage(pkg) {
  return fetchPackageFromCache(pkg, (opts) => {
    return request(`/${pkg}`, opts);
  });
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
