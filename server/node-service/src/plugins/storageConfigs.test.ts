import { GetObjectCommand, ListBucketsCommand, ListObjectsCommand, S3Client } from "@aws-sdk/client-s3";
import fs from "fs";
import nock from "nock";
import path from "path";
import { Readable } from "stream";
import aliyunDataSourceConfig from "./aliyunOss/dataSourceConfig";
import aliyunI18n from "./aliyunOss/i18n";
import { en as aliyunEn } from "./aliyunOss/i18n/en";
import { zh as aliyunZh } from "./aliyunOss/i18n/zh";
import aliyunQueryConfig from "./aliyunOss/queryConfig";
import { dataSourceConfig as gcsDataSourceConfig } from "./googleCloudStorage/dataSourceConfig";
import gcsQueryConfig from "./googleCloudStorage/queryConfig";
import s3DataSourceConfig from "./s3/dataSourceConfig";
import s3I18n from "./s3/i18n";
import { en as s3En } from "./s3/i18n/en";
import { zh as s3Zh } from "./s3/i18n/zh";
import s3QueryConfig from "./s3/queryConfig";
import { dataSourceConfig as supabaseDataSourceConfig } from "./supabase/dataSourceConfig";
import supabaseQueryConfig from "./supabase/queryConfig";

/**
 * Contract tests between the UI configuration (queryConfig / dataSourceConfig / i18n) and `run.ts` of the
 * four storage plugins.
 *
 * Behavioural part (bottom of the file, "behavioural contract"): for every configured action, `run` is called
 * with an action object built from the config's own declared param names, each carrying a distinctive
 * sentinel value, against the same process-boundary fakes the per-plugin suites use (s3: S3Client.prototype.send
 * spy; gcs and aliyun: recording module fakes; supabase: nock on the project URL). Every SDK / HTTP call is
 * recorded, and each declared param must show up in what the SDK or the wire received (its "witness"). A
 * second check drops one declared param at a time and requires its witness to disappear, which proves
 * each witness is tied to that param and not produced by something else. The data-source keys are checked the same
 * way. Because it observes calls, it does not care how run.ts reads a key (destructuring, computed access,
 * switch or if).
 *
 * Known-unwired params are exempt by name, each with its bug number, so the contract does not pin a bug;
 * none is registered today. The aliyunOss data-source `endpointUrl` (B37) is exempt the same way. Data-source keys that
 * run.ts must NOT use (s3 `specVersion`, gcs `region` and `specVersion`) are checked the opposite way: changing
 * them leaves every recorded call identical.
 *
 * Residual risks, stated exactly:
 *  - the "no action branch outside the configured set" check is textual (`actionName === "x"` in run.ts), so a
 *    run.ts refactored to a `switch` fails it falsely and a branch reached any other way is not seen. An action
 *    that run.ts handles but the config omits cannot be found behaviourally, because the set of possible
 *    action names is open;
 *  - a witness proves the sentinel reached the SDK/HTTP layer, not that it landed in the right argument
 *    position; the exact positions are asserted in the per-plugin run.test.ts suites;
 *  - the label / i18n checks compare against literal strings, so a reworded translation fails them by design.
 */

// Process-boundary fakes for the behavioural contract. The aliyun and gcs fakes append every call to these logs.
const mockAliCalls: any[] = [];
const mockGcsCalls: any[] = [];

jest.mock("ali-oss", () => {
  const { Readable: NodeReadable } = require("stream");
  class FakeOSS {
    constructor(options: Record<string, unknown>) {
      mockAliCalls.push({ ossOptions: options });
    }
    useBucket(bucket: string) {
      mockAliCalls.push({ useBucket: bucket });
    }
    async listV2(query: unknown, options: unknown) {
      mockAliCalls.push({ listV2: [query, options] });
      return { objects: [{ name: "cfg-listed.txt" }] };
    }
    async putStream(name: string, stream: InstanceType<typeof NodeReadable>) {
      const chunks: Buffer[] = [];
      for await (const chunk of stream) chunks.push(Buffer.from(chunk));
      mockAliCalls.push({ putStream: name, body: Buffer.concat(chunks).toString("utf8") });
      return { name };
    }
    signatureUrl(name: string) {
      mockAliCalls.push({ signatureUrl: name });
      return `https://oss.test/${name}`;
    }
  }
  class FakeSTS {
    constructor(options: Record<string, unknown>) {
      mockAliCalls.push({ stsOptions: options });
    }
    async assumeRole(...args: unknown[]) {
      mockAliCalls.push({ assumeRole: args });
      return {
        credentials: { AccessKeyId: "sts-ak", AccessKeySecret: "sts-secret", SecurityToken: "sts-token", Expiration: new Date(Date.now() + 3600_000).toISOString() },
      };
    }
  }
  return Object.assign(FakeOSS, { STS: FakeSTS });
});

