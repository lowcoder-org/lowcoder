import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListBucketsCommand,
  ListObjectsCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { ServiceError } from "../../common/error";
import getI18nTranslator from "./i18n";
import run, { validateDataSourceConfig } from "./run";

/**
 * s3 plugin: the SDK boundary is S3Client.prototype.send. The fake records every command's input and
 * the client configuration it was sent through, and answers per command class. Presigning
 * (getSignedUrl) is NOT faked: it is offline signing, so the signed URL is checked for real.
 */

const STATUS_BAD_REQUEST = 400;
const REGION = "us-west-2";
const ACCESS_KEY = "AKIATESTKEY";
const SECRET_KEY = "test-secret-key";
const BUCKET = "lowcoder-demo";
const OTHER_BUCKET = "other-bucket";
const FILE_KEY = "folder/report one.txt";
const SIGNED_URL_EXPIRES_SECONDS = "300";
const ENDPOINT_URL = "http://127.0.0.1:9000";
const DEFAULT_ENCODING = "base64";
const BUCKET_REQUIRED_EN = "Bucket is required";
const FIXED_DATE = new Date("2024-01-02T03:04:05.000Z");

const baseDataSource = {
  accessKey: ACCESS_KEY,
  secretKey: SECRET_KEY,
  endpointUrl: "",
  region: REGION,
  specVersion: "",
};
const i18nEn = getI18nTranslator(["en"]);
const i18nZh = getI18nTranslator(["zh"]);

type RunArgs = Parameters<typeof run>;
const act = (a: Record<string, unknown>) => a as unknown as RunArgs[0];

type Sent = { command: object; input: any; region?: string; endpoint?: { hostname: string; port?: number; protocol: string } };
type Responder = (command: any) => any;

let sent: Sent[];
let responders: Map<Function, Responder>;
let sendSpy: jest.SpyInstance;

function respondTo(commandClass: Function, responder: Responder) {
  responders.set(commandClass, responder);
}

beforeEach(() => {
  sent = [];
  responders = new Map();
  sendSpy = jest.spyOn(S3Client.prototype, "send").mockImplementation(async function (this: S3Client, command: any) {
    const config: any = this.config;
    const region = typeof config.region === "function" ? await config.region() : config.region;
    const endpoint = typeof config.endpoint === "function" ? await config.endpoint() : undefined;
    sent.push({ command, input: command.input, region, endpoint });
    const responder = responders.get(command.constructor);
    if (!responder) {
      throw new Error(`unexpected command ${command.constructor.name}`);
    }
    return responder(command);
  } as any);
});

afterEach(() => {
  sendSpy.mockRestore();
});

describe("listBuckets", () => {
  test("maps Buckets to [{name}] and sends a ListBucketsCommand through a client built from the data source", async () => {
    respondTo(ListBucketsCommand, () => ({ Buckets: [{ Name: "a", CreationDate: FIXED_DATE }, { Name: "b" }] }));
    const res = await run(act({ actionName: "listBuckets" }), baseDataSource, i18nEn);
    expect(res).toEqual([{ name: "a" }, { name: "b" }]);
    expect(sent).toHaveLength(1);
    expect(sent[0].command).toBeInstanceOf(ListBucketsCommand);
    expect(sent[0].input).toEqual({});
    expect(sent[0].region).toBe(REGION);
    expect(sent[0].endpoint).toBeUndefined();
  });

  test("a response without Buckets gives undefined", async () => {
    respondTo(ListBucketsCommand, () => ({}));
    expect(await run(act({ actionName: "listBuckets" }), baseDataSource, i18nEn)).toBeUndefined();
  });

  test("a non-empty endpointUrl is passed to the client", async () => {
    respondTo(ListBucketsCommand, () => ({ Buckets: [] }));
    await run(act({ actionName: "listBuckets" }), { ...baseDataSource, endpointUrl: ENDPOINT_URL }, i18nEn);
    expect(sent[0].endpoint).toMatchObject({ hostname: "127.0.0.1", port: 9000, protocol: "http:" });
  });
});

