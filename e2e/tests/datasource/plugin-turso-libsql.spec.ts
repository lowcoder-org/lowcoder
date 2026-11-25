import { randomBytes } from "node:crypto";
import { connect } from "node:net";
import type { Page } from "@playwright/test";
import { createApp, createNodePluginDatasource, executeAppQueryRaw, type RawAnswer, type RegisteredUser } from "../../src/api/client";
import { API_OK, LIBSQL, TAGS } from "../../src/constants";
import { appDsl, button, nodePluginQuery, stackItems } from "../../src/dsl/builders";
import { recordedPluginDatasource, recordedPluginQuery } from "../../src/dsl/recorded";
import { boundText, boundTextTestId, openSeededView } from "../../src/components/scenario";
import { libsqlConnection, libsqlDirect, type LibsqlConnection } from "../../src/datasource/libsql";
import { expect, test } from "../../src/fixtures";

/**
 * D13: the Turso plugin of node-service (`server/node-service/src/plugins/turso/index.ts`, the plugin id `turso`) run against a REAL libSQL
 * server, sqld, the sidecar of the run (`scripts/run-in-docker.sh` starts it only with `E2E_INCLUDE_NODE_SERVICE_SIDECARS=1`; image and
 * authentication in the README, "libSQL sidecar"). D5 runs the same plugin against the echo's canned answers; here the answers are the
 * server's own. Every connection of these tests goes to the sidecar: the data source URL is `http://<alias>:8080` from `E2E_LIBSQL_HOST`
 * (plain HTTP, so the plugin's `libsql://` to `https://` rewrite does not apply), never a placeholder. Each test makes its own table, named
 * by a per-test marker, so parallel tests share nothing; the server keeps every table until the run ends.
 *
 * "Direct" calls (`libsqlDirect`) post the same pipeline from the test process to the sidecar. They are the controls that show what the
 * server itself answers, next to what the plugin makes of it for the app.
 *
 * Measured on the images `3.0.0-e2e` and `3.0.1-e2e` against sqld 0.24.33:
 * - A cell is `{type, value}`: `integer` carries its value as a STRING, `float` as a number, `text` as text, `null` has no value, a `blob`
 *   carries `base64` and no `value`. The column's `decltype` is the declared type as written in the CREATE TABLE (its case is kept),
 *   `null` for an expression.
 * - The plugin makes an `integer` a number (a `boolean` column, written in lower case, a boolean), a `float` a number, a `datetime` or `date`
 *   column's text a `Date` (an ISO string in the answer), a `null` `null`. A blob cell becomes a value of `undefined`, so the key is
 *   missing from the row (D-79 candidate). An integer beyond 2^53 is parsed with `parseInt` and loses its low digits (D-80 candidate).
 * - A SQL error is answered by the server with HTTP 200 and `results[0] = { type: "error", error: { message, code } }`; the plugin prints it
 *   as `[object Object]` (D-66 candidate, the defect D5d shows against a canned answer).
 * - A bad token is HTTP 401 `Unauthorized`; a read-only token that writes is HTTP 403 `Forbidden`; both fail the query with the plugin's
 *   `Endpoint returned <status>: <statusText>.`
 *
 * Not covered: the `libsql://` to `https://` rewrite of the URL (the sidecar speaks plain HTTP and the rewritten URL is https, so it cannot
 * be exercised here); Turso's cloud features (branches, groups, per-database tokens); a stream with a baton (the plugin always closes).
 */
/** Candidate defect: an `error` result of the pipeline is printed as `${result.error}` (an object): the server's own message never reaches the app. */
const ERROR_TEXT_DEFECT = { type: "defect", description: "D-66 candidate" } as const;
/** Candidate defect: the cell of a `blob` has `base64` and no `value`, so the plugin answers the column as `undefined`: the key is missing from the row. */
const BLOB_DEFECT = { type: "defect", description: "D-79 candidate" } as const;
/** Candidate defect: an `integer` cell is parsed with `Number.parseInt`, so an integer the JavaScript number cannot hold exactly is rounded. */
const BIG_INTEGER_DEFECT = { type: "defect", description: "D-80 candidate" } as const;

