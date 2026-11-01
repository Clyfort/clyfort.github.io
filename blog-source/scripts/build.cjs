const fs = require("node:fs");
const path = require("node:path");

const siteRoot = path.resolve(__dirname, "..");
process.chdir(siteRoot);

const Hexo = require("hexo");
const yaml = require("js-yaml");
const configText = fs.readFileSync(path.join(siteRoot, "_config.yml"), "utf8");
console.log("Parsed Hexo config:", JSON.stringify(yaml.load(configText)));
const hexo = new Hexo(siteRoot, { config: path.join(siteRoot, "_config.yml"), debug: true });

async function build() {
  await hexo.init();
  const themeDir = hexo.theme_dir || path.join(siteRoot, "themes", hexo.config.theme);
  console.log("Hexo project diagnostics:", JSON.stringify({
    baseDir: hexo.base_dir,
    configFile: hexo.config_path,
    title: hexo.config.title,
    url: hexo.config.url,
    sourceDir: hexo.config.source_dir,
    theme: hexo.config.theme,
    themeDir,
    themeExists: fs.existsSync(themeDir),
    layoutExists: fs.existsSync(path.join(themeDir, "layout")),
    postFiles: fs.readdirSync(path.join(siteRoot, "source", "_posts"))
  }));
  await hexo.call("clean");
  await hexo.call("generate");
  console.log("Generated root entries:", fs.readdirSync(path.join(siteRoot, "public")));
  await hexo.exit();
}

build().catch(async (error) => {
  console.error(error);
  try {
    await hexo.exit(error);
  } finally {
    process.exitCode = 1;
  }
});
