import { Client as MinioClient, BucketItemStat, BucketItemFromList, UploadedObjectInfo, BucketItem } from "minio";
import { ServiceError } from "../../common/error";
import { DataSourceDataType } from "./dataSourceConfig";
import { MinioI18nTranslator } from "./i18n";
import { ActionDataType } from "./queryConfig";

function getClient(params: DataSourceDataType) {
  return new MinioClient({
    ...params
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
    await client.listBuckets();

    return {
      success: true,
    };
  } catch (e) {
    if ((e as any).constructor.name === "S3Error") {
      return {
        success: false,
        message: (e as any).message,
      };
    }
    throw e;
  }
}

interface MinIOResponse {
  contentType?: string;
  length?: number;
  lastModified?: Date;
  data: Buffer;
}

export default async function run(
  action: ActionDataType,
  dataSourceConfig: DataSourceDataType,
  i18n: MinioI18nTranslator
): Promise<any> {
  const client = getClient(dataSourceConfig);
  const bucket = getBucket(action, dataSourceConfig);
  const getObjectFromMinIO = async (c: MinioClient, bucket: string, fileName: string): Promise<MinIOResponse> => {
    try {

      const objectInfo: BucketItemStat = await c.statObject(bucket, fileName);
      const stream = await c.getObject(bucket, fileName);

      const dataChunks: Buffer[] = [];

      // Readable stream data event
      stream.on('data', (chunk) => {
        dataChunks.push(Buffer.from(chunk));
      });

      // Return a promise that resolves when the stream ends
      return new Promise<MinIOResponse>((resolve, reject) => {
        stream.on('end', () => {
          const data = Buffer.concat(dataChunks);
          resolve({
            contentType: objectInfo.metaData?.['content-type'],
            length: data.length,
            lastModified: objectInfo.lastModified,
            data,
          });
        });

        stream.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      throw error;
    }
  };

  // read
  if (action.actionName === "readFile") {
    try {
      const result = await getObjectFromMinIO(client, bucket, action.fileName);
      return result;
    } catch (error) {
      // console.error('Error reading file from MinIO:', error);
      throw error;
    }
  }

  // list buckets
  if (action.actionName === "listBuckets") {
    return await client.listBuckets();
  }

  // upload
  if (action.actionName === "uploadData") {
    const bufferData = Buffer.from(action.data, action.encoding as BufferEncoding)
    const data: UploadedObjectInfo = await client.putObject(bucket, action.fileName, bufferData, bufferData.length);
    return data.etag;
  }

  // list
  if (action.actionName === "listObjects") {
    if (!bucket) {
      throw new ServiceError(i18n.trans("messages.bucketRequired"), 400);
    }

    return await new Promise((resolve, reject) => {
      const objectsStream = client.listObjectsV2(bucket, action.prefix, action.recursive)
      let files: any[] = [];
      objectsStream.on('data', async (obj: BucketItem) => {
        let presignedUrl = '';
        if (!obj.name) return reject(obj)
        if (action.withSignedURL) {
          presignedUrl = await new Promise((res, rej) => {
            client.presignedGetObject(bucket, obj.name, action.signURLTimeout, (err, url) => {
              if (err) {
                rej(err);
              } else {
                res(url);
              }
            });
          });
        }
        files.push({ ...obj, presignedUrl })
      })
      objectsStream.on('end', () => {
        objectsStream.removeAllListeners();
        resolve(files)
      })
      objectsStream.on('error', function (e) {
        reject(e)
      })
    })
  }

  if (action.actionName === "deleteFile") {
    try {
      await client.removeObject(bucket, action.fileName)
      return {
        success: true
      }
    } catch (err) {
      throw err;
    }
  }
  // get url 
  if (action.actionName === "getURL") {
    return await new Promise((res, rej) => {
      client.presignedGetObject(bucket, action.fileName, action.signURLTimeout, (err, url) => {
        if (err) {
          rej(err);
        } else {
          res(url);
        }
      });
    });
  }
}
