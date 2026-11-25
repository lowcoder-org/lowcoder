import { randomBytes } from "node:crypto";
import { connect } from "node:net";
import type { Page } from "@playwright/test";
import {
  createApp,
  createNodePluginDatasource,
  executeAppQueryRaw,
  nodePluginDatasourceBody,
  testDatasourceRaw,
  type RawAnswer,
  type RegisteredUser,
} from "../../src/api/client";
import { API_OK, FIREBIRD, NEGATIVE_EVENT_WINDOW_MS, TAGS } from "../../src/constants";
import { appDsl, nodePluginQuery } from "../../src/dsl/builders";
import { recordedPluginDatasource, recordedPluginQuery } from "../../src/dsl/recorded";
import { FIREBIRD_ITEMS, firebirdConnection } from "../../src/datasource/firebird";
import { expect, test } from "../../src/fixtures";

/**
 * D12: the Firebird plugin of node-service (`server/node-service/src/plugins/firebirdsql/`, the plugin id `firebird`), run against the
 * Firebird sidecar of the run (`scripts/run-in-docker.sh` starts it only with `E2E_INCLUDE_NODE_SERVICE_SIDECARS=1`; the data is
 * `fixtures/firebird/init.sql`). The plugin speaks the Firebird wire protocol with node-firebird, so the HTTP echo cannot stand in. Every
 * connection of these tests goes to the sidecar: the host of the data source is the sidecar's alias from `E2E_FIREBIRD_HOST`, never a
 * placeholder. The data source reaches node-service through the normal API with the form's recorded body, the host, port, database path,
 * user and password of the sidecar written over its fields.
 *
 * Measured on the images `3.0.0-e2e` and `3.0.1-e2e` against the sidecar (Firebird 3.0.12, Legacy_Auth first):
 * - A row is an object with lower-cased keys (the form's default `lowercaseKeys: true`); `NUMERIC(9,2)` is a number, a NULL is `null`;
 *   an INSERT answers `{}` (the plugin's `result || {}`).
 * - A named `:param` is replaced by `?` and read from the saved `params` JSON, in the order the names appear in the SQL (a name may be
 *   used twice). The SQL text is scanned for `:name` everywhere, string literals included.
 * - A server error reaches the app as the failed query's message, the server's own text.
 *
 * Not covered: the data source options `role` (node-firebird 1.1.9 failed to attach when the role named one the user holds, measured
 * once on the sidecar, not pursued), `blobAsText` and the connection pool; Firebird 4 and 5 (the sidecar is Firebird 3.0.12).
 */

/**
 * Candidate defect: a query that fails after the attach (a SQL error or an unknown named parameter) never detaches (`run.ts`: `detachAsync`
 * comes after the awaited query and is skipped when it throws), so the attachment stays open on the server. A successful query does detach.
 */
const LEAKED_ATTACHMENT_DEFECT = { type: "defect", description: "D-78 candidate" } as const;

const HTTP_OK = 200;
const CODE_CONNECT_FAILED = 500;
const QUERY_CODE_OK = "OK";
const QUERY_CODE_FAILED = "FAILED";
const MARKER_BYTES = 4;
const QUERY_ID = "q1";
const FIREBIRD_PLUGIN = "firebird";
const CONNECT_FAILED_PREFIX = "Failed to connect data source: ";

/** The server's text for a wrong password and for a database file that does not exist (measured; the first has line breaks and a final dot). */
const WRONG_PASSWORD_TEXT = "Your user name and password are not defined. Ask your database\nadministrator to set up a Firebird login\n";
const MISSING_DATABASE_FILE = "/var/lib/firebird/data/e2e-missing.fdb";
const MISSING_DATABASE_TEXT = `I/O error for file "${MISSING_DATABASE_FILE}", Error while trying to open file.`;
/**
 * Differs from the sidecar's password within its first eight characters on purpose: the sidecar authenticates with Legacy_Auth, which
 * compares only the first eight characters of a password (measured: `e2e-firebird-wrong-password`, which shares them, attached).
 */
const WRONG_PASSWORD = "wrong-e2e-password";

