import nock from "nock";

const API_HOST = "http://api.test";
const EXECUTE_PATH = "/api/query/execute-from-node";
const STATUS_OK = 200;
const COOKIE = "LOWCODER_CE_SELFHOST_TOKEN=abc";
const NO_REQUESTS_ERROR = "No requests";

type RunJavascriptModule = typeof import("./runJavascript");

const ORIGINAL_API_HOST = process.env.API_HOST;
let controller: RunJavascriptModule["default"];

function loadController() {
  jest.isolateModules(() => {
    process.env.API_HOST = API_HOST;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    controller = require("./runJavascript").default;
  });
}

type RecordedResponse = { statusCode?: number; body?: any; status: jest.Mock; json: jest.Mock };

function makeRes(): RecordedResponse {
  const res: RecordedResponse = {
    status: jest.fn((code: number) => {
      res.statusCode = code;
      return res;
    }),
    json: jest.fn((body: any) => {
      res.body = body;
      return res;
    }),
  };
  return res;
}

function makeReq(body: any, cookie?: string): any {
  return { body, headers: cookie === undefined ? {} : { cookie } };
}

async function run(body: any, cookie?: string) {
  const res = makeRes();
  await controller.runJavascript(makeReq(body, cookie), res as any, jest.fn());
  return res;
}

async function runBatch(body: any, cookie?: string) {
  const res = makeRes();
  await controller.batchRunJavascript(makeReq(body, cookie), res as any, jest.fn());
  return res;
}

beforeEach(() => {
  loadController();
  // the controller logs every eval failure with console.error; keep the output readable
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
  if (ORIGINAL_API_HOST === undefined) delete process.env.API_HOST;
  else process.env.API_HOST = ORIGINAL_API_HOST;
  expect(nock.pendingMocks()).toEqual([]);
  nock.cleanAll();
});

describe("runJavascript", () => {
  test("evaluates jsCode and returns status 200 with {result}", async () => {
    const res = await run({ jsCode: "return 1+1" });

    expect(res.statusCode).toBe(STATUS_OK);
    expect(res.body).toEqual({ result: 2 });
  });

  test("the request context is visible to the code", async () => {
    const res = await run({ jsCode: "return a * 10", context: { a: 4 } });

    expect(res.body).toEqual({ result: 40 });
  });

  test("a missing jsCode evaluates the empty string: status 200 and no result key", async () => {
    const res = await run({});

    expect(res.statusCode).toBe(STATUS_OK);
    expect(res.body.result).toBeUndefined();
    expect(JSON.stringify(res.body)).toBe("{}");
  });

  test("code that throws gives status 200 and {error: 'Error: boom'}", async () => {
    const res = await run({ jsCode: "throw _.attempt(() => { throw 'boom'; })" });

    expect(res.statusCode).toBe(STATUS_OK);
    expect(res.body).toEqual({ error: "Error: boom" });
  });

  test("code that throws a non-Error value gives the generic unknown-exception message", async () => {
    const res = await run({ jsCode: "throw 42" });

    expect(res.body).toEqual({ error: "UnknownError: unknown exception during eval" });
  });
});

describe("runQueryLibrary from user code", () => {
  test("posts the params as [{key, value}] and the Cookie header, and resolves to data.data", async () => {
    const scope = nock(API_HOST, { reqheaders: { cookie: COOKIE } })
      .post(EXECUTE_PATH, { libraryQueryName: "q", params: [{ key: "a", value: 1 }] })
      .reply(STATUS_OK, { success: true, data: { rows: [1, 2] } });

    const res = await run({ jsCode: 'return await runQueryLibrary("q", {a: 1})' }, COOKIE);

    expect(res.body).toEqual({ result: { rows: [1, 2] } });
    expect(scope.isDone()).toBe(true);
  });

  test("null params send no params key", async () => {
    let received: any;
    nock(API_HOST)
      .post(EXECUTE_PATH, (b) => {
        received = b;
        return true;
      })
      .reply(STATUS_OK, { success: true, data: "ok" });

    const res = await run({ jsCode: 'return await runQueryLibrary("q", null)' }, COOKIE);

    expect(res.body).toEqual({ result: "ok" });
    expect(received).toEqual({ libraryQueryName: "q" });
    expect("params" in received).toBe(false);
  });

  test("omitted params send no params key either", async () => {
    let received: any;
    nock(API_HOST)
      .post(EXECUTE_PATH, (b) => {
        received = b;
        return true;
      })
      .reply(STATUS_OK, { success: true, data: null });

    await run({ jsCode: 'return await runQueryLibrary("q")' }, COOKIE);

    expect(received).toEqual({ libraryQueryName: "q" });
  });

  test("success:false gives the API failed error with code and message", async () => {
    nock(API_HOST)
      .post(EXECUTE_PATH)
      .reply(STATUS_OK, { success: false, code: 7, message: "denied" });

    const res = await run({ jsCode: 'return await runQueryLibrary("q", {})' }, COOKIE);

    expect(res.statusCode).toBe(STATUS_OK);
    expect(res.body).toEqual({ error: "Error: API failed. code:7 message:denied" });
  });

  test("an HTTP error from the api-service surfaces as the interceptor's string message", async () => {
    nock(API_HOST).post(EXECUTE_PATH).reply(500, { code: 9, message: "bad query" });

    const res = await run({ jsCode: 'return await runQueryLibrary("q", {})' }, COOKIE);

    expect(res.body).toEqual({ error: "AxiosError:ERR_BAD_RESPONSE status:500 code:9 message:bad query" });
  });
});

describe("batchRunJavascript", () => {
  test.each([
    ["requests missing", {}],
    ["requests not an array", { requests: { jsCode: "return 1" } }],
    ["requests null", { requests: null }],
  ])("%s gives {error: 'No requests'} with status 200", async (_name, body) => {
    const res = await runBatch(body);

    expect(res.statusCode).toBe(STATUS_OK);
    expect(res.body).toEqual({ error: NO_REQUESTS_ERROR });
  });

  test("an empty requests array gives empty results", async () => {
    const res = await runBatch({ requests: [] });

    expect(res.body).toEqual({ results: [] });
  });

  test("a mixed batch keeps the order and one failure does not affect the others", async () => {
    const res = await runBatch({
      requests: [
        { jsCode: "return 'first'" },
        { jsCode: "throw _.attempt(() => { throw 'second failed'; })" },
        { jsCode: "return v + 1", context: { v: 2 } },
      ],
    });

    expect(res.statusCode).toBe(STATUS_OK);
    expect(res.body).toEqual({
      results: [{ result: "first" }, { error: "Error: second failed" }, { result: 3 }],
    });
  });

  test("every request in a batch forwards the same Cookie header to the api-service", async () => {
    const scope = nock(API_HOST, { reqheaders: { cookie: COOKIE } })
      .post(EXECUTE_PATH, { libraryQueryName: "q1" })
      .reply(STATUS_OK, { success: true, data: 1 })
      .post(EXECUTE_PATH, { libraryQueryName: "q2" })
      .reply(STATUS_OK, { success: true, data: 2 });

    const res = await runBatch(
      {
        requests: [{ jsCode: 'return await runQueryLibrary("q1")' }, { jsCode: 'return await runQueryLibrary("q2")' }],
      },
      COOKIE
    );

    expect(res.body).toEqual({ results: [{ result: 1 }, { result: 2 }] });
    expect(scope.isDone()).toBe(true);
  });
});
