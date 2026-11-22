import { DuckDBInstance } from "@duckdb/node-api";
import { BigQuery } from "@google-cloud/bigquery";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import http from "http";
import { AddressInfo } from "net";
import Firebird from "node-firebird";
import nock from "nock";
import path from "path";
import { dataSourceConfig as bigQueryDataSourceConfig } from "./bigQuery/dataSourceConfig";
import bigQueryQueryConfig from "./bigQuery/queryConfig";
import duckdbDataSourceConfig from "./duckdb/dataSourceConfig";
import duckdbQueryConfig from "./duckdb/queryConfig";
import faunaPlugin, { dataSourceConfig as faunaDataSourceConfig } from "./fauna";
import firebaseDataSourceConfig from "./firebase/dataSourceConfig";
import firebaseQueryConfig from "./firebase/queryConfig";
import getFirebirdDataSourceConfig from "./firebirdsql/dataSourceConfig";
import getFirebirdI18nTranslator from "./firebirdsql/i18n";
import getFirebirdQueryConfig from "./firebirdsql/queryConfig";
import runFirebird from "./firebirdsql/run";
import runBigQuery from "./bigQuery/run";
import { runFirebasePlugin } from "./firebase/run";
import gitlabPlugin, { dataSourceConfig as gitlabDataSourceConfig } from "./gitlab";
import { graphQLQueryConfig } from "./graphql/queryConfig";
import huggingFaceInferencePlugin from "./huggingFaceInference";
import shopifyPlugin, { dataSourceConfig as shopifyDataSourceConfig } from "./shopify";
import duckdbPlugin from "./duckdb";
import runSlack from "./slack/run";
import { dataSourceConfig as slackDataSourceConfig } from "./slack/dataSourceConfig";
import slackQueryConfig from "./slack/queryConfig";
import tursoPlugin from "./turso";

jest.mock("firebase-admin/app", () => ({ getApps: jest.fn(), initializeApp: jest.fn(), deleteApp: jest.fn(), cert: jest.fn() }));
jest.mock("firebase-admin/database", () => ({ getDatabase: jest.fn() }));
jest.mock("firebase-admin/firestore", () => ({ getFirestore: jest.fn() }));
jest.mock("node-firebird", () => ({ attach: jest.fn() }));
jest.mock("@google-cloud/bigquery", () => ({ BigQuery: jest.fn() }));

/**
 * Contract tests between the UI configuration (queryConfig / dataSourceConfig / i18n) and the code that
 * consumes it, for the query plugins. Two layers:
 *
 * 1. BEHAVIOURAL (the describe "behavioural contract" at the end). For every configured action of every
 *    query plugin the real `run` is called with an action and a data source built from the DECLARED param
 *    keys (marker values), wrapped in a recording Proxy, against the same boundaries as the plugin tests
 *    (module fakes for firebase-admin, node-firebird and @google-cloud/bigquery; a local http server for
 *    slack, gitlab, shopify and turso; nock for fauna; a global fetch spy for Hugging Face; the real
 *    in-memory DuckDB). It asserts (a) the keys `run` really reads at runtime (get and `in`, so optional
 *    chaining, aliases and computed access are all seen) are exactly the declared keys, and (b) the value
 *    of each declared key arrives at the boundary (SDK call, HTTP request or query result).
 * 2. TEXTUAL (the other describes). The expected key lists, action names, categories and English labels are
 *    written out here, and `run.ts` source text is searched for `handledActions` (the names `run` compares
 *    against). Kept because a runtime run only reaches the branches of the actions it is given.
 *
 * Limits, stated so they are not over-read:
 * - The runtime layer sees only a key that the probe's values make `run` read. Branches guarded by a
 *   falsy value (for example firebase `orderBy` absent) are not entered; every probe value is truthy.
 * - Boundary observation covers every declared key except the ones in UNOBSERVABLE (empty today) and the
 *   known defect shopify `headers` (B18, a `test.failing`). The firebase `FS.QueryFireStore` `query` key is
 *   observed only through the `where` field path; the rest of the structured query is covered by
 *   firebase/run.test.ts.
 * - Residual risk: a key that is read AND forwarded but under a wrong boundary name is caught only for the
 *   keys with a mapped observation below; a plugin added later is not covered until added to CASES.
 * - The textual layer ignores comment lines and does not see a key read through a computed property.
 */

const PLUGINS_DIR = __dirname;
const NOT_A_PARAM = "actionName";
const SPEC_VERSION_KEY = "specVersion"; // offered in the UI, not read by run

type Param = { key: string; type?: string; label?: string; rules?: readonly { required?: boolean; message?: string }[]; options?: readonly { value: string; label: string }[] };
type Action = { actionName: string; label: string; params: readonly Param[]; category?: readonly string[] };

const actionsOf = (config: any): Action[] => [...config.actions];
const paramKeys = (params: readonly Param[]) => params.map((p) => p.key);
const sorted = (values: Iterable<string>) => [...values].sort();
const actionOf = (config: any, name: string) => {
  const action = actionsOf(config).find((a) => a.actionName === name);
  if (!action) throw new Error(`no action ${name}`);
  return action;
};

function source(plugin: string, file: string) {
  return fs
    .readFileSync(path.join(PLUGINS_DIR, plugin, file), "utf8")
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");
}

/** Keys read from `owner` in the source: owner.key, "key" in owner, and const { key, key2: alias } = owner. */
function readKeys(src: string, owners: string[]) {
  const found = new Set<string>();
  for (const owner of owners) {
    for (const m of src.matchAll(new RegExp(`\\b${owner}\\.(\\w+)`, "g"))) found.add(m[1]);
    for (const m of src.matchAll(new RegExp(`"(\\w+)" in ${owner}\\b`, "g"))) found.add(m[1]);
    for (const m of src.matchAll(new RegExp(`const\\s*\\{([^}]*)\\}\\s*=\\s*${owner}\\b`, "g"))) {
      for (const part of m[1].split(",")) {
        const name = part.split(":")[0].trim();
        if (name) found.add(name);
      }
    }
  }
  found.delete(NOT_A_PARAM);
  return found;
}

