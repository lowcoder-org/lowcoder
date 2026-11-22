import http from "http";
import fs from "fs";
import os from "os";
import path from "path";
import { once } from "events";
import { createCipheriv, pbkdf2Sync } from "crypto";
import { AxiosError } from "axios";

// what a real HTTP client sees. server.ts reads env at import and calls listen, so every boot runs inside
// jest.isolateModules with NODE_SERVICE_PORT=0 (an ephemeral TCP port). No repo module is mocked.
const TEST_TIMEOUT_MS = 90_000;
const REQUEST_TIMEOUT_MS = 20_000;
const STATUS_OK = 200;
const STATUS_NO_CONTENT = 204;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const PAYLOAD_TOO_LARGE = 413;
const SERVER_ERROR = 500;
const UNSUPPORTED_MEDIA_TYPE = 415;
const TOO_LARGE_MESSAGE = "request entity too large";
const ERROR_HANDLER_ARITY = 4;
const STATUS_BELOW_CLIENT_ERRORS = 399;
const STATUS_ABOVE_CLIENT_ERRORS = 503;
const STATUS_LAST_CLIENT_ERROR = 499;
const DEFAULT_PORT = 6060;
const EPHEMERAL_PORT = "0";
const API_HOST = "http://api.test";
const PREFIX = "/node-service";
const RUN_PLUGIN_QUERY = `${PREFIX}/api/runPluginQuery`;
const RUN_JS = `${PREFIX}/api/runJs`;
const ENV_LIMIT = "LOWCODER_MAX_REQUEST_SIZE";
const ENV_PORT = "NODE_SERVICE_PORT";
const FIFTY_MB = 52428800;
const ENCRYPTED_HEADER = "x-encrypted";
const JSON_HEADERS = { "content-type": "application/json" };
const TEXT_HEADERS = { "content-type": "text/plain", [ENCRYPTED_HEADER]: "true" };
const UP_MESSAGE = "Lowcoder Node Service is up and running";
const KB = 1024;
const MB = KB * KB;
const AT_LIMIT_BYTES = 512;
const JUST_UNDER_LIMIT_BYTES = 1020;
const JUST_OVER_LIMIT_BYTES = 1030;
const RUN_JS_PROBE = JSON.stringify({ jsCode: "return 1", pad: "" });

/** A runJs body whose serialized size is exactly `bytes`. */
const runJsBodyOfSize = (bytes: number): string =>
  JSON.stringify({ jsCode: "return 1", pad: "x".repeat(bytes - Buffer.byteLength(RUN_JS_PROBE)) });

// Encryption vector built from Spring's documented Encryptors.text scheme (same, weaker provenance as
// utils/encryption.test.ts). Default secret and salt apply because the env vars are unset.
const DEFAULT_PASSWORD = "lowcoderpwd";
const DEFAULT_SALT = "lowcodersalt";
const FIXED_IV = Buffer.from("000102030405060708090a0b0c0d0e0f", "hex");

function encryptLikeSpring(plaintext: string): string {
  const key = pbkdf2Sync(DEFAULT_PASSWORD, Buffer.from(DEFAULT_SALT, "utf8"), 1024, 32, "sha1");
  const cipher = createCipheriv("aes-256-cbc", key, FIXED_IV);
  const body = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return Buffer.concat([FIXED_IV, body]).toString("hex");
}

jest.setTimeout(TEST_TIMEOUT_MS);

const ORIGINAL_ENV = { ...process.env };
let npmCacheDir: string;
let openServers: http.Server[] = [];

type LimitLog = { expressJson: unknown[]; urlencoded: unknown[]; parserJson: unknown[]; parserText: unknown[] };
type Booted = { server: http.Server; port: number; limits: LimitLog; app: any };

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
function load(env: Record<string, string | undefined>, requestedPorts?: unknown[]): Booted {
  const limits: LimitLog = { expressJson: [], urlencoded: [], parserJson: [], parserText: [] };
  const createServerSpy = jest.spyOn(http, "createServer");
  const listenSpy = requestedPorts
    ? jest.spyOn(http.Server.prototype, "listen").mockImplementation(function (this: http.Server, ...args: any[]) {
        requestedPorts.push(args[0]);
        listenSpy?.mockRestore();
        return this.listen(0, ...args.slice(1));
      } as any)
    : undefined;
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
    return { server, port, limits, app: createServerSpy.mock.calls[0][0] };
  } finally {
    createServerSpy.mockRestore();
    listenSpy?.mockRestore();
  }
}

async function boot(env: Record<string, string | undefined> = {}, requestedPorts?: unknown[]): Promise<Booted> {
  const booted = load(env, requestedPorts);
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
    headers: { "accept-language": "en", ...init.headers },
    body: init.body,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const text = await res.text();
  return { status: res.status, headers: res.headers, text, json: () => JSON.parse(text) };
}

