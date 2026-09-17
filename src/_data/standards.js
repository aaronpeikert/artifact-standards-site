const yaml = require("js-yaml");
const fs = require("fs");
const path = require("path");

module.exports = function () {
  const filePath = path.join(__dirname, "standards.yaml");
  try {
    return yaml.load(fs.readFileSync(filePath, "utf8")) || {};
  } catch {
    return {};
  }
};
