// Tests of server.js: the token endpoint, health, CORS and error answers (`npm test`).
//
// server.js starts listening as soon as it is loaded, so every environment gets its own child
// process on a free port. Tokens are decoded with the instance parser of agora-token's
// AccessToken2 (a deep import: if a later agora-token moves it, these tests fail loudly).
//
// External mode: with AGORA_TEST_URL=http://host:port the tests that only need the target run
// against it (token tests also need AGORA_TEST_APP_ID and AGORA_TEST_APP_CERTIFICATE, the
// credentials the target was started with); the tests that need control of its environment or
// would kill it are skipped.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const net = require("node:net");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { AccessToken2, kRtcServiceType, kRtmServiceType } = require("agora-token/src/AccessToken2");

const SERVER_PATH = path.join(__dirname, "..", "server.js");
const LOOPBACK = "127.0.0.1";
const STATUS_OK = 200;
const STATUS_NO_CONTENT = 204;
const STATUS_BAD_REQUEST = 400;
const STATUS_NOT_FOUND = 404;
const READY_TIMEOUT_MS = 15000;
const READY_POLL_MS = 100;
const SERVER_EXIT_TIMEOUT_MS = 5000;
const ISSUE_TS_TOLERANCE_S = 5;
const TOKEN_VERSION_PREFIX = "007";
const DEFAULT_EXPIRY_S = 3600;
const EXPLICIT_EXPIRY_S = 600;
const CACHE_CONTROL = "private, no-cache, no-store, must-revalidate";
const CUSTOM_CORS_ORIGIN = "https://app.example.com";
const WRONG_CERTIFICATE = "00000000000000000000000000000000";
// Dummy credentials as in deploy/docker/all-in-one/smoke-test.sh
const DUMMY_APP_ID = "0123456789abcdef0123456789abcdef";
const DUMMY_APP_CERTIFICATE = "fedcba9876543210fedcba9876543210";

const EXTERNAL_URL = (process.env.AGORA_TEST_URL ?? "").trim().replace(/\/$/, "");
const APP_ID = process.env.AGORA_TEST_APP_ID || DUMMY_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_TEST_APP_CERTIFICATE || DUMMY_APP_CERTIFICATE;
const NO_TOKEN_CREDENTIALS = EXTERNAL_URL && !(process.env.AGORA_TEST_APP_ID && process.env.AGORA_TEST_APP_CERTIFICATE);

const skipExternal = (variable) => (EXTERNAL_URL ? `needs control of ${variable} (AGORA_TEST_URL is set)` : false);
const skipWithoutCredentials = () =>
  NO_TOKEN_CREDENTIALS ? "needs AGORA_TEST_APP_ID and AGORA_TEST_APP_CERTIFICATE (AGORA_TEST_URL is set)" : false;

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, LOOPBACK, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

// One HTTP request; resolves { status, headers, body }
function request(baseUrl, requestPath, { method = "GET", headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(requestPath, baseUrl);
    const req = http.request({ host: url.hostname, port: url.port, path: url.pathname + url.search, method, headers }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.once("error", reject);
    req.end();
  });
}

// Spawns server.js with `env`; resolves { baseUrl, child, stop, output, exited }
async function startServer(env) {
  const port = await freePort();
  const collected = [];
  const childEnv = { PATH: process.env.PATH, SERVER_PORT: String(port), ...env };
  const child = spawn(process.execPath, [SERVER_PATH], { env: childEnv, stdio: ["ignore", "pipe", "pipe"] });
  child.stdout.on("data", (chunk) => collected.push(String(chunk)));
  child.stderr.on("data", (chunk) => collected.push(String(chunk)));
  const output = () => collected.join("");
  const exited = new Promise((resolve) => child.once("exit", (code) => resolve(code)));
  const baseUrl = `http://${LOOPBACK}:${port}`;

  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`server exited with ${child.exitCode}:\n${output()}`);
    try {
      if ((await request(baseUrl, "/ping")).status === STATUS_OK) return { baseUrl, child, stop: () => child.kill(), output, exited };
    } catch {
      // not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, READY_POLL_MS));
  }
  child.kill();
  throw new Error(`server not ready after ${READY_TIMEOUT_MS} ms:\n${output()}`);
}

