const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  createMarketplaceRenderHandler,
  staticDsl,
  capturePayload,
  allowCaptureRequest,
  configuredOrigin,
} = require("../src/services/marketplacePreview");
const appId = "6776dd3fcdcc1d59c83f8383";
const view = {
  applicationInfoView: { applicationId: appId, applicationType: 1, name: "Example" },
  applicationDSL: {
    ui: { text: "Demo" },
    queries: [{ secret: "must not render" }],
    preload: { js: "fetch()" },
  },
  orgCommonSettings: { themeList: [], preloadJavaScript: "private" },
};
function response() {
  return {
    code: 200,
    headers: {},
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(code) {
      this.code = code;
      return this;
    },
    set(k, v) {
      this.headers[k] = v;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    type(value) {
      this.contentType = value;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    },
  };
}
const { createHmac } = require("node:crypto");
const secret = "test-worker-secret";
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
function signed(body = view, timestamp = Date.now()) {
  const payload = JSON.stringify(body);
  return { timestamp, payload, signature: createHmac("sha256", secret).update(`${timestamp}\n${payload}`).digest("hex") };
}
async function request(handler, body = signed()) {
  const res = response();
  await handler({ body }, res);
  return res;
}

test("only authenticated internal worker requests can render, with bounded timestamps and payloads", async () => {
  let renders = 0;
  const handler = createMarketplaceRenderHandler({ secret, capture: async () => { renders++; return jpeg; } });
  for (const body of [{}, { ...signed(), signature: "0".repeat(64) }, signed(view, Date.now() - 120000),
    { ...signed(), payload: "tampered" }, { ...signed(), timestamp: Infinity }]) {
    assert.equal((await request(handler, body)).code, 401);
  }
  assert.equal(renders, 0);
  assert.equal((await request(handler)).code, 200);
  assert.equal(renders, 1);
  assert.equal((await request(createMarketplaceRenderHandler({ secret: "", capture: async () => jpeg }))).code, 503);
  assert.throws(() => configuredOrigin("file:///etc/passwd"));
  assert.throws(() => configuredOrigin("https://user:pass@host.test"));
});
test("removes executable queries/preload/events and private org settings from capture payload", () => {
  const payload = capturePayload(view);
  assert.deepEqual(payload.applicationDSL.queries, []);
  assert.deepEqual(payload.applicationDSL.preload, {});
  assert.deepEqual(payload.orgCommonSettings, { themeList: [] });
  assert.equal(payload.applicationDSL.ui.text, "Demo");
  assert.deepEqual(staticDsl({ children: [{ events: [{ action: "write" }], label: "Keep me" }] }), {
    children: [{ events: [], label: "Keep me" }],
  });
  assert.equal(view.applicationDSL.queries.length, 1);
  assert.deepEqual(
    staticDsl({
      preload: { js: "fetch()", css: ".app { color: red }", globalCSS: "body { margin: 0 }" },
    }),
    {
      preload: { css: ".app { color: red }", globalCSS: "body { margin: 0 }" },
    },
  );
});
test("capture network only permits renderer assets; blocks APIs, sockets, redirects and third-party requests", () => {
  const origin = "http://frontend:3000";
  assert.equal(allowCaptureRequest(origin + "/static/main-abc.js", "GET", "script", origin), true);
  assert.equal(
    allowCaptureRequest(
      origin + "/api/npm/package/none/lowcoder-comps@latest/chart.js",
      "GET",
      "script",
      origin,
    ),
    true,
  );
  assert.equal(
    allowCaptureRequest(origin + "/marketplace-preview.html", "GET", "document", origin),
    true,
  );
  for (const [url, method, type] of [
    [origin + "/api/v1/query", "POST", "fetch"],
    [origin + "/api/delete", "GET", "image"],
    ["http://169.254.169.254/latest/meta-data", "GET", "image"],
    ["https://external.test/img.png", "GET", "image"],
    [origin + "/apps/private", "GET", "document"],
    [origin + "/static/main.js", "GET", "fetch"],
    [origin + "/api/npm/package/none/untrusted@latest/index.js", "GET", "script"],
    [origin + "/api/npm/package/private-app/lowcoder-comps@latest/index.js", "GET", "script"],
  ])
    assert.equal(allowCaptureRequest(url, method, type, origin), false);
});
test("renderer has no in-memory queue and bounds concurrency; durable owner retries busy jobs", async () => {
  let renders = 0;
  const pending = [];
  const handler = createMarketplaceRenderHandler({ secret, capture: () => {
    renders++;
    return new Promise(resolve => pending.push(resolve));
  } });
  const first = request(handler), second = request(handler);
  assert.equal((await request(handler)).code, 429);
  assert.equal(renders, 2);
  pending.splice(0).forEach(resolve => resolve(jpeg));
  assert.equal((await first).code, 200);
  assert.equal((await second).code, 200);
  const third = request(handler);
  pending.shift()(jpeg);
  assert.equal((await third).code, 200);
});
test("invalid capture output is never delivered as an image", async () => {
  const handler = createMarketplaceRenderHandler({ secret, capture: async () => Buffer.from("not an image") });
  assert.equal((await request(handler)).code, 503);
});
