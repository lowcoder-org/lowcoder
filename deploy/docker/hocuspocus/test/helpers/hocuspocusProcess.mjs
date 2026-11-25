// Helpers of the hocuspocus tests: reproduce the image layout (hocuspocus-server.js next to the
// pinned @hocuspocus/server, ESM) in a temporary directory, start and stop it, and run the Yjs
// client of the helm runtime test against it.
import { spawn } from "node:child_process";
import { copyFileSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const TEST_PACKAGE_DIR = path.join(HERE, "..");
export const REPO_ROOT = path.join(TEST_PACKAGE_DIR, "..", "..", "..", "..");
const SERVER_SOURCE = path.join(REPO_ROOT, "client", "packages", "lowcoder", "hocuspocus-server.js");
const CLIENT_SOURCE = path.join(REPO_ROOT, "deploy", "helm", "tests", "runtime", "hocuspocus-sync.mjs");

export const LOOPBACK = "127.0.0.1";
export const STATUS_OK = 200;
export const EXIT_OK = 0;
export const EXIT_FAILED = 1;
export const READY_TIMEOUT_MS = 15000;
export const CLIENT_TIMEOUT_MS = 30000;
export const EXIT_TIMEOUT_MS = 20000;
const READY_POLL_MS = 100;

let layoutDir;

// Temporary directory with the server file, the Yjs client, type=module and node_modules linked to
// the test package's. Created once, removed by `cleanup()`.
export function layout() {
  if (!layoutDir) {
    layoutDir = mkdtempSync(path.join(os.tmpdir(), "hocuspocus-test-"));
    copyFileSync(SERVER_SOURCE, path.join(layoutDir, "hocuspocus-server.js"));
    copyFileSync(CLIENT_SOURCE, path.join(layoutDir, "hocuspocus-sync.mjs"));
    writeFileSync(path.join(layoutDir, "package.json"), JSON.stringify({ type: "module" }));
    symlinkSync(path.join(TEST_PACKAGE_DIR, "node_modules"), path.join(layoutDir, "node_modules"), "dir");
  }
  return layoutDir;
}

export function cleanup() {
  if (layoutDir) rmSync(layoutDir, { recursive: true, force: true });
  layoutDir = undefined;
}

export function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, LOOPBACK, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

// One GET; resolves { status, body }
export async function httpGet(host, port, requestPath) {
  const response = await fetch(`http://${host}:${port}${requestPath}`);
  return { status: response.status, body: await response.text() };
}

function spawnServer(env) {
  const collected = [];
  const child = spawn(process.execPath, ["hocuspocus-server.js"], {
    cwd: layout(),
    env: { PATH: process.env.PATH, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (chunk) => collected.push(String(chunk)));
  child.stderr.on("data", (chunk) => collected.push(String(chunk)));
  return { child, output: () => collected.join("") };
}

// Starts the server on a free port with HOST=127.0.0.1 and waits for /health to answer 200.
// Resolves { port, url, stop, output }.
export async function startServer(env = {}) {
  const port = await freePort();
  const { child, output } = spawnServer({ PORT: String(port), HOST: LOOPBACK, ...env });
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`hocuspocus exited with ${child.exitCode}:\n${output()}`);
    try {
      if ((await httpGet(LOOPBACK, port, "/health")).status === STATUS_OK) {
        return { port, url: `ws://${LOOPBACK}:${port}`, stop: () => child.kill(), output };
      }
    } catch {
      // not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, READY_POLL_MS));
  }
  child.kill();
  throw new Error(`hocuspocus not ready after ${READY_TIMEOUT_MS} ms:\n${output()}`);
}

// Spawns the server on `env.PORT` and resolves when it exits: { code, signal, output }. It never
// polls /health, so a first server already answering on that port cannot be mistaken for this
// one. Kills the child and rejects when it is still running after `timeoutMs`.
export function spawnUntilExit(env, timeoutMs = EXIT_TIMEOUT_MS) {
  const { child, output } = spawnServer(env);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`second server kept running after ${timeoutMs} ms:\n${output()}`));
    }, timeoutMs);
    child.once("exit", (code, signal) => {
      clearTimeout(timer);
      resolve({ code, signal, output: output() });
    });
  });
}

// Runs the copied hocuspocus-sync.mjs (mode sync|reject); resolves { code, output }
export function runClient(mode, url, token, documentName) {
  const collected = [];
  const child = spawn(process.execPath, ["hocuspocus-sync.mjs", mode, url, token, documentName], {
    cwd: layout(),
    env: { PATH: process.env.PATH },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (chunk) => collected.push(String(chunk)));
  child.stderr.on("data", (chunk) => collected.push(String(chunk)));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`client did not finish in ${CLIENT_TIMEOUT_MS} ms:\n${collected.join("")}`));
    }, CLIENT_TIMEOUT_MS);
    child.once("exit", (code) => {
      clearTimeout(timer);
      resolve({ code, output: collected.join("") });
    });
  });
}
