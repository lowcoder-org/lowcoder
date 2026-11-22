import { Readable } from "stream";

/**
 * aliyunOss plugin. "ali-oss" is replaced by a recording fake (process boundary): `OSS` records its
 * constructor options, `useBucket`, `listV2`, `putStream` (the stream content is read) and
 * `signatureUrl`; `STS` records its options and `assumeRole` calls and answers with controllable
 * credentials. run.ts keeps its STS credential cache at module level, so every test loads
 * the plugin modules fresh through jest.isolateModules. Consequently the ServiceError class used inside
 * the isolated registry is the one returned by the loader, not the top-level import.
 */

type Recorded = Record<string, any>;
const mockOss: {
  stsOptions: Recorded[];
  assumeRole: jest.Mock;
  ossOptions: Recorded[];
  useBucket: jest.Mock;
  listV2: jest.Mock;
  putStream: jest.Mock;
  signatureUrl: jest.Mock;
} = {
  stsOptions: [],
  assumeRole: jest.fn(),
  ossOptions: [],
  useBucket: jest.fn(),
  listV2: jest.fn(),
  putStream: jest.fn(),
  signatureUrl: jest.fn(),
};

jest.mock("ali-oss", () => {
  class FakeOSS {
    constructor(options: Recorded) {
      mockOss.ossOptions.push(options);
    }
    useBucket(bucket: string) {
      return mockOss.useBucket(bucket);
    }
    listV2(query: Recorded, options: Recorded) {
      return mockOss.listV2(query, options);
    }
    putStream(name: string, stream: Readable) {
      return mockOss.putStream(name, stream);
    }
    signatureUrl(name: string) {
      return mockOss.signatureUrl(name);
    }
  }
  class FakeSTS {
    constructor(options: Recorded) {
      mockOss.stsOptions.push(options);
    }
    assumeRole(...args: any[]) {
      return mockOss.assumeRole(...args);
    }
  }
  return Object.assign(FakeOSS, { STS: FakeSTS });
});

const STATUS_BAD_REQUEST = 400;
const ARN = "acs:ram::123456:role/lowcoder";
const REGION = "oss-cn-hangzhou";
const STS_SESSION_NAME = "lowcoder";
const STS_DURATION_SECONDS = 3000;
const BUCKET = "oss-bucket";
const NOW_MS = Date.parse("2025-03-01T12:00:00.000Z");
const HOUR_MS = 60 * 60 * 1000;
const DEFAULT_MAX_KEYS = "100";
const BUCKET_REQUIRED_EN = "Bucket is required";
const BUCKET_REQUIRED_ZH = "需要提供存储桶名称";
const FAKE_TIMER_KEEP_REAL = [
  "hrtime", "nextTick", "performance", "queueMicrotask", "requestAnimationFrame", "cancelAnimationFrame",
  "requestIdleCallback", "cancelIdleCallback", "setImmediate", "clearImmediate", "setInterval", "clearInterval",
  "setTimeout", "clearTimeout",
] as const;

const dataSource = {
  accessKeyId: "LTAI-first",
  accessKeySecret: "secret-first",
  arn: ARN,
  endpointUrl: "sts.cn-hangzhou.aliyuncs.com",
  region: REGION,
};

function credentials(tag: string, expiration: string) {
  return {
    credentials: {
      AccessKeyId: `sts-ak-${tag}`,
      AccessKeySecret: `sts-secret-${tag}`,
      SecurityToken: `sts-token-${tag}`,
      Expiration: expiration,
    },
  };
}
/** Settles a call into a result object, so a rejection shows up as `{ err }` in the assertion instead of aborting the test. */
type Outcome<T> = { ok: T } | { err: any };
const settle = <T>(call: Promise<T>): Promise<Outcome<T>> =>
  call.then(
    (ok) => ({ ok }),
    (err) => ({ err })
  );
const STS_FAILURE = "InvalidAccessKeyId.NotFound";

const inOneHour = () => new Date(Date.now() + HOUR_MS).toISOString();