const SELECT_ITEM_BY_ID = "SELECT ID, NAME FROM FB_ITEMS WHERE ID = :id";
const SELECT_ALL_ITEMS = "SELECT ID, NAME, PRICE, NOTE FROM FB_ITEMS ORDER BY ID";
/** A subtraction is not commutative: the value tells which parameter was bound to which placeholder. */
const SELECT_DIFFERENCE = "SELECT CAST(:first AS INTEGER) - CAST(:second AS INTEGER) AS DIFF FROM RDB$DATABASE";
const DIFFERENCE_FIRST = 10;
const DIFFERENCE_SECOND = 3;
const SELECT_UNKNOWN_PARAMETER = "SELECT ID FROM FB_ITEMS WHERE ID = :missing";
const INSERT_NOTE = "INSERT INTO FB_NOTES (OWNER, BODY) VALUES (:owner, :body)";
const SELECT_NOTES = "SELECT OWNER, BODY FROM FB_NOTES WHERE OWNER = :owner";
const SYNTAX_ERROR_SQL = "SELEC 1";
const SYNTAX_ERROR_TEXT = "Dynamic SQL Error, SQL error code = -104, Token unknown - line 1, column 1, SELEC";
const UNKNOWN_TABLE_SQL = "SELECT * FROM FB_NO_SUCH_TABLE";
const UNKNOWN_TABLE_TEXT = "Dynamic SQL Error, SQL error code = -204, Table unknown, FB_NO_SUCH_TABLE, At line 1, column 15";
const UNKNOWN_PARAMETER_TEXT = 'Named parameter "missing" not found in Query Parameters object.';

/** A port of the sidecar's host where nothing listens: the control that a refused connection is seen as one. */
const CLOSED_PORT = 3051;
const CONNECT_TIMEOUT_MS = 5000;

/**
 * Leaked-attachment observation. A statement that sets a context variable of the attachment (`RDB$SET_CONTEXT`, `USER_SESSION`) tagged with
 * a per-test marker and then fails by dividing by zero leaves the tag in `MON$CONTEXT_VARIABLES` for as long as its attachment lives, so a
 * count of the tag counts this test's open attachments only (parallel tests use other tags). The marker is hex: it is placed in the SQL text,
 * since a named parameter inside an EXECUTE BLOCK would be rewritten by the plugin too.
 */
const CONTEXT_VARIABLE = "E2E_TAG";
const LEAK_RUNS = 2;
/** The message of the failing block; the column at its end depends on the length of the tag, so it is matched as digits. */
const DIVIDE_BY_ZERO_MESSAGE = /^Arithmetic exception, numeric overflow, or string truncation, Integer divide by zero\.The code attempted to divide an integer value by\nan integer divisor of zero\n, At block line: 1, col: \d+$/;

function failingTaggedSql(tag: string): string {
  return `EXECUTE BLOCK AS DECLARE V INTEGER; BEGIN V = 1; RDB$SET_CONTEXT('USER_SESSION', '${CONTEXT_VARIABLE}', '${tag}'); V = V / (V - 1); END`;
}

function succeedingTaggedSql(tag: string): string {
  return `EXECUTE BLOCK AS DECLARE V INTEGER; BEGIN V = 1; RDB$SET_CONTEXT('USER_SESSION', '${CONTEXT_VARIABLE}', '${tag}'); END`;
}

const COUNT_TAGGED_SQL = `SELECT COUNT(*) AS N FROM MON$CONTEXT_VARIABLES WHERE MON$VARIABLE_NAME = '${CONTEXT_VARIABLE}' AND MON$VARIABLE_VALUE = :tag`;

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

/** One saved query: its SQL and the `params` JSON text of the form's "Query Parameters" field. */
interface FirebirdQuery {
  sql: string;
  params?: Record<string, unknown>;
}

/** The data source fields of the sidecar over the recorded form body; `overrides` change single fields (a wrong password, a lower-case switch). */
function sidecarConfig(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const connection = firebirdConnection();
  return { host: connection.host, port: connection.port, database: connection.database, username: connection.username, password: connection.password, ...overrides };
}

async function firebirdDatasource(page: Page, apiUser: RegisteredUser, overrides: Record<string, unknown> = {}): Promise<string> {
  return createNodePluginDatasource(page.request, { orgId: apiUser.orgId, recorded: recordedPluginDatasource(FIREBIRD_PLUGIN), config: sidecarConfig(overrides) });
}

