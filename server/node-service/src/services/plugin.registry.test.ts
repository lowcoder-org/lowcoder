import plugins from "../plugins";
import { ServiceError } from "../common/error";
import {
  evalCodeToValue,
  evalToValue,
  getDynamicConfigDef,
  getPlugin,
  listPlugins,
  runPluginQuery,
} from "./plugin";

// The one stated exception to the process-boundary rule: the plugin LIST, the default
// export of plugins/index.ts, is replaced by test-defined plugins. It is data; the service logic under test
// (services/plugin.ts) runs for real. The factory only creates the empty array; each test fills it.
jest.mock("../plugins", () => ({ __esModule: true, default: [] }));

const BAD_REQUEST = 400;
const SERVER_ERROR = 500;
const CTX = { languages: ["en"] };
const STATIC_ID = "static-fake";
const FACTORY_ID = "factory-fake";
const registry = plugins as unknown as any[];

async function expectServiceError(promise: Promise<unknown>, code: number, message: string | RegExp) {
  const err = await promise.then(
    (v) => {
      throw new Error(`expected rejection, got ${JSON.stringify(v)}`);
    },
    (e) => e
  );
  expect(err).toBeInstanceOf(ServiceError);
  expect(err.code).toBe(code);
  if (typeof message === "string") expect(err.message).toBe(message);
  else expect(err.message).toMatch(message);
}

const textParams = [
  { key: "path", type: "textInput", label: "path" },
  { key: "limit", type: "numberInput", label: "limit" },
] as const;

function queryConfigOf(params: readonly any[] = textParams) {
  return { type: "query", actions: [{ actionName: "go", label: "Go", params }] };
}

const runMock = jest.fn();

function makeStaticPlugin(overrides: Record<string, any> = {}) {
  return {
    id: STATIC_ID,
    name: "Static fake",
    category: "api",
    dataSourceConfig: { type: "dataSource", params: [{ key: "host", type: "textInput", label: "host" }] },
    queryConfig: queryConfigOf(),
    run: runMock,
    ...overrides,
  };
}

function makeFactoryPlugin(ctx: { languages: string[] }) {
  return {
    id: FACTORY_ID,
    name: `Factory fake (${ctx.languages.join(",")})`,
    category: "api",
    dataSourceConfig: { type: "dataSource", params: [] },
    queryConfig: queryConfigOf(),
    run: runMock,
    validateDataSourceConfig: async () => ({ success: true }),
  };
}

function setRegistry(...items: any[]) {
  registry.splice(0, registry.length, ...items);
}

beforeEach(() => {
  runMock.mockReset();
  runMock.mockResolvedValue({ ok: true });
  setRegistry(makeStaticPlugin(), makeFactoryPlugin);
});

afterEach(() => {
  setRegistry();
});

describe("evalCodeToValue", () => {
  test.each([
    ["an empty string", ""],
    ["undefined", undefined],
    ["null", null],
  ])("%s gives undefined", (_n, dsl) => {
    expect(evalCodeToValue(dsl as any, [])).toBeUndefined();
  });

  test("a non-string dsl (an object) is returned as is", () => {
    const dsl = { already: "value" };

    expect(evalCodeToValue(dsl as any, [{ key: "already", value: 1 }])).toBe(dsl);
  });
});