jest.mock("@google-cloud/storage", () => ({
  Storage: class FakeStorage {
    constructor(options: Record<string, unknown>) {
      mockGcsCalls.push({ ctor: options });
    }
    async getBuckets() {
      mockGcsCalls.push({ getBuckets: true });
      return [[{ name: "cfg-listed-bucket" }]];
    }
    bucket(bucket: string) {
      return {
        getFiles: async (options: unknown) => {
          mockGcsCalls.push({ bucket, getFiles: options });
          return [[{ name: "cfg-listed.txt", metadata: {}, publicUrl: () => "https://gcs.test/cfg-listed.txt" }]];
        },
        file: (file: string) => ({
          get: async () => {
            mockGcsCalls.push({ bucket, file, get: true });
            return [{ metadata: { contentType: "text/plain" }, download: async () => [Buffer.from("cfg-data-text")] }];
          },
          save: async (data: Buffer, options: unknown) => {
            mockGcsCalls.push({ bucket, file, save: data, options });
          },
          delete: async () => {
            mockGcsCalls.push({ bucket, file, delete: true });
          },
          getSignedUrl: async (options: unknown) => {
            mockGcsCalls.push({ bucket, file, getSignedUrl: options });
            return ["https://gcs.test/cfg-signed-marker"];
          },
        }),
      };
    }
  },
}));

const PLUGINS_DIR = __dirname;
const SPEC_VERSIONS = { "V1.0": "a", "V2.0": "b" };
const SUPABASE_STORAGE_CATEGORY_LABEL = "Storage";

type ActionConfig = { actionName: string; label: string; params: readonly { key: string; type: string; label?: string }[]; category?: readonly string[] };
type ParamConfig = { key: string; type: string; label?: string; rules?: readonly { required?: boolean; message?: string }[]; options?: readonly { value: string; label: string }[]; defaultValue?: unknown; tooltip?: string };

const actionsOf = (config: any): ActionConfig[] => [...config.actions];
const byName = (actions: ActionConfig[], name: string) => {
  const action = actions.find((a) => a.actionName === name);
  if (!action) throw new Error(`no action ${name}`);
  return action;
};
const keysOf = (action: ActionConfig) => action.params.map((p) => p.key).sort();
const paramOf = (params: readonly ParamConfig[], key: string) => {
  const param = params.find((p) => p.key === key);
  if (!param) throw new Error(`no param ${key}`);
  return param;
};

/** run.ts without whole-line `//` comments (aliyunOss keeps a commented-out deleteFile branch). */
function runSource(plugin: string) {
  return fs
    .readFileSync(path.join(PLUGINS_DIR, plugin, "run.ts"), "utf8")
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");
}
/** Action names run.ts compares against, e.g. action.actionName === "listBuckets". */
function handledActions(source: string) {
  return [...source.matchAll(/actionName === "(\w+)"/g)].map((m) => m[1]);
}
/** Object keys of a (nested) i18n table as dotted paths. */
function keyPaths(table: any, prefix = ""): string[] {
  return Object.entries(table).flatMap(([k, v]) =>
    typeof v === "object" && v !== null ? keyPaths(v, `${prefix}${k}.`) : [`${prefix}${k}`]
  );
}

