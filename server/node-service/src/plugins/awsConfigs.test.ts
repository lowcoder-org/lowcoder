import fs from "fs";
import path from "path";
import { AthenaClient, GetQueryExecutionCommand, StartQueryExecutionCommand } from "@aws-sdk/client-athena";
import { AppConfigClient } from "@aws-sdk/client-appconfig";
import { AppConfigDataClient, GetLatestConfigurationCommand, StartConfigurationSessionCommand } from "@aws-sdk/client-appconfigdata";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { InvokeCommand, LambdaClient, ListFunctionsCommand } from "@aws-sdk/client-lambda";
import { ServiceError } from "../common/error";
import appconfigDataSourceConfig from "./appconfig/dataSourceConfig";
import appconfigPlugin from "./appconfig";
import appconfigQueryConfig from "./appconfig/queryConfig";
import athenaDataSourceConfig from "./athena/dataSourceConfig";
import athenaPlugin from "./athena";
import athenaQueryConfig from "./athena/queryConfig";
import dynamoDataSourceConfig from "./dynamodb/dataSourceConfig";
import dynamoPlugin from "./dynamodb";
import dynamoQueryConfig from "./dynamodb/queryConfig";
import lambdaDataSourceConfig from "./lambda/dataSourceConfig";
import lambdaPlugin from "./lambda";
import lambdaQueryConfig from "./lambda/queryConfig";

/**
 * Contract tests between the UI configuration (queryConfig / dataSourceConfig) and the code that reads it
 * (index.ts / run.ts) for the four AWS plugins.
 *
 * BEHAVIOURAL part (most of the file): for every configured action the plugin's real `run` is called with
 * an action object built ONLY from the param keys the config declares (a unique sentinel per key, first
 * option for selects, a number for numberInputs), against the SDK boundary `Client.prototype.send`
 * (mocked, recording). Each declared param must reach the command input (found anywhere in it, byte arrays
 * decoded). Likewise each declared data source key is given a sentinel and must show up in the client the
 * plugin built (credentials, region, endpoint) or in the command (athena s3Location). A key renamed on
 * either side therefore fails, and a refactor that keeps behaviour does not.
 * Limits of the behavioural part: it proves a declared key reaches SOME field of the command input, not the
 * right field (a param swapped with another of the same action is not detected; the per-action tests in
 * each plugin's own suite pin the exact field). Which actions are implemented is DISCOVERED by whether a
 * command is sent: an AppConfig action counts as unimplemented when it rejects with the 400 "not supported"
 * error, and one that neither sends a command nor rejects fails the `silent` assertion, so an action
 * silently turned into a no-op fails the pinned counts, not a source scan.
 *
 * TEXTUAL part (residual risk, kept because it cannot be observed through `run`): (1) the key list of the
 * `commandMap` in dynamodb/run.ts and (2) the `case "..."` labels of the switch in appconfig/index.ts are
 * read from source text, to prove nothing is handled that the UI does not offer. Both are regex scans: a
 * commented-out line or a computed key would mislead them, and a refactor of the switch/map layout fails
 * them without a behaviour change. Everything else (types, defaults, options, labels) is read from the
 * imported config objects, not from source. The i18n tables do not exist for these plugins (labels are
 * plain English strings), so no per-language labels are tested.
 */

const PLUGINS_DIR = __dirname;
const AWS_CREDENTIAL_KEYS = ["accessKey", "region", "secretKey"];
const DEFAULT_REGION = "us-west-1";
const JSON_INDENT = 4;

type Param = { key: string; type: string; label?: string; rules?: readonly { required?: boolean; message?: string }[]; defaultValue?: unknown; options?: readonly { value: string; label: string }[] };
type Action = { actionName: string; label: string; params: readonly Param[] };

const actionsOf = (config: { actions: readonly unknown[] }) => config.actions as unknown as Action[];
const paramsOf = (config: { params: readonly unknown[] }) => config.params as unknown as Param[];
const source = (plugin: string, file: string) => fs.readFileSync(path.join(PLUGINS_DIR, plugin, file), "utf8");
const keysOf = (action: Action) => action.params.map((p) => p.key).sort();
const actionOf = (actions: Action[], name: string) => {
  const action = actions.find((a) => a.actionName === name);
  if (!action) throw new Error(`no action ${name}`);
  return action;
};

