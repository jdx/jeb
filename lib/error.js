'use strict';

let log    = require('npmlog');
let config = require('./config');
let chalk  = require('chalk');

exports.handle = err => {
  switch (err.message) {
    case 'package.json not found in path':
      log.error('config', `${chalk.red('Error: package.json not found in path.')}\n\nYou must have a package.json file in the current directory (${chalk.red(config.cwd)})\nor in one of the parent directories.\nIf this is a new project, run ${chalk.yellow('jeb init')} to create a new package.json file.`);
    break;
  default:
    log.error('', err.stack || err);
    break;
  }
  process.exit(1);
};