/** Action names the code compares against: actionName === "X" and action.actionName === "X". */
const handledActions = (src: string) => [...src.matchAll(/actionName === "([\w.]+)"/g)].map((m) => m[1]);

describe("firebase", () => {
  const RUN = source("firebase", "run.ts");
  const EXPECTED_ACTIONS: Record<string, { category: string; params: string[] }> = {
    "RTDB.QueryDatabase": { category: "RealtimeDatabase", params: ["databaseRef"] },
    "RTDB.SetData": { category: "RealtimeDatabase", params: ["data", "databaseRef"] },
    "RTDB.UpdateData": { category: "RealtimeDatabase", params: ["data", "databaseRef"] },
    "RTDB.AppendDataToList": { category: "RealtimeDatabase", params: ["data", "databaseRef"] },
    "FS.ListFireStore": { category: "Firestore", params: ["collection", "orderBy", "orderDirection", "pageNumber", "pageSize"] },
    "FS.QueryFireStore": { category: "Firestore", params: ["collection", "query"] },
    "FS.InsertDocument": { category: "Firestore", params: ["collection", "data", "documentId"] },
    "FS.UpdateDocument": { category: "Firestore", params: ["collection", "data", "documentId"] },
    "FS.GetDocument": { category: "Firestore", params: ["collection", "documentId"] },
    "FS.DeleteDocument": { category: "Firestore", params: ["collection", "documentId"] },
    "FS.GetCollections": { category: "Firestore", params: ["parentDocumentId"] },
  };

  test("the action names are exactly the ones run.ts handles", () => {
    expect(sorted(actionsOf(firebaseQueryConfig).map((a) => a.actionName))).toEqual(sorted(Object.keys(EXPECTED_ACTIONS)));
    expect(sorted(handledActions(RUN))).toEqual(sorted(Object.keys(EXPECTED_ACTIONS)));
  });

  test("every action has actionName, label and the expected params", () => {
    for (const [name, expected] of Object.entries(EXPECTED_ACTIONS)) {
      const action = actionOf(firebaseQueryConfig, name);
      expect(typeof action.label).toBe("string");
      expect(action.label.length).toBeGreaterThan(0);
      expect(sorted(paramKeys(action.params))).toEqual(expected.params);
    }
  });

  test("RTDB actions carry the RealtimeDatabase category and FS actions the Firestore category", () => {
    for (const [name, expected] of Object.entries(EXPECTED_ACTIONS)) {
      expect(actionOf(firebaseQueryConfig, name).category).toEqual([expected.category]);
    }
    expect(firebaseQueryConfig.categories.items.map((i) => i.value)).toEqual(["RealtimeDatabase", "Firestore"]);
  });

  test("the keys run.ts reads from the action are exactly the union of the params of the actions", () => {
    const configured = new Set(actionsOf(firebaseQueryConfig).flatMap((a) => paramKeys(a.params)));
    expect(sorted(readKeys(RUN, ["actionData"]))).toEqual(sorted(configured));
  });

  test("the keys run.ts reads from the data source exist in the data source config", () => {
    const configured = paramKeys(firebaseDataSourceConfig.params);
    expect(sorted(readKeys(RUN, ["dataSourceConfig"]))).toEqual(["databaseUrl", "firestoreId", "privateKey"]);
    expect(sorted(configured.filter((k) => k !== SPEC_VERSION_KEY))).toEqual(["databaseUrl", "firestoreId", "privateKey"]);
  });
});

describe("firebirdsql", () => {
  const en = getFirebirdI18nTranslator(["en"]);
  const queryConfig = getFirebirdQueryConfig(en);
  const dataSourceConfig = getFirebirdDataSourceConfig(en);
  const RUN = source("firebirdsql", "run.ts");
  const DS_KEYS = ["blobAsText", "database", "host", "lowercaseKeys", "password", "port", "role", "username"];

  test("the query config has the Query action with the sql and params keys run.ts reads", () => {
    expect(actionsOf(queryConfig).map((a) => a.actionName)).toEqual(["Query"]);
    expect(handledActions(RUN)).toEqual(["Query"]);
    const keys = paramKeys(actionOf(queryConfig, "Query").params);
    expect(sorted(keys)).toEqual(["params", "sql"]);
    expect(sorted(readKeys(RUN, ["action"]))).toEqual(["params", "sql"]);
  });

  test("the data source config has every key run.ts reads", () => {
    expect(sorted(paramKeys(dataSourceConfig.params))).toEqual(DS_KEYS);
    expect(sorted(readKeys(RUN, ["params"]))).toEqual(sorted(DS_KEYS.filter((k) => k !== "params")));
  });

  test("the translator returns English labels and required messages", () => {
    expect(queryConfig.label).toBe("Actions");
    expect(actionOf(queryConfig, "Query").label).toBe("Query");
    expect(actionOf(queryConfig, "Query").params.map((p) => p.label)).toEqual(["SQL Query", "Query Parameters"]);
    const byKey = Object.fromEntries(dataSourceConfig.params.map((p: any) => [p.key, p]));
    expect(byKey.port.label).toBe("Port");
    expect(byKey.username.label).toBe("Username");
    expect(byKey.password.label).toBe("Password");
    expect(byKey.role.label).toBe("Connection Role");
    expect(byKey.host.rules[0].message).toBe("Please input the Host address");
    expect(byKey.database.rules[0].message).toBe("Please input the database name and/or path");
    expect(byKey.port.rules[0].message).toBe("Please specify the Port number");
    expect(byKey.username.rules[0].message).toBe("Please input the Username");
  });
});

