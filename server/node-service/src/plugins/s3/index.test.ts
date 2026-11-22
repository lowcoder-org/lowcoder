import { DeleteObjectCommand, ListBucketsCommand, S3Client, S3ServiceException } from "@aws-sdk/client-s3";
import { ServiceError } from "../../common/error";
import s3Plugin from "./index";

/** s3 plugin factory: localization, the config handed to the UI, and the error mapping of `run`. */

const STATUS_BAD_REQUEST = 400;
const SPEC_VERSION = "V1.0";
const EXPECTED_ACTIONS = ["listBuckets", "listObjects", "readFile", "uploadData", "deleteFile"];
const dataSource = { accessKey: "AK", secretKey: "SK", endpointUrl: "", region: "us-west-2", specVersion: SPEC_VERSION };

const ctx = (languages: string[]) => ({ languages } as any);
const plugin = (languages: string[]) => (s3Plugin as any)(ctx(languages));

let sendSpy: jest.SpyInstance;
afterEach(() => {
  sendSpy?.mockRestore();
});

describe("s3 plugin factory", () => {
  test("localizes name and description per language", () => {
    const en = plugin(["en"]);
    const zh = plugin(["zh"]);
    expect(en.id).toBe("s3");
    expect(zh.id).toBe("s3");
    expect(en.name).toBe("AWS S3");
    expect(zh.name).toBe("S3");
    expect(en.description).toBe("Supports AWS S3 and object storage services that support S3");
    expect(zh.description).toBe("支持 AWS S3 以及支持 S3 协议的对象存储服务");
    expect(en.category).toBe("Assets");
  });

  test("queryConfig({specVersion}) returns the five storage actions", async () => {
    const config = await plugin(["en"]).queryConfig({ specVersion: SPEC_VERSION });
    expect(config.type).toBe("query");
    expect(config.actions.map((a: any) => a.actionName)).toEqual(EXPECTED_ACTIONS);
  });

  test("the data source config offers the plugin's spec version", () => {
    const options = plugin(["en"]).dataSourceConfig.params.find((p: any) => p.key === "specVersion").options;
    expect(options.map((o: any) => o.value)).toEqual([SPEC_VERSION]);
  });
});

describe("s3 plugin validateDataSourceConfig", () => {
  test("delegates to the s3 validation (ListBuckets through the client)", async () => {
    sendSpy = jest.spyOn(S3Client.prototype, "send").mockImplementation((async (command: any) => {
      expect(command).toBeInstanceOf(ListBucketsCommand);
      return { Buckets: [] };
    }) as any);
    expect(await plugin(["en"]).validateDataSourceConfig(dataSource)).toEqual({ success: true });
    expect(sendSpy).toHaveBeenCalledTimes(1);
  });
});

describe("s3 plugin run error mapping", () => {
  const deleteAction = { actionName: "deleteFile", bucket: "b", fileName: "f" };

  test("an S3ServiceException becomes a ServiceError with code 400 and the same message", async () => {
    sendSpy = jest.spyOn(S3Client.prototype, "send").mockImplementation((async () => {
      throw new S3ServiceException({ name: "NoSuchBucket", $fault: "client", $metadata: {}, message: "no such bucket" });
    }) as any);
    const err = await plugin(["en"]).run(deleteAction, dataSource, ctx(["en"])).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ServiceError);
    expect((err as ServiceError).code).toBe(STATUS_BAD_REQUEST);
    expect((err as ServiceError).message).toBe("no such bucket");
  });

  test("any other error passes through unchanged", async () => {
    const failure = new RangeError("not an s3 error");
    sendSpy = jest.spyOn(S3Client.prototype, "send").mockImplementation((async () => {
      throw failure;
    }) as any);
    await expect(plugin(["en"]).run(deleteAction, dataSource, ctx(["en"]))).rejects.toBe(failure);
  });

  test("a successful action returns the run result", async () => {
    sendSpy = jest.spyOn(S3Client.prototype, "send").mockImplementation((async (command: any) => {
      expect(command).toBeInstanceOf(DeleteObjectCommand);
      return {};
    }) as any);
    expect(await plugin(["en"]).run(deleteAction, dataSource, ctx(["en"]))).toEqual({ success: true });
  });
});