// The server under test: the external one, or a child with `env` (credentials by default)
async function connect(env = { APP_ID, APP_CERTIFICATE }) {
  if (EXTERNAL_URL) return { baseUrl: EXTERNAL_URL, stop: () => {}, output: () => "(external target: no server output)" };
  return startServer(env);
}

function failure(res, server) {
  return `status ${res.status}, body: ${String(res.body).slice(0, 500)}\n--- server output ---\n${server.output()}`;
}

// Prints actual and expected before asserting
function check(description, actual, expected) {
  console.log(`  ${description}: actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`);
  assert.deepEqual(actual, expected, description);
}

function parseToken(token) {
  const parser = new AccessToken2();
  assert.equal(parser.from_string(token), true, `token does not parse: ${token}`);
  return parser;
}

const decode = (value) => (Buffer.isBuffer(value) ? value.toString() : value);

async function tokens(server, requestPath) {
  const res = await request(server.baseUrl, requestPath);
  assert.equal(res.status, STATUS_OK, failure(res, server));
  const body = JSON.parse(res.body);
  return { res, body };
}

let shared;

before(async () => {
  shared = await connect();
});

after(() => shared?.stop());

test("ping: GET /ping and GET / answer pong", async () => {
  for (const requestPath of ["/ping", "/"]) {
    const res = await request(shared.baseUrl, requestPath);
    assert.equal(res.status, STATUS_OK, failure(res, shared));
    check(`GET ${requestPath}`, JSON.parse(res.body), { message: "pong" });
  }
});

test("cors: Access-Control-Allow-Origin is present on ping and token answers", { skip: skipWithoutCredentials() }, async () => {
  const ping = await request(shared.baseUrl, "/ping");
  assert.ok(ping.headers["access-control-allow-origin"], failure(ping, shared));
  const { res } = await tokens(shared, "/rte/chan-1/publisher/uid/42");
  assert.ok(res.headers["access-control-allow-origin"], failure(res, shared));
});

test("cors: * by default and CORS_ALLOW_ORIGIN when set", { skip: skipExternal("CORS_ALLOW_ORIGIN") }, async () => {
  const defaultServer = await startServer({});
  const customServer = await startServer({ CORS_ALLOW_ORIGIN: CUSTOM_CORS_ORIGIN });
  try {
    check("default", (await request(defaultServer.baseUrl, "/ping")).headers["access-control-allow-origin"], "*");
    check("custom", (await request(customServer.baseUrl, "/ping")).headers["access-control-allow-origin"], CUSTOM_CORS_ORIGIN);
  } finally {
    defaultServer.stop();
    customServer.stop();
  }
});

test("options: OPTIONS /ping is 204 with GET, OPTIONS", async () => {
  const res = await request(shared.baseUrl, "/ping", { method: "OPTIONS" });
  assert.equal(res.status, STATUS_NO_CONTENT, failure(res, shared));
  check("Access-Control-Allow-Methods", res.headers["access-control-allow-methods"], "GET, OPTIONS");
});

test("token: publisher uid token has channel, uid, expiry and privileges", { skip: skipWithoutCredentials() }, async () => {
  const { body } = await tokens(shared, `/rte/chan-1/publisher/uid/42?expiry=${EXPLICIT_EXPIRY_S}`);
  assert.ok(body.rtcToken.startsWith(TOKEN_VERSION_PREFIX), body.rtcToken);
  assert.ok(body.rtmToken.startsWith(TOKEN_VERSION_PREFIX), body.rtmToken);
  const parser = parseToken(body.rtcToken);
  const rtc = parser.getServices(kRtcServiceType)[0];
  check("appId", decode(parser.appId), APP_ID);
  check("expire", parser.expire, EXPLICIT_EXPIRY_S);
  assert.ok(Math.abs(parser.issueTs - Date.now() / 1000) <= ISSUE_TS_TOLERANCE_S, `issueTs ${parser.issueTs}`);
  check("channel", decode(rtc.__channel_name), "chan-1");
  check("uid", decode(rtc.__uid), "42");
  check("privileges", rtc.__privileges, { 1: 0, 2: 0, 3: 0, 4: 0 });
});

test("token: signature verifies with the certificate and fails with another", { skip: skipWithoutCredentials() }, async () => {
  const { body } = await tokens(shared, "/rte/chan-1/publisher/uid/42");
  const parser = parseToken(body.rtcToken);
  check("with the certificate", parser.verifySignature(APP_CERTIFICATE), true);
  check("with another certificate", parser.verifySignature(WRONG_CERTIFICATE), false);
});

