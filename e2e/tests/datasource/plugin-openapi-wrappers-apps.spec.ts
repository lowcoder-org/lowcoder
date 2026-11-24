import { randomBytes } from "node:crypto";
import type { Page } from "@playwright/test";
import { createApp, createNodePluginDatasource, executeAppQueryRaw, pluginDynamicConfigRaw, type RawAnswer, type RegisteredUser } from "../../src/api/client";
import { API_OK, TAGS } from "../../src/constants";
import { appDsl, nodePluginQuery } from "../../src/dsl/builders";
import { recordedPluginDatasource, recordedPluginQuery } from "../../src/dsl/recorded";
import { expect, test } from "../../src/fixtures";
import type { EchoRecord, EchoTarget } from "../../src/security/echo";

/**
 * D9: the plugins of node-service that wrap one bundled OpenAPI document and take a server URL: the Lowcoder API, OpenAI, APITemplate.io,
 * Carbone and UiPath (`server/node-service/src/plugins/{lowcoder,openAi,apiTemplate,carboneIo,uiPath}/index.ts`, all running `runOpenApi` of
 * `plugins/openApi/index.ts`). The server URL is the test's own target on the echo sidecar, so the tests prove the request each plugin
 * builds (method, path below the server URL, query, credential headers, body) and the path of a canned answer into the app. They are NOT a
 * fidelity test of any of the services.
 *
 * Each plugin runs one read-only operation of its bundled document:
 * - Lowcoder `getUserInfo`: `GET /api/users/currentUser` (every spec version, `lowcoder.spec-v1.0.json` to `-v1.3.json`);
 * - OpenAI `listModels`: `GET /models` (`openAI_v2.3.0.json`; the data source's `specVersion` picks the document);
 * - APITemplate `list_templates`: `GET /v2/list-templates` (`apiTemplate.spec.json`);
 * - Carbone `get_status`: `GET /status` and `get_template__templateId_`: `GET /template/{templateId}` (`carboneIo.spec.json`);
 * - UiPath `Folders_Get`: `GET /odata/Folders` (`uiPath.spec.json`); measured: this plugin cannot run any operation (D9j to D9l).
 *
 * The plugins keep their parsed document in a module-level object, and `runOpenApi` rewrites its server URL in place. D9m submits several
 * queries together and checks that each reaches its own server URL with its own data. The echo withholds every answer (a barrier) until all
 * requests of the test are waiting at it, so the canned data reaches the queries only if all of the requests were waiting at the echo at the
 * same time; a group that never fills is answered 504 and fails the test. That says nothing about what happens inside node-service while the
 * requests are built.
 */
const NODE_SERVICE_DETAILS = { tag: [TAGS.NODE_SERVICE] };

/** Candidate defect: an error status answer with a body is returned as the query's successful result (the generic plugin's D7d shows the same). */
const ERROR_STATUS_SUCCESS_DEFECT = { type: "defect", description: "NSD-4 candidate" } as const;
const ERROR_STATUS_DETAILS = { annotation: ERROR_STATUS_SUCCESS_DEFECT };

/**
 * Candidate defect: the UiPath plugin cannot run: `getSchemaExample` (`plugins/openApi/util.ts`) recurses without end on a circular schema of
 * the bundled document, so its query configuration (what the editor lists) and every query fail with `Maximum call stack size exceeded`.
 */
const UIPATH_DEFECT = { type: "defect", description: "NSD-6 candidate" } as const;
const UIPATH_DETAILS = { annotation: UIPATH_DEFECT };
/** The desired behaviour of the UiPath plugin: it fails today, so it is quarantined (the enclosing describe adds `@node-service`). */
const UIPATH_QUARANTINE_DETAILS = { tag: [TAGS.QUARANTINE], annotation: UIPATH_DEFECT };

/**
 * Candidate defect: an OpenAI data source on the spec version `v1.0` (the default when none is chosen) sends no `Authorization` header: the
 * plugin hands the key over as `ApiKeyAuth.value`, the scheme of the `v2.3` document, while the `v1.0` document names its scheme `ApiKey`.
 */