/** What the plugin prints for an `error` result (measured): the error object is printed as `[object Object]`. */
const MEASURED_ERROR_TEXT = "Cannot parse result, received error: [object Object]";

const HTTP_OK = 200;
const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;
const QUERY_CODE_OK = "OK";
const QUERY_CODE_FAILED = "FAILED";
const MARKER_BYTES = 4;
const QUERY_ID = "q1";
const QUERY_NAME = "q";

/** The plugin's text for a non-OK pipeline answer (`Failed to execute query. Endpoint returned <status>: <statusText>.`). */
function endpointReturned(status: number, statusText: string): string {
  return `Failed to execute query. Endpoint returned ${status}: ${statusText}.`;
}

/** A token that is no JWT at all, for a data source whose token field holds anything. */
const MALFORMED_TOKEN = "e2e-not-a-jwt";

/** The server's own answers to what these tests send (sqld 0.24.33): the `error` object of a failed statement, and the body of a refused request. */
const SERVER_ERROR_CODES = {
  PARSE: "SQL_PARSE_ERROR",
  INPUT: "SQL_INPUT_ERROR",
  CONSTRAINT: "SQLITE_CONSTRAINT",
  MANY_STATEMENTS: "SQL_MANY_STATEMENTS",
} as const;
const SERVER_UNAUTHORIZED_BODY = { error: "Unauthorized: `The JWT is invalid`" };
const SERVER_NO_HEADER_BODY = { error: "Unauthorized: `Expected authorization header but none given`" };
const SERVER_READ_ONLY_BODY = { error: "Authorization forbidden: Current session doesn't not have Write permission to namespace default" };

/** A port of the sidecar's host where nothing listens: the control that a refused connection is seen as one. */
const CLOSED_PORT = 8081;
const CONNECT_TIMEOUT_MS = 5000;

/** The largest integer a JavaScript number holds exactly, plus one: the server stores it exactly, the plugin rounds it down to the even neighbour below. */
const BEYOND_SAFE = "9007199254740993";
const BEYOND_SAFE_AS_PARSED = 9007199254740992;

/** The envelope of `POST /api/query/execute` (`QueryResultView`), the fields these tests read. */
interface QueryEnvelope {
  success?: boolean;
  queryCode?: string;
  message?: string | null;
  data?: unknown;
}

function envelopeOf(answer: RawAnswer): QueryEnvelope {
  return answer.json as QueryEnvelope;
}

function uniqueMarker(): string {
  return randomBytes(MARKER_BYTES).toString("hex");
}

/** A table name of this test only (an SQL identifier: letters, digits and underscores). */
function uniqueTable(): string {
  return `e2e_t_${uniqueMarker()}`;
}

/** One saved query: the SQL, and whether the form's "Include raw" switch is on. */
interface TursoQuery {
  queryString: string;
  includeRaw?: boolean;
}

/** The data source fields of the sidecar over the recorded form body; `overrides` change the URL or the token. */
function sidecarConfig(overrides: Partial<LibsqlConnection> = {}): LibsqlConnection {
  return { ...libsqlConnection(), ...overrides };
}

async function tursoDatasource(page: Page, apiUser: RegisteredUser, overrides: Partial<LibsqlConnection> = {}): Promise<string> {
  return createNodePluginDatasource(page.request, { orgId: apiUser.orgId, recorded: recordedPluginDatasource("turso"), config: { ...sidecarConfig(overrides) } });
}

function savedQueries(datasourceId: string, queries: Record<string, TursoQuery>): ReturnType<typeof nodePluginQuery>[] {
  return Object.entries(queries).map(([id, query]) =>
    nodePluginQuery({ id, name: id, datasourceId, recorded: recordedPluginQuery("turso"), action: { queryString: query.queryString, includeRaw: query.includeRaw ?? false } }),
  );
}

/** A saved app with one manual Turso query per entry of `queries` on one data source (not published: the draft runs with `viewMode: false`). */
async function tursoApp(page: Page, apiUser: RegisteredUser, queries: Record<string, TursoQuery>, overrides: Partial<LibsqlConnection> = {}): Promise<string> {
  const datasourceId = await tursoDatasource(page, apiUser, overrides);
  const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-turso-libsql", dsl: appDsl([], { queries: savedQueries(datasourceId, queries) }) });
  return appId;
}