type Loaded = {
  run: (action: any, ds: any, i18n: any) => Promise<any>;
  validateDataSourceConfig: (ds: any) => Promise<any>;
  stsCredentialCacheSize: () => number;
  plugin: any;
  ServiceError: any;
  i18n: (lang: string) => any;
};

function load(): Loaded {
  let loaded!: Loaded;
  jest.isolateModules(() => {
    const runMod = require("./run");
    const getI18n = require("./i18n").default;
    loaded = {
      run: runMod.default,
      validateDataSourceConfig: runMod.validateDataSourceConfig,
      stsCredentialCacheSize: runMod.stsCredentialCacheSize,
      plugin: require("./index").default({ languages: ["en"] }),
      ServiceError: require("../../common/error").ServiceError,
      i18n: (lang: string) => getI18n([lang]),
    };
  });
  return loaded;
}

beforeEach(() => {
  mockOss.stsOptions.length = 0;
  mockOss.ossOptions.length = 0;
  for (const fn of [mockOss.assumeRole, mockOss.useBucket, mockOss.listV2, mockOss.putStream, mockOss.signatureUrl]) {
    fn.mockReset();
  }
  mockOss.assumeRole.mockImplementation(async () => credentials("one", inOneHour()));
});

afterEach(() => {
  jest.useRealTimers();
});

