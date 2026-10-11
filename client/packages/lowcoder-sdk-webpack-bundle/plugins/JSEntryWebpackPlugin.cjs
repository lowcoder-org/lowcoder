const fs = require("node:fs");
const path = require("node:path");

// Keep bundle.js stable; every file it loads is content-addressed.
class JSEntryWebpackPlugin {
  apply(compiler) {
    const { Compilation, sources } = compiler.webpack;
    compiler.hooks.thisCompilation.tap("SDKLoader", (compilation) => {
      compilation.hooks.processAssets.tap(
        { name: "SDKLoader", stage: Compilation.PROCESS_ASSETS_STAGE_REPORT },
        () => {
          const files = compilation.entrypoints.get("main").getFiles().filter((file) => file.endsWith(".js"));
          const template = fs.readFileSync(path.join(__dirname, "../src/loader.js"), "utf8");
          compilation.emitAsset("bundle.js", new sources.RawSource(template.replace("__SDK_FILES__", JSON.stringify(files))));
          compilation.emitAsset("sdk-manifest.json", new sources.RawSource(JSON.stringify({
            version: require("../package.json").version,
            entry: "bundle.js",
            files: files.map((file) => ({ file, bytes: compilation.getAsset(file).source.size() })),
          }, null, 2)));
        }
      );
    });
  }
}
module.exports = JSEntryWebpackPlugin;