describe("s3", () => {
  const en = s3I18n(["en"]);
  const zh = s3I18n(["zh"]);
  const actions = actionsOf(s3QueryConfig(en, "V1.0"));
  const dsParams = [...s3DataSourceConfig(en, SPEC_VERSIONS).params] as ParamConfig[];

  test("the actions are the expected ones, and run.ts has no action branch outside them (textual)", () => {
    const names = actions.map((a) => a.actionName);
    expect(names).toEqual(["listBuckets", "listObjects", "readFile", "uploadData", "deleteFile"]);
    expect([...handledActions(runSource("s3"))].sort()).toEqual([...names].sort());
  });

  test("each action declares the expected params", () => {
    expect(keysOf(byName(actions, "listBuckets"))).toEqual([]);
    expect(keysOf(byName(actions, "listObjects"))).toEqual(["bucket", "delimiter", "limit", "prefix", "returnSignedUrl"]);
    expect(keysOf(byName(actions, "readFile"))).toEqual(["bucket", "encoding", "fileName"]);
    expect(keysOf(byName(actions, "uploadData"))).toEqual(["bucket", "contentType", "data", "encoding", "fileName", "returnSignedUrl"]);
    expect(keysOf(byName(actions, "deleteFile"))).toEqual(["bucket", "fileName"]);
  });


  test("encoding offers base64 and utf8, the encodings run.ts decodes with", () => {
    const encoding = paramOf(byName(actions, "readFile").params as ParamConfig[], "encoding");
    expect(encoding.options!.map((o) => o.value)).toEqual(["base64", "utf8"]);
  });

  test("labels differ between the en and zh translators", () => {
    const zhActions = actionsOf(s3QueryConfig(zh, "V1.0"));
    expect(byName(actions, "listObjects").label).toBe("List files");
    expect(byName(zhActions, "listObjects").label).toBe("获取文件列表");
    expect(byName(actions, "listBuckets").label).toBe("List buckets");
    expect(byName(zhActions, "listBuckets").label).toBe("查询桶列表");
    expect(byName(actions, "uploadData").label).toBe("Upload file");
    expect(byName(zhActions, "uploadData").label).toBe("上传文件");
    const bucketEn = byName(actions, "listObjects").params.find((p) => p.key === "bucket")!.label;
    const bucketZh = byName(zhActions, "listObjects").params.find((p) => p.key === "bucket")!.label;
    expect([bucketEn, bucketZh]).toEqual(["Bucket", "存储桶"]);
    expect(s3QueryConfig(en, "V1.0").label).toBe("Actions");
    expect(s3QueryConfig(zh, "V1.0").label).toBe("方法");
  });

  test("the data source config has accessKey, secretKey, endpointUrl, region and a spec version select offering the given specs", () => {
    expect(dsParams.map((p) => p.key)).toEqual(["accessKey", "secretKey", "endpointUrl", "region", "specVersion"]);
    expect(paramOf(dsParams, "secretKey").type).toBe("password");
    expect(paramOf(dsParams, "region").defaultValue).toBe("us-west-1");
    expect(paramOf(dsParams, "specVersion").options).toEqual([
      { value: "V1.0", label: "V1.0" },
      { value: "V2.0", label: "V2.0" },
    ]);
  });

  test("required-field messages and tooltips are localized", () => {
    const zhParams = [...s3DataSourceConfig(zh, SPEC_VERSIONS).params] as ParamConfig[];
    expect(paramOf(dsParams, "accessKey").rules![0]).toEqual({ required: true, message: "Please input the AccessKey" });
    expect(paramOf(zhParams, "accessKey").rules![0]).toEqual({ required: true, message: "请输入 AccessKey" });
    expect(paramOf(dsParams, "secretKey").rules![0].message).toBe("Please input the SecretKey");
    expect(paramOf(zhParams, "secretKey").rules![0].message).toBe("请输入 SecretKey");
    expect(paramOf(dsParams, "endpointUrl").tooltip).toBe("Endpoint url of S3 compatible object storage service");
    expect(paramOf(zhParams, "endpointUrl").tooltip).toBe("S3 协议兼容的对象存储服务");
  });

  test("the zh table has exactly the keys of the en table", () => {
    expect(keyPaths(s3Zh).sort()).toEqual(keyPaths(s3En).sort());
  });
});