describe("STS login", () => {
  test("the first run assumes the role with (arn, '', 3000, 'lowcoder') using the data source's own key", async () => {
    const { run, i18n } = load();
    mockOss.listV2.mockResolvedValue({ objects: [] });
    await run({ actionName: "listObjects", bucket: BUCKET }, dataSource, i18n("en"));
    expect(mockOss.stsOptions).toEqual([
      { accessKeyId: dataSource.accessKeyId, accessKeySecret: dataSource.accessKeySecret, endpoint: "https://sts.cn-hangzhou.aliyuncs.com" },
    ]);
    expect(mockOss.assumeRole).toHaveBeenCalledTimes(1);
    expect(mockOss.assumeRole).toHaveBeenCalledWith(ARN, "", STS_DURATION_SECONDS, STS_SESSION_NAME);
  });

  test("the OSS client gets the region and the STS key, secret and token; refreshSTSToken resolves the mapped credentials", async () => {
    const { run, i18n } = load();
    mockOss.listV2.mockResolvedValue({ objects: [] });
    await run({ actionName: "listObjects", bucket: BUCKET }, dataSource, i18n("en"));
    expect(mockOss.ossOptions).toHaveLength(1);
    expect(mockOss.ossOptions[0]).toMatchObject({
      region: REGION,
      accessKeyId: "sts-ak-one",
      accessKeySecret: "sts-secret-one",
      stsToken: "sts-token-one",
    });
    expect(await mockOss.ossOptions[0].refreshSTSToken()).toEqual({
      accessKeyId: "sts-ak-one",
      accessKeySecret: "sts-secret-one",
      stsToken: "sts-token-one",
    });
    // refresh while the cached credentials are valid does not log in again
    expect(mockOss.assumeRole).toHaveBeenCalledTimes(1);
  });

  test("a second run before Expiration reuses the credentials (one assumeRole)", async () => {
    const { run, i18n } = load();
    mockOss.listV2.mockResolvedValue({ objects: [] });
    await run({ actionName: "listObjects", bucket: BUCKET }, dataSource, i18n("en"));
    await run({ actionName: "listObjects", bucket: BUCKET }, dataSource, i18n("en"));
    expect(mockOss.assumeRole).toHaveBeenCalledTimes(1);
    expect(mockOss.ossOptions).toHaveLength(2);
    expect(mockOss.ossOptions[1].stsToken).toBe("sts-token-one");
  });

  test("after Expiration the next run logs in again and uses the new credentials", async () => {
    jest.useFakeTimers({ now: NOW_MS, doNotFake: [...FAKE_TIMER_KEEP_REAL] });
    const { run, i18n } = load();
    mockOss.listV2.mockResolvedValue({ objects: [] });
    mockOss.assumeRole
      .mockResolvedValueOnce(credentials("old", new Date(NOW_MS + 1000).toISOString()))
      .mockResolvedValueOnce(credentials("new", new Date(NOW_MS + HOUR_MS).toISOString()));
    await run({ actionName: "listObjects", bucket: BUCKET }, dataSource, i18n("en"));
    jest.setSystemTime(NOW_MS + 999); // still valid
    await run({ actionName: "listObjects", bucket: BUCKET }, dataSource, i18n("en"));
    expect(mockOss.assumeRole).toHaveBeenCalledTimes(1);
    jest.setSystemTime(NOW_MS + 1001); // expired
    await run({ actionName: "listObjects", bucket: BUCKET }, dataSource, i18n("en"));
    expect(mockOss.assumeRole).toHaveBeenCalledTimes(2);
    expect(mockOss.ossOptions[2].stsToken).toBe("sts-token-new");
  });

  test("at the exact Expiration instant the credentials are no longer reused", async () => {
    jest.useFakeTimers({ now: NOW_MS, doNotFake: [...FAKE_TIMER_KEEP_REAL] });
    const { run, i18n } = load();
    mockOss.listV2.mockResolvedValue({ objects: [] });
    mockOss.assumeRole.mockImplementation(async () => credentials("x", new Date(NOW_MS + 1000).toISOString()));
    await run({ actionName: "listObjects", bucket: BUCKET }, dataSource, i18n("en"));
    jest.setSystemTime(NOW_MS + 1000);
    await run({ actionName: "listObjects", bucket: BUCKET }, dataSource, i18n("en"));
    expect(mockOss.assumeRole).toHaveBeenCalledTimes(2);
  });

  test("an STS failure rejects run with the STS error", async () => {
    const { run, i18n } = load();
    const failure = new Error("InvalidAccessKeyId.NotFound");
    mockOss.assumeRole.mockRejectedValue(failure);
    await expect(run({ actionName: "listObjects", bucket: BUCKET }, dataSource, i18n("en"))).rejects.toBe(failure);
    expect(mockOss.ossOptions).toHaveLength(0);
  });

  test("B11: each data source assumes its role with its own key", async () => {
    const { run, i18n } = load();
    mockOss.listV2.mockResolvedValue({ objects: [] });
    const second = { ...dataSource, accessKeyId: "LTAI-second", accessKeySecret: "secret-second" };
    const first = await settle(run({ actionName: "listObjects", bucket: BUCKET }, dataSource, i18n("en")));
    const other = await settle(run({ actionName: "listObjects", bucket: BUCKET }, second, i18n("en")));
    expect([first, other]).toEqual([{ ok: [] }, { ok: [] }]);
    expect(mockOss.stsOptions.map((o) => o.accessKeyId)).toEqual(["LTAI-first", "LTAI-second"]);
  });

  /** assumeRole answers with credentials tagged by the access key id of the last STS constructed. */
  function tagCredentialsByKey(expiration: (accessKeyId: string) => string = inOneHour) {
    mockOss.assumeRole.mockImplementation(async () => {
      const accessKeyId = mockOss.stsOptions.at(-1)!.accessKeyId as string;
      return credentials(accessKeyId, expiration(accessKeyId));
    });
  }
  const dataSourceB = { ...dataSource, accessKeyId: "LTAI-second", accessKeySecret: "secret-second" };
  const listAction = { actionName: "listObjects", bucket: BUCKET };

  test("interleaved data sources keep their own credentials", async () => {
    const { run, i18n } = load();
    mockOss.listV2.mockResolvedValue({ objects: [] });
    tagCredentialsByKey();
    await run(listAction, dataSource, i18n("en"));
    await run(listAction, dataSourceB, i18n("en"));
    await run(listAction, dataSource, i18n("en"));
    expect(mockOss.assumeRole).toHaveBeenCalledTimes(2);
    expect(mockOss.ossOptions.map((o) => o.stsToken)).toEqual(["sts-token-LTAI-first", "sts-token-LTAI-second", "sts-token-LTAI-first"]);
  });

  test("a changed secret with the same key id logs in again", async () => {
    const { run, i18n } = load();
    mockOss.listV2.mockResolvedValue({ objects: [] });
    await run(listAction, { ...dataSource, accessKeySecret: "secret-first" }, i18n("en"));
    await run(listAction, { ...dataSource, accessKeySecret: "secret-rotated" }, i18n("en"));
    expect(mockOss.assumeRole).toHaveBeenCalledTimes(2);
    expect(mockOss.stsOptions.map((o) => o.accessKeySecret)).toEqual(["secret-first", "secret-rotated"]);
  });

  test("a changed ARN logs in again with that ARN", async () => {
    const { run, i18n } = load();
    mockOss.listV2.mockResolvedValue({ objects: [] });
    const otherArn = "acs:ram::654321:role/other";
    await run(listAction, dataSource, i18n("en"));
    await run(listAction, { ...dataSource, arn: otherArn }, i18n("en"));
    expect(mockOss.assumeRole.mock.calls.map((c) => c[0])).toEqual([ARN, otherArn]);
  });

  test("expiry is per data source", async () => {
    jest.useFakeTimers({ now: NOW_MS, doNotFake: [...FAKE_TIMER_KEEP_REAL] });
    const { run, i18n } = load();
    mockOss.listV2.mockResolvedValue({ objects: [] });
    tagCredentialsByKey((accessKeyId) => new Date(NOW_MS + (accessKeyId === "LTAI-first" ? 1000 : HOUR_MS)).toISOString());
    await run(listAction, dataSource, i18n("en"));
    await run(listAction, dataSourceB, i18n("en"));
    jest.setSystemTime(NOW_MS + 1001);
    await run(listAction, dataSource, i18n("en"));
    await run(listAction, dataSourceB, i18n("en"));
    expect(mockOss.stsOptions.map((o) => o.accessKeyId)).toEqual(["LTAI-first", "LTAI-second", "LTAI-first"]);
  });

  test("refreshSTSToken answers with the client's own data source credentials", async () => {
    const { run, i18n } = load();
    mockOss.listV2.mockResolvedValue({ objects: [] });
    tagCredentialsByKey();
    await run(listAction, dataSource, i18n("en"));
    await run(listAction, dataSourceB, i18n("en"));
    expect(await mockOss.ossOptions[0].refreshSTSToken()).toEqual({
      accessKeyId: "sts-ak-LTAI-first",
      accessKeySecret: "sts-secret-LTAI-first",
      stsToken: "sts-token-LTAI-first",
    });
    expect(mockOss.assumeRole).toHaveBeenCalledTimes(2);
  });

  test("a login removes every credential that has expired, including other data sources'", async () => {
    jest.useFakeTimers({ now: NOW_MS, doNotFake: [...FAKE_TIMER_KEEP_REAL] });
    const { run, i18n, stsCredentialCacheSize } = load();
    mockOss.listV2.mockResolvedValue({ objects: [] });
    tagCredentialsByKey((accessKeyId) => new Date(NOW_MS + (accessKeyId === "LTAI-first" ? 1000 : HOUR_MS)).toISOString());
    await run(listAction, dataSource, i18n("en"));
    await run(listAction, dataSourceB, i18n("en"));
    expect(stsCredentialCacheSize()).toBe(2);
    jest.setSystemTime(NOW_MS + 1000); // the Expiration instant of the first data source
    await run(listAction, dataSourceB, i18n("en"));
    expect(mockOss.assumeRole).toHaveBeenCalledTimes(2);
    expect(mockOss.ossOptions[2].stsToken).toBe("sts-token-LTAI-second");
    expect(stsCredentialCacheSize()).toBe(1);
  });

  test("a changed STS endpoint with the same key, secret and ARN logs in again", async () => {
    const { run, i18n } = load();
    mockOss.listV2.mockResolvedValue({ objects: [] });
    await run(listAction, { ...dataSource, endpointUrl: "sts.cn-hangzhou.aliyuncs.com" }, i18n("en"));
    await run(listAction, { ...dataSource, endpointUrl: "sts.cn-beijing.aliyuncs.com" }, i18n("en"));
    expect(mockOss.assumeRole).toHaveBeenCalledTimes(2);
  });

  test("a credential with a malformed Expiration is never reused", async () => {
    const { run, i18n, stsCredentialCacheSize } = load();
    mockOss.listV2.mockResolvedValue({ objects: [] });
    mockOss.assumeRole.mockImplementation(async () => credentials("bad", "not-a-date"));
    await run(listAction, dataSource, i18n("en"));
    await run(listAction, dataSource, i18n("en"));
    expect(mockOss.assumeRole).toHaveBeenCalledTimes(2);
    expect(stsCredentialCacheSize()).toBe(1);
  });

  test("B37: the STS endpoint setting is used", async () => {
    const { run, i18n } = load();
    mockOss.listV2.mockResolvedValue({ objects: [] });
    const outcome = await settle(
      run({ actionName: "listObjects", bucket: BUCKET }, { ...dataSource, endpointUrl: "sts.cn-beijing.aliyuncs.com" }, i18n("en"))
    );
    expect(outcome).toEqual({ ok: [] });
    expect(String(mockOss.stsOptions[0]?.endpoint)).toContain("sts.cn-beijing.aliyuncs.com");
  });

  test.each([
    ["a scheme-less host gets https://", "sts.cn-beijing.aliyuncs.com", "https://sts.cn-beijing.aliyuncs.com"],
    ["an https URL is kept", "https://sts.cn-shanghai.aliyuncs.com", "https://sts.cn-shanghai.aliyuncs.com"],
    ["an http URL is kept", "http://127.0.0.1:8080", "http://127.0.0.1:8080"],
    ["an empty value leaves the ali-oss default", "", undefined],
    ["a blank value leaves the ali-oss default", "   ", undefined],
    ["surrounding blanks are trimmed", "  sts.cn-beijing.aliyuncs.com  ", "https://sts.cn-beijing.aliyuncs.com"],
  ])("B37 endpoint: %s", async (_title, endpointUrl, expected) => {
    const { run, i18n } = load();
    mockOss.listV2.mockResolvedValue({ objects: [] });
    await run({ actionName: "listObjects", bucket: BUCKET }, { ...dataSource, endpointUrl }, i18n("en"));
    expect(mockOss.stsOptions).toHaveLength(1);
    expect(mockOss.stsOptions[0].endpoint).toBe(expected);
  });
});

