// Unit tests of hocuspocus-server.js's room authorization. Run with `node --test`.
// Not copied into any image -- this file is test-only.

import test from "node:test";
import assert from "node:assert/strict";
import { authorizeDocument, onAuthenticate, cookieOf } from "./hocuspocus-server.js";

const COOKIE = "lowcoder.sid=abc123";

function fetchReturning(status, body) {
  const calls = [];
  const impl = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    };
  };
  impl.calls = calls;
  return impl;
}

function fetchThrowing(error) {
  return async () => {
    throw error;
  };
}

function fetchNeverCalled() {
  return async () => {
    throw new Error("fetchImpl must not be called");
  };
}

// ----------------------------------------------------------------- authorizeDocument: signal_* rooms

test("signal_<id>: a 200 with success:true is accepted", async () => {
  const fetchImpl = fetchReturning(200, { success: true });
  await authorizeDocument({ documentName: "signal_app-1", cookie: COOKIE, fetchImpl, apiServiceUrl: "http://api" });
  assert.equal(fetchImpl.calls.length, 1);
  assert.equal(fetchImpl.calls[0].url, "http://api/api/applications/app-1/view");
});

test("signal_<id>: a 200 with success:false is refused", async () => {
  const fetchImpl = fetchReturning(200, { success: false });
  await assert.rejects(
    authorizeDocument({ documentName: "signal_app-1", cookie: COOKIE, fetchImpl }),
    /Unauthorized/
  );
});

test("signal_<id>: a 401 is refused", async () => {
  const fetchImpl = fetchReturning(401, {});
  await assert.rejects(authorizeDocument({ documentName: "signal_app-1", cookie: COOKIE, fetchImpl }), /Unauthorized/);
});

test("signal_<id>: a 403 is refused", async () => {
  const fetchImpl = fetchReturning(403, {});
  await assert.rejects(authorizeDocument({ documentName: "signal_app-1", cookie: COOKIE, fetchImpl }), /Unauthorized/);
});

test("signal_<id>: a fetch failure (timeout/network error) is refused", async () => {
  const fetchImpl = fetchThrowing(new Error("network error"));
  await assert.rejects(authorizeDocument({ documentName: "signal_app-1", cookie: COOKIE, fetchImpl }), /Unauthorized/);
});

test("signal_<id>: a bad app id is refused before any fetch", async () => {
  const fetchImpl = fetchNeverCalled();
  await assert.rejects(authorizeDocument({ documentName: "signal_app one!", cookie: COOKIE, fetchImpl }), /Unauthorized/);
});

test("signal_<id>:sub checks <id>, not the sub-room suffix", async () => {
  const fetchImpl = fetchReturning(200, { success: true });
  await authorizeDocument({ documentName: "signal_app-1:app-2", cookie: COOKIE, fetchImpl, apiServiceUrl: "http://api" });
  assert.equal(fetchImpl.calls[0].url, "http://api/api/applications/app-1/view");
});

test("the cookie is forwarded and nothing else is sent as a header", async () => {
  const fetchImpl = fetchReturning(200, { success: true });
  await authorizeDocument({ documentName: "signal_app-1", cookie: COOKIE, fetchImpl });
  assert.deepEqual(fetchImpl.calls[0].options.headers, { Cookie: COOKIE });
});

test("an id containing an underscore is accepted (the SDK-slug case)", async () => {
  const fetchImpl = fetchReturning(200, { success: true });
  await authorizeDocument({ documentName: "signal_my_app_slug", cookie: COOKIE, fetchImpl, apiServiceUrl: "http://api" });
  assert.equal(fetchImpl.calls[0].url, "http://api/api/applications/my_app_slug/view");
});

test("a deliberately long id (500+ chars) of only valid characters is accepted -- no numeric length cap", async () => {
  const longId = "a".repeat(500) + "-" + "b".repeat(50);
  const fetchImpl = fetchReturning(200, { success: true });
  await authorizeDocument({ documentName: `signal_${longId}`, cookie: COOKIE, fetchImpl, apiServiceUrl: "http://api" });
  assert.equal(fetchImpl.calls[0].url, `http://api/api/applications/${longId}/view`);
});

