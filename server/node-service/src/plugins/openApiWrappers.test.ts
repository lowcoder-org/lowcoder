import fs from "fs";
import path from "path";
import _ from "lodash";
import nock from "nock";
import { parse as parseYaml } from "yaml";
import "../common/logger";
import { ServiceError } from "../common/error";
import { ConfigKeySplit } from "./openApi/util";

import apiTemplate from "./apiTemplate";
import asana from "./asana";
import boomi from "./boomi";
import carboneIo from "./carboneIo";
import circleCi from "./circleCi";
import cloudinary from "./cloudinary";
import couchdb from "./couchdb";
import datadog from "./datadog";
import did from "./did";
import eodhdApi from "./eodhdApi";
import front from "./front";
import github from "./github";
import helloWorld from "./hello-world";
import huggingFaceEndpoint from "./huggingFaceEndpoint";
import jira from "./jira";
import lowcoder from "./lowcoder";
import n8n from "./n8n";
import notion from "./notion";
import oneSignal from "./oneSignal";
import openAi from "./openAi";
import postmanEcho from "./postmanEcho";
import sendGrid from "./sendGrid";
import serpApi from "./serpApi";
import stripe from "./stripe";
import supabaseApi from "./supabaseApi";
import twilio from "./twilio";
import uiPath from "./uiPath";
import woocommerce, { prepareServerUrl as prepareWooServerUrl } from "./woocommerce";

/**
 * Table-driven suite over the OpenAPI wrapper plugins .
 *
 * Every row names one operation of the plugin's bundled spec (file, method, path). The expected
 * request is derived from that spec file at test time (method, path, base URL, security scheme
 * name / location / type) and from the documented vendor contract where the wrapper deliberately
 * overrides the spec (hard-coded vendor URL, "Bearer " prefix). Only HTTP is intercepted (nock);
 * parsing, option wiring and swagger-client request building run for real.
 *
 * What this suite does NOT cover: the response body is only checked for pass-through, no request
 * bodies are sent (every row is a bodiless GET), and only one operation per plugin is exercised, so
 * a wrong auth wiring that is specific to another operation of the same spec would not be seen.
 */

const SUITE_TIMEOUT_MS = 120000;
jest.setTimeout(SUITE_TIMEOUT_MS);

const STATUS_OK = 200;
const STATUS_BAD_REQUEST = 400;
const RESPONSE_MARKER_KEY = "wrapperRow";
const PLUGINS_DIR = __dirname;
const HEADER_AUTHORIZATION = "authorization";
const BEARER_PREFIX = "Bearer ";
const WOO_VERSION_ERROR = "only woocommerce api v3 is supported";
const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;
const B19_TEST_NAME = "B19: uiPath.queryConfig resolves";

type Json = Record<string, any>;
type SpecKind = "versioned" | "static";
type LabelRule =
  | "upperFirstOperationId"
  | "summary"
  | "summaryOrDefault"
  | "upperFirstSummaryOrOperationId"
  | "defaultUpperFirst"
  | "sendGrid"
  | "huggingFace"
  | "openAi";
type BaseUrl =
  /** the base URL comes from the spec's first server */
  | { from: "spec" }
  /** the datasource config carries the URL; `pathPrefix: "spec"` adds the spec server's path */
  | { from: "datasource"; url: string; pathPrefix?: "spec" }
  /** documented vendor URL that the wrapper hard-codes instead of the spec's */
  | { from: "vendor"; url: string };
type AuthKind = "bearer" | "basic" | "raw";
interface AuthExpectation {
  /** security scheme name in the bundled spec */
  scheme: string;
  kind: AuthKind;
  secret: string;
  /** basic auth only */
  user?: string;
  /** vendor contract prefix put before the secret (apiKey header carrying "Bearer <key>") */
  valuePrefix?: string;
}
interface Row {
  plugin: any;
  name: string;
  specKind: SpecKind;
  dsConfig: Json;
  /** [label of the query config, label of its categories] */
  uiLabels?: [string, string];
  labelRule?: LabelRule;
  /** spec file relative to src/plugins that holds the operation */
  specFile: string;
  method: string;
  path: string;
  actionName: string;
  pathValues?: Record<string, string>;
  queryValues?: Record<string, string>;
  /** required header parameters of the operation, passed as action params */
  headerValues?: Record<string, string>;
  base: BaseUrl;
  auth: AuthExpectation[];
  /**
   * Narrow waiver for a requirement scheme the row does not send. Only for a scheme whose wire
   * representation collides with a scheme that IS sent, so both cannot be observed together.
   * NOT checked for the waived schemes: that the plugin would send them, or what the server does with them.
   */
  unsentSchemes?: { schemes: string[]; reason: string };
  extraHeaders?: Record<string, string>;
  /** `queryConfig` caches per spec version (`toBe` on a second call) */
  cached?: boolean;
  /** first key of the plugin's `specs`: the version used when `specVersion` is omitted */
  firstVersion?: string;
}

const readSpec = (specFile: string): Json => {
  const content = fs.readFileSync(path.join(PLUGINS_DIR, specFile), "utf-8");
  // some bundled ".json" specs are YAML documents, so decide by content
  return content.trimStart().startsWith("{") ? JSON.parse(content) : parseYaml(content);
};

/**
 * The operation's own security requirements. The array lists ALTERNATIVES (OR); the schemes inside
 * one requirement object are all required together (AND). An operation-level array replaces the
 * top-level one.
 */
const securityAlternativesOf = (spec: Json, operation: Json): string[][] =>
  (operation.security ?? spec.security ?? []).map((req: Json) => Object.keys(req).sort());