describe("run", () => {
  test("useBucket is called with the action's bucket", async () => {
    const { run, i18n } = load();
    mockOss.listV2.mockResolvedValue({ objects: [] });
    await run({ actionName: "listObjects", bucket: BUCKET }, dataSource, i18n("en"));
    expect(mockOss.useBucket).toHaveBeenCalledWith(BUCKET);
  });

  test("listObjects without a bucket: a 400 ServiceError with the i18n message (en and zh)", async () => {
    const { run, i18n, ServiceError } = load();
    const en = await run({ actionName: "listObjects", bucket: "" }, dataSource, i18n("en")).catch((e) => e);
    expect(en).toBeInstanceOf(ServiceError);
    expect(en.code).toBe(STATUS_BAD_REQUEST);
    expect(en.message).toBe(BUCKET_REQUIRED_EN);
    const zh = await run({ actionName: "listObjects", bucket: "" }, dataSource, i18n("zh")).catch((e) => e);
    expect(zh.code).toBe(STATUS_BAD_REQUEST);
    expect(zh.message).toBe(BUCKET_REQUIRED_ZH);
    expect(mockOss.listV2).not.toHaveBeenCalled();
  });

  test("listObjects forwards prefix and delimiter; max-keys is '100' without a limit and String(limit) with one", async () => {
    const { run, i18n } = load();
    mockOss.listV2.mockResolvedValue({ objects: [] });
    await run({ actionName: "listObjects", bucket: BUCKET, prefix: "p/", delimiter: "/" }, dataSource, i18n("en"));
    await run({ actionName: "listObjects", bucket: BUCKET, prefix: "p/", delimiter: "/", limit: 25 }, dataSource, i18n("en"));
    expect(mockOss.listV2.mock.calls[0][0]).toEqual({ prefix: "p/", delimiter: "/", "max-keys": DEFAULT_MAX_KEYS });
    expect(mockOss.listV2.mock.calls[1][0]).toEqual({ prefix: "p/", delimiter: "/", "max-keys": "25" });
  });

  test("a limit of 0 is sent as '0', not replaced by the default", async () => {
    const { run, i18n } = load();
    mockOss.listV2.mockResolvedValue({ objects: [] });
    await run({ actionName: "listObjects", bucket: BUCKET, limit: 0 }, dataSource, i18n("en"));
    expect(mockOss.listV2.mock.calls[0][0]["max-keys"]).toBe("0");
  });

  test("listObjects maps objects (name falls back to ''); objects undefined gives []", async () => {
    const { run, i18n } = load();
    const modified = "2025-01-01T00:00:00.000Z";
    mockOss.listV2.mockResolvedValueOnce({
      objects: [
        { name: "a.txt", size: 3, lastModified: modified, etag: '"e1"', url: "https://oss.test/a.txt", extra: "dropped" },
        { size: 1 },
      ],
    });
    mockOss.listV2.mockResolvedValueOnce({});
    const res = await run({ actionName: "listObjects", bucket: BUCKET }, dataSource, i18n("en"));
    expect(res).toEqual([
      { name: "a.txt", size: 3, lastModified: modified, etag: '"e1"', url: "https://oss.test/a.txt" },
      { name: "", size: 1, lastModified: undefined, etag: undefined, url: undefined },
    ]);
    expect(await run({ actionName: "listObjects", bucket: BUCKET }, dataSource, i18n("en"))).toEqual([]);
  });

  test("uploadData streams the base64-decoded data and returns the signatureUrl", async () => {
    const { run, i18n } = load();
    const content = "héllo wörld";
    let streamed = Buffer.alloc(0);
    mockOss.putStream.mockImplementation(async (_name: string, stream: Readable) => {
      const chunks: Buffer[] = [];
      for await (const chunk of stream) chunks.push(Buffer.from(chunk));
      streamed = Buffer.concat(chunks);
      return { name: _name };
    });
    mockOss.signatureUrl.mockReturnValue("https://oss.test/signed/up.txt?sig=1");
    const res = await run(
      { actionName: "uploadData", bucket: BUCKET, fileName: "up.txt", data: Buffer.from(content).toString("base64") },
      dataSource,
      i18n("en")
    );
    expect(mockOss.putStream).toHaveBeenCalledTimes(1);
    expect(mockOss.putStream.mock.calls[0][0]).toBe("up.txt");
    expect(mockOss.putStream.mock.calls[0][1]).toBeInstanceOf(Readable);
    expect(streamed.toString("utf8")).toBe(content);
    expect(mockOss.signatureUrl).toHaveBeenCalledWith("up.txt");
    expect(res).toEqual({ fileName: "up.txt", url: "https://oss.test/signed/up.txt?sig=1" });
  });

  test("an action without a bucket key selects the empty bucket", async () => {
    const { run, i18n } = load();
    expect(await run({ actionName: "unknown" }, dataSource, i18n("en"))).toBeUndefined();
    expect(mockOss.useBucket).toHaveBeenCalledWith("");
  });

  test("an unknown action gives undefined (after the bucket was selected)", async () => {
    const { run, i18n } = load();
    expect(await run({ actionName: "deleteFile", bucket: BUCKET, fileName: "x" }, dataSource, i18n("en"))).toBeUndefined();
    expect(mockOss.useBucket).toHaveBeenCalledWith(BUCKET);
    expect(mockOss.listV2).not.toHaveBeenCalled();
    expect(mockOss.putStream).not.toHaveBeenCalled();
  });
});

