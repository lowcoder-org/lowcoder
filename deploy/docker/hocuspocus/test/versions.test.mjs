// Guards the versions the images and the clients use: the @hocuspocus/server these tests install
// must be the one both Dockerfiles pin, and the @hocuspocus/provider must be the one the client and
// proxy-service lockfiles resolve and runtime-test.sh installs. A pattern that matches nothing fails
// with the file and what it holds.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { REPO_ROOT, TEST_PACKAGE_DIR } from "./helpers/hocuspocusProcess.mjs";

const read = (...segments) => readFileSync(path.join(REPO_ROOT, ...segments), "utf8");
const installed = (name) => JSON.parse(readFileSync(path.join(TEST_PACKAGE_DIR, "node_modules", name, "package.json"), "utf8")).version;

// The first capture group of `pattern` in `text`, or a failure naming the file
function capture(file, text, pattern) {
  const match = pattern.exec(text);
  assert.ok(match, `${file}: nothing matches ${pattern}`);
  return match[1];
}

function check(description, actual, expected) {
  console.log(`  ${description}: actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`);
  assert.equal(actual, expected, description);
}

test("versions: @hocuspocus/server matches both Dockerfile ARGs", () => {
  const arg = /^ARG HOCUSPOCUS_SERVER_VERSION=(\S+)$/m;
  const standalone = "deploy/docker/hocuspocus/Dockerfile";
  const allInOne = "deploy/docker/Dockerfile";
  const version = installed("@hocuspocus/server");
  check(standalone, capture(standalone, read(standalone), arg), version);
  check(allInOne, capture(allInOne, read(allInOne), arg), version);
});

test("versions: @hocuspocus/provider matches the lockfiles and runtime-test.sh", () => {
  const version = installed("@hocuspocus/provider");
  const clientLock = "client/yarn.lock";
  const proxyLock = "server/proxy-service/yarn.lock";
  const runtimeTest = "deploy/helm/tests/runtime-test.sh";
  // yarn berry: `"@hocuspocus/provider@npm:^3.4.4":\n  version: 3.4.4`
  check(clientLock, capture(clientLock, read(clientLock), /^"@hocuspocus\/provider@[^"]*":\n  version: (\S+)$/m), version);
  // yarn 1: `"@hocuspocus/provider@^3.4.4":\n  version "3.4.4"`
  check(proxyLock, capture(proxyLock, read(proxyLock), /^"@hocuspocus\/provider@[^"]*":\n  version "([^"]+)"$/m), version);
  check(runtimeTest, capture(runtimeTest, read(runtimeTest), /^readonly HOCUSPOCUS_PROVIDER_VERSION="([^"]+)"$/m), version);
});
