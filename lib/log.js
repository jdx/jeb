'use strict';

let chalk       = require('chalk');
let observatory = require('observatory');
let config      = require('./config');

observatory.settings({prefix: '  '});

class Task {
  constructor(title, opts) {
    this._title = title;
    this.init = () => {
      if (!this._task && config.loglevel === 3 && config.tty) {
        this._task = observatory.add(title);
      }
    };
    opts = opts || {};
    if (opts.verbose) this.verbose(opts.verbose);
  }
  error(msg) {
    this.init();
    if (this._task) this._task.details(msg);
    else            console.error(`${chalk.red('ERR!')}  ${this._title} ${msg}`);
  }
  warn(msg) {
    if (config.loglevel < 2) return;
    this.init();
    if (this._task) this._task.details(msg);
    else            console.error(chalk.yellow('WARN'), `${this._title}`, msg);
  }
  info(msg) {
    if (config.loglevel < 3) return;
    this.init();
    if (this._task) this._task.details(msg);
    else            console.error(chalk.blue('INFO'), `${this._title}`, msg);
  }
  verbose(msg) {
    if (config.loglevel < 4) return;
    this.init();
    if (this._task) this._task.details(msg);
    else            console.error(chalk.cyan('VERB'), `${this._title}`, msg);
  }
  debug(msg) {
    if (config.loglevel < 5) return;
    this.init();
    if (this._task) this._task.details(msg);
    else            console.error(chalk.green('DEBUG'), `${this._title}`, msg);
  }
  done() {
    if (this._task) this.info(chalk.green(`✓`));
  }
}

let verbose = msg => {
  if (config.loglevel < 4) return;
  console.error(chalk.cyan('VERBOSE'), msg);
};

let debug = msg => {
  if (config.loglevel < 5) return;
  console.error(chalk.green('DEBUG'), msg);
};

module.exports = {
  Task,
  verbose,
  debug,
};
