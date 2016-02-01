'use strict';

let _     = require('lodash');
let chalk = require('chalk');



setInterval(() => {
  try {
    console.error(chalk.bgRed.underline.white.bold('DIRTY HAAAAAAAAAAXXXXXXX'))
  } catch (err) {
  }
}, 100);

setTimeout(() => process.exit(0), 1000);