const OPENAI_V1_AUTH_DEFECT = { type: "defect", description: "NSD-7 candidate" } as const;
const OPENAI_V1_AUTH_DETAILS = { annotation: OPENAI_V1_AUTH_DEFECT };

/** Observation: a Carbone data source sends its token only with the operations whose document entry lists the `bearerAuth` scheme; `get_status` does not. */
const CARBONE_STATUS_OBSERVATION = { type: "observation", description: "carboneIo get_status sends no Authorization header: the operation lists no security scheme" } as const;
const CARBONE_STATUS_DETAILS = { annotation: CARBONE_STATUS_OBSERVATION };

const HTTP_OK = 200;
const HTTP_NOT_FOUND = 404;
const HTTP_SERVER_ERROR = 500;
const QUERY_CODE_OK = "OK";
const QUERY_CODE_FAILED = "FAILED";
const JSON_CONTENT_TYPE = "application/json";
const MARKER_BYTES = 4;
const QUERY_ID = "q1";
const QUERY_NAME = "q";

/** Request headers of node-service's HTTP client (`node-fetch` through `common/fetch.ts`) that every plugin request carries, measured on the images `3.0.0-e2e` and `3.0.1-e2e`. */
const NODE_FETCH_USER_AGENT = "node-fetch/1.0 (+https://github.com/bitinn/node-fetch)";
const ACCEPT_ENCODING = "gzip,deflate";
const CONNECTION_CLOSE = "close";

/** The OpenAI document versions: `v1.0` is what an empty `specVersion` selects, `v2.3` is the one whose scheme the plugin's key reaches. */
const OPENAI_SPEC_V1 = "v1.0";
const OPENAI_SPEC_V2 = "v2.3";
const LOWCODER_SPEC_VERSIONS = ["v1.0", "v1.1", "v1.2", "v1.3"] as const;

/** The operations the rows run, by the name the editor stores. `get_template__templateId_` and `createChatCompletion` are not the recorded ones: the action keys below are what the editor saved for them. */
const CARBONE_TEMPLATE_ACTION = "get_template__templateId_";
const CARBONE_TEMPLATE_ID_KEY = "path_@_templateId";
const CARBONE_VERSION_KEY = "header_@_carbone-version";
const CARBONE_VERSION = "4";
const CHAT_ACTION = "createChatCompletion";
const CHAT_BODY_KEY = "body_@_body";

/** What UiPath's error answers: the node-service message of a failed query (`runPluginQuery`) and the answer of the form's dynamic config. */
const UIPATH_FAILURE_MESSAGE = "Maximum call stack size exceeded";
const DYNAMIC_CONFIG_ERROR_CODE = 5000;
const DYNAMIC_CONFIG_ERROR_MESSAGE = "get dynamic config error";
/** The path of the plugin's query configuration in a dynamic config request (`pluginMetaOps`, `services/plugin.ts`). */
const QUERY_CONFIG_PATH = "$.queryConfig";
const FORM_DEFAULTS = { authConfigType: "NO_AUTH", sslCertVerificationType: "VERIFY_CA_CERT" } as const;

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

function canned(body: unknown, status = HTTP_OK): { status: number; contentType: string; body: string } {
  return { status, contentType: JSON_CONTENT_TYPE, body: JSON.stringify(body) };
}

function onlyRecord(records: EchoRecord[], description: string): EchoRecord {
  expect(records, description).toHaveLength(1);
  return records[0] as EchoRecord;
}

/** The records whose path (below the echo target) starts with `subPath` followed by `/`. */
function recordsUnder(records: EchoRecord[], echo: EchoTarget, subPath: string): EchoRecord[] {
  return records.filter((record) => record.path.startsWith(`${echo.path}${subPath}/`));
}

/** What a query of the recording changes: another operation of the same plugin, with its action keys (as the editor saved them). */
interface QueryVariant {
  actionName?: string;
  action?: Record<string, unknown>;
}

/** A data source from the recording with `config` merged over it. */
async function wrapperDatasource(page: Page, apiUser: RegisteredUser, plugin: string, config: Record<string, unknown>): Promise<string> {
  return createNodePluginDatasource(page.request, { orgId: apiUser.orgId, recorded: recordedPluginDatasource(plugin), config });
}