describe("aliyunOss", () => {
  const en = aliyunI18n(["en"]);
  const zh = aliyunI18n(["zh"]);
  const actions = actionsOf(aliyunQueryConfig(en));
  const dsParams = [...aliyunDataSourceConfig(en).params] as ParamConfig[];

  test("the actions are the expected ones, and run.ts has no action branch outside them (textual)", () => {
    const names = actions.map((a) => a.actionName);
    expect(names).toEqual(["listObjects", "uploadData"]);
    expect([...handledActions(runSource("aliyunOss"))].sort()).toEqual([...names].sort());
  });

  test("each action declares the expected params", () => {
    expect(keysOf(byName(actions, "listObjects"))).toEqual(["bucket", "delimiter", "limit", "prefix"]);
    expect(keysOf(byName(actions, "uploadData"))).toEqual(["bucket", "data", "fileName"]);
  });


  test("the data source config has accessKeyId, accessKeySecret, arn, endpointUrl and region", () => {
    expect(dsParams.map((p) => p.key)).toEqual(["accessKeyId", "accessKeySecret", "arn", "endpointUrl", "region"]);
    expect(paramOf(dsParams, "accessKeySecret").type).toBe("password");
    expect(paramOf(dsParams, "region").defaultValue).toBe("oss-cn-hangzhou");
    for (const key of ["accessKeyId", "accessKeySecret", "arn", "endpointUrl", "region"]) {
      expect(paramOf(dsParams, key).rules![0].required).toBe(true);
    }
  });

  test("labels, messages and tooltips differ between the en and zh translators", () => {
    const zhActions = actionsOf(aliyunQueryConfig(zh));
    const zhParams = [...aliyunDataSourceConfig(zh).params] as ParamConfig[];
    expect(byName(actions, "listObjects").label).toBe("List files");
    expect(byName(zhActions, "listObjects").label).toBe("获取文件列表");
    expect(byName(actions, "uploadData").label).toBe("Upload file");
    expect(byName(zhActions, "uploadData").label).toBe("上传文件");
    expect(paramOf(dsParams, "arn").rules![0].message).toBe("Please input the ARN");
    expect(paramOf(zhParams, "arn").rules![0].message).toBe("请输入阿里云ARN");
    expect(paramOf(dsParams, "region").label).toBe("OSS Region");
    expect(paramOf(zhParams, "region").label).toBe("OSS 区域");
    const dataParamEn = byName(actions, "uploadData").params.find((p) => p.key === "data") as ParamConfig;
    const dataParamZh = byName(zhActions, "uploadData").params.find((p) => p.key === "data") as ParamConfig;
    expect(dataParamEn.tooltip).toContain("BASE64");
    expect(dataParamZh.tooltip).toContain("BASE64");
    expect(dataParamZh.tooltip).not.toBe(dataParamEn.tooltip);
  });

  test("the zh table has exactly the keys of the en table", () => {
    expect(keyPaths(aliyunZh).sort()).toEqual(keyPaths(aliyunEn).sort());
  });
});

describe("supabase", () => {
  const actions = actionsOf(supabaseQueryConfig);

  test("the actions are the expected ones, and run.ts has no action branch outside them (textual)", () => {
    const names = actions.map((a) => a.actionName);
    expect(names).toEqual(["listBuckets", "listObjects", "readFile", "uploadData", "deleteFile", "createSignedUrl"]);
    expect([...handledActions(runSource("supabase"))].sort()).toEqual([...names].sort());
  });

  test("every action carries the Storage category that the query config declares", () => {
    const categoryItems = (supabaseQueryConfig as any).categories.items as { label: string; value: string }[];
    expect(categoryItems).toHaveLength(1);
    expect(categoryItems[0].label).toBe(SUPABASE_STORAGE_CATEGORY_LABEL);
    for (const action of actions) {
      expect(action.category).toEqual([categoryItems[0].value]);
    }
  });

  test("each action declares the expected params", () => {
    expect(keysOf(byName(actions, "listBuckets"))).toEqual([]);
    expect(keysOf(byName(actions, "listObjects"))).toEqual(["bucket", "limit", "offset", "path", "returnSignedUrl", "search", "sortBy"]);
    expect(keysOf(byName(actions, "readFile"))).toEqual(["bucket", "encoding", "fileName", "transform"]);
    expect(keysOf(byName(actions, "uploadData"))).toEqual(["bucket", "contentType", "data", "encoding", "fileName", "returnSignedUrl"]);
    expect(keysOf(byName(actions, "deleteFile"))).toEqual(["bucket", "fileName"]);
    expect(keysOf(byName(actions, "createSignedUrl"))).toEqual(["bucket", "fileName"]);
  });


  test("the data source asks for the project URL (required) and the api key (password)", () => {
    expect(supabaseDataSourceConfig.params.map((p) => [p.key, p.type])).toEqual([
      ["projectUrl", "textInput"],
      ["apiKey", "password"],
    ]);
    expect(supabaseDataSourceConfig.params[0].rules).toEqual([{ required: true }]);
  });
});

