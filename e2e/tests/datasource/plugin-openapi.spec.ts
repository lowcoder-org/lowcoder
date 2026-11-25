import { randomBytes } from "node:crypto";
import type { Page } from "@playwright/test";
import { createApp, createNodePluginDatasource, executeAppQueryRaw, pluginDynamicConfigRaw, type RawAnswer, type RegisteredUser } from "../../src/api/client";
import { API_OK, TAGS } from "../../src/constants";
import { appDsl, button, nodePluginQuery, stackItems } from "../../src/dsl/builders";
import { recordedPluginDatasource, recordedPluginQuery } from "../../src/dsl/recorded";
import {
  OPEN_API_FIXTURE_KEY_HEADER,
  OPEN_API_FIXTURE_OPERATION,
  OPEN_API_FIXTURE_SCHEME,
  OPEN_API_FIXTURE_SPEC,
} from "../../src/datasource/node-plugins";
import { boundText, boundTextTestId, openSeededView } from "../../src/components/scenario";
import { expect, test } from "../../src/fixtures";
import type { EchoRecord, EchoTarget } from "../../src/security/echo";

/**
 * D7: the generic `openApi` plugin of node-service (`server/node-service/src/plugins/openApi/index.ts`). Its data source form
 * fetches the OpenAPI document from the `url` field for real, while the form builds its dynamic config (`extra`, answered by
 * `POST /api/datasources/getPluginDynamicConfig`); the plugin then runs an operation against `serverURL` (or the document's own
 * server) with `swagger-client`. Here the document is a canned answer of the test's own echo target (`OPEN_API_FIXTURE_SPEC`)
 * and the server URL is the same target, so the tests prove the requests the plugin makes and the path of the answer into the
 * app. They are NOT a fidelity test of any OpenAPI service.
 *
 * No test runs an operation without a server URL: that request would go to the document's own server, the placeholder host,
 * and a placeholder host is never relied on to fail: measured on one development machine, the app container's DNS search domain
 * answered it, with an HTML 404 reported as a successful query. The server URL override is proven
 * by the one request that reaches the echo.
 */
const NODE_SERVICE_DETAILS = { tag: [TAGS.NODE_SERVICE] };

/** Candidate defect: an error status answer with a body is returned as the query's successful result. */
const ERROR_STATUS_SUCCESS_DEFECT = { type: "defect", description: "D-69 candidate" } as const;
const ERROR_STATUS_DETAILS = { annotation: ERROR_STATUS_SUCCESS_DEFECT };

/**
 * Observation: node-service keeps the dynamic config answers in a module-level object keyed on the request path, query and JSON
 * body (`routes/apiRouter.ts`, `cacheMiddleware`) with no expiry or eviction in that code, so an unchanged request never fetches
 * the document again until the process restarts. The tests rely on the key being the body only: each uses its own spec URL.
 */
const CACHE_OBSERVATION = { type: "observation", description: "dynamic config answers are cached in memory per request body, with no expiry" } as const;
const CACHE_DETAILS = { annotation: CACHE_OBSERVATION };

const SPEC_PATH = "/spec.json";
const API_PATH = "/api";
const ITEMS_PATH = `${API_PATH}/items`;
const HTTP_OK = 200;
const HTTP_NOT_FOUND = 404;
const JSON_CONTENT_TYPE = "application/json";
const QUERY_CODE_OK = "OK";
const MARKER_BYTES = 4;
/** The `path` of the request the data source form sends for its dynamic config (`pluginDataSourceForm.tsx`, `fetchDynamicPluginConfig`). */
const DYNAMIC_CONFIG_PATH = "$.dataSourceConfig.extra";
/** The query parameter of the operation, as the editor names an action parameter: `<position>_@_<name>` (`util.ts`, `ConfigKeySplit`). */
const QUERY_PARAM_KEY = "query_@_q";
const KEY_CONFIG_NAME = `${OPEN_API_FIXTURE_SCHEME}.value`;
const OPERATION_RENAMED = "renamedItems";

const ITEMS = [{ id: 1 }];
const MISSING_BODY = { message: "e2e-missing" };

const BUTTON_TEST_ID = "e2e-openapi-run";
const RESULT_NAME = "label";
const SUCCESS_NAME = "succeeded";
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