type Sent = { client: string; command: any; input: any; accessKeyId?: string; secretAccessKey?: string; region?: string; endpoint?: { hostname: string; port?: number } };
let sent: Sent[];
const spies: jest.SpyInstance[] = [];
const SENTINEL_NUMBER_BASE = 9001;
const SENTINEL_ENDPOINT_HOST = "sentinel-endpoint.test";
const SENTINEL_ENDPOINT_PORT = 4566;
const SENTINEL_ENDPOINT = `http://${SENTINEL_ENDPOINT_HOST}:${SENTINEL_ENDPOINT_PORT}`;
const SESSION_TOKEN = "session-token";
const QUERY_EXECUTION_ID = "qe-sentinel";
const EMPTY_JSON_BYTES = Uint8Array.from(Buffer.from("{}", "utf8"));
const SUCCEEDED = "SUCCEEDED";

/** generic responses that let every plugin's run finish (GetLatestConfiguration needs JSON bytes, athena a finished execution) */
function respond(command: any) {
  if (command instanceof StartConfigurationSessionCommand) return { InitialConfigurationToken: SESSION_TOKEN };
  if (command instanceof GetLatestConfigurationCommand) return { Configuration: EMPTY_JSON_BYTES };
  if (command instanceof StartQueryExecutionCommand) return { QueryExecutionId: QUERY_EXECUTION_ID };
  if (command instanceof GetQueryExecutionCommand) return { QueryExecution: { Status: { State: SUCCEEDED } } };
  return {};
}

function spyOnClient(clientName: string, proto: { send: unknown }) {
  const spy = jest.spyOn(proto as any, "send").mockImplementation((async function (this: any, command: any) {
    const config = this.config;
    const credentials = await config.credentials();
    const region = await config.region();
    const endpoint = typeof config.endpoint === "function" ? await config.endpoint() : undefined;
    sent.push({ client: clientName, command, input: command.input, accessKeyId: credentials.accessKeyId, secretAccessKey: credentials.secretAccessKey, region, endpoint });
    return respond(command);
  }) as any);
  spies.push(spy);
}

beforeEach(() => {
  sent = [];
  spyOnClient("AppConfigClient", AppConfigClient.prototype);
  spyOnClient("AppConfigDataClient", AppConfigDataClient.prototype);
  spyOnClient("AthenaClient", AthenaClient.prototype);
  spyOnClient("DynamoDBClient", DynamoDBClient.prototype);
  spyOnClient("LambdaClient", LambdaClient.prototype);
  spies.push(jest.spyOn(logger, "info").mockImplementation(() => logger));
});

afterEach(() => {
  while (spies.length) spies.pop()!.mockRestore();
});

/** a value for a declared param: select -> its first option, numberInput -> a unique number, jsonInput -> an object, else a string */
function sentinelFor(action: string, param: Param, index: number): unknown {
  if (param.type === "select") return param.options![0].value;
  if (param.type === "numberInput") return SENTINEL_NUMBER_BASE + index;
  if (param.type === "jsonInput") return { sentinel: `${action}.${param.key}` };
  return `sentinel-${action}-${param.key}`;
}
/** the action object the UI would send: the declared keys only */
function actionFromConfig(action: Action) {
  const values: Record<string, unknown> = {};
  action.params.forEach((p, i) => { values[p.key] = sentinelFor(action.actionName, p, i); });
  return { actionName: action.actionName, ...values };
}
/** true when `value` occurs anywhere in `input`; byte arrays are compared as their UTF-8 text (or its JSON) */
function reaches(input: unknown, value: unknown): boolean {
  if (input instanceof Uint8Array) {
    const text = Buffer.from(input).toString("utf8");
    return text === value || (typeof value === "object" && text === JSON.stringify(value));
  }
  if (input !== null && typeof input === "object") {
    if (JSON.stringify(input) === JSON.stringify(value)) return true;
    return Object.values(input as object).some((v) => reaches(v, value));
  }
  return input === value;
}
const commandNameMatches = (commandName: string, actionName: string) => commandName === actionName || commandName === `${actionName}Command`;
/** runs the plugin's real run for the config-built action and returns what was sent through the SDK boundary */
async function runConfigured(plugin: { run: (a: any, d: any, c: any) => Promise<unknown> }, action: Record<string, unknown>, dataSource: Record<string, unknown>) {
  sent = [];
  await plugin.run(action, dataSource, {});
  return sent;
}
/** like runConfigured, but a rejection is returned instead of thrown, together with the calls recorded before it */
async function runSettled(plugin: { run: (a: any, d: any, c: any) => Promise<unknown> }, action: Record<string, unknown>, dataSource: Record<string, unknown>): Promise<{ calls: Sent[]; error?: unknown }> {
  sent = [];
  try {
    await plugin.run(action, dataSource, {});
  } catch (error) {
    return { calls: sent, error };
  }
  return { calls: sent };
}
const DATA_SOURCE = { accessKey: "AKIASENTINEL", secretKey: "sentinel-secret", region: "sentinel-region-1", s3Location: "s3://sentinel-bucket/out/", endpointUrl: SENTINEL_ENDPOINT, specVersion: "" };

