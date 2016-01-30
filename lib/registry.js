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
let log     = require('npmlog');
let mkdirp  = Promise.promisify(require('mkdirp'));

let request = (path, opts) => {
  opts = opts || {};
  _.defaultsDeep(opts, {
    method:  'GET',
    headers: {'user-agent': `jeb ${version}`}
  });

  let uri = url.resolve(config.registry, path);
  return Promise.resolve(got(uri, opts))
  .then(rsp => {
    log.silly('registry', `http ${opts.method} ${uri} ${rsp.statusCode}`);
    return rsp;
  })
  .catch(err => {
    log.silly('registry', `http ${opts.method} ${uri} ${err.statusCode}`);
    throw err;
  });
};

let getPackage = (name) => {
  let cachepath = name => path.join(path.join(config.cache.dir, `${name}/registry.json`));
  let readJSONFile = f => fs.readFile(f).then(JSON.parse).catch(e => log.silly('registry', e.message));
  let getPackageFromCache = name => readJSONFile(cachepath(name));

  let savePackageToCache = pkg => {
    let f = cachepath(pkg.name);
    log.silly('registry', `saving ${pkg.name} to ${f}`);
    return mkdirp(path.dirname(f))
    .then(() => fs.writeFile(f, JSON.stringify(pkg, null, 2)))
    .then(() => pkg);
  };

  let getPackageFromRegistry = (name, cached) => {
    let headers = {};
    if (cached) {
      if (config.offline) return cached;
      headers['If-None-Match'] = cached._etag;
      log.silly('registry', `fetching ${name} with etag`);
    } else {
      log.silly('registry', `fetching ${name}`);
    }
    return request(`/${name}`, {headers}).then(rsp => {
      let pkg = JSON.parse(rsp.body);
      pkg._etag = rsp.headers.etag;
      return savePackageToCache(pkg);
    })
    .catch(err => {
      if (err.statusCode !== 304) throw err;
      log.silly('registry', `returning ${name} from cache`);
      return cached;
    });
  };

  log.verbose('registry', `fetching ${name}`);

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