test("an id containing a character outside [A-Za-z0-9_-] is refused before any fetch, regardless of length", async () => {
  const fetchImpl = fetchNeverCalled();
  const longInvalidId = "a".repeat(500) + "/evil";
  await assert.rejects(authorizeDocument({ documentName: `signal_${longInvalidId}`, cookie: COOKIE, fetchImpl }), /Unauthorized/);
});

test("an empty app id (signal_ alone) is accepted by the regex (matches SlugUtils.validate's *)", async () => {
  const fetchImpl = fetchReturning(200, { success: true });
  await authorizeDocument({ documentName: "signal_", cookie: COOKIE, fetchImpl, apiServiceUrl: "http://api" });
  assert.equal(fetchImpl.calls[0].url, "http://api/api/applications//view");
});

// ----------------------------------------------------------------- authorizeDocument: other rooms

test("bridge-prefixed rooms (typeform_/googleform_/website_) pass without any fetch", async () => {
  const fetchImpl = fetchNeverCalled();
  await authorizeDocument({ documentName: "typeform_abc", cookie: COOKIE, fetchImpl });
  await authorizeDocument({ documentName: "googleform_abc", cookie: COOKIE, fetchImpl });
  await authorizeDocument({ documentName: "website_abc", cookie: COOKIE, fetchImpl });
});

test("an unknown room prefix is refused", async () => {
  const fetchImpl = fetchNeverCalled();
  await assert.rejects(authorizeDocument({ documentName: "unknown_room", cookie: COOKIE, fetchImpl }), /Unauthorized/);
});

// ----------------------------------------------------------------- onAuthenticate (secret gate + wiring)
// onAuthenticate itself is exported (not only authorizeDocument), with injectable secret/authorize parameters
// for tests; production calls it with one argument, so those parameters default to the module's real SECRET and
// authorizeDocument -- these tests inject different ones to prove the gate order without touching real state.

test("onAuthenticate: a wrong secret token short-circuits before authorizeDocument runs (never calls fetchImpl)", async () => {
  const fetchImpl = fetchNeverCalled();
  const authorize = (args) => authorizeDocument({ ...args, fetchImpl });

  await assert.rejects(
    onAuthenticate({ token: "wrong", documentName: "signal_app-1", requestHeaders: { cookie: COOKIE } }, "the-secret", authorize),
    /Unauthorized/
  );
  await assert.rejects(
    onAuthenticate({ token: "wrong", documentName: "typeform_abc", requestHeaders: { cookie: COOKIE } }, "the-secret", authorize),
    /Unauthorized/
  );
});

test("onAuthenticate: a correct token proceeds to authorizeDocument", async () => {
  const fetchImpl = fetchReturning(200, { success: true });
  const authorize = (args) => authorizeDocument({ ...args, fetchImpl });

  await onAuthenticate({ token: "the-secret", documentName: "signal_app-1", requestHeaders: { cookie: COOKIE } }, "the-secret", authorize);

  assert.equal(fetchImpl.calls.length, 1);
});

test("onAuthenticate: no secret configured proceeds straight to authorizeDocument", async () => {
  const fetchImpl = fetchReturning(200, { success: true });
  const authorize = (args) => authorizeDocument({ ...args, fetchImpl });

  await onAuthenticate({ token: "anything-or-nothing", documentName: "signal_app-1", requestHeaders: { cookie: COOKIE } }, "", authorize);

  assert.equal(fetchImpl.calls.length, 1);
});

test("onAuthenticate: a refused authorizeDocument (e.g. a bad app id) still refuses the connection", async () => {
  const fetchImpl = fetchNeverCalled();
  const authorize = (args) => authorizeDocument({ ...args, fetchImpl });

  await assert.rejects(
    onAuthenticate({ token: "", documentName: "signal_app one!", requestHeaders: { cookie: COOKIE } }, "", authorize),
    /Unauthorized/
  );
});

// ----------------------------------------------------------------- requestHeaders shape (plain object vs Headers)

test("cookie extraction: a plain-object requestHeaders (Node IncomingHttpHeaders) works", async () => {
  assert.equal(cookieOf({ cookie: COOKIE }), COOKIE);
});

test("cookie extraction: a Fetch-API-style Headers instance (.get method) works", async () => {
  const headers = new Headers();
  headers.set("cookie", COOKIE);
  assert.equal(cookieOf(headers), COOKIE);
});