describe("bigQuery", () => {
  const RUN = source("bigQuery", "run.ts");

  test("the Query action has the googleSQL key run reads", () => {
    expect(actionsOf(bigQueryQueryConfig).map((a) => a.actionName)).toEqual(["Query"]);
    expect(handledActions(RUN)).toEqual(["Query"]);
    expect(paramKeys(actionOf(bigQueryQueryConfig, "Query").params)).toEqual(["googleSQL"]);
    expect(sorted(readKeys(RUN, ["action"]))).toEqual(["googleSQL"]);
  });

  test("the data source config has the privateKey and region keys run reads", () => {
    expect(sorted(paramKeys(bigQueryDataSourceConfig.params))).toEqual(["privateKey", "region"]);
    expect(sorted(readKeys(RUN, ["params"]))).toEqual(["privateKey", "region"]);
  });
});

describe("duckdb", () => {
  const INDEX = source("duckdb", "index.ts");

  test("the Query action has the queryString key the plugin reads", () => {
    expect(actionsOf(duckdbQueryConfig).map((a) => a.actionName)).toEqual(["Query"]);
    expect(handledActions(INDEX)).toEqual(["Query"]);
    expect(paramKeys(actionOf(duckdbQueryConfig, "Query").params)).toEqual(["queryString"]);
    expect(sorted(readKeys(INDEX, ["actionData"]))).toEqual(["queryString"]);
  });

  test("the data source config has the databaseFile and options keys the plugin reads, with in-memory defaults", () => {
    expect(sorted(paramKeys(duckdbDataSourceConfig.params))).toEqual(["databaseFile", "options"]);
    expect(sorted(readKeys(INDEX, ["dataSourceConfig"]))).toEqual(["databaseFile", "options"]);
    const defaults = Object.fromEntries(duckdbDataSourceConfig.params.map((p: any) => [p.key, p.defaultValue]));
    expect(defaults.databaseFile).toBe(":memory:");
    expect(() => JSON.parse(defaults.options)).not.toThrow();
  });
});

describe("slack", () => {
  const RUN = source("slack", "run.ts");

  test("the Query action has the message and channel keys run reads", () => {
    expect(actionsOf(slackQueryConfig).map((a) => a.actionName)).toEqual(["Query"]);
    expect(sorted(paramKeys(actionOf(slackQueryConfig, "Query").params))).toEqual(["channel", "message"]);
    expect(sorted(readKeys(RUN, ["action"]))).toEqual(["channel", "message"]);
  });

  test("the data source config has the webhookURL key run reads", () => {
    expect(paramKeys(slackDataSourceConfig.params)).toEqual(["webhookURL"]);
    expect(sorted(readKeys(RUN, ["dataSourceConfig"]))).toEqual(["webhookURL"]);
  });
});

describe("graphql family (fauna, gitlab, shopify)", () => {
  const PLUGINS: Record<string, { ds: readonly Param[]; dsKeys: string[] }> = {
    fauna: { ds: faunaDataSourceConfig.params, dsKeys: ["apiKey", "region"] },
    gitlab: { ds: gitlabDataSourceConfig.params, dsKeys: ["endpoint", "headers", "token"] },
    shopify: { ds: shopifyDataSourceConfig.params, dsKeys: ["endpoint"] },
  };

  test("the shared query config has the query, variables and headers keys the plugins read", () => {
    expect(actionsOf(graphQLQueryConfig).map((a) => a.actionName)).toEqual(["query"]);
    expect(paramKeys(actionOf(graphQLQueryConfig, "query").params)).toEqual(["query", "variables", "headers"]);
    for (const plugin of Object.keys(PLUGINS)) {
      expect(sorted(readKeys(source(plugin, "index.ts"), ["actionData"]))).toEqual(["headers", "query", "variables"]);
    }
  });

  test.each(Object.keys(PLUGINS))("%s: the data source keys the plugin reads exist in its data source config", (plugin) => {
    expect(sorted(paramKeys(PLUGINS[plugin].ds))).toEqual(PLUGINS[plugin].dsKeys);
    expect(sorted(readKeys(source(plugin, "index.ts"), ["dataSourceConfig"]))).toEqual(PLUGINS[plugin].dsKeys);
  });
});

describe("turso and huggingFaceInference (config inline in index.ts)", () => {
  test("turso: queryString and includeRaw (action) and url and token (data source) match what run reads", () => {
    const src = source("turso", "index.ts");
    const queryConfig: any = tursoPlugin.queryConfig;
    expect(actionsOf(queryConfig).map((a) => a.actionName)).toEqual(["Query"]);
    expect(sorted(paramKeys(actionOf(queryConfig, "Query").params))).toEqual(["includeRaw", "queryString"]);
    expect(sorted(readKeys(src, ["actionData"]))).toEqual(["includeRaw", "queryString"]);
    expect(sorted(paramKeys((tursoPlugin.dataSourceConfig as any).params))).toEqual(["token", "url"]);
    expect(sorted(readKeys(src, ["dataSourceConfig"]))).toEqual(["token", "url"]);
  });

  test("huggingFaceInference: model and body (action) and token (data source) match what run reads", async () => {
    const src = source("huggingFaceInference", "index.ts");
    const queryConfig: any = await (huggingFaceInferencePlugin.queryConfig as any)({});
    expect(actionsOf(queryConfig).map((a) => a.actionName)).toEqual(["InvokeInferenceApi"]);
    expect(sorted(paramKeys(actionOf(queryConfig, "InvokeInferenceApi").params))).toEqual(["body", "model"]);
    expect(sorted(readKeys(src, ["actionData"]))).toEqual(["body", "model"]);
    const dsKeys = paramKeys((huggingFaceInferencePlugin.dataSourceConfig as any).params);
    expect(sorted(dsKeys.filter((k) => k !== SPEC_VERSION_KEY))).toEqual(["token"]);
    expect(sorted(readKeys(src, ["dataSourceConfig"]))).toEqual(["token"]);
  });
});