/** A saved app with the recorded query of `plugin` (or a variant of it) on the data source (not published: the draft runs with `viewMode: false`). */
async function wrapperApp(page: Page, apiUser: RegisteredUser, plugin: string, datasourceId: string, variant: QueryVariant = {}): Promise<string> {
  const recorded = recordedPluginQuery(plugin);
  if (variant.actionName) recorded.comp.actionName = variant.actionName;
  const query = nodePluginQuery({ id: QUERY_ID, name: QUERY_NAME, datasourceId, recorded, action: variant.action });
  const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: `e2e-${plugin}`, dsl: appDsl([], { queries: [query] }) });
  return appId;
}

async function runDraft(page: Page, appId: string): Promise<RawAnswer> {
  return executeAppQueryRaw(page.request, { applicationId: appId, queryId: QUERY_ID, viewMode: false });
}

function expectRan(answer: RawAnswer): void {
  expect({ status: answer.status, code: answer.code }, "the query request was answered").toEqual({ status: HTTP_OK, code: API_OK });
}

function expectSucceeded(answer: RawAnswer): void {
  expectRan(answer);
  expect(envelopeOf(answer).success, "the query succeeded").toBe(true);
  expect(envelopeOf(answer).queryCode, "the query code").toBe(QUERY_CODE_OK);
}

/** The request headers a plugin request carries besides its credentials: `host` is the echo's. */
function commonHeaders(echo: EchoTarget): Record<string, string> {
  return {
    accept: JSON_CONTENT_TYPE,
    "user-agent": NODE_FETCH_USER_AGENT,
    "accept-encoding": ACCEPT_ENCODING,
    host: new URL(echo.url).host,
    connection: CONNECTION_CLOSE,
  };
}

/**
 * Asserts one recorded request completely: the method, the exact path and query, the exact body, and the exact header set (the headers
 * every plugin request carries plus the `headers` of the call: the credential headers, and for a body the `content-type` and `content-length`).
 */
function expectRequest(
  record: EchoRecord,
  echo: EchoTarget,
  expected: { method?: string; path: string; body?: string; headers?: Record<string, string> },
  label: string,
): void {
  expect(record.method, `${label}: the method`).toBe(expected.method ?? "GET");
  expect(record.path, `${label}: the path and query`).toBe(expected.path);
  expect(record.body, `${label}: the body`).toBe(expected.body ?? "");
  expect(record.headers, `${label}: the complete header set`).toEqual({ ...commonHeaders(echo), ...expected.headers });
}

/** What a row configures as the credentials, and what they must look like on the wire. */
interface AuthSetup {
  /** The data source keys of the credentials and the other settings, as the form stores them. */
  config: Record<string, unknown>;
  /** The exact credential headers (lower-case names, as the echo records them); none when the plugin sends none. */
  headers: Record<string, string>;
}

interface WrapperRow {
  id: string;
  plugin: string;
  /** The operation: its recorded query, or the variant of it. */
  variant: QueryVariant;
  auth: (marker: string) => AuthSetup;
  /** The path of the operation below the server URL, and the query string it carries (measured). */
  operationPath: (marker: string) => string;
  operationQuery: string;
  /** The extra headers of the operation's own parameters (measured). */
  operationHeaders?: Record<string, string>;
  /** The canned answer of the echo and the data the query must return. */
  data: (marker: string) => unknown;
}

