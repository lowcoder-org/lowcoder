// Tests of client/packages/lowcoder/hocuspocus-server.js with @hocuspocus/server 4.3.0, the version
// both images install: health and root answers, Yjs sync between providers, token checks, start
// failure. The server runs from a temporary copy of the image layout (helpers/hocuspocusProcess.mjs).
//
// External mode: with HOCUSPOCUS_TEST_URL=ws://host:port (and HOCUSPOCUS_TEST_SECRET when that
// server has HOCUSPOCUS_SECRET set) the tests that only need a running server use it; the ones that
// need control of its environment, its port or its start are skipped.
import { after, test } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";
import WebSocket from "ws";
import {
  EXIT_FAILED,
  EXIT_OK,
  LOOPBACK,
  STATUS_OK,
  cleanup,
  freePort,
  httpGet,
  runClient,
  spawnUntilExit,
  startServer,
} from "./helpers/hocuspocusProcess.mjs";

const SECRET = "t3-secret";
const EXTERNAL_URL = (process.env.HOCUSPOCUS_TEST_URL ?? "").trim();
const EXTERNAL_SECRET = process.env.HOCUSPOCUS_TEST_SECRET ?? "";
const EXTERNAL = EXTERNAL_URL !== "";
// The server admits only signal_<appId> rooms (checked against the api-service) and the bridge rooms typeform_*,
// googleform_* and website_*, which the shared secret alone gates; these tests have no api-service, so they use a bridge room
const BRIDGE_ROOM_PREFIX = "website_";
const DOCUMENT_A = `${BRIDGE_ROOM_PREFIX}t3-document-a`;
const DOCUMENT_B = `${BRIDGE_ROOM_PREFIX}t3-document-b`;
const ROOMS_REPORTED = "app-read-check";
const REFUSED_ROOMS = ["t3-document-a", "signal_t3-app", "signal_bad/app", "typeform"];
const WELCOME_TEXT = "Welcome to Hocuspocus!";
const SHARED_MAP = "t3";
const SHARED_KEY = "value";
const SYNC_TIMEOUT_MS = 10000;
const SETTLE_MS = 500;
const SKIP_EXTERNAL = EXTERNAL ? "needs control of the server's environment or port (HOCUSPOCUS_TEST_URL is set)" : false;
const SKIP_NO_SECRET = EXTERNAL && !EXTERNAL_SECRET ? "needs HOCUSPOCUS_TEST_SECRET (HOCUSPOCUS_TEST_URL is set)" : false;

const started = [];
after(() => {
  for (const server of started) server.stop();
  cleanup();
});

// Prints actual and expected before asserting
function check(description, actual, expected) {
  console.log(`  ${description}: actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`);
  assert.deepEqual(actual, expected, description);
}

async function local(env = {}) {
  const server = await startServer(env);
  started.push(server);
  return server;
}

// The server under test: the external one, or a local one with `env`
async function target(env = {}) {
  if (!EXTERNAL) return { ...(await local(env)), external: false };
  const { hostname, port, protocol } = new URL(EXTERNAL_URL);
  const httpPort = port || (protocol === "wss:" ? "443" : "80");
  return { external: true, port: Number(httpPort), host: hostname, url: EXTERNAL_URL, output: () => "(external target: no server output)" };
}

const targetHost = (server) => server.host ?? LOOPBACK;
const targetSecret = (server) => (server.external ? EXTERNAL_SECRET : SECRET);

function message(description, server, extra = "") {
  return `${description}\n${extra}--- server output ---\n${server.output()}`;
}

test("health: GET /health reports ok and the auth state", async () => {
  if (EXTERNAL) {
    const server = await target();
    const res = await httpGet(targetHost(server), server.port, "/health");
    assert.equal(res.status, STATUS_OK, res.body);
    const body = JSON.parse(res.body);
    check("status and auth", { status: body.status, auth: body.auth }, { status: "ok", auth: EXTERNAL_SECRET ? "enabled" : "disabled" });
    return;
  }
  const open = await target();
  check("without a secret", JSON.parse((await httpGet(LOOPBACK, open.port, "/health")).body), {
    status: "ok",
    host: LOOPBACK,
    port: open.port,
    auth: "disabled",
    rooms: ROOMS_REPORTED,
  });
  const secured = await target({ HOCUSPOCUS_SECRET: SECRET });
  check("with a secret", JSON.parse((await httpGet(LOOPBACK, secured.port, "/health")).body), {
    status: "ok",
    host: LOOPBACK,
    port: secured.port,
    auth: "enabled",
    rooms: ROOMS_REPORTED,
  });
});