test("token: RTM token has user uid and login privilege expiry", { skip: skipWithoutCredentials() }, async () => {
  const { body } = await tokens(shared, `/rte/chan-1/publisher/uid/42?expiry=${EXPLICIT_EXPIRY_S}`);
  const rtm = parseToken(body.rtmToken).getServices(kRtmServiceType)[0];
  check("user", decode(rtm.__user_id), "42");
  check("privileges", rtm.__privileges, { 1: EXPLICIT_EXPIRY_S });
});

test("token: subscriber userAccount token defaults to 3600 s and privilege 1", { skip: skipWithoutCredentials() }, async () => {
  const { body } = await tokens(shared, "/rte/chan-1/subscriber/userAccount/alice");
  const parser = parseToken(body.rtcToken);
  const rtc = parser.getServices(kRtcServiceType)[0];
  check("expire", parser.expire, DEFAULT_EXPIRY_S);
  check("uid", decode(rtc.__uid), "alice");
  check("privileges", rtc.__privileges, { 1: 0 });
});

test("token: answers are not cacheable", { skip: skipWithoutCredentials() }, async () => {
  const { res } = await tokens(shared, "/rte/chan-1/publisher/uid/42");
  check("Cache-Control", res.headers["cache-control"], CACHE_CONTROL);
});

test("errors: missing APP_ID or APP_CERTIFICATE is 400", { skip: skipExternal("APP_ID and APP_CERTIFICATE") }, async () => {
  const server = await startServer({});
  try {
    const res = await request(server.baseUrl, "/rte/chan-1/publisher/uid/42");
    assert.equal(res.status, STATUS_BAD_REQUEST, failure(res, server));
    check("body", JSON.parse(res.body), { status: STATUS_BAD_REQUEST, message: "APP_ID and APP_CERTIFICATE must be set" });
  } finally {
    server.stop();
  }
});

test("errors: short path, unknown path and POST are 404", async () => {
  for (const [method, requestPath] of [
    ["GET", "/rte/chan-1"],
    ["GET", "/nope"],
    ["POST", "/rte/a/b/c/d"],
  ]) {
    const res = await request(shared.baseUrl, requestPath, { method });
    assert.equal(res.status, STATUS_NOT_FOUND, `${method} ${requestPath}: ${failure(res, shared)}`);
    check(`${method} ${requestPath}`, JSON.parse(res.body), { message: "not found" });
  }
});

test("as today (OD-6): non-hex credentials give empty tokens", { skip: skipExternal("APP_ID and APP_CERTIFICATE") }, async () => {
  const server = await startServer({ APP_ID: "my-app", APP_CERTIFICATE: "my-cert" });
  try {
    const { res } = await tokens(server, "/rte/chan-1/publisher/uid/42");
    check("body", JSON.parse(res.body), { rtcToken: "", rtmToken: "" });
  } finally {
    server.stop();
  }
});

test("as today (OD-6): 4-part path builds the RTM token for user undefined", { skip: skipWithoutCredentials() }, async () => {
  const { body } = await tokens(shared, "/rte/chan-1/publisher/uid");
  const rtm = parseToken(body.rtmToken).getServices(kRtmServiceType)[0];
  check("user", decode(rtm.__user_id), "undefined");
});

test("as today (OD-6): expiry=abc gives expire 0", { skip: skipWithoutCredentials() }, async () => {
  const { body } = await tokens(shared, "/rte/chan-1/publisher/uid/42?expiry=abc");
  check("expire", parseToken(body.rtcToken).expire, 0);
});

test("todo (F6): Host header a b must not kill the server", { todo: true, skip: skipExternal("a server of its own") }, async () => {
  const server = await startServer({ APP_ID, APP_CERTIFICATE });
  try {
    await request(server.baseUrl, "/ping", { headers: { Host: "a b" } }).catch((error) => {
      console.log(`  request with Host "a b" failed: ${error.code}`);
    });
    const exitCode = await Promise.race([
      server.exited,
      new Promise((resolve) => setTimeout(() => resolve("running"), SERVER_EXIT_TIMEOUT_MS)),
    ]);
    console.log(`  server after the request: ${exitCode === "running" ? "still running" : `exited with ${exitCode}`}`);
    assert.equal(exitCode, "running", `server died:\n${server.output()}`);
  } finally {
    server.stop();
  }
});
