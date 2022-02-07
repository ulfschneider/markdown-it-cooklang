
'use strict';


const path = require('path');
const describe = require('mocha').describe;
const generate = require('markdown-it-testgen');

describe('markdown-it-cooklang', function () {
  var md = require('markdown-it')()
              .use(require('../'));

  generate(path.join(__dirname, 'fixtures/cooklang-ingredients.txt'), md);
});