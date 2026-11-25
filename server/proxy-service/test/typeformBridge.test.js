// End-to-end test of the Typeform proxy route of build/server.js: the hocuspocus URL injected
// into the proxied page must be the one the browser can reach (run `yarn build` first,
// `yarn test` does both).
//
// Runs the built server as a child process against a local upstream page. Without
// LOWCODER_API_KEY_SECRET the proxy accepts any non-empty token (src/auth.ts), so no JWT is needed.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { LOOPBACK, STATUS_OK, get, startProxy, failureMessage } = require("./helpers/proxyProcess");

const PROXY_TOKEN = "e2e-test-token";

const UPSTREAM_HTML = "<html><head><title>form</title></head><body>form</body></html>";

const BROWSER_HOST = "lowcoder.example.com:3000";
const FORWARDED_HOST = "edge.example.com";
const PUBLIC_HOCUSPOCUS_URL = "wss://collab.example.com/hocuspocus";

function injectedHocuspocusConfig(html) {
  const attribute = /data-lowcoder-hocuspocus-url="([^"]*)"/.exec(html);
  const script = /window\.__LOWCODER_HOCUSPOCUS__=(\{[^<]*\});/.exec(html);
  assert.ok(attribute, `no data-lowcoder-hocuspocus-url attribute in:\n${html}`);
  assert.ok(script, `no window.__LOWCODER_HOCUSPOCUS__ config in:\n${html}`);
  return { attributeUrl: attribute[1], config: JSON.parse(script[1]) };
}

let upstream;
let upstreamUrl;

before(async () => {
  upstream = http.createServer((_req, res) => {
    res.writeHead(STATUS_OK, { "Content-Type": "text/html; charset=utf-8" });
    res.end(UPSTREAM_HTML);
  });
  await new Promise((resolve) => upstream.listen(0, LOOPBACK, resolve));
  upstreamUrl = `http://${LOOPBACK}:${upstream.address().port}/`;
});

after(() => new Promise((resolve) => upstream.close(resolve)));

async function proxiedPage(proxyEnv, headers) {
  const proxy = await startProxy(proxyEnv);
  try {
    const query = new URLSearchParams({ target: upstreamUrl, token: PROXY_TOKEN, roomId: "room-1" });
    const res = await get(proxy.port, `/proxy/typeform?${query}`, headers);
    console.log(`  GET /proxy/typeform (headers ${JSON.stringify(headers)}) -> ${res.status}`);
    assert.equal(res.status, STATUS_OK, failureMessage(res, proxy));
    const injected = injectedHocuspocusConfig(res.body);
    console.log(`  injected: ${JSON.stringify(injected)}`);
    return injected;
  } finally {
    proxy.stop();
  }
}

test("default localhost URL is rewritten to the host the browser used", async () => {
  const injected = await proxiedPage({}, { Host: BROWSER_HOST });
  assert.equal(injected.attributeUrl, "ws://lowcoder.example.com:3006");
  assert.equal(injected.config.url, "ws://lowcoder.example.com:3006");
  assert.equal(injected.config.token, undefined);
});

test("X-Forwarded-Host wins over Host", async () => {
  const injected = await proxiedPage({}, { Host: BROWSER_HOST, "X-Forwarded-Host": FORWARDED_HOST });
  assert.equal(injected.config.url, "ws://edge.example.com:3006");
});

test("a public LOWCODER_HOCUSPOCUS_URL and the secret are injected unchanged", async () => {
  const injected = await proxiedPage(
    { LOWCODER_HOCUSPOCUS_URL: PUBLIC_HOCUSPOCUS_URL, LOWCODER_HOCUSPOCUS_SECRET: "e2e-secret" },
    { Host: BROWSER_HOST }
  );
  assert.equal(injected.attributeUrl, PUBLIC_HOCUSPOCUS_URL);
  assert.equal(injected.config.url, PUBLIC_HOCUSPOCUS_URL);
  assert.equal(injected.config.token, "e2e-secret");
});
