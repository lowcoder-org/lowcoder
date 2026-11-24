import { randomBytes } from "node:crypto";
import type { Page } from "@playwright/test";
import { createApp, createNodePluginDatasource, executeAppQueryRaw, type RawAnswer, type RegisteredUser } from "../../src/api/client";
import { API_OK, TAGS } from "../../src/constants";
import { appDsl, button, nodePluginQuery, stackItems } from "../../src/dsl/builders";
import { recordedPluginDatasource, recordedPluginQuery } from "../../src/dsl/recorded";
import { boundText, boundTextTestId, openSeededView } from "../../src/components/scenario";
import { expect, test } from "../../src/fixtures";
import type { EchoRecord, EchoTarget } from "../../src/security/echo";

/**
 * D5: the Turso and Slack plugins of node-service (`server/node-service/src/plugins/turso/index.ts`, `slack/run.ts`), which
 * talk plain HTTP to a configurable URL. The data source URL is the test's own target on the echo sidecar, so the tests prove
 * the request the plugin builds and the path of the canned answer into the app. They are NOT a fidelity test of Turso or Slack.
 *
 * Not covered: the `libsql://` to `https://` rewrite of the Turso URL (the echo does not speak TLS).
 */
const NODE_SERVICE_DETAILS = { tag: [TAGS.NODE_SERVICE] };

/** Candidate defect: an `error` result of the pipeline is printed as `${result.error}` (an object), so the server's own message never reaches the app. */
const ERROR_TEXT_DEFECT = { type: "defect", description: "NSD-1 candidate" } as const;
const ERROR_TEXT_DETAILS = { annotation: ERROR_TEXT_DEFECT };
/** The message of the canned error result. */
const ERROR_MESSAGE = "e2e-boom";
/** What the plugin prints for it (measured on the images `3.0.0-e2e` and `3.0.1-e2e`): the object is printed as `[object Object]`. */
const MEASURED_ERROR_TEXT = "Cannot parse result, received error: [object Object]";

/** The route the Turso plugin appends to the data source URL (Hrana over HTTP, pipeline endpoint). */
const PIPELINE_PATH = "/v2/pipeline";
/** The path below the target that the Slack data source URL points at. */
const HOOK_PATH = "/hook";
const HTTP_OK = 200;
const HTTP_SERVER_ERROR = 500;
const QUERY_CODE_OK = "OK";
const QUERY_CODE_FAILED = "FAILED";
const MARKER_BYTES = 4;
const JSON_CONTENT_TYPE = "application/json";
const TEXT_CONTENT_TYPE = "text/plain";
/** The content type node-fetch sets for a `URLSearchParams` body (measured on the images `3.0.0-e2e`: the charset suffix is part of it). */
const FORM_CONTENT_TYPE = "application/x-www-form-urlencoded;charset=UTF-8";
const SLACK_ANSWER = "ok";

const BUTTON_TEST_ID = "e2e-turso-run";
const RESULT_NAME = "label";
const SUCCESS_NAME = "succeeded";
const QUERY_ID = "q1";
const QUERY_NAME = "q";

const ROW_ID = 1;
const ROW_NAME = "alpha";

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

/** The `result` of the canned `execute` (columns `id` INTEGER and `name` TEXT, one row): `includeRaw` hands it to the app unchanged. */
const EXECUTE_RESULT = {
  cols: [
    { name: "id", decltype: "INTEGER" },
    { name: "name", decltype: "TEXT" },
  ],
  rows: [[{ type: "integer", value: String(ROW_ID) }, { type: "text", value: ROW_NAME }]],
  affected_row_count: 0,
  last_insert_rowid: null,
  replication_index: null,
  rows_read: 1,
  rows_written: 0,
  query_duration_ms: 0,
};

/** The Hrana answer of a pipeline with one `execute` and its `close`. */
function pipelineAnswer(): string {
  return JSON.stringify({
    baton: null,
    base_url: null,
    results: [
      { type: "ok", response: { type: "execute", result: EXECUTE_RESULT } },
      { type: "ok", response: { type: "close" } },
    ],
  });
}

async function cannedPipeline(echo: EchoTarget, answer: { status: number; body: string; contentType?: string } = { status: HTTP_OK, body: pipelineAnswer() }): Promise<void> {
  await echo.answer(PIPELINE_PATH, { contentType: JSON_CONTENT_TYPE, ...answer });
}

/** A Turso data source from the recording, pointed at the echo target; returns its id. */
async function tursoDatasource(page: Page, apiUser: RegisteredUser, echo: EchoTarget, token: string): Promise<string> {
  return createNodePluginDatasource(page.request, {
    orgId: apiUser.orgId,
    recorded: recordedPluginDatasource("turso"),
    config: { url: echo.url, token },
  });
}

