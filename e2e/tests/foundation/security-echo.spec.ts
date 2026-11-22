import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { ECHO_ENV, ECHO_PATHS, ECHO_TARGET_PREFIX, npmRegistryPath } from "../../src/constants";
import { n8nDatasourceBody } from "../../src/api/client";
import { echoBaseUrl, echoReadPrefix, echoTargetPath, recordsContain, type EchoRecord } from "../../src/security/echo";

/**
 * Stack-free unit tests of the echo sidecar (scripts/echo-server.js, started here as a child process on a loopback port, no
 * Docker) and of src/security/echo.ts. They do not need the stack and open no page, so `test` comes from `@playwright/test`
 * (AGENTS.md section 8). The sidecar of a real run is the same script.
 */

const ECHO_SCRIPT = join(__dirname, "..", "..", "scripts", "echo-server.js");
const STARTUP_TIMEOUT_MS = 10_000;
const STARTUP_POLL_MS = 100;
/** Larger than MAX_BODY_BYTES (65536) of the sidecar. */
const OVERSIZED_BODY_BYTES = 70_000;
const MAX_BODY_BYTES = 65_536;

let child: ChildProcess;
let baseUrl: string;

async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

async function waitUntilHealthy(): Promise<void> {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(`${baseUrl}${ECHO_PATHS.HEALTH}`)).ok) {
        return;
      }
    } catch {
      // not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, STARTUP_POLL_MS));
  }
  throw new Error(`the echo server did not answer ${ECHO_PATHS.HEALTH} within ${STARTUP_TIMEOUT_MS} ms`);
}

async function recordsOf(path: string): Promise<EchoRecord[]> {
  const response = await fetch(`${baseUrl}${ECHO_PATHS.REQUESTS}?prefix=${encodeURIComponent(echoReadPrefix(path))}`);
  return (await response.json()) as EchoRecord[];
}

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  const port = await freePort();
  baseUrl = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, [ECHO_SCRIPT], { env: { ...process.env, ECHO_PORT: String(port) }, stdio: "ignore" });
  await waitUntilHealthy();
});

test.afterAll(() => {
  child.kill();
});

test.describe("echo sidecar", () => {
  test("health answers ok", async () => {
    const response = await fetch(`${baseUrl}${ECHO_PATHS.HEALTH}`);
    expect({ status: response.status, text: await response.text() }).toEqual({ status: 200, text: "ok" });
  });

  test("a request to a target is answered {} and read back with method, path, headers and body", async () => {
    const path = echoTargetPath({ workerIndex: 0, repeatEachIndex: 0, retry: 0 });
    const response = await fetch(`${baseUrl}${path}/pkg?x=1`, {
      method: "POST",
      headers: { authorization: "Bearer e2e-unit-token", "content-type": "text/plain" },
      body: "payload-é",
    });
    expect({ status: response.status, body: await response.json() }, "the echo's answer").toEqual({ status: 200, body: {} });
    const records = await recordsOf(path);
    expect(records, "exactly one record").toHaveLength(1);
    expect(records[0]?.method).toBe("POST");
    expect(records[0]?.path).toBe(`${path}/pkg?x=1`);
    expect(records[0]?.headers.authorization).toBe("Bearer e2e-unit-token");
    expect(records[0]?.body).toBe("payload-é");
  });

  test("a second target's prefix does not see the first target's request", async () => {
    const first = echoTargetPath({ workerIndex: 1, repeatEachIndex: 0, retry: 0 });
    const second = echoTargetPath({ workerIndex: 1, repeatEachIndex: 0, retry: 0 });
    await fetch(`${baseUrl}${first}/only-first`);
    expect((await recordsOf(first)).map((record) => record.path), "the first target's own read").toEqual([`${first}/only-first`]);
    expect(await recordsOf(second), "the second target's read").toEqual([]);
  });

  test("a target id that starts like another one is not matched (the read prefix ends with a slash)", async () => {
    const longer = `${ECHO_TARGET_PREFIX}unit-prefix-abcd`;
    const shorter = `${ECHO_TARGET_PREFIX}unit-prefix-abc`;
    await fetch(`${baseUrl}${longer}/pkg`);
    expect(await recordsOf(shorter)).toEqual([]);
    expect(await recordsOf(longer)).toHaveLength(1);
  });

  test("control paths are not recorded", async () => {
    const before = await (await fetch(`${baseUrl}${ECHO_PATHS.REQUESTS}?prefix=`)).json();
    await fetch(`${baseUrl}${ECHO_PATHS.HEALTH}`);
    const after = (await (await fetch(`${baseUrl}${ECHO_PATHS.REQUESTS}?prefix=`)).json()) as EchoRecord[];
    expect(after).toEqual(before);
    expect(after.some((record) => record.path.startsWith("/__e2e/"))).toBe(false);
  });

  test("a body larger than the limit is cut", async () => {
    const path = echoTargetPath({ workerIndex: 2, repeatEachIndex: 0, retry: 0 });
    await fetch(`${baseUrl}${path}/big`, { method: "POST", body: "a".repeat(OVERSIZED_BODY_BYTES) });
    const [record] = await recordsOf(path);
    expect(record?.body.length).toBeLessThanOrEqual(MAX_BODY_BYTES);
    expect(record?.body.length).toBeGreaterThan(0);
  });

  test("an unknown control path answers 404 and is not recorded", async () => {
    const response = await fetch(`${baseUrl}/__e2e/nothing`);
    expect(response.status).toBe(404);
  });
});