/** A saved app with one manual query per entry of `queries` on one data source (not published: the draft runs with `viewMode: false`). */
async function firebirdApp(page: Page, apiUser: RegisteredUser, queries: Record<string, FirebirdQuery>, overrides: Record<string, unknown> = {}): Promise<string> {
  const datasourceId = await firebirdDatasource(page, apiUser, overrides);
  const saved = Object.entries(queries).map(([id, query]) =>
    nodePluginQuery({
      id,
      name: id,
      datasourceId,
      recorded: recordedPluginQuery(FIREBIRD_PLUGIN),
      action: { sql: query.sql, params: query.params === undefined ? "" : JSON.stringify(query.params) },
    }),
  );
  const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-firebird", dsl: appDsl([], { queries: saved }) });
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

/** The answer of the data source's connection test for the recorded body with `overrides` over the sidecar's fields. */
async function connectionTest(page: Page, apiUser: RegisteredUser, overrides: Record<string, unknown> = {}): Promise<RawAnswer> {
  return testDatasourceRaw(page.request, nodePluginDatasourceBody(recordedPluginDatasource(FIREBIRD_PLUGIN), { orgId: apiUser.orgId, config: sidecarConfig(overrides) }));
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

test.describe("Firebird data source against its sidecar", { tag: [TAGS.NODE_SERVICE, TAGS.NODE_SERVICE_SIDECAR] }, () => {
  test("D12a: the connection test attaches", async ({ page, apiUser }) => {
    const answer = await connectionTest(page, apiUser);

    expect({ status: answer.status, code: answer.code }, "the test request was answered").toEqual({ status: HTTP_OK, code: API_OK });
    expect(answer.json, "the connection test answered success with data true").toEqual({ code: API_OK, message: "", data: true, success: true });
  });

  test("D12b: a wrong password and a missing database file fail the connection test with the server's text", async ({ page, apiUser }) => {
    // positive control: the same body with the right fields attaches
    expect((await connectionTest(page, apiUser)).json, "positive control, the sidecar's own fields attach").toMatchObject({ success: true, data: true });

    const wrongPassword = await connectionTest(page, apiUser, { password: WRONG_PASSWORD });
    const missingDatabase = await connectionTest(page, apiUser, { database: MISSING_DATABASE_FILE });

    expect(wrongPassword.json, "a wrong password").toEqual({ code: CODE_CONNECT_FAILED, message: `${CONNECT_FAILED_PREFIX}${WRONG_PASSWORD_TEXT}.`, success: false });
    expect(missingDatabase.json, "a database file that does not exist").toEqual({ code: CODE_CONNECT_FAILED, message: `${CONNECT_FAILED_PREFIX}${MISSING_DATABASE_TEXT}`, success: false });
  });

  test("D12c: a query with a named parameter answers the lower-cased row", async ({ page, apiUser }) => {
    const appId = await firebirdApp(page, apiUser, { [QUERY_ID]: { sql: SELECT_ITEM_BY_ID, params: { id: 2 } } });

    const answer = await runDraft(page, appId, QUERY_ID);

    expectSucceeded(answer);
    const beta = FIREBIRD_ITEMS[1];
    expect(envelopeOf(answer).data, "the row of id 2, keys in lower case").toEqual([{ id: beta?.id, name: beta?.name }]);
  });

  test("D12d: every column type of the seeded table, in lower-cased keys, in ID order", async ({ page, apiUser }) => {
    const appId = await firebirdApp(page, apiUser, { [QUERY_ID]: { sql: SELECT_ALL_ITEMS } });

    const answer = await runDraft(page, appId, QUERY_ID);

    expectSucceeded(answer);
    expect(envelopeOf(answer).data, "the three seeded rows: NUMERIC as a number, a NULL as null").toEqual(FIREBIRD_ITEMS);
  });

  test("D12e: parameters are bound in the order the names appear in the SQL, not the order of the parameter object", async ({ page, apiUser }) => {
    // `first` is named before `second` in the SQL; one query lists them in that order, the other in the opposite order
    const appId = await firebirdApp(page, apiUser, {
      sqlOrder: { sql: SELECT_DIFFERENCE, params: { first: DIFFERENCE_FIRST, second: DIFFERENCE_SECOND } },
      oppositeOrder: { sql: SELECT_DIFFERENCE, params: { second: DIFFERENCE_SECOND, first: DIFFERENCE_FIRST } },
    });

    const sqlOrder = await runDraft(page, appId, "sqlOrder");
    const oppositeOrder = await runDraft(page, appId, "oppositeOrder");

    expectSucceeded(sqlOrder);
    expectSucceeded(oppositeOrder);
    // 10 - 3 = 7; a binder that took the object's key order would answer 3 - 10 = -7 for the second query
    expect(envelopeOf(sqlOrder).data, "parameters listed in SQL order").toEqual([{ diff: DIFFERENCE_FIRST - DIFFERENCE_SECOND }]);
    expect(envelopeOf(oppositeOrder).data, "parameters listed in the opposite order give the same value").toEqual([{ diff: DIFFERENCE_FIRST - DIFFERENCE_SECOND }]);
  });

  test("D12f: an unknown named parameter is refused with its name", async ({ page, apiUser }) => {
    const appId = await firebirdApp(page, apiUser, {
      refused: { sql: SELECT_UNKNOWN_PARAMETER, params: { id: 2 } },
      control: { sql: SELECT_UNKNOWN_PARAMETER, params: { missing: 2 } },
    });

    const control = await runDraft(page, appId, "control");
    const refused = await runDraft(page, appId, "refused");

    expectSucceeded(control);
    expect(envelopeOf(control).data, "positive control: the same SQL with the name present runs").toEqual([{ id: 2 }]);
    expectFailed(refused, UNKNOWN_PARAMETER_TEXT);
  });

  test("D12g: an INSERT is read back by the test's own owner", async ({ page, apiUser }) => {
    const owner = `e2e-owner-${uniqueMarker()}`;
    const body = `e2e-body-${uniqueMarker()}`;
    const appId = await firebirdApp(page, apiUser, {
      insert: { sql: INSERT_NOTE, params: { owner, body } },
      read: { sql: SELECT_NOTES, params: { owner } },
    });

    const before = await runDraft(page, appId, "read");
    const inserted = await runDraft(page, appId, "insert");
    const after = await runDraft(page, appId, "read");

    expectSucceeded(before);
    expect(envelopeOf(before).data, "before the insert the owner has no row").toEqual([]);
    expectSucceeded(inserted);
    expect(envelopeOf(inserted).data, "an INSERT answers an empty object").toEqual({});
    expectSucceeded(after);
    expect(envelopeOf(after).data, "after the insert the owner has exactly its row").toEqual([{ owner, body }]);
  });

  test("D12h: a SQL error is the failed query's message", async ({ page, apiUser }) => {
    const appId = await firebirdApp(page, apiUser, {
      syntax: { sql: SYNTAX_ERROR_SQL },
      table: { sql: UNKNOWN_TABLE_SQL },
      control: { sql: SELECT_ALL_ITEMS },
    });

    expectSucceeded(await runDraft(page, appId, "control"));
    expectFailed(await runDraft(page, appId, "syntax"), SYNTAX_ERROR_TEXT);
    expectFailed(await runDraft(page, appId, "table"), UNKNOWN_TABLE_TEXT);
  });

  test("D12i: without the lower-case option the columns keep the server's upper case", async ({ page, apiUser }) => {
    const lower = await firebirdApp(page, apiUser, { [QUERY_ID]: { sql: SELECT_ITEM_BY_ID, params: { id: 1 } } });
    const upper = await firebirdApp(page, apiUser, { [QUERY_ID]: { sql: SELECT_ITEM_BY_ID, params: { id: 1 } } }, { lowercaseKeys: false });

    const lowerAnswer = await runDraft(page, lower, QUERY_ID);
    const upperAnswer = await runDraft(page, upper, QUERY_ID);

    const alpha = FIREBIRD_ITEMS[0];
    expectSucceeded(lowerAnswer);
    expect(envelopeOf(lowerAnswer).data, "positive control: the form's default lower-cases").toEqual([{ id: alpha?.id, name: alpha?.name }]);
    expectSucceeded(upperAnswer);
    expect(envelopeOf(upperAnswer).data, "lowercaseKeys false").toEqual([{ ID: alpha?.id, NAME: alpha?.name }]);
  });

  test("D12j: a failing query leaves its attachment open, a succeeding one does not", { annotation: LEAKED_ATTACHMENT_DEFECT }, async ({ page, apiUser }) => {
    const tag = uniqueMarker();
    const appId = await firebirdApp(page, apiUser, {
      failing: { sql: failingTaggedSql(tag) },
      succeeding: { sql: succeedingTaggedSql(tag) },
      count: { sql: COUNT_TAGGED_SQL, params: { tag } },
    });
    const openAttachments = async (): Promise<unknown> => {
      const answer = await runDraft(page, appId, "count");
      expectSucceeded(answer);
      return envelopeOf(answer).data;
    };

    expect(await openAttachments(), "before any run no attachment carries the tag").toEqual([{ n: 0 }]);
    for (let run = 0; run < LEAK_RUNS; run += 1) {
      const failing = await runDraft(page, appId, "failing");
      expectRan(failing);
      expect({ success: envelopeOf(failing).success, queryCode: envelopeOf(failing).queryCode, data: envelopeOf(failing).data }, "the tagged block failed").toEqual({ success: false, queryCode: QUERY_CODE_FAILED, data: null });
      expect(envelopeOf(failing).message, "the division by zero").toMatch(DIVIDE_BY_ZERO_MESSAGE);
    }
    // the observation sees live attachments: one per failing run
    await expect.poll(openAttachments, { message: "the failing runs' attachments are open" }).toEqual([{ n: LEAK_RUNS }]);

    expectSucceeded(await runDraft(page, appId, "succeeding"));
    await page.waitForTimeout(NEGATIVE_EVENT_WINDOW_MS);
    expect(await openAttachments(), "the succeeding run's attachment is not among the open ones (the count stays at the failing runs')").toEqual([{ n: LEAK_RUNS }]);
  });

  test("D12k: the runner reaches the sidecar over TCP, and a closed port of the same host is refused", async () => {
    const connection = firebirdConnection();

    expect(await tcpOutcome(connection.host, FIREBIRD.PORT), "the sidecar's Firebird port").toBe("connected");
    expect(await tcpOutcome(connection.host, CLOSED_PORT), "positive control: a port nothing listens on is refused").toBe("ECONNREFUSED");
  });
});
