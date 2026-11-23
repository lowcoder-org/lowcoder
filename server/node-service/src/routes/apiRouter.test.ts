import http from "http";
import fs from "fs";
import os from "os";
import path from "path";
import { once } from "events";
import { createCipheriv, pbkdf2Sync } from "crypto";

// the /node-service/api route table and its in-memory response cache, exercised through a real HTTP server
// booted from server.ts inside jest.isolateModules (fresh cache, fresh prom-client). No repo module is mocked.
// The cache is module state shared by all tests of this file, so every test uses its own cache keys.
const TEST_TIMEOUT_MS = 90_000;
const REQUEST_TIMEOUT_MS = 20_000;
const STATUS_OK = 200;
const BAD_REQUEST = 400;
const PAYLOAD_TOO_LARGE = 413;
const NOT_FOUND = 404;
const INTERNAL_ERROR = 500;
const API = "/node-service/api";
const PLUGINS = `${API}/plugins`;
const DYNAMIC_CONFIG = `${API}/getPluginDynamicConfig`;
const JSON_HEADERS = { "content-type": "application/json" };
const TEXT_HEADERS = { "content-type": "text/plain" };
const ENCRYPTED_HEADERS = { "content-type": "text/plain", "x-encrypted": "true" };
const PBKDF2_ITERATIONS = 1024;
const AES_KEY_BYTES = 32;
// Spring Encryptors.text scheme with the default secret/salt (env unset), same vector as server.test.ts
const DEFAULT_PASSWORD = "lowcoderpwd";
const DEFAULT_SALT = "lowcodersalt";
const FIXED_IV = Buffer.from("000102030405060708090a0b0c0d0e0f", "hex");
// env server.ts and its imports read at boot; cleared so an ambient value cannot change the boot
const AMBIENT_ENV = [
  "LOWCODER_MAX_REQUEST_SIZE",
  "LOWCODER_PREVIEW_FRONTEND_URL",
  "LOWCODER_PREVIEW_CHROMIUM_PATH",
  "LOWCODER_NODE_SERVICE_SECRET",
  "LOWCODER_NODE_SERVICE_SECRET_SALT",
  "NPM_REGISTRY_CONFIG",
];
const ENCRYPTED_KEY_PATH = `${DYNAMIC_CONFIG}?case=encrypted-body`;
// /runJs and /batchRunJs take bodies up to 5 MiB; every other route keeps the global limit (50 MiB by default)
const RUN_JS_LIMIT_BYTES = 5 * 1024 * 1024;
const BODY_MARGIN_BYTES = 1024;
const NOT_ARRAY_MESSAGE = "request body is not a valid array";
const API_HOST = "http://api.test";
const DYNAMIC_PLUGIN = "postmanEcho";
const DYNAMIC_PATH = "$.queryConfig";

jest.setTimeout(TEST_TIMEOUT_MS);

type PluginServices = typeof import("../services/plugin");
type Reply = { status: number; text: string; json: () => any };

let server: http.Server;
let port: number;
let services: PluginServices;
let listPluginsSpy: jest.SpyInstance;
let dynamicDefSpy: jest.SpyInstance;
let npmCacheDir: string;
const ORIGINAL_ENV = { ...process.env };

async function call(method: string, urlPath: string, init: { headers?: Record<string, string>; body?: string } = {}): Promise<Reply> {
  const res = await fetch(`http://127.0.0.1:${port}${urlPath}`, {
    method,
    headers: { "accept-language": "en", ...init.headers },
    body: init.body,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const text = await res.text();
  return { status: res.status, text, json: () => JSON.parse(text) };
}

function encryptLikeSpring(plaintext: string): string {
  const key = pbkdf2Sync(DEFAULT_PASSWORD, Buffer.from(DEFAULT_SALT, "utf8"), PBKDF2_ITERATIONS, AES_KEY_BYTES, "sha1");
  const cipher = createCipheriv("aes-256-cbc", key, FIXED_IV);
  return Buffer.concat([FIXED_IV, cipher.update(plaintext, "utf8"), cipher.final()]).toString("hex");
}

const getJson = (urlPath: string, headers?: Record<string, string>) => call("GET", urlPath, { headers });
const postJson = (urlPath: string, body: unknown) => call("POST", urlPath, { headers: JSON_HEADERS, body: JSON.stringify(body) });
const dynamicItem = (tag: string) => ({ pluginName: DYNAMIC_PLUGIN, path: DYNAMIC_PATH, dataSourceConfig: { specVersion: "v1.0", tag } });

beforeAll(async () => {
  npmCacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "nodesvc-api-npm-"));
  const createServerSpy = jest.spyOn(http, "createServer");
  try {
    jest.isolateModules(() => {
      process.env.NODE_SERVICE_PORT = "0";
      process.env.NPM_CACHE_DIR = npmCacheDir;
      process.env.API_HOST = API_HOST;
      for (const k of AMBIENT_ENV) delete process.env[k];
      // The controllers call the service as module properties, so spying observes them while the real code runs.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      services = require("../services/plugin");
      listPluginsSpy = jest.spyOn(services, "listPlugins");
      dynamicDefSpy = jest.spyOn(services, "getDynamicConfigDef");
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require("../server");
    });
    server = createServerSpy.mock.results[0].value;
  } finally {
    createServerSpy.mockRestore();
  }
  if (!server.listening) {
    await once(server, "listening");
  }
  port = (server.address() as { port: number }).port;
});

