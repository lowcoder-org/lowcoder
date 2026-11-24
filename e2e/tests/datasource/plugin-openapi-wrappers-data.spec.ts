import { randomBytes } from "node:crypto";
import type { Page } from "@playwright/test";
import { createApp, createNodePluginDatasource, executeAppQueryRaw, type RawAnswer, type RegisteredUser } from "../../src/api/client";
import { API_OK, TAGS } from "../../src/constants";
import { appDsl, nodePluginQuery } from "../../src/dsl/builders";
import { recordedPluginDatasource, recordedPluginQuery } from "../../src/dsl/recorded";
import { parseBasicAuthorization, type BasicCredentials } from "../../src/datasource/node-plugins";
import { expect, test } from "../../src/fixtures";
import { recordsContain, type EchoRecord, type EchoTarget } from "../../src/security/echo";

/**
 * D8: the plugins of node-service that wrap one bundled OpenAPI document and take a server URL: CouchDB, Jira, Datadog,
 * WooCommerce and the Supabase Management API (`server/node-service/src/plugins/{couchdb,jira,datadog,woocommerce,supabaseApi}/index.ts`,
 * all running `runOpenApi` of `plugins/openApi/index.ts`). The server URL is the test's own target on the echo sidecar, so the
 * tests prove the request each plugin builds (method, path below the server URL, query, auth header) and the path of a canned
 * answer into the app. They are NOT a fidelity test of any of the services.
 *
 * Each plugin runs one read-only operation of its bundled document:
 * - CouchDB `allDBs`: `GET /_all_dbs` (`CouchDB-3.1.1-resolved.json`, a Swagger 2 document: the server URL is split into host,
 *   base path and scheme, so the `/t/<id>` prefix of the target has to survive as the base path);
 * - Jira `getCurrentUser`: `GET /rest/api/3/myself` (`jira.spec.json`);
 * - Datadog `get_api_v1_validate`: `GET /api/v1/validate` (`datadog.spec.yaml`);
 * - WooCommerce `get_products`: `GET /products` below `<server URL>/wp-json/wc/v3` (`woocommerce-spec.json`, `prepareServerUrl`);
 * - Supabase `v1_list_all_projects`: `GET /v1/projects` (`supabaseApi.spec.json`).
 *
 * The plugins keep their parsed document in a module-level object, and `runOpenApi` rewrites its server URL in place. D8i submits
 * several queries together and checks that each reaches its own server URL with its own data. The echo withholds every answer (a
 * barrier) until all requests of the test are waiting at it, so the canned data reaches the queries only if all of the requests
 * were waiting at the echo at the same time; a group that never fills is answered 504 and fails the test. That says nothing about
 * what happens inside node-service while the requests are built.
 */
const NODE_SERVICE_DETAILS = { tag: [TAGS.NODE_SERVICE] };

/**
 * Observation: a CouchDB data source with both a Basic and a JWT credential sends only the Basic one, because both set the
 * `Authorization` header and the document lists them as one combined requirement (D8f).
 */
const COUCHDB_AUTH_OBSERVATION = { type: "observation", description: "couchdb with Basic and JWT credentials sends only the Basic Authorization header" } as const;
const COUCHDB_AUTH_DETAILS = { annotation: COUCHDB_AUTH_OBSERVATION };

/**
 * Candidate defect: a WooCommerce server URL that already ends in `/wp-json/wc/v3/` (with the trailing slash) is not recognised by
 * `prepareServerUrl`, which then appends `wp-json/wc/v3` a second time.
 */
const WOO_TRAILING_SLASH_DEFECT = { type: "defect", description: "NSD-5 candidate" } as const;
const WOO_TRAILING_SLASH_DETAILS = { annotation: WOO_TRAILING_SLASH_DEFECT };

const HTTP_OK = 200;
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

const WOO_API_PATH = "/wp-json/wc/v3";
/**
 * The query string of the recorded WooCommerce action (measured): the editor saved the defaults of the operation's enumerated
 * parameters (`context`, `order`, `orderby`, `status`, `type`, `stock_status`); the empty ones are not sent.
 */
const WOO_QUERY = "context=view&order=asc&orderby=date&status=any&type=simple&stock_status=instock";
const WOO_REFUSAL_MESSAGE = "only woocommerce api v3 is supported";

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