const securitySchemesOf = (spec: Json): Json => spec.components?.securitySchemes ?? spec.securityDefinitions ?? {};

const labelByRule: Record<LabelRule, (operation: Json, method: string, pathName: string) => string> = {
  upperFirstOperationId: (op) => _.upperFirst(op.operationId || ""),
  summary: (op) => op.summary || "",
  summaryOrDefault: (op, method, pathName) => op.summary || op.operationId || `${method.toUpperCase()} - ${pathName}`,
  upperFirstSummaryOrOperationId: (op) => _.upperFirst(op.summary ? op.summary : op.operationId || ""),
  defaultUpperFirst: (op, method, pathName) =>
    _.upperFirst(op.operationId || `${method.toUpperCase()} - ${pathName}`),
  sendGrid: (op) => op.operationId.replace("_", " "),
  huggingFace: (op) => _.upperFirst(op.operationId.split("_").join(" ")),
  openAi: (op) => _.upperFirst(op.operationId) || op.summary || "",
};

const fillPath = (template: string, values: Record<string, string> = {}): string => {
  const placeholders = (template.match(/\{([^}]+)\}/g) || []).map((p) => p.slice(1, -1));
  expect(placeholders.sort()).toEqual(Object.keys(values).sort());
  return template.replace(/\{([^}]+)\}/g, (_m, key) => values[key]);
};

const joinUrlPath = (...parts: string[]): string => {
  const joined = parts.map((p) => p.replace(/^\/+|\/+$/g, "")).filter(Boolean).join("/");
  return `/${joined}`;
};

interface Derived {
  method: string;
  /** absolute origin, or undefined when no host is derivable */
  origin?: string;
  pathname: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  absentHeaders: string[];
}

/** Derives the expected wire request of a row from its bundled spec file. */
const deriveRequest = (row: Row): Derived => {
  const spec = readSpec(row.specFile);
  const operation = spec.paths?.[row.path]?.[row.method.toLowerCase()];
  expect(operation).toBeDefined();
  const pathName = fillPath(row.path, row.pathValues);

  let origin: string | undefined;
  let prefix = "";
  if (row.base.from === "spec") {
    const server = new URL(spec.servers[0].url);
    expect(spec.servers[0].url).not.toContain("{");
    origin = server.origin;
    prefix = server.pathname;
  } else if (row.base.from === "datasource" || row.base.from === "vendor") {
    const url = new URL(row.base.url);
    origin = url.origin;
    prefix = url.pathname;
    if (row.base.from === "datasource" && row.base.pathPrefix === "spec") {
      prefix = joinUrlPath(prefix, new URL(spec.servers[0].url).pathname);
    }
  }

  const query: Record<string, string> = { ...row.queryValues };
  const headers: Record<string, string> = { ...row.extraHeaders };
  Object.entries(row.headerValues || {}).forEach(([name, value]) => (headers[name.toLowerCase()] = value));
  const schemes = securitySchemesOf(spec);
  if (row.auth.length > 0) {
    // Schemes inside one security requirement are AND: the row must send EVERY scheme of one requirement
    // of the operation. The only relaxation is the row's own explicit, named `unsentSchemes` waiver.
    const rowSchemes = _.uniq(row.auth.map((a) => a.scheme));
    const waived = row.unsentSchemes?.schemes ?? [];
    expect(rowSchemes.some((n) => waived.includes(n))).toBe(false);
    const completeRequirement = securityAlternativesOf(spec, operation).find(
      (req) => req.every((n) => rowSchemes.includes(n) || waived.includes(n)) && rowSchemes.every((n) => req.includes(n)),
    );
    expect(completeRequirement).toBeDefined();
    // a waiver must be needed: it names schemes that really belong to the chosen requirement and are not sent
    expect(waived.every((n) => completeRequirement!.includes(n))).toBe(true);
  }
  for (const auth of row.auth) {
    const def = schemes[auth.scheme];
    expect(def).toBeDefined();
    if (def.type === "apiKey") {
      expect(auth.kind).toBe("raw");
    }
    if (def.type === "http" && def.scheme === "bearer") {
      expect(auth.kind).toBe("bearer");
    }
    if ((def.type === "http" && def.scheme === "basic") || def.type === "basic") {
      expect(auth.kind).toBe("basic");
    }
    const secret =
      auth.kind === "basic"
        ? `Basic ${Buffer.from(`${auth.user}:${auth.secret}`).toString("base64")}`
        : `${auth.kind === "bearer" ? BEARER_PREFIX : ""}${auth.valuePrefix ?? ""}${auth.secret}`;
    if (def.type === "apiKey" && def.in === "query") {
      query[def.name] = secret;
    } else {
      const headerName = (def.type === "apiKey" ? def.name : "Authorization").toLowerCase();
      headers[headerName] = secret;
    }
  }
  return {
    method: row.method.toUpperCase(),
    origin,
    pathname: joinUrlPath(prefix, pathName),
    query,
    headers,
    absentHeaders: row.auth.length === 0 ? [HEADER_AUTHORIZATION] : [],
  };
};

interface Captured {
  method: string;
  url: URL;
  headers: Record<string, string>;
}