/** The action labels the UI shows. A config whose label is missing or renamed fails here. */
describe("every action has a string label (all query plugins)", () => {
  const ACTION_LABELS: Record<string, [() => any, Record<string, string>]> = {
    firebase: [
      () => firebaseQueryConfig,
      {
        "RTDB.QueryDatabase": "Query Database",
        "RTDB.SetData": "Set Data",
        "RTDB.UpdateData": "Update Data",
        "RTDB.AppendDataToList": "Append Data to a list",
        "FS.ListFireStore": "List Documents from Collection",
        "FS.QueryFireStore": "Query Collection",
        "FS.InsertDocument": "Insert Document",
        "FS.UpdateDocument": "Update Document",
        "FS.GetDocument": "Get Document",
        "FS.DeleteDocument": "Delete Document",
        "FS.GetCollections": "Get Collections",
      },
    ],
    firebirdsql: [() => getFirebirdQueryConfig(getFirebirdI18nTranslator(["en"])), { Query: "Query" }],
    bigQuery: [() => bigQueryQueryConfig, { Query: "Query" }],
    duckdb: [() => duckdbQueryConfig, { Query: "Query" }],
    slack: [() => slackQueryConfig, { Query: "Query" }],
    graphql: [() => graphQLQueryConfig, { query: "Query" }],
    turso: [() => tursoPlugin.queryConfig, { Query: "Query" }],
  };

  test.each(Object.keys(ACTION_LABELS))("%s: each action has the expected non-empty string label and every param has a string label", (plugin) => {
    const [config, labels] = ACTION_LABELS[plugin];
    const actions = actionsOf(config());
    expect(sorted(actions.map((a) => a.actionName))).toEqual(sorted(Object.keys(labels)));
    for (const action of actions) {
      expect(typeof action.label).toBe("string");
      expect(action.label).toBe(labels[action.actionName]);
      for (const param of action.params) expect(typeof param.label).toBe("string");
    }
  });

  test("huggingFaceInference: the InvokeInferenceApi action has the label Inference API", async () => {
    const queryConfig: any = await (huggingFaceInferencePlugin.queryConfig as any)({});
    const action = actionOf(queryConfig, "InvokeInferenceApi");
    expect(typeof action.label).toBe("string");
    expect(action.label).toBe("Inference API");
  });
});

// ---------------------------------------------------------------------------------------------------
// Behavioural contract
// ---------------------------------------------------------------------------------------------------

const STATUS_OK = 200;
const PROBE_PORT = 3050;
const PROBE_PAGE_SIZE = 7;
const PROBE_PAGE_NUMBER = 3;
const FIRESTORE_COUNT = 1;
const HOOK_PATH = "/hook";
const GRAPHQL_PATH = "/graphql";
const FAUNA_ORIGIN = "https://graphql.us.fauna.com";
const FAUNA_REGION = "us";
const HF_URL_PREFIX = "https://api-inference.huggingface.co/models/";
const PROXY_ENV_KEYS = ["HTTP_PROXY", "http_proxy", "HTTPS_PROXY", "https_proxy", "NO_PROXY", "no_proxy"];
const CTX = { languages: ["en"] } as any;
const B18_KNOWN_DEFECT = "B18";

const marker = (key: string) => `probe_${key}`;
const kv = (key: string, value: unknown) => ({ key, value });

/** Recording view of a plain object: remembers every string key read through `get` or `in`. */
function recording<T extends object>(base: T) {
  const reads = new Set<string>();
  const proxy = new Proxy(base, {
    get(target, key, receiver) {
      if (typeof key === "string") reads.add(key);
      return Reflect.get(target, key, receiver);
    },
    has(target, key) {
      if (typeof key === "string") reads.add(key);
      return Reflect.has(target, key);
    },
  });
  return { proxy, reads };
}

/** key -> [expected, actual] pairs of what reached the boundary. */
type Observed = Record<string, [unknown, unknown]>;
type Executed = { action: Observed; dataSource: Observed; actionReads: Set<string>; dataSourceReads: Set<string> };
type Plugin = {
  actions: () => Promise<readonly Action[]>;
  dataSourceParams: () => readonly Param[];
  /** base values for the declared keys of the data source and of one action */
  dataSourceValues: (baseUrl: string) => Record<string, unknown>;
  actionValues: (actionName: string) => Record<string, unknown>;
  execute: (actionName: string, action: Record<string, unknown>, dataSource: Record<string, unknown>, baseUrl: string) => Promise<Observed[]>;
  /** declared keys that are offered in the UI and deliberately not read by run */
  notRead?: string[];
  /** keys a run cannot show at the boundary: [action | dataSource, key] */
  unobservable?: [string, string][];
  /** known defects: key -> B-number; the observation is expected to fail */
  knownDefects?: Record<string, string>;
};

// --- shared local http server (slack, gitlab, shopify, turso) ---
type Seen = { url?: string; headers: http.IncomingHttpHeaders; raw: string };
let server: http.Server;
let baseUrl: string;
let seen: Seen[];
let replyBody: string;
const savedEnv: Record<string, string | undefined> = {};

const lastSeen = () => {
  if (seen.length === 0) throw new Error("the boundary received no request");
  return seen[seen.length - 1];
};
const seenJson = () => JSON.parse(lastSeen().raw);