describe("listObjects", () => {
  test("without a bucket: 400 ServiceError with the i18n message, en and zh, and nothing is sent", async () => {
    const action = act({ actionName: "listObjects", bucket: "" });
    const en = await run(action, baseDataSource, i18nEn).catch((e) => e);
    expect(en).toBeInstanceOf(ServiceError);
    expect(en.code).toBe(STATUS_BAD_REQUEST);
    expect(en.message).toBe(BUCKET_REQUIRED_EN);
    const zh = await run(action, baseDataSource, i18nZh).catch((e) => e);
    expect(zh).toBeInstanceOf(ServiceError);
    expect(zh.code).toBe(STATUS_BAD_REQUEST);
    // the zh table currently carries the English text; the message must still come from the translator
    expect(zh.message).toBe(i18nZh.trans("messages.bucketRequired"));
    expect(sent).toHaveLength(0);
  });

  test("Prefix, Delimiter, MaxKeys and Bucket come from the action", async () => {
    respondTo(ListObjectsCommand, () => ({ Contents: [] }));
    await run(
      act({ actionName: "listObjects", bucket: OTHER_BUCKET, prefix: "pre/", delimiter: "/", limit: 7 }),
      baseDataSource,
      i18nEn
    );
    expect(sent[0].command).toBeInstanceOf(ListObjectsCommand);
    expect(sent[0].input).toEqual({ Prefix: "pre/", Bucket: OTHER_BUCKET, Delimiter: "/", MaxKeys: 7 });
  });

  test("Contents undefined gives []", async () => {
    respondTo(ListObjectsCommand, () => ({}));
    expect(await run(act({ actionName: "listObjects", bucket: BUCKET }), baseDataSource, i18nEn)).toEqual([]);
  });

  test("maps each object; the url is derived and signedUrl is empty when not asked", async () => {
    respondTo(ListObjectsCommand, () => ({ Contents: [{ Key: "a.txt", Size: 5, LastModified: FIXED_DATE }] }));
    const res = await run(act({ actionName: "listObjects", bucket: BUCKET, returnSignedUrl: false }), baseDataSource, i18nEn);
    expect(res).toEqual([
      {
        name: "a.txt",
        size: 5,
        lastModified: FIXED_DATE,
        signedUrl: "",
        url: `https://s3.${REGION}.amazonaws.com/${BUCKET}/a.txt`,
      },
    ]);
  });

  test("an item without Key gives name '' and url '', and is not signed even with returnSignedUrl", async () => {
    respondTo(ListObjectsCommand, () => ({ Contents: [{ Size: 1 }] }));
    const res: any = await run(act({ actionName: "listObjects", bucket: BUCKET, returnSignedUrl: true }), baseDataSource, i18nEn);
    expect(res).toHaveLength(1);
    expect(res[0].name).toBe("");
    expect(res[0].url).toBe("");
    expect(res[0].signedUrl).toBe("");
  });

  test("returnSignedUrl gives a real presigned GET URL for the bucket and key, valid 300 seconds", async () => {
    respondTo(ListObjectsCommand, () => ({ Contents: [{ Key: FILE_KEY }] }));
    const res: any = await run(act({ actionName: "listObjects", bucket: BUCKET, returnSignedUrl: true }), baseDataSource, i18nEn);
    const signed = new URL(res[0].signedUrl);
    expect(signed.hostname).toBe(`${BUCKET}.s3.${REGION}.amazonaws.com`);
    expect(decodeURIComponent(signed.pathname)).toBe(`/${FILE_KEY}`);
    expect(signed.searchParams.get("X-Amz-Expires")).toBe(SIGNED_URL_EXPIRES_SECONDS);
    expect(signed.searchParams.get("X-Amz-Credential")).toContain(`${ACCESS_KEY}/`);
    expect(signed.searchParams.get("X-Amz-Credential")).toContain(`/${REGION}/s3/`);
    expect(signed.searchParams.get("X-Amz-Signature")).toMatch(/^[0-9a-f]{64}$/);
    // presigning is offline: only the list command went through send
    expect(sent).toHaveLength(1);
  });
});

