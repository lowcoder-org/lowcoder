import http from "http";
import fs from "fs";
import fsPromises from "fs/promises";
import os from "os";
import path from "path";
import { once } from "events";

// LOWCODER_MAX_REQUEST_SIZE parsing (parseRequestLimitNoLib, not exported). server.ts reads env at import
// and calls listen, so every row boots it inside jest.isolateModules with NODE_SERVICE_PORT=0 (an ephemeral TCP port).
// Kept in its own file because each boot costs several seconds, so jest can run it beside server.test.ts.
// The `limit` option handed to each body parser is recorded by wrappers that call through to the real parser.
const TEST_TIMEOUT_MS = 180_000;
const REQUEST_TIMEOUT_MS = 120_000;
const EPHEMERAL_PORT = "0";
const API_HOST = "http://api.test";
const ENV_LIMIT = "LOWCODER_MAX_REQUEST_SIZE";
const ENV_PORT = "NODE_SERVICE_PORT";
const FIFTY_MB = 52428800;
const ENCRYPTED_HEADER = "x-encrypted";
const JSON_HEADERS = { "content-type": "application/json" };
const TEXT_HEADERS = { "content-type": "text/plain", [ENCRYPTED_HEADER]: "true" };
const KB = 1024;
const MB = KB * KB;
// /runJs and /batchRunJs take at most this much, or the configured limit when that is smaller
const RUN_JS_LIMIT = 5 * MB;
const RUN_JS_PATH = "/node-service/api/runJs";

jest.setTimeout(TEST_TIMEOUT_MS);

const ORIGINAL_ENV = { ...process.env };
let npmCacheDir: string;
let originalMkdir: typeof fsPromises.mkdir;
const pendingMkdirs: Promise<unknown>[] = [];
let openServers: http.Server[] = [];

type LimitLog = { expressJson: unknown[]; urlencoded: unknown[]; parserJson: unknown[]; parserText: unknown[] };
type Booted = { server: http.Server; port: number; limits: LimitLog };

function applyEnv(env: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) {
      delete process.env[k];
    } else {
      process.env[k] = v;
    }
  }
}

/**
 * Imports server.ts in its own module registry. Records the `limit` option handed to each body parser
 * (the real parser still runs: the wrappers call through).
 * Throws synchronously when server.ts throws at import (invalid LOWCODER_MAX_REQUEST_SIZE).
 */
function load(env: Record<string, string | undefined>): Booted {
  const limits: LimitLog = { expressJson: [], urlencoded: [], parserJson: [], parserText: [] };
  const createServerSpy = jest.spyOn(http, "createServer");
  try {
    jest.isolateModules(() => {
      applyEnv({
        [ENV_PORT]: EPHEMERAL_PORT,
        NPM_CACHE_DIR: npmCacheDir,
        API_HOST,
        LOWCODER_NODE_SERVICE_SECRET: undefined,
        LOWCODER_NODE_SERVICE_SECRET_SALT: undefined,
        // ambient values server.ts reads at import must not leak in; a test sets them through `env`
        [ENV_LIMIT]: undefined,
        LOWCODER_PREVIEW_FRONTEND_URL: undefined,
        LOWCODER_PREVIEW_CHROMIUM_PATH: undefined,
        NPM_REGISTRY_CONFIG: undefined,
        ...env,
      });
      /* eslint-disable @typescript-eslint/no-var-requires */
      const express = require("express");
      const bodyParser = require("body-parser");
      /* eslint-enable @typescript-eslint/no-var-requires */
      const origExpressJson = express.json;
      const origUrlencoded = express.urlencoded;
      const origParserJson = bodyParser.json;
      const origParserText = bodyParser.text;
      express.json = (o: any) => (limits.expressJson.push(o?.limit), origExpressJson(o));
      express.urlencoded = (o: any) => (limits.urlencoded.push(o?.limit), origUrlencoded(o));
      // body-parser exposes lazy getters, so they are redefined on this registry's private copy.
      Object.defineProperty(bodyParser, "json", {
        value: (o: any) => (limits.parserJson.push(o?.limit), origParserJson(o)),
        configurable: true,
        writable: true,
      });
      Object.defineProperty(bodyParser, "text", {
        value: (o: any) => (limits.parserText.push(o?.limit), origParserText(o)),
        configurable: true,
        writable: true,
      });
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require("./server");
    });
    const server: http.Server = createServerSpy.mock.results[0].value;
    openServers.push(server);
    const port = 0;
    return { server, port, limits };
  } finally {
    createServerSpy.mockRestore();
  }
}

async function boot(env: Record<string, string | undefined> = {}): Promise<Booted> {
  const booted = load(env);
  if (!booted.server.listening) {
    await once(booted.server, "listening");
  }
  booted.port = (booted.server.address() as { port: number }).port;
  return booted;
}

async function closeAll() {
  const servers = openServers;
  openServers = [];
  await Promise.all(
    servers.map(
      (s) =>
        new Promise<void>((resolve) => {
          if (!s.listening) return resolve();
          s.close(() => resolve());
          s.closeAllConnections();
        })
    )
  );
}

