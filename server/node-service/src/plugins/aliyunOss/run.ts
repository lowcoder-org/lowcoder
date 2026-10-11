// import {
//   OSS
// } from "ali-oss";
import OSS from "ali-oss";
import { STS } from 'ali-oss';
import { ServiceError } from "../../common/error";
import { DataSourceDataType } from "./dataSourceConfig";
import { AliyunOssI18nTranslator } from "./i18n";
import { ActionDataType } from "./queryConfig";
import { P } from "pino";
import { query } from "express";
import { Readable } from "stream";

interface StsCredential {
  AccessKeyId: string;
  AccessKeySecret: string;
  SecurityToken: string;
  Expiration: Date;
}
var stsCredential: StsCredential;
async function loginWithSts(params: DataSourceDataType): Promise<StsCredential> {
  if (stsCredential && new Date().getTime() < stsCredential.Expiration.getTime()) {
    return stsCredential;
  }
  let sts = new STS({
    // 填写步骤1创建的RAM用户AccessKey。
    accessKeyId: params.accessKeyId,
    accessKeySecret: params.accessKeySecret,
  });
  let res = await sts.assumeRole(params.arn, ``, 3000, 'lowcoder');
  var { AccessKeyId, AccessKeySecret, SecurityToken, Expiration } = res.credentials;
  stsCredential = {
    AccessKeyId,
    AccessKeySecret,
    SecurityToken,
    Expiration: new Date(Expiration)
  };
  return stsCredential;
}

async function getClient(params: DataSourceDataType) {
  var stsCredential = await loginWithSts(params);
  return new OSS({
    region: params.region,
    accessKeyId: stsCredential.AccessKeyId,
    accessKeySecret: stsCredential.AccessKeySecret,
    stsToken: stsCredential.SecurityToken,
    refreshSTSToken: async () => {
      var res = await loginWithSts(params);
      return {
        accessKeyId: res.AccessKeyId,
        accessKeySecret: res.AccessKeySecret,
        stsToken: res.SecurityToken,
      }
    }
  });
}

function getBucket(actionConfig: ActionDataType, dataSourceConfig: DataSourceDataType) {
  if ("bucket" in actionConfig) {
    return actionConfig.bucket;
  }
  return "";
}

export async function validateDataSourceConfig(dataSourceConfig: DataSourceDataType) {
  try {
    const client = getClient(dataSourceConfig);
    return{
      success:true
    };
  } catch (e) {
    if (e) {
      return {
        success: false,
        message: String(e),
      };
    }
    throw e;
  }
}

export default async function run(
  action: ActionDataType,
  dataSourceConfig: DataSourceDataType,
  i18n: AliyunOssI18nTranslator
) {
  const client = await getClient(dataSourceConfig);
  const bucket = getBucket(action, dataSourceConfig);
  client.useBucket(bucket);

  // list
  if (action.actionName === "listObjects") {
    if (!bucket) {
      throw new ServiceError(i18n.trans("messages.bucketRequired"), 400);
    }
    const res = await client.listV2({
      prefix: action.prefix,
      delimiter: action.delimiter,
      "max-keys": String(action.limit ?? 100),
    }, {});

    const files = [];
    for (const i of res.objects || []) {
      files.push({
        name: i.name || "",
        size: i.size,
        lastModified: i.lastModified,
        etag: i.etag,
        url: i.url,
      });
    }
    return files;
  }

  // upload
  if (action.actionName === "uploadData") {
    const buf = Buffer.from(action.data, ("base64") as BufferEncoding);
    const r = new Readable();
    r.push(buf);
    r.push(null);
    let result = await client.putStream(action.fileName, r);
    return {
      fileName: action.fileName,
      url: getUrl(action.fileName, client),
    }

    // if (action.actionName === "deleteFile") {
    //   await client.send(
    //     new DeleteObjectCommand({
    //       Bucket: bucket,
    //       Key: action.fileName,
    //     })
    //   );
    //   return {
    //     success: true,
    //   };
    // }
  }
  function getUrl(fileName: string, client: OSS) {
    return client.signatureUrl(fileName);
  }
}