test("root: GET / names the websocket URL and /health", async () => {
  const server = await target();
  const res = await httpGet(targetHost(server), server.port, "/");
  assert.equal(res.status, STATUS_OK, res.body);
  const body = JSON.parse(res.body);
  if (!EXTERNAL) {
    check("body", body, { name: "lowcoder-hocuspocus", websocket: `ws://${LOOPBACK}:${server.port}`, health: "/health" });
    return;
  }
  // the server echoes its own HOST and PORT, which the test does not control
  const health = JSON.parse((await httpGet(targetHost(server), server.port, "/health")).body);
  check("name and health", { name: body.name, health: body.health }, { name: "lowcoder-hocuspocus", health: "/health" });
  check("websocket", body.websocket, `ws://${health.host}:${health.port}`);
  check("reported port", health.port, server.port);
});

test("root: other paths answer Welcome to Hocuspocus!", async () => {
  const server = await target();
  const res = await httpGet(targetHost(server), server.port, "/anything-else");
  check("status and body", { status: res.status, body: res.body }, { status: STATUS_OK, body: WELCOME_TEXT });
});

test("no secret: sync with an empty and an arbitrary token", { skip: SKIP_EXTERNAL }, async () => {
  const server = await target();
  for (const token of ["", "arbitrary-token"]) {
    const result = await runClient("sync", server.url, token, DOCUMENT_A);
    assert.equal(result.code, EXIT_OK, message(`token "${token}"`, server, `${result.output}\n`));
  }
});

test("no secret: reject mode fails because any token is accepted", { skip: SKIP_EXTERNAL }, async () => {
  const server = await target();
  const result = await runClient("reject", server.url, "arbitrary-token", DOCUMENT_A);
  assert.equal(result.code, EXIT_FAILED, message("reject mode", server, `${result.output}\n`));
  assert.ok(result.output.includes("synced, expected the server to refuse the token"), result.output);
});

test("secret: sync with the secret", { skip: SKIP_NO_SECRET }, async () => {
  const server = await target({ HOCUSPOCUS_SECRET: SECRET });
  const result = await runClient("sync", server.url, targetSecret(server), DOCUMENT_A);
  assert.equal(result.code, EXIT_OK, message("sync with the secret", server, `${result.output}\n`));
});

test("secret: wrong and empty tokens are refused with permission-denied", { skip: SKIP_NO_SECRET }, async () => {
  const server = await target({ HOCUSPOCUS_SECRET: SECRET });
  for (const token of ["wrong", ""]) {
    const result = await runClient("reject", server.url, token, DOCUMENT_A);
    assert.equal(result.code, EXIT_OK, message(`token "${token}"`, server, `${result.output}\n`));
    assert.ok(result.output.includes("authentication failed (permission-denied)"), result.output);
  }
  if (!server.external) {
    const rejected = server.output().split("\n").filter((line) => line.includes(`rejected connection for ${DOCUMENT_A}: invalid token`));
    check("server log lines about rejected connections", rejected.length, 2);
  }
});

// A provider on `url` for `name`; resolves { document, provider } once synced
function openDocument(url, name, token) {
  const document = new Y.Doc();
  return new Promise((resolve, reject) => {
    // a provider that never syncs keeps reconnecting and the test process never exits: destroy it on failure
    let provider;
    const fail = (message) => {
      clearTimeout(timer);
      provider?.destroy();
      reject(new Error(message));
    };
    const timer = setTimeout(() => fail(`${name}: not synced after ${SYNC_TIMEOUT_MS} ms`), SYNC_TIMEOUT_MS);
    provider = new HocuspocusProvider({
      url,
      name,
      document,
      token: token || undefined,
      WebSocketPolyfill: WebSocket,
      onSynced: () => {
        clearTimeout(timer);
        resolve({ document, provider });
      },
      onAuthenticationFailed: ({ reason }) => fail(`${name}: authentication failed (${reason})`),
    });
  });
}