describe("evalToValue", () => {
  test("an action name not in the config gives 400 naming the action", async () => {
    await expectServiceError(
      evalToValue(queryConfigOf() as any, { actionName: "x", action: {} }, [], {}),
      BAD_REQUEST,
      "invalid query dsl, the action name x not defined in plugin"
    );
  });

  test("a query evaluates the selected action's params", async () => {
    const value = await evalToValue(
      queryConfigOf() as any,
      { actionName: "go", action: { path: "{{p}}", limit: "{{n}}" } },
      [
        { key: "p", value: "/x" },
        { key: "n", value: 3 },
      ],
      {}
    );

    expect(value).toEqual({ actionName: "go", path: "/x", limit: 3 });
  });

  test("an array config evaluates each item from the dsl key", async () => {
    const value = await evalToValue(
      [
        { key: "a", type: "textInput", label: "a" },
        { key: "b", type: "booleanInput", label: "b" },
      ] as any,
      { a: "{{x}}", b: "false" },
      [{ key: "x", value: "ex" }],
      {}
    );

    expect(value).toEqual({ a: "ex", b: false });
  });

  describe("keyValueInput", () => {
    const cfg = (valueType?: string) => ({ key: "h", type: "keyValueInput", label: "h", valueType } as any);

    test("a non-array dsl gives []", async () => {
      await expect(evalToValue(cfg(), "not-an-array", [], {})).resolves.toEqual([]);
      await expect(evalToValue(cfg(), undefined, [], {})).resolves.toEqual([]);
    });

    test("keys and values are evaluated as strings by default", async () => {
      const value = await evalToValue(
        cfg(),
        [{ key: "k-{{i}}", value: "{{v}}" }],
        [
          { key: "i", value: 1 },
          { key: "v", value: "val" },
        ],
        {}
      );

      expect(value).toEqual([{ key: "k-1", value: "val" }]);
    });

    test('valueType "json" parses the value as JSON while the key stays a string', async () => {
      const value = await evalToValue(cfg("json"), [{ key: "k", value: "{a: {{n}}}" }], [{ key: "n", value: 4 }], {});

      expect(value).toEqual([{ key: "k", value: { a: 4 } }]);
    });
  });

  test.each([
    ["booleanInput", "0", false],
    ["booleanInput", "false", false],
    ["booleanInput", "yes", true],
    ["switch", "true", true],
    ["switch", "false", false],
    ["checkbox", "x", true],
    ["checkbox", "", false],
  ])("%s with %j goes through toBoolean: %s", async (type, dsl, expected) => {
    await expect(evalToValue({ key: "k", type, label: "k" } as any, dsl, [], {})).resolves.toBe(expected);
  });

  test.each(["jsonInput", "file"])("%s is parsed as JSON", async (type) => {
    const value = await evalToValue({ key: "k", type, label: "k" } as any, "{a: {{v}}}", [{ key: "v", value: 2 }], {});

    expect(value).toEqual({ a: 2 });
  });

  test("an unknown config type gives a 500 ServiceError mentioning the type", async () => {
    await expectServiceError(
      evalToValue({ key: "k", type: "weirdInput", label: "k" } as any, "x", [], {}),
      SERVER_ERROR,
      "invalid plugin definition, unknown config type: weirdInput"
    );
  });

  test("a dynamic (function) config is awaited with the data-source data", async () => {
    const dynamic = jest.fn(async (ds: any) => ({ key: "k", type: "textInput", label: `label-${ds.tenant}` }));

    const value = await evalToValue(dynamic as any, "{{x}}", [{ key: "x", value: "v" }], { tenant: "t1" });

    expect(dynamic).toHaveBeenCalledWith({ tenant: "t1" });
    expect(value).toBe("v");
  });
});

describe("getPlugin", () => {
  test("finds a static plugin by id", () => {
    expect(getPlugin(STATIC_ID, CTX).name).toBe("Static fake");
  });

  test("finds a factory plugin by id and passes the context to the factory", () => {
    expect(getPlugin(FACTORY_ID, { languages: ["de", "en"] }).name).toBe("Factory fake (de,en)");
  });

  test("an unknown id gives 400 plugin not found", () => {
    expect(() => getPlugin("missing", CTX)).toThrow(
      expect.objectContaining({ code: BAD_REQUEST, message: "plugin not found: missing" })
    );
  });
});