describe("googleCloudStorage", () => {
  const actions = actionsOf(gcsQueryConfig);

  test("the actions are the expected ones, and run.ts has no action branch outside them (textual)", () => {
    const names = actions.map((a) => a.actionName);
    expect(names).toEqual(["listBuckets", "listObjects", "readFile", "uploadData", "deleteFile"]);
    expect([...handledActions(runSource("googleCloudStorage"))].sort()).toEqual([...names].sort());
  });

  test("each action declares the expected params", () => {
    expect(keysOf(byName(actions, "listBuckets"))).toEqual([]);
    expect(keysOf(byName(actions, "listObjects"))).toEqual(["bucket", "delimiter", "limit", "prefix", "returnSignedUrl"]);
    expect(keysOf(byName(actions, "readFile"))).toEqual(["bucket", "encoding", "fileName"]);
    expect(keysOf(byName(actions, "uploadData"))).toEqual(["bucket", "contentType", "data", "encoding", "fileName", "returnSignedUrl"]);
    expect(keysOf(byName(actions, "deleteFile"))).toEqual(["bucket", "fileName"]);
  });


  test("the data source has the privateKey that run.ts parses: a required password field", () => {
    const privateKey = paramOf(gcsDataSourceConfig.params as readonly ParamConfig[], "privateKey");
    expect(privateKey.type).toBe("password");
    expect(privateKey.rules![0].required).toBe(true);
  });

  test("the spec version select offers v1.0, the key of the plugin's query config", () => {
    expect(paramOf(gcsDataSourceConfig.params as readonly ParamConfig[], "specVersion").options).toEqual([{ value: "v1.0", label: "v1.0" }]);
  });
});

// ---------------------------------------------------------------------------------------------------------
// Behavioural contract: declared params and data-source keys must reach the SDK / the wire.
// ---------------------------------------------------------------------------------------------------------

const DATA_TEXT = "cfg-data-text";
const SIGNED_MARKER = "cfg-signed-marker";
const LISTED_KEY = "cfg-listed.txt";
const SUPABASE_URL = "http://cfg-project.test";
const SUPABASE_STORAGE = "/storage/v1";
const STATUS_OK = 200;
const STATUS_UNROUTED = 404;

/** What must be visible in the recorded calls for a param that carries its sentinel. */
const PARAM_WITNESS: Record<string, string[]> = {
  bucket: ["cfgbucket"],
  fileName: ["cfg-file.txt"],
  prefix: ["cfg-prefix/"],
  delimiter: ["cfg-delim"],
  limit: ["7731"],
  offset: ["4242"],
  path: ["cfg-path"],
  contentType: ["cfg/content-type"],
  sortBy: ["cfg-col"],
  transform: ["1357", "2468"],
  search: ["cfg-search"],
  encoding: [DATA_TEXT], // utf8 decodes DATA_TEXT; the base64 default would garble it
  data: [DATA_TEXT],
};
const PARAM_SENTINEL: Record<string, unknown> = {
  bucket: "cfgbucket",
  fileName: "cfg-file.txt",
  prefix: "cfg-prefix/",
  delimiter: "cfg-delim",
  limit: 7731,
  offset: 4242,
  path: "cfg-path",
  contentType: "cfg/content-type",
  sortBy: { column: "cfg-col", order: "asc" },
  transform: { width: 1357, height: 2468 },
  search: "cfg-search",
  returnSignedUrl: true,
  encoding: "utf8",
};

type Settled = { ok: unknown } | { err: string };
type Invoker = (action: Record<string, unknown>, dataSource: Record<string, unknown>) => Promise<{ outcome: Settled; observed: string }>;
type BehaviouralPlugin = {
  name: string;
  actions: ActionConfig[];
  dataSource: Record<string, unknown>;
  /** data-source key -> what its value must look like in the recorded calls */
  dataSourceWitness: Record<string, string>;
  /** data-source keys run.ts must not use: changing them changes nothing recorded. key -> another value */
  ignoredDataSourceKeys: Record<string, unknown>;
  /** declared params that are known not to reach the SDK, with the bug that owns them: "<action>.<key>" -> B-number */
  knownUnwiredParams: Record<string, string>;
  /** data-source keys known not to reach the SDK, with their bug number */
  knownUnwiredDataSourceKeys: Record<string, string>;
  signedWitness: string;
  /** an action that makes one representative call, used for the data-source checks */
  probeAction: Record<string, unknown>;
  invoke: Invoker;
};