/** A saved app with one manual Turso query (not published: the draft runs with `viewMode: false`). */
async function tursoApp(page: Page, apiUser: RegisteredUser, echo: EchoTarget, token: string, action: Record<string, unknown>): Promise<{ appId: string }> {
  const datasourceId = await tursoDatasource(page, apiUser, echo, token);
  const query = nodePluginQuery({ id: QUERY_ID, name: QUERY_NAME, datasourceId, recorded: recordedPluginQuery("turso"), action });
  return createApp(page.request, { orgId: apiUser.orgId, name: "e2e-turso", dsl: appDsl([], { queries: [query] }) });
}

async function runDraft(page: Page, appId: string): Promise<RawAnswer> {
  return executeAppQueryRaw(page.request, { applicationId: appId, queryId: QUERY_ID, viewMode: false });
}

function expectRan(answer: RawAnswer): void {
  expect({ status: answer.status, code: answer.code }, "the query request was answered").toEqual({ status: HTTP_OK, code: API_OK });
}

function onlyRecord(records: EchoRecord[]): EchoRecord {
  expect(records, "the echo received exactly one request").toHaveLength(1);
  return records[0] as EchoRecord;
}

test.describe("Turso data source against the echo", NODE_SERVICE_DETAILS, () => {
  test("D5a: a Turso query sends one Hrana pipeline and answers its rows", async ({ page, apiUser, echo }) => {
    const token = `e2e-token-${uniqueMarker()}`;
    const sql = `SELECT id, name FROM t WHERE tag = 'e2e-${uniqueMarker()}'`;
    await cannedPipeline(echo);
    const { appId } = await tursoApp(page, apiUser, echo, token, { queryString: sql });
    expect(await echo.received(), "before the run the echo holds nothing of this test").toEqual([]);

    const answer = await runDraft(page, appId);

    expectRan(answer);
    expect(envelopeOf(answer).success, "the query succeeded").toBe(true);
    expect(envelopeOf(answer).queryCode, "the query code").toBe(QUERY_CODE_OK);
    const record = onlyRecord(await echo.received());
    expect(record.method, "the request method").toBe("POST");
    expect(record.path, "the request path").toBe(`${echo.path}${PIPELINE_PATH}`);
    expect(record.headers.authorization, "the bearer token of the data source").toBe(`Bearer ${token}`);
    expect(JSON.parse(record.body), "the complete pipeline: the execute of the SQL, then the close, nothing else").toEqual({
      requests: [{ type: "execute", stmt: { sql } }, { type: "close" }],
    });
    // an `integer` cell becomes a number, a `text` cell stays text; the keys are the column names
    expect(envelopeOf(answer).data, "the rows").toEqual([{ id: ROW_ID, name: ROW_NAME }]);
  });

  test("D5b: includeRaw answers the values and the raw result", async ({ page, apiUser, echo }) => {
    await cannedPipeline(echo);
    const { appId } = await tursoApp(page, apiUser, echo, "e2e-token", { queryString: "SELECT 1", includeRaw: true });

    const answer = await runDraft(page, appId);

    expectRan(answer);
    expect(envelopeOf(answer).success, "the query succeeded").toBe(true);
    expect((await echo.received()).length, "positive control: the request did reach the echo").toBe(1);
    const data = envelopeOf(answer).data as { values?: unknown; raw?: unknown };
    expect(Object.keys(data).sort(), "both keys are present").toEqual(["raw", "values"]);
    expect(data.values, "the values").toEqual([{ id: ROW_ID, name: ROW_NAME }]);
    expect(data.raw, "the whole raw result, as the server sent it").toEqual(EXECUTE_RESULT);
  });

  test("D5c: a non-OK pipeline answer fails the query", async ({ page, apiUser, echo }) => {
    await cannedPipeline(echo, { status: HTTP_SERVER_ERROR, body: "{}" });
    const { appId } = await tursoApp(page, apiUser, echo, "e2e-token", { queryString: "SELECT 1" });

    const answer = await runDraft(page, appId);

    expect(answer.status, "the request itself is answered").toBe(HTTP_OK);
    expect(envelopeOf(answer).success, "the query failed").toBe(false);
    expect(envelopeOf(answer).queryCode, "the query code").toBe(QUERY_CODE_FAILED);
    expect(envelopeOf(answer).message, "the message names the status").toContain(`Endpoint returned ${HTTP_SERVER_ERROR}`);
    expect((await echo.received()).length, "positive control: the request did reach the echo").toBe(1);
  });

  test("D5d: an error result fails the query", ERROR_TEXT_DETAILS, async ({ page, apiUser, echo }) => {
    await cannedPipeline(echo, { status: HTTP_OK, body: JSON.stringify({ baton: null, base_url: null, results: [{ type: "error", error: { message: ERROR_MESSAGE } }, { type: "ok", response: { type: "close" } }] }) });
    const { appId } = await tursoApp(page, apiUser, echo, "e2e-token", { queryString: "SELECT 1" });

    const answer = await runDraft(page, appId);

    expect(answer.status, "the request itself is answered").toBe(HTTP_OK);
    expect(envelopeOf(answer).success, "the query failed").toBe(false);
    expect(envelopeOf(answer).queryCode, "the query code").toBe(QUERY_CODE_FAILED);
    // The plugin prints `result.error`, which is an object: the server's message is lost (NSD-1 candidate, see ERROR_TEXT_DEFECT).
    expect(envelopeOf(answer).message, "the measured message").toBe(MEASURED_ERROR_TEXT);
    expect((await echo.received()).length, "positive control: the request did reach the echo").toBe(1);
  });

  test("D5e: the published view shows a Turso row after a click", async ({ page, apiUser, echo }) => {
    await cannedPipeline(echo);
    const datasourceId = await tursoDatasource(page, apiUser, echo, "e2e-token");
    // before the first run `q.data` is not a list
    const expression = `{{${QUERY_NAME}.data ? ${QUERY_NAME}.data[0].name : ""}}`;
    const view = await openSeededView(
      page,
      apiUser.orgId,
      "e2e-turso-view",
      stackItems([
        button({ id: "b1", name: "button1", text: "Run", testId: BUTTON_TEST_ID, onClickQuery: QUERY_NAME }),
        boundText({ id: "t1", name: RESULT_NAME, expression }),
        // `success` is an exposed value of every query (`q.success`); it also reads `true` before the first run (measured), so only the state after the click proves anything
        boundText({ id: "t2", name: SUCCESS_NAME, expression: `{{String(${QUERY_NAME}.success)}}` }),
      ]),
      { queries: [nodePluginQuery({ id: QUERY_ID, name: QUERY_NAME, datasourceId, recorded: recordedPluginQuery("turso"), action: { queryString: "SELECT 1" } })] },
    );

    await expect(view.byTestId(boundTextTestId(RESULT_NAME)), "before the click the text is empty").toHaveText("");
    expect(await echo.received(), "before the click the echo holds nothing of this test").toEqual([]);
    await view.buttonByTestId(BUTTON_TEST_ID).click();
    await expect(view.byTestId(boundTextTestId(SUCCESS_NAME)), "after the click the query succeeded").toHaveText("true");
    await expect(view.byTestId(boundTextTestId(RESULT_NAME)), "after the click the text shows the Turso row").toHaveText(ROW_NAME);
    expect((await echo.received()).length, "the click sent one request to the echo").toBe(1);
  });
});