const captureAll = (body: Json): Captured[] => {
  const seen: Captured[] = [];
  for (const method of HTTP_METHODS) {
    nock(/.*/)
      .persist()
      .intercept(/.*/, method)
      .reply(function (uri) {
        const req: any = this.req;
        const headers: Record<string, string> = {};
        Object.entries(req.headers as Record<string, any>).forEach(([k, v]) => {
          headers[k.toLowerCase()] = Array.isArray(v) ? v[0] : String(v);
        });
        const opts = req.options || {};
        seen.push({ method, url: new URL(`${opts.proto || "https"}://${opts.host}${uri}`), headers });
        return [STATUS_OK, body];
      });
  }
  return seen;
};

const runRow = async (row: Row) => {
  const body = { [RESPONSE_MARKER_KEY]: `${row.name}-${row.actionName}`, items: [1, 2] };
  const seen = captureAll(body);
  const params: Json = { actionName: row.actionName };
  Object.entries(row.pathValues || {}).forEach(([k, v]) => (params[`path${ConfigKeySplit}${k}`] = v));
  Object.entries(row.queryValues || {}).forEach(([k, v]) => (params[`query${ConfigKeySplit}${k}`] = v));
  Object.entries(row.headerValues || {}).forEach(([k, v]) => (params[`header${ConfigKeySplit}${k}`] = v));
  const result = await (row.plugin.run as any)(params, row.dsConfig, {});
  return { body, seen, result };
};

const queryOf = (url: URL) => Object.fromEntries(url.searchParams.entries());

const queryConfigOf = (plugin: any, data: Json): Promise<any> => plugin.queryConfig(data, {});

const GITHUB_ORIGIN = "https://api.github.com";
const SENDGRID_BASE = "https://api.sendgrid.com/v3";
const EODHD_BASE = "https://eodhd.com/api";