function canned(status: number, body: unknown): { status: number; contentType: string; body: string } {
  return { status, contentType: JSON_CONTENT_TYPE, body: JSON.stringify(body) };
}

/** The request body of the form's dynamic config call: `url` (and optionally `serverURL`) next to the form's two defaults, as recorded from the form. */
function dynamicConfigRequest(echo: EchoTarget, extraFields: Record<string, unknown> = {}): object[] {
  return [
    {
      pluginName: "openApi",
      path: DYNAMIC_CONFIG_PATH,
      dataSourceConfig: { url: `${echo.url}${SPEC_PATH}`, ...extraFields, authConfigType: "NO_AUTH", sslCertVerificationType: "VERIFY_CA_CERT" },
    },
  ];
}

interface DynamicConfigEntry {
  data?: { spec?: string };
  extraParams?: unknown;
}

function dynamicEntriesOf(answer: RawAnswer): DynamicConfigEntry[] {
  return (answer.json as { data?: DynamicConfigEntry[] }).data ?? [];
}

function onlyRecord(records: EchoRecord[]): EchoRecord {
  expect(records, "the echo received exactly one request").toHaveLength(1);
  return records[0] as EchoRecord;
}

/** A data source from the recording whose spec URL and server URL are the echo target's; `config` is merged over it. */
async function openApiDatasource(page: Page, apiUser: RegisteredUser, echo: EchoTarget, config: Record<string, unknown>): Promise<string> {
  return createNodePluginDatasource(page.request, {
    orgId: apiUser.orgId,
    recorded: recordedPluginDatasource("openApi"),
    config: { url: `${echo.url}${SPEC_PATH}`, ...config },
  });
}

/** A saved app with one manual `listItems` query (not published: the draft runs with `viewMode: false`). */
async function openApiApp(page: Page, apiUser: RegisteredUser, datasourceId: string, marker: string): Promise<{ appId: string }> {
  const query = nodePluginQuery({ id: QUERY_ID, name: QUERY_NAME, datasourceId, recorded: recordedPluginQuery("openApi"), action: { [QUERY_PARAM_KEY]: marker } });
  return createApp(page.request, { orgId: apiUser.orgId, name: "e2e-openapi", dsl: appDsl([], { queries: [query] }) });
}

async function runDraft(page: Page, appId: string): Promise<RawAnswer> {
  return executeAppQueryRaw(page.request, { applicationId: appId, queryId: QUERY_ID, viewMode: false });
}

function expectRan(answer: RawAnswer): void {
  expect({ status: answer.status, code: answer.code }, "the query request was answered").toEqual({ status: HTTP_OK, code: API_OK });
}