describe("awsConfigs: data source configs", () => {
  test.each([
    ["appconfig", appconfigDataSourceConfig, [...AWS_CREDENTIAL_KEYS]],
    ["athena", athenaDataSourceConfig, [...AWS_CREDENTIAL_KEYS, "s3Location"]],
    ["lambda", lambdaDataSourceConfig, [...AWS_CREDENTIAL_KEYS]],
    ["dynamodb", dynamoDataSourceConfig, [...AWS_CREDENTIAL_KEYS, "endpointUrl", "specVersion"]],
  ])("%s data source offers exactly the expected keys", (_plugin, config, expectedKeys) => {
    expect(paramsOf(config).map((p) => p.key).sort()).toStrictEqual([...expectedKeys].sort());
  });

  /** one implemented action per plugin, run with the data source built from the declared keys only */
  test.each([
    ["appconfig", appconfigPlugin, appconfigDataSourceConfig, appconfigQueryConfig, "ListApplications"],
    ["athena", athenaPlugin, athenaDataSourceConfig, athenaQueryConfig, "Query"],
    ["lambda", lambdaPlugin, lambdaDataSourceConfig, lambdaQueryConfig, "ListFunctions"],
    ["dynamodb", dynamoPlugin, dynamoDataSourceConfig, dynamoQueryConfig, "ListTables"],
  ])("%s: every declared data source key reaches the client the plugin builds (credentials, region, endpoint, result location)", async (_plugin, plugin, dsConfig, queryCfg, actionName) => {
    const action = actionFromConfig(actionOf(actionsOf(queryCfg), actionName));
    const dataSourceKeys = paramsOf(dsConfig).map((p) => p.key);
    const dataSource = Object.fromEntries(dataSourceKeys.map((k) => [k, (DATA_SOURCE as Record<string, string>)[k]]));
    const calls = await runConfigured(plugin as any, action, dataSource);
    expect(calls.length).toBeGreaterThan(0);
    for (const call of calls) {
      expect(call.accessKeyId).toBe(DATA_SOURCE.accessKey);
      expect(call.secretAccessKey).toBe(DATA_SOURCE.secretKey);
      expect(call.region).toBe(DATA_SOURCE.region);
    }
    if (dataSourceKeys.includes("s3Location")) {
      expect(calls[0].input.ResultConfiguration).toStrictEqual({ OutputLocation: DATA_SOURCE.s3Location });
    }
    if (dataSourceKeys.includes("endpointUrl")) {
      expect(calls[0].endpoint).toMatchObject({ hostname: SENTINEL_ENDPOINT_HOST, port: SENTINEL_ENDPOINT_PORT });
    }
  });

  test.each([
    ["appconfig", appconfigDataSourceConfig],
    ["athena", athenaDataSourceConfig],
    ["lambda", lambdaDataSourceConfig],
  ])("%s requires the region and both access keys, defaults the region, and masks the secret", (_plugin, config) => {
    const params = paramsOf(config);
    for (const key of AWS_CREDENTIAL_KEYS) {
      const param = params.find((p) => p.key === key)!;
      expect(param.rules).toEqual([expect.objectContaining({ required: true })]);
    }
    expect(params.find((p) => p.key === "region")!.defaultValue).toBe(DEFAULT_REGION);
    expect(params.find((p) => p.key === "secretKey")!.type).toBe("password");
    expect(params.find((p) => p.key === "accessKey")!.type).toBe("textInput");
  });

});

const resolveDynamoSpec = (specVersion: string) => (dynamoPlugin.queryConfig as (d: unknown) => Promise<unknown>)({ specVersion });

