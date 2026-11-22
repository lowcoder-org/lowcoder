import { createCipheriv, pbkdf2Sync } from "crypto";

// The stated exception to the process-boundary rule: the plugin
// LIST, the default export of plugins/index.ts, is replaced by test-defined plugins, exactly as in
// services/plugin.registry.test.ts. It is data; the controller and services/plugin.ts run for real. The
// factory only creates the empty array; beforeEach fills it and afterEach empties it.
jest.mock("../plugins", () => ({ __esModule: true, default: [] }));

type ControllerModule = typeof import("./plugins");
type ServiceErrorClass = typeof import("../common/error").ServiceError;

// Encryption vector: built with Node's createCipheriv from Spring's documented Encryptors.text scheme
// (same, weaker, provenance as utils/encryption.test.ts). utils/encryption.ts captures the
// secret and salt env vars at module load, so beforeAll clears them and loads the modules afresh; the
// default secret and salt then apply whatever the ambient environment holds. afterAll restores the env.
const ENV_SECRET = "LOWCODER_NODE_SERVICE_SECRET";
const ENV_SALT = "LOWCODER_NODE_SERVICE_SECRET_SALT";
const DEFAULT_PASSWORD = "lowcoderpwd";
const DEFAULT_SALT = "lowcodersalt";
const FIXED_IV = Buffer.from("000102030405060708090a0b0c0d0e0f", "hex");
const STATUS_OK = 200;
const BAD_REQUEST = 400;
const ENCRYPTED_HEADER = { "x-encrypted": "true" };
const MISSING_BODY_MESSAGE = "Missing encrypted body";
const DECRYPT_FAILED_MESSAGE = "Failed to decrypt string";
const PARSE_FAILED_MESSAGE = "Failed to parse decrypted body as JSON";
const FAKE_ID = "fake-ctrl-plugin";
const FAKE_DYNAMIC_ID = "fake-ctrl-dynamic-plugin";
const REQUEST_LANGUAGES = ["xx", "en"];

function encryptLikeSpring(plaintext: string): string {
  const key = pbkdf2Sync(DEFAULT_PASSWORD, Buffer.from(DEFAULT_SALT, "utf8"), 1024, 32, "sha1");
  const cipher = createCipheriv("aes-256-cbc", key, FIXED_IV);
  const body = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return Buffer.concat([FIXED_IV, body]).toString("hex");
}

const run = jest.fn(async (action: any, dataSourceConfig: any) => ({ action, dataSourceConfig }));
const validateDataSourceConfig = jest.fn(async (cfg: any, _ctx?: any) => ({ success: true, seen: cfg }));
const dynamicQueryConfig = jest.fn(async (cfg: any) => ({
  type: "textInput" as const,
  key: "dyn",
  label: `for-${cfg?.name}`,
}));

const fakePlugin = {
  id: FAKE_ID,
  name: "Fake controller plugin",
  category: "api",
  dataSourceConfig: { type: "dataSource", params: [] },
  queryConfig: {
    type: "query",
    actions: [
      {
        actionName: "go",
        label: "Go",
        params: [
          { key: "path", type: "textInput", label: "path" },
          { key: "limit", type: "numberInput", label: "limit" },
        ],
      },
    ],
  },
  run,
  validateDataSourceConfig,
};

const fakeDynamicPlugin = {
  id: FAKE_DYNAMIC_ID,
  name: "Fake dynamic plugin",
  category: "api",
  dataSourceConfig: { type: "dataSource", params: [] },
  queryConfig: dynamicQueryConfig,
  run: async () => undefined,
};

const addedPlugins = [fakePlugin, fakeDynamicPlugin];
let registry: any[];
let ServiceError: ServiceErrorClass;
let getDynamicDef: ControllerModule["getDynamicDef"];
let listPlugins: ControllerModule["listPlugins"];
let runPluginQuery: ControllerModule["runPluginQuery"];
let validatePluginDataSourceConfig: ControllerModule["validatePluginDataSourceConfig"];

const ORIGINAL_ENV = { ...process.env };

beforeAll(() => {
  delete process.env[ENV_SECRET];
  delete process.env[ENV_SALT];
  jest.isolateModules(() => {
    /* eslint-disable @typescript-eslint/no-var-requires */
    registry = require("../plugins").default;
    ServiceError = require("../common/error").ServiceError;
    ({ getDynamicDef, listPlugins, runPluginQuery, validatePluginDataSourceConfig } = require("./plugins"));
    /* eslint-enable @typescript-eslint/no-var-requires */
  });
});

