#!/usr/bin/env node
const fs = require("fs/promises");
const globCb = require("glob");
const helpers = require("yargs/helpers");
const libCoverage = require("istanbul-lib-coverage");
const path = require("path");
const util = require("util");
const yargs = require("yargs/yargs");

const glob = util.promisify(globCb);
const { _: inputs, output } = yargs(helpers.hideBin(process.argv))
  .usage("Usage: istanbul-merge --output [target] [files...]")
  .describe("output", "Combined coverage file path")
  .demandCommand(1)
  .demandOption(["output"]).argv;

(async () => {
  const coverage = libCoverage.createCoverageMap({});
  for (const input of inputs) {
    const inputPatterns = await glob(input);

    for (const inputPattern of inputPatterns) {
      const inputFile = path.resolve(process.cwd(), inputPattern);
      const inputContent = await fs.readFile(inputFile);
      const inputData = JSON.parse(inputContent);

      // Normalize file path
      Object.entries(inputData).forEach(([coverFile, coverData]) => {
        delete inputData[coverFile];
        inputData[path.normalize(coverFile)] = Object.assign(coverData, {
          path: path.normalize(coverData.path),
        });
      });
      coverage.merge(inputData);
    }
  }

  const outputFile = path.resolve(process.cwd(), output);
  const outputData = JSON.stringify(coverage);
  await fs.writeFile(outputFile, outputData);
})().catch(console.error);
