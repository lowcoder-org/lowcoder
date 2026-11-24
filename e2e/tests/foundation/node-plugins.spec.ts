import { readFileSync } from "node:fs";
import { createServer, type IncomingMessage, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { createNodePluginDatasource, LowcoderApiError, nodePluginDatasourceBody, pluginDynamicConfigRaw, testDatasourceRaw } from "../../src/api/client";
import { API_OK, API_PATHS, orgDatasourceTypesPath, TAGS } from "../../src/constants";
import { nodePluginQuery } from "../../src/dsl/builders";
import {
  parsePluginRecording,
  RECORDED_PLUGINS_DIR,
  RecordedFixtureError,
  recordedPluginDatasource,
  recordedPluginQuery,
  type RecordedPluginDatasource,
  type RecordedPluginQuery,
} from "../../src/dsl/recorded";
import {
  NODE_PLUGIN_FIXTURE_PLACEHOLDER_URL,
  NODE_PLUGIN_IDS,
  nodePluginIdsOf,
  OPEN_API_FIXTURE_KEY_HEADER,
  OPEN_API_FIXTURE_OPERATION,
  OPEN_API_FIXTURE_SCHEME,
  OPEN_API_FIXTURE_SPEC,
  parseBasicAuthorization,
} from "../../src/datasource/node-plugins";

/**
 * Stack-free unit spec of the node-service data source helpers (parser, loaders, builder, body helper, catalogue filter).
 * It carries the selection tag of the node-service tests although it is a unit spec (accepted exception to "unit tests are
 * untagged", AGENTS.md section 6).
 */
const PLUGIN_ID = "demoplugin";
const RECORDED_QUERY: RecordedPluginQuery = {
  compType: PLUGIN_ID,
  comp: { actionName: "run_it", action: { "query_@_sql": "select 1", "query_@_limit": 10, nested: { deep: ["a"] } }, headers: [] },
};
const RECORDED_DATASOURCE: RecordedPluginDatasource = {
  name: PLUGIN_ID,
  type: PLUGIN_ID,
  datasourceConfig: { url: NODE_PLUGIN_FIXTURE_PLACEHOLDER_URL, token: "placeholder", mode: "recorded" },
};
const BUILD_PARAMS = { id: "q1", name: "query1", datasourceId: "ds1" };

test.describe("node-service data source helpers", { tag: [TAGS.NODE_SERVICE] }, () => {
  test("parsePluginRecording accepts a saved query and a data source body", () => {
    expect(parsePluginRecording("plugins/x/xQuery", JSON.stringify(RECORDED_QUERY), { compType: PLUGIN_ID })).toEqual(RECORDED_QUERY);
    expect(parsePluginRecording("plugins/x/xDatasource", JSON.stringify(RECORDED_DATASOURCE), { type: PLUGIN_ID })).toEqual(RECORDED_DATASOURCE);
  });

  test("parsePluginRecording rejects a wrong type, a missing actionName and malformed text with RecordedFixtureError naming the file", () => {
    const label = "plugins/x/xQuery";
    const rejected: [string, string, { compType?: string; type?: string }, RegExp][] = [
      ["a wrong compType", JSON.stringify({ ...RECORDED_QUERY, compType: "other" }), { compType: PLUGIN_ID }, /compType "other", expected "demoplugin"/],
      ["no comp.actionName", JSON.stringify({ compType: PLUGIN_ID, comp: { action: {} } }), { compType: PLUGIN_ID }, /string `actionName`/],
      ["a numeric comp.actionName", JSON.stringify({ compType: PLUGIN_ID, comp: { actionName: 1, action: {} } }), { compType: PLUGIN_ID }, /string `actionName`/],
      ["no comp.action", JSON.stringify({ compType: PLUGIN_ID, comp: { actionName: "a" } }), { compType: PLUGIN_ID }, /`action` object/],
      ["a wrong type", JSON.stringify({ ...RECORDED_DATASOURCE, type: "other" }), { type: PLUGIN_ID }, /type "other", expected "demoplugin"/],
      ["no datasourceConfig", JSON.stringify({ name: "n", type: PLUGIN_ID }), { type: PLUGIN_ID }, /`datasourceConfig` object/],
      ["an array", "[]", { compType: PLUGIN_ID }, /not a JSON object/],
      ["invalid JSON", "{", { compType: PLUGIN_ID }, /JSON/],
    ];
    for (const [description, text, expectation, message] of rejected) {
      let error: unknown;
      try {
        parsePluginRecording(label, text, expectation);
      } catch (thrown) {
        error = thrown;
      }
      expect(error, description).toBeInstanceOf(RecordedFixtureError);
      expect((error as Error).message, `${description}: names the file`).toContain(label);
      expect((error as Error).message, `${description}: names the reason`).toMatch(message);
    }
  });

  test("recordedPluginQuery and recordedPluginDatasource throw RecordedFixtureError for a missing recording and for an id that is no folder name", () => {
    for (const load of [recordedPluginQuery, recordedPluginDatasource]) {
      expect(() => load("noSuchPlugin"), `${load.name}: no recording`).toThrow(RecordedFixtureError);
      expect(() => load("../n8n/n8n"), `${load.name}: path traversal`).toThrow(/letters and digits only/);
      expect(() => load(""), `${load.name}: empty id`).toThrow(RecordedFixtureError);
    }
  });

  test("nodePluginQuery keeps the recording, merges the action by key and runs manually", () => {
    const query = nodePluginQuery({ ...BUILD_PARAMS, recorded: RECORDED_QUERY, action: { "query_@_sql": "select 2", extra: true } }) as {
      compType: string;
      comp: { actionName: string; action: Record<string, unknown>; headers: unknown[] };
      datasourceId: string;
      id: string;
      name: string;
      triggerType: string;
    };
    expect(query).toMatchObject({ compType: PLUGIN_ID, datasourceId: "ds1", id: "q1", name: "query1", triggerType: "manual" });
    expect(query.comp.actionName, "the recorded action name").toBe("run_it");
    expect(query.comp.headers, "the other comp keys").toEqual([]);
    expect(query.comp.action["query_@_sql"], "the merged key").toBe("select 2");
    expect(query.comp.action.extra, "a key the recording lacks").toBe(true);
    expect(query.comp.action["query_@_limit"], "a key the call leaves alone").toBe(10);
    expect(nodePluginQuery({ ...BUILD_PARAMS, recorded: RECORDED_QUERY, trigger: "automatic" })).toMatchObject({ triggerType: "automatic" });
  });

  test("nodePluginQuery changes neither the recording it was given nor the result of the next call", () => {
    const before = structuredClone(RECORDED_QUERY);
    const first = nodePluginQuery({ ...BUILD_PARAMS, recorded: RECORDED_QUERY, action: { "query_@_sql": "select 3", nested: { deep: ["b"] } } }) as { comp: { action: Record<string, unknown> } };
    (first.comp.action.nested as { deep: string[] }).deep.push("mutated");
    expect(RECORDED_QUERY, "the recording").toEqual(before);
    const second = nodePluginQuery({ ...BUILD_PARAMS, recorded: RECORDED_QUERY }) as { comp: { action: Record<string, unknown> } };
    expect(second.comp.action["query_@_sql"], "no value of the first call").toBe("select 1");
    expect(second.comp.action.nested, "no nested value of the first call").toEqual({ deep: ["a"] });
  });

  test("nodePluginDatasourceBody sets the workspace, merges the config and keeps the other recorded keys", () => {
    const recorded = { ...RECORDED_DATASOURCE, extraKey: "kept" } as RecordedPluginDatasource;
    const before = structuredClone(recorded);
    const body = nodePluginDatasourceBody(recorded, { orgId: "org-1", config: { url: "http://e2e-echo:1/t", token: "secret" } }) as Record<string, unknown>;
    expect(body.organizationId, "the workspace").toBe("org-1");
    expect(body.name, "the recorded name").toBe(PLUGIN_ID);
    expect(body.type, "the recorded type").toBe(PLUGIN_ID);
    expect(body.extraKey, "another recorded key").toBe("kept");
    expect(body.datasourceConfig, "the config over the recorded settings").toEqual({ url: "http://e2e-echo:1/t", token: "secret", mode: "recorded" });
    expect(recorded, "the recording").toEqual(before);
    expect(nodePluginDatasourceBody(recorded, { orgId: "org-1", name: "renamed", config: {} })).toMatchObject({ name: "renamed" });
  });

  test("the duckdb recordings are the form's body and the editor's saved query, with no value of the recording session", () => {
    const datasource = recordedPluginDatasource("duckdb");
    const query = recordedPluginQuery("duckdb");
    expect(datasource.type, "the data source type").toBe("duckdb");
    expect(datasource.datasourceConfig, "the form's defaults: an in-memory database and the options JSON").toMatchObject({ databaseFile: ":memory:" });
    expect(() => JSON.parse(String(datasource.datasourceConfig.options)), "the options are JSON text").not.toThrow();
    expect(query.compType, "the query type").toBe("duckdb");
    expect(query.comp.actionName, "the only action of the plugin").toBe("Query");
    expect(Object.keys(query.comp.action as Record<string, unknown>), "the SQL parameter").toEqual(["queryString"]);
    expect(Object.keys(query), "only what the builder keeps").toEqual(["compType", "comp"]);
    expect(Object.keys(datasource), "no workspace id").toEqual(["name", "type", "datasourceConfig"]);
    const text = ["duckdbDatasource.json", "duckdbQuery.json"].map((file) => readFileSync(join(RECORDED_PLUGINS_DIR, "duckdb", file), "utf8")).join("\n");
    expect(text, "a 24-hex id (workspace, data source, query)").not.toMatch(/\b[0-9a-f]{24}\b/);
    expect(text, "an ISO timestamp").not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
    expect(text, "an epoch of 10 digits or more (the saved query's order)").not.toMatch(/\b\d{10,}\b/);
  });

  test("the turso and slack recordings are the form's body and the editor's saved query, with no value of the recording session", () => {
    const expectations = [
      { id: "turso", config: ["url", "token"], action: ["queryString", "includeRaw"] },
      { id: "slack", config: ["webhookURL"], action: ["message", "channel"] },
    ];
    for (const { id, config, action } of expectations) {
      const datasource = recordedPluginDatasource(id);
      const query = recordedPluginQuery(id);
      expect(datasource.type, `${id}: the data source type`).toBe(id);
      expect(Object.keys(datasource.datasourceConfig), `${id}: the form fields`).toEqual(expect.arrayContaining(config));
      for (const key of config.filter((name) => name === "url" || name === "webhookURL")) {
        expect(datasource.datasourceConfig[key], `${id}: the placeholder host`).toBe(NODE_PLUGIN_FIXTURE_PLACEHOLDER_URL);
      }
      expect(query.compType, `${id}: the query type`).toBe(id);
      expect(query.comp.actionName, `${id}: the only action of the plugin`).toBe("Query");
      expect(Object.keys(query.comp.action as Record<string, unknown>), `${id}: the action's parameters`).toEqual(action);
      expect(Object.keys(query), `${id}: only what the builder keeps`).toEqual(["compType", "comp"]);
      expect(Object.keys(datasource), `${id}: no workspace id`).toEqual(["name", "type", "datasourceConfig"]);
      const text = [`${id}Datasource.json`, `${id}Query.json`].map((file) => readFileSync(join(RECORDED_PLUGINS_DIR, id, file), "utf8")).join("\n");
      expect(text, `${id}: a 24-hex id`).not.toMatch(/\b[0-9a-f]{24}\b/);
      expect(text, `${id}: an ISO timestamp`).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
      expect(text, `${id}: an epoch of 10 digits or more`).not.toMatch(/\b\d{10,}\b/);
    }
  });

  test("the gitlab and shopify recordings are the form's body and the editor's saved query, with no value of the recording session", () => {
    // the form drops empty key/value rows, so the gitlab body has no `headers` (a filled row is `[{ key, value }]`, measured in the form)
    const expectations = [
      { id: "gitlab", config: ["endpoint", "token"] },
      { id: "shopify", config: ["endpoint"] },
    ];
    for (const { id, config } of expectations) {
      const datasource = recordedPluginDatasource(id);
      const query = recordedPluginQuery(id);
      expect(datasource.type, `${id}: the data source type`).toBe(id);
      expect(Object.keys(datasource.datasourceConfig).slice(0, config.length), `${id}: the form fields`).toEqual(config);
      expect(datasource.datasourceConfig.endpoint, `${id}: the placeholder host`).toBe(NODE_PLUGIN_FIXTURE_PLACEHOLDER_URL);
      expect(query.compType, `${id}: the query type`).toBe(id);
      expect(query.comp.actionName, `${id}: the only action of the plugin`).toBe("query");
      expect(Object.keys(query.comp.action as Record<string, unknown>), `${id}: the action's parameters`).toEqual(["query", "variables", "headers"]);
      expect(Object.keys(query), `${id}: only what the builder keeps`).toEqual(["compType", "comp"]);
      expect(Object.keys(datasource), `${id}: no workspace id`).toEqual(["name", "type", "datasourceConfig"]);
      const text = [`${id}Datasource.json`, `${id}Query.json`].map((file) => readFileSync(join(RECORDED_PLUGINS_DIR, id, file), "utf8")).join("\n");
      expect(text, `${id}: a 24-hex id`).not.toMatch(/\b[0-9a-f]{24}\b/);
      expect(text, `${id}: an ISO timestamp`).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
      expect(text, `${id}: an epoch of 10 digits or more`).not.toMatch(/\b\d{10,}\b/);
    }
  });

  test("the openApi recordings are the form's body, with the spec it stored, and the editor's saved query, with no value of the recording session", () => {
    const datasource = recordedPluginDatasource("openApi");
    const query = recordedPluginQuery("openApi");
    const config = datasource.datasourceConfig;
    expect(datasource.type, "the data source type").toBe("openApi");
    expect(Object.keys(datasource), "no workspace id").toEqual(["name", "type", "datasourceConfig"]);
    expect(config.url, "the placeholder spec URL").toBe(`${NODE_PLUGIN_FIXTURE_PLACEHOLDER_URL}/spec.json`);
    expect(config.serverURL, "the placeholder server URL").toBe(NODE_PLUGIN_FIXTURE_PLACEHOLDER_URL);
    expect(Object.keys(config.extra as Record<string, unknown>), "the dynamic config's data is the spec").toEqual(["spec"]);
    expect(JSON.parse((config.extra as { spec: string }).spec), "the stored spec is the fixture spec").toEqual(OPEN_API_FIXTURE_SPEC);
    expect(config.dynamicParamsDef, "the key field the form built from the security scheme").toEqual([
      { type: "groupTitle", key: OPEN_API_FIXTURE_SCHEME, label: "Api Key Auth" },
      { type: "password", key: `${OPEN_API_FIXTURE_SCHEME}.value`, label: OPEN_API_FIXTURE_KEY_HEADER },
    ]);
    expect(Object.keys(config.dynamicParamsConfig as Record<string, unknown>), "the key is stored under <scheme>.value").toEqual([`${OPEN_API_FIXTURE_SCHEME}.value`]);
    expect(query.compType, "the query type").toBe("openApi");
    expect(query.comp.actionName, "the operation").toBe(OPEN_API_FIXTURE_OPERATION);
    expect(query.comp.action, "the operation's parameter, empty").toEqual({ "query_@_q": "" });
    expect(Object.keys(query), "only what the builder keeps").toEqual(["compType", "comp"]);
    const text = ["openApiDatasource.json", "openApiQuery.json"].map((file) => readFileSync(join(RECORDED_PLUGINS_DIR, "openApi", file), "utf8")).join("\n");
    expect(text, "a 24-hex id").not.toMatch(/\b[0-9a-f]{24}\b/);
    expect(text, "an echo address").not.toContain("e2e-echo");
    expect(text, "an epoch of 10 digits or more").not.toMatch(/\b\d{10,}\b/);
  });

  test("the OpenAPI wrapper recordings are the form's body and the editor's saved query, with no value of the recording session", () => {
    // the form of these plugins has no dynamic config, so the body holds the typed fields and the two defaults only
    const expectations = [
      { id: "couchdb", server: "serverURL", fields: ["BasicAuth.username", "BasicAuth.password", "JwtAuth.value"], action: "allDBs" },
      { id: "jira", server: "serverUrl", fields: ["basicAuth.username", "basicAuth.password"], action: "getCurrentUser" },
      { id: "datadog", server: "serverURL", fields: ["apiKeyAuth.value", "appKeyAuth.value"], action: "get_api_v1_validate" },
      { id: "woocommerce", server: "serverURL", fields: ["basicAuth.username", "basicAuth.password"], action: "get_products" },
      { id: "supabaseApi", server: "serverURL", fields: ["bearerAuth.value"], action: "v1_list_all_projects" },
    ];
    for (const { id, server, fields, action } of expectations) {
      const datasource = recordedPluginDatasource(id);
      const query = recordedPluginQuery(id);
      const config = datasource.datasourceConfig;
      expect(datasource.type, `${id}: the data source type`).toBe(id);
      expect(Object.keys(datasource), `${id}: no workspace id`).toEqual(["name", "type", "datasourceConfig"]);
      expect(Object.keys(config), `${id}: the form fields`).toEqual([server, ...fields, "authConfigType", "sslCertVerificationType"]);
      expect(config[server], `${id}: the placeholder server URL`).toBe(NODE_PLUGIN_FIXTURE_PLACEHOLDER_URL);
      for (const field of fields) expect(config[field], `${id}: ${field} is a placeholder`).toBe("placeholder");
      expect(query.compType, `${id}: the query type`).toBe(id);
      expect(query.comp.actionName, `${id}: the recorded operation`).toBe(action);
      expect(Object.keys(query), `${id}: only what the builder keeps`).toEqual(["compType", "comp"]);
      const text = [`${id}Datasource.json`, `${id}Query.json`].map((file) => readFileSync(join(RECORDED_PLUGINS_DIR, id, file), "utf8")).join("\n");
      expect(text, `${id}: a 24-hex id`).not.toMatch(/\b[0-9a-f]{24}\b/);
      expect(text, `${id}: an echo address`).not.toContain("e2e-echo");
      expect(text, `${id}: an epoch of 10 digits or more`).not.toMatch(/\b\d{10,}\b/);
    }
    expect(recordedPluginQuery("woocommerce").comp.action, "woocommerce: the editor's defaults of the enumerated parameters").toMatchObject({
      "query_@_context": "view",
      "query_@_order": "asc",
      "query_@_orderby": "date",
      "query_@_status": "any",
      "query_@_type": "simple",
      "query_@_stock_status": "instock",
    });
  });

  test("the Lowcoder API, OpenAI, APITemplate, Carbone and UiPath recordings are the form's body and a query (the editor's saved query for the first four, a hand-built one for UiPath), with no value of the recording session", () => {
    // the form of these plugins has no dynamic config, so the body holds the typed fields and the two defaults only (the spec version
    // of Lowcoder and OpenAI is a select that was left at its default, so it is not in the body)
    const expectations = [
      { id: "lowcoder", fields: ["bearerAuth.value"], action: "getUserInfo" },
      { id: "OpenAI", fields: ["apiKey"], action: "listModels" },
      { id: "apiTemplate", fields: ["ApiKeyAuth.value"], action: "list_templates" },
      { id: "carboneIo", fields: ["bearerAuth.value"], action: "get_status" },
      { id: "uiPath", fields: ["Authorization.value"], action: "Folders_Get" },
    ];
    for (const { id, fields, action } of expectations) {
      const datasource = recordedPluginDatasource(id);
      const query = recordedPluginQuery(id);
      const config = datasource.datasourceConfig;
      expect(datasource.type, `${id}: the data source type`).toBe(id);
      expect(Object.keys(datasource), `${id}: no workspace id`).toEqual(["name", "type", "datasourceConfig"]);
      expect(Object.keys(config), `${id}: the form fields`).toEqual(["serverURL", ...fields, "authConfigType", "sslCertVerificationType"]);
      expect(config.serverURL, `${id}: the placeholder server URL`).toBe(NODE_PLUGIN_FIXTURE_PLACEHOLDER_URL);
      for (const field of fields) expect(config[field], `${id}: ${field} is a placeholder`).toBe("placeholder");
      expect(query.compType, `${id}: the query type`).toBe(id);
      expect(query.comp.actionName, `${id}: the recorded operation`).toBe(action);
      expect(Object.keys(query), `${id}: only what the builder keeps`).toEqual(["compType", "comp"]);
      expect(query.comp.headers, `${id}: the editor's empty header row`).toEqual([{ key: "", value: "" }]);
      const text = [`${id}Datasource.json`, `${id}Query.json`].map((file) => readFileSync(join(RECORDED_PLUGINS_DIR, id, file), "utf8")).join("\n");
      expect(text, `${id}: a 24-hex id`).not.toMatch(/\b[0-9a-f]{24}\b/);
      expect(text, `${id}: an echo address`).not.toContain("e2e-echo");
      expect(text, `${id}: an epoch of 10 digits or more`).not.toMatch(/\b\d{10,}\b/);
    }
    expect(recordedPluginQuery("apiTemplate").comp.action, "apiTemplate: the editor's empty defaults of the operation's parameters").toEqual({
      "query_@_limit": "",
      "query_@_offset": "",
      "query_@_format": "",
      "query_@_template_id": "",
      "query_@_group_name": "",
      "query_@_with_layer_info": "",
    });
    // the other recordings have no action parameters; UiPath's has none either, but the editor could not save it: its query configuration
    // fails (the form lists no operation), so the query is the shape the editor saved for the other four plugins, built by hand
    for (const id of ["lowcoder", "OpenAI", "carboneIo", "uiPath"]) {
      expect(recordedPluginQuery(id).comp.action, `${id}: no action parameters`).toEqual({});
    }
  });

  test("parseBasicAuthorization decodes user and password, and reads anything else as not Basic credentials", () => {
    const header = (text: string): string => `Basic ${Buffer.from(text, "utf8").toString("base64")}`;
    expect(parseBasicAuthorization(header("user:secret"))).toEqual({ user: "user", password: "secret" });
    expect(parseBasicAuthorization(header("user:pa:ss")), "the password may hold colons").toEqual({ user: "user", password: "pa:ss" });
    expect(parseBasicAuthorization(header(":")), "empty credentials are credentials").toEqual({ user: "", password: "" });
    expect(parseBasicAuthorization(header("ünï:pässword")), "UTF-8").toEqual({ user: "ünï", password: "pässword" });
    expect(parseBasicAuthorization(undefined), "no header").toBeUndefined();
    expect(parseBasicAuthorization([header("a:b")]), "a repeated header").toBeUndefined();
    expect(parseBasicAuthorization("Bearer abc"), "another scheme").toBeUndefined();
    expect(parseBasicAuthorization("Basic"), "no credentials").toBeUndefined();
    expect(parseBasicAuthorization(header("nocolon")), "no colon").toBeUndefined();
    expect(parseBasicAuthorization("Basic ***"), "not base64").toBeUndefined();
  });

  test("the recorded placeholder host is under the reserved .invalid TLD", () => {
    expect(new URL(NODE_PLUGIN_FIXTURE_PLACEHOLDER_URL).hostname.endsWith(".invalid")).toBe(true);
  });

  test("nodePluginIdsOf keeps the entries with a definition, in order, and drops the null and absent ones", () => {
    const types = [
      { id: "postgres", definition: null },
      { id: "duckdb", definition: { id: "duckdb" } },
      { id: "graphql", definition: null },
      { id: "n8n", definition: { id: "n8n", dataSourceConfig: { params: [] } } },
      { id: "restApi" } as unknown as { id: string; definition: null },
    ];
    expect(nodePluginIdsOf(types)).toEqual(["duckdb", "n8n"]);
    expect(nodePluginIdsOf([]), "an empty catalogue").toEqual([]);
  });

  test("NODE_PLUGIN_IDS lists 46 distinct ids, with the ids that differ from their folder names", () => {
    expect(NODE_PLUGIN_IDS, "the registry size").toHaveLength(46);
    expect(new Set(NODE_PLUGIN_IDS).size, "distinct ids").toBe(NODE_PLUGIN_IDS.length);
    expect(NODE_PLUGIN_IDS, "ids that differ from their folder names").toEqual(expect.arrayContaining(["OpenAI", "oss", "firebird"]));
    expect(NODE_PLUGIN_IDS, "the Java-native graphql type is not a node plugin").not.toContain("graphql");
  });

  test("the data source routes are the Java mappings", () => {
    expect(orgDatasourceTypesPath("org-1")).toBe("/api/organizations/org-1/datasourceTypes");
    expect(API_PATHS.DATASOURCE_TEST).toBe("/api/datasources/test");
    expect(API_PATHS.PLUGIN_DYNAMIC_CONFIG).toBe("/api/datasources/getPluginDynamicConfig");
  });
});

/**
 * The three request helpers against a local server that records what it receives (the pattern of
 * `lifecycle-helpers-local.spec.ts` and `security-api-raw.spec.ts`): no stack is needed to check the path, the method, the body
 * and how each helper reads the answer.
 */
const SERVER_HOST = "127.0.0.1";
const CREATED_ID = "ds-created";
const DENIAL_STATUS = 403;
const DENIAL_CODE = 5308;
const REFUSAL_STATUS = 400;
const REFUSAL_CODE = 5000;
/** A data source named like this is answered with a refusal by the local server; `testDatasourceRaw` and `pluginDynamicConfigRaw` get their denial from a body that holds `denied: true`. */
const REFUSED_NAME = "refused";
const DYNAMIC_CONFIG_ANSWER = [{ key: "spec", value: 1 }];

interface Received {
  method: string;
  url: string;
  contentType: string | undefined;
  body: unknown;
}

async function readText(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

test.describe("node-service data source request helpers", { tag: [TAGS.NODE_SERVICE] }, () => {
  let server: Server;
  let baseURL: string;
  const received: Received[] = [];

  test.beforeAll(async () => {
    server = createServer(async (request, response) => {
      const text = await readText(request);
      const body: unknown = text === "" ? undefined : JSON.parse(text);
      received.push({ method: request.method ?? "", url: request.url ?? "", contentType: request.headers["content-type"], body });
      const json = (status: number, payload: object) => response.writeHead(status, { "content-type": "application/json" }).end(JSON.stringify(payload));
      const refused = typeof body === "object" && body !== null && (body as { name?: unknown }).name === REFUSED_NAME;
      const denied = JSON.stringify(body).includes('"denied":true');
      switch (request.url) {
        case API_PATHS.DATASOURCES:
          return refused ? json(REFUSAL_STATUS, { code: REFUSAL_CODE, message: "refused" }) : json(200, { code: API_OK, data: { id: CREATED_ID } });
        case API_PATHS.DATASOURCE_TEST:
          return denied ? json(DENIAL_STATUS, { code: DENIAL_CODE, message: "no" }) : json(200, { code: API_OK, data: true });
        case API_PATHS.PLUGIN_DYNAMIC_CONFIG:
          return denied ? json(DENIAL_STATUS, { code: DENIAL_CODE, message: "no" }) : json(200, { code: API_OK, data: DYNAMIC_CONFIG_ANSWER });
        default:
          return json(404, { code: 404, message: `unexpected path ${request.url}` });
      }
    });
    await new Promise<void>((resolve) => server.listen(0, SERVER_HOST, resolve));
    baseURL = `http://${SERVER_HOST}:${(server.address() as AddressInfo).port}`;
  });

  test.afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  test.beforeEach(() => {
    received.length = 0;
  });

  test("createNodePluginDatasource posts the merged body to the data sources route and returns the new id", async ({ playwright }) => {
    const request = await playwright.request.newContext({ baseURL });
    try {
      const id = await createNodePluginDatasource(request, {
        orgId: "org-1",
        recorded: RECORDED_DATASOURCE,
        config: { url: "http://e2e-echo:1/t" },
      });
      expect(id, "the id of the answer").toBe(CREATED_ID);
      expect(received, "one request").toHaveLength(1);
      expect(received[0], "method, path and content type").toMatchObject({ method: "POST", url: API_PATHS.DATASOURCES, contentType: "application/json" });
      expect(received[0]?.body, "the body is the one `nodePluginDatasourceBody` builds").toEqual(
        nodePluginDatasourceBody(RECORDED_DATASOURCE, { orgId: "org-1", config: { url: "http://e2e-echo:1/t" } }),
      );
      expect(received[0]?.body, "the workspace and the merged config").toMatchObject({
        organizationId: "org-1",
        type: PLUGIN_ID,
        datasourceConfig: { url: "http://e2e-echo:1/t", token: "placeholder", mode: "recorded" },
      });
    } finally {
      await request.dispose();
    }
  });

  test("createNodePluginDatasource throws LowcoderApiError naming the plugin when the server refuses", async ({ playwright }) => {
    const request = await playwright.request.newContext({ baseURL });
    try {
      const error = await createNodePluginDatasource(request, { orgId: "org-1", name: REFUSED_NAME, recorded: RECORDED_DATASOURCE, config: {} }).then(
        () => undefined,
        (thrown: unknown) => thrown,
      );
      expect(error, "the refusal").toBeInstanceOf(LowcoderApiError);
      expect((error as Error).message, "names the action").toContain(`create ${PLUGIN_ID} datasource`);
      expect((error as Error).message, "carries the status and the body").toContain(`HTTP ${REFUSAL_STATUS}`);
      expect((error as Error).message, "carries the code").toContain(String(REFUSAL_CODE));
    } finally {
      await request.dispose();
    }
  });

  test("testDatasourceRaw posts the body to the test route and returns the raw answer, a denial without a throw", async ({ playwright }) => {
    const request = await playwright.request.newContext({ baseURL });
    try {
      const body = { name: PLUGIN_ID, type: PLUGIN_ID, organizationId: "org-1", datasourceConfig: { url: "x" } };
      const accepted = await testDatasourceRaw(request, body);
      expect(received[0], "method, path and content type").toMatchObject({ method: "POST", url: API_PATHS.DATASOURCE_TEST, contentType: "application/json" });
      expect(received[0]?.body, "the body as given").toEqual(body);
      expect(accepted, "the accepted answer").toMatchObject({ status: 200, code: API_OK, json: { data: true } });

      const denied = await testDatasourceRaw(request, { ...body, denied: true });
      expect(denied, "the denial is returned, not thrown").toMatchObject({ status: DENIAL_STATUS, code: DENIAL_CODE });
      expect(received, "two requests, both to the test route").toHaveLength(2);
    } finally {
      await request.dispose();
    }
  });

  test("pluginDynamicConfigRaw posts the list of requests to the dynamic config route and returns the raw answer", async ({ playwright }) => {
    const request = await playwright.request.newContext({ baseURL });
    try {
      const dtos = [{ dataSourceId: "ds-1", pluginName: PLUGIN_ID, path: "extra", data: { url: "x" } }];
      const answer = await pluginDynamicConfigRaw(request, dtos);
      expect(received[0], "method, path and content type").toMatchObject({ method: "POST", url: API_PATHS.PLUGIN_DYNAMIC_CONFIG, contentType: "application/json" });
      expect(received[0]?.body, "the list is sent as the body, not wrapped").toEqual(dtos);
      expect(answer, "the answer").toMatchObject({ status: 200, code: API_OK, json: { data: DYNAMIC_CONFIG_ANSWER } });

      const denied = await pluginDynamicConfigRaw(request, [{ denied: true }]);
      expect(denied, "the denial is returned, not thrown").toMatchObject({ status: DENIAL_STATUS, code: DENIAL_CODE });
    } finally {
      await request.dispose();
    }
  });
});