test.describe("echo helpers", () => {
  test("echoTargetPath is under the target prefix and unique per call", () => {
    const info = { workerIndex: 3, repeatEachIndex: 1, retry: 2 };
    const a = echoTargetPath(info);
    const b = echoTargetPath(info);
    expect(a.startsWith(`${ECHO_TARGET_PREFIX}3-1-2-`)).toBe(true);
    expect(a).not.toBe(b);
    expect(a.endsWith("/")).toBe(false);
  });

  test("echoReadPrefix adds the slash", () => {
    expect(echoReadPrefix("/t/x")).toBe("/t/x/");
  });

  test("echoBaseUrl strips trailing slashes and throws, naming the variable, when it is missing", () => {
    expect(echoBaseUrl({ [ECHO_ENV]: "http://e2e-echo:8080/" })).toBe("http://e2e-echo:8080");
    expect(() => echoBaseUrl({})).toThrow(ECHO_ENV);
    expect(() => echoBaseUrl({ [ECHO_ENV]: "" })).toThrow(ECHO_ENV);
  });

  test("recordsContain finds a needle in the path, a header (also a repeated one) or the body, and returns a boolean", () => {
    const record = (patch: Partial<EchoRecord>): EchoRecord => ({ method: "GET", path: "/t/x/p", headers: {}, body: "", ...patch });
    expect(recordsContain([record({})], "needle")).toBe(false);
    expect(recordsContain([record({ path: "/t/x/p?q=needle" })], "needle")).toBe(true);
    expect(recordsContain([record({ headers: { cookie: "a=needle" } })], "needle")).toBe(true);
    expect(recordsContain([record({ headers: { "set-cookie": ["a=1", "b=needle"] } })], "needle")).toBe(true);
    expect(recordsContain([record({ body: '{"k":"needle"}' })], "needle")).toBe(true);
    expect(recordsContain([], "needle")).toBe(false);
  });

  test("recordsContain also finds a needle that the path carries percent-encoded", () => {
    const record: EchoRecord = { method: "GET", path: "/t/x/p?name=%5B%7B%22value%22%3A%22a%20b%22%7D%5D", headers: {}, body: "" };
    expect(recordsContain([record], 'a b')).toBe(true);
    expect(recordsContain([record], "a%20b")).toBe(true);
  });

  test("n8nDatasourceBody puts the workspace, the target and the key into the recorded body and keeps the recorded settings", () => {
    const body = n8nDatasourceBody({ orgId: "org1", serverURL: "http://e2e-echo:8080/t/x", apiKey: "e2e-dummy-key-x" }) as {
      organizationId: string;
      type: string;
      datasourceConfig: Record<string, unknown>;
    };
    expect(body.organizationId).toBe("org1");
    expect(body.type).toBe("n8n");
    expect(body.datasourceConfig).toMatchObject({ serverURL: "http://e2e-echo:8080/t/x", apiKey: "e2e-dummy-key-x", specVersion: "v1.1.1" });
  });

  test("n8nDatasourceBody sets forwardAllCookies only when asked", () => {
    const base = { orgId: "org1", serverURL: "http://x", apiKey: "k" };
    expect((n8nDatasourceBody(base) as { datasourceConfig: object }).datasourceConfig).not.toHaveProperty("forwardAllCookies");
    expect((n8nDatasourceBody({ ...base, forwardAllCookies: true }) as { datasourceConfig: object }).datasourceConfig).toMatchObject({ forwardAllCookies: true });
  });

  test("npmRegistryPath builds the proxy path of an app and package", () => {
    expect(npmRegistryPath("app1", "e2e-pkg")).toBe("/api/npm/registry/app1/e2e-pkg");
  });

  test("a canned answer is served for its prefix, still recorded, the longest prefix wins and other paths keep the {} answer", async () => {
    const path = echoTargetPath({ workerIndex: 3, repeatEachIndex: 0, retry: 0 });
    const canned = async (prefix: string, status: number, body: string, contentType = "application/json"): Promise<number> =>
      (await fetch(`${baseUrl}${ECHO_PATHS.ANSWERS}`, { method: "POST", body: JSON.stringify({ prefix, status, contentType, body }) })).status;
    expect(await canned(`${path}/token`, 200, JSON.stringify({ access_token: "abc" })), "the control answer").toBe(204);
    expect(await canned(`${path}/token/special`, 418, "teapot", "text/plain")).toBe(204);

    const plain = await fetch(`${baseUrl}${path}/token?x=1`, { method: "POST", body: "form" });
    const longest = await fetch(`${baseUrl}${path}/token/special`);
    const other = await fetch(`${baseUrl}${path}/other`);

    expect({ status: plain.status, body: await plain.json() }, "the canned answer, the query string is ignored").toEqual({ status: 200, body: { access_token: "abc" } });
    expect({ status: longest.status, text: await longest.text(), type: longest.headers.get("content-type") }, "the longer prefix").toEqual({ status: 418, text: "teapot", type: "text/plain" });
    expect({ status: other.status, body: await other.json() }, "a path with no canned answer").toEqual({ status: 200, body: {} });
    expect((await recordsOf(path)).map((record) => record.path), "all three requests were recorded").toEqual([`${path}/token?x=1`, `${path}/token/special`, `${path}/other`]);
  });

  test("the latest canned answer of a prefix replaces the earlier one, and an invalid one is refused with 400 and changes nothing", async () => {
    const path = echoTargetPath({ workerIndex: 3, repeatEachIndex: 1, retry: 0 });
    const post = async (entry: unknown): Promise<number> => (await fetch(`${baseUrl}${ECHO_PATHS.ANSWERS}`, { method: "POST", body: typeof entry === "string" ? entry : JSON.stringify(entry) })).status;
    expect(await post({ prefix: `${path}/a`, status: 201, contentType: "text/plain", body: "first" })).toBe(204);
    expect(await post({ prefix: `${path}/a`, status: 202, contentType: "text/plain", body: "second" })).toBe(204);

    const invalid = [
      "not json",
      { prefix: "no-slash", status: 200, contentType: "text/plain", body: "x" },
      { prefix: `${path}/a`, status: 99, contentType: "text/plain", body: "x" },
      { prefix: `${path}/a`, status: 600, contentType: "text/plain", body: "x" },
      { prefix: `${path}/a`, status: 200.5, contentType: "text/plain", body: "x" },
      { prefix: `${path}/a`, status: 200, contentType: 5, body: "x" },
      { prefix: `${path}/a`, status: 200, contentType: "text/plain", body: 5 },
      { prefix: `${path}/a`, status: 200, contentType: "text/plain", body: "y".repeat(MAX_BODY_BYTES + 1) },
    ];
    for (const entry of invalid) {
      expect(await post(entry), `refused: ${typeof entry === "string" ? entry : JSON.stringify(entry).slice(0, 60)}`).toBe(400);
    }

    const answer = await fetch(`${baseUrl}${path}/a`);
    expect({ status: answer.status, text: await answer.text() }, "the latest valid answer still stands").toEqual({ status: 202, text: "second" });
  });
});