describe("plugin run (index.ts)", () => {
  test("any error is wrapped as a 400 ServiceError with the original message", async () => {
    const { plugin, ServiceError } = load();
    mockOss.assumeRole.mockRejectedValue(new Error("sts exploded"));
    const err = await plugin
      .run({ actionName: "listObjects", bucket: BUCKET }, dataSource, { languages: ["en"] })
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ServiceError);
    expect(err.code).toBe(STATUS_BAD_REQUEST);
    expect(err.message).toBe("sts exploded");
  });

  test("a missing bucket reaches the caller as a 400 with the message of the ctx language", async () => {
    const { plugin } = load();
    const err = await plugin.run({ actionName: "listObjects", bucket: "" }, dataSource, { languages: ["zh"] }).catch((e: unknown) => e);
    expect(err.code).toBe(STATUS_BAD_REQUEST);
    expect(err.message).toBe(BUCKET_REQUIRED_ZH);
  });

  test("a successful action returns its result", async () => {
    const { plugin } = load();
    mockOss.listV2.mockResolvedValue({ objects: [{ name: "k" }] });
    const res = await plugin.run({ actionName: "listObjects", bucket: BUCKET }, dataSource, { languages: ["en"] });
    expect(res).toEqual([{ name: "k", size: undefined, lastModified: undefined, etag: undefined, url: undefined }]);
  });

  test("validateDataSourceConfig is delegated to the plugin run module", async () => {
    const { plugin } = load();
    expect(await plugin.validateDataSourceConfig(dataSource)).toEqual({ success: true });
  });

  test("the plugin identity: id, name, category", () => {
    const { plugin } = load();
    expect(plugin.id).toBe("oss");
    expect(plugin.name).toBe("OSS");
    expect(plugin.category).toBe("Assets");
  });
});