async function runDraft(page: Page, appId: string, queryId: string): Promise<RawAnswer> {
  return executeAppQueryRaw(page.request, { applicationId: appId, queryId, viewMode: false });
}

function expectRan(answer: RawAnswer): void {
  expect({ status: answer.status, code: answer.code }, "the query request was answered").toEqual({ status: HTTP_OK, code: API_OK });
}

function expectSucceeded(answer: RawAnswer): void {
  expectRan(answer);
  expect(envelopeOf(answer).success, "the query succeeded").toBe(true);
  expect(envelopeOf(answer).queryCode, "the query code").toBe(QUERY_CODE_OK);
}

function expectFailed(answer: RawAnswer, message: string): void {
  expectRan(answer);
  expect(
    { success: envelopeOf(answer).success, queryCode: envelopeOf(answer).queryCode, message: envelopeOf(answer).message, data: envelopeOf(answer).data },
    "the query failed with the measured message",
  ).toEqual({ success: false, queryCode: QUERY_CODE_FAILED, message, data: null });
}

/** The first result of a direct pipeline answer, which must be the HTTP 200 answer of the server. */
function firstResultOf(answer: { status: number; body: unknown }): unknown {
  expect(answer.status, "the direct call was answered with 200").toBe(HTTP_OK);
  return (answer.body as { results: unknown[] }).results[0];
}

/** Runs setup SQL straight on the sidecar (test-owned tables only) and checks that the server accepted it. */
async function setUpDirect(sql: string): Promise<void> {
  const answer = await libsqlDirect(libsqlConnection(), sql, libsqlConnection().token);
  expect((firstResultOf(answer) as { type: string }).type, `the server executed: ${sql}`).toBe("ok");
}

/** How a TCP connection to `host:port` ended: `connected`, or the error code Node reports (`ECONNREFUSED`, ...). */
async function tcpOutcome(host: string, port: number): Promise<string> {
  return new Promise((resolve) => {
    const socket = connect({ host, port });
    socket.setTimeout(CONNECT_TIMEOUT_MS, () => {
      socket.destroy();
      resolve("timeout");
    });
    socket.once("connect", () => {
      socket.destroy();
      resolve("connected");
    });
    socket.once("error", (error: NodeJS.ErrnoException) => resolve(error.code ?? error.message));
  });
}

/** The rows of the seeded table of the type round trip, as the plugin answers them (a `datetime` text is a `Date`, here its ISO text). */
const TYPED_ROWS = [
  { id: 1, name: "alpha", price: 1.5, active: true, born: "2024-01-02T03:04:05.000Z", note: null },
  { id: 2, name: "beta", price: 2, active: false, born: null, note: "second" },
] as const;