test.describe("Slack data source against the echo", NODE_SERVICE_DETAILS, () => {
  test("D5f: a Slack query posts the payload to the webhook", async ({ page, apiUser, echo }) => {
    const id = uniqueMarker();
    const channel = `#e2e-${id}`;
    const message = `e2e-message-${id}`;
    await echo.answer(HOOK_PATH, { status: HTTP_OK, contentType: TEXT_CONTENT_TYPE, body: SLACK_ANSWER });
    const datasourceId = await createNodePluginDatasource(page.request, {
      orgId: apiUser.orgId,
      recorded: recordedPluginDatasource("slack"),
      config: { webhookURL: `${echo.url}${HOOK_PATH}` },
    });
    const query = nodePluginQuery({ id: QUERY_ID, name: QUERY_NAME, datasourceId, recorded: recordedPluginQuery("slack"), action: { message, channel } });
    const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-slack", dsl: appDsl([], { queries: [query] }) });
    expect(await echo.received(), "before the run the echo holds nothing of this test").toEqual([]);

    const answer = await runDraft(page, appId);

    expectRan(answer);
    expect(envelopeOf(answer).success, "the query succeeded").toBe(true);
    expect(envelopeOf(answer).queryCode, "the query code").toBe(QUERY_CODE_OK);
    const record = onlyRecord(await echo.received());
    expect(record.method, "the request method").toBe("POST");
    expect(record.path, "the request path").toBe(`${echo.path}${HOOK_PATH}`);
    expect(String(record.headers["content-type"]), "the body is a form").toBe(FORM_CONTENT_TYPE);
    const payload = new URLSearchParams(record.body).get("payload");
    expect(JSON.parse(payload ?? "null"), "the decoded payload").toEqual({ channel, text: message });
    expect(envelopeOf(answer).data, "the answer is the webhook's text").toBe(SLACK_ANSWER);
  });
});
