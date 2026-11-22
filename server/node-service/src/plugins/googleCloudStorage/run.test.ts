import { ApiError } from "@google-cloud/storage/build/src/nodejs-common";
import { ServiceError } from "../../common/error";
import queryConfig from "./queryConfig";
import gcsPlugin from "./index";
import run, { validateDataSourceConfig } from "./run";

/**
 * Google Cloud Storage plugin. Real GCS needs an OAuth token exchange plus a JSON API emulation, so the
 * package entry "@google-cloud/storage" is replaced by a small recording fake of `Storage` (the process
 * boundary). run.ts is real: it maps the action to client calls and shapes the results. The fake
 * records what run.ts sends (bucket, file, options). JSON.parse(privateKey) stays real.
 * The deep import of ApiError above is NOT affected by the mock (only the package entry is replaced).
 */

type Recorded = Record<string, any>;
const mockGcs: {
  ctorOptions: Recorded[];
  getBuckets: jest.Mock;
  getFiles: jest.Mock;
  fileGet: jest.Mock;
  save: jest.Mock;
  del: jest.Mock;
  getSignedUrl: jest.Mock;
} = {
  ctorOptions: [],
  getBuckets: jest.fn(),
  getFiles: jest.fn(),
  fileGet: jest.fn(),
  save: jest.fn(),
  del: jest.fn(),
  getSignedUrl: jest.fn(),
};

jest.mock("@google-cloud/storage", () => ({
  Storage: class FakeStorage {
    constructor(options: Recorded) {
      mockGcs.ctorOptions.push(options);
    }
    getBuckets() {
      return mockGcs.getBuckets();
    }
    bucket(bucketName: string) {
      return {
        getFiles: (options: Recorded) => mockGcs.getFiles(bucketName, options),
        file: (fileName: string) => ({
          get: () => mockGcs.fileGet(bucketName, fileName),
          save: (data: Buffer, options: Recorded) => mockGcs.save(bucketName, fileName, data, options),
          delete: () => mockGcs.del(bucketName, fileName),
          getSignedUrl: (options: Recorded) => mockGcs.getSignedUrl(bucketName, fileName, options),
        }),
      };
    }
  },
}));

const STATUS_BAD_REQUEST = 400;
const STATUS_NOT_FOUND = 404;
const STATUS_FORBIDDEN = 403;
const BUCKET = "my-bucket";
const NOW_MS = 1_700_000_000_000;
const SIGNED_URL_TTL_MS = 5 * 60 * 1000;
const SERVICE_ACCOUNT = { client_email: "svc@project.iam.gserviceaccount.com", private_key: "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n" };
const dataSource = { privateKey: JSON.stringify(SERVICE_ACCOUNT), region: "", specVersion: "" };

type RunArgs = Parameters<typeof run>;
const act = (a: Record<string, unknown>) => a as unknown as RunArgs[0];
const plugin = gcsPlugin as any;

function gcsFile(name: string, metadata: Recorded = {}) {
  return { name, metadata, publicUrl: () => `https://storage.googleapis.com/${BUCKET}/${name}` };
}