test.describe("generic openApi data source against the echo", NODE_SERVICE_DETAILS, () => {
  test("D7a: the data source form's dynamic config reads the spec from its URL", async ({ page, apiUser, echo }) => {
    expect(apiUser.orgId, "the test is signed in (the route needs a session)").not.toBe("");
    await echo.answer(SPEC_PATH, canned(HTTP_OK, OPEN_API_FIXTURE_SPEC));
    expect(await echo.received(), "before the request the echo holds nothing of this test").toEqual([]);

    const answer = await pluginDynamicConfigRaw(page.request, dynamicConfigRequest(echo));

    expectRan(answer);
    const entries = dynamicEntriesOf(answer);
    expect(entries, "one answer per request").toHaveLength(1);
    expect(JSON.parse(entries[0]?.data?.spec ?? "null"), "the stored spec is the document the echo served").toEqual(OPEN_API_FIXTURE_SPEC);
    expect(entries[0]?.extraParams, "the form's key field, built from the document's security scheme").toEqual([
      { type: "groupTitle", key: OPEN_API_FIXTURE_SCHEME, label: "Api Key Auth" },
      { type: "password", key: KEY_CONFIG_NAME, label: OPEN_API_FIXTURE_KEY_HEADER },
    ]);
    const record = onlyRecord(await echo.received());
    expect(record.method, "the document is fetched with GET").toBe("GET");
    expect(record.path, "the document's path, no query").toBe(`${echo.path}${SPEC_PATH}`);
    expect(record.body, "no body").toBe("");
  });

  test("D7b: an operation runs against the server URL with the key header", async ({ page, apiUser, echo }) => {
    const id = uniqueMarker();
    const marker = `e2e-q-${id}`;
    const key = `e2e-key-${id}`;
    await echo.answer(ITEMS_PATH, canned(HTTP_OK, ITEMS));
    const datasourceId = await openApiDatasource(page, apiUser, echo, { serverURL: `${echo.url}${API_PATH}`, dynamicParamsConfig: { [KEY_CONFIG_NAME]: key } });
    const { appId } = await openApiApp(page, apiUser, datasourceId, marker);
    expect(await echo.received(), "before the run the echo holds nothing of this test").toEqual([]);

    const answer = await runDraft(page, appId);

    expectRan(answer);
    expect(envelopeOf(answer).success, "the query succeeded").toBe(true);
    expect(envelopeOf(answer).queryCode, "the query code").toBe(QUERY_CODE_OK);
    // positive control for the server URL override: the one request went to the echo (the document's own server is the placeholder host, which is never contacted)
    const record = onlyRecord(await echo.received());
    expect(record.method, "the operation's method").toBe("GET");
    expect(record.path, "the server URL, the operation's path and the query parameter").toBe(`${echo.path}${ITEMS_PATH}?q=${marker}`);
    expect(record.body, "no body").toBe("");
    expect(record.headers["x-e2e-key"], "the key of the data source, in the header the document names").toBe(key);
    expect(record.headers.accept, "swagger-client asks for JSON").toBe(JSON_CONTENT_TYPE);
    expect(envelopeOf(answer).data, "the answer is the body of the echo's canned reply").toEqual(ITEMS);
  });

  test("D7c: the key header comes from the data source, not from the recording", async ({ page, apiUser, echo }) => {
    const marker = `e2e-q-${uniqueMarker()}`;
    await echo.answer(ITEMS_PATH, canned(HTTP_OK, ITEMS));
    // no key configured: the recorded placeholder key is replaced by an empty config
    const datasourceId = await openApiDatasource(page, apiUser, echo, { serverURL: `${echo.url}${API_PATH}`, dynamicParamsConfig: {} });
    const { appId } = await openApiApp(page, apiUser, datasourceId, marker);

    const answer = await runDraft(page, appId);

    expectRan(answer);
    expect(envelopeOf(answer).queryCode, "the query code").toBe(QUERY_CODE_OK);
    const record = onlyRecord(await echo.received());
    expect(record.path, "the request reached the echo (control: the header's absence below is not an unreached echo)").toBe(`${echo.path}${ITEMS_PATH}?q=${marker}`);
    expect(Object.keys(record.headers), "no key header without a configured key").not.toContain("x-e2e-key");
  });

  test("D7d: an error status answers its body as a successful result", ERROR_STATUS_DETAILS, async ({ page, apiUser, echo }) => {
    const marker = `e2e-q-${uniqueMarker()}`;
    await echo.answer(ITEMS_PATH, canned(HTTP_NOT_FOUND, MISSING_BODY));
    const datasourceId = await openApiDatasource(page, apiUser, echo, { serverURL: `${echo.url}${API_PATH}`, dynamicParamsConfig: { [KEY_CONFIG_NAME]: "e2e-key" } });
    const { appId } = await openApiApp(page, apiUser, datasourceId, marker);

    const answer = await runDraft(page, appId);

    // control: the request reached the echo and the echo answered 404 (the canned answer of this path)
    const record = onlyRecord(await echo.received());
    expect(record.path, "the operation's request reached the echo").toBe(`${echo.path}${ITEMS_PATH}?q=${marker}`);
    expectRan(answer);
    // Measured on the images `3.0.0-e2e` and `3.0.1-e2e`: `runOpenApi` returns the body of an error answer as the result (D-69
    // candidate, see ERROR_STATUS_SUCCESS_DEFECT), so the 404 is reported as a successful query.
    expect(envelopeOf(answer).success, "the 404 is reported as success").toBe(true);
    expect(envelopeOf(answer).queryCode, "the query code of the 404").toBe(QUERY_CODE_OK);
    expect(envelopeOf(answer).data, "the result is the error body").toEqual(MISSING_BODY);
  });

  test("D7e: the published view shows the items after a click", async ({ page, apiUser, echo }) => {
    const marker = `e2e-q-${uniqueMarker()}`;
    await echo.answer(ITEMS_PATH, canned(HTTP_OK, ITEMS));
    const datasourceId = await openApiDatasource(page, apiUser, echo, { serverURL: `${echo.url}${API_PATH}`, dynamicParamsConfig: { [KEY_CONFIG_NAME]: "e2e-key" } });
    // before the first run `q.data` is not an array
    const expression = `{{${QUERY_NAME}.data ? ${QUERY_NAME}.data[0].id : ""}}`;
    const view = await openSeededView(
      page,
      apiUser.orgId,
      "e2e-openapi-view",
      stackItems([
        button({ id: "b1", name: "button1", text: "Run", testId: BUTTON_TEST_ID, onClickQuery: QUERY_NAME }),
        boundText({ id: "t1", name: RESULT_NAME, expression }),
        // `success` also reads `true` before the first run (measured for the other node plugins), so only the state after the click proves anything
        boundText({ id: "t2", name: SUCCESS_NAME, expression: `{{String(${QUERY_NAME}.success)}}` }),
      ]),
      { queries: [nodePluginQuery({ id: QUERY_ID, name: QUERY_NAME, datasourceId, recorded: recordedPluginQuery("openApi"), action: { [QUERY_PARAM_KEY]: marker } })] },
    );

    await expect(view.byTestId(boundTextTestId(RESULT_NAME)), "before the click the text is empty").toHaveText("");
    expect(await echo.received(), "before the click the echo holds nothing of this test").toEqual([]);
    await view.buttonByTestId(BUTTON_TEST_ID).click();
    await expect(view.byTestId(boundTextTestId(SUCCESS_NAME)), "after the click the query succeeded").toHaveText("true");
    await expect(view.byTestId(boundTextTestId(RESULT_NAME)), "after the click the text shows the id of the first item").toHaveText(String(ITEMS[0]?.id));
    const record = onlyRecord(await echo.received());
    expect(record.path, "the click sent the operation's request").toBe(`${echo.path}${ITEMS_PATH}?q=${marker}`);
  });
});