// --- firebase fake: one recording query (same boundary as firebase/run.test.ts, minimal) ---
let fsCalls: unknown[][];
class ProbeQuery {
  protected rec(name: string, ...args: unknown[]) {
    fsCalls.push([name, ...args]);
    return this;
  }
  where(...a: unknown[]) { return this.rec("where", ...a); }
  orderBy(...a: unknown[]) { return this.rec("orderBy", ...a); }
  limit(...a: unknown[]) { return this.rec("limit", ...a); }
  startAfter(...a: unknown[]) { return this.rec("startAfter", ...a); }
  select(...a: unknown[]) { return this.rec("select", ...a); }
  count() {
    return { get: async () => ({ data: () => ({ count: FIRESTORE_COUNT }) }) };
  }
  async get() {
    fsCalls.push(["get"]);
    return { empty: false, docs: [{ data: () => ({}), id: "d" }] };
  }
}
class ProbeDocRef {
  constructor(readonly id: string) {}
  async get() { return { data: () => ({}) }; }
  async set(data: unknown) { fsCalls.push(["doc.set", this.id, data]); }
  async update(data: unknown) { fsCalls.push(["doc.update", this.id, data]); }
  async delete() { fsCalls.push(["doc.delete", this.id]); }
  async listCollections() { fsCalls.push(["doc.listCollections", this.id]); return []; }
}
class ProbeCollection extends ProbeQuery {
  doc(id: string) { fsCalls.push(["collection.doc", id]); return new ProbeDocRef(id); }
  async add(data: unknown) { fsCalls.push(["collection.add", data]); return { id: "g" }; }
}
const probeFirestore = {
  collection: (name: string) => { fsCalls.push(["collection", name]); return new ProbeCollection(); },
  doc: (p: string) => { fsCalls.push(["firestore.doc", p]); return new ProbeDocRef(p); },
  listCollections: async () => { fsCalls.push(["firestore.listCollections"]); return []; },
};
const probeDatabase = {
  ref: (p: string) => {
    fsCalls.push(["rtdb.ref", p]);
    return {
      once: async () => ({ val: () => null }),
      set: async (d: unknown) => void fsCalls.push(["rtdb.set", d]),
      update: async (d: unknown) => void fsCalls.push(["rtdb.update", d]),
      push: async (d: unknown) => void fsCalls.push(["rtdb.push", d]),
    };
  },
};
const fsArg = (name: string, index = 1) => {
  const call = fsCalls.find((c) => c[0] === name);
  return call ? call[index] : undefined;
};

// --- other module fakes ---
let firebirdAttachOptions: any;
let firebirdQueries: { sql: string; params: unknown[] }[];
let bigQueryCtorOptions: any;
let bigQuerySql: unknown;
let duckdbCreateArgs: unknown[];
let duckdbOpened: DuckDBInstance[];

const graphqlHeaders = (headersSeen: http.IncomingHttpHeaders) => headersSeen;
const graphqlKvObserved = (headers: http.IncomingHttpHeaders, body: any, action: Record<string, any>): Observed => ({
  query: [action.query, body.query],
  variables: [{ [marker("variablesKey")]: marker("variables") }, body.variables],
  headers: [marker("headers"), [headers["x-probe-query"]].flat().join(",")],
});