// Hosts below are fictitious test hosts; they only matter where the datasource supplies the URL.
const rows: Row[] = [
  {
    plugin: apiTemplate, name: "apiTemplate", specKind: "static",
    dsConfig: { serverURL: "https://tpl.test", "ApiKeyAuth.value": "tpl-key" },
    uiLabels: ["Action", "Resources"], labelRule: "upperFirstOperationId",
    specFile: "apiTemplate/apiTemplate.spec.json", method: "get", path: "/v2/list-templates",
    actionName: "list_templates",
    base: { from: "datasource", url: "https://tpl.test" },
    auth: [{ scheme: "ApiKeyAuth", kind: "raw", secret: "tpl-key" }],
  },
  {
    plugin: asana, name: "asana", specKind: "versioned",
    dsConfig: { "personalAccessToken.value": "asana-pat" }, firstVersion: "v1.0",
    uiLabels: ["Action", "Resources"], labelRule: "upperFirstOperationId",
    specFile: "asana/asana.spec.yaml", method: "get", path: "/attachments/{attachment_gid}",
    actionName: "getAttachment", pathValues: { attachment_gid: "12345" },
    base: { from: "spec" },
    auth: [{ scheme: "personalAccessToken", kind: "bearer", secret: "asana-pat" }],
  },
  {
    plugin: boomi, name: "boomi", specKind: "static",
    dsConfig: {
      serverURL: "https://boomi.test/api/rest/v1/acct-1",
      "basicAuth.username": "boomi-user", "basicAuth.password": "boomi-pass",
    },
    uiLabels: ["Action", "Resources"], labelRule: "upperFirstOperationId",
    specFile: "boomi/boomi.spec.json", method: "get", path: "/Account/{id}",
    actionName: "GetAccount", pathValues: { id: "42" },
    base: { from: "datasource", url: "https://boomi.test/api/rest/v1/acct-1" },
    auth: [{ scheme: "basicAuth", kind: "basic", user: "boomi-user", secret: "boomi-pass" }],
  },
  {
    plugin: carboneIo, name: "carboneIo", specKind: "static",
    dsConfig: { serverURL: "https://carbone.test", "bearerAuth.value": "carbone-key" },
    uiLabels: ["Action", "Resources"], labelRule: "upperFirstOperationId",
    specFile: "carboneIo/carboneIo.spec.json", method: "get", path: "/template/{templateId}",
    actionName: "get_template__templateId_", pathValues: { templateId: "tpl-9" },
    headerValues: { "carbone-version": "4" },
    base: { from: "datasource", url: "https://carbone.test" },
    auth: [{ scheme: "bearerAuth", kind: "bearer", secret: "carbone-key" }],
  },
  {
    plugin: circleCi, name: "circleCi", specKind: "versioned",
    dsConfig: { "api_key_header.value": "circle-token" }, firstVersion: "v1.0",
    uiLabels: ["Action", "Resources"], labelRule: "upperFirstOperationId",
    specFile: "circleCi/circleCi.spec.json", method: "get", path: "/context/{context-id}",
    actionName: "getContext", pathValues: { "context-id": "ctx-1" },
    base: { from: "spec" },
    auth: [{ scheme: "api_key_header", kind: "raw", secret: "circle-token" }],
  },
  {
    plugin: cloudinary, name: "cloudinary", specKind: "versioned", cached: true,
    dsConfig: { "basicAuth.username": "cld-key", "basicAuth.password": "cld-secret" }, firstVersion: "v1.0",
    uiLabels: ["Action", "Resources"], labelRule: "summary",
    specFile: "cloudinary/adminApi.spec.yaml", method: "get", path: "/v1_1/{cloud_name}/folders",
    actionName: "get_v1_1__cloud_name__foldersadmin", pathValues: { cloud_name: "democloud" },
    base: { from: "spec" },
    auth: [{ scheme: "basicAuth", kind: "basic", user: "cld-key", secret: "cld-secret" }],
  },
  {
    plugin: couchdb, name: "couchdb", specKind: "versioned",
    dsConfig: { serverURL: "https://couch.test", "BasicAuth.username": "admin", "BasicAuth.password": "relax" },
    firstVersion: "v1.0",
    uiLabels: ["Operation", "Resource"], labelRule: "defaultUpperFirst",
    specFile: "couchdb/CouchDB-3.1.1-resolved.json", method: "get", path: "/_all_dbs",
    actionName: "allDBs",
    base: { from: "datasource", url: "https://couch.test" },
    auth: [{ scheme: "BasicAuth", kind: "basic", user: "admin", secret: "relax" }],
    // the single requirement is {BasicAuth, JwtAuth}; JwtAuth is an apiKey in the Authorization header,
    // the same header BasicAuth fills, so the two cannot both appear on the wire. Only JwtAuth is waived here.
    unsentSchemes: {
      schemes: ["JwtAuth"],
      reason: "JwtAuth (apiKey, header Authorization) collides with BasicAuth on the same header",
    },
  },
  {
    plugin: datadog, name: "datadog", specKind: "versioned",
    // /api/v1/validate: "Check if the API key (not the APP key) is valid". The spec's top-level
    // security lists apiKeyAuth and appKeyAuth as alternatives, so the row asks for the API key only.
    dsConfig: { serverURL: "https://dd.test", "apiKeyAuth.value": "dd-api" },
    firstVersion: "v1.0",
    uiLabels: ["Action", "Resources"], labelRule: "summary",
    specFile: "datadog/datadog.spec.yaml", method: "get", path: "/api/v1/validate",
    actionName: "get_api_v1_validate",
    base: { from: "datasource", url: "https://dd.test" },
    auth: [{ scheme: "apiKeyAuth", kind: "raw", secret: "dd-api" }],
  },
  {
    plugin: did, name: "did", specKind: "versioned", cached: true,
    dsConfig: { "basic.username": "did-user", "basic.password": "did-pass" }, firstVersion: "v1.0",
    uiLabels: ["Action", "Resources"], labelRule: "upperFirstOperationId",
    specFile: "did/did.spec/credits.json", method: "get", path: "/credits",
    actionName: "GetCredits",
    base: { from: "spec" },
    auth: [{ scheme: "basic", kind: "basic", user: "did-user", secret: "did-pass" }],
  },
  {
    // the spec has no securitySchemes: the API token is a required query parameter of the operation
    plugin: eodhdApi, name: "eodhdApi", specKind: "static",
    dsConfig: {},
    uiLabels: ["Action", "Resources"], labelRule: "upperFirstOperationId",
    specFile: "eodhdApi/eodhdApi.spec.json", method: "get", path: "/eod/{ticker}",
    actionName: "get_eod__ticker_", pathValues: { ticker: "AAPL.US" }, queryValues: { api_token: "eod-token" },
    base: { from: "vendor", url: EODHD_BASE },
    auth: [],
  },
  {
    plugin: front, name: "front", specKind: "versioned",
    dsConfig: { "http.value": "front-jwt" }, firstVersion: "v1.0",
    uiLabels: ["Action", "Category"], labelRule: "summary",
    specFile: "front/front.spec.json", method: "get", path: "/accounts/{account_id}",
    actionName: "get_accounts__account_id_", pathValues: { account_id: "acc_1" },
    base: { from: "spec" },
    auth: [{ scheme: "http", kind: "bearer", secret: "front-jwt" }],
  },
  {
    plugin: github, name: "github", specKind: "versioned",
    dsConfig: { "ApiKey.username": "octocat", "ApiKey.password": "gh-token" }, firstVersion: "v1.0",
    uiLabels: ["Action", "Resources"], labelRule: "upperFirstOperationId",
    specFile: "github/github.spec.yaml", method: "get", path: "/repos/{owner}/{repo}",
    actionName: "repos_get", pathValues: { owner: "lowcoder-org", repo: "lowcoder" },
    base: { from: "vendor", url: GITHUB_ORIGIN },
    auth: [{ scheme: "ApiKey", kind: "basic", user: "octocat", secret: "gh-token" }],
  },
  {
    plugin: huggingFaceEndpoint, name: "huggingFaceEndpoint", specKind: "versioned",
    dsConfig: { endpoint: "https://hf.test", "token.value": "hf-token" }, firstVersion: "v1.0",
    uiLabels: ["Action", "Category"], labelRule: "huggingFace",
    specFile: "huggingFaceEndpoint/huggingFace.spec.json", method: "get", path: "/provider",
    actionName: "list_vendors",
    // /provider has no security requirement (the "/endpoint" operations declare a path param "user"
    // that is not in their path template, so they cannot be run), hence no credential is expected
    base: { from: "datasource", url: "https://hf.test" },
    auth: [],
  },
  {
    plugin: jira, name: "jira", specKind: "versioned", cached: true,
    dsConfig: { serverUrl: "https://jira.test", "basicAuth.username": "me@example.test", "basicAuth.password": "jira-token" },
    firstVersion: "v1.0",
    uiLabels: ["Action", "Category"], labelRule: "upperFirstOperationId",
    specFile: "jira/jira.spec.json", method: "get", path: "/rest/api/3/announcementBanner",
    actionName: "getBanner",
    base: { from: "datasource", url: "https://jira.test" },
    auth: [{ scheme: "basicAuth", kind: "basic", user: "me@example.test", secret: "jira-token" }],
  },
  {
    plugin: lowcoder, name: "lowcoder", specKind: "versioned",
    dsConfig: { serverURL: "https://lc.test", "bearerAuth.value": "lc-jwt" }, firstVersion: "v1.0",
    uiLabels: ["Action", "Resources"], labelRule: "upperFirstOperationId",
    specFile: "lowcoder/lowcoder.spec-v1.0.json", method: "get", path: "/api/applications/{applicationId}",
    actionName: "getApplicationDataInEditMode", pathValues: { applicationId: "app-1" },
    base: { from: "datasource", url: "https://lc.test" },
    auth: [{ scheme: "bearerAuth", kind: "bearer", secret: "lc-jwt" }],
  },
  {
    plugin: n8n, name: "n8n", specKind: "versioned",
    dsConfig: { serverURL: "https://n8n.test", apiKey: "n8n-key" }, firstVersion: "v1.1.0",
    uiLabels: ["Operation", "Resource"], labelRule: "summaryOrDefault",
    specFile: "n8n/openapi_1_1_0.yml", method: "get", path: "/executions/{id}",
    actionName: "get_executions__id_", pathValues: { id: "77" },
    base: { from: "datasource", url: "https://n8n.test", pathPrefix: "spec" },
    auth: [{ scheme: "ApiKeyAuth", kind: "raw", secret: "n8n-key" }],
  },
  {
    plugin: notion, name: "notion", specKind: "versioned",
    dsConfig: { notionVersion: "2022-06-28", "bearerAuth.value": "notion-secret" }, firstVersion: "v1.0",
    uiLabels: ["Action", "Resources"], labelRule: "summary",
    specFile: "notion/notion.spec.yaml", method: "get", path: "/v1/users/me",
    actionName: "get_v1_users_me",
    base: { from: "spec" },
    auth: [{ scheme: "bearerAuth", kind: "bearer", secret: "notion-secret" }],
    extraHeaders: { "notion-version": "2022-06-28" },
  },
  {
    plugin: oneSignal, name: "oneSignal", specKind: "versioned",
    dsConfig: { "user_key.value": "os-user-key" }, firstVersion: "v1.0",
    uiLabels: ["Action", "Resources"], labelRule: "upperFirstOperationId",
    specFile: "oneSignal/oneSignal.spec.json", method: "get", path: "/apps",
    actionName: "get_apps",
    base: { from: "spec" },
    auth: [{ scheme: "user_key", kind: "bearer", secret: "os-user-key" }],
  },
  {
    plugin: openAi, name: "openAi (default spec version v1.0)", specKind: "versioned",
    dsConfig: { serverURL: "https://oai.test/v1", apiKey: "sk-test" }, firstVersion: "v1.0",
    uiLabels: ["Action", "Category"], labelRule: "openAi",
    specFile: "openAi/openAI_v1.2.0.json", method: "get", path: "/engines",
    actionName: "listEngines",
    base: { from: "datasource", url: "https://oai.test/v1" },
    auth: [{ scheme: "ApiKey", kind: "bearer", secret: "sk-test" }],
  },
  {
    plugin: openAi, name: "openAi (spec version v2.3)", specKind: "versioned",
    dsConfig: { serverURL: "https://oai.test/v1", apiKey: "sk-test", specVersion: "v2.3" },
    uiLabels: ["Action", "Category"], labelRule: "openAi",
    specFile: "openAi/openAI_v2.3.0.json", method: "get", path: "/assistants",
    actionName: "listAssistants",
    base: { from: "datasource", url: "https://oai.test/v1" },
    auth: [{ scheme: "ApiKeyAuth", kind: "bearer", secret: "sk-test" }],
  },
  {
    plugin: postmanEcho, name: "postmanEcho", specKind: "versioned",
    dsConfig: {}, firstVersion: "v1.0",
    uiLabels: ["Action", "Resources"], labelRule: "upperFirstSummaryOrOperationId",
    specFile: "postmanEcho/postmanEcho.spec.json", method: "get", path: "/digest-auth",
    actionName: "DigestAuthGet",
    base: { from: "spec" },
    auth: [],
  },
  {
    // the spec's server is http://api.sendgrid.com/v3; SendGrid documents https and "Bearer <key>"
    plugin: sendGrid, name: "sendGrid", specKind: "versioned",
    dsConfig: { "Authorization.value": "SG.test-key" }, firstVersion: "v1.0",
    uiLabels: ["Action", "Resources"], labelRule: "sendGrid",
    specFile: "sendGrid/sendGrid.spec.json", method: "get", path: "/user/scheduled_sends",
    actionName: "GET_user_scheduled_sends",
    base: { from: "vendor", url: SENDGRID_BASE },
    auth: [{ scheme: "Authorization", kind: "raw", secret: "SG.test-key", valuePrefix: BEARER_PREFIX }],
  },
  {
    plugin: serpApi, name: "serpApi", specKind: "static",
    dsConfig: { "apikey-query-api_key.value": "serp-key" },
    uiLabels: ["Action", "Resources"], labelRule: "upperFirstOperationId",
    specFile: "serpApi/serpApi.search.spec.json", method: "get", path: "/search.json",
    actionName: "get_search_json", queryValues: { engine: "google", q: "coffee" },
    base: { from: "spec" },
    auth: [{ scheme: "apikey-query-api_key", kind: "raw", secret: "serp-key" }],
  },
  {
    plugin: stripe, name: "stripe", specKind: "versioned",
    dsConfig: { "bearerAuth.value": "sk_test_123" }, firstVersion: "v1.0",
    uiLabels: ["Action", "Resources"], labelRule: "upperFirstOperationId",
    specFile: "stripe/stripe.spec.yaml", method: "get", path: "/v1/account",
    actionName: "GetAccount",
    base: { from: "spec" },
    auth: [{ scheme: "bearerAuth", kind: "bearer", secret: "sk_test_123" }],
  },
  {
    plugin: supabaseApi, name: "supabaseApi", specKind: "static",
    dsConfig: { serverURL: "https://sb.test", "bearerAuth.value": "sbp_test" },
    uiLabels: ["Action", "Resources"], labelRule: "upperFirstOperationId",
    specFile: "supabaseApi/supabaseApi.spec.json", method: "get", path: "/v1/projects",
    actionName: "v1_list_all_projects",
    base: { from: "datasource", url: "https://sb.test" },
    auth: [{ scheme: "bearerAuth", kind: "bearer", secret: "sbp_test" }],
  },
  {
    plugin: twilio, name: "twilio", specKind: "versioned", cached: true,
    dsConfig: { "accountSid_authToken.username": "AC123", "accountSid_authToken.password": "tw-token" },
    firstVersion: "v1.0",
    uiLabels: ["Action", "Resources"], labelRule: "upperFirstOperationId",
    specFile: "twilio/twilio.spec.v1/twilio_accounts_v1.yaml", method: "get", path: "/v1/Credentials/AWS/{Sid}",
    actionName: "FetchCredentialAwsAccounts(v1)", pathValues: { Sid: "CR123" },
    base: { from: "spec" },
    auth: [{ scheme: "accountSid_authToken", kind: "basic", user: "AC123", secret: "tw-token" }],
  },
  {
    plugin: uiPath, name: "uiPath", specKind: "static",
    uiLabels: ["Action", "Resources"], labelRule: "upperFirstOperationId",
    dsConfig: { serverURL: "https://ui.test/org/tenant/orchestrator_/odata", "Authorization.value": "ui-pat" },
    specFile: "uiPath/uiPath.spec.json", method: "get", path: "/api/DirectoryService/GetDomains",
    actionName: "DirectoryService_GetDomains",
    base: { from: "datasource", url: "https://ui.test/org/tenant/orchestrator_/odata" },
    auth: [{ scheme: "OAuth2", kind: "bearer", secret: "ui-pat" }],
  },
  {
    plugin: woocommerce, name: "woocommerce", specKind: "versioned",
    dsConfig: { serverURL: "https://shop.test", "basicAuth.username": "ck_user", "basicAuth.password": "cs_pass" },
    firstVersion: "v1.0",
    uiLabels: ["Operation", "Resource"], labelRule: "summaryOrDefault",
    specFile: "woocommerce/woocommerce-spec.json", method: "get", path: "/coupons/{id}",
    actionName: "get_coupons__id_", pathValues: { id: "7" },
    base: { from: "datasource", url: "https://shop.test", pathPrefix: "spec" },
    auth: [{ scheme: "basicAuth", kind: "basic", user: "ck_user", secret: "cs_pass" }],
  },
];

