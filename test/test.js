"use strict";

const path = require("path");
const describe = require("mocha").describe;
const generate = require("markdown-it-testgen");
const cooklang = require("..");

describe("markdown-it-cooklang", function () {
  const filePath = path.join(
    __dirname,
    "fixtures/cooklang-ingredients-default.txt"
  );

  let md = require("markdown-it")().use(cooklang);

  generate(filePath, md);

  md = require("markdown-it")().use(cooklang, {});

  generate(filePath, md);
});

describe("markdown-it-cooklang inline values", function () {
  const filePath = path.join(
    __dirname,
    "fixtures/cooklang-ingredients-inline-amounts.txt"
  );

  const md = require("markdown-it")().use(cooklang, {
    ingredients: { inlineDisplayAmount: true },
  });

  generate(filePath, md);
});
