'use strict';

let Promise = require('bluebird');
let _       = require('lodash');
let got     = require('got');
let config  = require('./config');
let version = require('../package.json').version;
let url     = require('url');
let semver  = require('semver');
let fs      = require('mz/fs');
let path    = require('path');
let debug   = require('util').debuglog('jeb:registry');
let mkdirp  = Promise.promisify(require('mkdirp'));

let request = (path, opts) => {
  opts = opts || {};
  _.defaultsDeep(opts, {
    headers: {'user-agent': `jeb ${version}`}
  });

  return got(url.resolve(config.registry, path), opts);
};

let parseCacheControl = c => _.fromPairs(c.split(',').map(s => s.trim().split('=')));

let getExpirationTimestamp = (age, cacheControl) => {
  age = parseInt(age) || 0;
  let maxage = parseInt(parseCacheControl(cacheControl)['max-age']) || 0;
  let d = new Date();
  d.setSeconds(d.getSeconds() - age + maxage);
  return d;
};

let getPackage = name => {
  let cachepath = name => path.join(path.join(config.cache.dir, `${name}/registry.json`));
  let readJSONFile = f => fs.readFile(f).then(JSON.parse).catch(debug);
  let getPackageFromCache = name => readJSONFile(cachepath(name));

  let savePackageToCache = rsp => {
    let pkg = JSON.parse(rsp.body);
    let f = cachepath(pkg.name);
    debug(`saving ${pkg.name} to ${f}`);
    pkg._jeb = {
      expiration: getExpirationTimestamp(rsp.headers.age, rsp.headers['cache-control']),
      etag:       rsp.headers.etag,
    };

    return mkdirp(path.dirname(f))
    .then(() => fs.writeFile(f, JSON.stringify(pkg, null, 2)))
    .then(() => pkg);
  };

  let getPackageFromRegistry = (name, cached) => {
    let headers = {};
    if (cached) {
      if (new Date() < new Date(cached._jeb.expiration)) {
        debug(`returning fresh ${name} from cache (expiration)`);
        return cached;
      }
      headers['If-None-Match'] = cached._jeb.etag;
      debug(`fetching ${name} with etag`);
    } else {
      debug(`fetching ${name}`);
    }
    return request(`/${name}`, {headers}).then(savePackageToCache)
    .catch(err => {
      if (err.statusCode !== 304) throw err;
      debug(`returning fresh ${name} from cache (etag)`);
      return cached;
    });
  };

  return getPackageFromCache(name)
  .then(cached => getPackageFromRegistry(name, cached));
};

let getPackageVersion = (pkg, v) => {
  return getPackage(pkg).then(pkg => {
    v = v || pkg['dist-tags'].latest;
    v = semver.maxSatisfying(Object.keys(pkg.versions), v);
    return pkg.versions[v];
  });
};

module.exports = {
  getPackage: _.memoize(getPackage),
  getPackageVersion,
};
