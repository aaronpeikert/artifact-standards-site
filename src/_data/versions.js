const yaml = require("js-yaml");
const fs = require("fs");
const path = require("path");

module.exports = function () {
  const versionsDir = path.join(__dirname, "versions");
  const venuesDir = path.join(__dirname, "venues");

  if (!fs.existsSync(versionsDir)) return [];

  return fs.readdirSync(versionsDir)
    .filter((f) => f.endsWith(".yaml"))
    .sort()
    .map((filename) => {
      const tag = filename.replace(".yaml", "");
      const venueFile = path.join(venuesDir, filename);
      const venuesData = fs.existsSync(venueFile)
        ? yaml.load(fs.readFileSync(venueFile, "utf8")) || {}
        : {};

      return {
        tag,
        data: yaml.load(fs.readFileSync(path.join(versionsDir, filename), "utf8")) || {},
        venues: venuesData.venues || [],
      };
    });
};