beforeEach(() => {
  // the server's error handler logs every error; keep the output readable
  jest.spyOn(console, "error").mockImplementation(() => undefined);
  listPluginsSpy.mockClear();
  dynamicDefSpy.mockClear();
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
    server.closeAllConnections();
  });
  jest.restoreAllMocks();
  for (const k of Object.keys(process.env)) {
    if (!(k in ORIGINAL_ENV)) delete process.env[k];
  }
  Object.assign(process.env, ORIGINAL_ENV);
  fs.rmSync(npmCacheDir, { recursive: true, force: true });
});

describe("GET /plugins response cache", () => {
  it("serves an identical request from the cache without running the service again", async () => {
    const first = await getJson(`${PLUGINS}?id=s3`);
    const second = await getJson(`${PLUGINS}?id=s3`);
    expect(first.status).toBe(STATUS_OK);
    expect(first.json().map((p: any) => p.id)).toEqual(["s3"]);
    expect(second.status).toBe(STATUS_OK);
    expect(second.text).toBe(first.text);
    expect(listPluginsSpy).toHaveBeenCalledTimes(1);
  });

  it("keeps one cache entry per query value", async () => {
    const s3 = await getJson(`${PLUGINS}?id=athena`);
    const dynamodb = await getJson(`${PLUGINS}?id=dynamodb`);
    expect(s3.json().map((p: any) => p.id)).toEqual(["athena"]);
    expect(dynamodb.json().map((p: any) => p.id)).toEqual(["dynamodb"]);
    expect(listPluginsSpy).toHaveBeenCalledTimes(2);
  });

  it("keys nested query objects by their JSON, so a[b]=1 and a[b]=2 are two entries", async () => {
    await getJson(`${PLUGINS}?id=lambda&a[b]=1`);
    await getJson(`${PLUGINS}?id=lambda&a[b]=2`);
    expect(listPluginsSpy).toHaveBeenCalledTimes(2);
    await getJson(`${PLUGINS}?id=lambda&a[b]=1`);
    expect(listPluginsSpy).toHaveBeenCalledTimes(2);
  });

  it("keeps array semantics for repeated query keys and caches that request", async () => {
    const first = await getJson(`${PLUGINS}?id=slack&id=jira`);
    const second = await getJson(`${PLUGINS}?id=slack&id=jira`);
    expect(first.json().map((p: any) => p.id).sort()).toEqual(["jira", "slack"]);
    expect(second.text).toBe(first.text);
    expect(listPluginsSpy).toHaveBeenCalledTimes(1);
    // a different list is a different entry
    const single = await getJson(`${PLUGINS}?id=slack`);
    expect(single.json().map((p: any) => p.id)).toEqual(["slack"]);
    expect(listPluginsSpy).toHaveBeenCalledTimes(2);
  });

  test("B8: the /plugins cache respects Accept-Language", async () => {
    const zh = await getJson(`${PLUGINS}?id=oss`, { "accept-language": "zh" });
    // the localized list differs from English, so the first call really is the Chinese one
    expect(zh.json()[0].name).not.toBe("OSS");
    const en = await getJson(`${PLUGINS}?id=oss`, { "accept-language": "en" });
    expect(en.json()[0].name).toBe("OSS");
  });

  test("B8: headers that parse to the same language list share one entry", async () => {
    const first = await getJson(`${PLUGINS}?id=b8-order`, { "accept-language": "en-US, zh;q=0.8" });
    const second = await getJson(`${PLUGINS}?id=b8-order`, { "accept-language": "zh;q=0.8, en-US" });
    expect(second.text).toBe(first.text);
    expect(listPluginsSpy).toHaveBeenCalledTimes(1);
  });

  test("B8: the same language twice is still served from the cache", async () => {
    await getJson(`${PLUGINS}?id=b8-same`, { "accept-language": "zh" });
    await getJson(`${PLUGINS}?id=b8-same`, { "accept-language": "zh" });
    expect(listPluginsSpy).toHaveBeenCalledTimes(1);
  });
});

