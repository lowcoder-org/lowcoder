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
import { createHash } from "crypto";

const STS_CACHE_KEY_HASH = "sha256";
const STS_DURATION_SECONDS = 3000;
const STS_SESSION_NAME = 'lowcoder';
const URL_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:\/\//i;
const DEFAULT_STS_SCHEME = "https://";

/** ali-oss 6.23.0 reads options.endpoint (node_modules/ali-oss/lib/sts.js:22); @types/ali-oss 6.16.11 omits it. */
type StsOptionsWithEndpoint = ConstructorParameters<typeof STS>[0] & { endpoint?: string };

/** The configured STS endpoint as a URL; scheme-less values get https://. Empty or blank gives
 *  undefined, so ali-oss uses its default https://sts.aliyuncs.com. An explicit scheme is kept as given. */
function stsEndpoint(endpointUrl: string | undefined): string | undefined {
  const trimmed = (endpointUrl ?? "").trim();
  if (!trimmed) return undefined;
  return URL_SCHEME_PATTERN.test(trimmed) ? trimmed : DEFAULT_STS_SCHEME + trimmed;
}

interface StsCredential {
  AccessKeyId: string;
  AccessKeySecret: string;
  SecurityToken: string;
  Expiration: Date;
}
/** Temporary STS credentials per data source. Key: sha256 of [accessKeyId, accessKeySecret, arn, endpointUrl],
 *  so a changed secret, role or endpoint logs in again, and the key does not contain the long-term access key
 *  secret. The values DO hold secrets: each is a temporary STS credential with its own AccessKeySecret and
 *  SecurityToken. Bound: every login first deletes the expired entries, so the map holds the credentials of the
 *  tuples logged in within one credential lifetime (3000 s), plus expired ones until the next login of any
 *  data source. Module-private: no importer can read, replace or delete an entry. */
const stsCredentials = new Map<string, StsCredential>();

/** Number of cached STS credentials. A non-secret observation for tests of the sweep, which run() cannot show;
 *  it exposes no key and no value. */
export function stsCredentialCacheSize(): number {
  return stsCredentials.size;
}

function stsCacheKey(params: DataSourceDataType): string {
  return createHash(STS_CACHE_KEY_HASH)
    .update(JSON.stringify([params.accessKeyId, params.accessKeySecret, params.arn, params.endpointUrl ?? ""]))
    .digest("hex");
}

/** Deletes every credential that may not be reused at `now`: the exact negation of the reuse check
 *  `now < Expiration` (so expired at the Expiration instant), written as `!(now < ...)` so that an invalid
 *  Expiration (`getTime()` is NaN) is deleted too instead of being kept and reused forever. */
function sweepExpiredStsCredentials(now: number) {
  for (const [key, credential] of stsCredentials) {
    if (!(now < credential.Expiration.getTime())) stsCredentials.delete(key);
  }
}

async function loginWithSts(params: DataSourceDataType): Promise<StsCredential> {
  sweepExpiredStsCredentials(new Date().getTime());
  const key = stsCacheKey(params);
  const cached = stsCredentials.get(key);
  if (cached) {
    return cached;
  }
  const stsOptions: StsOptionsWithEndpoint = {
    // 填写步骤1创建的RAM用户AccessKey。
    accessKeyId: params.accessKeyId,
    accessKeySecret: params.accessKeySecret,
    endpoint: stsEndpoint(params.endpointUrl),
  };
  let sts = new STS(stsOptions);
  let res = await sts.assumeRole(params.arn, ``, STS_DURATION_SECONDS, STS_SESSION_NAME);
  var { AccessKeyId, AccessKeySecret, SecurityToken, Expiration } = res.credentials;
  const credential = {
    AccessKeyId,
    AccessKeySecret,
    SecurityToken,
    Expiration: new Date(Expiration)
  };
  stsCredentials.set(key, credential);
  return credential;
}

async function getClient(params: DataSourceDataType) {
  const credential = await loginWithSts(params);
  return new OSS({
    region: params.region,
    accessKeyId: credential.AccessKeyId,
    accessKeySecret: credential.AccessKeySecret,
    stsToken: credential.SecurityToken,
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

/** Logs in to STS with the data source's key and role. Limits: a credential cached for the same tuple within its
 *  3000 s lifetime is reported as success without a new STS call; the OSS region and bucket are not checked. */
export async function validateDataSourceConfig(dataSourceConfig: DataSourceDataType) {
  try {
    await getClient(dataSourceConfig);
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
