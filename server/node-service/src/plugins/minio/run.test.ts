import getI18nTranslator from "./i18n";
import run, { validateDataSourceConfig } from "./run";
import { UploadedObjectInfo } from "minio"

const dataSourceConfig = {
  accessKey: "",
  secretKey: "",
  endPoint: "",
  useSSL: true,
  region: "us-east-1",
};

const bucket = "test-for-minio";
const i18n = getI18nTranslator(["en"]);

describe("minio s3 plugin", () => {
  test("validate data source config", async () => {
    const a = await validateDataSourceConfig(dataSourceConfig);
    expect(a.success).toBe(true);

    const b = await validateDataSourceConfig({
      ...dataSourceConfig,
      accessKey: "error ak",
    });
    expect(b.success).toBe(false);
  });

  test("read not existed file", async () => {
    await expect(
      run(
        {
          actionName: "readFile",
          bucket,
          fileName: "not-found.txt",
          encoding: "utf8",
        },
        dataSourceConfig,
        i18n
      )
    ).rejects.toThrow();
  });

  test("crud file", async () => {
    const txtFileName = `ut-${Date.now()}.txt`;
    const binFileName = `bin-ut-${Date.now()}.txt`;
    const fileData = `This is file ${txtFileName}`;
    const binRawFileData = `This is file ${binFileName}`;
    const binFileData = Buffer.from(binRawFileData).toString("base64");

    // upload txt
    const uploadRes = await run(
      {
        actionName: "uploadData",
        fileName: txtFileName,
        encoding: "utf8",
        contentType: "text/plain",
        data: fileData,
        bucket,
      },
      dataSourceConfig,
      i18n
    );
    expect((uploadRes as UploadedObjectInfo)?.etag).not.toBe("");

    // upload bin
    const uploadBinRes = await run(
      {
        actionName: "uploadData",
        fileName: binFileName,
        encoding: "base64",
        contentType: "",
        data: binFileData,
        bucket,
      },
      dataSourceConfig,
      i18n
    );
    expect((uploadBinRes as any)).not.toBe("");

    // list
    const list = await run(
      {
        actionName: "listObjects",
        bucket,
        prefix: txtFileName,
        delimiter: "",
        recursive: true,
        withSignedURL: true,
        signURLTimeout: 900
      },
      dataSourceConfig,
      i18n
    );

    expect((list as any).length).toBeGreaterThan(0);
    expect((list as any).find((i: any) => i.name === txtFileName)).not.toBeUndefined();

    // read txt
    const readRes = await run(
      {
        actionName: "readFile",
        bucket,
        fileName: txtFileName,
        encoding: "utf8",
      },
      dataSourceConfig,
      i18n
    );

    expect((readRes as any).data.toString('utf-8')).toEqual(fileData);

    // read bin
    const readBinRes = await run(
      {
        actionName: "readFile",
        bucket,
        fileName: binFileName,
        encoding: "base64",
      },
      dataSourceConfig,
      i18n
    );
    const data = (readBinRes as any).data.toString('base64')
    expect(data).toEqual(binFileData);



    // get file url
    const fileURLRes = await run(
      {
        actionName: "getURL",
        bucket,
        fileName: txtFileName,
        signURLTimeout: 900,
      },
      dataSourceConfig,
      i18n
    );
    expect(fileURLRes.length).toBeGreaterThan(0)

    // delete
    const delRes = await run(
      {
        actionName: "deleteFile",
        bucket,
        fileName: txtFileName,
      },
      dataSourceConfig,
      i18n
    );
    expect((delRes as any).success).toBe(true);

    const delBinRes = await run(
      {
        actionName: "deleteFile",
        bucket,
        fileName: binFileName,
      },
      dataSourceConfig,
      i18n
    );
    expect((delBinRes as any).success).toBe(true);

    // delete not empty file
    expect(
      run(
        {
          actionName: "deleteFile",
          bucket,
          fileName: "",
        },
        dataSourceConfig,
        i18n
      )
    ).rejects.toThrow();
  });
});
