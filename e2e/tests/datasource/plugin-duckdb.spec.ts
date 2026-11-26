import { randomBytes } from "node:crypto";
import type { Page } from "@playwright/test";
import { createApp, createNodePluginDatasource, executeAppQueryRaw, type RawAnswer, type RegisteredUser } from "../../src/api/client";
import { API_OK, TAGS } from "../../src/constants";
import { appDsl, button, nodePluginQuery, stackItems } from "../../src/dsl/builders";
import { recordedPluginDatasource, recordedPluginQuery } from "../../src/dsl/recorded";
import { boundText, boundTextTestId, openSeededView } from "../../src/components/scenario";
import { expect, test } from "../../src/fixtures";

/**
 * D4: the DuckDB plugin of node-service (`server/node-service/src/plugins/duckdb/index.ts`), run through the app container
 * with no network: the data source is the recorded form body (database file `:memory:`, the form's default options), every
 * query runs against a database that exists only for that one run.
 *
 * Limits of this file: no `INSTALL`/`LOAD` statement, no URL or file path in any SQL and no `read_*` table function. DuckDB can
 * autoload extensions from a download host, and a file path would write into the app container that every test shares.
 *
 * Shape: the plugin answers each row keyed by its column NAME (`SELECT 42 AS answer` is read as `row.answer`), and `serializeBigInts`
 * turns a `bigint` into a string. The images before the node-service upgrade keyed a row by the column POSITION (`{ "0": 42, ... }`,
 * D-68 candidate); that changed on purpose and the tests below assert the names.
 */

const NODE_SERVICE_DETAILS = { tag: [TAGS.NODE_SERVICE] };

const HTTP_OK = 200;
/** `QueryResultView.queryCode` of a failed query (`api/query/view/QueryResultView.java`); the field `code` is `1` whether or not the query succeeded. */
const QUERY_CODE_FAILED = "FAILED";
/** `queryCode` of a query that succeeded. */
const QUERY_CODE_OK = "OK";
const MARKER_BYTES = 4;

/** The names of the first two columns of the queries below. */
const ANSWER_COLUMN = "answer";
const LABEL_COLUMN = "label";
const BIG_COLUMN = "big";
const HUGE_COLUMN = "huge";

/** The largest HUGEINT (2^127 - 1), far beyond the BIGINT range; a JavaScript number could not hold it. */
const HUGEINT_VALUE = "170141183460469231731687303715884105727";
const BIGINT_SQL = `SELECT 9007199254740993::BIGINT AS big, ${HUGEINT_VALUE}::HUGEINT AS huge`;
/** 2^53 + 1: the first integer a JavaScript number cannot hold, so a `number` would come back as 9007199254740992. */
const BIGINT_VALUE = "9007199254740993";
const CREATE_TABLE_SQL = "CREATE TABLE t AS SELECT 1 AS x";
const SELECT_TABLE_SQL = "SELECT x FROM t";
const SYNTAX_ERROR_SQL = "SELEC 1";

const BUTTON_TEST_ID = "e2e-duckdb-run";
const RESULT_NAME = "label";
const QUERY_ID = "q1";
const QUERY_NAME = "q";

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

/** A DuckDB data source from the recording (the recorded `:memory:` file and options); returns its id. */
async function duckdbDatasource(page: Page, apiUser: RegisteredUser): Promise<string> {
  return createNodePluginDatasource(page.request, { orgId: apiUser.orgId, recorded: recordedPluginDatasource("duckdb"), config: {} });
}

/** A saved app with one manual query per entry of `sqlByQueryId`, on a new DuckDB data source (not published: the draft runs with `viewMode: false`). */
async function duckdbApp(page: Page, apiUser: RegisteredUser, sqlByQueryId: Record<string, string>): Promise<{ appId: string }> {
  const datasourceId = await duckdbDatasource(page, apiUser);
  const queries = Object.entries(sqlByQueryId).map(([id, sql]) =>
    nodePluginQuery({ id, name: id, datasourceId, recorded: recordedPluginQuery("duckdb"), action: { queryString: sql } }),
  );
  const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-duckdb", dsl: appDsl([], { queries }) });
  return { appId };
}

async function runDraft(page: Page, appId: string, queryId: string): Promise<RawAnswer> {
  return executeAppQueryRaw(page.request, { applicationId: appId, queryId, viewMode: false });
}