afterAll(() => {
  for (const k of [ENV_SECRET, ENV_SALT]) {
    if (k in ORIGINAL_ENV) process.env[k] = ORIGINAL_ENV[k];
    else delete process.env[k];
  }
});

type RecordedResponse = { statusCode?: number; body?: any; status: jest.Mock; json: jest.Mock };

function makeRes(): RecordedResponse {
  const res: RecordedResponse = {
    status: jest.fn((code: number) => {
      res.statusCode = code;
      return res;
    }),
    json: jest.fn((body: any) => {
      res.body = body;
      return res;
    }),
  };
  return res;
}

function makeReq(opts: { body?: any; headers?: Record<string, string>; query?: Record<string, any> } = {}): any {
  return {
    body: opts.body,
    headers: opts.headers ?? {},
    query: opts.query ?? {},
    acceptsLanguages: () => REQUEST_LANGUAGES,
  };
}

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

beforeEach(() => {
  registry.push(...addedPlugins);
});

afterEach(() => {
  registry.splice(0, registry.length);
  jest.clearAllMocks();
});

const queryBody = (extra: Record<string, any> = {}) => ({
  pluginName: FAKE_ID,
  dsl: { actionName: "go", action: { path: "/a/{{id}}", limit: "{{n}}" } },
  context: [
    { key: "id", value: "7" },
    { key: "n", value: 5 },
  ],
  dataSourceConfig: { host: "h" },
  ...extra,
});

describe("getDecryptedBody via runPluginQuery", () => {
  test("without x-encrypted the body is used as is", async () => {
    const res = makeRes();

    await runPluginQuery(makeReq({ body: queryBody() }), res as any);

    expect(res.statusCode).toBe(STATUS_OK);
    expect(run).toHaveBeenCalledTimes(1);
  });

  test("an encrypted string body is decrypted and parsed", async () => {
    const res = makeRes();
    const body = encryptLikeSpring(JSON.stringify(queryBody()));

    await runPluginQuery(makeReq({ body, headers: ENCRYPTED_HEADER }), res as any);

    expect(res.statusCode).toBe(STATUS_OK);
    expect(res.body.result.action).toEqual({ actionName: "go", path: "/a/7", limit: 5 });
  });

  test("a Buffer body goes through toString before decryption", async () => {
    const res = makeRes();
    const body = Buffer.from(encryptLikeSpring(JSON.stringify(queryBody())), "utf8");

    await runPluginQuery(makeReq({ body, headers: ENCRYPTED_HEADER }), res as any);

    expect(res.statusCode).toBe(STATUS_OK);
    expect(res.body.result.dataSourceConfig).toEqual({ host: "h" });
  });

  test.each([
    ["an empty string", ""],
    ["an undefined body", undefined],
    ["an object without toString", Object.create(null)],
  ])("%s gives 400 Missing encrypted body", async (_name, body) => {
    await expectServiceError(
      runPluginQuery(makeReq({ body, headers: ENCRYPTED_HEADER }), makeRes() as any),
      BAD_REQUEST,
      MISSING_BODY_MESSAGE
    );
    expect(run).not.toHaveBeenCalled();
  });

  test("an undecryptable payload gives 400 Failed to decrypt string", async () => {
    await expectServiceError(
      runPluginQuery(makeReq({ body: "zz-not-hex", headers: ENCRYPTED_HEADER }), makeRes() as any),
      BAD_REQUEST,
      DECRYPT_FAILED_MESSAGE
    );
  });

  test("a payload that decrypts to non-JSON gives 400 Failed to parse decrypted body as JSON", async () => {
    await expectServiceError(
      runPluginQuery(makeReq({ body: encryptLikeSpring("not json {"), headers: ENCRYPTED_HEADER }), makeRes() as any),
      BAD_REQUEST,
      PARSE_FAILED_MESSAGE
    );
  });
});

describe("listPlugins", () => {
  const idsOf = (res: RecordedResponse) => res.body.map((p: any) => p.id);

  test("no id returns every registered plugin with status 200", async () => {
    const res = makeRes();

    await listPlugins(makeReq(), res as any);

    expect(res.statusCode).toBe(STATUS_OK);
    expect(res.body).toHaveLength(registry.length);
    expect(idsOf(res)).toEqual(expect.arrayContaining([FAKE_ID, FAKE_DYNAMIC_ID]));
  });

  test("a string id is wrapped in an array and filters to that plugin", async () => {
    const res = makeRes();

    await listPlugins(makeReq({ query: { id: FAKE_ID } }), res as any);

    expect(idsOf(res)).toEqual([FAKE_ID]);
  });

  test("an array of ids keeps exactly those plugins", async () => {
    const res = makeRes();

    await listPlugins(makeReq({ query: { id: [FAKE_ID, FAKE_DYNAMIC_ID] } }), res as any);

    expect(idsOf(res).sort()).toEqual([FAKE_DYNAMIC_ID, FAKE_ID].sort());
  });

  test("an unknown id gives []", async () => {
    const res = makeRes();

    await listPlugins(makeReq({ query: { id: "nope" } }), res as any);

    expect(res.statusCode).toBe(STATUS_OK);
    expect(res.body).toEqual([]);
  });
});