/** JSON with Buffers shown as text and Dates as ISO strings, so recorded call arguments are greppable. */
function serialize(value: unknown) {
  return JSON.stringify(value, function (this: any, key: string, val: unknown) {
    const raw = this[key];
    if (Buffer.isBuffer(raw)) return raw.toString("utf8");
    return val;
  });
}
const settleRun = async (call: Promise<unknown>): Promise<Settled> =>
  call.then(
    (ok) => ({ ok }),
    (err) => ({ err: String(err && err.message ? err.message : err) })
  );

const s3Invoke: Invoker = async (action, dataSource) => {
  const run = require("./s3/run").default;
  const i18n = s3I18n(["en"]);
  const calls: any[] = [];
  const spy = jest.spyOn(S3Client.prototype, "send").mockImplementation(async function (this: S3Client, command: any) {
    const config: any = this.config;
    const credentials = await config.credentials();
    const endpoint = typeof config.endpoint === "function" ? await config.endpoint() : undefined;
    calls.push({
      command: command.constructor.name,
      input: command.input,
      region: await config.region(),
      endpointHost: endpoint?.hostname,
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    });
    if (command instanceof ListBucketsCommand) return { Buckets: [{ Name: "cfg-listed-bucket" }] };
    if (command instanceof ListObjectsCommand) return { Contents: [{ Key: LISTED_KEY }] };
    if (command instanceof GetObjectCommand) {
      return {
        ContentType: "text/plain",
        Body: {
          transformToString: async (encoding: BufferEncoding) => {
            calls.push({ transformToString: encoding });
            return Buffer.from(DATA_TEXT).toString(encoding);
          },
        },
      };
    }
    return {};
  } as any);
  try {
    const outcome = await settleRun(run(action, dataSource, i18n));
    return { outcome, observed: serialize({ calls, outcome }) };
  } finally {
    spy.mockRestore();
  }
};

const gcsInvoke: Invoker = async (action, dataSource) => {
  mockGcsCalls.length = 0;
  const run = require("./googleCloudStorage/run").default;
  const outcome = await settleRun(run(action, dataSource));
  return { outcome, observed: serialize({ calls: mockGcsCalls, outcome }) };
};

const aliyunInvoke: Invoker = async (action, dataSource) => {
  mockAliCalls.length = 0;
  let run!: (a: unknown, d: unknown, i: unknown) => Promise<unknown>;
  let i18n: unknown;
  // run.ts keeps its STS credential cache at module level: load it fresh for every call
  jest.isolateModules(() => {
    run = require("./aliyunOss/run").default;
    i18n = require("./aliyunOss/i18n").default(["en"]);
  });
  const outcome = await settleRun(run(action, dataSource, i18n));
  return { outcome, observed: serialize({ calls: mockAliCalls, outcome }) };
};

const supabaseInvoke: Invoker = async (action, dataSource) => {
  const run = require("./supabase/run").default;
  const requests: any[] = [];
  function handler(this: any, uri: string, requestBody: unknown): [number, unknown, Record<string, string>?] {
    const body = typeof requestBody === "string" ? requestBody : JSON.stringify(requestBody);
    const headers = this.req.headers;
    requests.push({ method: this.req.method, uri, host: headers.host, apikey: headers.apikey, contentType: headers["content-type"], body });
    const sign = `/object/sign/x?token=${SIGNED_MARKER}`;
    const method: string = this.req.method;
    if (method === "GET" && uri.endsWith(`${SUPABASE_STORAGE}/bucket`)) return [STATUS_OK, []];
    if (method === "POST" && uri.includes("/object/list/")) return [STATUS_OK, [{ name: LISTED_KEY }]];
    if (method === "POST" && /\/object\/sign\/[^/]+$/.test(uri)) {
      const paths: string[] = JSON.parse(body).paths;
      return [STATUS_OK, paths.map((p) => ({ path: p, signedURL: sign }))];
    }
    if (method === "POST" && uri.includes("/object/sign/")) return [STATUS_OK, { signedURL: sign }];
    if (method === "POST" && uri.includes("/object/")) return [STATUS_OK, { Id: "cfg-id", Key: "cfg-key" }];
    if (method === "GET") return [STATUS_OK, DATA_TEXT, { "content-type": "text/plain" }];
    if (method === "DELETE") return [STATUS_OK, []];
    return [STATUS_UNROUTED, { message: "unrouted" }];
  }
  const origin = String(dataSource.projectUrl);
  nock(origin).persist().get(/.*/).reply(handler).post(/.*/).reply(handler).delete(/.*/).reply(handler);
  try {
    const outcome = await settleRun(run(action, dataSource));
    return { outcome, observed: serialize({ requests, outcome }) };
  } finally {
    nock.cleanAll();
  }
};

