'use strict';

exports.handle = err => {
  console.error(`jeb: ${err.stack}`);
};
