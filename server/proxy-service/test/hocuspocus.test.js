// Unit tests of build/hocuspocus.js (run `yarn build` first, `yarn test` does both).
const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const MODULE_PATH = path.join(__dirname, "..", "build", "hocuspocus.js");

const LOCAL_URL = "ws://localhost:3006";
const LOCAL_IP_URL = "ws://127.0.0.1:4100";
const LOCAL_URL_WITHOUT_PORT = "ws://localhost";
const PUBLIC_URL = "wss://collab.example.com/hocuspocus";
// Public URLs that contain a local host name outside their hostname
const PUBLIC_URL_LOCAL_SUBDOMAIN = "wss://localhost.example.com/hocuspocus";
const PUBLIC_URL_LOCAL_IN_PATH = "wss://collab.example.com/127.0.0.1?next=localhost";
const LOCAL_TLS_URL = "wss://localhost:4443";
const UNPARSABLE_URL = "not a url localhost";

// Minimal stand-in for express Request: only get() is used by resolveHocuspocusUrl
function fakeRequest(headers) {
  const normalized = Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value])
  );
  return { get: (name) => normalized[name.toLowerCase()] };
}

// Loads the module with the given environment, so the module-level constants are re-evaluated
function loadModule(env) {
  const saved = {};
  for (const [name, value] of Object.entries(env)) {
    saved[name] = process.env[name];
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
  try {
    delete require.cache[require.resolve(MODULE_PATH)];
    return require(MODULE_PATH);
  } finally {
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

const NO_HOCUSPOCUS_ENV = {
  LOWCODER_HOCUSPOCUS_URL: undefined,
  LOWCODER_HOCUSPOCUS_SECRET: undefined,
  HOCUSPOCUS_SECRET: undefined,
};

function check(description, actual, expected) {
  console.log(`  ${description}: ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
  assert.equal(actual, expected, description);
}

test("HOCUSPOCUS_URL defaults to ws://localhost:3006 and trims LOWCODER_HOCUSPOCUS_URL", () => {
  check("default", loadModule(NO_HOCUSPOCUS_ENV).HOCUSPOCUS_URL, LOCAL_URL);
  check(
    "configured",
    loadModule({ ...NO_HOCUSPOCUS_ENV, LOWCODER_HOCUSPOCUS_URL: `  ${PUBLIC_URL} ` }).HOCUSPOCUS_URL,
    PUBLIC_URL
  );
});

test("HOCUSPOCUS_SECRET prefers LOWCODER_HOCUSPOCUS_SECRET over HOCUSPOCUS_SECRET", () => {
  check("unset", loadModule(NO_HOCUSPOCUS_ENV).HOCUSPOCUS_SECRET, "");
  check(
    "only HOCUSPOCUS_SECRET",
    loadModule({ ...NO_HOCUSPOCUS_ENV, HOCUSPOCUS_SECRET: " plain " }).HOCUSPOCUS_SECRET,
    "plain"
  );
  check(
    "both set",
    loadModule({
      ...NO_HOCUSPOCUS_ENV,
      HOCUSPOCUS_SECRET: "plain",
      LOWCODER_HOCUSPOCUS_SECRET: "lowcoder",
    }).HOCUSPOCUS_SECRET,
    "lowcoder"
  );
});

test("resolveHocuspocusUrl returns a non-local configured URL unchanged", () => {
  const { resolveHocuspocusUrl } = loadModule(NO_HOCUSPOCUS_ENV);
  const req = fakeRequest({ host: "lowcoder.example.com:3000" });
  check("public URL", resolveHocuspocusUrl(req, PUBLIC_URL), PUBLIC_URL);
});

test("resolveHocuspocusUrl decides locality by the hostname, not by a substring", () => {
  const { resolveHocuspocusUrl } = loadModule(NO_HOCUSPOCUS_ENV);
  const req = fakeRequest({ host: "lowcoder.example.com:3000" });
  check("localhost.* subdomain", resolveHocuspocusUrl(req, PUBLIC_URL_LOCAL_SUBDOMAIN), PUBLIC_URL_LOCAL_SUBDOMAIN);
  check("local names in path and query", resolveHocuspocusUrl(req, PUBLIC_URL_LOCAL_IN_PATH), PUBLIC_URL_LOCAL_IN_PATH);
  check("wss://localhost", resolveHocuspocusUrl(req, LOCAL_TLS_URL), "ws://lowcoder.example.com:4443");
});

test("resolveHocuspocusUrl returns an unparsable configured URL unchanged", () => {
  const { resolveHocuspocusUrl } = loadModule(NO_HOCUSPOCUS_ENV);
  const req = fakeRequest({ host: "lowcoder.example.com:3000" });
  check("unparsable", resolveHocuspocusUrl(req, UNPARSABLE_URL), UNPARSABLE_URL);
});

test("resolveHocuspocusUrl replaces a local host with the request Host, keeping the port", () => {
  const { resolveHocuspocusUrl } = loadModule(NO_HOCUSPOCUS_ENV);
  const req = fakeRequest({ host: "lowcoder.example.com:3000" });
  check("localhost", resolveHocuspocusUrl(req, LOCAL_URL), "ws://lowcoder.example.com:3006");
  check("127.0.0.1", resolveHocuspocusUrl(req, LOCAL_IP_URL), "ws://lowcoder.example.com:4100");
  check(
    "no port configured",
    resolveHocuspocusUrl(req, LOCAL_URL_WITHOUT_PORT),
    "ws://lowcoder.example.com:3006"
  );
});

test("resolveHocuspocusUrl prefers the first X-Forwarded-Host entry over Host", () => {
  const { resolveHocuspocusUrl } = loadModule(NO_HOCUSPOCUS_ENV);
  const req = fakeRequest({
    host: "internal:6070",
    "x-forwarded-host": " edge.example.com:443 , internal:3000",
  });
  check("forwarded", resolveHocuspocusUrl(req, LOCAL_URL), "ws://edge.example.com:3006");
});

test("resolveHocuspocusUrl falls back to localhost without host headers", () => {
  const { resolveHocuspocusUrl } = loadModule(NO_HOCUSPOCUS_ENV);
  check("no headers", resolveHocuspocusUrl(fakeRequest({}), LOCAL_URL), LOCAL_URL);
});

test("resolveHocuspocusUrl uses LOWCODER_HOCUSPOCUS_URL when no URL is passed", () => {
  const req = fakeRequest({ host: "lowcoder.example.com" });
  const configured = loadModule({ ...NO_HOCUSPOCUS_ENV, LOWCODER_HOCUSPOCUS_URL: PUBLIC_URL });
  check("public env URL", configured.resolveHocuspocusUrl(req), PUBLIC_URL);
  const local = loadModule(NO_HOCUSPOCUS_ENV);
  check("default env URL", local.resolveHocuspocusUrl(req), "ws://lowcoder.example.com:3006");
});
