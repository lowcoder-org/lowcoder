// Unit tests of the URL validators of build/googleFormUrls.js and build/websiteAllowlist.js (run
// `yarn build` first, `yarn test` does both). Only inputs that are accepted or rejected before
// any network request are used.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const GOOGLE_MODULE = path.join(__dirname, "..", "build", "googleFormUrls.js");
const ALLOWLIST_MODULE = path.join(__dirname, "..", "build", "websiteAllowlist.js");

const PUBLISHED_URL = "https://docs.google.com/forms/d/e/1FAIpQLSunit/viewform?usp=sf_link#responses";
const CLEANED_URL = "https://docs.google.com/forms/d/e/1FAIpQLSunit/viewform";
const NOT_ALLOWED = { message: /^Website URL is not allowed: / };

// Loads the module with the given environment, so the module-level constants are re-evaluated
function loadModule(modulePath, env = {}) {
  const saved = {};
  for (const [name, value] of Object.entries(env)) {
    saved[name] = process.env[name];
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
  try {
    delete require.cache[require.resolve(modulePath)];
    return require(modulePath);
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

const googleUrls = () => loadModule(GOOGLE_MODULE);
const websiteAllowlist = (hosts) => loadModule(ALLOWLIST_MODULE, { LOWCODER_WEBSITE_ALLOWED_HOSTS: hosts });

test("google: published responder URL is accepted and cleaned", async () => {
  const google = googleUrls();
  check("isPublishedViewformUrl", google.isPublishedViewformUrl(new URL(PUBLISHED_URL)), true);
  check("cleanViewformUrl", google.cleanViewformUrl(PUBLISHED_URL), CLEANED_URL);
  check("resolveGoogleFormResponderUrl", await google.resolveGoogleFormResponderUrl(PUBLISHED_URL), CLEANED_URL);
});

test("google: http, other hosts, non-form paths and invalid URLs are rejected", async () => {
  const google = googleUrls();
  const rejected = [
    ["empty", "", "googleFormUrl is required"],
    ["invalid URL", "not a url", "googleFormUrl must be a valid URL"],
    ["http", "http://docs.google.com/forms/d/e/x/viewform", "googleFormUrl must be an https://docs.google.com/forms URL"],
    ["other host", "https://example.com/forms/d/e/x/viewform", "googleFormUrl must be an https://docs.google.com/forms URL"],
    ["non-form path", "https://docs.google.com/spreadsheets/d/x", "googleFormUrl must point to a Google Form"],
  ];
  for (const [label, url, message] of rejected) {
    await assert.rejects(google.resolveGoogleFormResponderUrl(url), { message }, label);
    console.log(`  ${label}: rejected with "${message}"`);
  }
});

test("google: cleanViewformUrl rejects edit URLs", () => {
  const google = googleUrls();
  assert.throws(() => google.cleanViewformUrl("https://docs.google.com/forms/d/abc/edit"), /published responder URL/);
  assert.throws(() => google.cleanViewformUrl("https://docs.google.com/document/d/abc/edit"), /must point to a Google Form/);
  check("isPublishedViewformUrl of an edit URL", google.isPublishedViewformUrl(new URL("https://docs.google.com/forms/d/abc/edit")), false);
});

test("website: normalizeWebsiteUrl accepts http and https only", () => {
  const allowlist = websiteAllowlist(undefined);
  check("https", allowlist.normalizeWebsiteUrl(" https://example.com "), "https://example.com/");
  check("http", allowlist.normalizeWebsiteUrl("http://example.com/a?b=1"), "http://example.com/a?b=1");
  assert.throws(() => allowlist.normalizeWebsiteUrl("ftp://x/"), { message: "Website URL must be http(s): ftp://x/" });
  assert.throws(() => allowlist.normalizeWebsiteUrl("not a url"), { message: "Invalid URL: not a url" });
  assert.throws(() => allowlist.normalizeWebsiteUrl(""), { message: "websiteUrl is required" });
});

test("website: localhost, metadata, private, link-local and CGNAT targets are rejected", () => {
  const allowlist = websiteAllowlist(undefined);
  const blocked = [
    "http://localhost/",
    "http://app.localhost/",
    "http://metadata.google.internal/",
    "http://127.0.0.1/",
    "http://10.0.0.1/",
    "http://172.16.0.1/",
    "http://192.168.1.1/",
    "http://169.254.169.254/",
    "http://100.64.0.1/",
    "http://0.0.0.0/",
  ];
  for (const url of blocked) {
    assert.throws(() => allowlist.assertAllowedWebsiteUrl(new URL(url)), NOT_ALLOWED, url);
    console.log(`  ${url}: rejected`);
  }
  for (const url of ["https://example.com/", "http://8.8.8.8/"]) {
    assert.doesNotThrow(() => allowlist.assertAllowedWebsiteUrl(new URL(url)), url);
    console.log(`  ${url}: accepted`);
  }
});

test("website: LOWCODER_WEBSITE_ALLOWED_HOSTS narrows public hosts", () => {
  const open = websiteAllowlist(undefined);
  check("no allowlist: other.example", open.isWebsiteHostAllowed("other.example"), true);

  const narrowed = websiteAllowlist("example.com, Docs.Example.org");
  check("allowlist: example.com", narrowed.isWebsiteHostAllowed("example.com"), true);
  check("allowlist: case-insensitive", narrowed.isWebsiteHostAllowed("DOCS.example.org"), true);
  check("allowlist: other.example", narrowed.isWebsiteHostAllowed("other.example"), false);
  assert.doesNotThrow(() => narrowed.assertAllowedWebsiteUrl(new URL("https://example.com/")));
  assert.throws(() => narrowed.assertAllowedWebsiteUrl(new URL("https://other.example/")), {
    message: "Website URL is not allowed: https://other.example/",
  });
  // the allowlist only narrows: a listed loopback host stays refused
  const loopbackListed = websiteAllowlist("127.0.0.1");
  assert.throws(() => loopbackListed.assertAllowedWebsiteUrl(new URL("http://127.0.0.1/")), NOT_ALLOWED);
});
