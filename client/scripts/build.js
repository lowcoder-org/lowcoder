import fs from "node:fs";
import path, { dirname } from "node:path";
import https from "node:https";
import { fileURLToPath } from "node:url";
import shell from "shelljs";
import chalk from "chalk";
import axios from "axios";
import { buildVars } from "./buildVars.js";

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file).toString());
}

export function currentDirName(importMetaUrl) {
  return dirname(fileURLToPath(importMetaUrl));
}

const builtinPlugins = ["lowcoder-comps"];
const curDirName = currentDirName(import.meta.url);

async function downloadFile(url, dest) {
  const file = fs.createWriteStream(dest);
  return new Promise((resolve, reject) => {
    https
      .get(url, function (response) {
        response.pipe(file);
        file.on("finish", function () {
          file.close(() => {
            resolve();
          });
        });
      })
      .on("error", function (err) {
        fs.unlink(dest);
        reject(err);
      });
  });
}

async function downloadBuiltinPlugin(name) {
  console.log();
  console.log(chalk.cyan`plugin ${name} downloading...`);

  const packageRes = await axios.get(`https://registry.npmjs.com/${name}/latest`);
  const tarball = packageRes.data.dist.tarball;
  const tarballFileName = `${name}.tgz`;
  const targetDir = `./packages/lowcoder/build/${name}/latest`;

  console.log(chalk.blue`tarball: ${tarball}`);

  shell.mkdir("-p", targetDir);

  await downloadFile(tarball, path.join(process.cwd(), tarballFileName));

  shell.exec(`tar -zxf ${tarballFileName} -C ${targetDir} --strip-components 1`, { fatal: true });
  shell.rm(tarballFileName);
}

async function buildBuiltinPlugin(name) {
  console.log();
  console.log(chalk.cyan`plugin ${name} building...`);

  const targetDir = `./packages/lowcoder/build/${name}/latest`;
  shell.mkdir("-p", targetDir);

  shell.exec(`yarn workspace ${name} build_only`, { fatal: true });

  const packageJsonFile = path.join(curDirName, `../packages/${name}/package.json`);
  const packageJSON = readJson(packageJsonFile);
  const tarballFileName = `./packages/${name}/${name}-${packageJSON.version}.tgz`;

  shell.exec(`tar -zxf ${tarballFileName} -C ${targetDir} --strip-components 1`, { fatal: true });
  shell.rm(tarballFileName);
}

shell.set("-e");

const start = Date.now();

//prettier-ignore
shell.env["REACT_APP_COMMIT_ID"] = shell.env["REACT_APP_COMMIT_ID"] || shell.exec("git rev-parse --short HEAD", {silent: true}).trim();

// Treating warnings as errors when process.env.CI = true.
shell.env["CI"] = false;
shell.env["NODE_OPTIONS"] = "--max_old_space_size=8192";
shell.env["NODE_ENV"] = "production";
shell.env["REACT_APP_LOG_LEVEL"] = "error";
shell.env["REACT_APP_BUNDLE_BUILTIN_PLUGIN"] = "true";

buildVars.forEach(({ name, defaultValue }) => {
  shell.env[name] = shell.env[name] ?? defaultValue;
});

try {
  shell.exec(`BUILD_TARGET=browserCheck yarn workspace lowcoder build`, { fatal: true });
  shell.exec(`yarn workspace lowcoder build`, { fatal: true });
} catch(e) {
  console.error("Command failed: ", e.message);
}

if (process.env.REACT_APP_BUNDLE_BUILTIN_PLUGIN) {
  for (const pluginName of builtinPlugins) {
    await buildBuiltinPlugin(pluginName);
  }
}

if (process.argv.includes("--internal-deploy")) {
  const deployDir = shell.env["DEPLOY_DIR"];
  console.log();
  console.log(chalk.cyan`deploying...`);
  shell.exec("docker cp ./packages/lowcoder/build lowcoder-fe:/var/www/", { fatal: true });
  shell.exec(
    `docker exec lowcoder-fe /bin/sh -c "cd /var/www/ && rm -rf ${deployDir} && mv build ${deployDir}"`,
    { fatal: true }
  );
}

console.log();
console.log(chalk.green`Done! time: ${((Date.now() - start) / 1000).toFixed(2)}s`);
