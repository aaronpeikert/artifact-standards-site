const yaml = require("js-yaml");
const fs = require("fs");
const path = require("path");

module.exports = function () {
  const dir = path.join(__dirname, "versions");
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir)
    .filter((f) => f.endsWith(".yaml"))
    .sort()
    .map((filename) => ({
      tag: filename.replace(".yaml", ""),
      data: yaml.load(fs.readFileSync(path.join(dir, filename), "utf8")) || {},
    }));
};
