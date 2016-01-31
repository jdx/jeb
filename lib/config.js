'use strict';

let path     = require('path');
let osenv    = require('osenv');
let findRoot = require('find-root');

let config;
let home = osenv.home();
let root = () => {
  try {
    let root = findRoot(config.cwd);
    return root;
  } catch (err) {
    throw err;
  }
};

config = {
  cwd: process.cwd(),
  root,
  registry: 'https://registry.npmjs.org',
  loglevel: process.env.JEB_LOGLEVEL || 'info',
  cacheDir: path.join(home, '.jeb/cache'),
  tmpDir: path.join(home, '.jeb/tmp'),
};

module.exports = config;