describe("getFileUrl through listObjects", () => {
  test("with endpointUrl the url is <endpoint>/<bucket>/<key>", async () => {
    respondTo(ListObjectsCommand, () => ({ Contents: [{ Key: "k.bin" }] }));
    const res: any = await run(
      act({ actionName: "listObjects", bucket: BUCKET }),
      { ...baseDataSource, endpointUrl: ENDPOINT_URL },
      i18nEn
    );
    expect(res[0].url).toBe(`${ENDPOINT_URL}/${BUCKET}/k.bin`);
  });

  test("without endpointUrl the url is https://s3.<region>.amazonaws.com/<bucket>/<key>", async () => {
    respondTo(ListObjectsCommand, () => ({ Contents: [{ Key: "k.bin" }] }));
    const res: any = await run(act({ actionName: "listObjects", bucket: BUCKET }), baseDataSource, i18nEn);
    expect(res[0].url).toBe(`https://s3.${REGION}.amazonaws.com/${BUCKET}/k.bin`);
  });
});

describe("readFile", () => {
  function bodyFake(text: string) {
    return { transformToString: jest.fn(async (_encoding?: string) => text) };
  }

  test("default encoding is base64; contentType, length and lastModified pass through", async () => {
    const body = bodyFake("QUJD");
    respondTo(GetObjectCommand, () => ({ Body: body, ContentType: "text/plain", ContentLength: 3, LastModified: FIXED_DATE }));
    const res = await run(act({ actionName: "readFile", bucket: BUCKET, fileName: FILE_KEY }), baseDataSource, i18nEn);
    expect(sent[0].command).toBeInstanceOf(GetObjectCommand);
    expect(sent[0].input).toEqual({ Bucket: BUCKET, Key: FILE_KEY });
    expect(body.transformToString).toHaveBeenCalledWith(DEFAULT_ENCODING);
    expect(res).toEqual({ contentType: "text/plain", length: 3, lastModified: FIXED_DATE, data: "QUJD" });
  });

  test("a custom encoding is passed to transformToString", async () => {
    const body = bodyFake("ABC");
    respondTo(GetObjectCommand, () => ({ Body: body }));
    const res: any = await run(act({ actionName: "readFile", bucket: BUCKET, fileName: "x", encoding: "utf8" }), baseDataSource, i18nEn);
    expect(body.transformToString).toHaveBeenCalledWith("utf8");
    expect(res.data).toBe("ABC");
  });

  test("Body undefined gives data ''", async () => {
    respondTo(GetObjectCommand, () => ({ ContentType: "x/y" }));
    const res: any = await run(act({ actionName: "readFile", bucket: BUCKET, fileName: "x" }), baseDataSource, i18nEn);
    expect(res.data).toBe("");
    expect(res.contentType).toBe("x/y");
  });
});

