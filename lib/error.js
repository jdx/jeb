'use strict';

let log = require('npmlog');

exports.handle = err => {
  log.error(err.stack);
  process.exit(1);
};
