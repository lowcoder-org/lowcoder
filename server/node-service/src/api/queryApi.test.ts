import nock from "nock";

const API_HOST = "http://api.test";
const EXECUTE_PATH = "/api/query/execute-from-node";
const STATUS_OK = 200;
const DEFAULT_TIMEOUT_MS = 15000;
const TIMEOUT_BUFFER_MS = 5000;
const COOKIE = "LOWCODER_CE_SELFHOST_TOKEN=abc";

type QueryApiModule = typeof import("./queryApi");
type ApiModule = typeof import("./api");

const ORIGINAL_API_HOST = process.env.API_HOST;
let QueryApi: QueryApiModule["QueryApi"];
let Api: ApiModule["default"];

beforeEach(() => {
  jest.isolateModules(() => {
    process.env.API_HOST = API_HOST;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Api = require("./api").default;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    QueryApi = require("./queryApi").QueryApi;
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  if (ORIGINAL_API_HOST === undefined) delete process.env.API_HOST;
  else process.env.API_HOST = ORIGINAL_API_HOST;
  nock.cleanAll();
});

describe("QueryApi.executeQuery", () => {
  test("posts {libraryQueryName, params} to query/execute-from-node with the Cookie header", async () => {
    const request = { libraryQueryName: "lib1", params: [{ key: "k", value: { nested: 1 } }] };
    const scope = nock(API_HOST, { reqheaders: { cookie: COOKIE, "content-type": "application/json" } })
      .post(EXECUTE_PATH, request)
      .reply(STATUS_OK, { success: true, data: { rows: 3 } });

    const res = await QueryApi.executeQuery(request, COOKIE);

    expect(res.status).toBe(STATUS_OK);
    expect(res.data).toEqual({ success: true, data: { rows: 3 } });
    expect(scope.isDone()).toBe(true);
  });

  test("a failing api-service call rejects with the interceptor's message", async () => {
    nock(API_HOST).post(EXECUTE_PATH).reply(500, { code: 9, message: "bad query" });

    await expect(QueryApi.executeQuery({ libraryQueryName: "lib1" }, COOKIE)).rejects.toBe(
      "AxiosError:ERR_BAD_RESPONSE status:500 code:9 message:bad query"
    );
  });

  // The timeout is not visible on the wire, so this is the one spy: it observes the 4th argument and still
  // lets the real call go to nock.
  test.each([
    ["no timeout gives the default", undefined, DEFAULT_TIMEOUT_MS],
    ["a timeout of 1000 gives 1000 plus the 5000 buffer", 1000, 1000 + TIMEOUT_BUFFER_MS],
    ["a timeout of 0 is treated as unset", 0, DEFAULT_TIMEOUT_MS],
  ])("%s", async (_name, timeout, expected) => {
    nock(API_HOST).post(EXECUTE_PATH).reply(STATUS_OK, {});
    const post = jest.spyOn(Api, "post");

    await QueryApi.executeQuery({ libraryQueryName: "lib1" }, COOKIE, timeout);

    expect(post).toHaveBeenCalledTimes(1);
    expect(post.mock.calls[0][3]).toMatchObject({ timeout: expected, headers: { Cookie: COOKIE } });
  });
});
