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
  get loglevel()  { return this._loglevel; },
  set loglevel(l) {
    switch (l) {
      case 'err':
      case 'error':
        this._loglevel = 1; return;
      case 'warn':
      case 'warning':
        this._loglevel = 2; return;
      case 'info':
        this._loglevel = 3; return;
      case 'verbose':
        this._loglevel = 4; return;
      case 'debug':
        this._loglevel = 5; return;
      default:
        this._loglevel = 3; return;
    }
  },
  cacheDir: path.join(home, '.jeb/cache'),
  tmpDir: path.join(home, '.jeb/tmp'),
};

config.loglevel = process.env.JEB_LOGLEVEL || 'info';
if (!config.tty) chalk.enabled = false;

module.exports = config;
