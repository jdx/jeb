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

function getPackage(name) {
  let f = path.join(path.join(config.cache.dir, `${name}.json`));
  function save (rsp) {
    let pkg = JSON.parse(rsp.body);
    pkg._etag = rsp.headers.etag;
    return fs.writeFile(f, JSON.stringify(pkg, null, 2)).then(() => pkg);
  }
  return fs.readFile(f).then(JSON.parse)
  .then(pkg => {
    if (!promises[pkg.name]) {
      promises[pkg.name] = request(`/${name}`, {headers: {'If-None-Match': pkg._etag}}).then(save)
      .catch(err => {
        if (err.statusCode === 304) return pkg;
        else throw err;
      });
    }
    return promises[pkg.name];
  })
  .catch(err => {
    debug(err);
    if (!promises[name]) {
      debug(`fetching ${name}`);
      promises[name] = request(`/${name}`).then(save);
    }
    return promises[name];
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