const base64 = (text: string) => Buffer.from(text).toString("base64");

/** The action object for a configured action: every declared param, carrying its sentinel. */
function actionWithParams(config: ActionConfig, omit?: string): Record<string, unknown> {
  const keys = config.params.map((p) => p.key);
  const action: Record<string, unknown> = { actionName: config.actionName };
  for (const key of keys) {
    if (key === omit) continue;
    if (key === "data") action.data = keys.includes("encoding") ? DATA_TEXT : base64(DATA_TEXT);
    else action[key] = PARAM_SENTINEL[key];
  }
  return action;
}

const behaviouralPlugins = (): BehaviouralPlugin[] => [
  {
    name: "s3",
    actions: actionsOf(s3QueryConfig(s3I18n(["en"]), "V1.0")),
    dataSource: { accessKey: "AKIAcfgaccess", secretKey: "cfg-secret-key", endpointUrl: "http://cfg-endpoint.test:9000", region: "cfg-region-1", specVersion: "V1.0" },
    dataSourceWitness: { accessKey: "AKIAcfgaccess", secretKey: "cfg-secret-key", endpointUrl: "cfg-endpoint.test", region: "cfg-region-1" },
    ignoredDataSourceKeys: { specVersion: "V2.0" },
    knownUnwiredParams: {},
    knownUnwiredDataSourceKeys: {},
    signedWitness: "X-Amz-Signature",
    probeAction: { actionName: "listBuckets" },
    invoke: s3Invoke,
  },
  {
    name: "googleCloudStorage",
    actions: actionsOf(gcsQueryConfig),
    dataSource: { privateKey: JSON.stringify({ client_email: "cfg-svc@cfg.iam.test", private_key: "cfg-private-key" }), region: "cfg-region", specVersion: "v1.0" },
    dataSourceWitness: { privateKey: "cfg-svc@cfg.iam.test" },
    ignoredDataSourceKeys: { region: "other-region", specVersion: "other-spec" },
    knownUnwiredParams: {},
    knownUnwiredDataSourceKeys: {},
    signedWitness: SIGNED_MARKER,
    probeAction: { actionName: "listBuckets" },
    invoke: gcsInvoke,
  },
  {
    name: "aliyunOss",
    actions: actionsOf(aliyunQueryConfig(aliyunI18n(["en"]))),
    dataSource: { accessKeyId: "LTAI-cfg", accessKeySecret: "cfg-ali-secret", arn: "acs:ram::cfg:role/cfg", endpointUrl: "sts.cfg.aliyuncs.com", region: "oss-cfg-region" },
    dataSourceWitness: { accessKeyId: "LTAI-cfg", accessKeySecret: "cfg-ali-secret", arn: "acs:ram::cfg:role/cfg", region: "oss-cfg-region" },
    ignoredDataSourceKeys: {},
    knownUnwiredParams: {},
    knownUnwiredDataSourceKeys: { endpointUrl: "B37" },
    signedWitness: SIGNED_MARKER,
    probeAction: { actionName: "listObjects", bucket: "cfgbucket" },
    invoke: aliyunInvoke,
  },
  {
    name: "supabase",
    actions: actionsOf(supabaseQueryConfig),
    dataSource: { projectUrl: SUPABASE_URL, apiKey: "cfg-api-key" },
    dataSourceWitness: { projectUrl: "cfg-project.test", apiKey: "cfg-api-key" },
    ignoredDataSourceKeys: {},
    knownUnwiredParams: {},
    knownUnwiredDataSourceKeys: {},
    signedWitness: SIGNED_MARKER,
    probeAction: { actionName: "listBuckets" },
    invoke: supabaseInvoke,
  },
];