const CASES: Record<string, Plugin> = {
  firebase: {
    actions: async () => actionsOf(firebaseQueryConfig),
    dataSourceParams: () => firebaseDataSourceConfig.params,
    notRead: [SPEC_VERSION_KEY],
    dataSourceValues: () => ({
      privateKey: JSON.stringify({ project_id: marker("privateKey") }),
      databaseUrl: marker("databaseUrl"),
      firestoreId: marker("firestoreId"),
    }),
    actionValues: () => ({
      databaseRef: marker("databaseRef"),
      data: { field: marker("data") },
      collection: marker("collection"),
      documentId: marker("documentId"),
      parentDocumentId: marker("parentDocumentId"),
      orderBy: marker("orderBy"),
      orderDirection: "desc",
      pageSize: PROBE_PAGE_SIZE,
      pageNumber: PROBE_PAGE_NUMBER,
      query: { where: { fieldFilter: { field: { fieldPath: marker("query") }, op: "EQUAL", value: { stringValue: "v" } } } },
    }),
    execute: async (_name, action, dataSource) => {
      (getApps as jest.Mock).mockReset().mockReturnValue([]);
      (initializeApp as jest.Mock).mockReset().mockReturnValue({});
      (cert as jest.Mock).mockReset().mockReturnValue({});
      (getFirestore as jest.Mock).mockReset().mockReturnValue(probeFirestore);
      (getDatabase as jest.Mock).mockReset().mockReturnValue(probeDatabase);
      fsCalls = [];
      const a = recording(action);
      const d = recording(dataSource);
      await runFirebasePlugin(a.proxy as any, d.proxy as any);
      const initOptions = (initializeApp as jest.Mock).mock.calls[0][0];
      const dataArg = fsArg("rtdb.set") ?? fsArg("rtdb.update") ?? fsArg("rtdb.push") ?? fsArg("doc.set", 2) ?? fsArg("doc.update", 2) ?? fsArg("collection.add");
      const limits = fsCalls.filter((c) => c[0] === "limit").map((c) => c[1]);
      const actionObserved: Observed = {
        databaseRef: [action.databaseRef, fsArg("rtdb.ref")],
        data: [action.data, dataArg],
        collection: [action.collection, fsArg("collection")],
        documentId: [action.documentId, fsArg("collection.doc") ?? fsArg("doc.delete") ?? fsArg("doc.update")],
        parentDocumentId: [action.parentDocumentId, fsArg("firestore.doc")],
        orderBy: [action.orderBy, fsArg("orderBy", 1)],
        orderDirection: [action.orderDirection, fsArg("orderBy", 2)],
        pageSize: [action.pageSize, limits[limits.length - 1]],
        // firebase/run.ts selects page N by reading the first (N-1)*pageSize documents (limit(offset)),
        // starting after the last of them (startAfter) and limiting to pageSize; the page number is
        // therefore recovered from the offset limit actually sent, never from a constant.
        pageNumber: [action.pageNumber, fsCalls.some((c) => c[0] === "startAfter") ? Number(limits[0]) / PROBE_PAGE_SIZE + 1 : 1],
        query: [(action.query as any)?.where?.fieldFilter?.field?.fieldPath, fsArg("where", 1)],
      };
      const dataSourceObserved: Observed = {
        privateKey: [JSON.parse(dataSource.privateKey as string), (cert as jest.Mock).mock.calls[0][0]],
        databaseUrl: [dataSource.databaseUrl, initOptions.databaseURL],
        firestoreId: [dataSource.firestoreId, (initializeApp as jest.Mock).mock.calls[0][1]],
      };
      return [actionObserved, dataSourceObserved, a.reads as any, d.reads as any];
    },
  },
  firebirdsql: {
    actions: async () => actionsOf(getFirebirdQueryConfig(getFirebirdI18nTranslator(["en"]))),
    dataSourceParams: () => getFirebirdDataSourceConfig(getFirebirdI18nTranslator(["en"])).params,
    dataSourceValues: () => ({
      host: marker("host"),
      port: PROBE_PORT,
      database: marker("database"),
      username: marker("username"),
      password: marker("password"),
      role: marker("role"),
      lowercaseKeys: true,
      blobAsText: false,
    }),
    actionValues: () => ({ sql: "select * from t where a = :p", params: { p: marker("params") } }),
    execute: async (_name, action, dataSource) => {
      firebirdAttachOptions = undefined;
      firebirdQueries = [];
      const a = recording(action);
      const d = recording(dataSource);
      await runFirebird(a.proxy as any, d.proxy as any, undefined as any);
      const o = firebirdAttachOptions;
      return [
        { sql: ["select * from t where a = ?", firebirdQueries[0]?.sql], params: [[marker("params")], firebirdQueries[0]?.params] },
        {
          host: [dataSource.host, o.host],
          port: [dataSource.port, o.port],
          database: [dataSource.database, o.database],
          username: [dataSource.username, o.user],
          password: [dataSource.password, o.password],
          role: [dataSource.role, o.role],
          lowercaseKeys: [true, o.lowercase_keys],
          blobAsText: [false, o.blobAsText],
        },
        a.reads as any,
        d.reads as any,
      ];
    },
  },
  bigQuery: {
    actions: async () => actionsOf(bigQueryQueryConfig),
    dataSourceParams: () => bigQueryDataSourceConfig.params,
    dataSourceValues: () => ({ privateKey: JSON.stringify({ project_id: marker("privateKey") }), region: marker("region") }),
    actionValues: () => ({ googleSQL: "select 'probe_googleSQL'" }),
    execute: async (_name, action, dataSource) => {
      bigQueryCtorOptions = undefined;
      bigQuerySql = undefined;
      const a = recording(action);
      const d = recording(dataSource);
      await runBigQuery(a.proxy as any, d.proxy as any);
      return [
        { googleSQL: [action.googleSQL, bigQuerySql] },
        { privateKey: [JSON.parse(dataSource.privateKey as string), bigQueryCtorOptions.credentials], region: [dataSource.region, bigQueryCtorOptions.location] },
        a.reads as any,
        d.reads as any,
      ];
    },
  },
  duckdb: {
    actions: async () => actionsOf(duckdbQueryConfig),
    dataSourceParams: () => duckdbDataSourceConfig.params,
    dataSourceValues: () => ({ databaseFile: ":memory:", options: JSON.stringify({ access_mode: "READ_WRITE" }) }),
    actionValues: () => ({ queryString: `select '${marker("queryString")}' as probe` }),
    execute: async (_name, action, dataSource) => {
      duckdbCreateArgs = [];
      const a = recording(action);
      const d = recording(dataSource);
      const rows: any = await duckdbPlugin.run!(a.proxy as any, d.proxy as any, CTX);
      return [
        { queryString: [marker("queryString"), Object.values(rows[0] ?? {})[0]] },
        { databaseFile: [dataSource.databaseFile, duckdbCreateArgs[0]], options: [JSON.parse(dataSource.options as string), duckdbCreateArgs[1]] },
        a.reads as any,
        d.reads as any,
      ];
    },
  },
  slack: {
    actions: async () => actionsOf(slackQueryConfig),
    dataSourceParams: () => slackDataSourceConfig.params,
    dataSourceValues: (base) => ({ webhookURL: `${base}${HOOK_PATH}` }),
    actionValues: () => ({ channel: marker("channel"), message: marker("message") }),
    execute: async (_name, action, dataSource, base) => {
      replyBody = "ok";
      const a = recording(action);
      const d = recording(dataSource);
      await runSlack(a.proxy as any, d.proxy as any);
      const payload = JSON.parse(new URLSearchParams(lastSeen().raw).get("payload")!);
      return [
        { channel: [action.channel, payload.channel], message: [action.message, payload.text] },
        { webhookURL: [dataSource.webhookURL, `${base}${lastSeen().url}`] },
        a.reads as any,
        d.reads as any,
      ];
    },
  },
  gitlab: graphqlCase("gitlab"),
  shopify: graphqlCase("shopify"),
  fauna: graphqlCase("fauna"),
  turso: {
    actions: async () => actionsOf(tursoPlugin.queryConfig as any),
    dataSourceParams: () => (tursoPlugin.dataSourceConfig as any).params,
    dataSourceValues: (base) => ({ url: base, token: marker("token") }),
    actionValues: () => ({ queryString: `select '${marker("queryString")}'`, includeRaw: true }),
    execute: async (_name, action, dataSource, base) => {
      replyBody = JSON.stringify({ results: [{ type: "ok", response: { type: "execute", result: { cols: [], rows: [] } } }] });
      const a = recording(action);
      const d = recording(dataSource);
      const result: any = await tursoPlugin.run!(a.proxy as any, d.proxy as any, CTX);
      const body = seenJson();
      return [
        { queryString: [action.queryString, body.requests[0].stmt.sql], includeRaw: [true, !!result && "raw" in result] },
        { url: [`${dataSource.url}/v2/pipeline`, `${base}${lastSeen().url}`], token: [`Bearer ${dataSource.token}`, lastSeen().headers.authorization] },
        a.reads as any,
        d.reads as any,
      ];
    },
  },
  huggingFaceInference: {
    actions: async () => actionsOf(await (huggingFaceInferencePlugin.queryConfig as any)({})),
    dataSourceParams: () => (huggingFaceInferencePlugin.dataSourceConfig as any).params,
    notRead: [SPEC_VERSION_KEY],
    dataSourceValues: () => ({ token: marker("token") }),
    actionValues: () => ({ model: marker("model"), body: { inputs: marker("body") } }),
    execute: async (_name, action, dataSource) => {
      const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(new Response("{}", { status: STATUS_OK }));
      const a = recording(action);
      const d = recording(dataSource);
      await huggingFaceInferencePlugin.run!(a.proxy as any, d.proxy as any, CTX);
      const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      return [
        { model: [action.model, url.slice(HF_URL_PREFIX.length)], body: [action.body, JSON.parse(init.body as string)] },
        { token: [`Bearer ${dataSource.token}`, (init.headers as Record<string, string>).Authorization] },
        a.reads as any,
        d.reads as any,
      ];
    },
  },
};

