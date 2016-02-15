'use strict';

let fs     = require('mz/fs');
let path   = require('path');
let spawn  = require('child_process').spawn;
let byline = require('byline');
let log    = require('./log');

function postinstall (dir) {
  return fs.exists(path.join(dir, 'binding.gyp'))
  .then(function (exists) {
    if (!exists) return;
    let proc = spawn('sh', ['-c', path.join(__dirname, '../node_modules/node-gyp/bin/node-gyp.js')+' rebuild'], {
      cwd: dir
    });
    return new Promise(function (fulfill, reject) {
      proc.on('error', reject);
      byline(proc.stdout).on('data', line => log(line.toString()));
      byline(proc.stderr).on('data', line => log(line.toString()));
      proc.on('close', code => {
        if (code === 0) return fulfill();
        else            return reject(new Error(code));
      });
    });
  });
}

module.exports = postinstall;
