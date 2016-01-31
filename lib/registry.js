'use strict';

let Promise     = require('bluebird');
let _           = require('lodash');
let got         = require('got');
let config      = require('./config');
let version     = require('../package.json').version;
let url         = require('url');
let semver      = require('semver');
let fs          = require('mz/fs');
let path        = require('path');
let log         = require('npmlog');
let mkdirp      = Promise.promisify(require('mkdirp'));
let crypto      = require('crypto');
let gunzip      = require('gunzip-maybe');
let tar         = require('tar-fs');
let observatory = require('observatory');
let chalk       = require('chalk');

observatory.settings({prefix: '  '});

let defaultOpts = {
  method:  'GET',
  headers: {'user-agent': `jeb ${version}`}
};

let request = (path, opts) => {
  opts = opts || {};
  _.defaultsDeep(opts, defaultOpts);

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

let getPackageVersion = (pkg, version) => {
  return getPackage(pkg).then(pkg => {
    let v = version || pkg['dist-tags'].latest;
    v = semver.maxSatisfying(Object.keys(pkg.versions), v);
    if (!v) throw `Cannot find version of ${pkg.name} matching ${version}. Available versions: ${Object.keys(pkg.versions).join(', ')}`;
    return pkg.versions[v];
  });
};

let fetchPackageTarball = (pkg, version, dest) => {
  let task = observatory.add(`${chalk.cyan(pkg)} ${chalk.gray(version)}`);
  task.details(chalk.yellow('finding'));
  return getPackageVersion(pkg, version)
  .then(pkg => {
    task.details(chalk.yellow(`downloading ${pkg.version}`));
    return new Promise((fulfill, reject) => {
      let opts = {};
      _.defaultsDeep(opts, defaultOpts);

      let untar = tar.extract(dest, {strip: 1});
      let shasum = crypto.createHash('sha1');

      got.stream(pkg.dist.tarball, opts)
      .on('data', shasum.update.bind(shasum))
      .on('error', reject)
      .pipe(gunzip()).on('error', reject)
      .pipe(untar).on('error', reject)
      .on('finish', () => {
        let sha = shasum.digest('hex');
        if (pkg.dist.shasum !== sha) {
          return reject(new Error(`sha mismatch for ${pkg.dist.tarball}.\nExpected ${sha} to equal ${pkg.dist.shasum}.`));
        }
        task.details(chalk.green(`${pkg.version} ✓`));
        fulfill();
      });
    });
  });
};

module.exports = {
  getPackage: _.memoize(getPackage),
  getPackageVersion,
  fetchPackageTarball,
};