describe("awsConfigs: dynamodb data source", () => {
  test("credentials are masked, region defaults, and the spec version select offers v1.0, the key the plugin resolves to its query config", async () => {
    const params = paramsOf(dynamoDataSourceConfig);
    expect(params.find((p) => p.key === "secretKey")!.type).toBe("password");
    expect(params.find((p) => p.key === "region")!.defaultValue).toBe(DEFAULT_REGION);
    const specVersion = params.find((p) => p.key === "specVersion")!;
    expect(specVersion.type).toBe("select");
    expect(specVersion.options!.map((o) => o.value)).toStrictEqual(["v1.0"]);
    expect(await resolveDynamoSpec("v1.0")).toBe(dynamoQueryConfig);
    expect(await resolveDynamoSpec("")).toBe(dynamoQueryConfig);
    expect(await resolveDynamoSpec("v9")).toBeUndefined();
  });
});

describe("awsConfigs: plugin identity", () => {
  test.each([
    ["appconfig", appconfigPlugin, "AWS AppConfig", "DevOps", "appconfig.svg"],
    ["athena", athenaPlugin, "AWS Athena", "Big Data", "athena.svg"],
    ["lambda", lambdaPlugin, "AWS Lambda", "App Development", "lambda.svg"],
    ["dynamodb", dynamoPlugin, "DynamoDB", "database", "dynamodb.svg"],
  ])("%s has id, name, category and icon", (id, plugin, name, category, icon) => {
    expect(plugin).toMatchObject({ id, name, category, icon });
  });
});

/** every action of every config has a string actionName, a string label and a params array whose entries have key, type, label */
describe("awsConfigs: action shape", () => {
  test.each([
    ["appconfig", appconfigQueryConfig],
    ["athena", athenaQueryConfig],
    ["lambda", lambdaQueryConfig],
    ["dynamodb", dynamoQueryConfig],
  ])("%s: every action has a string actionName and label and a params array of keyed, typed, labelled entries", (_plugin, config) => {
    const actions = actionsOf(config);
    expect(actions.length).toBeGreaterThan(0);
    for (const action of actions) {
      expect(action).toMatchObject({ actionName: expect.any(String), label: expect.any(String), params: expect.any(Array) });
      expect(action.actionName).not.toBe("");
      expect(action.label).not.toBe("");
      for (const param of action.params) {
        expect(param).toMatchObject({ key: expect.any(String), type: expect.any(String), label: expect.any(String) });
      }
    }
    expect(new Set(actions.map((a) => a.actionName)).size).toBe(actions.length);
  });
});

describe("awsConfigs: dynamodb", () => {
  const actions = actionsOf(dynamoQueryConfig);
  const runSource = source("dynamodb", "run.ts");
  const commandMapBody = runSource.slice(runSource.indexOf("const commandMap"), runSource.indexOf("};", runSource.indexOf("const commandMap")));
  const commandMapKeys = [...commandMapBody.matchAll(/^\s+(\w+):\s*\w+Command,/gm)].map((m) => m[1]);
  const TABLE_ACTIONS = ["DeleteItem", "GetItem", "PutItem", "Query", "Scan", "UpdateItem"];
  const TABLE_SENTINEL = "sentinel-table";
  const defaultsOf = (action: Action) => JSON.parse(action.params.find((p) => p.key === "params")!.defaultValue as string);
  const OFFERED = ["CreateTable", "DeleteItem", "GetItem", "ListTables", "PutItem", "Query", "Scan", "UpdateItem"];

  test("the offered actions are the expected eight", () => {
    expect(actions.map((a) => a.actionName).sort()).toStrictEqual(OFFERED);
  });

  test("TEXTUAL (residual risk, see header): the commandMap in run.ts has exactly the offered action names", () => {
    expect([...commandMapKeys].sort()).toStrictEqual(OFFERED);
  });

  test.each(OFFERED)("%s: run sends the matching SDK command, with the table name and every default param key the config offers", async (name) => {
    const action = actionOf(actions, name);
    const declared = keysOf(action);
    expect(declared).toStrictEqual(TABLE_ACTIONS.includes(name) ? ["params", "tableName"] : ["params"]);
    const actionObject = { actionName: name, params: defaultsOf(action), ...(declared.includes("tableName") ? { tableName: TABLE_SENTINEL } : {}) };
    const calls = await runConfigured(dynamoPlugin as any, actionObject, DATA_SOURCE);
    expect(calls).toHaveLength(1);
    expect(calls[0].command.constructor.name).toBe(`${name}Command`);
    for (const key of Object.keys(defaultsOf(action))) {
      expect(Object.keys(calls[0].input)).toContain(key);
    }
    if (declared.includes("tableName")) {
      expect(calls[0].input.TableName).toBe(TABLE_SENTINEL);
    }
  });

  test("the params field is a jsonInput whose default value is 4-space pretty-printed JSON", () => {
    for (const action of actions) {
      const param = action.params.find((p) => p.key === "params")!;
      expect(param.type).toBe("jsonInput");
      expect(param.label).toBe("Parameters");
      const text = param.defaultValue as string;
      expect(JSON.stringify(JSON.parse(text), null, JSON_INDENT)).toBe(text);
    }
  });

  test("the default params carry the key that run.ts wraps for that action", () => {
    const defaults = (name: string) => defaultsOf(actionOf(actions, name));
    expect(Object.keys(defaults("PutItem"))).toStrictEqual(["Item"]);
    expect(Object.keys(defaults("GetItem"))).toStrictEqual(["Key"]);
    expect(Object.keys(defaults("DeleteItem"))).toStrictEqual(["Key"]);
    expect(Object.keys(defaults("UpdateItem")).sort()).toStrictEqual(["ExpressionAttributeValues", "Key", "UpdateExpression"]);
    expect(defaults("CreateTable").TableName).toBe("users");
    expect(defaults("ListTables")).toStrictEqual({ Limit: 10 });
  });

  test("the table name field is a textInput keyed tableName", () => {
    const param = actionOf(actions, "Scan").params.find((p) => p.key === "tableName")!;
    expect(param).toMatchObject({ type: "textInput", label: "Table" });
  });
});

