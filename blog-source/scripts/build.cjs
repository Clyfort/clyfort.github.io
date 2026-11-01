const path = require("node:path");
const Hexo = require("hexo");

const siteRoot = path.resolve(__dirname, "..");
const hexo = new Hexo(siteRoot, {});

async function build() {
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