describe("behavioural contract: configured params reach the SDK", () => {
  beforeEach(() => {
    if (!nock.isActive()) nock.activate();
    nock.disableNetConnect();
  });
  afterEach(() => {
    nock.cleanAll();
    nock.restore();
    nock.enableNetConnect();
  });

  const plugins = behaviouralPlugins();

  describe.each(plugins.map((p) => [p.name, p] as const))("%s", (_name, plugin) => {
    const witnessesOf = (key: string) => (key === "returnSignedUrl" ? [plugin.signedWitness] : PARAM_WITNESS[key]);
    const isUnwired = (action: string, key: string) => `${action}.${key}` in plugin.knownUnwiredParams;
    const cases = plugin.actions.flatMap((a) =>
      a.params.filter((p) => !isUnwired(a.actionName, p.key)).map((p) => [a.actionName, p.key, a] as const)
    );

    test("every action has a string actionName and label and a params array of keyed params", () => {
      expect(plugin.actions.length).toBeGreaterThan(0);
      for (const action of plugin.actions) {
        expect(typeof action.actionName).toBe("string");
        expect(action.actionName).not.toBe("");
        expect(typeof action.label).toBe("string");
        expect(action.label).not.toBe("");
        expect(Array.isArray(action.params)).toBe(true);
        for (const param of action.params) expect(typeof param.key).toBe("string");
      }
    });

    test("every declared param of every action has a witness defined by this contract (no param escapes the check)", () => {
      for (const action of plugin.actions) {
        for (const param of action.params) {
          expect([action.actionName, param.key, (witnessesOf(param.key) ?? []).length > 0]).toEqual([action.actionName, param.key, true]);
        }
      }
    });

    test.each(plugin.actions.map((a) => [a.actionName, a] as const))("%s: run succeeds and returns a result when called with every declared param", async (_action, config) => {
      const { outcome } = await plugin.invoke(actionWithParams(config), plugin.dataSource);
      expect(outcome).toEqual({ ok: expect.anything() });
    });

    test.each(cases)("%s: the declared param '%s' reaches the SDK / the wire", async (_action, key, config) => {
      const { observed } = await plugin.invoke(actionWithParams(config), plugin.dataSource);
      for (const witness of witnessesOf(key)) expect([key, observed.includes(witness)]).toEqual([key, true]);
    });

    test.each(cases)("%s: without the declared param '%s' its witness is absent (the check can fail)", async (_action, key, config) => {
      const { observed } = await plugin.invoke(actionWithParams(config, key), plugin.dataSource);
      const present = witnessesOf(key).filter((witness) => observed.includes(witness));
      expect([key, present]).toEqual([key, []]);
    });

    test.each(Object.keys(plugin.dataSourceWitness))("the data-source key '%s' reaches the SDK / the wire", async (key) => {
      const { observed } = await plugin.invoke(plugin.probeAction, plugin.dataSource);
      expect([key, observed.includes(plugin.dataSourceWitness[key])]).toEqual([key, true]);
    });

    test.each(Object.keys(plugin.dataSourceWitness))("without the data-source key '%s' its witness is absent (the check can fail)", async (key) => {
      const { [key]: _dropped, ...rest } = plugin.dataSource;
      const { observed } = await plugin.invoke(plugin.probeAction, { ...rest, ...(key === "projectUrl" ? { projectUrl: "http://other-project.test" } : {}) });
      expect([key, observed.includes(plugin.dataSourceWitness[key])]).toEqual([key, false]);
    });

    test("data-source keys that run must not use: changing them changes nothing recorded", async () => {
      const before = await plugin.invoke(plugin.probeAction, plugin.dataSource);
      for (const [key, other] of Object.entries(plugin.ignoredDataSourceKeys)) {
        const after = await plugin.invoke(plugin.probeAction, { ...plugin.dataSource, [key]: other });
        expect([key, after.observed]).toEqual([key, before.observed]);
      }
    });

    test("known-unwired params and data-source keys are only the registered ones", () => {
      expect(plugin.knownUnwiredParams).toEqual({});
      expect(plugin.knownUnwiredDataSourceKeys).toEqual(plugin.name === "aliyunOss" ? { endpointUrl: "B37" } : {});
    });
  });
});
