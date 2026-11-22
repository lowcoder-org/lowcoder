import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { RequestInit } from "node-fetch";
import { fetch } from "../../common/fetch";
import path from "path";
import { ServiceError } from "../../common/error";
import { DataSourceDataType } from "./dataSourceConfig";
import { ActionDataType } from "./queryConfig";

const NOT_MODIFIED = 304; // a null-body status: the Response constructor rejects a body for it

/** storage-js recognises an HTTP error only when it is an instance of the global Response.
 *  node-fetch (kept for the proxy agent) returns its own Response class, so non-2xx responses are
 *  copied into a global Response (status, statusText, body text). 2xx responses pass through unchanged.
 *  Limit: headers are not copied (storage-js reads only status and the JSON body on errors). */
async function storageFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (res.ok) return res;
  const body = res.status === NOT_MODIFIED ? null : await res.text();
  return new Response(body, { status: res.status, statusText: res.statusText });
}

/** download (readFile) sets noResolveJson, so storage-js never reads the error body and its message is
 *  the stringified Response. Reads the body of that Response once: JSON message, JSON error, the raw
 *  text, then the status text. Any other error (e.g. a transport failure) keeps its message. */
async function downloadErrorMessage(error: { message: string; originalError?: unknown }): Promise<string> {
  const res = error.originalError;
  if (!(res instanceof Response)) return error.message;
  const text = await res.text();
  let body: { message?: unknown; error?: unknown } = {};
  try {
    body = Object(JSON.parse(text)); // Object(null) is {}, so a "null" body falls through to the text
  } catch {
    // not JSON: the raw text is the message
  }
  return String(body.message || body.error || text || res.statusText);
}

function getClient(params: DataSourceDataType) {
  return createClient(params.projectUrl, params.apiKey, {
    global: {
      fetch: storageFetch as any,
    },
  });
}

function getBucket(actionConfig: ActionDataType, dataSourceConfig: DataSourceDataType) {
  if ("bucket" in actionConfig) {
    return actionConfig.bucket;
  }
  return "";
}

const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 5;

async function getFileSignedUrl(bucket: string, fileName: string, client: SupabaseClient) {
  const ret = await client.storage.from(bucket).createSignedUrl(fileName, SIGNED_URL_EXPIRES_IN_SECONDS);
  if (ret.error) {
    throw ret.error;
  }
  return ret.data.signedUrl;
}

export default async function run(action: ActionDataType, dataSourceConfig: DataSourceDataType) {
  const client = getClient(dataSourceConfig);
  const bucket = getBucket(action, dataSourceConfig);

  // list buckets
  if (action.actionName === "listBuckets") {
    const ret = await client.storage.listBuckets();
    if (ret.error) {
      throw ret.error;
    }
    return ret.data;
  }

  // list
  if (action.actionName === "listObjects") {
    if (!bucket) {
      throw new ServiceError("Bucket is required", 400);
    }
    const ret = await client.storage.from(bucket).list(action.path, {
      limit: action.limit,
      offset: action.offset,
      sortBy: action.sortBy,
      search: action.search || undefined,
    });
    if (ret.error) {
      throw ret.error;
    }
    const signedUrls: Record<string, string> = {};
    if (action.returnSignedUrl && ret.data.length > 0) {
      const signRet = await client.storage.from(bucket).createSignedUrls(
        ret.data.map((i) => path.join(action.path, i.name)),
        SIGNED_URL_EXPIRES_IN_SECONDS
      );
      if (signRet.error) {
        throw signRet.error;
      }
      signRet.data.forEach((i) => {
        if (!i.path) {
          return;
        }
        signedUrls[i.path] = i.signedUrl;
      });
    }
    return (ret.data || []).map((i) => ({
      ...i,
      signedUrl: signedUrls[path.join(action.path, i.name)],
      url: client.storage.from(bucket).getPublicUrl(path.join(action.path, i.name)).data.publicUrl,
    }));
  }

  // read
  if (action.actionName === "readFile") {
    const encoding = (action.encoding || "base64") as BufferEncoding;
    const ret = await client.storage
      .from(bucket)
      .download(action.fileName, { transform: action.transform || undefined });
    if (ret.error) {
      ret.error.message = await downloadErrorMessage(ret.error);
      throw ret.error;
    }
    const arrayBuffer = await ret.data.arrayBuffer();
    const data = Buffer.from(arrayBuffer).toString(encoding);
    return {
      data,
      type: ret.data.type,
    };
  }

  // upload
  if (action.actionName === "uploadData") {
    const encoding = (action.encoding || "base64") as BufferEncoding;
    const ret = await client.storage
      .from(bucket)
      .upload(action.fileName, Buffer.from(action.data, encoding), {
        contentType: action.contentType,
      });
    if (ret.error) {
      throw ret.error;
    }
    let signedUrl;
    if (action.returnSignedUrl) {
      signedUrl = await getFileSignedUrl(bucket, action.fileName, client);
    }
    return {
      ...ret.data,
      signedUrl,
    };
  }

  if (action.actionName === "deleteFile") {
    const ret = await client.storage.from(bucket).remove([action.fileName]);
    if (ret.error) {
      throw ret.error;
    }
    return {
      success: true,
    };
  }

  if (action.actionName === "createSignedUrl") {
    const signedUrl = await getFileSignedUrl(bucket, action.fileName, client);
    return {
      signedUrl,
    };
  }
}