describe("validateDataSourceConfig", () => {
  test("a healthy configuration validates as success, and STS was actually contacted with the data source's key and ARN", async () => {
    const { validateDataSourceConfig } = load();
    expect(await validateDataSourceConfig(dataSource)).toEqual({ success: true });
    // validation must exercise the credentials: a stub returning {success:true} never reaches STS
    expect(mockOss.stsOptions).toEqual([
      { accessKeyId: dataSource.accessKeyId, accessKeySecret: dataSource.accessKeySecret, endpoint: "https://sts.cn-hangzhou.aliyuncs.com" },
    ]);
    expect(mockOss.assumeRole).toHaveBeenCalledWith(ARN, "", STS_DURATION_SECONDS, STS_SESSION_NAME);
  });

  test("B12: a failing STS validates as failure", async () => {
    const { validateDataSourceConfig } = load();
    mockOss.assumeRole.mockRejectedValue(new Error(STS_FAILURE));
    expect(await validateDataSourceConfig(dataSource)).toEqual({ success: false, message: expect.stringContaining(STS_FAILURE) });
  });

  test("a second account with a failing key validates as failure after a first account was cached", async () => {
    const { validateDataSourceConfig } = load();
    expect(await validateDataSourceConfig(dataSource)).toEqual({ success: true });
    mockOss.assumeRole.mockRejectedValue(new Error(STS_FAILURE));
    const second = { ...dataSource, accessKeyId: "LTAI-second", accessKeySecret: "secret-second" };
    expect(await validateDataSourceConfig(second)).toEqual({ success: false, message: expect.stringContaining(STS_FAILURE) });
  });

  test("the plugin's validateDataSourceConfig reports the failure", async () => {
    const { plugin } = load();
    mockOss.assumeRole.mockRejectedValue(new Error(STS_FAILURE));
    expect(await plugin.validateDataSourceConfig(dataSource)).toEqual({ success: false, message: expect.stringContaining(STS_FAILURE) });
  });
});