test.describe("DuckDB data source", NODE_SERVICE_DETAILS, () => {
  test("D4a: a DuckDB query answers rows", async ({ page, apiUser }) => {
    const marker = uniqueMarker();
    const { appId } = await duckdbApp(page, apiUser, { [QUERY_ID]: `SELECT 42 AS answer, 'e2e-' || '${marker}' AS label` });

    const answer = await runDraft(page, appId, QUERY_ID);

    expect({ status: answer.status, code: answer.code }, "the query ran").toEqual({ status: HTTP_OK, code: API_OK });
    expect(envelopeOf(answer).success, "the query succeeded").toBe(true);
    expect(envelopeOf(answer).queryCode, "the query code").toBe(QUERY_CODE_OK);
    // An INTEGER column reaches the app as a JSON number; the keys are the column names.
    expect(envelopeOf(answer).data, "the rows, keyed by column name").toEqual([{ [ANSWER_COLUMN]: 42, [LABEL_COLUMN]: `e2e-${marker}` }]);
  });

  test("D4b: the published view shows the DuckDB result after a click", async ({ page, apiUser }) => {
    const marker = uniqueMarker();
    const datasourceId = await duckdbDatasource(page, apiUser);
    // The text reads the second column by its name; before the first run `q.data` is not a list.
    const expression = `{{${QUERY_NAME}.data ? ${QUERY_NAME}.data[0]["${LABEL_COLUMN}"] : ""}}`;
    const view = await openSeededView(
      page,
      apiUser.orgId,
      "e2e-duckdb-view",
      stackItems([
        button({ id: "b1", name: "button1", text: "Run", testId: BUTTON_TEST_ID, onClickQuery: QUERY_NAME }),
        boundText({ id: "t1", name: RESULT_NAME, expression }),
      ]),
      {
        queries: [
          nodePluginQuery({
            id: QUERY_ID,
            name: QUERY_NAME,
            datasourceId,
            recorded: recordedPluginQuery("duckdb"),
            action: { queryString: `SELECT 42 AS answer, 'e2e-' || '${marker}' AS label` },
          }),
        ],
      },
    );

    await expect(view.byTestId(boundTextTestId(RESULT_NAME)), "before the click the text is empty").toHaveText("");
    await view.buttonByTestId(BUTTON_TEST_ID).click();
    await expect(view.byTestId(boundTextTestId(RESULT_NAME)), "after the click the text shows the DuckDB label").toHaveText(`e2e-${marker}`);
  });

  test("D4c: BIGINT and HUGEINT columns arrive as strings without precision loss", async ({ page, apiUser }) => {
    const { appId } = await duckdbApp(page, apiUser, { [QUERY_ID]: BIGINT_SQL });

    const answer = await runDraft(page, appId, QUERY_ID);

    expect({ status: answer.status, code: answer.code }, "the query ran").toEqual({ status: HTTP_OK, code: API_OK });
    expect(envelopeOf(answer).success, "the query succeeded").toBe(true);
    expect(envelopeOf(answer).queryCode, "the query code").toBe(QUERY_CODE_OK);
    // `serializeBigInts` turns a `bigint` into a string (designed behaviour), a HUGEINT included (measured); the keys are the column names.
    expect(envelopeOf(answer).data, "the BIGINT and the HUGEINT as exact strings").toEqual([{ [BIG_COLUMN]: BIGINT_VALUE, [HUGE_COLUMN]: HUGEINT_VALUE }]);
  });

  test("D4d: each run is a fresh in-memory database", async ({ page, apiUser }) => {
    const { appId } = await duckdbApp(page, apiUser, { create: CREATE_TABLE_SQL, read: SELECT_TABLE_SQL });

    const created = await runDraft(page, appId, "create");
    expect({ status: created.status, code: created.code }, "the CREATE TABLE ran").toEqual({ status: HTTP_OK, code: API_OK });
    expect(envelopeOf(created).success, "the CREATE TABLE succeeded (positive control)").toBe(true);
    expect(envelopeOf(created).queryCode, "the CREATE TABLE query code").toBe(QUERY_CODE_OK);

    const read = await runDraft(page, appId, "read");
    expect(envelopeOf(read).success, "the second run does not see the table").toBe(false);
    expect(envelopeOf(read).queryCode, "the second run failed").toBe(QUERY_CODE_FAILED);
    expect(envelopeOf(read).message, "the error names the table").toContain("Table with name t does not exist");
  });

  test("D4e: a syntax error is a failed query", async ({ page, apiUser }) => {
    const { appId } = await duckdbApp(page, apiUser, { [QUERY_ID]: SYNTAX_ERROR_SQL });

    const answer = await runDraft(page, appId, QUERY_ID);

    // `code` is `1` for every query answer, success or not: the outcome is `success` and `queryCode`.
    expect(answer.status, "the request itself is answered").toBe(HTTP_OK);
    expect(envelopeOf(answer).success, "the query failed").toBe(false);
    expect(envelopeOf(answer).queryCode, "the query code").toBe(QUERY_CODE_FAILED);
    expect(envelopeOf(answer).message, "the message names the syntax error").toContain(`syntax error at or near "SELEC"`);
    expect(envelopeOf(answer).data, "no rows").toBeNull();
  });
});
