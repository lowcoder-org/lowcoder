import { AxiosError } from "axios";
import nock from "nock";

const API_HOST = "http://api.test";
const API_PREFIX = "/api";
const STATUS_OK = 200;
const STATUS_NOT_FOUND = 404;
const STATUS_SERVER_ERROR = 500;
const SHORT_TIMEOUT_MS = 50;
const SLOW_REPLY_MS = 400;

type ApiModule = typeof import("./api");
type LogModule = typeof import("loglevel");

const ORIGINAL_API_HOST = process.env.API_HOST;
let Api: ApiModule["default"];
let log: LogModule;
let logged: unknown[][];

function loadApi(host: string | undefined) {
  jest.isolateModules(() => {
    if (host === undefined) delete process.env.API_HOST;
    else process.env.API_HOST = host;
    // loglevel must come from the same registry as api.ts, or its output is not the one api.ts writes to
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    log = require("loglevel");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Api = require("./api").default;
  });
}

beforeEach(() => {
  loadApi(API_HOST);
  logged = [];
  log.methodFactory = () => (...args: unknown[]) => {
    logged.push(args);
  };
  log.setLevel("error");
});

afterEach(() => {
  if (ORIGINAL_API_HOST === undefined) delete process.env.API_HOST;
  else process.env.API_HOST = ORIGINAL_API_HOST;
  nock.cleanAll();
});

describe("Api request building", () => {
  test("get sends GET to <host>/api/<url> with the query params and the JSON content type", async () => {
    const scope = nock(API_HOST, { reqheaders: { "content-type": "application/json" } })
      .get(`${API_PREFIX}/things`)
      .query({ page: "2", q: "x" })
      .reply(STATUS_OK, { ok: true });

    const res = await Api.get("things", { page: 2, q: "x" });

    expect(res.status).toBe(STATUS_OK);
    expect(res.data).toEqual({ ok: true });
    expect(scope.isDone()).toBe(true);
  });

  test.each([
    ["post", "POST"],
    ["put", "PUT"],
    ["patch", "PATCH"],
  ] as const)("%s sends %s with the JSON body and the query params", async (method, verb) => {
    const scope = nock(API_HOST)
      .intercept(`${API_PREFIX}/things`, verb, { name: "n", n: 1 })
      .query({ force: "true" })
      .reply(STATUS_OK, { method: verb });

    const res = await Api[method]("things", { name: "n", n: 1 }, { force: true });

    expect(res.data).toEqual({ method: verb });
    expect(scope.isDone()).toBe(true);
  });

  test("delete sends DELETE with the query params and no body", async () => {
    const scope = nock(API_HOST).delete(`${API_PREFIX}/things/1`).query({ soft: "1" }).reply(STATUS_OK, { deleted: 1 });

    const res = await Api.delete("things/1", { soft: 1 });

    expect(res.data).toEqual({ deleted: 1 });
    expect(scope.isDone()).toBe(true);
  });

  test("the config argument overrides and adds headers", async () => {
    const scope = nock(API_HOST, { reqheaders: { "x-custom": "1", "content-type": "text/plain" } })
      .post(`${API_PREFIX}/h`)
      .reply(STATUS_OK, "done");

    await Api.post("h", "raw", undefined, { headers: { "X-Custom": "1", "Content-Type": "text/plain" } });

    expect(scope.isDone()).toBe(true);
  });

  test("the config argument overrides the timeout", async () => {
    nock(API_HOST).get(`${API_PREFIX}/slow`).delay(SLOW_REPLY_MS).reply(STATUS_OK, "late");

    await expect(Api.get("slow", undefined, { timeout: SHORT_TIMEOUT_MS })).rejects.toBe("AxiosError:ECONNABORTED");
  });
});

describe("API_HOST", () => {
  test("when unset the base URL is the relative /api/ path, which node cannot request: it fails fast and sends nothing", async () => {
    loadApi(undefined);
    const scope = nock("http://localhost").get(`${API_PREFIX}/rel`).reply(STATUS_OK, {});

    // not an AxiosError, so the interceptor re-throws it unchanged
    await expect(Api.get("rel")).rejects.toMatchObject({ name: "TypeError", message: "Invalid URL" });
    expect(scope.isDone()).toBe(false);
  });
});

describe("error interceptor", () => {
  test("an HTTP 500 with an ApiResponse body rejects with status, code and message", async () => {
    nock(API_HOST).get(`${API_PREFIX}/x`).reply(STATUS_SERVER_ERROR, { code: 1234, message: "kaput" });

    await expect(Api.get("x")).rejects.toBe("AxiosError:ERR_BAD_RESPONSE status:500 code:1234 message:kaput");
    expect(logged).toEqual([]);
  });

  test("a 404 with an empty body rejects with the status and no code part", async () => {
    nock(API_HOST).get(`${API_PREFIX}/x`).reply(STATUS_NOT_FOUND);

    await expect(Api.get("x")).rejects.toBe("AxiosError:ERR_BAD_REQUEST status:404");
  });

  test("a connection error rejects with the error code and logs the request", async () => {
    nock(API_HOST).get(`${API_PREFIX}/x`).replyWithError({ code: "ECONNRESET", message: "socket hang up" });

    await expect(Api.get("x")).rejects.toBe("AxiosError:ECONNRESET");
    expect(logged).toHaveLength(1);
    expect(logged[0]).toHaveLength(1); // log.error(error.request)
  });

  test("an AxiosError with neither response nor request logs the message under \"Error\"", async () => {
    const adapter = () => Promise.reject(new AxiosError("adapter exploded", "E_CUSTOM"));

    await expect(Api.get("x", undefined, { adapter })).rejects.toBe("AxiosError:E_CUSTOM");
    expect(logged).toEqual([["Error", "adapter exploded"]]);
  });

  test("a non-axios Error is re-thrown unchanged", async () => {
    const original = new Error("not axios");
    const adapter = () => Promise.reject(original);

    await expect(Api.get("x", undefined, { adapter })).rejects.toBe(original);
    expect(logged).toEqual([]);
  });
});
