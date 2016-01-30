'use strict';

let path   = require('path');
let osenv  = require('osenv');
let mkdirp = require('mkdirp');

module.exports = {
  registry: 'https://registry.npmjs.org',
  cache: {
    dir: path.join(osenv.home(), '.jeb/cache'),
  }
};

mkdirp(module.exports.cache.dir);