test.describe("Turso data source against a real libSQL server", { tag: [TAGS.NODE_SERVICE, TAGS.NODE_SERVICE_SIDECAR] }, () => {
  test("D13a: create, insert and select answer typed rows, in the order the SQL sorts them", async ({ page, apiUser }) => {
    const table = uniqueTable();
    const appId = await tursoApp(page, apiUser, {
      create: { queryString: `CREATE TABLE ${table} (id INTEGER PRIMARY KEY, name TEXT, price REAL, active boolean, born datetime, note TEXT)` },
      insertAlpha: { queryString: `INSERT INTO ${table} VALUES (1, 'alpha', 1.5, 1, '2024-01-02T03:04:05Z', NULL)` },
      insertBeta: { queryString: `INSERT INTO ${table} VALUES (2, 'beta', 2, 0, NULL, 'second')` },
      select: { queryString: `SELECT id, name, price, active, born, note FROM ${table} ORDER BY id` },
    });

    const created = await runDraft(page, appId, "create");
    const empty = await runDraft(page, appId, "select");
    const alpha = await runDraft(page, appId, "insertAlpha");
    const beta = await runDraft(page, appId, "insertBeta");
    const rows = await runDraft(page, appId, "select");

    expectSucceeded(created);
    expect(envelopeOf(created).data, "a CREATE TABLE answers no rows").toEqual([]);
    expectSucceeded(empty);
    expect(envelopeOf(empty).data, "before the inserts the new table is empty").toEqual([]);
    expectSucceeded(alpha);
    expect(envelopeOf(alpha).data, "an INSERT answers no rows").toEqual([]);
    expectSucceeded(beta);
    expectSucceeded(rows);
    // integer -> number, real -> number (2 stays 2), a lower-case `boolean` column -> boolean, `datetime` text -> Date (ISO text), NULL -> null
    expect(envelopeOf(rows).data, "the two rows with every column mapped").toEqual(TYPED_ROWS);
  });

  test("D13b: includeRaw answers the values and the server's own result set", async ({ page, apiUser }) => {
    const table = uniqueTable();
    await setUpDirect(`CREATE TABLE ${table} (id INTEGER PRIMARY KEY, name TEXT)`);
    await setUpDirect(`INSERT INTO ${table} VALUES (7, 'raw')`);
    const appId = await tursoApp(page, apiUser, { raw: { queryString: `SELECT id, name FROM ${table}`, includeRaw: true } });

    const answer = await runDraft(page, appId, "raw");

    expectSucceeded(answer);
    const data = envelopeOf(answer).data as { values: unknown; raw: Record<string, unknown> };
    expect(Object.keys(data).sort(), "both keys are present").toEqual(["raw", "values"]);
    expect(data.values, "the values").toEqual([{ id: 7, name: "raw" }]);
    // the cells are the server's: an integer's value is a STRING, the declared types are kept
    expect(data.raw.cols, "the columns with their declared types").toEqual([
      { name: "id", decltype: "INTEGER" },
      { name: "name", decltype: "TEXT" },
    ]);
    expect(data.raw.rows, "the cells as the server sends them").toEqual([[{ type: "integer", value: "7" }, { type: "text", value: "raw" }]]);
    expect(Object.keys(data.raw).sort(), "the result set's fields").toEqual(
      ["affected_row_count", "cols", "last_insert_rowid", "query_duration_ms", "replication_index", "rows", "rows_read", "rows_written"],
    );
    expect(data.raw.affected_row_count, "a SELECT changes no row").toBe(0);
    expect(typeof data.raw.query_duration_ms, "the server's own timing").toBe("number");
  });

  test("D13c: a write answers no values, and its raw result counts the change and names the new row id", async ({ page, apiUser }) => {
    const table = uniqueTable();
    await setUpDirect(`CREATE TABLE ${table} (id INTEGER PRIMARY KEY, name TEXT)`);
    const appId = await tursoApp(page, apiUser, {
      plain: { queryString: `INSERT INTO ${table} (name) VALUES ('first')` },
      raw: { queryString: `INSERT INTO ${table} (name) VALUES ('second')`, includeRaw: true },
      count: { queryString: `SELECT COUNT(*) AS n FROM ${table}` },
    });

    const plain = await runDraft(page, appId, "plain");
    const raw = await runDraft(page, appId, "raw");
    const count = await runDraft(page, appId, "count");

    expectSucceeded(plain);
    expect(envelopeOf(plain).data, "an INSERT without includeRaw answers an empty list").toEqual([]);
    expectSucceeded(raw);
    const data = envelopeOf(raw).data as { values: unknown; raw: Record<string, unknown> };
    expect(data.values, "an INSERT answers no values with includeRaw either").toEqual([]);
    // the second insert took the next id: `last_insert_rowid` is a string like every 64-bit integer of the protocol
    expect({ affected: data.raw.affected_row_count, lastId: data.raw.last_insert_rowid, rows: data.raw.rows, cols: data.raw.cols }, "the write's counters").toEqual({
      affected: 1,
      lastId: "2",
      rows: [],
      cols: [],
    });
    expectSucceeded(count);
    expect(envelopeOf(count).data, "both inserts reached the table (a COUNT is an expression: no declared type, still a number)").toEqual([{ n: 2 }]);
  });

  test("D13d: a blob cell is dropped from the row", { annotation: BLOB_DEFECT }, async ({ page, apiUser }) => {
    const table = uniqueTable();
    await setUpDirect(`CREATE TABLE ${table} (id INTEGER PRIMARY KEY, data BLOB)`);
    await setUpDirect(`INSERT INTO ${table} VALUES (1, x'00ff10')`);
    const appId = await tursoApp(page, apiUser, {
      values: { queryString: `SELECT id, data FROM ${table}` },
      raw: { queryString: `SELECT id, data FROM ${table}`, includeRaw: true },
    });

    const values = await runDraft(page, appId, "values");
    const raw = await runDraft(page, appId, "raw");

    expectSucceeded(raw);
    // positive control: the server did send the blob (base64 of the bytes 00 ff 10), and the plugin read its other cell
    const rawData = envelopeOf(raw).data as { raw: { rows: unknown } };
    expect(rawData.raw.rows, "the server's cells").toEqual([[{ type: "integer", value: "1" }, { type: "blob", base64: "AP8Q" }]]);
    expectSucceeded(values);
    // D-79 candidate: the blob has no `value`, so the column is `undefined` and the key is missing
    expect(envelopeOf(values).data, "the row holds the id and not the blob").toEqual([{ id: 1 }]);
  });

  test("D13e: an integer beyond 2^53 is rounded by the plugin and exact in the server's result", { annotation: BIG_INTEGER_DEFECT }, async ({ page, apiUser }) => {
    const appId = await tursoApp(page, apiUser, {
      values: { queryString: `SELECT ${BEYOND_SAFE} AS big` },
      raw: { queryString: `SELECT ${BEYOND_SAFE} AS big`, includeRaw: true },
    });

    const values = await runDraft(page, appId, "values");
    const raw = await runDraft(page, appId, "raw");

    expectSucceeded(raw);
    const rawData = envelopeOf(raw).data as { raw: { rows: unknown } };
    expect(rawData.raw.rows, "positive control: the server holds the exact integer, as a string").toEqual([[{ type: "integer", value: BEYOND_SAFE }]]);
    expectSucceeded(values);
    // D-80 candidate: 9007199254740993 is not a JavaScript number; parseInt rounds it
    expect(envelopeOf(values).data, "the plugin's number").toEqual([{ big: BEYOND_SAFE_AS_PARSED }]);
  });

  test("D13f: a SQL error of the server fails the query with [object Object]", { annotation: ERROR_TEXT_DEFECT }, async ({ page, apiUser }) => {
    const table = uniqueTable();
    const sidecar = libsqlConnection();
    const appId = await tursoApp(page, apiUser, {
      create: { queryString: `CREATE TABLE ${table} (id INTEGER PRIMARY KEY)` },
      insert: { queryString: `INSERT INTO ${table} VALUES (1)` },
      syntax: { queryString: "SELEC 1" },
      column: { queryString: `SELECT nope FROM ${table}` },
      duplicate: { queryString: `INSERT INTO ${table} VALUES (1)` },
      many: { queryString: "SELECT 1; SELECT 2" },
      control: { queryString: `SELECT id FROM ${table}` },
    });
    expectSucceeded(await runDraft(page, appId, "create"));
    expectSucceeded(await runDraft(page, appId, "insert"));

    // what the server itself says for each statement: a real message and a code (the controls that the error exists and is specific)
    const serverErrors: Record<string, unknown> = {};
    for (const [name, sql] of Object.entries({ syntax: "SELEC 1", column: `SELECT nope FROM ${table}`, duplicate: `INSERT INTO ${table} VALUES (1)`, many: "SELECT 1; SELECT 2" })) {
      serverErrors[name] = firstResultOf(await libsqlDirect(sidecar, sql, sidecar.token));
    }
    expect(serverErrors, "the server's own errors").toEqual({
      syntax: { type: "error", error: { message: "SQL string could not be parsed: syntax error around L1:6: `SELEC`", code: SERVER_ERROR_CODES.PARSE } },
      column: { type: "error", error: { message: "SQL input error: no such column: nope (at offset 7)", code: SERVER_ERROR_CODES.INPUT } },
      duplicate: { type: "error", error: { message: `SQLite error: UNIQUE constraint failed: ${table}.id`, code: SERVER_ERROR_CODES.CONSTRAINT } },
      many: { type: "error", error: { message: "SQL string contains more than one statement", code: SERVER_ERROR_CODES.MANY_STATEMENTS } },
    });

    expectSucceeded(await runDraft(page, appId, "control"));
    // D-66 candidate: whatever the server said, the app gets the same text
    for (const name of ["syntax", "column", "duplicate", "many"]) {
      expectFailed(await runDraft(page, appId, name), MEASURED_ERROR_TEXT);
    }
  });

  test("D13g: a token the server does not accept fails the query with the status, and the right token on the same query succeeds", async ({ page, apiUser }) => {
    const table = uniqueTable();
    await setUpDirect(`CREATE TABLE ${table} (id INTEGER PRIMARY KEY)`);
    await setUpDirect(`INSERT INTO ${table} VALUES (1)`);
    const queries = { read: { queryString: `SELECT id FROM ${table}` } };
    const rightApp = await tursoApp(page, apiUser, queries);
    const foreignApp = await tursoApp(page, apiUser, queries, { token: LIBSQL.FOREIGN_TOKEN });
    const malformedApp = await tursoApp(page, apiUser, queries, { token: MALFORMED_TOKEN });
    const sidecar = libsqlConnection();

    const right = await runDraft(page, rightApp, "read");
    const foreign = await runDraft(page, foreignApp, "read");
    const malformed = await runDraft(page, malformedApp, "read");

    expectSucceeded(right);
    expect(envelopeOf(right).data, "positive control: the sidecar's own token reads the row").toEqual([{ id: 1 }]);
    expectFailed(foreign, endpointReturned(HTTP_UNAUTHORIZED, "Unauthorized"));
    expectFailed(malformed, endpointReturned(HTTP_UNAUTHORIZED, "Unauthorized"));
    // the server's reason, from direct calls: a JWT it cannot verify (signed by another key, or no JWT) and no header at all
    const direct = [
      await libsqlDirect(sidecar, `SELECT id FROM ${table}`, LIBSQL.FOREIGN_TOKEN),
      await libsqlDirect(sidecar, `SELECT id FROM ${table}`, MALFORMED_TOKEN),
      await libsqlDirect(sidecar, `SELECT id FROM ${table}`),
    ];
    expect(
      direct.map((answer) => ({ status: answer.status, body: answer.body })),
      "the server's answers to the three refused calls",
    ).toEqual([
      { status: HTTP_UNAUTHORIZED, body: SERVER_UNAUTHORIZED_BODY },
      { status: HTTP_UNAUTHORIZED, body: SERVER_UNAUTHORIZED_BODY },
      { status: HTTP_UNAUTHORIZED, body: SERVER_NO_HEADER_BODY },
    ]);
  });

  test("D13h: a read-only token reads and cannot write: 403 fails the query and no row is written", async ({ page, apiUser }) => {
    const table = uniqueTable();
    await setUpDirect(`CREATE TABLE ${table} (id INTEGER PRIMARY KEY)`);
    await setUpDirect(`INSERT INTO ${table} VALUES (1)`);
    const queries = {
      read: { queryString: `SELECT id FROM ${table} ORDER BY id` },
      write: { queryString: `INSERT INTO ${table} VALUES (2)` },
    };
    const readOnlyApp = await tursoApp(page, apiUser, queries, { token: LIBSQL.READ_ONLY_TOKEN });
    const readWriteApp = await tursoApp(page, apiUser, queries);

    const read = await runDraft(page, readOnlyApp, "read");
    const refused = await runDraft(page, readOnlyApp, "write");
    const stillOne = await runDraft(page, readWriteApp, "read");

    expectSucceeded(read);
    expect(envelopeOf(read).data, "the read-only token reads").toEqual([{ id: 1 }]);
    expectFailed(refused, endpointReturned(HTTP_FORBIDDEN, "Forbidden"));
    expectSucceeded(stillOne);
    expect(envelopeOf(stillOne).data, "the refused INSERT wrote nothing").toEqual([{ id: 1 }]);
    // positive control: the read-write token's INSERT of the same row works, so the refusal was about the token
    expectSucceeded(await runDraft(page, readWriteApp, "write"));
    expect(envelopeOf(await runDraft(page, readWriteApp, "read")).data, "the read-write token writes").toEqual([{ id: 1 }, { id: 2 }]);
    const sidecar = libsqlConnection();
    expect(await libsqlDirect(sidecar, `INSERT INTO ${table} VALUES (3)`, LIBSQL.READ_ONLY_TOKEN), "the server's own answer to the read-only write").toMatchObject({
      status: HTTP_FORBIDDEN,
      body: SERVER_READ_ONLY_BODY,
    });
  });

  test("D13i: the published view shows a row of the server after a click", async ({ page, apiUser }) => {
    const table = uniqueTable();
    const rowName = `row-${uniqueMarker()}`;
    await setUpDirect(`CREATE TABLE ${table} (id INTEGER PRIMARY KEY, name TEXT)`);
    await setUpDirect(`INSERT INTO ${table} VALUES (1, '${rowName}')`);
    const datasourceId = await tursoDatasource(page, apiUser);
    // before the first run `q.data` is not a list
    const expression = `{{${QUERY_NAME}.data ? ${QUERY_NAME}.data[0].name : ""}}`;
    const view = await openSeededView(
      page,
      apiUser.orgId,
      "e2e-turso-libsql-view",
      stackItems([
        button({ id: "b1", name: "button1", text: "Run", testId: "e2e-turso-libsql-run", onClickQuery: QUERY_NAME }),
        boundText({ id: "t1", name: "label", expression }),
        // `success` also reads `true` before the first run (measured, D5e), so only the state after the click proves anything
        boundText({ id: "t2", name: "succeeded", expression: `{{String(${QUERY_NAME}.success)}}` }),
      ]),
      { queries: [nodePluginQuery({ id: QUERY_ID, name: QUERY_NAME, datasourceId, recorded: recordedPluginQuery("turso"), action: { queryString: `SELECT name FROM ${table}` } })] },
    );

    await expect(view.byTestId(boundTextTestId("label")), "before the click the text is empty").toHaveText("");
    await view.buttonByTestId("e2e-turso-libsql-run").click();
    await expect(view.byTestId(boundTextTestId("succeeded")), "after the click the query succeeded").toHaveText("true");
    await expect(view.byTestId(boundTextTestId("label")), "after the click the text shows the server's row").toHaveText(rowName);
  });

  test("D13j: a trailing slash after the URL is a 404 of the server, the same URL without it works", async ({ page, apiUser }) => {
    const sidecar = libsqlConnection();
    const queries = { select: { queryString: "SELECT 1 AS one" } };
    const plainApp = await tursoApp(page, apiUser, queries);
    const slashApp = await tursoApp(page, apiUser, queries, { url: `${sidecar.url}/` });

    const plain = await runDraft(page, plainApp, "select");
    const slash = await runDraft(page, slashApp, "select");

    expectSucceeded(plain);
    expect(envelopeOf(plain).data, "positive control: the URL without the slash").toEqual([{ one: 1 }]);
    // the plugin appends `/v2/pipeline` to the text it was given: `http://host:8080//v2/pipeline` is a path the server does not have
    expectFailed(slash, endpointReturned(HTTP_NOT_FOUND, "Not Found"));
    expect((await libsqlDirect({ url: `${sidecar.url}/` }, "SELECT 1", sidecar.token)).status, "the server's own status for the doubled slash").toBe(HTTP_NOT_FOUND);
  });

  test("D13k: the runner reaches the sidecar over HTTP and TCP, and a closed port of the same host is refused", async () => {
    const sidecar = libsqlConnection();
    const host = new URL(sidecar.url).hostname;

    const answer = await libsqlDirect(sidecar, "SELECT 1 AS one", sidecar.token);

    expect(firstResultOf(answer), "the server's answer to SELECT 1").toMatchObject({
      type: "ok",
      response: { type: "execute", result: { cols: [{ name: "one", decltype: null }], rows: [[{ type: "integer", value: "1" }]] } },
    });
    expect(await tcpOutcome(host, LIBSQL.PORT), "the sidecar's HTTP port").toBe("connected");
    expect(await tcpOutcome(host, CLOSED_PORT), "positive control: a port nothing listens on is refused").toBe("ECONNREFUSED");
  });
});
