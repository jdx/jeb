'use strict';

let install  = require('./install');
let help     = require('./help');
let outdated = require('./outdated');

module.exports = {
  install:  install,
  i:        install,
  help:     help,
  outdated: outdated,
};
