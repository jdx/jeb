'use strict';

let config      = require('./config');

module.exports = function log (msg) {
  if (config.verbose) console.error(msg);
};
