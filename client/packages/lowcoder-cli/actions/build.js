import { execSync } from "child_process";
import fsExtra from "fs-extra";
import { build } from "vite";
import { writeFileSync, existsSync, readFileSync, readdirSync } from "fs";
import { resolve } from "path";
import paths from "../config/paths.js";
import "../util/log.js";
import chalk from "chalk";

const { copySync } = fsExtra;
const packageJSON = JSON.parse(readFileSync(paths.appPackageJson).toString());

function validPackageJSON() {
  if (!packageJSON.name) {
    return "- package name is required";
  }
  if (!packageJSON.version) {
    return "- package version is required";
  }
  if (!packageJSON.lowcoder) {
    return "- lowcoder field is required in package.json";
  }
  const lowcoder = packageJSON.lowcoder;
  if (!lowcoder.comps || Object.keys(lowcoder.comps).length === 0) {
    return "- not found any comps to build";
  }

  const compErrors = [];
  Object.keys(lowcoder.comps).forEach((name) => {
    const compManifest = packageJSON.lowcoder.comps[name];
    if (!compManifest.icon) {
      // compErrors.push(`- comp ${name} must specify an icon`);
      return;
    }
    if (
      !compManifest.icon.startsWith("data:") &&
      !existsSync(paths.resolveApp(compManifest.icon))
    ) {
      compErrors.push(`- comp ${name}'s icon file ${chalk.cyan(compManifest.icon)} not found`);
      return;
    }
  });
  if (compErrors.length > 0) {
    return compErrors.join("\n");
  }
}

function findReadmeFileName(directory) {
  const files = readdirSync(directory);
  const readmeFile = files.find(file => file.toLowerCase() === 'readme.md');
  return readmeFile ? `${directory}/${readmeFile}` : null;
}

/**
 * 1. webpack production build
 * 2. generate package.json
 * 3. copy locales
 * 3. pack tar ball
 */
export default async function buildAction(options) {
  const beginTime = performance.now();
  process.env.NODE_ENV = "production";

  const { outDir } = options;
  const err = validPackageJSON();
  if (err) {
    console.red("Invalid package.json:\n");
    console.red(err);
    console.log("");
    return;
  }

  const compNames = Object.keys(packageJSON.lowcoder.comps);
  console.cyan(`Name    : ${packageJSON.name}`);
  console.cyan(`Version : ${packageJSON.version}`);
  console.cyan(`Comps   : ${compNames.length}\n`);
  compNames.forEach((i) => {
    console.log(`  ${i}`);
  });
  console.log("");
  console.cyan("Building...");

  const viteConfig = await import(paths.appViteConfigJs).default;
  await build(viteConfig);

  // write package.json
  packageJSON.lowcoder.entry = "index.js";
  writeFileSync(paths.appOutPackageJson, JSON.stringify(packageJSON, null, 2));

  // copy locales
  if (existsSync(paths.appLocales)) {
    copySync(paths.appLocales, resolve(paths.appOutPath, "locales"));
  }

  // copy icon files
  compNames.forEach((name) => {
    const compManifest = packageJSON.lowcoder.comps[name];
    if (compManifest.icon) {
      copySync(paths.resolveApp(compManifest.icon), resolve(paths.appOutPath, compManifest.icon));
    }
  });

  // copy readme file
  const readmePath = findReadmeFileName(paths.appPath + '/src');
  if (readmePath) {
    const destinationPath = resolve(paths.appOutPath, 'readme.md');
    copySync(readmePath, destinationPath);
    console.log(`Copied README file to: ${destinationPath}`);
  } else {
    console.warn('README.md file not found.');
  }

  if (options.publish) {
    // publish
    execSync("npm publish", {
      stdio: "inherit",
      cwd: paths.appOutPath,
    });
  } else {
    // pack
    const tarOutPath = paths.resolveApp(outDir);
    execSync(`npm pack --pack-destination ${tarOutPath}`, {
      stdio: "ignore",
      cwd: paths.appOutPath,
    });

    console.green(`Package generated in: ${tarOutPath}`);
  }
  console.green(`Done in ${Math.round(performance.now() - beginTime)}ms!`);
}
