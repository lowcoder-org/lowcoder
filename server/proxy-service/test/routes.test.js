// HTTP behaviour of the three proxy routes of build/server.js (run `yarn build` first, `yarn test`
// does both): ready message, bridge scripts, 405/401 handling, the typeform relay against a local
// upstream (header and URL rewriting, token scope) and the rate limit.
//
// Local mode spawns the servers; with PROXY_TEST_URL=http://host:port the tests that only need
// the target run against it and the ones that need their own configuration are skipped.
//
// Not covered: the upstream relay of /proxy/google-forms and /proxy/website (their targets must
// be public https hosts, unreachable from a local stub).
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { connect, needs, request, failureMessage, startUpstream, STATUS_OK, READY_MESSAGE } = require("./helpers/proxyProcess");

const STATUS_FOUND = 302;
const STATUS_BAD_REQUEST = 400;
const STATUS_UNAUTHORIZED = 401;
const STATUS_METHOD_NOT_ALLOWED = 405;
const STATUS_TOO_MANY_REQUESTS = 429;
const STATUS_BAD_GATEWAY = 502;
const JAVASCRIPT_TYPE = "application/javascript; charset=utf-8";
const API_KEY_SECRET = "t1-routes-secret";
const RATE_LIMIT = 2;
const ROOM_ID = "room-1";
const ROUTES = ["typeform", "google-forms", "website"];
const BRIDGES = ["typeform-bridge.js", "google-forms-bridge.js", "website-bridge.js"];
const GOOGLE_PUBLISHED_URL = "https://docs.google.com/forms/d/e/1FAIpQLSroutes/viewform";
const WEBSITE_URL = "https://example.com/";
const TYPEFORM_URL = "https://form.typeform.com/to/abc123";
const GOOGLE_HTTP_TARGET = "http://docs.google.com/forms/x";
const WEBSITE_LOOPBACK_TARGET = "http://127.0.0.1/";

const SESSION_BODY = {
  typeform: { typeformUrl: TYPEFORM_URL, roomId: ROOM_ID, editorId: "e1" },
  "google-forms": { googleFormUrl: GOOGLE_PUBLISHED_URL, roomId: ROOM_ID, editorId: "e1" },
  website: { websiteUrl: WEBSITE_URL, roomId: ROOM_ID, editorId: "e1" },
};

let upstream;
let plain; // no secret, allowed typeform host 127.0.0.1 (or the external target)
let secured; // LOWCODER_API_KEY_SECRET set
let limited; // LOWCODER_PROXY_RATE_LIMIT=2

before(async () => {
  upstream = await startUpstream((req, res) => {
    const self = `http://${req.headers.host}`;
    if (req.url.startsWith("/json")) {
      res.writeHead(STATUS_OK, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ next: `${self}/page` }));
    } else if (req.url.startsWith("/redirect")) {
      res.writeHead(STATUS_FOUND, { Location: `${self}/page` });
      res.end();
    } else {
      res.writeHead(STATUS_OK, {
        "Content-Type": "text/html",
        "X-Frame-Options": "DENY",
        "Set-Cookie": "sid=1; Domain=up.example; Path=/; SameSite=None; Secure",
      });
      res.end("<html><head></head><body>upstream-page</body></html>");
    }
  });
  plain = await connect();
  if (!plain.external) {
    secured = await connect({ LOWCODER_API_KEY_SECRET: API_KEY_SECRET });
    limited = await connect({ LOWCODER_PROXY_RATE_LIMIT: String(RATE_LIMIT) });
  }
});

after(async () => {
  for (const handle of [plain, secured, limited]) handle?.stop();
  await upstream.close();
});

const query = (params) => `?${new URLSearchParams(params)}`;

async function sessionToken(target, route) {
  const res = await request(target.baseUrl, `/proxy/${route}/session`, { method: "POST", body: SESSION_BODY[route] });
  assert.equal(res.status, STATUS_OK, failureMessage(res, target));
  return JSON.parse(res.body).data.token;
}