function rawRequest(b: Booted, options: http.RequestOptions): Promise<{ status: number; headers: http.IncomingHttpHeaders; text: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: "127.0.0.1", port: b.port, agent: false, timeout: REQUEST_TIMEOUT_MS, ...options, headers: { connection: "close", ...options.headers } },
      (res) => {
        let text = "";
        res.on("data", (c) => (text += c));
        res.on("end", () => resolve({ status: res.statusCode!, headers: res.headers, text }));
      }
    );
    req.on("timeout", () => req.destroy(new Error("raw request timed out")));
    req.on("error", reject);
    req.end();
  });
}

beforeAll(() => {
  npmCacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "nodesvc-server-npm-"));
});

function restoreEnv() {
  for (const k of Object.keys(process.env)) {
    if (!(k in ORIGINAL_ENV)) delete process.env[k];
  }
  Object.assign(process.env, ORIGINAL_ENV);
}

// Every boot costs several seconds (the plugin list is re-imported in a fresh registry), so tests that do not
// depend on boot-time env share one boot per describe and the env-dependent ones boot per test.
function useSharedBoot(env: Record<string, string | undefined> = {}): { get: () => Booted } {
  let shared: Booted;
  beforeAll(async () => {
    shared = await boot(env);
  });
  afterAll(async () => {
    await closeAll();
    restoreEnv();
  });
  return { get: () => shared };
}

function usePerTestBoot() {
  afterEach(async () => {
    await closeAll();
    restoreEnv();
  });
}

