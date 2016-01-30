'use strict';

let path   = require('path');
let osenv  = require('osenv');

module.exports = {
  registry: 'https://registry.npmjs.org',
  cache: {
    dir: path.join(osenv.home(), '.jeb/cache'),
  }
};