describe("POST /getPluginDynamicConfig response cache", () => {
  it("puts the JSON body in the cache key: identical bodies hit the cache, different bodies run the service", async () => {
    const bodyA = [dynamicItem("key-a")];
    const bodyB = [dynamicItem("key-b")];
    const a1 = await postJson(DYNAMIC_CONFIG, bodyA);
    expect(a1.status).toBe(STATUS_OK);
    expect(a1.json()).toHaveLength(1);
    expect(a1.json()[0].type).toBe("query");
    expect(dynamicDefSpy).toHaveBeenCalledTimes(1);

    const a2 = await postJson(DYNAMIC_CONFIG, bodyA);
    expect(a2.text).toBe(a1.text);
    expect(dynamicDefSpy).toHaveBeenCalledTimes(1);

    const b1 = await postJson(DYNAMIC_CONFIG, bodyB);
    expect(b1.status).toBe(STATUS_OK);
    expect(dynamicDefSpy).toHaveBeenCalledTimes(2);
    expect(dynamicDefSpy.mock.calls[1][2]).toEqual({ specVersion: "v1.0", tag: "key-b" });
  });

  it("does not add a body to the key for a non-JSON POST", async () => {
    // text/plain without x-encrypted is not parsed, so the handler sees an empty object and refuses it
    const nonJson = await call("POST", DYNAMIC_CONFIG, { headers: TEXT_HEADERS, body: "plain text" });
    expect(nonJson.status).toBe(BAD_REQUEST);
    expect(nonJson.json()).toEqual({ message: NOT_ARRAY_MESSAGE });
    // the refusal is not cached (B7): the same request is refused again instead of being answered as 200
    const nonJsonAgain = await call("POST", DYNAMIC_CONFIG, { headers: TEXT_HEADERS, body: "plain text" });
    expect(nonJsonAgain.status).toBe(BAD_REQUEST);
    expect(nonJsonAgain.json()).toEqual({ message: NOT_ARRAY_MESSAGE });
    // a JSON POST to the same path has its own key and runs the service
    const valid = await postJson(DYNAMIC_CONFIG, [dynamicItem("after-non-json")]);
    expect(valid.status).toBe(STATUS_OK);
    expect(valid.json()).toHaveLength(1);
    expect(dynamicDefSpy).toHaveBeenCalledTimes(1);
  });

  it("leaves a non-JSON (encrypted text) body out of the key: different bodies share one entry, unlike JSON bodies", async () => {
    // Own query string: the key without a body is `path?query`, and the own query string keeps this test independent of the entries other tests store under the bare path.
    // The body is a hex string, so only the `req.is("application/json")` condition keeps it out of the key.
    const encA = encryptLikeSpring(JSON.stringify([dynamicItem("enc-key-a")]));
    const encB = encryptLikeSpring(JSON.stringify([dynamicItem("enc-key-b")]));
    expect(encB).not.toBe(encA);
    const a = await call("POST", ENCRYPTED_KEY_PATH, { headers: ENCRYPTED_HEADERS, body: encA });
    expect(a.status).toBe(STATUS_OK);
    expect(dynamicDefSpy).toHaveBeenCalledTimes(1);
    expect(dynamicDefSpy.mock.calls[0][2]).toEqual({ specVersion: "v1.0", tag: "enc-key-a" });
    // a different encrypted body is answered from the first entry: the service does not run again
    const b = await call("POST", ENCRYPTED_KEY_PATH, { headers: ENCRYPTED_HEADERS, body: encB });
    expect(b.status).toBe(STATUS_OK);
    expect(b.text).toBe(a.text);
    expect(dynamicDefSpy).toHaveBeenCalledTimes(1);
    // the same two bodies sent as JSON are two entries
    await postJson(DYNAMIC_CONFIG, [dynamicItem("json-key-a")]);
    await postJson(DYNAMIC_CONFIG, [dynamicItem("json-key-b")]);
    expect(dynamicDefSpy).toHaveBeenCalledTimes(3);
  });

  test("B8: /getPluginDynamicConfig keys on the language too", async () => {
    const body = JSON.stringify([dynamicItem("b8-lang")]);
    const postIn = (language: string) =>
      call("POST", DYNAMIC_CONFIG, { headers: { ...JSON_HEADERS, "accept-language": language }, body });
    await postIn("en");
    await postIn("zh");
    await postIn("en");
    expect(dynamicDefSpy).toHaveBeenCalledTimes(2);
  });

  test("B7: two identical bad requests both get 400", async () => {
    const badBody = { not: "an array", unique: "b7" };
    const first = await postJson(DYNAMIC_CONFIG, badBody);
    expect(first.status).toBe(BAD_REQUEST);
    expect(first.json()).toEqual({ message: NOT_ARRAY_MESSAGE });
    const second = await postJson(DYNAMIC_CONFIG, badBody);
    expect(second.status).toBe(BAD_REQUEST);
    expect(second.json()).toEqual({ message: NOT_ARRAY_MESSAGE });
  });

  test("B7: a refusal from the plugin service is not cached; the service runs again", async () => {
    const body = [{ pluginName: "no-such-plugin-b7", path: DYNAMIC_PATH, dataSourceConfig: {} }];
    const first = await postJson(DYNAMIC_CONFIG, body);
    const second = await postJson(DYNAMIC_CONFIG, body);
    for (const reply of [first, second]) {
      expect(reply.status).toBe(BAD_REQUEST);
      expect(reply.json()).toEqual({ message: "plugin not found: no-such-plugin-b7" });
    }
    expect(dynamicDefSpy).toHaveBeenCalledTimes(2);
  });

  test("B7: a 500 is not cached", async () => {
    const body = [{ pluginName: DYNAMIC_PLUGIN, path: DYNAMIC_PATH, dataSourceConfig: { specVersion: "no-such-version-b7" } }];
    const first = await postJson(DYNAMIC_CONFIG, body);
    const second = await postJson(DYNAMIC_CONFIG, body);
    for (const reply of [first, second]) {
      expect(reply.status).toBe(INTERNAL_ERROR);
      expect(reply.json().message).toBe("Expected a file path, URL, or object. Got undefined");
    }
    expect(dynamicDefSpy).toHaveBeenCalledTimes(2);
  });
});

