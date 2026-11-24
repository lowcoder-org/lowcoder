import { randomBytes } from "node:crypto";
import type { Page } from "@playwright/test";
import { createApp, createNodePluginDatasource, executeAppQueryRaw, getAppDsl, type RawAnswer, type RegisteredUser } from "../../src/api/client";
import { API_OK, TAGS } from "../../src/constants";
import { appDsl, button, nodePluginQuery, stackItems } from "../../src/dsl/builders";
import { recordedPluginDatasource, recordedPluginQuery } from "../../src/dsl/recorded";
import { boundText, boundTextTestId, openSeededView } from "../../src/components/scenario";
import { expect, test } from "../../src/fixtures";
import { recordsContain, type EchoRecord, type EchoTarget } from "../../src/security/echo";

/**
 * D6: the GitLab and Shopify plugins of node-service (`server/node-service/src/plugins/gitlab/index.ts`, `shopify/index.ts`),
 * which both post a GraphQL query through the shared runner (`plugins/graphql/run.ts`, `graphql-request`) to a configurable
 * endpoint. The endpoint is the test's own target on the echo sidecar, so the tests prove the request the plugin builds and the
 * path of the canned answer into the app. They are NOT a fidelity test of GitLab or Shopify.
 *
 * Shopify: the plugin reads the query's headers and passes none on, and its data source has no token field, so it cannot send
 * Shopify's access token (D6d, NSD-2 candidate).
 */
const NODE_SERVICE_DETAILS = { tag: [TAGS.NODE_SERVICE] };

/** Candidate defect: the Shopify plugin drops every header of the query and has no access token field. */
const SHOPIFY_HEADERS_DEFECT = { type: "defect", description: "NSD-2 candidate" } as const;
const SHOPIFY_HEADERS_DETAILS = { annotation: SHOPIFY_HEADERS_DEFECT };

/** The path below the target that the endpoint points at. */
const GRAPHQL_PATH = "/api/graphql";
const HTTP_OK = 200;
const QUERY_CODE_OK = "OK";
const QUERY_CODE_FAILED = "FAILED";
const MARKER_BYTES = 4;
const JSON_CONTENT_TYPE = "application/json";
/** The header name Shopify expects its token in; the plugin cannot send it. */
const SHOPIFY_TOKEN_HEADER = "X-Shopify-Access-Token";

const BUTTON_TEST_ID = "e2e-graphql-run";
const RESULT_NAME = "label";
const SUCCESS_NAME = "succeeded";
const QUERY_ID = "q1";
const QUERY_NAME = "q";

const GITLAB_OPERATION = "Probe";
const GITLAB_QUERY = "query Probe($n: Int) { currentUser { username } }";
const SHOPIFY_QUERY = "query { shop { name } }";
const GITLAB_USERNAME = "e2e";
const SHOPIFY_SHOP_NAME = "e2e-shop";
const GITLAB_DATA = { currentUser: { username: GITLAB_USERNAME } };
const SHOPIFY_DATA = { shop: { name: SHOPIFY_SHOP_NAME } };
const GRAPHQL_ERROR_MESSAGE = "e2e-gql-error";
/**
 * What the query reports for the canned error answer (measured on the images `3.0.0-e2e` and `3.0.1-e2e`): `graphql-request`'s
 * `ClientError` message is the first error's message, a colon, and the JSON of the response and of the request it sent.
 */
const MEASURED_ERROR_MESSAGE = `${GRAPHQL_ERROR_MESSAGE}: ${JSON.stringify({
  response: { errors: [{ message: GRAPHQL_ERROR_MESSAGE }], status: HTTP_OK, headers: {} },
  request: { query: GITLAB_QUERY, variables: {} },
})}`;
const VARIABLE_NAME = "n";
const VARIABLE_VALUE = 3;

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

function cannedData(data: unknown): { status: number; contentType: string; body: string } {
  return { status: HTTP_OK, contentType: JSON_CONTENT_TYPE, body: JSON.stringify({ data }) };
}

/** A data source of plugin `pluginId` from its recording, with its endpoint at the echo target. */
async function graphqlDatasource(page: Page, apiUser: RegisteredUser, echo: EchoTarget, pluginId: string, config: Record<string, unknown> = {}): Promise<string> {
  return createNodePluginDatasource(page.request, {
    orgId: apiUser.orgId,
    recorded: recordedPluginDatasource(pluginId),
    config: { endpoint: `${echo.url}${GRAPHQL_PATH}`, ...config },
  });
}

