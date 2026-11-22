import http from "http";
import { AddressInfo } from "net";
import nock from "nock";
import { ServiceError } from "../../common/error";
import faunaPlugin from "../fauna";
import gitlabPlugin from "../gitlab";
import shopifyPlugin from "../shopify";
import { runGraphQL } from "./run";

/**
 * GraphQL plugins: runGraphQL (graphql-request) and the fauna, gitlab and shopify plugins on top of it.
 * graphql-request 6 goes through node-fetch, so nock intercepts it: fauna (fixed https endpoints) uses
 * nock; runGraphQL, gitlab and shopify (configurable endpoint) use a local http server on an ephemeral
 * port. Nothing leaves the process. console.info (runGraphQL logs every error) is silenced.
 */

const STATUS_OK = 200;
const STATUS_BAD_REQUEST = 400;
const STATUS_SERVER_ERROR = 500;
const QUERY = "query Q($id: ID!) { thing(id: $id) { name } }";
const OPERATION_NAME = "Q"; // graphql-request adds the parsed operation name
const DATA = { thing: { name: "n" } };
const API_KEY = "fauna-key";
const GITLAB_TOKEN = "glpat-123";
const PROXY_ENV_KEYS = ["HTTP_PROXY", "http_proxy", "HTTPS_PROXY", "https_proxy", "NO_PROXY", "no_proxy"];
const CTX = { languages: ["en"] } as any;
const FAUNA_ENDPOINTS: Record<string, { origin: string; path: string }> = {
  us: { origin: "https://graphql.us.fauna.com", path: "/graphql" },
  es: { origin: "https://graphql.eu.fauna.com", path: "/graphql" },
  classic: { origin: "https://graphql.fauna.com", path: "/graphql" },
  preview: { origin: "https://graphql.fauna-preview.com", path: "/graphql" },
};

type Captured = { method?: string; url?: string; headers: http.IncomingHttpHeaders; body: any };
let server: http.Server;
let endpoint: string;
let captured: Captured[];
let respond: (req: http.IncomingMessage, res: http.ServerResponse) => void;
let infoSpy: jest.SpyInstance;
const savedEnv: Record<string, string | undefined> = {};

const jsonReply = (status: number, body: unknown) => (_req: http.IncomingMessage, res: http.ServerResponse) => {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(body));
};