const versionedRows = rows.filter((r) => r.specKind === "versioned");
const cachedRows = rows.filter((r) => r.cached);
const staticRows = rows.filter((r) => r.specKind === "static");

beforeAll(() => {
  nock.disableNetConnect();
});
afterEach(() => {
  nock.cleanAll();
});
afterAll(() => {
  nock.cleanAll();
  nock.enableNetConnect();
});

/** one queryConfig result per row (parsing the larger specs takes seconds, so it is computed once) */
const configMemo = new Map<Row, Promise<any>>();
const defaultConfigOf = (row: Row) => {
  if (!configMemo.has(row)) {
    configMemo.set(row, queryConfigOf(row.plugin, {}));
  }
  return configMemo.get(row)!;
};

describe("wrapper plugins: queryConfig", () => {
  describe.each(rows.filter((r) => r.name !== "openAi (spec version v2.3)"))("$name", (row) => {
    test("returns the plugin's query config with the action its spec declares", async () => {
      const spec = readSpec(row.specFile);
      const operation = spec.paths[row.path][row.method];
      const config = await defaultConfigOf(row);

      expect(config.type).toBe("query");
      expect([config.label, config.categories.label]).toEqual(row.uiLabels);
      expect(Array.isArray(config.categories.items)).toBe(true);
      expect(config.actions.length).toBeGreaterThan(0);
      config.actions.forEach((action: any) => {
        expect(typeof action.actionName).toBe("string");
        expect(action.actionName).not.toBe("");
        expect(typeof action.label).toBe("string");
        expect(Array.isArray(action.params)).toBe(true);
      });

      const known = config.actions.find((a: any) => a.actionName === row.actionName);
      expect(known).toBeDefined();
      expect(known.label).toBe(labelByRule[row.labelRule!](operation, row.method, row.path));
    });
  });

  describe.each(versionedRows.filter((r) => r.firstVersion))("$name specVersion", (row) => {
    test("omitting specVersion gives the same actions as the first version key", async () => {
      const omitted = await defaultConfigOf(row);
      const explicit = await queryConfigOf(row.plugin, { specVersion: row.firstVersion });
      expect(explicit.actions.map((a: any) => a.actionName)).toEqual(omitted.actions.map((a: any) => a.actionName));
      expect(explicit.actions.length).toBeGreaterThan(0);
    });
  });

  describe.each(staticRows)("$name static spec", (row) => {
    test("ignores specVersion", async () => {
      const plain = await defaultConfigOf(row);
      const withVersion = await queryConfigOf(row.plugin, { specVersion: "nope" });
      expect(withVersion.actions.map((a: any) => a.actionName)).toEqual(plain.actions.map((a: any) => a.actionName));
    });
  });

  describe.each(cachedRows)("$name cache", (row) => {
    test("returns the cached object for a repeated spec version", async () => {
      const first = await queryConfigOf(row.plugin, {});
      const second = await queryConfigOf(row.plugin, {});
      expect(second).toBe(first);
    });
  });

  test("openAi: specVersion selects the spec (listAssistants only exists in v2.3)", async () => {
    const v1 = await queryConfigOf(openAi, { specVersion: "v1.0" });
    const v23 = await queryConfigOf(openAi, { specVersion: "v2.3" });
    const names = (cfg: any) => cfg.actions.map((a: any) => a.actionName);
    expect(names(v23)).toContain("listAssistants");
    expect(names(v1)).not.toContain("listAssistants");
    expect(names(v1)).toContain("listEngines");
  });

  test(B19_TEST_NAME, async () => {
    await expect(queryConfigOf(uiPath, {})).resolves.toBeDefined();
  });
});