beforeEach(() => {
  // the error handler logs every error with console.error; keep the output readable and assert on it where it matters
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(() => {
  fs.rmSync(npmCacheDir, { recursive: true, force: true });
});

describe("server routes and middleware", () => {
  const shared = useSharedBoot();
  it("GET / answers the health document", async () => {
    const b = shared.get();
    const r = await call(b, "GET", "/");
    expect(r.status).toBe(STATUS_OK);
    expect(r.json()).toEqual({ code: 1, message: UP_MESSAGE, success: true });
  });

  it("serves plugin icons from the static mount", async () => {
    const b = shared.get();
    const r = await call(b, "GET", `${PREFIX}/plugin-icons/appconfig.svg`);
    expect(r.status).toBe(STATUS_OK);
    expect(r.headers.get("content-type")).toContain("image/svg+xml");
    expect(r.text).toContain("<svg");
  });

  it.each([
    ["GET", "/nope"],
    ["GET", `${PREFIX}/nope`],
    ["POST", `${PREFIX}/api/nope`],
    ["GET", `${PREFIX}/plugin-icons/missing.svg`],
  ])("%s %s answers 404 not found", async (method, urlPath) => {
    const b = shared.get();
    const r = await call(b, method, urlPath);
    expect(r.status).toBe(NOT_FOUND);
    expect(r.json()).toEqual({ message: "not found" });
  });

  it("maps a ServiceError to its own status and message", async () => {
    const b = shared.get();
    const r = await call(b, "POST", RUN_PLUGIN_QUERY, { headers: JSON_HEADERS, body: JSON.stringify({ pluginName: "nope" }) });
    expect(r.status).toBe(BAD_REQUEST);
    expect(r.json()).toEqual({ message: "plugin not found: nope" });
    expect(console.error).toHaveBeenCalled();
  });

  it("maps a plain Error to 500 with its message", async () => {
    const b = shared.get();
    // no dsl: evalToValue reads dsl["actionName"] from undefined and throws a TypeError
    const r = await call(b, "POST", RUN_PLUGIN_QUERY, { headers: JSON_HEADERS, body: JSON.stringify({ pluginName: "dynamodb" }) });
    expect(r.status).toBe(SERVER_ERROR);
    expect(r.json().message).toMatch(/actionName/);
    expect(console.error).toHaveBeenCalled();
  });

  test("B25: an unsupported content encoding gets 415", async () => {
    const b = shared.get();
    const r = await call(b, "POST", RUN_PLUGIN_QUERY, {
      headers: { ...JSON_HEADERS, "content-encoding": "bogus" },
      body: "{}",
    });
    expect(r.status).toBe(UNSUPPORTED_MEDIA_TYPE);
    expect(r.json()).toEqual({ message: 'unsupported content encoding "bogus"' });
  });

  test("B25: only exposed 4xx statuses are passed through", async () => {
    // no HTTP route throws a status-carrying error without `expose`, so the real error handler of the booted
    // server is called directly. Relies on Express 4's `app._router` (Express 5 renamed it `app.router`).
    const b = shared.get();
    const handlers = b.app._router.stack.filter((layer: any) => layer.handle.length === ERROR_HANDLER_ARITY);
    expect(handlers).toHaveLength(1);
    const rows: [string, Error, number][] = [
      ["exposed 404", Object.assign(new Error("row 404"), { status: NOT_FOUND, expose: true }), NOT_FOUND],
      ["exposed 400", Object.assign(new Error("row 400"), { status: BAD_REQUEST, expose: true }), BAD_REQUEST],
      ["exposed 499", Object.assign(new Error("row 499"), { status: STATUS_LAST_CLIENT_ERROR, expose: true }), STATUS_LAST_CLIENT_ERROR],
      ["exposed 399", Object.assign(new Error("row 399"), { status: STATUS_BELOW_CLIENT_ERRORS, expose: true }), SERVER_ERROR],
      ["exposed 503", Object.assign(new Error("row 503"), { status: STATUS_ABOVE_CLIENT_ERRORS, expose: true }), SERVER_ERROR],
      ["string status", Object.assign(new Error("row string status"), { status: "400", expose: true }), SERVER_ERROR],
      ["no expose", Object.assign(new Error("row no expose"), { status: NOT_FOUND }), SERVER_ERROR],
      [
        "axios error",
        new AxiosError("row axios", "ERR_BAD_REQUEST", undefined, undefined, { status: NOT_FOUND } as any),
        SERVER_ERROR,
      ],
    ];
    for (const [name, err, expectedCode] of rows) {
      const res: any = {
        status(c: number) {
          this.code = c;
          return this;
        },
        json(body: unknown) {
          this.body = body;
          return this;
        },
      };
      handlers[0].handle(err, {}, res, () => undefined);
      expect({ row: name, code: res.code, body: res.body }).toEqual({ row: name, code: expectedCode, body: { message: err.message } });
    }
  });

  it("parses a JSON body when x-encrypted is absent", async () => {
    const b = shared.get();
    const r = await call(b, "POST", RUN_JS, { headers: JSON_HEADERS, body: JSON.stringify({ jsCode: "return 40 + 2" }) });
    expect(r.status).toBe(STATUS_OK);
    expect(r.json()).toEqual({ result: 42 });
  });

  it("reads the body as text and decrypts it when x-encrypted is set", async () => {
    const b = shared.get();
    const body = encryptLikeSpring(JSON.stringify({ pluginName: "enc-marker" }));
    const r = await call(b, "POST", RUN_PLUGIN_QUERY, { headers: TEXT_HEADERS, body });
    // the decrypted pluginName reached the plugin service, which refuses the unknown plugin by name
    expect(r.status).toBe(BAD_REQUEST);
    expect(r.json()).toEqual({ message: "plugin not found: enc-marker" });
  });

  it("answers 400 when an x-encrypted body cannot be decrypted", async () => {
    const b = shared.get();
    const r = await call(b, "POST", RUN_PLUGIN_QUERY, { headers: TEXT_HEADERS, body: "not-hex-ciphertext" });
    expect(r.status).toBe(BAD_REQUEST);
    expect(r.json()).toEqual({ message: "Failed to decrypt string" });
  });

  it("answers a CORS preflight by echoing the origin and allowing credentials", async () => {
    const b = shared.get();
    const origin = "https://x.test";
    const r = await rawRequest(b, {
      method: "OPTIONS",
      path: RUN_PLUGIN_QUERY,
      headers: { origin, "access-control-request-method": "POST", "access-control-request-headers": "Lowcoder-Ce-Selfhost-Token" },
    });
    expect(r.status).toBe(STATUS_NO_CONTENT);
    expect(r.headers["access-control-allow-origin"]).toBe(origin);
    expect(r.headers["access-control-allow-credentials"]).toBe("true");
    expect(r.headers["access-control-allow-headers"]).toContain("Lowcoder-Ce-Selfhost-Token");
    expect(r.headers["access-control-allow-methods"]).toEqual("GET,POST,PUT,DELETE,PATCH,OPTIONS");
  });

  it("applies CORS to the routes registered after it but not to the health route registered before it", async () => {
    const b = shared.get();
    const origin = "https://other.test";
    // fetch refuses to send an Origin header, so these go through http.request
    const api = await rawRequest(b, { method: "GET", path: `${PREFIX}/nope`, headers: { origin } });
    expect(api.status).toBe(NOT_FOUND);
    expect(api.headers["access-control-allow-origin"]).toBe(origin);
    expect(api.headers["access-control-allow-credentials"]).toBe("true");
    // `GET /` is declared before the cors() middleware (server.ts), so it never passes through it
    const health = await rawRequest(b, { method: "GET", path: "/", headers: { origin } });
    expect(health.status).toBe(STATUS_OK);
    expect(health.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("listen port", () => {
  usePerTestBoot();

  it("listens on 6060 when NODE_SERVICE_PORT is unset", async () => {
    const requested: unknown[] = [];
    await boot({ [ENV_PORT]: undefined }, requested);
    expect(requested).toEqual([DEFAULT_PORT]);
  });
});

describe("request size limit end to end (1kb)", () => {
  const oneKb = useSharedBoot({ [ENV_LIMIT]: "1kb" });

  it("accepts a body of exactly 512 bytes under a 1kb limit", async () => {
    const b = oneKb.get();
    const body = runJsBodyOfSize(AT_LIMIT_BYTES);
    // 512 bytes catches a wrong "kb" conversion that yields a limit below 512 bytes (e.g. 1000 bits or 0.5kb)
    expect(Buffer.byteLength(body)).toBe(AT_LIMIT_BYTES);
    const r = await call(b, "POST", RUN_JS, { headers: JSON_HEADERS, body });
    expect(r.status).toBe(STATUS_OK);
    expect(r.json()).toEqual({ result: 1 });
  });

  it("accepts a body of 1020 bytes just under the 1kb limit", async () => {
    const b = oneKb.get();
    const body = runJsBodyOfSize(JUST_UNDER_LIMIT_BYTES);
    // 1020 bytes catches a limit anywhere below 1020 bytes (the 1024-byte limit is not probed at its edge)
    expect(Buffer.byteLength(body)).toBe(JUST_UNDER_LIMIT_BYTES);
    const r = await call(b, "POST", RUN_JS, { headers: JSON_HEADERS, body });
    expect(r.status).toBe(STATUS_OK);
    expect(r.json()).toEqual({ result: 1 });
  });

  it("rejects a body of 1030 bytes just over the 1kb limit without running it", async () => {
    const b = oneKb.get();
    const r = await call(b, "POST", RUN_JS, { headers: JSON_HEADERS, body: runJsBodyOfSize(JUST_OVER_LIMIT_BYTES) });
    // the over-limit body gets 413: this catches a limit that is too large (e.g. "kb" converted with the MB factor),
    // which the under-limit cases cannot
    expect(r.status).toBe(PAYLOAD_TOO_LARGE);
    expect(r.json()).not.toEqual({ result: 1 });
  });

  test("B25: error bodies keep the {message} shape", async () => {
    const b = oneKb.get();
    const oversized = await call(b, "POST", RUN_JS, {
      headers: JSON_HEADERS,
      body: JSON.stringify({ jsCode: "return 1", pad: "x".repeat(2 * KB) }),
    });
    const malformed = await call(b, "POST", RUN_JS, { headers: JSON_HEADERS, body: '{"jsCode": ' });
    expect(oversized.json()).toEqual({ message: TOO_LARGE_MESSAGE });
    const malformedBody = malformed.json();
    expect(Object.keys(malformedBody)).toEqual(["message"]);
    expect(typeof malformedBody.message).toBe("string");
    expect(malformedBody.message.length).toBeGreaterThan(0);
  });

  test("B25: an oversized encrypted text body gets 413", async () => {
    const b = oneKb.get();
    const r = await call(b, "POST", RUN_PLUGIN_QUERY, { headers: TEXT_HEADERS, body: "ab".repeat(KB) });
    expect(r.status).toBe(PAYLOAD_TOO_LARGE);
    expect(r.json()).toEqual({ message: TOO_LARGE_MESSAGE });
  });

  test("B25: an oversized urlencoded body gets 413", async () => {
    const b = oneKb.get();
    const r = await call(b, "POST", RUN_PLUGIN_QUERY, {
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "a=" + "x".repeat(2 * KB),
    });
    expect(r.status).toBe(PAYLOAD_TOO_LARGE);
    expect(r.json()).toEqual({ message: TOO_LARGE_MESSAGE });
  });

  test("B25: malformed JSON gives 400 and an oversized body 413", async () => {
    const b = oneKb.get();
    // both requests are sent before either is asserted, so the 413 half runs even while the 400 half fails
    const malformed = await call(b, "POST", RUN_JS, { headers: JSON_HEADERS, body: '{"jsCode": ' });
    const oversized = await call(b, "POST", RUN_JS, {
      headers: JSON_HEADERS,
      body: JSON.stringify({ jsCode: "return 1", pad: "x".repeat(2 * KB) }),
    });
    const justOver = await call(b, "POST", RUN_JS, { headers: JSON_HEADERS, body: runJsBodyOfSize(JUST_OVER_LIMIT_BYTES) });
    expect(malformed.status).toBe(BAD_REQUEST);
    expect(oversized.status).toBe(PAYLOAD_TOO_LARGE);
    // 1030 bytes is just over the 1024-byte limit: catches a limit between 1030 and 2047 bytes that the 2kb body misses
    expect(justOver.status).toBe(PAYLOAD_TOO_LARGE);
  });
});