test.describe("generic openApi dynamic config cache", NODE_SERVICE_DETAILS, () => {
  test("D7f: the dynamic config answer is cached per request body", CACHE_DETAILS, async ({ page, apiUser, echo }) => {
    expect(apiUser.orgId, "the test is signed in (the route needs a session)").not.toBe("");
    await echo.answer(SPEC_PATH, canned(HTTP_OK, OPEN_API_FIXTURE_SPEC));
    const first = await pluginDynamicConfigRaw(page.request, dynamicConfigRequest(echo));
    expectRan(first);
    expect(dynamicEntriesOf(first)[0]?.data?.spec, "the first answer holds the operation").toContain(OPEN_API_FIXTURE_OPERATION);
    expect(await echo.received(), "the first request fetched the document once").toHaveLength(1);

    // the document changes on the echo: its operation is renamed
    const renamed = JSON.stringify(OPEN_API_FIXTURE_SPEC).replace(OPEN_API_FIXTURE_OPERATION, OPERATION_RENAMED);
    await echo.answer(SPEC_PATH, { status: HTTP_OK, contentType: JSON_CONTENT_TYPE, body: renamed });

    const second = await pluginDynamicConfigRaw(page.request, dynamicConfigRequest(echo));

    expectRan(second);
    expect(second.json, "the same request body is answered from the cache: the identical answer").toEqual(first.json);
    expect(dynamicEntriesOf(second)[0]?.data?.spec, "the cached answer still holds the old operation").toContain(OPEN_API_FIXTURE_OPERATION);
    expect(await echo.received(), "the second request did not fetch the document").toHaveLength(1);

    // control: another request body is not cached, so it fetches the changed document and the rename shows
    const other = await pluginDynamicConfigRaw(page.request, dynamicConfigRequest(echo, { serverURL: `${echo.url}${API_PATH}` }));
    expectRan(other);
    expect(dynamicEntriesOf(other)[0]?.data?.spec, "a new request body reads the changed document").toContain(OPERATION_RENAMED);
    expect(dynamicEntriesOf(other)[0]?.data?.spec, "and no longer holds the old operation").not.toContain(OPEN_API_FIXTURE_OPERATION);
    expect(await echo.received(), "the new request body fetched the document again").toHaveLength(2);
  });
});
