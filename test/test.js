'use strict';

var path = require('path');
var generate = require('markdown-it-testgen');
var md = require('markdown-it')({
html: true,
linkify: true,
typography: true
}).use(require('../'));

describe('markdown-it-toc', function() {
  generate(path.join(__dirname, 'fixtures/toc.txt'), md);
});

describe('markdown-it-toc-default', function() {
  generate(path.join(__dirname, 'fixtures/toc2.txt'), {
  	tocHeader: "test"
  }, md);
});