describe("awsConfigs: appconfig", () => {
  const actions = actionsOf(appconfigQueryConfig);
  const NO_PARAM_SENTINEL_ACTION = "GetLatestConfiguration";
  const UNREAD_PARAM = "ConfigurationToken";
  const IMPLEMENTED_COUNT = 21;
  const UNIMPLEMENTED_COUNT = 0;

  /** runs every action with its declared params and records which ones sent a command, and which params did not reach it */
  async function probe() {
    const implemented: string[] = [];
    const notReached: string[] = [];
    const unimplemented: Action[] = [];
    const silent: string[] = [];
    for (const action of actions) {
      const actionObject = actionFromConfig(action) as Record<string, unknown>;
      const { calls, error } = await runSettled(appconfigPlugin as any, actionObject, DATA_SOURCE);
      if (error !== undefined) {
        const notSupported = error instanceof ServiceError && error.code === 400 && error.message === `AppConfig action "${action.actionName}" is not supported`;
        if (!notSupported || calls.length !== 0) throw error;
        unimplemented.push(action);
        continue;
      }
      if (calls.length === 0) {
        silent.push(action.actionName);
        continue;
      }
      const matching = calls.filter((c) => commandNameMatches(c.command.constructor.name, action.actionName));
      expect(matching.length).toBeGreaterThan(0);
      implemented.push(action.actionName);
      for (const param of action.params) {
        if (!calls.some((c) => reaches(c.input, actionObject[param.key]))) notReached.push(`${action.actionName}.${param.key}`);
      }
    }
    return { implemented, notReached, unimplemented, silent };
  }

  test("every implemented action sends its matching SDK command, and every param its config declares reaches the command input, except the session token of GetLatestConfiguration", async () => {
    const { implemented, notReached, silent } = await probe();
    expect(implemented).toHaveLength(IMPLEMENTED_COUNT);
    expect(silent).toStrictEqual([]);
    expect(notReached).toStrictEqual([`${NO_PARAM_SENTINEL_ACTION}.${UNREAD_PARAM}`]);
  });

  test("GetLatestConfiguration ignores the ConfigurationToken param: it passes the token of the session it started", async () => {
    const action = actionOf(actions, NO_PARAM_SENTINEL_ACTION);
    const calls = await runConfigured(appconfigPlugin as any, actionFromConfig(action), DATA_SOURCE);
    const latest = calls.find((c) => c.command instanceof GetLatestConfigurationCommand)!;
    expect(latest.input).toStrictEqual({ ConfigurationToken: SESSION_TOKEN });
  });

  test("every offered action is implemented; none rejects as unsupported", async () => {
    const { unimplemented, silent } = await probe();
    expect(unimplemented).toStrictEqual([]);
    expect(silent).toStrictEqual([]);
    expect(unimplemented).toHaveLength(UNIMPLEMENTED_COUNT);
    expect(IMPLEMENTED_COUNT).toBe(actions.length);
  });

  test("an action name the UI does not offer is rejected with 400 and sends nothing", async () => {
    const { calls, error } = await runSettled(appconfigPlugin as any, { actionName: "NotAnAction" }, DATA_SOURCE);
    expect(error).toBeInstanceOf(ServiceError);
    expect(error).toMatchObject({ code: 400, message: 'AppConfig action "NotAnAction" is not supported' });
    expect(calls).toHaveLength(0);
  });

  test("TEXTUAL (residual risk, see header): the case labels in index.ts are exactly the offered action names", () => {
    const indexSource = source("appconfig", "index.ts");
    const caseNames = [...indexSource.matchAll(/^\s+case "([^"]+)":/gm)].map((m) => m[1]);
    expect([...caseNames].sort()).toStrictEqual(actions.map((a) => a.actionName).sort());
  });

  test("the GrowthType and ReplicateTo options are enum names that index.ts maps (observed: they reach the command as the SDK enum values)", async () => {
    const strategy = actionOf(actions, "CreateDeploymentStrategyCommand");
    const growth = strategy.params.find((p) => p.key === "GrowthType")!.options!.map((o) => o.value).sort();
    const replicate = strategy.params.find((p) => p.key === "ReplicateTo")!.options!.map((o) => o.value).sort();
    expect(growth).toStrictEqual(["EXPONENTIAL", "LINEAR"]);
    expect(replicate).toStrictEqual(["NONE", "SSM_DOCUMENT"]);
    for (const value of growth) {
      const calls = await runConfigured(appconfigPlugin as any, { ...actionFromConfig(strategy), GrowthType: value }, DATA_SOURCE);
      expect(calls[0].input.GrowthType).toBe(value);
    }
    for (const value of replicate) {
      const calls = await runConfigured(appconfigPlugin as any, { ...actionFromConfig(strategy), ReplicateTo: value }, DATA_SOURCE);
      expect(calls[0].input.ReplicateTo).toBe(value);
    }
  });
});