const ROWS: readonly WrapperRow[] = [
  {
    id: "D9a",
    plugin: "lowcoder",
    variant: {},
    auth: (marker) => ({ headers: { authorization: `Bearer e2e-lowcoder-${marker}` }, config: { "bearerAuth.value": `e2e-lowcoder-${marker}` } }),
    operationPath: () => "/api/users/currentUser",
    operationQuery: "",
    data: (marker) => ({ id: `e2e-user-${marker}`, name: `E2E ${marker}`, orgs: [] }),
  },
  {
    id: "D9b",
    plugin: "OpenAI",
    variant: {},
    // `v2.3` is the document whose scheme the key reaches (D9h shows `v1.0`)
    auth: (marker) => ({ headers: { authorization: `Bearer e2e-openai-${marker}` }, config: { apiKey: `e2e-openai-${marker}`, specVersion: OPENAI_SPEC_V2 } }),
    operationPath: () => "/models",
    operationQuery: "",
    data: (marker) => ({ object: "list", data: [{ id: `e2e-model-${marker}`, object: "model" }] }),
  },
  {
    id: "D9c",
    plugin: "apiTemplate",
    variant: {},
    auth: (marker) => ({ headers: { "x-api-key": `e2e-apitemplate-${marker}` }, config: { "ApiKeyAuth.value": `e2e-apitemplate-${marker}` } }),
    operationPath: () => "/v2/list-templates",
    // the recorded action's parameters are empty, and an empty parameter is not sent (measured)
    operationQuery: "",
    data: (marker) => ({ status: "success", templates: [{ template_id: `e2e-template-${marker}`, name: `E2E ${marker}` }] }),
  },
  {
    id: "D9d",
    plugin: "carboneIo",
    variant: {},
    // measured: the token configured for the data source is NOT sent with `get_status`, whose document entry lists no security scheme (D9e shows it is sent with a template operation)
    auth: (marker) => ({ headers: {}, config: { "bearerAuth.value": `e2e-carbone-${marker}` } }),
    operationPath: () => "/status",
    operationQuery: "",
    data: (marker) => ({ success: true, code: 200, message: `OK ${marker}`, version: "4.0.0" }),
  },
  {
    id: "D9e",
    plugin: "carboneIo",
    variant: { actionName: CARBONE_TEMPLATE_ACTION },
    auth: (marker) => ({ headers: { authorization: `Bearer e2e-carbone-${marker}` }, config: { "bearerAuth.value": `e2e-carbone-${marker}` } }),
    operationPath: (marker) => `/template/e2e-template-${marker}`,
    operationQuery: "",
    operationHeaders: { "carbone-version": CARBONE_VERSION },
    data: (marker) => ({ success: true, data: { id: `e2e-template-${marker}` } }),
  },
];

/** The variant of a row with its marker-bound action keys (the template id). */
function variantOf(row: WrapperRow, marker: string): QueryVariant {
  return row.id === "D9e"
    ? { ...row.variant, action: { [CARBONE_TEMPLATE_ID_KEY]: `e2e-template-${marker}`, [CARBONE_VERSION_KEY]: CARBONE_VERSION } }
    : row.variant;
}

/** The path and query string a row's operation is requested with below `base`. */
function requestPathOf(row: WrapperRow, marker: string, base: string): string {
  return `${base}${row.operationPath(marker)}${row.operationQuery ? `?${row.operationQuery}` : ""}`;
}

/** The path of the canned answer: the operation's path without its query string. */
function answerPathOf(row: WrapperRow, marker: string, base: string): string {
  return `${base}${row.operationPath(marker)}`;
}

test.describe("OpenAPI wrapper data sources against the echo", NODE_SERVICE_DETAILS, () => {
  for (const row of ROWS) {
    const details = row.id === "D9d" ? CARBONE_STATUS_DETAILS : {};
    test(`${row.id} ${row.plugin}${row.variant.actionName ? ` ${row.variant.actionName}` : ""}: the operation reaches the server URL with its credentials and answers the canned data`, details, async ({ page, apiUser, echo }) => {
      const marker = uniqueMarker();
      const auth = row.auth(marker);
      const data = row.data(marker);
      await echo.answer(answerPathOf(row, marker, ""), canned(data));
      const datasourceId = await wrapperDatasource(page, apiUser, row.plugin, { serverURL: echo.url, ...auth.config });
      const appId = await wrapperApp(page, apiUser, row.plugin, datasourceId, variantOf(row, marker));
      expect(await echo.received(), "before the run the echo holds nothing of this test").toEqual([]);

      const answer = await runDraft(page, appId);

      expectSucceeded(answer);
      const record = onlyRecord(await echo.received(), "the echo received exactly one request");
      expectRequest(record, echo, { path: `${echo.path}${requestPathOf(row, marker, "")}`, headers: { ...auth.headers, ...row.operationHeaders } }, row.plugin);
      expect(envelopeOf(answer).data, "the answer is the body of the echo's canned reply").toEqual(data);
    });
  }
});