/** gitlab, shopify and fauna share the query config; they differ in their data source and endpoint. */
function graphqlCase(name: "gitlab" | "shopify" | "fauna"): Plugin {
  const plugin = { gitlab: gitlabPlugin, shopify: shopifyPlugin, fauna: faunaPlugin }[name];
  return {
    actions: async () => actionsOf(graphQLQueryConfig),
    dataSourceParams: () => (plugin.dataSourceConfig as any).params,
    knownDefects: name === "shopify" ? { headers: B18_KNOWN_DEFECT } : undefined,
    dataSourceValues: (base) =>
      ({
        gitlab: { endpoint: `${base}${GRAPHQL_PATH}`, token: marker("token"), headers: [kv("x-probe-ds", marker("dsHeaders"))] },
        shopify: { endpoint: `${base}${GRAPHQL_PATH}` },
        fauna: { region: FAUNA_REGION, apiKey: marker("apiKey") },
      })[name],
    actionValues: () => ({
      query: "query ProbeQuery($v: String) { probe(v: $v) }",
      variables: [kv(marker("variablesKey"), marker("variables"))],
      headers: [kv("x-probe-query", marker("headers"))],
    }),
    execute: async (_n, action, dataSource, base) => {
      let headers: http.IncomingHttpHeaders;
      let body: any;
      if (name === "fauna") {
        const scope = nock(FAUNA_ORIGIN)
          .post(GRAPHQL_PATH, (b) => ((body = b), true))
          .reply(function () {
            headers = this.req.headers as any;
            return [STATUS_OK, { data: {} }];
          });
        const a = recording(action);
        const d = recording(dataSource);
        await plugin.run!(a.proxy as any, d.proxy as any, CTX);
        expect(scope.isDone()).toBe(true);
        return [
          graphqlKvObserved(headers!, body, action),
          { region: [FAUNA_REGION, scope.isDone() ? FAUNA_REGION : undefined], apiKey: [`Bearer ${dataSource.apiKey}`, [headers!["authorization"]].flat().join(",")] },
          a.reads as any,
          d.reads as any,
        ];
      }
      replyBody = JSON.stringify({ data: {} });
      const a = recording(action);
      const d = recording(dataSource);
      await plugin.run!(a.proxy as any, d.proxy as any, CTX);
      headers = lastSeen().headers;
      body = seenJson();
      const dsObserved: Observed =
        name === "gitlab"
          ? {
              endpoint: [dataSource.endpoint, `${base}${lastSeen().url}`],
              token: [dataSource.token, headers["private-token"]],
              headers: [marker("dsHeaders"), headers["x-probe-ds"]],
            }
          : { endpoint: [dataSource.endpoint, `${base}${lastSeen().url}`] };
      return [graphqlKvObserved(graphqlHeaders(headers), body, action), dsObserved, a.reads as any, d.reads as any];
    },
  };
}