describe("uploadData", () => {
  const original = "héllo wörld";

  test("base64 default: Body is the decoded Buffer, ContentType is passed, signedUrl is '' and url is computed", async () => {
    respondTo(PutObjectCommand, () => ({}));
    const res = await run(
      act({
        actionName: "uploadData",
        bucket: BUCKET,
        fileName: "up.txt",
        data: Buffer.from(original).toString("base64"),
        contentType: "text/plain",
      }),
      baseDataSource,
      i18nEn
    );
    const input = sent[0].input;
    expect(sent[0].command).toBeInstanceOf(PutObjectCommand);
    expect(Buffer.isBuffer(input.Body)).toBe(true);
    expect(input.Body.toString("utf8")).toBe(original);
    expect(input).toMatchObject({ Bucket: BUCKET, Key: "up.txt", ContentType: "text/plain" });
    expect(res).toEqual({
      fileName: "up.txt",
      signedUrl: "",
      url: `https://s3.${REGION}.amazonaws.com/${BUCKET}/up.txt`,
    });
  });

  test("utf8 encoding: Body is the text bytes", async () => {
    respondTo(PutObjectCommand, () => ({}));
    await run(
      act({ actionName: "uploadData", bucket: BUCKET, fileName: "u.txt", data: original, encoding: "utf8", contentType: "text/plain" }),
      baseDataSource,
      i18nEn
    );
    expect(sent[0].input.Body).toEqual(Buffer.from(original, "utf8"));
  });

  test("returnSignedUrl returns a presigned URL for the uploaded key", async () => {
    respondTo(PutObjectCommand, () => ({}));
    const res: any = await run(
      act({ actionName: "uploadData", bucket: BUCKET, fileName: "s.txt", data: "QQ==", returnSignedUrl: true }),
      baseDataSource,
      i18nEn
    );
    const signed = new URL(res.signedUrl);
    expect(signed.hostname).toBe(`${BUCKET}.s3.${REGION}.amazonaws.com`);
    expect(signed.pathname).toBe("/s.txt");
    expect(signed.searchParams.get("X-Amz-Expires")).toBe(SIGNED_URL_EXPIRES_SECONDS);
  });

  test("with endpointUrl the url uses the endpoint", async () => {
    respondTo(PutObjectCommand, () => ({}));
    const res: any = await run(
      act({ actionName: "uploadData", bucket: BUCKET, fileName: "e.txt", data: "QQ==" }),
      { ...baseDataSource, endpointUrl: ENDPOINT_URL },
      i18nEn
    );
    expect(res.url).toBe(`${ENDPOINT_URL}/${BUCKET}/e.txt`);
  });
});

describe("deleteFile and unknown actions", () => {
  test("deleteFile gives {success: true} and sends the right Bucket and Key", async () => {
    respondTo(DeleteObjectCommand, () => ({}));
    const res = await run(act({ actionName: "deleteFile", bucket: BUCKET, fileName: FILE_KEY }), baseDataSource, i18nEn);
    expect(res).toEqual({ success: true });
    expect(sent[0].command).toBeInstanceOf(DeleteObjectCommand);
    expect(sent[0].input).toEqual({ Bucket: BUCKET, Key: FILE_KEY });
  });

  test("an unknown action gives undefined and sends no command", async () => {
    const res = await run(act({ actionName: "nope", bucket: BUCKET }), baseDataSource, i18nEn);
    expect(res).toBeUndefined();
    expect(sendSpy).not.toHaveBeenCalled();
  });

  test("an SDK error propagates from run unchanged", async () => {
    const failure = new Error("boom");
    respondTo(DeleteObjectCommand, () => {
      throw failure;
    });
    await expect(run(act({ actionName: "deleteFile", bucket: BUCKET, fileName: "x" }), baseDataSource, i18nEn)).rejects.toBe(failure);
  });
});

describe("validateDataSourceConfig", () => {
  test("success gives {success: true} after a ListBucketsCommand", async () => {
    respondTo(ListBucketsCommand, () => ({ Buckets: [] }));
    expect(await validateDataSourceConfig(baseDataSource)).toEqual({ success: true });
    expect(sent[0].command).toBeInstanceOf(ListBucketsCommand);
  });

  test("an S3ServiceException gives {success: false, message}", async () => {
    respondTo(ListBucketsCommand, () => {
      throw new S3ServiceException({ name: "InvalidAccessKeyId", $fault: "client", $metadata: {}, message: "bad key" });
    });
    expect(await validateDataSourceConfig(baseDataSource)).toEqual({ success: false, message: "bad key" });
  });

  test("any other error is re-thrown", async () => {
    const failure = new TypeError("network down");
    respondTo(ListBucketsCommand, () => {
      throw failure;
    });
    await expect(validateDataSourceConfig(baseDataSource)).rejects.toBe(failure);
  });
});
