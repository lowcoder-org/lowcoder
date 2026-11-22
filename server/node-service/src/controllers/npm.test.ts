import express from "express";
import fs from "fs";
import http from "http";
import os from "os";
import path from "path";
import net from "net";
import { randomUUID } from "crypto";
import { execFileSync } from "child_process";
import type { AddressInfo } from "net";
import type { NpmRegistryConfig, NpmRegistryConfigEntry } from "../services/npmRegistry";

type NpmModule = typeof import("./npm");
type RecordedRequest = { method: string; path: string; authorization: string | undefined };
type RouteHandler = (req: http.IncomingMessage, res: http.ServerResponse) => void;
type HttpResult = { status: number; text: string };

const HOST = "127.0.0.1";
const ENV_CACHE_DIR = "NPM_CACHE_DIR";
const ENV_REGISTRY_CONFIG = "NPM_REGISTRY_CONFIG";
const STATUS_OK = 200;
const STATUS_BAD_REQUEST = 400;
const STATUS_NOT_FOUND = 404;
const STATUS_SERVER_ERROR = 500;
const REGISTRY_ROUTE = "/npm/registry/*";
const PACKAGE_ROUTE = "/npm/package/*";
const REGISTRY_BASE = "/npm/registry";
const PACKAGE_BASE = "/npm/package";
const DEFAULT_WORKSPACE = "default";
const BASIC_CREDENTIALS = "dXNlcjpwYXNz";
const BEARER_TOKEN = "secret-token";
const MISSING_BODY_MESSAGE = "Missing workspaceId and/or npmRegistryConfig";
const INTERNAL_ERROR_MESSAGE = "Internal server error";
const NOT_FOUND_MESSAGE = "Not found";
const TARBALL_DELAY_MS = 60;
const CONCURRENT_REQUESTS = 8;
const QUEUE_TEST_TIMEOUT_MS = 5000;
const QUEUE_REQUEST_ABORT_MS = 3000;
const REQUEST_ABORT_MS = 8000;
const SUITE_TEST_TIMEOUT_MS = 20000;
const SETTLE_POLL_MS = 10;
const SETTLE_TIMEOUT_MS = 3000;
const SECRET_CONTENT = "TOP-SECRET-OUTSIDE-THE-CACHE";
const TGZ_SUFFIX = ".tgz";
const DEFAULT_CACHE_ROOT = "/tmp/npm-package-cache";

const PKG_JSON_FILE = "package.json";
const INDEX_JS = "index.js";
const INDEX_MJS = "index.mjs";
const DIST_FILE = "dist/x.js";

jest.setTimeout(SUITE_TEST_TIMEOUT_MS);

// ---------------------------------------------------------------- harness state

let cacheDir: string;
let workDir: string;
let secretDir: string;
let registryServer: http.Server;
let registryBase: string;
let appServer: http.Server;
let appBase: string;
let wrapperServer: http.Server;
let wrapperBase: string;
let npm: NpmModule;
let unrouted: NpmModule;
let unroutedServer: http.Server;
let unroutedBase: string;
const settled: boolean[] = [];
const unroutedSettled: boolean[] = [];
let routes: Record<string, RouteHandler> = {};
let recorded: RecordedRequest[] = [];
let counter = 0;

const envBefore = {
  cache: process.env[ENV_CACHE_DIR],
  registry: process.env[ENV_REGISTRY_CONFIG],
};

