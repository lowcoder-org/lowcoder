import http from "http";
import fs from "fs";
import os from "os";
import path from "path";
import { once } from "events";

// /node-service/system routes through a real HTTP server booted from server.ts (fresh prom-client registry).
const TEST_TIMEOUT_MS = 90_000;
const REQUEST_TIMEOUT_MS = 20_000;
const STATUS_OK = 200;
const NOT_FOUND = 404;
const PROMETHEUS = "/node-service/system/prometheus";
const API_HOST = "http://api.test";
// env server.ts and its imports read at boot; cleared so an ambient value cannot change the boot
const AMBIENT_ENV = [
  "LOWCODER_MAX_REQUEST_SIZE",
  "LOWCODER_PREVIEW_FRONTEND_URL",
  "LOWCODER_PREVIEW_CHROMIUM_PATH",
  "LOWCODER_NODE_SERVICE_SECRET",
  "LOWCODER_NODE_SERVICE_SECRET_SALT",
  "NPM_REGISTRY_CONFIG",
];

jest.setTimeout(TEST_TIMEOUT_MS);

let server: http.Server;
let port: number;
let npmCacheDir: string;
const ORIGINAL_ENV = { ...process.env };

function call(method: string, urlPath: string) {
  return fetch(`http://127.0.0.1:${port}${urlPath}`, { method, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
}

beforeAll(async () => {
  npmCacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "nodesvc-system-npm-"));
  const createServerSpy = jest.spyOn(http, "createServer");
  try {
    jest.isolateModules(() => {
      process.env.NODE_SERVICE_PORT = "0";
      process.env.NPM_CACHE_DIR = npmCacheDir;
      process.env.API_HOST = API_HOST;
      for (const k of AMBIENT_ENV) delete process.env[k];
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require("../server");
    });
    server = createServerSpy.mock.results[0].value;
  } finally {
    createServerSpy.mockRestore();
  }
  if (!server.listening) {
    await once(server, "listening");
  }
  port = (server.address() as { port: number }).port;
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
    server.closeAllConnections();
  });
  for (const k of Object.keys(process.env)) {
    if (!(k in ORIGINAL_ENV)) delete process.env[k];
  }
  Object.assign(process.env, ORIGINAL_ENV);
  fs.rmSync(npmCacheDir, { recursive: true, force: true });
});

describe("GET /node-service/system/prometheus", () => {
  it("answers 200 with the default process metrics collected by server.ts", async () => {
    const res = await call("GET", PROMETHEUS);
    const text = await res.text();
    expect(res.status).toBe(STATUS_OK);
    expect(text).toContain("# TYPE process_cpu_user_seconds_total counter");
    expect(text).toContain("nodejs_version_info");
  });

  it("is a GET-only route", async () => {
    const res = await call("POST", PROMETHEUS);
    await res.text();
    expect(res.status).toBe(NOT_FOUND);
  });
});