describe("listPlugins", () => {
  test("filters by id and keeps only the listed plugins", () => {
    expect(listPlugins(CTX, [FACTORY_ID]).map((p) => p.id)).toEqual([FACTORY_ID]);
    expect(listPlugins(CTX, ["missing"])).toEqual([]);
    expect(listPlugins(CTX).map((p) => p.id)).toEqual([STATIC_ID, FACTORY_ID]);
  });

  test("run and validateDataSourceConfig are removed and shouldValidateDataSourceConfig reflects validation", () => {
    const [staticMeta, factoryMeta] = listPlugins(CTX) as any[];

    expect(staticMeta.run).toBeUndefined();
    expect(factoryMeta.run).toBeUndefined();
    expect(factoryMeta.validateDataSourceConfig).toBeUndefined();
    expect(staticMeta.shouldValidateDataSourceConfig).toBe(false);
    expect(factoryMeta.shouldValidateDataSourceConfig).toBe(true);
  });

  test("a function queryConfig becomes {type: 'dynamic'}, a static one is kept", () => {
    setRegistry(makeStaticPlugin({ queryConfig: async () => queryConfigOf() }), makeFactoryPlugin);

    const [dynamicMeta, staticMeta] = listPlugins(CTX) as any[];

    expect(dynamicMeta.queryConfig).toEqual({ type: "dynamic" });
    expect(staticMeta.queryConfig).toEqual(queryConfigOf());
  });

  test("a function dataSourceConfig.extra becomes {type: 'dynamic'}", () => {
    const extra = async () => ({ type: "textInput", key: "e", label: "e" });
    setRegistry(
      makeStaticPlugin({
        dataSourceConfig: { type: "dataSource", params: [], extra },
      })
    );

    const [meta] = listPlugins(CTX) as any[];

    expect(meta.dataSourceConfig.extra).toEqual({ type: "dynamic" });
  });

  test("a static dataSourceConfig.extra is kept as is", () => {
    const extra = { type: "textInput", key: "e", label: "e" };
    setRegistry(makeStaticPlugin({ dataSourceConfig: { type: "dataSource", params: [], extra } }));

    const [meta] = listPlugins(CTX) as any[];

    expect(meta.dataSourceConfig.extra).toEqual(extra);
  });

  test("the result is a deep clone: mutating it does not change the registry", () => {
    const original: any = makeStaticPlugin({
      queryConfig: async () => queryConfigOf(),
      validateDataSourceConfig: async () => ({ success: true }),
    });
    setRegistry(original);

    const [meta] = listPlugins(CTX) as any[];
    meta.dataSourceConfig.params.push({ key: "extra", type: "textInput", label: "extra" });
    meta.name = "changed";

    expect(original.dataSourceConfig.params).toHaveLength(1);
    expect(original.name).toBe("Static fake");
    // the meta operations replaced these on the clone only
    expect(typeof original.queryConfig).toBe("function");
    expect(typeof original.run).toBe("function");
    expect(typeof original.validateDataSourceConfig).toBe("function");
  });
});