function restoreEnv(): void {
  for (const [key, value] of [
    [ENV_CACHE_DIR, envBefore.cache],
    [ENV_REGISTRY_CONFIG, envBefore.registry],
  ] as const) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

// CACHE_DIR is read at module load, NpmRegistryService reads its env at first use: load a private copy.
function loadNpm(registryConfig: string | undefined): NpmModule {
  process.env[ENV_CACHE_DIR] = cacheDir;
  if (registryConfig === undefined) {
    delete process.env[ENV_REGISTRY_CONFIG];
  } else {
    process.env[ENV_REGISTRY_CONFIG] = registryConfig;
  }
  let mod!: NpmModule;
  jest.isolateModules(() => {
    mod = require("./npm");
  });
  restoreEnv();
  return mod;
}

function listen(server: http.Server): Promise<string> {
  return new Promise((resolve) => {
    server.listen(0, HOST, () => resolve(`http://${HOST}:${(server.address() as AddressInfo).port}`));
  });
}

function closeServer(server: http.Server): Promise<void> {
  return new Promise((resolve) => {
    server.close(() => resolve());
    server.closeAllConnections();
  });
}

// A "registry" that accepts the TCP connection and destroys it at once: the request fails with a connection error,
// with no released-port reuse race (the listening port stays owned by this server for the whole test).
function startResettingServer(): Promise<{ server: net.Server; base: string }> {
  return new Promise((resolve) => {
    const server = net.createServer((socket) => socket.destroy());
    server.listen(0, HOST, () => resolve({ server, base: `http://${HOST}:${(server.address() as AddressInfo).port}` }));
  });
}

function closeNetServer(server: net.Server): Promise<void> {
  return new Promise((resolve) => server.close(() => resolve()));
}

function startFakeRegistry(): http.Server {
  return http.createServer((req, res) => {
    const urlPath = (req.url ?? "").split("?")[0];
    recorded.push({ method: req.method ?? "", path: urlPath, authorization: req.headers.authorization });
    const handler = routes[urlPath];
    if (!handler) {
      res.statusCode = STATUS_NOT_FOUND;
      res.end(`no route ${urlPath}`);
      return;
    }
    handler(req, res);
  });
}

function buildTarball(files: Record<string, string>): Buffer {
  const dir = fs.mkdtempSync(path.join(workDir, "tar-"));
  for (const [name, content] of Object.entries(files)) {
    const full = path.join(dir, "package", name);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  const out = path.join(dir, "pkg.tgz");
  execFileSync("tar", ["-czf", out, "-C", dir, "package"]);
  return fs.readFileSync(out);
}

type VersionSpec = { tarball: Buffer | string; delayMs?: number };

// Publishes metadata at /<name> and one tarball per version at /<name>/-/<tail>-<version>.tgz
function publish(name: string, versions: Record<string, VersionSpec>, latest: string): void {
  const tail = name.split("/").pop();
  const info: { "dist-tags": { latest: string }; versions: Record<string, { dist: { tarball: string } }> } = {
    "dist-tags": { latest },
    versions: {},
  };
  for (const [version, spec] of Object.entries(versions)) {
    const tarPath = `/${name}/-/${tail}-${version}${TGZ_SUFFIX}`;
    info.versions[version] = { dist: { tarball: `${registryBase}${tarPath}` } };
    routes[tarPath] = (_req, res) => {
      const send = () => {
        res.statusCode = STATUS_OK;
        res.end(spec.tarball);
      };
      if (spec.delayMs) {
        setTimeout(send, spec.delayMs);
      } else {
        send();
      }
    };
  }
  routes[`/${name}`] = (_req, res) => {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify(info));
  };
}

function uniqueName(scope?: boolean): string {
  counter += 1;
  return scope ? `@scope${counter}/lib` : `pkg-${counter}`;
}

function uniqueWorkspace(): string {
  counter += 1;
  return `ws${counter}`;
}

function entry(auth: NpmRegistryConfigEntry["registry"]["auth"], url = registryBase): NpmRegistryConfigEntry {
  return { scope: { type: "global" }, registry: { url, auth } };
}

function registries(auth: NpmRegistryConfigEntry["registry"]["auth"] = { type: "none" }): NpmRegistryConfig {
  return [entry(auth)];
}

// Every request is bounded: a handler that never answers (for example a stuck processing queue) fails the test fast.
async function post(
  base: string,
  route: string,
  body: unknown,
  signal: AbortSignal = AbortSignal.timeout(REQUEST_ABORT_MS)
): Promise<HttpResult> {
  const res = await fetch(`${base}${route}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  return { status: res.status, text: await res.text() };
}

async function get(base: string, route: string): Promise<HttpResult> {
  const res = await fetch(`${base}${route}`, { signal: AbortSignal.timeout(REQUEST_ABORT_MS) });
  return { status: res.status, text: await res.text() };
}

// fetch() normalises "..", so a traversal path needs a raw http request.
function rawPost(base: string, rawPath: string, body: unknown): Promise<HttpResult> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const url = new URL(base);
    const req = http.request(
      {
        host: url.hostname,
        port: url.port,
        method: "POST",
        path: rawPath,
        headers: { "content-type": "application/json", "content-length": Buffer.byteLength(payload) },
        agent: false,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, text: Buffer.concat(chunks).toString("utf8") }));
      }
    );
    req.on("error", reject);
    req.end(payload);
  });
}

async function waitFor(condition: () => boolean): Promise<void> {
  const deadline = Date.now() + SETTLE_TIMEOUT_MS;
  while (!condition()) {
    if (Date.now() > deadline) {
      throw new Error("condition not met in time");
    }
    await new Promise((r) => setTimeout(r, SETTLE_POLL_MS));
  }
}

const upstreamPaths = () => recorded.map((r) => r.path);
const tarballRequests = () => recorded.filter((r) => r.path.endsWith(TGZ_SUFFIX));
const infoRequests = (name: string) => recorded.filter((r) => r.path === `/${name}`);
const unpackedDir = (ws: string, name: string, version: string) => path.join(cacheDir, ws, name, version, "package");
// Tolerates a workspace directory that was never created (a handler that rejects before touching the disk).
const leftoverTarballs = (ws: string): string[] => {
  const dir = path.join(cacheDir, ws);
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(TGZ_SUFFIX)) : [];
};

beforeAll(async () => {
  cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "npm-test-cache-"));
  workDir = fs.mkdtempSync(path.join(os.tmpdir(), "npm-test-work-"));
  secretDir = fs.mkdtempSync(path.join(os.tmpdir(), "npm-test-secret-"));
  fs.writeFileSync(path.join(secretDir, "secret.txt"), SECRET_CONTENT);

  registryServer = startFakeRegistry();
  registryBase = await listen(registryServer);

  npm = loadNpm(undefined);
  const app = express();
  app.use(express.json());
  app.post(REGISTRY_ROUTE, npm.fetchRegistryWithConfig);
  app.post(PACKAGE_ROUTE, npm.fetchPackageFileWithConfig);
  appServer = http.createServer(app);
  appBase = await listen(appServer);

  // B4 observation: the same handlers behind a wrapper that records whether the response is out when the handler's promise settles.
  const wrapped = express();
  wrapped.use(express.json());
  wrapped.post(REGISTRY_ROUTE, npm.fetchRegistryWithConfig);
  wrapped.post(PACKAGE_ROUTE, async (req, res) => {
    await npm.fetchPackageFileWithConfig(req, res);
    settled.push(res.headersSent);
  });
  wrapperServer = http.createServer(wrapped);
  wrapperBase = await listen(wrapperServer);

  // Unrouted handlers use the singleton registry read from NPM_REGISTRY_CONFIG.
  unrouted = loadNpm(JSON.stringify([entry({ type: "bearer", credentials: BEARER_TOKEN })]));
  // the singleton reads its env lazily, at the first request: keep the variable set until afterAll
  process.env[ENV_REGISTRY_CONFIG] = JSON.stringify([entry({ type: "bearer", credentials: BEARER_TOKEN })]);
  const unroutedApp = express();
  unroutedApp.get(REGISTRY_ROUTE, unrouted.fetchRegistry);
  unroutedApp.get(PACKAGE_ROUTE, async (req, res) => {
    await unrouted.fetchPackageFile(req, res);
    unroutedSettled.push(res.headersSent);
  });
  unroutedServer = http.createServer(unroutedApp);
  unroutedBase = await listen(unroutedServer);
});

beforeEach(() => {
  routes = {};
  recorded = [];
  settled.length = 0;
  unroutedSettled.length = 0;
});

afterAll(async () => {
  await Promise.all([appServer, wrapperServer, unroutedServer, registryServer].map(closeServer));
  restoreEnv();
  for (const dir of [cacheDir, workDir, secretDir]) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------- fetchRegistryWithConfig

describe("POST /npm/registry/* (fetchRegistryWithConfig)", () => {
  test("an empty path or an upper-case package name gives 400 Invalid package path", async () => {
    const empty = await post(appBase, `${REGISTRY_BASE}/`, { workspaceId: "w", npmRegistries: registries() });
    expect(empty).toEqual({ status: STATUS_BAD_REQUEST, text: "Invalid package path: /" });

    const upper = await post(appBase, `${REGISTRY_BASE}/UPPER`, { workspaceId: "w", npmRegistries: registries() });
    expect(upper).toEqual({ status: STATUS_BAD_REQUEST, text: "Invalid package path: /UPPER" });
    expect(recorded).toEqual([]);
  });

  test("a body with neither workspaceId nor a registry key gives 400", async () => {
    const result = await post(appBase, `${REGISTRY_BASE}/left-pad`, {});
    expect(result).toEqual({ status: STATUS_BAD_REQUEST, text: MISSING_BODY_MESSAGE });
    expect(recorded).toEqual([]);
  });

  test("basic auth: upstream gets GET /<pkg> with the Basic header and its body comes back unchanged", async () => {
    const name = uniqueName();
    const upstreamBody = JSON.stringify({ name, "dist-tags": { latest: "1.0.0" }, marker: "unchanged" });
    routes[`/${name}`] = (_req, res) => res.end(upstreamBody);

    const result = await post(appBase, `${REGISTRY_BASE}/${name}`, {
      workspaceId: uniqueWorkspace(),
      npmRegistries: registries({ type: "basic", credentials: BASIC_CREDENTIALS }),
    });

    expect(result).toEqual({ status: STATUS_OK, text: upstreamBody });
    expect(recorded).toEqual([{ method: "GET", path: `/${name}`, authorization: `Basic ${BASIC_CREDENTIALS}` }]);
  });

  test("bearer auth sends the Bearer header", async () => {
    const name = uniqueName();
    routes[`/${name}`] = (_req, res) => res.end("{}");
    await post(appBase, `${REGISTRY_BASE}/${name}`, {
      workspaceId: uniqueWorkspace(),
      npmRegistries: registries({ type: "bearer", credentials: BEARER_TOKEN }),
    });
    expect(recorded.map((r) => r.authorization)).toEqual([`Bearer ${BEARER_TOKEN}`]);
  });

  test("auth none sends no Authorization header", async () => {
    const name = uniqueName();
    routes[`/${name}`] = (_req, res) => res.end("{}");
    await post(appBase, `${REGISTRY_BASE}/${name}`, { workspaceId: uniqueWorkspace(), npmRegistries: registries() });
    expect(recorded).toHaveLength(1);
    expect(recorded[0].authorization).toBeUndefined();
  });

  test("a scoped package is requested as /@scope/name upstream", async () => {
    const name = uniqueName(true);
    routes[`/${name}`] = (_req, res) => res.end("{}");
    const result = await post(appBase, `${REGISTRY_BASE}/${name}`, {
      workspaceId: uniqueWorkspace(),
      npmRegistries: registries(),
    });
    expect(result.status).toBe(STATUS_OK);
    expect(upstreamPaths()).toEqual([`/${name}`]);
  });

  test("an upstream 404 is passed through with the upstream text", async () => {
    const name = uniqueName();
    routes[`/${name}`] = (_req, res) => {
      res.statusCode = STATUS_NOT_FOUND;
      res.end("registry says: no such package");
    };
    const result = await post(appBase, `${REGISTRY_BASE}/${name}`, {
      workspaceId: uniqueWorkspace(),
      npmRegistries: registries(),
    });
    expect(result).toEqual({ status: STATUS_NOT_FOUND, text: "registry says: no such package" });
  });

  test("a registry that drops the connection gives 500 Internal server error", async () => {
    const { server, base } = await startResettingServer();
    let result: HttpResult;
    try {
      result = await post(appBase, `${REGISTRY_BASE}/${uniqueName()}`, {
        workspaceId: uniqueWorkspace(),
        npmRegistries: [entry({ type: "none" }, base)],
      });
    } finally {
      await closeNetServer(server);
    }
    expect(result).toEqual({ status: STATUS_SERVER_ERROR, text: INTERNAL_ERROR_MESSAGE });
  });

  // B1: PrivateNpmRegistryController.java:89 sends `npmRegistries`; the guard at npm.ts:91 checks `npmRegistryConfig`.
  test.failing("B1: npmRegistries without workspaceId is accepted; workspaceId alone is not a 500", async () => {
    const name = uniqueName();
    routes[`/${name}`] = (_req, res) => res.end("{}");

    const withoutWorkspace = await post(appBase, `${REGISTRY_BASE}/${name}`, { npmRegistries: registries() });
    expect(withoutWorkspace.status).toBe(STATUS_OK);

    const withoutRegistries = await post(appBase, `${REGISTRY_BASE}/${name}`, { workspaceId: uniqueWorkspace() });
    expect(withoutRegistries.status).not.toBe(STATUS_SERVER_ERROR);
  });
});

// ---------------------------------------------------------------- fetchPackageFileWithConfig

describe("POST /npm/package/* (fetchPackageFileWithConfig)", () => {
  test("an empty path or an upper-case package name gives 400 Invalid package path", async () => {
    const body = { workspaceId: uniqueWorkspace(), npmRegistries: registries() };
    expect(await post(appBase, `${PACKAGE_BASE}/`, body)).toEqual({
      status: STATUS_BAD_REQUEST,
      text: "Invalid package path: /",
    });
    expect(await post(appBase, `${PACKAGE_BASE}/UPPER`, body)).toEqual({
      status: STATUS_BAD_REQUEST,
      text: "Invalid package path: /UPPER",
    });
  });

  test("a body with neither workspaceId nor a registry key gives 400", async () => {
    const result = await post(appBase, `${PACKAGE_BASE}/left-pad@1.0.0/${INDEX_JS}`, {});
    expect(result).toEqual({ status: STATUS_BAD_REQUEST, text: MISSING_BODY_MESSAGE });
  });

  test("cache miss: info then tarball with the same auth, unpacked into the cache, file served, .tgz removed", async () => {
    const name = uniqueName();
    const ws = uniqueWorkspace();
    const content = "module.exports = 'hello from tarball';";
    publish(name, { "1.0.0": { tarball: buildTarball({ [PKG_JSON_FILE]: "{}", [INDEX_JS]: content }) } }, "1.0.0");

    const result = await post(appBase, `${PACKAGE_BASE}/${name}@1.0.0/${INDEX_JS}`, {
      workspaceId: ws,
      npmRegistries: registries({ type: "basic", credentials: BASIC_CREDENTIALS }),
    });

    expect(result).toEqual({ status: STATUS_OK, text: content });
    expect(recorded).toEqual([
      { method: "GET", path: `/${name}`, authorization: `Basic ${BASIC_CREDENTIALS}` },
      { method: "GET", path: `/${name}/-/${name}-1.0.0${TGZ_SUFFIX}`, authorization: `Basic ${BASIC_CREDENTIALS}` },
    ]);
    expect(fs.readFileSync(path.join(unpackedDir(ws, name, "1.0.0"), INDEX_JS), "utf8")).toBe(content);
    expect(fs.existsSync(path.join(unpackedDir(ws, name, "1.0.0"), PKG_JSON_FILE))).toBe(true);
    expect(leftoverTarballs(ws)).toEqual([]);
  });

  test("a scoped package path @org/name@1.2.3/dist/x.js serves dist/x.js of version 1.2.3", async () => {
    const name = uniqueName(true);
    const ws = uniqueWorkspace();
    const content = "export const x = 1;";
    publish(name, { "1.2.3": { tarball: buildTarball({ [PKG_JSON_FILE]: "{}", [DIST_FILE]: content }) } }, "9.9.9");

    const result = await post(appBase, `${PACKAGE_BASE}/${name}@1.2.3/${DIST_FILE}`, {
      workspaceId: ws,
      npmRegistries: registries(),
    });

    expect(result).toEqual({ status: STATUS_OK, text: content });
    expect(infoRequests(name)).toHaveLength(1);
    expect(fs.existsSync(path.join(unpackedDir(ws, name, "1.2.3"), DIST_FILE))).toBe(true);
  });

  test("a range like ^1.0.0 falls back to latest", async () => {
    const name = uniqueName();
    publish(
      name,
      {
        "1.0.0": { tarball: buildTarball({ [PKG_JSON_FILE]: "{}", [INDEX_JS]: "one" }) },
        "2.0.0": { tarball: buildTarball({ [PKG_JSON_FILE]: "{}", [INDEX_JS]: "two" }) },
      },
      "2.0.0"
    );
    // raw "^": fetch() would percent-encode it, which the path regex does not accept
    const result = await rawPost(appBase, `${PACKAGE_BASE}/${name}@^1.0.0/${INDEX_JS}`, {
      workspaceId: uniqueWorkspace(),
      npmRegistries: registries(),
    });
    expect(result).toEqual({ status: STATUS_OK, text: "two" });
  });

  test("a prerelease version like 0.0.1-beta1 is kept", async () => {
    const name = uniqueName();
    publish(
      name,
      {
        "0.0.1-beta1": { tarball: buildTarball({ [PKG_JSON_FILE]: "{}", [INDEX_JS]: "beta" }) },
        "1.0.0": { tarball: buildTarball({ [PKG_JSON_FILE]: "{}", [INDEX_JS]: "stable" }) },
      },
      "1.0.0"
    );
    const result = await post(appBase, `${PACKAGE_BASE}/${name}@0.0.1-beta1/${INDEX_JS}`, {
      workspaceId: uniqueWorkspace(),
      npmRegistries: registries(),
    });
    expect(result).toEqual({ status: STATUS_OK, text: "beta" });
  });

  test("cache hit: a second request makes no upstream request", async () => {
    const name = uniqueName();
    const ws = uniqueWorkspace();
    publish(name, { "1.0.0": { tarball: buildTarball({ [PKG_JSON_FILE]: "{}", [INDEX_JS]: "cached" }) } }, "1.0.0");
    const body = { workspaceId: ws, npmRegistries: registries() };

    const first = await post(appBase, `${PACKAGE_BASE}/${name}@1.0.0/${INDEX_JS}`, body);
    expect(first).toEqual({ status: STATUS_OK, text: "cached" });
    const requestsAfterFirst = recorded.length;
    expect(requestsAfterFirst).toBe(2);

    const second = await post(appBase, `${PACKAGE_BASE}/${name}@1.0.0/${INDEX_JS}`, body);
    expect(second).toEqual({ status: STATUS_OK, text: "cached" });
    expect(recorded).toHaveLength(requestsAfterFirst);
  });

  test("workspaces have separate caches", async () => {
    const name = uniqueName();
    publish(name, { "1.0.0": { tarball: buildTarball({ [PKG_JSON_FILE]: "{}", [INDEX_JS]: "x" }) } }, "1.0.0");
    const wsA = uniqueWorkspace();
    const wsB = uniqueWorkspace();
    await post(appBase, `${PACKAGE_BASE}/${name}@1.0.0/${INDEX_JS}`, { workspaceId: wsA, npmRegistries: registries() });
    await post(appBase, `${PACKAGE_BASE}/${name}@1.0.0/${INDEX_JS}`, { workspaceId: wsB, npmRegistries: registries() });
    expect(tarballRequests()).toHaveLength(2);
    expect(fs.existsSync(unpackedDir(wsA, name, "1.0.0"))).toBe(true);
    expect(fs.existsSync(unpackedDir(wsB, name, "1.0.0"))).toBe(true);
  });

  test("latest resolves dist-tags.latest and serves that version", async () => {
    const name = uniqueName();
    const ws = uniqueWorkspace();
    publish(
      name,
      {
        "1.0.0": { tarball: buildTarball({ [PKG_JSON_FILE]: "{}", [INDEX_JS]: "old" }) },
        "2.0.0": { tarball: buildTarball({ [PKG_JSON_FILE]: "{}", [INDEX_JS]: "new" }) },
      },
      "2.0.0"
    );
    const result = await post(appBase, `${PACKAGE_BASE}/${name}/${INDEX_JS}`, {
      workspaceId: ws,
      npmRegistries: registries(),
    });
    expect(result).toEqual({ status: STATUS_OK, text: "new" });
    expect(fs.existsSync(unpackedDir(ws, name, "2.0.0"))).toBe(true);
    expect(fs.existsSync(unpackedDir(ws, name, "1.0.0"))).toBe(false);
  });

  // B3: npm.ts:188 shadows `packageInfo`, so the info document is fetched again at :209.
  test.failing("B3: latest fetches the package info exactly once", async () => {
    const name = uniqueName();
    publish(name, { "1.0.0": { tarball: buildTarball({ [PKG_JSON_FILE]: "{}", [INDEX_JS]: "x" }) } }, "1.0.0");
    const result = await post(appBase, `${PACKAGE_BASE}/${name}/${INDEX_JS}`, {
      workspaceId: uniqueWorkspace(),
      npmRegistries: registries(),
    });
    expect(result.status).toBe(STATUS_OK);
    expect(infoRequests(name)).toHaveLength(1);
  });

  test("latest with an info 404 gives 404 Not found", async () => {
    const name = uniqueName();
    const result = await post(appBase, `${PACKAGE_BASE}/${name}/${INDEX_JS}`, {
      workspaceId: uniqueWorkspace(),
      npmRegistries: registries(),
    });
    expect(result).toEqual({ status: STATUS_NOT_FOUND, text: NOT_FOUND_MESSAGE });
    expect(tarballRequests()).toEqual([]);
  });

  test("an info 404 for an explicit version gives 404 Not found", async () => {
    const name = uniqueName();
    const result = await post(appBase, `${PACKAGE_BASE}/${name}@1.0.0/${INDEX_JS}`, {
      workspaceId: uniqueWorkspace(),
      npmRegistries: registries(),
    });
    expect(result).toEqual({ status: STATUS_NOT_FOUND, text: NOT_FOUND_MESSAGE });
  });

  test(
    "a version not in versions gives 404 Not found and a later request for the same package does not hang",
    async () => {
      const name = uniqueName();
      const ws = uniqueWorkspace();
      publish(name, { "1.0.0": { tarball: buildTarball({ [PKG_JSON_FILE]: "{}", [INDEX_JS]: "ok" }) } }, "1.0.0");
      const body = { workspaceId: ws, npmRegistries: registries() };

      const missing = await post(appBase, `${PACKAGE_BASE}/${name}@7.7.7/${INDEX_JS}`, body);
      expect(missing).toEqual({ status: STATUS_NOT_FOUND, text: NOT_FOUND_MESSAGE });

      const later = await post(
        appBase,
        `${PACKAGE_BASE}/${name}@1.0.0/${INDEX_JS}`,
        body,
        AbortSignal.timeout(QUEUE_REQUEST_ABORT_MS)
      );
      expect(later).toEqual({ status: STATUS_OK, text: "ok" });
    },
    QUEUE_TEST_TIMEOUT_MS
  );

  test("a corrupt tarball gives 500 and a later request for the same package does not hang", async () => {
    const name = uniqueName();
    const ws = uniqueWorkspace();
    const body = { workspaceId: ws, npmRegistries: registries() };
    publish(
      name,
      {
        "1.0.0": { tarball: "this is not a gzip tarball" },
        "1.0.1": { tarball: buildTarball({ [PKG_JSON_FILE]: "{}", [INDEX_JS]: "fine" }) },
      },
      "1.0.1"
    );

    const corrupt = await post(appBase, `${PACKAGE_BASE}/${name}@1.0.0/${INDEX_JS}`, body);
    expect(corrupt).toEqual({ status: STATUS_SERVER_ERROR, text: INTERNAL_ERROR_MESSAGE });

    const later = await post(
      appBase,
      `${PACKAGE_BASE}/${name}@1.0.1/${INDEX_JS}`,
      body,
      AbortSignal.timeout(QUEUE_REQUEST_ABORT_MS)
    );
    expect(later).toEqual({ status: STATUS_OK, text: "fine" });
  }, QUEUE_TEST_TIMEOUT_MS);

  test("index.js missing but index.mjs present: serves index.mjs", async () => {
    const name = uniqueName();
    const content = "export default 'esm';";
    publish(name, { "1.0.0": { tarball: buildTarball({ [PKG_JSON_FILE]: "{}", [INDEX_MJS]: content }) } }, "1.0.0");
    const result = await post(appBase, `${PACKAGE_BASE}/${name}@1.0.0/${INDEX_JS}`, {
      workspaceId: uniqueWorkspace(),
      npmRegistries: registries(),
    });
    expect(result).toEqual({ status: STATUS_OK, text: content });
  });

  test("index.js present is preferred over index.mjs", async () => {
    const name = uniqueName();
    publish(
      name,
      { "1.0.0": { tarball: buildTarball({ [PKG_JSON_FILE]: "{}", [INDEX_JS]: "cjs", [INDEX_MJS]: "esm" }) } },
      "1.0.0"
    );
    const result = await post(appBase, `${PACKAGE_BASE}/${name}@1.0.0/${INDEX_JS}`, {
      workspaceId: uniqueWorkspace(),
      npmRegistries: registries(),
    });
    expect(result).toEqual({ status: STATUS_OK, text: "cjs" });
  });

  test("neither index.js nor index.mjs in the package gives 404", async () => {
    const name = uniqueName();
    publish(name, { "1.0.0": { tarball: buildTarball({ [PKG_JSON_FILE]: "{}" }) } }, "1.0.0");
    const result = await post(appBase, `${PACKAGE_BASE}/${name}@1.0.0/${INDEX_JS}`, {
      workspaceId: uniqueWorkspace(),
      npmRegistries: registries(),
    });
    expect(result.status).toBe(STATUS_NOT_FOUND);
  });

  test("a file that is not in the package gives 404", async () => {
    const name = uniqueName();
    publish(name, { "1.0.0": { tarball: buildTarball({ [PKG_JSON_FILE]: "{}", [INDEX_JS]: "x" }) } }, "1.0.0");
    const result = await post(appBase, `${PACKAGE_BASE}/${name}@1.0.0/nope.js`, {
      workspaceId: uniqueWorkspace(),
      npmRegistries: registries(),
    });
    expect(result.status).toBe(STATUS_NOT_FOUND);
  });

  // B24 (suspected race: has() at npm.ts:196, then an await at :203, then add() at :207).
  // Method: two requests for `latest` of the same uncached package. `latest` awaits the info fetch BEFORE has(), so the
  // fake registry holds both info responses until both requests are in flight and then answers both in the same tick;
  // both handlers then reach has() with no add() done yet. Real boundaries only (HTTP, tar, fs).
  // Observed: all CONCURRENT_REQUESTS handlers pass has() before any add(), so the tarball is downloaded once per request
  // (8 downloads, 3 of 3 runs). A plain Promise.all of explicit-version requests does not reach the window and would
  // pass today, so it cannot rule the race out; this construction is what reproduces it.
  // Limit: only the `latest` entry path is exercised; the explicit-version path has the same check-then-await shape
  // but no earlier await to synchronise on, so it is not covered here.
  test.failing("B24: two concurrent requests download the tarball once", async () => {
    const name = uniqueName();
    const ws = uniqueWorkspace();
    publish(
      name,
      { "1.0.0": { tarball: buildTarball({ [PKG_JSON_FILE]: "{}", [INDEX_JS]: "once" }), delayMs: TARBALL_DELAY_MS } },
      "1.0.0"
    );
    const infoHandler = routes[`/${name}`];
    const held: http.ServerResponse[] = [];
    const releases: Array<() => void> = [];
    let released = false;
    routes[`/${name}`] = (req, res) => {
      if (released) {
        infoHandler(req, res);
        return;
      }
      releases.push(() => infoHandler(req, res));
      held.push(res);
      if (held.length === CONCURRENT_REQUESTS) {
        released = true;
        releases.forEach((release) => release());
      }
    };
    const body = { workspaceId: ws, npmRegistries: registries() };

    const results = await Promise.all(
      Array.from({ length: CONCURRENT_REQUESTS }, () =>
        post(appBase, `${PACKAGE_BASE}/${name}/${INDEX_JS}`, body, AbortSignal.timeout(QUEUE_REQUEST_ABORT_MS))
      )
    );

    expect(released).toBe(true);
    expect(tarballRequests()).toHaveLength(1);
    expect(results).toEqual(Array.from({ length: CONCURRENT_REQUESTS }, () => ({ status: STATUS_OK, text: "once" })));
  }, QUEUE_TEST_TIMEOUT_MS);

  // B2: the `file` group accepts "../" and req.path keeps it, so path.resolve leaves the package directory.
  test.failing("B2: a ../ raw path gets a 4xx, never the file", async () => {
    const name = uniqueName();
    const ws = uniqueWorkspace();
    publish(name, { "1.0.0": { tarball: buildTarball({ [PKG_JSON_FILE]: "{}", [INDEX_JS]: "x" }) } }, "1.0.0");
    const body = { workspaceId: ws, npmRegistries: registries() };
    // package is cached first, so the traversal request takes the cache-hit branch
    const warm = await post(appBase, `${PACKAGE_BASE}/${name}@1.0.0/${INDEX_JS}`, body);
    expect(warm.status).toBe(STATUS_OK);

    const packageDir = unpackedDir(ws, name, "1.0.0");
    const toSecret = path.relative(packageDir, path.join(secretDir, "secret.txt")).split(path.sep).join("/");
    expect(toSecret.startsWith("..")).toBe(true);
    const result = await rawPost(appBase, `${PACKAGE_BASE}/${name}@1.0.0/${toSecret}`, body);

    expect(result.text).not.toContain(SECRET_CONTENT);
    expect(result.status).toBeGreaterThanOrEqual(STATUS_BAD_REQUEST);
    expect(result.status).toBeLessThan(STATUS_SERVER_ERROR);
  });

  // B5: npm.ts:304-308 writes the tarball response without checking its status.
  test.failing("B5: an upstream tarball error is passed through and leaves no .tgz", async () => {
    const name = uniqueName();
    const ws = uniqueWorkspace();
    publish(name, { "1.0.0": { tarball: "unused" } }, "1.0.0");
    routes[`/${name}/-/${name}-1.0.0${TGZ_SUFFIX}`] = (_req, res) => {
      res.statusCode = STATUS_NOT_FOUND;
      res.setHeader("content-type", "text/html");
      res.end("<html><body>404 not found</body></html>");
    };

    const result = await post(appBase, `${PACKAGE_BASE}/${name}@1.0.0/${INDEX_JS}`, {
      workspaceId: ws,
      npmRegistries: registries(),
    });

    expect(result.status).toBe(STATUS_NOT_FOUND);
    expect(leftoverTarballs(ws)).toEqual([]);
  });
});

// ---------------------------------------------------------------- remaining paths

describe("failures outside the download step and the default cache directory", () => {
  test("latest with a registry that drops the connection gives 500 Internal server error", async () => {
    const { server, base } = await startResettingServer();
    let result: HttpResult;
    try {
      result = await post(appBase, `${PACKAGE_BASE}/${uniqueName()}/${INDEX_JS}`, {
        workspaceId: uniqueWorkspace(),
        npmRegistries: [entry({ type: "none" }, base)],
      });
    } finally {
      await closeNetServer(server);
    }
    expect(result).toEqual({ status: STATUS_SERVER_ERROR, text: INTERNAL_ERROR_MESSAGE });
  });

  test("without NPM_CACHE_DIR the cache lives in /tmp/npm-package-cache", async () => {
    // Unique names: the shared default root may be used by other processes, so only this test's own workspace is removed.
    const name = `pkg-${randomUUID()}`;
    const ws = `ws-${process.pid}-${randomUUID()}`;
    const content = "module.exports = 'default cache dir';";
    publish(name, { "1.0.0": { tarball: buildTarball({ [PKG_JSON_FILE]: "{}", [INDEX_JS]: content }) } }, "1.0.0");
    const savedCache = process.env[ENV_CACHE_DIR];
    delete process.env[ENV_CACHE_DIR];
    let defaultCache!: NpmModule;
    jest.isolateModules(() => {
      defaultCache = require("./npm");
    });
    if (savedCache !== undefined) {
      process.env[ENV_CACHE_DIR] = savedCache;
    }
    const app = express();
    app.use(express.json());
    app.post(PACKAGE_ROUTE, defaultCache.fetchPackageFileWithConfig);
    const server = http.createServer(app);
    const base = await listen(server);
    try {
      const result = await post(base, `${PACKAGE_BASE}/${name}@1.0.0/${INDEX_JS}`, {
        workspaceId: ws,
        npmRegistries: registries(),
      });
      expect(result).toEqual({ status: STATUS_OK, text: content });
      expect(fs.readFileSync(path.join(DEFAULT_CACHE_ROOT, ws, name, "1.0.0", "package", INDEX_JS), "utf8")).toBe(content);
    } finally {
      await closeServer(server);
      // only the uniquely named workspace this test created; DEFAULT_CACHE_ROOT itself is never removed
      fs.rmSync(path.join(DEFAULT_CACHE_ROOT, ws), { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------- B4: handler promise vs response

describe("handler promise settles after the response (B4)", () => {
  const invalidBody = () => ({ workspaceId: uniqueWorkspace(), npmRegistries: registries() });

  test("control: an invalid path answers 400 before any await, so the promise settles with the response sent", async () => {
    const result = await post(wrapperBase, `${PACKAGE_BASE}/UPPER`, invalidBody());
    expect(result.status).toBe(STATUS_BAD_REQUEST);
    await waitFor(() => settled.length > 0);
    expect(settled).toEqual([true]);
  });

  test("control: fetchPackageFile (unrouted) with an invalid path also settles with the response sent", async () => {
    const result = await get(unroutedBase, `${PACKAGE_BASE}/UPPER`);
    expect(result.status).toBe(STATUS_BAD_REQUEST);
    await waitFor(() => unroutedSettled.length > 0);
    expect(unroutedSettled).toEqual([true]);
  });

  // The answer is a 404 from `response.send`, which sets headersSent synchronously. (sendFile writes its headers from an
  // fs.stat callback, after the call returns, so a file response is not a reliable signal for headersSent.) The registry fetch is the first await.
  // Both handlers are observed in this single test (the required name). The two observations are made first and
  // compared in one assertion, so a failure of the first handler cannot hide the state of the second.
  test.failing("B4: the handler's promise settles only after the response is sent", async () => {
    const name = uniqueName();
    publish(name, { "1.0.0": { tarball: "unused" } }, "1.0.0");
    const routed = await post(wrapperBase, `${PACKAGE_BASE}/${name}@7.7.7/${INDEX_JS}`, invalidBody());
    const direct = await get(unroutedBase, `${PACKAGE_BASE}/${name}@7.7.7/${INDEX_JS}`);
    expect(routed).toEqual({ status: STATUS_NOT_FOUND, text: NOT_FOUND_MESSAGE });
    expect(direct).toEqual({ status: STATUS_NOT_FOUND, text: NOT_FOUND_MESSAGE });
    await waitFor(() => settled.length > 0 && unroutedSettled.length > 0);
    expect({ fetchPackageFileWithConfig: settled, fetchPackageFile: unroutedSettled }).toEqual({
      fetchPackageFileWithConfig: [true],
      fetchPackageFile: [true],
    });
  });
});

// ---------------------------------------------------------------- unrouted handlers

describe("fetchRegistry and fetchPackageFile (exported, not routed) use the singleton registry", () => {
  test("fetchRegistry returns the upstream JSON using the configured bearer entry", async () => {
    const name = uniqueName();
    const doc = { name, "dist-tags": { latest: "3.0.0" } };
    routes[`/${name}`] = (_req, res) => res.end(JSON.stringify(doc));

    const res = await fetch(`${unroutedBase}${REGISTRY_BASE}/${name}`);

    expect(res.status).toBe(STATUS_OK);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(await res.json()).toEqual(doc);
    expect(recorded).toEqual([{ method: "GET", path: `/${name}`, authorization: `Bearer ${BEARER_TOKEN}` }]);
  });

  test("fetchRegistry: invalid path gives 400, upstream 404 is passed through", async () => {
    expect(await get(unroutedBase, `${REGISTRY_BASE}/UPPER`)).toEqual({
      status: STATUS_BAD_REQUEST,
      text: "Invalid package path: /UPPER",
    });
    const name = uniqueName();
    routes[`/${name}`] = (_req, res) => {
      res.statusCode = STATUS_NOT_FOUND;
      res.end("gone");
    };
    expect(await get(unroutedBase, `${REGISTRY_BASE}/${name}`)).toEqual({ status: STATUS_NOT_FOUND, text: "gone" });
  });

  test("fetchRegistry: a non-JSON upstream body gives 500", async () => {
    const name = uniqueName();
    routes[`/${name}`] = (_req, res) => res.end("<html>not json</html>");
    expect(await get(unroutedBase, `${REGISTRY_BASE}/${name}`)).toEqual({
      status: STATUS_SERVER_ERROR,
      text: INTERNAL_ERROR_MESSAGE,
    });
  });

  test("fetchPackageFile unpacks under <cache>/default and serves the file", async () => {
    const name = uniqueName();
    const content = "module.exports = 'default workspace';";
    publish(name, { "1.0.0": { tarball: buildTarball({ [PKG_JSON_FILE]: "{}", [INDEX_JS]: content }) } }, "1.0.0");

    const result = await get(unroutedBase, `${PACKAGE_BASE}/${name}@1.0.0/${INDEX_JS}`);

    expect(result).toEqual({ status: STATUS_OK, text: content });
    expect(fs.existsSync(unpackedDir(DEFAULT_WORKSPACE, name, "1.0.0"))).toBe(true);
    expect(recorded.map((r) => r.authorization)).toEqual([`Bearer ${BEARER_TOKEN}`, `Bearer ${BEARER_TOKEN}`]);
  });
});