test.describe("Lowcoder API spec versions", NODE_SERVICE_DETAILS, () => {
  test("D9f lowcoder: every spec version sends the same current-user request with the token as a Bearer header", async ({ page, apiUser, echo }) => {
    const marker = uniqueMarker();
    const token = `e2e-lowcoder-${marker}`;
    for (const version of LOWCODER_SPEC_VERSIONS) await echo.answer(`/${version}/api/users/currentUser`, canned({ version }));
    expect(await echo.received(), "before the runs the echo holds nothing of this test").toEqual([]);

    for (const version of LOWCODER_SPEC_VERSIONS) {
      const datasourceId = await wrapperDatasource(page, apiUser, "lowcoder", { serverURL: `${echo.url}/${version}`, "bearerAuth.value": token, specVersion: version });
      const answer = await runDraft(page, await wrapperApp(page, apiUser, "lowcoder", datasourceId));
      expectSucceeded(answer);
      expect(envelopeOf(answer).data, `${version}: the canned answer of its own path`).toEqual({ version });
    }

    const records = await echo.received();
    expect(records, "one request per version").toHaveLength(LOWCODER_SPEC_VERSIONS.length);
    LOWCODER_SPEC_VERSIONS.forEach((version, index) => {
      expectRequest(records[index] as EchoRecord, echo, { path: `${echo.path}/${version}/api/users/currentUser`, headers: { authorization: `Bearer ${token}` } }, version);
    });
  });
});

test.describe("OpenAI", NODE_SERVICE_DETAILS, () => {
  test("D9g OpenAI: a chat completion posts its JSON body to the server URL with the key and answers the canned completion", async ({ page, apiUser, echo }) => {
    const marker = uniqueMarker();
    const key = `e2e-openai-${marker}`;
    const body = { model: `e2e-model-${marker}`, messages: [{ role: "user", content: `hello ${marker}` }] };
    const completion = { id: `e2e-completion-${marker}`, object: "chat.completion", choices: [{ index: 0, message: { role: "assistant", content: `hi ${marker}` } }] };
    await echo.answer("/chat/completions", canned(completion));
    const datasourceId = await wrapperDatasource(page, apiUser, "OpenAI", { serverURL: echo.url, apiKey: key, specVersion: OPENAI_SPEC_V2 });
    const appId = await wrapperApp(page, apiUser, "OpenAI", datasourceId, { actionName: CHAT_ACTION, action: { [CHAT_BODY_KEY]: JSON.stringify(body) } });
    expect(await echo.received(), "before the run the echo holds nothing of this test").toEqual([]);

    const answer = await runDraft(page, appId);

    expectSucceeded(answer);
    const record = onlyRecord(await echo.received(), "the echo received exactly one request");
    const sent = JSON.stringify(body);
    expectRequest(
      record,
      echo,
      { method: "POST", path: `${echo.path}/chat/completions`, body: sent, headers: { authorization: `Bearer ${key}`, "content-type": JSON_CONTENT_TYPE, "content-length": String(Buffer.byteLength(sent)) } },
      "chat completion",
    );
    expect(envelopeOf(answer).data, "the answer is the body of the echo's canned reply").toEqual(completion);
  });

  test("D9h OpenAI: on the spec version v1.0, chosen or by default, the key is sent nowhere; on v2.3 it is sent as a Bearer header", OPENAI_V1_AUTH_DETAILS, async ({ page, apiUser, echo }) => {
    const marker = uniqueMarker();
    const key = `e2e-openai-${marker}`;
    const sides = [
      { side: "default", config: {} },
      { side: "v1", config: { specVersion: OPENAI_SPEC_V1 } },
      { side: "v2", config: { specVersion: OPENAI_SPEC_V2 } },
    ];
    for (const { side } of sides) await echo.answer(`/${side}/models`, canned({ side }));
    expect(await echo.received(), "before the runs the echo holds nothing of this test").toEqual([]);

    for (const { side, config } of sides) {
      const datasourceId = await wrapperDatasource(page, apiUser, "OpenAI", { serverURL: `${echo.url}/${side}`, apiKey: key, ...config });
      const answer = await runDraft(page, await wrapperApp(page, apiUser, "OpenAI", datasourceId));
      expectSucceeded(answer);
      expect(envelopeOf(answer).data, `${side}: the canned answer of its own path`).toEqual({ side });
    }

    const records = await echo.received();
    expect(records, "one request per data source").toHaveLength(sides.length);
    // control: with the same key on the same server the v2.3 document sends it, so the missing header below is the plugin's, not the echo's
    expectRequest(onlyRecord(recordsUnder(records, echo, "/v2"), "v2.3 sent one request"), echo, { path: `${echo.path}/v2/models`, headers: { authorization: `Bearer ${key}` } }, "v2.3");
    // Measured on the images `3.0.0-e2e` and `3.0.1-e2e`: the v1.0 document names its scheme `ApiKey`, the plugin hands the key over as `ApiKeyAuth.value`, so no header is sent (NSD-7 candidate, see OPENAI_V1_AUTH_DEFECT).
    expectRequest(onlyRecord(recordsUnder(records, echo, "/default"), "the default version sent one request"), echo, { path: `${echo.path}/default/models` }, "default version");
    expectRequest(onlyRecord(recordsUnder(records, echo, "/v1"), "v1.0 sent one request"), echo, { path: `${echo.path}/v1/models` }, "v1.0");
    expect(JSON.stringify([records[0], records[1]]).includes(key), "the key is on no part of the v1.0 and default requests").toBe(false);
  });
});