describe("route table", () => {
  const ROUTES: [string, string, number, unknown][] = [
    ["POST", "/runJs", STATUS_OK, { jsCode: "return 7" }],
    ["POST", "/batchRunJs", STATUS_OK, { requests: [] }],
    ["GET", "/plugins?id=route-table", STATUS_OK, undefined],
    ["POST", "/runPluginQuery", BAD_REQUEST, { pluginName: "route-table" }],
    ["POST", "/getPluginDynamicConfig", BAD_REQUEST, { route: "table" }],
    ["POST", "/validatePluginDataSourceConfig", BAD_REQUEST, { pluginName: "route-table" }],
    ["POST", "/npm/registry/route-table", BAD_REQUEST, {}],
    ["POST", "/npm/package/route-table", BAD_REQUEST, {}],
  ];

  it.each(ROUTES)("%s %s is routed and answers %i", async (method, route, expectedStatus, body) => {
    const reply =
      method === "GET" ? await getJson(`${API}${route}`) : await postJson(`${API}${route}`, body);
    expect(reply.status).not.toBe(NOT_FOUND);
    expect(reply.status).toBe(expectedStatus);
  });

  it("runs the JavaScript controller behind /runJs and /batchRunJs", async () => {
    expect((await postJson(`${API}/runJs`, { jsCode: "return 7" })).json()).toEqual({ result: 7 });
    expect((await postJson(`${API}/batchRunJs`, { requests: [{ jsCode: "return 1" }] })).json()).toEqual({
      results: [{ result: 1 }],
    });
  });

  it("answers plugin not found from /validatePluginDataSourceConfig", async () => {
    const reply = await postJson(`${API}/validatePluginDataSourceConfig`, { pluginName: "nope" });
    expect(reply.json()).toEqual({ message: "plugin not found: nope" });
  });

  it.each([
    ["GET", "/npm/registry/lodash"],
    ["GET", "/npm/package/lodash/1.0.0/index.js"],
  ])("%s %s is not routed (the temporary test routes stay commented out)", async (method, route) => {
    const reply = await call(method, `${API}${route}`);
    expect(reply.status).toBe(NOT_FOUND);
  });

  it("does not cache the uncached routes: runPluginQuery runs the service on every call", async () => {
    // observed through the real service refusing the unknown plugin both times with the same status
    const body = { pluginName: "uncached-route" };
    const first = await postJson(`${API}/runPluginQuery`, body);
    const second = await postJson(`${API}/runPluginQuery`, body);
    expect(first.status).toBe(BAD_REQUEST);
    expect(second.status).toBe(BAD_REQUEST);
    expect(second.json()).toEqual({ message: "plugin not found: uncached-route" });
  });
});