beforeEach(() => {
  mockGcs.ctorOptions.length = 0;
  for (const fn of [mockGcs.getBuckets, mockGcs.getFiles, mockGcs.fileGet, mockGcs.save, mockGcs.del, mockGcs.getSignedUrl]) {
    fn.mockReset();
  }
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("client construction", () => {
  test("a privateKey that is not JSON rejects with a SyntaxError before any SDK call", async () => {
    const err = await run(act({ actionName: "listBuckets" }), { ...dataSource, privateKey: "not json" }).catch((e) => e);
    expect(err).toBeInstanceOf(SyntaxError);
    expect(mockGcs.ctorOptions).toHaveLength(0);
    expect(mockGcs.getBuckets).not.toHaveBeenCalled();
  });

  test("the parsed service account is passed as credentials", async () => {
    mockGcs.getBuckets.mockResolvedValue([[]]);
    await run(act({ actionName: "listBuckets" }), dataSource);
    expect(mockGcs.ctorOptions).toEqual([{ credentials: SERVICE_ACCOUNT }]);
  });
});

describe("listBuckets", () => {
  test("gives the bucket names", async () => {
    mockGcs.getBuckets.mockResolvedValue([[{ name: "a" }, { name: "b" }]]);
    expect(await run(act({ actionName: "listBuckets" }), dataSource)).toEqual(["a", "b"]);
  });
});

describe("listObjects", () => {
  test("a missing bucket is a 400 ServiceError and no SDK call is made", async () => {
    const err = await run(act({ actionName: "listObjects", bucket: "" }), dataSource).catch((e) => e);
    expect(err).toBeInstanceOf(ServiceError);
    expect(err.code).toBe(STATUS_BAD_REQUEST);
    expect(err.message).toBe("Bucket is required");
    expect(mockGcs.getFiles).not.toHaveBeenCalled();
  });

  test("prefix, delimiter and maxResults are passed; each file is mapped to name, size, lastModified, publicUrl", async () => {
    mockGcs.getFiles.mockResolvedValue([
      [gcsFile("docs/a.txt", { size: "12", updated: "2024-01-01T00:00:00Z" }), gcsFile("docs/b.txt", { size: "7", updated: "2024-02-02T00:00:00Z" })],
    ]);
    const res = await run(act({ actionName: "listObjects", bucket: BUCKET, prefix: "docs/", delimiter: "/", limit: 2 }), dataSource);
    expect(mockGcs.getFiles).toHaveBeenCalledWith(BUCKET, { prefix: "docs/", delimiter: "/", maxResults: 2 });
    expect(res).toEqual([
      { name: "docs/a.txt", size: "12", lastModified: "2024-01-01T00:00:00Z", signedUrl: "", url: `https://storage.googleapis.com/${BUCKET}/docs/a.txt` },
      { name: "docs/b.txt", size: "7", lastModified: "2024-02-02T00:00:00Z", signedUrl: "", url: `https://storage.googleapis.com/${BUCKET}/docs/b.txt` },
    ]);
    expect(mockGcs.getSignedUrl).not.toHaveBeenCalled();
  });

  test("returnSignedUrl signs each file: version v2, action read, expiry 5 minutes after now", async () => {
    jest.spyOn(Date, "now").mockReturnValue(NOW_MS);
    mockGcs.getFiles.mockResolvedValue([[gcsFile("a.txt"), gcsFile("b.txt")]]);
    mockGcs.getSignedUrl.mockImplementation(async (_b: string, file: string) => [`https://signed.test/${file}`]);
    const res: any = await run(act({ actionName: "listObjects", bucket: BUCKET, returnSignedUrl: true }), dataSource);
    expect(res.map((f: any) => f.signedUrl)).toEqual(["https://signed.test/a.txt", "https://signed.test/b.txt"]);
    expect(mockGcs.getSignedUrl).toHaveBeenCalledTimes(2);
    expect(mockGcs.getSignedUrl).toHaveBeenNthCalledWith(1, BUCKET, "a.txt", {
      version: "v2",
      action: "read",
      expires: NOW_MS + SIGNED_URL_TTL_MS,
    });
  });
});

describe("readFile", () => {
  function fileWithContent(content: Buffer, contentType: string) {
    mockGcs.fileGet.mockResolvedValue([{ download: async () => [content], metadata: { contentType } }]);
  }

  test("default encoding is base64; contentType comes from the metadata; the right bucket and file are read", async () => {
    fileWithContent(Buffer.from("héllo"), "text/plain");
    const res = await run(act({ actionName: "readFile", bucket: BUCKET, fileName: "dir/f.txt" }), dataSource);
    expect(mockGcs.fileGet).toHaveBeenCalledWith(BUCKET, "dir/f.txt");
    expect(res).toEqual({ data: Buffer.from("héllo").toString("base64"), contentType: "text/plain" });
  });

  test("a requested encoding is used", async () => {
    fileWithContent(Buffer.from("héllo"), "text/plain");
    const res: any = await run(act({ actionName: "readFile", bucket: BUCKET, fileName: "f", encoding: "utf8" }), dataSource);
    expect(res.data).toBe("héllo");
  });
});

describe("uploadData", () => {
  const original = "héllo wörld";

  test("saves the base64-decoded buffer with the contentType; signedUrl is '' when not asked", async () => {
    mockGcs.save.mockResolvedValue(undefined);
    const res = await run(
      act({ actionName: "uploadData", bucket: BUCKET, fileName: "up.txt", data: Buffer.from(original).toString("base64"), contentType: "text/plain" }),
      dataSource
    );
    expect(mockGcs.save).toHaveBeenCalledTimes(1);
    const [bucket, file, data, options] = mockGcs.save.mock.calls[0];
    expect([bucket, file]).toEqual([BUCKET, "up.txt"]);
    expect(Buffer.isBuffer(data)).toBe(true);
    expect(data.toString("utf8")).toBe(original);
    expect(options).toEqual({ contentType: "text/plain" });
    expect(res).toEqual({ fileName: "up.txt", signedUrl: "" });
    expect(mockGcs.getSignedUrl).not.toHaveBeenCalled();
  });

  test("encoding utf8 saves the text bytes", async () => {
    mockGcs.save.mockResolvedValue(undefined);
    await run(act({ actionName: "uploadData", bucket: BUCKET, fileName: "u.txt", data: original, encoding: "utf8", contentType: "text/plain" }), dataSource);
    expect(mockGcs.save.mock.calls[0][2]).toEqual(Buffer.from(original, "utf8"));
  });

  test("returnSignedUrl returns the signed url of the uploaded file", async () => {
    mockGcs.save.mockResolvedValue(undefined);
    mockGcs.getSignedUrl.mockResolvedValue(["https://signed.test/s.txt"]);
    const res: any = await run(
      act({ actionName: "uploadData", bucket: BUCKET, fileName: "s.txt", data: "QQ==", contentType: "text/plain", returnSignedUrl: true }),
      dataSource
    );
    expect(res.signedUrl).toBe("https://signed.test/s.txt");
    expect(mockGcs.getSignedUrl).toHaveBeenCalledWith(BUCKET, "s.txt", expect.objectContaining({ version: "v2", action: "read" }));
  });
});

describe("deleteFile and unknown actions", () => {
  test("deleteFile deletes the file and gives {success: true}", async () => {
    mockGcs.del.mockResolvedValue(undefined);
    expect(await run(act({ actionName: "deleteFile", bucket: BUCKET, fileName: "d.txt" }), dataSource)).toEqual({ success: true });
    expect(mockGcs.del).toHaveBeenCalledWith(BUCKET, "d.txt");
  });

  test("an unknown action gives undefined", async () => {
    expect(await run(act({ actionName: "nope", bucket: BUCKET }), dataSource)).toBeUndefined();
  });
});

describe("validateDataSourceConfig", () => {
  test("success lists the buckets and gives {success: true}", async () => {
    mockGcs.getBuckets.mockResolvedValue([[]]);
    expect(await validateDataSourceConfig(dataSource)).toEqual({ success: true });
    expect(mockGcs.getBuckets).toHaveBeenCalledTimes(1);
  });

  test("an error is re-thrown", async () => {
    const failure = new Error("invalid_grant");
    mockGcs.getBuckets.mockRejectedValue(failure);
    await expect(validateDataSourceConfig(dataSource)).rejects.toBe(failure);
  });
});

describe("plugin (index.ts)", () => {
  test("queryConfig without a spec version gives the default config", async () => {
    expect(await plugin.queryConfig({})).toBe(queryConfig);
    expect(await plugin.queryConfig({ specVersion: "v1.0" })).toBe(queryConfig);
  });

  test("validateDataSourceConfig is delegated", async () => {
    mockGcs.getBuckets.mockResolvedValue([[]]);
    expect(await plugin.validateDataSourceConfig(dataSource)).toEqual({ success: true });
  });

  test("run returns the action result", async () => {
    mockGcs.getBuckets.mockResolvedValue([[{ name: "a" }]]);
    expect(await plugin.run(act({ actionName: "listBuckets" }), dataSource, { languages: ["en"] })).toEqual(["a"]);
  });

  test("a plain Error passes through unchanged", async () => {
    const failure = new Error("plain failure");
    mockGcs.getBuckets.mockRejectedValue(failure);
    await expect(plugin.run(act({ actionName: "listBuckets" }), dataSource, { languages: ["en"] })).rejects.toBe(failure);
  });

  test("B17: a GCS service error becomes a 400 ServiceError, as in the s3 plugin", async () => {
    mockGcs.getFiles.mockRejectedValue(new ApiError({ code: STATUS_NOT_FOUND, message: "No such bucket" } as any));
    const err = await plugin
      .run(act({ actionName: "listObjects", bucket: BUCKET }), dataSource, { languages: ["en"] })
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ServiceError);
    expect(err.code).toBe(STATUS_BAD_REQUEST);
    expect(err.message).toBe("No such bucket");
  });

  test("a 403 ApiError on listBuckets is also a 400 with the GCS message", async () => {
    mockGcs.getBuckets.mockRejectedValue(new ApiError({ code: STATUS_FORBIDDEN, message: "Forbidden" } as any));
    const err = await plugin.run(act({ actionName: "listBuckets" }), dataSource, { languages: ["en"] }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ServiceError);
    expect(err.code).toBe(STATUS_BAD_REQUEST);
    expect(err.message).toBe("Forbidden");
  });

  test("an ApiError built from a plain message is a 400 with that message", async () => {
    mockGcs.getBuckets.mockRejectedValue(new ApiError("quota exceeded"));
    const err = await plugin.run(act({ actionName: "listBuckets" }), dataSource, { languages: ["en"] }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ServiceError);
    expect(err.code).toBe(STATUS_BAD_REQUEST);
    expect(err.message).toBe("quota exceeded");
  });
});
