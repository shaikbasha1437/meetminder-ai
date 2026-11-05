'use strict';
const path = require('path');
const root = path.join(__dirname, '..');
function load(rel) { return require(path.join(root, rel)); }
module.exports = { load, root };
