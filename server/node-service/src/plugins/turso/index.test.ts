import http from "http";
import { AddressInfo } from "net";
import { ServiceError } from "../../common/error";
import tursoPlugin from "./index";

/**
 * turso plugin. The plugin calls the global `fetch` (nock does not intercept it), so the real HTTP
 * contract (Hrana pipeline body, Bearer token) is checked against a local http server on an ephemeral
 * port. The libsql:// -> https:// rewrite cannot be observed against a plain-http local server, so that
 * one case spies on global fetch and returns a canned Response (nothing leaves the process).
 */

const STATUS_OK = 200;
const STATUS_UNAUTHORIZED = 401;
const PIPELINE_PATH = "/v2/pipeline";
const TOKEN = "tok-123";
const SQL = "select id, name from t";
const CTX = { languages: ["en"] } as any;

type Captured = { method?: string; url?: string; headers: http.IncomingHttpHeaders; body: any };
let server: http.Server;
let baseUrl: string;
let captured: Captured[];
let reply: { status: number; statusText?: string; body: unknown };

beforeAll(async () => {
  server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      captured.push({ method: req.method, url: req.url, headers: req.headers, body: JSON.parse(Buffer.concat(chunks).toString("utf8")) });
      res.statusCode = reply.status;
      if (reply.statusText) res.statusMessage = reply.statusText;
      res.setHeader("content-type", "application/json");
      res.end(typeof reply.body === "string" ? reply.body : JSON.stringify(reply.body));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

beforeEach(() => {
  captured = [];
  reply = { status: STATUS_OK, body: pipelineOf([], []) };
});

afterEach(() => {
  jest.restoreAllMocks();
});

type Cell = { type: string; value?: string };
function pipelineOf(cols: { name: string; decltype: string }[], rows: Cell[][]) {
  return {
    baton: null,
    base_url: null,
    results: [
      { type: "ok", response: { type: "execute", result: { cols, rows, affected_row_count: 0, last_insert_rowid: null } } },
      { type: "ok", response: { type: "close" } },
    ],
  };
}

const runQuery = (queryString: string, includeRaw: boolean, url = baseUrl) =>
  tursoPlugin.run!({ actionName: "Query", queryString, includeRaw } as any, { url, token: TOKEN } as any, CTX);

describe("request", () => {
  test("posts the Hrana pipeline to <url>/v2/pipeline with the Bearer token", async () => {
    await runQuery(SQL, false);
    expect(captured).toHaveLength(1);
    expect(captured[0].method).toBe("POST");
    expect(captured[0].url).toBe(PIPELINE_PATH);
    expect(captured[0].headers.authorization).toBe(`Bearer ${TOKEN}`);
    expect(captured[0].headers["content-type"]).toBe("application/json");
    expect(captured[0].body).toEqual({ requests: [{ type: "execute", stmt: { sql: SQL } }, { type: "close" }] });
  });

  test("libsql://db.turso.io is rewritten to https://db.turso.io", async () => {
    const fetchSpy = jest
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(pipelineOf([], [])), { status: STATUS_OK }));
    await runQuery(SQL, false, "libsql://db.turso.io");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe("https://db.turso.io/v2/pipeline");
  });
});

describe("errors", () => {
  test("a non-2xx response gives ServiceError 'Failed to execute query. Endpoint returned 401: Unauthorized.'", async () => {
    reply = { status: STATUS_UNAUTHORIZED, statusText: "Unauthorized", body: {} };
    const error = await runQuery(SQL, false).catch((e) => e);
    expect(error).toBeInstanceOf(ServiceError);
    expect(error.message).toBe("Failed to execute query. Endpoint returned 401: Unauthorized.");
  });

  test("results[0].type === 'error' gives ServiceError 'Cannot parse result, received error: ...'", async () => {
    reply = { status: STATUS_OK, body: { baton: null, base_url: null, results: [{ type: "error", error: "no such table: t" }] } };
    const error = await runQuery(SQL, false).catch((e) => e);
    expect(error).toBeInstanceOf(ServiceError);
    expect(error.message).toBe("Cannot parse result, received error: no such table: t");
  });
});

describe("value parsing", () => {
  const cols = (decltype: string) => [{ name: "c", decltype }];
  const valuesOf = async (decltype: string, cell: Cell) => {
    reply = { status: STATUS_OK, body: pipelineOf(cols(decltype), [[cell]]) };
    return (await runQuery(SQL, false)) as Record<string, unknown>[];
  };

  test("integer becomes a number", async () => {
    expect(await valuesOf("integer", { type: "integer", value: "42" })).toEqual([{ c: 42 }]);
  });

  test("integer with decltype boolean becomes a boolean", async () => {
    expect(await valuesOf("boolean", { type: "integer", value: "1" })).toEqual([{ c: true }]);
    expect(await valuesOf("boolean", { type: "integer", value: "0" })).toEqual([{ c: false }]);
  });

  test("float becomes a number", async () => {
    expect(await valuesOf("float", { type: "float", value: "2.5" })).toEqual([{ c: 2.5 }]);
  });

  test.each(["date", "datetime"])("text with decltype %s becomes a Date", async (decltype) => {
    const rows = await valuesOf(decltype, { type: "text", value: "2024-01-02T03:04:05.000Z" });
    expect(rows[0].c).toBeInstanceOf(Date);
    expect((rows[0].c as Date).toISOString()).toBe("2024-01-02T03:04:05.000Z");
  });

  test("an empty date text is kept as it is", async () => {
    expect(await valuesOf("date", { type: "text", value: "" })).toEqual([{ c: "" }]);
  });

  test("null becomes null", async () => {
    expect(await valuesOf("text", { type: "null" })).toEqual([{ c: null }]);
  });

  test("other types pass through (plain text, blob)", async () => {
    expect(await valuesOf("text", { type: "text", value: "hello" })).toEqual([{ c: "hello" }]);
    expect(await valuesOf("blob", { type: "blob", value: "AAEC" })).toEqual([{ c: "AAEC" }]);
  });

  test("columns of a row are merged by name, one object per row", async () => {
    reply = {
      status: STATUS_OK,
      body: pipelineOf(
        [{ name: "id", decltype: "integer" }, { name: "name", decltype: "text" }],
        [[{ type: "integer", value: "1" }, { type: "text", value: "a" }], [{ type: "integer", value: "2" }, { type: "text", value: "b" }]]
      ),
    };
    expect(await runQuery(SQL, false)).toEqual([{ id: 1, name: "a" }, { id: 2, name: "b" }]);
  });
});

describe("includeRaw", () => {
  const cols = [{ name: "id", decltype: "integer" }];
  const rows = [[{ type: "integer", value: "7" }]];

  test("true returns {values, raw} with the raw result set", async () => {
    const body = pipelineOf(cols, rows);
    reply = { status: STATUS_OK, body };
    const result: any = await runQuery(SQL, true);
    expect(result.values).toEqual([{ id: 7 }]);
    expect(result.raw).toEqual((body.results[0] as any).response.result);
  });

  test("false returns the values only", async () => {
    reply = { status: STATUS_OK, body: pipelineOf(cols, rows) };
    expect(await runQuery(SQL, false)).toEqual([{ id: 7 }]);
  });

  test("a missing result gives undefined", async () => {
    reply = { status: STATUS_OK, body: { baton: null, base_url: null, results: [{ type: "ok", response: { type: "execute" } }] } };
    await expect(runQuery(SQL, true)).resolves.toBeUndefined();
    await expect(runQuery(SQL, false)).resolves.toBeUndefined();
  });
});