/** A saved app with one manual query of plugin `pluginId` (not published: the draft runs with `viewMode: false`). */
async function graphqlApp(page: Page, apiUser: RegisteredUser, pluginId: string, datasourceId: string, action: Record<string, unknown>): Promise<{ appId: string }> {
  const query = nodePluginQuery({ id: QUERY_ID, name: QUERY_NAME, datasourceId, recorded: recordedPluginQuery(pluginId), action });
  return createApp(page.request, { orgId: apiUser.orgId, name: `e2e-${pluginId}`, dsl: appDsl([], { queries: [query] }) });
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

test.describe("GitLab data source against the echo", NODE_SERVICE_DETAILS, () => {
  test("D6a: a GitLab query posts the query, the variables and every header", async ({ page, apiUser, echo }) => {
    const id = uniqueMarker();
    const token = `e2e-token-${id}`;
    const datasourceHeader = `e2e-ds-${id}`;
    const queryHeader = `e2e-q-${id}`;
    await echo.answer(GRAPHQL_PATH, cannedData(GITLAB_DATA));
    const datasourceId = await graphqlDatasource(page, apiUser, echo, "gitlab", { token, headers: [{ key: "X-E2E-DS", value: datasourceHeader }] });
    const { appId } = await graphqlApp(page, apiUser, "gitlab", datasourceId, {
      query: GITLAB_QUERY,
      variables: [{ key: VARIABLE_NAME, value: String(VARIABLE_VALUE) }],
      headers: [{ key: "X-E2E-Q", value: queryHeader }],
    });
    expect(await echo.received(), "before the run the echo holds nothing of this test").toEqual([]);

    const answer = await runDraft(page, appId);

    expectRan(answer);
    expect(envelopeOf(answer).success, "the query succeeded").toBe(true);
    expect(envelopeOf(answer).queryCode, "the query code").toBe(QUERY_CODE_OK);
    const record = onlyRecord(await echo.received());
    expect(record.method, "the request method").toBe("POST");
    expect(record.path, "the request path").toBe(`${echo.path}${GRAPHQL_PATH}`);
    expect(String(record.headers["content-type"]), "the body is JSON").toBe(JSON_CONTENT_TYPE);
    expect(record.headers["private-token"], "the access token of the data source").toBe(token);
    expect(record.headers["x-e2e-ds"], "the header of the data source").toBe(datasourceHeader);
    expect(record.headers["x-e2e-q"], "the header of the query").toBe(queryHeader);
    // `operationName` is added by graphql-request from the query text; the variable's text "3" arrives as the JSON number 3
    expect(JSON.parse(record.body), "the complete request body").toEqual({
      query: GITLAB_QUERY,
      variables: { [VARIABLE_NAME]: VARIABLE_VALUE },
      operationName: GITLAB_OPERATION,
    });
    expect(envelopeOf(answer).data, "the answer is the data member of the canned reply").toEqual(GITLAB_DATA);
  });

  test("D6b: a GraphQL error answer fails the query", async ({ page, apiUser, echo }) => {
    await echo.answer(GRAPHQL_PATH, { status: HTTP_OK, contentType: JSON_CONTENT_TYPE, body: JSON.stringify({ errors: [{ message: GRAPHQL_ERROR_MESSAGE }] }) });
    const datasourceId = await graphqlDatasource(page, apiUser, echo, "gitlab", { token: "e2e-token" });
    const { appId } = await graphqlApp(page, apiUser, "gitlab", datasourceId, { query: GITLAB_QUERY });

    const answer = await runDraft(page, appId);

    expect(answer.status, "the request itself is answered").toBe(HTTP_OK);
    expect(envelopeOf(answer).success, "the query failed").toBe(false);
    expect(envelopeOf(answer).queryCode, "the query code").toBe(QUERY_CODE_FAILED);
    expect(envelopeOf(answer).message, "the message: the server's error, then graphql-request's JSON of the response and the request").toBe(MEASURED_ERROR_MESSAGE);
    const record = onlyRecord(await echo.received());
    expect(JSON.parse(record.body), "the complete request body: no variables were set").toEqual({ query: GITLAB_QUERY, variables: {}, operationName: GITLAB_OPERATION });
  });

  test("D6e: the published view shows a GitLab answer after a click", async ({ page, apiUser, echo }) => {
    await echo.answer(GRAPHQL_PATH, cannedData(GITLAB_DATA));
    const datasourceId = await graphqlDatasource(page, apiUser, echo, "gitlab", { token: "e2e-token" });
    // before the first run `q.data` is not an object with `currentUser`
    const expression = `{{${QUERY_NAME}.data ? ${QUERY_NAME}.data.currentUser.username : ""}}`;
    const view = await openSeededView(
      page,
      apiUser.orgId,
      "e2e-gitlab-view",
      stackItems([
        button({ id: "b1", name: "button1", text: "Run", testId: BUTTON_TEST_ID, onClickQuery: QUERY_NAME }),
        boundText({ id: "t1", name: RESULT_NAME, expression }),
        // `success` also reads `true` before the first run (measured for the other node plugins), so only the state after the click proves anything
        boundText({ id: "t2", name: SUCCESS_NAME, expression: `{{String(${QUERY_NAME}.success)}}` }),
      ]),
      { queries: [nodePluginQuery({ id: QUERY_ID, name: QUERY_NAME, datasourceId, recorded: recordedPluginQuery("gitlab"), action: { query: GITLAB_QUERY } })] },
    );

    await expect(view.byTestId(boundTextTestId(RESULT_NAME)), "before the click the text is empty").toHaveText("");
    expect(await echo.received(), "before the click the echo holds nothing of this test").toEqual([]);
    await view.buttonByTestId(BUTTON_TEST_ID).click();
    await expect(view.byTestId(boundTextTestId(SUCCESS_NAME)), "after the click the query succeeded").toHaveText("true");
    await expect(view.byTestId(boundTextTestId(RESULT_NAME)), "after the click the text shows the GitLab answer").toHaveText(GITLAB_USERNAME);
    const record = onlyRecord(await echo.received());
    expect(JSON.parse(record.body), "the click sent the complete request body").toEqual({ query: GITLAB_QUERY, variables: {}, operationName: GITLAB_OPERATION });
  });
});

test.describe("Shopify data source against the echo", NODE_SERVICE_DETAILS, () => {
  test("D6c: a Shopify query reaches the endpoint", async ({ page, apiUser, echo }) => {
    await echo.answer(GRAPHQL_PATH, cannedData(SHOPIFY_DATA));
    const datasourceId = await graphqlDatasource(page, apiUser, echo, "shopify");
    const { appId } = await graphqlApp(page, apiUser, "shopify", datasourceId, { query: SHOPIFY_QUERY });
    expect(await echo.received(), "before the run the echo holds nothing of this test").toEqual([]);

    const answer = await runDraft(page, appId);

    expectRan(answer);
    expect(envelopeOf(answer).success, "the query succeeded").toBe(true);
    expect(envelopeOf(answer).queryCode, "the query code").toBe(QUERY_CODE_OK);
    const record = onlyRecord(await echo.received());
    expect(record.method, "the request method").toBe("POST");
    expect(record.path, "the request path").toBe(`${echo.path}${GRAPHQL_PATH}`);
    expect(JSON.parse(record.body), "the complete request body: no variables were set").toEqual({ query: SHOPIFY_QUERY, variables: {} });
    expect(envelopeOf(answer).data, "the answer is the data member of the canned reply").toEqual(SHOPIFY_DATA);
  });

  test("D6d: a Shopify query header never reaches the endpoint", SHOPIFY_HEADERS_DETAILS, async ({ page, apiUser, echo }) => {
    const marker = `e2e-shopify-token-${uniqueMarker()}`;
    await echo.answer(GRAPHQL_PATH, cannedData(SHOPIFY_DATA));
    const datasourceId = await graphqlDatasource(page, apiUser, echo, "shopify");
    const { appId } = await graphqlApp(page, apiUser, "shopify", datasourceId, {
      query: SHOPIFY_QUERY,
      headers: [{ key: SHOPIFY_TOKEN_HEADER, value: marker }],
    });

    // control 1: the marker header is in the saved query, so it exists when the plugin is called
    const saved = (await getAppDsl(page.request, appId)).applicationDSL as { queries?: { comp?: { action?: { headers?: unknown } } }[] };
    expect(saved.queries?.[0]?.comp?.action?.headers, "the saved Shopify query holds the marker header").toEqual([{ key: SHOPIFY_TOKEN_HEADER, value: marker }]);

    const answer = await runDraft(page, appId);

    // control 2: the query ran and the request did reach the echo, so the absence below is not an unreached echo
    expectRan(answer);
    expect(envelopeOf(answer).success, "the query succeeded").toBe(true);
    expect(envelopeOf(answer).queryCode, "the query code").toBe(QUERY_CODE_OK);
    const shopifyRecords = await echo.received();
    const record = onlyRecord(shopifyRecords);
    expect(JSON.parse(record.body), "the request body is the query").toEqual({ query: SHOPIFY_QUERY, variables: {} });
    // The plugin reads the query's headers and passes `{}` on (NSD-2 candidate, see SHOPIFY_HEADERS_DEFECT): neither the header name nor its value arrives.
    expect(recordsContain(shopifyRecords, marker), "the header value reached the endpoint").toBe(false);
    expect(Object.keys(record.headers).map((name) => name.toLowerCase()), "the header name reached the endpoint").not.toContain(SHOPIFY_TOKEN_HEADER.toLowerCase());

    // control 3: the very same header, set on a GitLab query of the same app machinery, does reach the echo, so only the Shopify plugin drops it
    const gitlabId = await graphqlDatasource(page, apiUser, echo, "gitlab", { token: "e2e-token" });
    const gitlab = await graphqlApp(page, apiUser, "gitlab", gitlabId, { query: GITLAB_QUERY, headers: [{ key: SHOPIFY_TOKEN_HEADER, value: marker }] });
    expectRan(await runDraft(page, gitlab.appId));
    const all = await echo.received();
    expect(all, "the echo now holds the Shopify and the GitLab request").toHaveLength(2);
    expect(all[1]?.headers[SHOPIFY_TOKEN_HEADER.toLowerCase()], "the GitLab plugin forwards the same header").toBe(marker);
  });
});
