// Unit tests of build/auth.js (run `yarn build` first, `yarn test` does both): proxy token
// signing and verification, bearer parsing and participant identity resolution.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const jwt = require("jsonwebtoken");
const { startUpstream, STATUS_OK } = require("./helpers/proxyProcess");

const MODULE_PATH = path.join(__dirname, "..", "build", "auth.js");

const DEV_SECRET = "dev-proxy-secret";
const API_KEY_SECRET = "unit-test-api-key-secret";
const OTHER_API_KEY_SECRET = "another-api-key-secret";
const TYPEFORM_SCOPE = "typeform-proxy";
const WEBSITE_SCOPE = "website-proxy";
const STATUS_UNAUTHORIZED = 401;
const GUEST_UUID_PATTERN = /^guest-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

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

// Prints actual and expected before asserting
function check(description, actual, expected) {
  console.log(`  ${description}: actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`);
  assert.deepEqual(actual, expected, description);
}

const withoutSecret = () => loadModule({ LOWCODER_API_KEY_SECRET: undefined });
const withSecret = (secret = API_KEY_SECRET) => loadModule({ LOWCODER_API_KEY_SECRET: secret });
const signingSecret = (secret) => Buffer.from(secret).toString("base64");
const fakeRequest = (headers = {}) => ({ headers });

test("auth: no secret accepts any non-empty token", () => {
  const auth = withoutSecret();
  check("verifyProxyToken('x')", auth.verifyProxyToken("x"), true);
  check("verifyProxyToken('x', scope)", auth.verifyProxyToken("x", TYPEFORM_SCOPE), true);
});

test("auth: no secret rejects an empty or missing token", () => {
  const auth = withoutSecret();
  check("empty", auth.verifyProxyToken(""), false);
  check("undefined", auth.verifyProxyToken(undefined), false);
  check("null", auth.verifyProxyToken(null), false);
});

test("auth: no secret signs with dev-proxy-secret", () => {
  const auth = withoutSecret();
  check("getSigningSecret", auth.getSigningSecret(), null);
  const token = auth.createProxyToken("u1", "room-1", "driver");
  const payload = jwt.verify(token, DEV_SECRET);
  check("payload", { userId: payload.userId, roomId: payload.roomId, role: payload.role, scope: payload.scope }, {
    userId: "u1",
    roomId: "room-1",
    role: "driver",
    scope: TYPEFORM_SCOPE,
  });
});

test("auth: secret key is base64 of LOWCODER_API_KEY_SECRET", () => {
  check("getSigningSecret", withSecret().getSigningSecret(), signingSecret(API_KEY_SECRET));
});

test("auth: secret accepts a token of the expected scope", () => {
  const auth = withSecret();
  const token = auth.createProxyToken("u1", "room-1", "driver", WEBSITE_SCOPE);
  check("expected scope", auth.verifyProxyToken(token, WEBSITE_SCOPE), true);
  check("no scope required", auth.verifyProxyToken(token), true);
});

test("auth: secret rejects a token of another scope", () => {
  const auth = withSecret();
  const token = auth.createProxyToken("u1", "room-1", "driver", WEBSITE_SCOPE);
  check("other scope", auth.verifyProxyToken(token, TYPEFORM_SCOPE), false);
});

test("auth: secret rejects a tampered token", () => {
  const auth = withSecret();
  const [header, payload, signature] = auth.createProxyToken("u1", "room-1", "driver").split(".");
  const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  const forged = Buffer.from(JSON.stringify({ ...claims, userId: "admin" })).toString("base64url");
  check("tampered payload", auth.verifyProxyToken(`${header}.${forged}.${signature}`, TYPEFORM_SCOPE), false);
  check("garbage", auth.verifyProxyToken("garbage", TYPEFORM_SCOPE), false);
});

test("auth: secret rejects an expired token", () => {
  const auth = withSecret();
  const expired = jwt.sign({ scope: TYPEFORM_SCOPE }, signingSecret(API_KEY_SECRET), {
    algorithm: "HS256",
    expiresIn: -60,
  });
  check("expired", auth.verifyProxyToken(expired, TYPEFORM_SCOPE), false);
});

test("auth: secret rejects a token signed with another secret", () => {
  const token = withSecret(OTHER_API_KEY_SECRET).createProxyToken("u1", "room-1", "driver");
  check("other secret", withSecret().verifyProxyToken(token, TYPEFORM_SCOPE), false);
});

test("auth: getBearerToken accepts only Bearer", () => {
  const auth = withoutSecret();
  check("Bearer x", auth.getBearerToken("Bearer x"), "x");
  check("missing", auth.getBearerToken(undefined), null);
  check("lower-case bearer", auth.getBearerToken("bearer x"), null);
  check("Basic", auth.getBearerToken("Basic x"), null);
});

test("auth: participant id prefers editorId over guestId", async () => {
  const auth = withoutSecret();
  check("editorId wins", await auth.resolveParticipantId(fakeRequest(), { editorId: " e1 ", guestId: "g1" }), "e1");
  check("guestId", await auth.resolveParticipantId(fakeRequest(), { guestId: " g1 " }), "g1");
});

test("auth: participant id comes from api-service users/me", async () => {
  const seen = [];
  const apiService = await startUpstream((req, res) => {
    seen.push({ url: req.url, cookie: req.headers.cookie });
    res.writeHead(STATUS_OK, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ data: { id: " u1 " } }));
  });
  try {
    const auth = loadModule({ LOWCODER_API_KEY_SECRET: undefined, LOWCODER_API_SERVICE_URL: `${apiService.url}/` });
    const id = await auth.resolveParticipantId(fakeRequest({ cookie: "LOWCODER_CE_SELFHOST_TOKEN=abc" }), {
      roomId: "room-1",
    });
    check("participant id", id, "u1");
    check("request seen by api-service", seen, [{ url: "/api/users/me", cookie: "LOWCODER_CE_SELFHOST_TOKEN=abc" }]);
  } finally {
    await apiService.close();
  }
});

test("auth: participant id falls back to guest-room-role", async () => {
  for (const [label, status, body] of [
    ["api-service answers 401", STATUS_UNAUTHORIZED, "{}"],
    ["api-service answers OK without id", STATUS_OK, JSON.stringify({ data: {} })],
  ]) {
    const apiService = await startUpstream((_req, res) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(body);
    });
    try {
      const auth = loadModule({ LOWCODER_API_KEY_SECRET: undefined, LOWCODER_API_SERVICE_URL: apiService.url });
      const req = fakeRequest({ cookie: "sid=1" });
      check(`${label}, default role`, await auth.resolveParticipantId(req, { roomId: "room-1" }), "guest-room-1-driver");
      check(`${label}, follower`, await auth.resolveParticipantId(req, { roomId: "room-1", role: "follower" }), "guest-room-1-follower");
    } finally {
      await apiService.close();
    }
  }
});

test("auth: participant id is guest-uuid without a room", async () => {
  const id = await withoutSecret().resolveParticipantId(fakeRequest(), {});
  console.log(`  participant id: ${id}`);
  assert.match(id, GUEST_UUID_PATTERN);
});