test("documents: a value written in document A is not visible in document B", async () => {
  const server = await target(EXTERNAL ? {} : { HOCUSPOCUS_SECRET: SECRET });
  const token = targetSecret(server);
  const opened = [];
  try {
    const writer = await openDocument(server.url, DOCUMENT_A, token);
    opened.push(writer);
    const sameDocument = await openDocument(server.url, DOCUMENT_A, token);
    opened.push(sameDocument);
    const otherDocument = await openDocument(server.url, DOCUMENT_B, token);
    opened.push(otherDocument);
    const expected = `written-${Date.now()}`;
    const received = new Promise((resolve) => {
      const map = sameDocument.document.getMap(SHARED_MAP);
      map.observe(() => map.get(SHARED_KEY) === expected && resolve());
    });
    writer.document.getMap(SHARED_MAP).set(SHARED_KEY, expected);
    await received; // positive control: the value did travel through the server to document A
    await new Promise((resolve) => setTimeout(resolve, SETTLE_MS));
    check("document A, second client", sameDocument.document.getMap(SHARED_MAP).get(SHARED_KEY), expected);
    check("document B", otherDocument.document.getMap(SHARED_MAP).get(SHARED_KEY), undefined);
  } finally {
    for (const { provider } of opened) provider.destroy();
  }
});

test("rooms: a room that is no bridge room is refused with permission-denied, whatever the token", { skip: SKIP_EXTERNAL }, async () => {
  // signal_ rooms ask the api-service (none runs here, so the check fails closed); any other name is refused outright
  const server = await target({ HOCUSPOCUS_SECRET: SECRET });
  for (const name of REFUSED_ROOMS) {
    const admitted = openDocument(server.url, name, SECRET).then(({ provider }) => {
      provider.destroy(); // a failing run must not leave a connected provider that keeps the process alive
      throw new Error(`${name}: admitted`);
    });
    await assert.rejects(admitted, /authentication failed \(permission-denied\)/, message(`room ${name}`, server));
  }
  const rejected = server.output().split("\n").filter((line) => line.includes("rejected connection for"));
  check("server log lines about rejected connections", rejected.length >= REFUSED_ROOMS.length, true);
});

test("start: a second server on the same port exits non-zero", { skip: SKIP_EXTERNAL }, async () => {
  // No "[hocuspocus] failed to start" line is printed today: the listen error escapes the try
  // block as an unhandled 'error' event (README F7). Only the exit code and EADDRINUSE are pinned.
  const first = await local();
  const second = await spawnUntilExit({ PORT: String(first.port), HOST: LOOPBACK });
  console.log(`  second server: code=${second.code} signal=${second.signal}`);
  assert.equal(second.code, EXIT_FAILED, second.output);
  assert.ok(second.output.includes(`EADDRINUSE: address already in use :::${first.port}`), second.output);
  const health = await httpGet(LOOPBACK, first.port, "/health");
  assert.equal(health.status, STATUS_OK, "the first server still answers");
});

const nonLoopbackAddress = Object.values(os.networkInterfaces())
  .flat()
  .find((entry) => entry && entry.family === "IPv4" && !entry.internal)?.address;

test(
  "todo (F7): HOST=127.0.0.1 must not answer on a non-loopback address",
  {
    todo: true,
    skip: SKIP_EXTERNAL || (nonLoopbackAddress ? false : "this machine has no non-loopback IPv4 address"),
  },
  async () => {
    const server = await local();
    let answered;
    try {
      answered = (await httpGet(nonLoopbackAddress, server.port, "/health")).status;
    } catch (error) {
      answered = `refused (${error.cause?.code ?? error.message})`;
    }
    console.log(`  GET http://${nonLoopbackAddress}:${server.port}/health -> ${answered}`);
    assert.match(String(answered), /^refused/, `HOST=${LOOPBACK} answered on ${nonLoopbackAddress}`);
  }
);