describe("awsConfigs: athena and lambda", () => {
  test("athena: the Query action's declared params reach StartQueryExecution; another action name sends nothing", async () => {
    const actions = actionsOf(athenaQueryConfig);
    expect(actions.map((a) => a.actionName)).toStrictEqual(["Query"]);
    expect(keysOf(actions[0])).toStrictEqual(["queryString"]);
    expect(actions[0].params[0].type).toBe("sqlInput");
    const actionObject = actionFromConfig(actions[0]) as Record<string, unknown>;
    const calls = await runConfigured(athenaPlugin as any, actionObject, DATA_SOURCE);
    expect(calls[0].command).toBeInstanceOf(StartQueryExecutionCommand);
    expect(calls[0].input.QueryString).toBe(actionObject.queryString);
    expect(await runConfigured(athenaPlugin as any, { actionName: "NotAnAction" }, DATA_SOURCE)).toHaveLength(0);
  });

  test.each([
    ["InvokeFunction", ["functionName", "invocationType", "payload"], "InvokeCommand", InvokeCommand],
    ["ListFunctions", ["limit", "marker"], "ListFunctionsCommand", ListFunctionsCommand],
  ])("lambda %s: declares %j, and every declared param reaches the %s input", async (name, keys, _commandName, commandClass) => {
    const actions = actionsOf(lambdaQueryConfig);
    expect(actions.map((a) => a.actionName).sort()).toStrictEqual(["InvokeFunction", "ListFunctions"]);
    const action = actionOf(actions, name);
    expect(keysOf(action)).toStrictEqual([...keys].sort());
    const actionObject = actionFromConfig(action) as Record<string, unknown>;
    const calls = await runConfigured(lambdaPlugin as any, actionObject, DATA_SOURCE);
    expect(calls).toHaveLength(1);
    expect(calls[0].command).toBeInstanceOf(commandClass);
    for (const key of keys) expect(reaches(calls[0].input, actionObject[key])).toBe(true);
  });

  test("lambda: another action name sends nothing", async () => {
    expect(await runConfigured(lambdaPlugin as any, { actionName: "NotAnAction" }, DATA_SOURCE)).toHaveLength(0);
  });

  test("lambda: the invocation type options are the three SDK invocation types, with a JSON payload and numeric limit", () => {
    const actions = actionsOf(lambdaQueryConfig);
    const invoke = actionOf(actions, "InvokeFunction");
    expect(invoke.params.find((p) => p.key === "invocationType")!.options!.map((o) => o.value)).toStrictEqual(["RequestResponse", "Event", "DryRun"]);
    expect(invoke.params.find((p) => p.key === "payload")).toMatchObject({ type: "jsonInput", defaultValue: "{}" });
    expect(actionOf(actions, "ListFunctions").params.find((p) => p.key === "limit")).toMatchObject({ type: "numberInput", defaultValue: 50 });
  });
});