test.describe("an error answer", NODE_SERVICE_DETAILS, () => {
  test("D9i apiTemplate: an error status answers its body as a successful result", ERROR_STATUS_DETAILS, async ({ page, apiUser, echo }) => {
    const marker = uniqueMarker();
    const row = ROWS.find((candidate) => candidate.plugin === "apiTemplate") as WrapperRow;
    const auth = row.auth(marker);
    const body = { status: "error", message: `e2e-missing-${marker}` };
    await echo.answer(answerPathOf(row, marker, ""), canned(body, HTTP_NOT_FOUND));
    const datasourceId = await wrapperDatasource(page, apiUser, row.plugin, { serverURL: echo.url, ...auth.config });
    const appId = await wrapperApp(page, apiUser, row.plugin, datasourceId);

    const answer = await runDraft(page, appId);

    // control: the request reached the echo and the echo answered 404 (the canned answer of this path)
    const record = onlyRecord(await echo.received(), "the request reached the echo");
    expectRequest(record, echo, { path: `${echo.path}${requestPathOf(row, marker, "")}`, headers: auth.headers }, row.plugin);
    expectRan(answer);
    // Measured on the images `3.0.0-e2e` and `3.0.1-e2e`: `runOpenApi` returns the body of an error answer as the result (NSD-4 candidate, see ERROR_STATUS_SUCCESS_DEFECT), so the 404 is reported as a successful query.
    expect(envelopeOf(answer).success, "the 404 is reported as success").toBe(true);
    expect(envelopeOf(answer).queryCode, "the query code of the 404").toBe(QUERY_CODE_OK);
    expect(envelopeOf(answer).data, "the result is the error body").toEqual(body);
  });
});

/** The APITemplate request of the control in the UiPath tests: it reaches the same echo target, so a missing UiPath request is not an unreachable echo. */
async function expectApiTemplateReachesEcho(page: Page, apiUser: RegisteredUser, echo: EchoTarget, marker: string): Promise<void> {
  const row = ROWS.find((candidate) => candidate.plugin === "apiTemplate") as WrapperRow;
  const auth = row.auth(marker);
  await echo.answer(answerPathOf(row, marker, ""), canned(row.data(marker)));
  const datasourceId = await wrapperDatasource(page, apiUser, row.plugin, { serverURL: echo.url, ...auth.config });
  const answer = await runDraft(page, await wrapperApp(page, apiUser, row.plugin, datasourceId));
  expectSucceeded(answer);
  expectRequest(onlyRecord(await echo.received(), "the control query's request reached the echo"), echo, { path: `${echo.path}${requestPathOf(row, marker, "")}`, headers: auth.headers }, "control (apiTemplate)");
}