describe("wrapper plugins: run through nock", () => {
  describe.each(rows)("$name", (row) => {
    test("sends the spec's method and URL and returns the response body unchanged", async () => {
      const expected = deriveRequest(row);
      const { body, seen, result } = await runRow(row);

      expect(seen).toHaveLength(1);
      const request = seen[0];
      expect(request.method).toBe(expected.method);
      if (expected.origin) {
        expect(request.url.origin).toBe(expected.origin);
      }
      expect(request.url.pathname).toBe(expected.pathname);
      expect(result).toEqual(body);
    });

    test("sends the credential the spec's security scheme asks for", async () => {
      const expected = deriveRequest(row);
      const { seen } = await runRow(row);

      expect(seen).toHaveLength(1);
      const request = seen[0];
      expect(queryOf(request.url)).toEqual(expected.query);
      Object.entries(expected.headers).forEach(([name, value]) => {
        expect(request.headers[name]).toBe(value);
      });
      expected.absentHeaders.forEach((name) => expect(request.headers[name]).toBeUndefined());
    });
  });
});

describe("woocommerce.prepareServerUrl", () => {
  const SHOP = "https://shop.test";
  const WOO_V3_SUFFIX = "/wp-json/wc/v3";

  test.each(["/wc/v1", "/wc/v2"])("rejects the unsupported API version %s with a 400 ServiceError", (suffix) => {
    let error: any;
    try {
      prepareWooServerUrl(`${SHOP}/wp-json${suffix}`);
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(ServiceError);
    expect(error.code).toBe(STATUS_BAD_REQUEST);
    expect(error.message).toBe(WOO_VERSION_ERROR);
  });

  test("keeps a URL that already ends with /wc/v3", () => {
    expect(prepareWooServerUrl(`${SHOP}${WOO_V3_SUFFIX}`)).toBe(`${SHOP}${WOO_V3_SUFFIX}`);
  });

  test("appends /wp-json/wc/v3 to a bare shop URL", () => {
    expect(prepareWooServerUrl(SHOP)).toBe(`${SHOP}${WOO_V3_SUFFIX}`);
  });

  test("does not double the slash when the shop URL ends with one", () => {
    expect(prepareWooServerUrl(`${SHOP}/`)).toBe(`${SHOP}${WOO_V3_SUFFIX}`);
  });

  test("run throws the version error synchronously, before any request is sent", () => {
    const seen = captureAll({});
    expect(() =>
      (woocommerce.run as any)(
        { actionName: "get_coupons__id_", [`path${ConfigKeySplit}id`]: "7" },
        { serverURL: `${SHOP}/wp-json/wc/v2` },
        {}
      )
    ).toThrow(expect.objectContaining({ code: STATUS_BAD_REQUEST, message: WOO_VERSION_ERROR }));
    expect(seen).toHaveLength(0);
  });
});

describe("wrapper plugins: credential and URL edges", () => {
  const OPENAI_A_URL = "https://a.test/v1";
  const OPENAI_SPEC_ORIGIN = "https://api.openai.com";
  const OPENAI_SPEC_VERSION = "v2.3";
  const LIST_ASSISTANTS = { actionName: "listAssistants" };

  test("openAi: a data source without serverURL after one with a URL goes to the spec's server with its own key", async () => {
    const seen = captureAll({ data: [] });
    const run = (dsConfig: Json) => (openAi.run as any)(LIST_ASSISTANTS, dsConfig, {});

    await run({ serverURL: OPENAI_A_URL, apiKey: "keyA", specVersion: OPENAI_SPEC_VERSION });
    await run({ serverURL: "", apiKey: "keyB", specVersion: OPENAI_SPEC_VERSION });

    expect(seen).toHaveLength(2);
    expect(seen[0].url.origin).toBe("https://a.test");
    expect(seen[0].headers[HEADER_AUTHORIZATION]).toBe("Bearer keyA");
    expect(seen[1].url.origin).toBe(OPENAI_SPEC_ORIGIN);
    expect(seen[1].url.pathname).toBe("/v1/assistants");
    expect(seen[1].headers[HEADER_AUTHORIZATION]).toBe("Bearer keyB");
    expect(seen.filter((r) => r.url.origin === "https://a.test" && r.headers[HEADER_AUTHORIZATION] === "Bearer keyB")).toEqual([]);
  });

  test("openAi: an empty API key sends no Authorization header, for both spec versions", async () => {
    const seen = captureAll({ data: [] });
    const OAI_EMPTY_KEY_URL = "https://oai.test/v1";

    await (openAi.run as any)({ actionName: "listEngines" }, { serverURL: OAI_EMPTY_KEY_URL, apiKey: "" }, {});
    await (openAi.run as any)(
      LIST_ASSISTANTS,
      { serverURL: OAI_EMPTY_KEY_URL, apiKey: "", specVersion: OPENAI_SPEC_VERSION },
      {}
    );

    expect(seen).toHaveLength(2);
    expect(seen[0].headers[HEADER_AUTHORIZATION]).toBeUndefined();
    expect(seen[1].headers[HEADER_AUTHORIZATION]).toBeUndefined();
  });

  test("openAi: the specVersion placeholder names the version an unset specVersion uses", async () => {
    const OPENAI_FIRST_VERSION = "v1.0";
    const specVersionParam = (openAi.dataSourceConfig as any).params.find((p: Json) => p.key === "specVersion");
    const placeholder = specVersionParam.placeholder;

    expect(placeholder).toBe(OPENAI_FIRST_VERSION);
    expect(await queryConfigOf(openAi, {})).toEqual(await queryConfigOf(openAi, { specVersion: placeholder }));
  });
});

describe("wrapper plugins: boomi server URL", () => {
  const BOOMI_ORIGIN = "https://boomi.test";
  const BOOMI_ACCOUNT_PATH = "/api/rest/v1/acct-1";
  const BOOMI_SERVER_URL_REQUIRED = "The Boomi API url is required";
  const GET_ACCOUNT_ID = "42";
  const GET_ACCOUNT = { actionName: "GetAccount", [`path${ConfigKeySplit}id`]: GET_ACCOUNT_ID };

  test("boomi: a trailing slash in the configured URL gives a single slash", async () => {
    const seen = captureAll({ id: GET_ACCOUNT_ID });
    await (boomi.run as any)(GET_ACCOUNT, { serverURL: `${BOOMI_ORIGIN}${BOOMI_ACCOUNT_PATH}/` }, {});

    expect(seen).toHaveLength(1);
    expect(seen[0].url.origin).toBe(BOOMI_ORIGIN);
    expect(seen[0].url.pathname).toBe(`${BOOMI_ACCOUNT_PATH}/Account/${GET_ACCOUNT_ID}`);
  });

  test("boomi: an empty, blank or missing URL is rejected with 400 and nothing is sent", () => {
    const seen = captureAll({});
    const dsConfigs: Json[] = [{ serverURL: "" }, { serverURL: "  " }, { "basicAuth.username": "u" }];
    dsConfigs.forEach((dsConfig) => {
      expect(() => (boomi.run as any)(GET_ACCOUNT, dsConfig, {})).toThrow(
        expect.objectContaining({ code: STATUS_BAD_REQUEST, message: BOOMI_SERVER_URL_REQUIRED })
      );
    });
    expect(seen).toHaveLength(0);
  });
});

describe("wrapper plugins: uiPath credential", () => {
  test("uiPath: an empty PAT sends no Authorization header", async () => {
    const seen = captureAll({ value: [] });
    await (uiPath.run as any)(
      { actionName: "DirectoryService_GetDomains" },
      { serverURL: "https://ui.test/o", "Authorization.value": "" },
      {}
    );

    expect(seen).toHaveLength(1);
    expect(seen[0].headers[HEADER_AUTHORIZATION]).toBeUndefined();
  });
});

describe("wrapper plugins: huggingFaceEndpoint endpoint", () => {
  const HF_ORIGIN = "https://hf.test";
  const HF_ENDPOINT_REQUIRED = "The Endpoint URL is required";
  const LIST_VENDORS = { actionName: "list_vendors" };

  test("huggingFaceEndpoint: the endpoint's path prefix is kept", async () => {
    const seen = captureAll([]);
    await (huggingFaceEndpoint.run as any)(LIST_VENDORS, { endpoint: `${HF_ORIGIN}/v2/` }, {});

    expect(seen).toHaveLength(1);
    expect(seen[0].url.origin).toBe(HF_ORIGIN);
    expect(seen[0].url.pathname).toBe("/v2/provider");
  });

  test("huggingFaceEndpoint: an empty, blank or missing endpoint is rejected with 400 and nothing is sent", () => {
    const seen = captureAll([]);
    const dsConfigs: Json[] = [{ endpoint: "" }, { endpoint: "  " }, { "token.value": "t" }];
    dsConfigs.forEach((dsConfig) => {
      expect(() => (huggingFaceEndpoint.run as any)(LIST_VENDORS, dsConfig, {})).toThrow(
        expect.objectContaining({ code: STATUS_BAD_REQUEST, message: HF_ENDPOINT_REQUIRED })
      );
    });
    expect(seen).toHaveLength(0);
  });
});

describe("hello-world plugin (unregistered demo)", () => {
  const credentials = { username: "ann", password: "pw" };
  const run = (action: Json) => (helloWorld.run as any)(action, credentials, {});

  test("add returns the sum of both numbers", async () => {
    await expect(run({ actionName: "add", num1: 2, num2: 40 })).resolves.toBe(42);
  });

  test("join formats the datasource credentials with the name and age", async () => {
    await expect(run({ actionName: "join", name: "bob", age: 7 })).resolves.toBe("ann@pw:bob(7)");
  });

  test("an unknown action resolves to undefined", async () => {
    await expect(run({ actionName: "nope" })).resolves.toBeUndefined();
  });

  test("declares the two actions it can run", () => {
    expect((helloWorld.queryConfig as any).actions.map((a: any) => a.actionName)).toEqual(["add", "join"]);
  });
});
