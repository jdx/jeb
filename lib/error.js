'use strict';

let log = require('npmlog');

exports.handle = err => {
  log.error('', err.stack || err);
  process.exit(1);
};