async function get(target, path, headers) {
  const res = await request(target.baseUrl, path, { headers });
  console.log(`  GET ${path.slice(0, 90)} -> ${res.status} ${res.body.slice(0, 100).replace(/\s+/g, " ")}`);
  return res;
}

test("routes: GET / answers 200 with the ready message", async () => {
  const res = await get(plain, "/");
  assert.equal(res.status, STATUS_OK, failureMessage(res, plain));
  assert.equal(JSON.parse(res.body).message, READY_MESSAGE);
});

test("routes: the three bridge scripts are served as JavaScript", async () => {
  for (const bridge of BRIDGES) {
    const res = await get(plain, `/proxy/${bridge}`);
    assert.equal(res.status, STATUS_OK, failureMessage(res, plain));
    assert.equal(res.headers["content-type"], JAVASCRIPT_TYPE, bridge);
    assert.ok(res.body.length > 1000, `${bridge} is ${res.body.length} characters long`);
  }
});

test("routes: GET on the session paths is 405", async () => {
  for (const route of ROUTES) {
    const res = await get(plain, `/proxy/${route}/session`);
    assert.equal(res.status, STATUS_METHOD_NOT_ALLOWED, failureMessage(res, plain));
    assert.match(JSON.parse(res.body).message, new RegExp(`^Use POST on /proxy/${route}/session`));
  }
});

test("routes: the three proxy routes answer 401 without a token", async () => {
  for (const route of ROUTES) {
    const res = await get(plain, `/proxy/${route}${query({ target: WEBSITE_URL })}`);
    assert.equal(res.status, STATUS_UNAUTHORIZED, failureMessage(res, plain));
    assert.equal(JSON.parse(res.body).message, "Missing or invalid proxy token");
  }
});

test("google-forms route: http target with a session token is 502", async () => {
  const token = await sessionToken(plain, "google-forms");
  const res = await get(plain, `/proxy/google-forms${query({ target: GOOGLE_HTTP_TARGET, token })}`);
  assert.equal(res.status, STATUS_BAD_GATEWAY, failureMessage(res, plain));
  assert.equal(JSON.parse(res.body).message, "Google Forms proxy request failed");
});

test("website route: loopback target with a session token is 400", async () => {
  const token = await sessionToken(plain, "website");
  const res = await get(plain, `/proxy/website${query({ target: WEBSITE_LOOPBACK_TARGET, token })}`);
  assert.equal(res.status, STATUS_BAD_REQUEST, failureMessage(res, plain));
  assert.equal(JSON.parse(res.body).message, `Website URL is not allowed: ${WEBSITE_LOOPBACK_TARGET}`);
});

test("typeform route: session token relays the local upstream", { skip: needs("LOWCODER_API_KEY_SECRET") }, async () => {
  const token = await sessionToken(secured, "typeform");
  const res = await get(secured, `/proxy/typeform${query({ target: `${upstream.url}/page`, token, roomId: ROOM_ID })}`);
  assert.equal(res.status, STATUS_OK, failureMessage(res, secured));
  assert.ok(res.body.includes("<body>upstream-page</body>"), failureMessage(res, secured));
  assert.ok(res.body.includes("window.__LOWCODER_HOCUSPOCUS__"), "bridge config is injected");
});

test("typeform route: Bearer token is accepted", { skip: needs("LOWCODER_API_KEY_SECRET") }, async () => {
  const token = await sessionToken(secured, "typeform");
  const res = await get(secured, `/proxy/typeform${query({ target: `${upstream.url}/page` })}`, { Authorization: `Bearer ${token}` });
  assert.equal(res.status, STATUS_OK, failureMessage(res, secured));
});

test("typeform route: website-proxy token is 401 with a secret", { skip: needs("LOWCODER_API_KEY_SECRET") }, async () => {
  const token = await sessionToken(secured, "website");
  const res = await get(secured, `/proxy/typeform${query({ target: `${upstream.url}/page`, token })}`);
  assert.equal(res.status, STATUS_UNAUTHORIZED, failureMessage(res, secured));
});