beforeAll(async () => {
  server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      captured.push({ method: req.method, url: req.url, headers: req.headers, body: JSON.parse(Buffer.concat(chunks).toString("utf8")) });
      respond(req, res);
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  endpoint = `http://127.0.0.1:${(server.address() as AddressInfo).port}/graphql`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

beforeEach(() => {
  captured = [];
  respond = jsonReply(STATUS_OK, { data: DATA });
  for (const k of PROXY_ENV_KEYS) {
    savedEnv[k] = process.env[k];
    delete process.env[k];
  }
  infoSpy = jest.spyOn(console, "info").mockImplementation(() => undefined);
  nock.disableNetConnect();
  nock.enableNetConnect("127.0.0.1"); // only the local test server; any other host fails instead of reaching the network
});

afterEach(() => {
  for (const k of PROXY_ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
  nock.cleanAll();
  nock.enableNetConnect();
  infoSpy.mockRestore();
});

const kv = (key: string, value: unknown) => ({ key, value });
const actionOf = (overrides: Record<string, unknown> = {}) => ({ actionName: "query", query: QUERY, variables: [kv("id", "7")], headers: [], ...overrides } as any);

describe("runGraphQL", () => {
  test("posts query and variables with the headers and returns data", async () => {
    const result = await runGraphQL(endpoint, QUERY, { id: "7" }, { "X-Custom": "c" });
    expect(result).toEqual(DATA);
    expect(captured).toHaveLength(1);
    expect(captured[0].method).toBe("POST");
    expect(captured[0].url).toBe("/graphql");
    expect(captured[0].body).toEqual({ operationName: OPERATION_NAME, query: QUERY, variables: { id: "7" } });
    expect(captured[0].headers["x-custom"]).toBe("c");
    expect(captured[0].headers["content-type"]).toMatch(/application\/json/);
  });

  test("a GraphQL error response becomes a 400 ServiceError carrying its message", async () => {
    respond = jsonReply(STATUS_OK, { errors: [{ message: "Cannot query field \"nope\"" }] });
    const error: any = await runGraphQL(endpoint, QUERY, {}, {}).catch((e: any) => e);
    expect(error).toBeInstanceOf(ServiceError);
    expect(error.code).toBe(STATUS_BAD_REQUEST);
    expect(error.message).toContain("Cannot query field \"nope\"");
  });

  test("a non-2xx GraphQL error response is also a 400", async () => {
    respond = jsonReply(STATUS_SERVER_ERROR, { errors: [{ message: "internal" }] });
    const error: any = await runGraphQL(endpoint, QUERY, {}, {}).catch((e: any) => e);
    expect(error).toBeInstanceOf(ServiceError);
    expect(error.code).toBe(STATUS_BAD_REQUEST);
    expect(error.message).toContain("internal");
  });

  test("a network failure is re-thrown and is not a 400 ServiceError", async () => {
    respond = (req) => req.socket.destroy();
    const error: any = await runGraphQL(endpoint, QUERY, {}, {}).catch((e: any) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(ServiceError);
    expect(infoSpy).toHaveBeenCalled();
  });
});

describe("fauna", () => {
  test.each(Object.entries(FAUNA_ENDPOINTS).map(([region, t]) => [region, `${t.origin}${t.path}`, t]))("region %s posts to %s", async (region, _url, target) => {
    const t = target as { origin: string; path: string };
    const scope = nock(t.origin).post(t.path).reply(STATUS_OK, { data: DATA });
    await expect(faunaPlugin.run(actionOf(), { region: region as string, apiKey: API_KEY } as any, CTX)).resolves.toEqual(DATA);
    expect(scope.isDone()).toBe(true);
  });

  test("sends Authorization: Bearer <apiKey>, the query headers, and the variables from key-value lists; empty values are dropped", async () => {
    let seenHeaders: Record<string, unknown> = {};
    let seenBody: any;
    nock(FAUNA_ENDPOINTS.us.origin)
      .post(FAUNA_ENDPOINTS.us.path, (body) => ((seenBody = body), true))
      .reply(function () {
        seenHeaders = this.req.headers;
        return [STATUS_OK, { data: DATA }];
      });
    await faunaPlugin.run(
      actionOf({
        variables: [kv("id", "7"), kv("empty", ""), kv("name", "n")],
        headers: [kv("X-Trace", "t1"), kv("X-Empty", ""), kv("Authorization", "Bearer user-supplied")],
      }),
      { region: "us", apiKey: API_KEY } as any,
      CTX
    );
    expect(seenBody).toEqual({ operationName: OPERATION_NAME, query: QUERY, variables: { id: "7", name: "n" } });
    expect(String(seenHeaders["x-trace"])).toBe("t1");
    expect(seenHeaders["x-empty"]).toBeUndefined();
    // the data source key always wins over a query-level Authorization header
    expect(String(seenHeaders["authorization"])).toBe(`Bearer ${API_KEY}`);
  });

  test("a GraphQL error response is a 400", async () => {
    nock(FAUNA_ENDPOINTS.us.origin).post(FAUNA_ENDPOINTS.us.path).reply(STATUS_OK, { errors: [{ message: "bad" }] });
    await expect(faunaPlugin.run(actionOf(), { region: "us", apiKey: API_KEY } as any, CTX)).rejects.toMatchObject({ code: STATUS_BAD_REQUEST });
  });

  test("the region select offers the regions us, eu, classic and preview", () => {
    const region = (faunaPlugin.dataSourceConfig as any).params.find((p: any) => p.key === "region");
    expect(region.options.map((o: any) => o.value)).toEqual(["us", "eu", "classic", "preview"]);
  });

  // B40: fauna/index.ts:15 offers the region value "eu" in the UI select,
  // but the endpoint table (fauna/index.ts:34) is keyed "es". Region "eu" therefore resolves to an undefined
  // endpoint. The test asserts the CORRECT behaviour: the EU region posts to the EU endpoint.
  test.failing("B40: fauna region eu resolves an endpoint", async () => {
    const scope = nock("https://graphql.eu.fauna.com").post("/graphql").reply(STATUS_OK, { data: DATA });
    await expect(faunaPlugin.run(actionOf(), { region: "eu", apiKey: API_KEY } as any, CTX)).resolves.toEqual(DATA);
    expect(scope.isDone()).toBe(true);
  });
});

describe("gitlab", () => {
  const dataSource = (headers: unknown[] = []) => ({ endpoint, token: GITLAB_TOKEN, headers } as any);

  test("posts to the endpoint with the variables and returns data", async () => {
    await expect(gitlabPlugin.run(actionOf(), dataSource(), CTX)).resolves.toEqual(DATA);
    expect(captured[0].body).toEqual({ operationName: OPERATION_NAME, query: QUERY, variables: { id: "7" } });
    expect(captured[0].headers["private-token"]).toBe(GITLAB_TOKEN);
  });

  test("headers: data source defaults, then query headers, then PRIVATE-TOKEN; later sources override earlier ones, the token always wins", async () => {
    await gitlabPlugin.run(
      actionOf({ headers: [kv("X-Shared", "from-query"), kv("X-Query", "q"), kv("PRIVATE-TOKEN", "user-supplied"), kv("X-Blank", "")] }),
      dataSource([kv("X-Shared", "from-default"), kv("X-Default", "d")]),
      CTX
    );
    const headers = captured[0].headers;
    expect(headers["x-default"]).toBe("d");
    expect(headers["x-query"]).toBe("q");
    expect(headers["x-shared"]).toBe("from-query");
    expect(headers["x-blank"]).toBeUndefined();
    expect(headers["private-token"]).toBe(GITLAB_TOKEN);
  });

  // kvToRecord used to drop every falsy value, so the variables 0 and false never reached the server
  test("B41: GraphQL variables 0 and false are sent", async () => {
    await gitlabPlugin.run(actionOf({ variables: [kv("offset", 0), kv("flag", false)] }), dataSource(), CTX);
    expect(captured[0].body.variables).toEqual({ offset: 0, flag: false });
  });

  test("a query header whose value is the number 0 is sent as \"0\"", async () => {
    await gitlabPlugin.run(actionOf({ headers: [kv("X-Zero", 0), kv("X-Blank", "")] }), dataSource(), CTX);
    expect(captured[0].headers["x-zero"]).toBe("0");
    expect(captured[0].headers["x-blank"]).toBeUndefined();
  });

  test("a GraphQL error response is a 400", async () => {
    respond = jsonReply(STATUS_OK, { errors: [{ message: "401 Unauthorized" }] });
    await expect(gitlabPlugin.run(actionOf(), dataSource(), CTX)).rejects.toMatchObject({ code: STATUS_BAD_REQUEST });
  });
});

describe("shopify", () => {
  const dataSource = () => ({ endpoint } as any);

  test("posts to the endpoint with the variables and returns data", async () => {
    await expect(shopifyPlugin.run(actionOf(), dataSource(), CTX)).resolves.toEqual(DATA);
    expect(captured).toHaveLength(1);
    expect(captured[0].url).toBe("/graphql");
    expect(captured[0].body).toEqual({ operationName: OPERATION_NAME, query: QUERY, variables: { id: "7" } });
  });

  test("a GraphQL error response is a 400", async () => {
    respond = jsonReply(STATUS_OK, { errors: [{ message: "Throttled" }] });
    await expect(shopifyPlugin.run(actionOf(), dataSource(), CTX)).rejects.toMatchObject({ code: STATUS_BAD_REQUEST });
  });

  // SUSPECTED BUG B18 (shopify/index.ts:29-31): the query headers are destructured but dropped.
  test.failing("B18: shopify forwards the query headers", async () => {
    await shopifyPlugin.run(actionOf({ headers: [kv("X-Shopify-Access-Token", "shpat_1")] }), dataSource(), CTX);
    expect(captured[0].headers["x-shopify-access-token"]).toBe("shpat_1");
  });
});