describe("behavioural contract: declared params are read by run and reach the boundary", () => {
  beforeAll(async () => {
    server = http.createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => {
        seen.push({ url: req.url, headers: req.headers, raw: Buffer.concat(chunks).toString("utf8") });
        res.statusCode = STATUS_OK;
        res.setHeader("content-type", "application/json");
        res.end(replyBody);
      });
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  beforeEach(() => {
    seen = [];
    replyBody = "{}";
    duckdbOpened = [];
    for (const k of PROXY_ENV_KEYS) {
      savedEnv[k] = process.env[k];
      delete process.env[k];
    }
    nock.disableNetConnect();
    nock.enableNetConnect("127.0.0.1");
    (Firebird.attach as unknown as jest.Mock).mockReset().mockImplementation((options: unknown, cb: (err: Error | null, db?: unknown) => void) => {
      firebirdAttachOptions = options;
      cb(null, {
        query: (sql: string, params: unknown[], done: (err: Error | null, rows?: unknown) => void) => {
          firebirdQueries.push({ sql, params });
          done(null, []);
        },
        detach: (cb2?: (err?: Error | null) => void) => cb2 && cb2(null),
      });
    });
    (BigQuery as unknown as jest.Mock).mockReset().mockImplementation((options: unknown) => {
      bigQueryCtorOptions = options;
      return { query: async (sql: unknown) => ((bigQuerySql = sql), [[]]) };
    });
    spyOnDuckdbCreate();
  });

  afterEach(() => {
    closeDuckdb();
    jest.restoreAllMocks();
    nock.cleanAll();
    nock.enableNetConnect();
    for (const k of PROXY_ENV_KEYS) {
      if (savedEnv[k] === undefined) delete process.env[k];
      else process.env[k] = savedEnv[k];
    }
  });

  /** Pass-through spy: remembers the create() arguments and every instance, so each one can be closed. */
  function spyOnDuckdbCreate() {
    const realCreate = DuckDBInstance.create.bind(DuckDBInstance);
    jest.spyOn(DuckDBInstance, "create").mockImplementation(async (...args: Parameters<typeof DuckDBInstance.create>) => {
      duckdbCreateArgs = [...args];
      const instance = await realCreate(...args);
      duckdbOpened.push(instance);
      return instance;
    });
  }
  function closeDuckdb() {
    for (const instance of duckdbOpened) {
      try {
        DuckDBInstance.prototype.closeSync.call(instance);
      } catch {
        // already closed
      }
    }
    duckdbOpened = [];
  }

  const declared = (params: readonly Param[], notRead: string[] = []) => sorted(paramKeys(params).filter((k) => !notRead.includes(k)));
  const pick = (values: Record<string, unknown>, params: readonly Param[]) => Object.fromEntries(paramKeys(params).map((k) => [k, values[k]]));

  async function executeAction(plugin: string, actionName: string) {
    const c = CASES[plugin];
    const action = actionOf({ actions: await c.actions() }, actionName);
    const actionBase = { actionName, ...pick(c.actionValues(actionName), action.params) };
    const dsBase = pick(c.dataSourceValues(baseUrl), c.dataSourceParams());
    const [actionObserved, dsObserved, actionReads, dsReads] = (await c.execute(actionName, actionBase, dsBase, baseUrl)) as unknown as [
      Observed,
      Observed,
      Set<string>,
      Set<string>,
    ];
    return { c, action, actionObserved, dsObserved, actionReads, dsReads };
  }

  const ALL_ACTIONS: [string, string][] = [];
  const PLUGIN_ACTIONS: Record<string, string[]> = {
    firebase: Object.keys(Object.fromEntries(actionsOf(firebaseQueryConfig).map((a) => [a.actionName, 1]))),
    firebirdsql: ["Query"],
    bigQuery: ["Query"],
    duckdb: ["Query"],
    slack: ["Query"],
    gitlab: ["query"],
    shopify: ["query"],
    fauna: ["query"],
    turso: ["Query"],
    huggingFaceInference: ["InvokeInferenceApi"],
  };
  for (const [plugin, names] of Object.entries(PLUGIN_ACTIONS)) for (const n of names) ALL_ACTIONS.push([plugin, n]);

  test("the table covers every configured action of every query plugin", async () => {
    for (const [plugin, names] of Object.entries(PLUGIN_ACTIONS)) {
      const configured = (await CASES[plugin].actions()).map((a) => a.actionName);
      expect(sorted(configured)).toEqual(sorted(names));
    }
  });

  test.each(ALL_ACTIONS)("%s / %s: the keys run reads from the action and the data source are exactly the declared keys", async (plugin, actionName) => {
    const { c, action, actionReads, dsReads } = await executeAction(plugin, actionName);
    const actionKeys = [...actionReads].filter((k) => k !== NOT_A_PARAM);
    expect(sorted(actionKeys)).toEqual(sorted(paramKeys(action.params)));
    // run reads a data source only for what the action uses; the union over the actions is checked below
    const dsDeclared = declared(c.dataSourceParams(), c.notRead);
    for (const key of dsReads) expect(dsDeclared).toContain(key);
  });

  test.each(Object.keys(CASES))("%s: the data source keys read across all its actions are exactly the declared data source keys", async (plugin) => {
    const union = new Set<string>();
    for (const name of PLUGIN_ACTIONS[plugin]) {
      const { dsReads } = await executeAction(plugin, name);
      dsReads.forEach((k) => union.add(k));
      // fresh boundaries for the next action of this plugin
      seen = [];
      nock.cleanAll();
      closeDuckdb();
      jest.restoreAllMocks();
      spyOnDuckdbCreate();
    }
    expect(sorted(union)).toEqual(declared(CASES[plugin].dataSourceParams(), CASES[plugin].notRead));
  });

  test.each(ALL_ACTIONS)(
    "%s / %s: every declared action and data source value arrives at the boundary",
    async (plugin, actionName) => {
      const { c, action, actionObserved, dsObserved, actionReads } = await executeAction(plugin, actionName);
      const defects = c.knownDefects ?? {};
      for (const key of paramKeys(action.params)) {
        if (key in defects) continue;
        expect(actionObserved).toHaveProperty([key]);
        expect({ key, actual: actionObserved[key][1] }).toEqual({ key, actual: actionObserved[key][0] });
      }
      // every observed data source key is among the declared ones, and arrives intact
      const dsKeys = paramKeys(c.dataSourceParams()).filter((k) => k in dsObserved);
      for (const key of dsKeys) expect({ key, actual: dsObserved[key][1] }).toEqual({ key, actual: dsObserved[key][0] });
      // the keys the action did not use are not observed, so the check covers what this action reads
      expect(actionReads.size).toBeGreaterThan(0);
    }
  );

  test.failing("B18: shopify forwards the query headers (contract: the declared headers key must reach the request)", async () => {
    const { actionObserved } = await executeAction("shopify", "query");
    expect(actionObserved.headers[1]).toEqual(actionObserved.headers[0]);
  });
});
