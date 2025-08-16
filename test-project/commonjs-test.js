// CommonJS test file
const fs = require('fs');
const path = require('path');
const express = require('express');

// Dynamic require
const moduleName = 'lodash';
const lodash = require(moduleName);

// Conditional require
if (process.env.NODE_ENV === 'development') {
  const debug = require('debug');
}

module.exports = {
  fs,
  path,
  express
};

exports.helper = function() {
  console.log('Helper function');
};
