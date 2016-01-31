'use strict';

let fs     = require('mz/fs');
let path   = require('path');
let config = require('./config');

let project = () => {
  return fs.readFile(path.join(config.root(), 'package.json'))
  .then(JSON.parse);
};

module.exports = {
  project,
};