type Reply = { status: number; headers: Headers; text: string; json: () => any };

async function call(b: Booted, method: string, urlPath: string, init: { headers?: Record<string, string>; body?: string } = {}): Promise<Reply> {
  const res = await fetch(`http://127.0.0.1:${b.port}${urlPath}`, {
    method,
    headers: init.headers,
    body: init.body,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const text = await res.text();
  return { status: res.status, headers: res.headers, text, json: () => JSON.parse(text) };
}

beforeAll(() => {
  npmCacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "nodesvc-server-npm-"));
  // controllers/npm.ts fires an un-awaited fs/promises mkdir at every import. Record each call (it still runs
  // for real) so afterAll can wait for exactly those operations instead of guessing a delay.
  originalMkdir = fsPromises.mkdir;
  fsPromises.mkdir = ((...args: Parameters<typeof fsPromises.mkdir>) => {
    const pending = originalMkdir(...args);
    pendingMkdirs.push(pending);
    return pending;
  }) as typeof fsPromises.mkdir;
});

function restoreEnv() {
  for (const k of Object.keys(process.env)) {
    if (!(k in ORIGINAL_ENV)) delete process.env[k];
  }
  Object.assign(process.env, ORIGINAL_ENV);
}

function usePerTestBoot() {
  afterEach(async () => {
    await closeAll();
    restoreEnv();
  });
}

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(async () => {
  // Removing NPM_CACHE_DIR while an un-awaited import-time mkdir is in flight makes it reject unhandled (ENOENT)
  // and crash the worker. Wait for every recorded mkdir to settle (they run for real), then remove the directory.
  // Limit: only mkdir calls made through fs/promises while this file is running are tracked.
  fsPromises.mkdir = originalMkdir;
  await Promise.allSettled(pendingMkdirs);
  fs.rmSync(npmCacheDir, { recursive: true, force: true });
});

describe("request size limit (parseRequestLimitNoLib)", () => {
  usePerTestBoot();

  const ACCEPTED: [string, string | undefined, number][] = [
    ["unset falls back to 50mb", undefined, FIFTY_MB],
    ["blank falls back to 50mb", "   ", FIFTY_MB],
    ["plain bytes", "52428800", FIFTY_MB],
    ["128kb", "128kb", 128 * KB],
    ["128k", "128k", 128 * KB],
    ["1.5m", "1.5m", 1.5 * MB],
    ["50 m with whitespace", "50 m", FIFTY_MB],
    ["1gb", "1gb", 1024 * MB],
    ["1g", "1g", 1024 * MB],
    ["1t", "1t", 1024 * 1024 * MB],
    ["1tb", "1tb", 1024 * 1024 * MB],
    ["1p", "1p", 1024 * 1024 * 1024 * MB],
    ["10b", "10b", 10],
    ["upper case 2MB", "2MB", 2 * MB],
  ];

  it.each(ACCEPTED)("%s", async (_label, value, expected) => {
    const b = await boot({ [ENV_LIMIT]: value });
    // a JSON request and an encrypted (text) request make the per-request parsers run
    await call(b, "GET", "/nope");
    await call(b, "POST", "/nope", { headers: JSON_HEADERS, body: "{}" });
    await call(b, "POST", "/nope", { headers: TEXT_HEADERS, body: "abc" });
    // express.urlencoded and express.json are built once at import (urlencoded twice: for the evaluation routes, then for all routes);
    // bodyParser.json and bodyParser.text are built per request
    expect(b.limits.urlencoded).toEqual([Math.min(RUN_JS_LIMIT, expected), expected]);
    expect(b.limits.expressJson).toEqual([expected]);
    expect(b.limits.parserJson).toEqual([expected, expected]);
    expect(b.limits.parserText).toEqual([expected]);
  });

  it.each([
    ["the default limit is capped at 5 MiB", undefined, 50 * MB, RUN_JS_LIMIT],
    ["a configured limit below 5 MiB is kept", "2MB", 2 * MB, 2 * MB],
  ])("the evaluation routes: %s", async (_label, value, global, scoped) => {
    const b = await boot({ [ENV_LIMIT]: value });
    await call(b, "POST", RUN_JS_PATH, { headers: JSON_HEADERS, body: JSON.stringify({ jsCode: "return 1" }) });
    // the parser of the evaluation routes runs first, the global one finds the body already parsed
    expect(b.limits.parserJson).toEqual([scoped, global]);
  });

  const REJECTED: [string, string, string][] = [
    ["zero bytes", "0", "Invalid request size: 0"],
    ["a number too large for a double", "9".repeat(400), "Invalid request size:"],
    ["letters only", "abc", "Invalid LOWCODER_MAX_REQUEST_SIZE"],
    ["an unknown unit", "5xb", "Invalid LOWCODER_MAX_REQUEST_SIZE"],
    ["a zero value with a unit", "0mb", "numeric value"],
    ["a value beyond the safe integer range", "9999999pb", "too large or invalid"],
  ];

  it.each(REJECTED)("import throws for %s", (_label, value, message) => {
    expect(() => load({ [ENV_LIMIT]: value })).toThrow(message);
  });
});

