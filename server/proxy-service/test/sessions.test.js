// Session endpoints of the three proxy routes of build/server.js (run `yarn build` first, `yarn test`
// does both). Session requests carry editorId and no cookie, so api-service is never contacted.
//
// Local mode spawns the server; with PROXY_TEST_URL=http://host:port the tests talk to that server
// and the one test that needs its own configuration is skipped.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { connect, needs, request, failureMessage, STATUS_OK } = require("./helpers/proxyProcess");

const STATUS_BAD_REQUEST = 400;
const GOOGLE_PUBLISHED_URL = "https://docs.google.com/forms/d/e/1FAIpQLSsessions/viewform?usp=sf_link";
const GOOGLE_CLEANED_URL = "https://docs.google.com/forms/d/e/1FAIpQLSsessions/viewform";
const TYPEFORM_URL = "https://form.typeform.com/to/abc123";
const WEBSITE_URL = "https://example.com/";
const ROOM_ID = "room-1";
const TOKEN_PARTS = 3;

let proxy;
let restricted;

before(async () => {
  proxy = await connect();
});

after(() => {
  proxy?.stop();
  restricted?.stop();
});

async function post(target, route, body, join = false) {
  const res = await request(target.baseUrl, `/proxy/${route}/session${join ? "/join" : ""}`, { method: "POST", body });
  console.log(`  POST /proxy/${route}/session${join ? "/join" : ""} -> ${res.status} ${res.body.slice(0, 120)}`);
  return res;
}

function sessionData(res, target) {
  assert.equal(res.status, STATUS_OK, failureMessage(res, target));
  return JSON.parse(res.body).data;
}

test("typeform session: driver gets a 3-part token and a proxied URL", async () => {
  const res = await post(proxy, "typeform", { typeformUrl: TYPEFORM_URL, roomId: ROOM_ID, editorId: "e1" });
  const data = sessionData(res, proxy);
  assert.equal(data.role, "driver", failureMessage(res, proxy));
  assert.equal(data.token.split(".").length, TOKEN_PARTS);
  assert.ok(data.proxiedUrl.startsWith("/proxy/typeform?target="), data.proxiedUrl);
  assert.equal(data.editorId, "e1");
  assert.equal(data.broadcast.roomId, ROOM_ID);
});

test("typeform session: join gives role follower", async () => {
  const res = await post(proxy, "typeform", { typeformUrl: TYPEFORM_URL, roomId: ROOM_ID, editorId: "e2" }, true);
  assert.equal(sessionData(res, proxy).role, "follower");
});

test("typeform session: empty body is 400", async () => {
  const res = await post(proxy, "typeform", {});
  assert.equal(res.status, STATUS_BAD_REQUEST, failureMessage(res, proxy));
  assert.deepEqual(JSON.parse(res.body), { code: STATUS_BAD_REQUEST, message: "typeformUrl is required" });
});

test("typeform session: missing roomId is 400", async () => {
  const res = await post(proxy, "typeform", { typeformUrl: TYPEFORM_URL });
  assert.equal(res.status, STATUS_BAD_REQUEST, failureMessage(res, proxy));
  assert.equal(JSON.parse(res.body).message, "roomId is required");
});

test("google-forms session: published responder URL gives 200 and the cleaned URL", async () => {
  const res = await post(proxy, "google-forms", { googleFormUrl: GOOGLE_PUBLISHED_URL, roomId: ROOM_ID, editorId: "e1" });
  const data = sessionData(res, proxy);
  assert.equal(data.googleFormUrl, GOOGLE_CLEANED_URL);
  assert.equal(data.role, "driver");
  assert.ok(data.proxiedUrl.startsWith("/proxy/google-forms?target="), data.proxiedUrl);
});

test("google-forms session: join without collab is 400", async () => {
  const res = await post(proxy, "google-forms", { googleFormUrl: GOOGLE_PUBLISHED_URL, roomId: ROOM_ID }, true);
  assert.equal(res.status, STATUS_BAD_REQUEST, failureMessage(res, proxy));
  assert.match(JSON.parse(res.body).message, /^collab is required for followers/);
});

test("google-forms session: http or non-Google URL is 400", async () => {
  for (const url of ["http://docs.google.com/forms/d/e/x/viewform", "https://example.com/forms/d/e/x/viewform"]) {
    const res = await post(proxy, "google-forms", { googleFormUrl: url, roomId: ROOM_ID });
    assert.equal(res.status, STATUS_BAD_REQUEST, failureMessage(res, proxy));
    assert.equal(JSON.parse(res.body).message, "googleFormUrl must be an https://docs.google.com/forms URL");
  }
});

test("website session: public https URL gives 200 and a proxied URL", async () => {
  const res = await post(proxy, "website", { websiteUrl: WEBSITE_URL, roomId: ROOM_ID, editorId: "e1" });
  const data = sessionData(res, proxy);
  assert.equal(data.websiteUrl, WEBSITE_URL);
  assert.ok(data.proxiedUrl.startsWith("/proxy/website?target="), data.proxiedUrl);
});

test("website session: localhost, metadata, private and ftp URLs are 400", async () => {
  for (const [url, message] of [
    ["http://localhost/", "Website URL is not allowed: http://localhost/"],
    ["http://169.254.169.254/", "Website URL is not allowed: http://169.254.169.254/"],
    ["http://10.0.0.1/", "Website URL is not allowed: http://10.0.0.1/"],
    ["ftp://x/", "Website URL must be http(s): ftp://x/"],
  ]) {
    const res = await post(proxy, "website", { websiteUrl: url, roomId: ROOM_ID });
    assert.equal(res.status, STATUS_BAD_REQUEST, failureMessage(res, proxy));
    assert.equal(JSON.parse(res.body).message, message);
  }
});

test("website session: join without collab is 400", async () => {
  const res = await post(proxy, "website", { websiteUrl: WEBSITE_URL, roomId: ROOM_ID }, true);
  assert.equal(res.status, STATUS_BAD_REQUEST, failureMessage(res, proxy));
  assert.match(JSON.parse(res.body).message, /^collab is required for followers/);
});

test("website session: host outside LOWCODER_WEBSITE_ALLOWED_HOSTS is 400", { skip: needs("LOWCODER_WEBSITE_ALLOWED_HOSTS") }, async () => {
  restricted = await connect({ LOWCODER_WEBSITE_ALLOWED_HOSTS: "example.com" });
  const res = await post(restricted, "website", { websiteUrl: "https://other.example/", roomId: ROOM_ID });
  assert.equal(res.status, STATUS_BAD_REQUEST, failureMessage(res, restricted));
  assert.equal(JSON.parse(res.body).message, "Website URL is not allowed: https://other.example/");
  const allowed = await post(restricted, "website", { websiteUrl: WEBSITE_URL, roomId: ROOM_ID, editorId: "e1" });
  assert.equal(allowed.status, STATUS_OK, failureMessage(allowed, restricted));
});