describe("runPluginQuery", () => {
  test("returns {result} from the plugin run, which receives the evaluated action, the config and the context", async () => {
    const res = makeRes();

    await runPluginQuery(makeReq({ body: queryBody() }), res as any);

    expect(res.statusCode).toBe(STATUS_OK);
    expect(run).toHaveBeenCalledTimes(1);
    const [action, config, pluginContext] = run.mock.calls[0] as any[];
    expect(action).toEqual({ actionName: "go", path: "/a/7", limit: 5 });
    expect(config).toEqual({ host: "h" });
    expect(pluginContext).toEqual({ languages: REQUEST_LANGUAGES });
    expect(res.body).toEqual({ result: { action, dataSourceConfig: config } });
  });

  test("an unknown pluginName gives 400 plugin not found: x", async () => {
    await expectServiceError(
      runPluginQuery(makeReq({ body: queryBody({ pluginName: "x" }) }), makeRes() as any),
      BAD_REQUEST,
      "plugin not found: x"
    );
  });
});

describe("validatePluginDataSourceConfig", () => {
  test("passes the plugin's result through", async () => {
    const res = makeRes();

    await validatePluginDataSourceConfig(
      makeReq({ body: { pluginName: FAKE_ID, dataSourceConfig: { host: "h" } } }),
      res as any
    );

    expect(res.statusCode).toBe(STATUS_OK);
    expect(res.body).toEqual({ success: true, seen: { host: "h" } });
    expect(validateDataSourceConfig.mock.calls[0][1]).toEqual({ languages: REQUEST_LANGUAGES });
  });

  test("a plugin without the function gives 400 plugin not define validateDataSourceConfig func", async () => {
    await expectServiceError(
      validatePluginDataSourceConfig(
        makeReq({ body: { pluginName: FAKE_DYNAMIC_ID, dataSourceConfig: {} } }),
        makeRes() as any
      ),
      BAD_REQUEST,
      `plugin not define validateDataSourceConfig func: ${FAKE_DYNAMIC_ID}`
    );
  });

  test("an encrypted body is decrypted first", async () => {
    const res = makeRes();
    const body = encryptLikeSpring(JSON.stringify({ pluginName: FAKE_ID, dataSourceConfig: { k: 1 } }));

    await validatePluginDataSourceConfig(makeReq({ body, headers: ENCRYPTED_HEADER }), res as any);

    expect(res.body).toEqual({ success: true, seen: { k: 1 } });
  });
});

describe("getDynamicDef", () => {
  test.each([
    ["an object", { pluginName: FAKE_DYNAMIC_ID }],
    ["a string", "text"],
    ["undefined", undefined],
  ])("a non-array body (%s) gives 400 request body is not a valid array", async (_name, body) => {
    await expectServiceError(
      getDynamicDef(makeReq({ body }), makeRes() as any),
      BAD_REQUEST,
      "request body is not a valid array"
    );
  });

  test("an array of two items returns the two resolved configs in order", async () => {
    const res = makeRes();
    const body = [
      { pluginName: FAKE_DYNAMIC_ID, path: "$.queryConfig", dataSourceConfig: { name: "first" } },
      { pluginName: FAKE_DYNAMIC_ID, path: "$.queryConfig", dataSourceConfig: { name: "second" } },
    ];

    await getDynamicDef(makeReq({ body }), res as any);

    expect(res.statusCode).toBe(STATUS_OK);
    expect(res.body).toEqual([
      { type: "textInput", key: "dyn", label: "for-first" },
      { type: "textInput", key: "dyn", label: "for-second" },
    ]);
  });

  test("an empty array gives []", async () => {
    const res = makeRes();

    await getDynamicDef(makeReq({ body: [] }), res as any);

    expect(res.body).toEqual([]);
  });

  test("a failing item rejects the whole request with its error", async () => {
    const body = [
      { pluginName: FAKE_DYNAMIC_ID, path: "$.queryConfig", dataSourceConfig: {} },
      { pluginName: "x", path: "$.queryConfig", dataSourceConfig: {} },
    ];

    await expectServiceError(getDynamicDef(makeReq({ body }), makeRes() as any), BAD_REQUEST, "plugin not found: x");
  });
});
