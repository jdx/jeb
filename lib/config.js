'use strict';

let path     = require('path');
let osenv    = require('osenv');
let findRoot = require('find-root');

let config = {
  cwd: process.cwd(),
  root: () => findRoot(config.cwd),
  registry: 'https://registry.npmjs.org',
  loglevel: process.env.JEB_LOGLEVEL || 'info',
  cache: {
    dir: path.join(osenv.home(), '.jeb/cache'),
  }
};

module.exports = config;
