// Shared helpers of the proxy-service tests (not matched by `test/*.test.js`): spawn the built
// server (build/server.js) on a free port, talk HTTP to it, and build assertion messages that
// carry what the server printed.
//
// External mode: with PROXY_TEST_URL=http://host:port the tests that use `connect()` talk to that
// server instead of spawning one. Tests that need to control the server's environment declare
// `{ skip: needs("<VARIABLE>") }`.
const http = require("node:http");
const net = require("node:net");
const path = require("node:path");
const { spawn } = require("node:child_process");

const SERVER_PATH = path.join(__dirname, "..", "..", "build", "server.js");
const LOOPBACK = "127.0.0.1";
const READY_MESSAGE = "Lowcoder Proxy Service is up and running";
const READY_TIMEOUT_MS = 15000;
const READY_POLL_MS = 100;
const STATUS_OK = 200;
const FAILURE_BODY_CHARS = 500;
const EXTERNAL_URL = (process.env.PROXY_TEST_URL ?? "").trim().replace(/\/$/, "");

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

// One HTTP request; resolves { status, body, headers } (headers as node delivers them: lower-case
// names, set-cookie as an array). Never follows redirects.
function request(baseUrl, requestPath, { method = "GET", headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(requestPath, baseUrl);
    const payload = body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body);
    const sendHeaders = { ...headers };
    if (payload !== undefined) {
      if (typeof body !== "string" && !sendHeaders["Content-Type"]) sendHeaders["Content-Type"] = "application/json";
      sendHeaders["Content-Length"] = Buffer.byteLength(payload);
    }
    const req = http.request(
      { host: url.hostname, port: url.port, path: url.pathname + url.search, method, headers: sendHeaders },
      (res) => {
        let text = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (text += chunk));
        res.on("end", () => resolve({ status: res.statusCode, body: text, headers: res.headers }));
      }
    );
    req.once("error", reject);
    req.end(payload);
  });
}

// `get(port, path, headers)` of the original typeformBridge test, kept for it.
function get(port, requestPath, headers = {}) {
  return request(`http://${LOOPBACK}:${port}`, requestPath, { headers });
}

// Spawns build/server.js with the given environment; resolves { port, baseUrl, stop, output }.
// `output()` returns everything the child printed so far.
async function startProxy(env = {}) {
  const port = await freePort();
  const collected = [];
  const child = spawn(process.execPath, [SERVER_PATH], {
    env: {
      PATH: process.env.PATH,
      PROXY_SERVICE_PORT: String(port),
      LOWCODER_PROXY_ALLOWED_HOSTS: LOOPBACK,
      ...env,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (chunk) => collected.push(String(chunk)));
  child.stderr.on("data", (chunk) => collected.push(String(chunk)));
  const output = () => collected.join("");

  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`proxy exited with ${child.exitCode}:\n${output()}`);
    }
    try {
      const res = await get(port, "/");
      if (res.status === STATUS_OK && res.body.includes(READY_MESSAGE)) {
        return { port, baseUrl: `http://${LOOPBACK}:${port}`, stop: () => child.kill(), output };
      }
    } catch {
      // not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, READY_POLL_MS));
  }
  child.kill();
  throw new Error(`proxy not ready after ${READY_TIMEOUT_MS} ms:\n${output()}`);
}

// A handle on the server under test: the external one when PROXY_TEST_URL is set, else a spawned
// child with `env`.
async function connect(env = {}) {
  if (EXTERNAL_URL) {
    return { external: true, baseUrl: EXTERNAL_URL, stop: () => {}, output: () => "(external target: no server output)" };
  }
  return { external: false, ...(await startProxy(env)) };
}

// `skip` option for a test that needs to control `variable` of the server's environment.
function needs(variable) {
  return EXTERNAL_URL ? `needs control of ${variable} (PROXY_TEST_URL is set)` : false;
}

// Assertion message: status, the first characters of the body and what the server printed.
function failureMessage(res, proxy) {
  return (
    `status ${res.status}, body: ${String(res.body).slice(0, FAILURE_BODY_CHARS)}\n` +
    `--- server output ---\n${proxy.output()}`
  );
}

// A local HTTP server answering with `handler`; resolves { url, close }.
async function startUpstream(handler) {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, LOOPBACK, resolve));
  return {
    url: `http://${LOOPBACK}:${server.address().port}`,
    close: () => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }),
  };
}

module.exports = {
  LOOPBACK,
  STATUS_OK,
  READY_MESSAGE,
  EXTERNAL_URL,
  freePort,
  request,
  get,
  startProxy,
  connect,
  needs,
  failureMessage,
  startUpstream,
};
