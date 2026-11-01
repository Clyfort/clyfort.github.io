const path = require("node:path");

const siteRoot = path.resolve(__dirname, "..");
process.chdir(siteRoot);

const Hexo = require("hexo");
const hexo = new Hexo(siteRoot, { config: path.join(siteRoot, "_config.yml") });

async function build() {
  hexo.env.init = true;
  await hexo.init();
  await hexo.call("clean");
  await hexo.call("generate");
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