describe("runPluginQuery", () => {
  const dsl = { actionName: "go", action: { path: "{{p}}", limit: "2" } };
  const ctx = [{ key: "p", value: "/x" }];

  test("passes the evaluated action, the data-source config and the plugin context to run", async () => {
    const ds = { host: "h" };

    const ret = await runPluginQuery(STATIC_ID, dsl, ctx, ds, CTX);

    expect(runMock).toHaveBeenCalledTimes(1);
    expect(runMock).toHaveBeenCalledWith({ actionName: "go", path: "/x", limit: 2 }, { host: "h" }, CTX);
    expect(ret).toEqual({ result: { ok: true } });
  });

  test("a function queryConfig is called with the data-source config", async () => {
    const queryConfig = jest.fn(async () => queryConfigOf());
    setRegistry(makeStaticPlugin({ queryConfig }));
    const ds = { host: "h" };

    await runPluginQuery(STATIC_ID, dsl, ctx, ds, CTX);

    expect(queryConfig).toHaveBeenCalledWith({ host: "h" });
    expect(runMock.mock.calls[0][0]).toEqual({ actionName: "go", path: "/x", limit: 2 });
  });

  test("an omitted data-source config reaches a function queryConfig as {}", async () => {
    const queryConfig = jest.fn(async () => queryConfigOf());
    setRegistry(makeStaticPlugin({ queryConfig }));

    await runPluginQuery(STATIC_ID, dsl, ctx, undefined, CTX);

    expect(queryConfig).toHaveBeenCalledWith({});
    expect(runMock.mock.calls[0][1]).toEqual({});
  });

  test("the context key OAUTH_ACCESS_TOKEN is copied into the data-source config", async () => {
    await runPluginQuery(STATIC_ID, dsl, [...ctx, { key: "OAUTH_ACCESS_TOKEN", value: "tok" }], { host: "h" }, CTX);

    expect(runMock.mock.calls[0][1]).toEqual({ host: "h", OAUTH_ACCESS_TOKEN: "tok" });
  });

  test("a context key present in dynamicParamsConfig writes <key>.value from value[0].value", async () => {
    const ds = { dynamicParamsConfig: { token: { kind: "x" }, other: {} } };

    await runPluginQuery(STATIC_ID, dsl, [...ctx, { key: "token", value: [{ value: "v1" }] }], ds, CTX);

    expect(runMock.mock.calls[0][1].dynamicParamsConfig).toEqual({
      token: { kind: "x" },
      other: {},
      "token.value": "v1",
    });
  });

  test("a context key absent from dynamicParamsConfig writes nothing", async () => {
    const ds = { dynamicParamsConfig: { token: {} } };

    await runPluginQuery(STATIC_ID, dsl, [...ctx, { key: "unrelated", value: [{ value: "v" }] }], ds, CTX);

    expect(runMock.mock.calls[0][1].dynamicParamsConfig).toEqual({ token: {} });
  });

  test("OAUTH_ACCESS_TOKEN wins over dynamicParamsConfig for the same key", async () => {
    const ds = { dynamicParamsConfig: { OAUTH_ACCESS_TOKEN: {} } };

    await runPluginQuery(STATIC_ID, dsl, [{ key: "OAUTH_ACCESS_TOKEN", value: "tok" }], ds, CTX);

    const passed = runMock.mock.calls[0][1];
    expect(passed.OAUTH_ACCESS_TOKEN).toBe("tok");
    expect(passed.dynamicParamsConfig).toEqual({ OAUTH_ACCESS_TOKEN: {} });
  });

  test.each([
    ["undefined", undefined],
    ["null", null],
    ["0", 0],
    ["the empty string", ""],
  ])("a falsy run result (%s) becomes {result: {}}", async (_n, falsy) => {
    runMock.mockResolvedValue(falsy);

    await expect(runPluginQuery(STATIC_ID, dsl, ctx, {}, CTX)).resolves.toEqual({ result: {} });
  });

  test("a truthy run result is returned under result", async () => {
    runMock.mockResolvedValue([1, 2]);

    await expect(runPluginQuery(STATIC_ID, dsl, ctx, {}, CTX)).resolves.toEqual({ result: [1, 2] });
  });

  test("an unknown plugin gives 400 and run is not called", async () => {
    await expectServiceError(runPluginQuery("missing", dsl, ctx, {}, CTX), BAD_REQUEST, "plugin not found: missing");
    expect(runMock).not.toHaveBeenCalled();
  });
});