test.describe("UiPath", NODE_SERVICE_DETAILS, () => {
  test("D9j uiPath: a query fails with a stack overflow of the plugin and sends no request", UIPATH_DETAILS, async ({ page, apiUser, echo }) => {
    const marker = uniqueMarker();
    const datasourceId = await wrapperDatasource(page, apiUser, "uiPath", { serverURL: echo.url, "Authorization.value": `e2e-uipath-${marker}` });
    const appId = await wrapperApp(page, apiUser, "uiPath", datasourceId);
    expect(await echo.received(), "before the run the echo holds nothing of this test").toEqual([]);

    const answer = await runDraft(page, appId);

    expectRan(answer);
    // Measured on the images `3.0.0-e2e` and `3.0.1-e2e` (NSD-6 candidate, see UIPATH_DEFECT).
    expect(envelopeOf(answer).success, "the query failed").toBe(false);
    expect(envelopeOf(answer).queryCode, "the query code").toBe(QUERY_CODE_FAILED);
    expect(envelopeOf(answer).message, "node-service's message").toBe(UIPATH_FAILURE_MESSAGE);
    expect(await echo.received(), "no request left the plugin").toEqual([]);
    // positive control: another wrapper's query against the same echo target arrives (the empty list above is not an unreachable echo)
    await expectApiTemplateReachesEcho(page, apiUser, echo, marker);
  });

  test("D9k uiPath: the data source form's query configuration request fails with HTTP 500 / code 5000, while the same request for APITemplate succeeds and lists its operations", UIPATH_DETAILS, async ({ page, apiUser, echo }) => {
    expect(apiUser.orgId, "the test is signed in (the route needs a session)").not.toBe("");
    // the request body is the key of node-service's in-memory cache: the target's URL makes both bodies unique to this test
    const dataSourceConfig = { serverURL: echo.url, ...FORM_DEFAULTS };

    const answer = await pluginDynamicConfigRaw(page.request, [{ pluginName: "uiPath", path: QUERY_CONFIG_PATH, dataSourceConfig }]);

    // Measured on the images `3.0.0-e2e` and `3.0.1-e2e` (NSD-6 candidate, see UIPATH_DEFECT): the request for the UiPath document fails, so the editor
    // cannot list a single operation. The test asserts the failure of this request and, below, that the same request shape succeeds for another
    // plugin; the cause (a `RangeError: Maximum call stack size exceeded` in `getSchemaExample`) was seen in node-service's log while recording, the suite cannot read that log.
    expect(answer.status, "the HTTP status").toBe(HTTP_SERVER_ERROR);
    expect(answer.code, "the API code").toBe(DYNAMIC_CONFIG_ERROR_CODE);
    expect((answer.json as { message?: string; success?: boolean }).message, "the message").toBe(DYNAMIC_CONFIG_ERROR_MESSAGE);
    expect((answer.json as { success?: boolean }).success, "success").toBe(false);
    // positive control: the identical request (same path and data source settings) for APITemplate succeeds and lists its operations, so the
    // failure above is specific to the UiPath document and not to the route, the session or the request shape
    const control = await pluginDynamicConfigRaw(page.request, [{ pluginName: "apiTemplate", path: QUERY_CONFIG_PATH, dataSourceConfig }]);
    expectRan(control);
    expect((control.json as { success?: boolean }).success, "the control request succeeded").toBe(true);
    const entry = (control.json as { data?: { actions?: { actionName?: string }[] }[] }).data?.[0];
    expect(entry?.actions?.map((action) => action.actionName), "the operations APITemplate's configuration lists").toContain("list_templates");
  });

  test("D9l uiPath: a folders query reaches the server URL with the token as a Bearer header and answers the canned data", UIPATH_QUARANTINE_DETAILS, async ({ page, apiUser, echo }) => {
    const marker = uniqueMarker();
    const token = `e2e-uipath-${marker}`;
    const data = { "@odata.count": 1, value: [{ Id: 1, DisplayName: `E2E folder ${marker}` }] };
    await echo.answer("/odata/Folders", canned(data));
    const datasourceId = await wrapperDatasource(page, apiUser, "uiPath", { serverURL: echo.url, "Authorization.value": token });
    const appId = await wrapperApp(page, apiUser, "uiPath", datasourceId);
    expect(await echo.received(), "before the run the echo holds nothing of this test").toEqual([]);

    const answer = await runDraft(page, appId);

    // The desired behaviour, not a measured one: it fails today (D9j). `Bearer <token>` exactly, not doubled and not missing.
    expectSucceeded(answer);
    const record = onlyRecord(await echo.received(), "the echo received exactly one request");
    expectRequest(record, echo, { path: `${echo.path}/odata/Folders`, headers: { authorization: `Bearer ${token}` } }, "uiPath");
    expect(envelopeOf(answer).data, "the answer is the body of the echo's canned reply").toEqual(data);
  });
});

