'use strict';

module.exports = function (message) {
  if (process.env.JEB_DEBUG) console.error(message);
};