function canned(body: unknown): { status: number; contentType: string; body: string } {
  return { status: HTTP_OK, contentType: JSON_CONTENT_TYPE, body: JSON.stringify(body) };
}

function onlyRecord(records: EchoRecord[], description: string): EchoRecord {
  expect(records, description).toHaveLength(1);
  return records[0] as EchoRecord;
}

/** The records whose path (below the echo target) starts with `subPath` followed by `/`. */
function recordsUnder(records: EchoRecord[], echo: EchoTarget, subPath: string): EchoRecord[] {
  return records.filter((record) => record.path.startsWith(`${echo.path}${subPath}/`));
}

/** A data source from the recording with `config` merged over it (a key set to `undefined` is left out of the request body). */
async function wrapperDatasource(page: Page, apiUser: RegisteredUser, plugin: string, config: Record<string, unknown>): Promise<string> {
  return createNodePluginDatasource(page.request, { orgId: apiUser.orgId, recorded: recordedPluginDatasource(plugin), config });
}

/** A saved app with the recorded query of `plugin` on the data source (not published: the draft runs with `viewMode: false`). */
async function wrapperApp(page: Page, apiUser: RegisteredUser, plugin: string, datasourceId: string): Promise<string> {
  const query = nodePluginQuery({ id: QUERY_ID, name: QUERY_NAME, datasourceId, recorded: recordedPluginQuery(plugin) });
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
 * Asserts one recorded request completely: method `GET`, the exact path and query, no body, and the exact header set (the headers
 * every plugin request carries plus the credentials: a decoded Basic `Authorization`, or the exact credential headers).
 */
function expectRequest(record: EchoRecord, echo: EchoTarget, expected: { path: string; basic?: BasicCredentials; headers?: Record<string, string> }, label: string): void {
  expect(record.method, `${label}: the method`).toBe("GET");
  expect(record.path, `${label}: the path and query`).toBe(expected.path);
  expect(record.body, `${label}: no body`).toBe("");
  const { authorization, ...otherHeaders } = record.headers;
  if (expected.basic) {
    expect(parseBasicAuthorization(authorization), `${label}: the Authorization header decodes to the configured user and password`).toEqual(expected.basic);
    expect(otherHeaders, `${label}: every other header`).toEqual(commonHeaders(echo));
  } else {
    expect({ authorization, ...otherHeaders }, `${label}: the credential headers and every other header`).toEqual({ ...commonHeaders(echo), ...expected.headers });
  }
}

/** What a row configures as the credentials, and what they must look like on the wire. */
interface AuthSetup {
  /** The data source keys of the credentials, as the form stores them. */
  config: Record<string, unknown>;
  /** Set for Basic auth: the user and password the `Authorization` header must decode to. */
  basic?: BasicCredentials;
  /** Set for API key and bearer auth: the exact header names and values (lower-case names, as the echo records them). */
  headers?: Record<string, string>;
}

interface WrapperRow {
  id: string;
  plugin: string;
  /** The data source key that holds the server URL (`serverUrl` of Jira, `serverURL` of the others). */
  serverKey: string;
  auth: (marker: string) => AuthSetup;
  /** The path of the operation below the server URL, and the query string it carries (measured). */
  operationPath: string;
  operationQuery: string;
  /** The canned answer of the echo and the data the query must return. */
  data: (marker: string) => unknown;
}

const COUCHDB_USER = "e2e-couch-user";

const ROWS: readonly WrapperRow[] = [
  {
    id: "D8a",
    plugin: "couchdb",
    serverKey: "serverURL",
    auth: (marker) => {
      const basic = { user: `${COUCHDB_USER}-${marker}`, password: `e2e-couch-pass-${marker}` };
      // the JWT field is left out of the data source: both credentials would set the same header (D8f)
      return { basic, config: { "BasicAuth.username": basic.user, "BasicAuth.password": basic.password, "JwtAuth.value": undefined } };
    },
    operationPath: "/_all_dbs",
    operationQuery: "",
    data: (marker) => ["_replicator", "_users", `e2e-db-${marker}`],
  },
  {
    id: "D8b",
    plugin: "jira",
    serverKey: "serverUrl",
    auth: (marker) => {
      const basic = { user: `e2e-jira-${marker}@example.test`, password: `e2e-jira-token-${marker}` };
      return { basic, config: { "basicAuth.username": basic.user, "basicAuth.password": basic.password } };
    },
    operationPath: "/rest/api/3/myself",
    operationQuery: "",
    data: (marker) => ({ accountId: `e2e-account-${marker}`, displayName: `E2E ${marker}`, active: true }),
  },
  {
    id: "D8c",
    plugin: "datadog",
    serverKey: "serverURL",
    auth: (marker) => {
      const headers = { "dd-api-key": `e2e-dd-api-${marker}`, "dd-application-key": `e2e-dd-app-${marker}` };
      return { headers, config: { "apiKeyAuth.value": headers["dd-api-key"], "appKeyAuth.value": headers["dd-application-key"] } };
    },
    operationPath: "/api/v1/validate",
    operationQuery: "",
    data: (marker) => ({ valid: true, marker }),
  },
  {
    id: "D8d",
    plugin: "woocommerce",
    serverKey: "serverURL",
    auth: (marker) => {
      const basic = { user: `ck_e2e_${marker}`, password: `cs_e2e_${marker}` };
      return { basic, config: { "basicAuth.username": basic.user, "basicAuth.password": basic.password } };
    },
    operationPath: `${WOO_API_PATH}/products`,
    operationQuery: WOO_QUERY,
    data: (marker) => [{ id: 1, name: `E2E product ${marker}`, status: "publish" }],
  },
  {
    id: "D8e",
    plugin: "supabaseApi",
    serverKey: "serverURL",
    auth: (marker) => {
      const headers = { authorization: `Bearer sbp_e2e_${marker}` };
      return { headers, config: { "bearerAuth.value": `sbp_e2e_${marker}` } };
    },
    operationPath: "/v1/projects",
    operationQuery: "",
    data: (marker) => [{ id: `e2e-project-${marker}`, name: `E2E ${marker}`, region: "eu-central-1" }],
  },
];

/** The path and query string a row's operation is requested with below `base`. */
function requestPathOf(row: WrapperRow, base: string): string {
  return `${base}${row.operationPath}${row.operationQuery ? `?${row.operationQuery}` : ""}`;
}

/** The path of the canned answer: the operation's path without its query string. */
function answerPathOf(row: WrapperRow, base: string): string {
  return `${base}${row.operationPath}`;
}

test.describe("OpenAPI wrapper data sources against the echo", NODE_SERVICE_DETAILS, () => {
  for (const row of ROWS) {
    test(`${row.id} ${row.plugin}: the operation reaches the server URL with its credentials and answers the canned data`, async ({ page, apiUser, echo }) => {
      const marker = uniqueMarker();
      const auth = row.auth(marker);
      const data = row.data(marker);
      await echo.answer(answerPathOf(row, ""), canned(data));
      const datasourceId = await wrapperDatasource(page, apiUser, row.plugin, { [row.serverKey]: echo.url, ...auth.config });
      const appId = await wrapperApp(page, apiUser, row.plugin, datasourceId);
      expect(await echo.received(), "before the run the echo holds nothing of this test").toEqual([]);

      const answer = await runDraft(page, appId);

      expectSucceeded(answer);
      const record = onlyRecord(await echo.received(), "the echo received exactly one request");
      expectRequest(record, echo, { path: `${echo.path}${requestPathOf(row, "")}`, basic: auth.basic, headers: auth.headers }, row.plugin);
      expect(envelopeOf(answer).data, "the answer is the body of the echo's canned reply").toEqual(data);
    });
  }
});

test.describe("CouchDB credentials", NODE_SERVICE_DETAILS, () => {
  test("D8f couchdb: a JWT credential alone is sent as the Authorization header; with a Basic credential only the Basic one is", COUCHDB_AUTH_DETAILS, async ({ page, apiUser, echo }) => {
    const marker = uniqueMarker();
    const jwt = `Bearer e2e-jwt-${marker}`;
    const basic = { user: `${COUCHDB_USER}-${marker}`, password: `e2e-couch-pass-${marker}` };
    const jwtBody = ["jwt-only"];
    const bothBody = ["jwt-and-basic"];
    await echo.answer("/jwt/_all_dbs", canned(jwtBody));
    await echo.answer("/both/_all_dbs", canned(bothBody));
    const jwtOnly = await wrapperDatasource(page, apiUser, "couchdb", {
      serverURL: `${echo.url}/jwt`,
      "BasicAuth.username": undefined,
      "BasicAuth.password": undefined,
      "JwtAuth.value": jwt,
    });
    const both = await wrapperDatasource(page, apiUser, "couchdb", {
      serverURL: `${echo.url}/both`,
      "BasicAuth.username": basic.user,
      "BasicAuth.password": basic.password,
      "JwtAuth.value": jwt,
    });
    const jwtApp = await wrapperApp(page, apiUser, "couchdb", jwtOnly);
    const bothApp = await wrapperApp(page, apiUser, "couchdb", both);
    expect(await echo.received(), "before the runs the echo holds nothing of this test").toEqual([]);

    const jwtAnswer = await runDraft(page, jwtApp);
    const bothAnswer = await runDraft(page, bothApp);

    expectSucceeded(jwtAnswer);
    expectSucceeded(bothAnswer);
    expect(envelopeOf(jwtAnswer).data, "the JWT-only query's data").toEqual(jwtBody);
    expect(envelopeOf(bothAnswer).data, "the combined query's data").toEqual(bothBody);
    const records = await echo.received();
    expect(records, "one request per query").toHaveLength(2);
    const jwtRecord = onlyRecord(recordsUnder(records, echo, "/jwt"), "the JWT-only query sent one request");
    const bothRecord = onlyRecord(recordsUnder(records, echo, "/both"), "the combined query sent one request");
    // the JWT field becomes the Authorization header when it is the only credential
    expectRequest(jwtRecord, echo, { path: `${echo.path}/jwt/_all_dbs`, headers: { authorization: jwt } }, "JWT only");
    // measured on the images `3.0.0-e2e` and `3.0.1-e2e`: with both credentials the Basic one replaces the JWT one
    expectRequest(bothRecord, echo, { path: `${echo.path}/both/_all_dbs`, basic }, "Basic and JWT");
    expect(recordsContain([bothRecord], jwt), "the JWT value is on no part of the combined request (the control above: the request arrived)").toBe(false);
  });
});

test.describe("WooCommerce server URL", NODE_SERVICE_DETAILS, () => {
  test("D8g woocommerce: the API path is appended to a plain server URL, kept when present, and a v1 or v2 URL is refused before any request", async ({ page, apiUser, echo }) => {
    const marker = uniqueMarker();
    const row = ROWS.find((candidate) => candidate.plugin === "woocommerce") as WrapperRow;
    const auth = row.auth(marker);
    const cases = [
      { sub: "/plain", url: `${echo.url}/plain`, base: `/plain` },
      { sub: "/slash", url: `${echo.url}/slash/`, base: `/slash` },
      { sub: "/kept", url: `${echo.url}/kept${WOO_API_PATH}`, base: `/kept` },
    ];
    for (const entry of cases) await echo.answer(answerPathOf(row, entry.base), canned([entry.sub]));
    expect(await echo.received(), "before the runs the echo holds nothing of this test").toEqual([]);

    for (const entry of cases) {
      const datasourceId = await wrapperDatasource(page, apiUser, "woocommerce", { serverURL: entry.url, ...auth.config });
      const answer = await runDraft(page, await wrapperApp(page, apiUser, "woocommerce", datasourceId));
      expectSucceeded(answer);
      expect(envelopeOf(answer).data, `${entry.url}: the canned answer of its own path`).toEqual([entry.sub]);
    }
    const reached = await echo.received();
    expect(reached, "one request per accepted URL").toHaveLength(cases.length);
    cases.forEach((entry, index) => {
      // each below its own base with the API path once
      expectRequest(reached[index] as EchoRecord, echo, { path: `${echo.path}${requestPathOf(row, entry.base)}`, basic: auth.basic }, entry.url);
    });

    // the refused versions: no request leaves the plugin (the three requests above are the control that the echo is reached)
    for (const version of ["v1", "v2"]) {
      const datasourceId = await wrapperDatasource(page, apiUser, "woocommerce", { serverURL: `${echo.url}/refused/wc/${version}`, ...auth.config });
      const answer = await runDraft(page, await wrapperApp(page, apiUser, "woocommerce", datasourceId));
      expectRan(answer);
      expect(envelopeOf(answer).success, `wc/${version}: the query failed`).toBe(false);
      expect(envelopeOf(answer).queryCode, `wc/${version}: the query code`).toBe(QUERY_CODE_FAILED);
      expect(envelopeOf(answer).message, `wc/${version}: the plugin's refusal`).toBe(WOO_REFUSAL_MESSAGE);
    }
    const afterRefusals = await echo.received();
    expect(afterRefusals, "the refused URLs sent nothing: the echo still holds the three requests").toEqual(reached);
  });

  test("D8h woocommerce: a server URL with a trailing slash after the API path gets the API path twice", WOO_TRAILING_SLASH_DETAILS, async ({ page, apiUser, echo }) => {
    const marker = uniqueMarker();
    const row = ROWS.find((candidate) => candidate.plugin === "woocommerce") as WrapperRow;
    const auth = row.auth(marker);
    const doubled = `/twice${WOO_API_PATH}${WOO_API_PATH}`;
    const body = ["doubled"];
    await echo.answer(`${doubled}/products`, canned(body));
    const datasourceId = await wrapperDatasource(page, apiUser, "woocommerce", { serverURL: `${echo.url}/twice${WOO_API_PATH}/`, ...auth.config });
    const appId = await wrapperApp(page, apiUser, "woocommerce", datasourceId);
    expect(await echo.received(), "before the run the echo holds nothing of this test").toEqual([]);

    const answer = await runDraft(page, appId);

    expectSucceeded(answer);
    const record = onlyRecord(await echo.received(), "the request reached the echo");
    // Measured on the images `3.0.0-e2e` and `3.0.1-e2e`: `prepareServerUrl` recognises `/wc/v3` only at the very end of the URL, so
    // the trailing slash makes it append `wp-json/wc/v3` again (NSD-5 candidate, see WOO_TRAILING_SLASH_DEFECT).
    expectRequest(record, echo, { path: `${echo.path}${doubled}/products?${WOO_QUERY}`, basic: auth.basic }, "doubled API path");
    expect(envelopeOf(answer).data, "the canned answer of the doubled path").toEqual(body);
  });
});

/**
 * How long the echo withholds the answers of D8i until all queries of the test are waiting at it. The slowest start is datadog:
 * its document is dereferenced on every run (about 0.7 s each, one after the other on node-service's single thread), so 4 queries
 * arrive within about 3 s; the 10 s query timeout of the app is the outer limit.
 */
const BARRIER_TIMEOUT_MS = 8_000;

/** How many queries run at once against each plugin, and the share of them per server URL: half and half. Datadog's document is large and is dereferenced on every run (measured about 0.7 s each, and more under load), so it gets fewer. */
const CONCURRENT_RUNS: Record<string, number> = { couchdb: 8, woocommerce: 8, datadog: 4 };

test.describe("concurrent queries of one plugin", NODE_SERVICE_DETAILS, () => {
  for (const [plugin, runs] of Object.entries(CONCURRENT_RUNS)) {
    test(`D8i ${plugin}: queries submitted together against two server URLs each reach their own server, with all requests waiting at the echo at once`, async ({ page, apiUser, echo }) => {
      const row = ROWS.find((candidate) => candidate.plugin === plugin) as WrapperRow;
      const marker = uniqueMarker();
      const auth = row.auth(marker);
      const sides = ["a", "b"] as const;
      const apps: Record<string, string> = {};
      for (const side of sides) {
        await echo.answer(answerPathOf(row, `/${side}`), { ...canned({ side }), barrier: { subPath: "/", count: runs, timeoutMs: BARRIER_TIMEOUT_MS } });
        const datasourceId = await wrapperDatasource(page, apiUser, plugin, { [row.serverKey]: `${echo.url}/${side}`, ...auth.config });
        apps[side] = await wrapperApp(page, apiUser, plugin, datasourceId);
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
          expectRequest(record, echo, { path: `${echo.path}${requestPathOf(row, `/${side}`)}`, basic: auth.basic, headers: auth.headers }, `server ${side}, request ${index}`);
        });
      }
    });
  }
});