test("typeform route: garbage token is 401 with a secret", { skip: needs("LOWCODER_API_KEY_SECRET") }, async () => {
  const res = await get(secured, `/proxy/typeform${query({ target: `${upstream.url}/page`, token: "garbage" })}`);
  assert.equal(res.status, STATUS_UNAUTHORIZED, failureMessage(res, secured));
});

test("typeform route: upstream headers are rewritten", { skip: needs("LOWCODER_PROXY_ALLOWED_HOSTS") }, async () => {
  const res = await get(plain, `/proxy/typeform${query({ target: `${upstream.url}/page`, token: "any" })}`);
  assert.equal(res.status, STATUS_OK, failureMessage(res, plain));
  assert.equal(res.headers["x-frame-options"], undefined, "X-Frame-Options is dropped");
  assert.equal(res.headers["content-security-policy"], "frame-ancestors 'self';");
  assert.deepEqual(res.headers["set-cookie"], ["sid=1; Path=/proxy/typeform; SameSite=Lax; Secure"]);
});

test("typeform route: Location and JSON body URLs are proxied", { skip: needs("LOWCODER_PROXY_ALLOWED_HOSTS") }, async () => {
  const token = "any-token";
  const expected = `${upstream.url}/page`;
  const redirect = await get(plain, `/proxy/typeform${query({ target: `${upstream.url}/redirect`, token })}`);
  assert.equal(redirect.status, STATUS_FOUND, failureMessage(redirect, plain));
  const location = new URL(redirect.headers.location, "http://proxy.invalid");
  assert.equal(location.pathname, "/proxy/typeform");
  assert.equal(location.searchParams.get("target"), expected);
  assert.equal(location.searchParams.get("token"), token);

  const json = await get(plain, `/proxy/typeform${query({ target: `${upstream.url}/json`, token })}`);
  assert.equal(json.status, STATUS_OK, failureMessage(json, plain));
  const next = new URL(JSON.parse(json.body).next, "http://proxy.invalid");
  assert.equal(next.pathname, "/proxy/typeform");
  assert.equal(next.searchParams.get("target"), expected);
});

test("typeform route: target outside LOWCODER_PROXY_ALLOWED_HOSTS is 502", { skip: needs("LOWCODER_PROXY_ALLOWED_HOSTS") }, async () => {
  // pinned as today: a rejected host surfaces as 502, not 4xx
  const res = await get(plain, `/proxy/typeform${query({ target: WEBSITE_URL, token: "any" })}`);
  assert.equal(res.status, STATUS_BAD_GATEWAY, failureMessage(res, plain));
  assert.equal(JSON.parse(res.body).message, "Typeform proxy request failed");
});

test("rate limit: third request is 429 on all three routes", { skip: needs("LOWCODER_PROXY_RATE_LIMIT") }, async () => {
  const cases = [
    ["typeform", { target: `${upstream.url}/page` }, STATUS_OK],
    ["google-forms", { target: GOOGLE_HTTP_TARGET }, STATUS_BAD_GATEWAY],
    ["website", { target: WEBSITE_LOOPBACK_TARGET }, STATUS_BAD_REQUEST],
  ];
  for (const [route, params, status] of cases) {
    const token = await sessionToken(limited, route);
    for (let attempt = 1; attempt <= RATE_LIMIT; attempt += 1) {
      const res = await get(limited, `/proxy/${route}${query({ ...params, token })}`);
      assert.equal(res.status, status, `${route} request ${attempt}: ${failureMessage(res, limited)}`);
    }
    const third = await get(limited, `/proxy/${route}${query({ ...params, token })}`);
    assert.equal(third.status, STATUS_TOO_MANY_REQUESTS, `${route}: ${failureMessage(third, limited)}`);
    assert.equal(JSON.parse(third.body).message, "Proxy rate limit exceeded");
  }
});
