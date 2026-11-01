const fs = require("node:fs");
const path = require("node:path");

const siteRoot = path.resolve(__dirname, "..");
const repositoryRoot = path.resolve(siteRoot, "..");
const sourceRoot = path.join(siteRoot, "source");

for (const name of ["images", "downloads", "editor", "fonts", "fontawesome", "webfonts"]) {
  const from = path.join(repositoryRoot, name);
  const to = path.join(sourceRoot, name);
  if (fs.existsSync(from)) fs.cpSync(from, to, { recursive: true, force: true });
}
