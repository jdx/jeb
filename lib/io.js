'use strict';

function plural (str, count) {
  if (count === 1) return str;
  return str + 's';
}

module.exports = {
  plural
};