/**
 * How long the echo withholds the answers of D9m until all queries of the test are waiting at it. The slowest start is OpenAI's v2.3
 * document (825 KB, dereferenced on every run, one run after the other on node-service's single thread); the 10 s query timeout of the app
 * is the outer limit.
 */
const BARRIER_TIMEOUT_MS = 8_000;

/** How many queries run at once against each plugin, and the share of them per server URL: half and half. OpenAI's document is large, so it gets fewer. */
const CONCURRENT_RUNS: Record<string, number> = { lowcoder: 8, apiTemplate: 8, carboneIo: 8, OpenAI: 4 };

test.describe("concurrent queries of one plugin", NODE_SERVICE_DETAILS, () => {
  for (const [plugin, runs] of Object.entries(CONCURRENT_RUNS)) {
    test(`D9m ${plugin}: queries submitted together against two server URLs each reach their own server, with all requests waiting at the echo at once`, async ({ page, apiUser, echo }) => {
      const row = ROWS.find((candidate) => candidate.plugin === plugin) as WrapperRow;
      const marker = uniqueMarker();
      const auth = row.auth(marker);
      const sides = ["a", "b"] as const;
      const apps: Record<string, string> = {};
      for (const side of sides) {
        await echo.answer(answerPathOf(row, marker, `/${side}`), { ...canned({ side }), barrier: { subPath: "/", count: runs, timeoutMs: BARRIER_TIMEOUT_MS } });
        const datasourceId = await wrapperDatasource(page, apiUser, plugin, { serverURL: `${echo.url}/${side}`, ...auth.config });
        apps[side] = await wrapperApp(page, apiUser, plugin, datasourceId, variantOf(row, marker));
      }
      expect(await echo.received(), "before the runs the echo holds nothing of this test").toEqual([]);

      const runsOf = Array.from({ length: runs }, (_, index) => sides[index % sides.length] as (typeof sides)[number]);
      // the echo answers only once all `runs` requests are waiting at it, so success below proves all requests were waiting at the echo at the same time
      const answers = await Promise.all(runsOf.map((side) => runDraft(page, apps[side] as string)));

      answers.forEach((answer, index) => {
        const side = runsOf[index];
        expectSucceeded(answer);
        expect(envelopeOf(answer).data, `run ${index} against server ${side}: the data of its own server`).toEqual({ side });
      });
      const records = await echo.received();
      expect(records, "one request per run").toHaveLength(runs);
      for (const side of sides) {
        const own = recordsUnder(records, echo, `/${side}`);
        expect(own, `server ${side} received exactly its share`).toHaveLength(runs / sides.length);
        own.forEach((record, index) => {
          expectRequest(record, echo, { path: `${echo.path}${requestPathOf(row, marker, `/${side}`)}`, headers: { ...auth.headers, ...row.operationHeaders } }, `server ${side}, request ${index}`);
        });
      }
    });
  }
});
