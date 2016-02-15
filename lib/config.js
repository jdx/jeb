'use strict';

let path     = require('path');
let osenv    = require('osenv');
let findRoot = require('find-root');
let chalk    = require('chalk');

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
  tty: process.stdout.isTTY && process.stderr.isTTY,
  verbose: false,
  cacheDir: path.join(home, '.jeb/cache'),
  tmpDir: path.join(home, '.jeb/tmp'),
};

if (!config.tty) chalk.enabled = false;

module.exports = config;