describe("B43: /runJs user code and the host realm", () => {
  // Each row is user code that evaluates `typeof process` through one route that used to lead out of the sandbox.
  // "object" would mean the host process object was reached; the code runs in its own isolate, so it sees "undefined".
  // Not a row: a dynamic import() also reaches the host in plain Node, but jest's module
  // runtime rejects import() without --experimental-vm-modules, so it cannot be pinned here.
  const ESCAPE_ROUTES: [string, string][] = [
    ["a function literal's constructor", "return (()=>0).constructor('return typeof process')()"],
    ["the constructor of a caught host error", "try { null.f(); } catch (e) { return e.constructor.constructor('return typeof process')(); }"],
    ["lodash _.template", "return _.template('<%= typeof process %>')()"],
  ];
  test.each(ESCAPE_ROUTES)("B43: user code does not reach the host process through %s", async (_route, jsCode) => {
    const reply = await postJson(`${API}/runJs`, { jsCode });
    const seenByCode = reply.status === STATUS_OK ? reply.json().result : undefined;
    expect(seenByCode).not.toBe("object");
  });
});

describe("request size limit of the evaluation routes", () => {
  // `pad` fills the body to the wanted size; the JSON overhead of the other keys is well under BODY_MARGIN_BYTES
  const sizedBody = (key: "context" | "pluginName", bytes: number) =>
    JSON.stringify(key === "context" ? { jsCode: "return pad.length", context: { pad: "x".repeat(bytes) } } : { pluginName: "x".repeat(bytes) });

  it("answers /runJs with 200 for a body just below 5 MiB", async () => {
    const reply = await call("POST", `${API}/runJs`, { headers: JSON_HEADERS, body: sizedBody("context", RUN_JS_LIMIT_BYTES - BODY_MARGIN_BYTES) });
    expect(reply.status).toBe(STATUS_OK);
    expect(reply.json()).toEqual({ result: RUN_JS_LIMIT_BYTES - BODY_MARGIN_BYTES });
  });

  it("answers /runJs with 413 for a body above 5 MiB", async () => {
    const reply = await call("POST", `${API}/runJs`, { headers: JSON_HEADERS, body: sizedBody("context", RUN_JS_LIMIT_BYTES + BODY_MARGIN_BYTES) });
    expect(reply.status).toBe(PAYLOAD_TOO_LARGE);
  });

  it("answers /batchRunJs with 200 below 5 MiB and 413 above", async () => {
    const batch = (bytes: number) => JSON.stringify({ requests: [{ jsCode: "return pad.length", context: { pad: "x".repeat(bytes) } }] });
    const below = await call("POST", `${API}/batchRunJs`, { headers: JSON_HEADERS, body: batch(RUN_JS_LIMIT_BYTES - BODY_MARGIN_BYTES) });
    expect(below.status).toBe(STATUS_OK);
    expect(below.json()).toEqual({ results: [{ result: RUN_JS_LIMIT_BYTES - BODY_MARGIN_BYTES }] });
    const above = await call("POST", `${API}/batchRunJs`, { headers: JSON_HEADERS, body: batch(RUN_JS_LIMIT_BYTES + BODY_MARGIN_BYTES) });
    expect(above.status).toBe(PAYLOAD_TOO_LARGE);
  });

  it("answers 413 for an encrypted text body above 5 MiB", async () => {
    const reply = await call("POST", `${API}/runJs`, { headers: ENCRYPTED_HEADERS, body: "x".repeat(RUN_JS_LIMIT_BYTES + BODY_MARGIN_BYTES) });
    expect(reply.status).toBe(PAYLOAD_TOO_LARGE);
  });

  it("answers 413 for a form body above 5 MiB", async () => {
    const reply = await call("POST", `${API}/runJs`, {
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: `jsCode=${"x".repeat(RUN_JS_LIMIT_BYTES + BODY_MARGIN_BYTES)}`,
    });
    expect(reply.status).toBe(PAYLOAD_TOO_LARGE);
  });

  it("leaves the other routes on the global limit: a body above 5 MiB reaches /runPluginQuery", async () => {
    const reply = await call("POST", `${API}/runPluginQuery`, { headers: JSON_HEADERS, body: sizedBody("pluginName", RUN_JS_LIMIT_BYTES + BODY_MARGIN_BYTES) });
    expect(reply.status).toBe(BAD_REQUEST);
  });
});