// Only the forwarded-cookie shape ([{ name, value }, ...]) is copied into dynamicParamsConfig;
// a context value of any other shape is ignored instead of throwing a TypeError.
describe("B22: a context value without the cookie shape", () => {
  const dslB22 = { actionName: "go", action: { path: "p", limit: "1" } };
  const TOKEN_KEY = "token";
  const TOKEN_VALUE_KEY = "token.value";

  test.each([
    ["null", null],
    ["undefined", undefined],
    ["an empty array", []],
    ["an array holding null", [null]],
    ["an array holding a string", ["s"]],
    ["a string", "abc"],
    ["a number", 5],
    ["a plain object", { value: "v1" }],
  ])("B22: a context value without the cookie shape is ignored (%s)", async (_label, value) => {
    const ds = { dynamicParamsConfig: { [TOKEN_KEY]: {} } };

    await expect(
      runPluginQuery(STATIC_ID, dslB22, [{ key: TOKEN_KEY, value }], ds, CTX)
    ).resolves.toEqual({ result: { ok: true } });

    expect(runMock).toHaveBeenCalledTimes(1);
    // not toHaveProperty("token.value"): jest reads a dotted string as a path
    expect(Object.keys(runMock.mock.calls[0][1].dynamicParamsConfig)).toEqual([TOKEN_KEY]);
  });

  test("B22: of several forwarded cookies the first value is used", async () => {
    const ds = { dynamicParamsConfig: { [TOKEN_KEY]: {} } };
    const value = [
      { name: TOKEN_KEY, value: "a" },
      { name: TOKEN_KEY, value: "b" },
    ];

    await runPluginQuery(STATIC_ID, dslB22, [{ key: TOKEN_KEY, value }], ds, CTX);

    expect(runMock.mock.calls[0][1].dynamicParamsConfig[TOKEN_VALUE_KEY]).toBe("a");
  });

  test("B22: a non-array dynamicParamsConfig value is not a TypeError", async () => {
    const ds = { dynamicParamsConfig: { token: {} } };
    let error: unknown;
    try {
      await runPluginQuery(
        STATIC_ID,
        { actionName: "go", action: { path: "p", limit: "1" } },
        [{ key: "token", value: { value: "v1" } }],
        ds,
        CTX
      );
    } catch (e) {
      error = e;
    }

    expect(error).not.toBeInstanceOf(TypeError);
  });
});

describe("getDynamicConfigDef", () => {
  test("zero matches gives 400 No field found with path and id", async () => {
    await expectServiceError(
      getDynamicConfigDef(STATIC_ID, "$.nothing", {}, CTX),
      BAD_REQUEST,
      `No field found with path $.nothing and id ${STATIC_ID}`
    );
  });

  test("two matches give 400 More than one fields", async () => {
    setRegistry(
      makeStaticPlugin({
        dataSourceConfig: {
          type: "dataSource",
          params: [
            { key: "a", type: "textInput", label: "a" },
            { key: "b", type: "textInput", label: "b" },
          ],
        },
      })
    );
    const path = "$.dataSourceConfig.params[*]";

    await expectServiceError(
      getDynamicConfigDef(STATIC_ID, path, {}, CTX),
      BAD_REQUEST,
      `More than one fields found with path ${path} and id ${STATIC_ID}`
    );
  });

  test("a non-function target gives 400 Target field is not a dynamic config", async () => {
    await expectServiceError(
      getDynamicConfigDef(STATIC_ID, "$.name", {}, CTX),
      BAD_REQUEST,
      "Target field is not a dynamic config"
    );
  });

  test("a function target is called with the data-source config and its result returned", async () => {
    const dynamic = jest.fn(async (ds: any) => ({ key: "k", type: "textInput", label: `for-${ds.tenant}` }));
    setRegistry(makeStaticPlugin({ queryConfig: dynamic }));

    const def = await getDynamicConfigDef(STATIC_ID, "$.queryConfig", { tenant: "t9" }, CTX);

    expect(dynamic).toHaveBeenCalledWith({ tenant: "t9" });
    expect(def).toEqual({ key: "k", type: "textInput", label: "for-t9" });
  });

  test("an unknown plugin id gives 400 plugin not found", async () => {
    await expectServiceError(getDynamicConfigDef("missing", "$.queryConfig", {}, CTX), BAD_REQUEST, "plugin not found: missing");
  });
});
