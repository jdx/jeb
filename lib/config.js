'use strict';

let path     = require('path');
let osenv    = require('osenv');
let findRoot = require('find-root');

let home = osenv.home();

let config = {
  cwd: process.cwd(),
  root: () => findRoot(config.cwd),
  registry: 'https://registry.npmjs.org',
  loglevel: process.env.JEB_LOGLEVEL || 'info',
  cacheDir: path.join(home, '.jeb/cache'),
  tmpDir: path.join(home, '.jeb/tmp'),
};

module.exports = config;
