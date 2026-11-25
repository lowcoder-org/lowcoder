import { createHash, createHmac } from "node:crypto";
import { RUN_FLAGS, S3 } from "../constants";
import { IPV4_PATTERN } from "../security/echo";

/** Where an S3 data source connects: the S3-compatible sidecar of the run, as the app container reaches it (by its IP address, over plain HTTP, path-style). */
export interface S3Connection {
  /** `http://<ip>:<port>`, no trailing slash: the data source's endpoint URL. An IP address, never a name: the AWS SDK derives `<bucket>.<host>` from a name. */
  endpointUrl: string;
  /** The root user of the sidecar; the server verifies the signature of every request against this pair. */
  accessKey: string;
  secretKey: string;
  region: string;
}

/** The sidecar's IP variable is not set: the run did not start the S3 sidecar. */
export class S3SidecarMissingError extends Error {
  constructor() {
    super(`${S3.IP_ENV} is not set: the S3 sidecar was not started. Run the suite through e2e/scripts/run-in-docker.sh with ${RUN_FLAGS.INCLUDE_NODE_SERVICE_SIDECARS}=1.`);
    this.name = "S3SidecarMissingError";
  }
}

/** The sidecar's IP variable holds something that is not an IPv4 address: a name would make the SDK address `<bucket>.<name>`. */
export class S3SidecarAddressError extends Error {
  constructor(value: string) {
    super(`${S3.IP_ENV} is not an IPv4 address: ${JSON.stringify(value)} (a host name would make the AWS SDK address a bucket as <bucket>.<host>)`);
    this.name = "S3SidecarAddressError";
  }
}

/**
 * The connection to the run's S3 sidecar from the environment. Throws `S3SidecarMissingError` when the run script did not set the IP variable (it does so only with
 * `E2E_INCLUDE_NODE_SERVICE_SIDECARS=1`), so a test that was selected without its sidecar fails loudly instead of passing vacuously, and `S3SidecarAddressError` when the
 * value is not an IPv4 address (the endpoint of a bucket call must be an IP address, see `S3`). Reads only `env`.
 */
export function s3Connection(env: NodeJS.ProcessEnv = process.env): S3Connection {
  const ip = env[S3.IP_ENV];
  if (!ip) throw new S3SidecarMissingError();
  if (!IPV4_PATTERN.test(ip)) throw new S3SidecarAddressError(ip);
  return { endpointUrl: `http://${ip}:${S3.PORT}`, accessKey: S3.ACCESS_KEY, secretKey: S3.SECRET_KEY, region: S3.REGION };
}

/** The signing algorithm and the service of the credential scope, and the header names a signature of this module covers. */
const SIGV4_ALGORITHM = "AWS4-HMAC-SHA256";
const SIGV4_SERVICE = "s3";
const SIGV4_TERMINATOR = "aws4_request";

function sha256Hex(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

/** `20130524T000000Z`: the `x-amz-date` form of an instant. */
export function amzDate(date: Date): string {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

/** One S3 request to sign (AWS Signature Version 4, header form). `path` and `query` are already in their canonical, URI-encoded form. */
export interface S3SignInput {
  method: string;
  host: string;
  /** The URI-encoded path, starting with "/". */
  path: string;
  /** The canonical query string: keys sorted, keys and values URI-encoded; empty for none. */
  query: string;
  /** Further headers to sign (lower-case names; a value is trimmed and its runs of whitespace collapsed to one space, as SigV4 requires). `host`, `x-amz-date` and `x-amz-content-sha256` are always signed and added. */
  headers: Record<string, string>;
  body: Buffer;
  accessKey: string;
  secretKey: string;
  region: string;
  now: Date;
}

/**
 * The headers a signed request carries: the given ones plus `host`, `x-amz-date`, `x-amz-content-sha256` and the `authorization` header. Follows the AWS Signature
 * Version 4 specification for S3 (the canonical path is the path as sent, encoded once; the payload hash is the hex SHA-256 of the body); the foundation tests check it against the
 * example of AWS's own documentation. Not covered: presigned (query) signatures, chunked or unsigned payloads, a session token.
 */
export function signS3Request(input: S3SignInput): Record<string, string> {
  const payloadHash = sha256Hex(input.body);
  const stamp = amzDate(input.now);
  const day = stamp.slice(0, 8);
  const headers: Record<string, string> = { ...input.headers, host: input.host, "x-amz-content-sha256": payloadHash, "x-amz-date": stamp };
  const names = Object.keys(headers).sort();
  const canonicalHeaders = names.map((name) => `${name}:${(headers[name] as string).trim().replace(/\s+/g, " ")}\n`).join("");
  const signedHeaders = names.join(";");
  const canonicalRequest = [input.method, input.path, input.query, canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const scope = `${day}/${input.region}/${SIGV4_SERVICE}/${SIGV4_TERMINATOR}`;
  const stringToSign = [SIGV4_ALGORITHM, stamp, scope, sha256Hex(canonicalRequest)].join("\n");
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${input.secretKey}`, day), input.region), SIGV4_SERVICE), SIGV4_TERMINATOR);
  const signature = hmac(signingKey, stringToSign).toString("hex");
  return { ...headers, authorization: `${SIGV4_ALGORITHM} Credential=${input.accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}` };
}

/** One URI-encoded path segment: everything but the unreserved characters is percent-encoded (`encodeURIComponent` leaves `!'()*`, which S3 wants encoded). */
function encodeSegment(segment: string): string {
  return encodeURIComponent(segment).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

/** The path of a bucket, or of an object of it: `/<bucket>` or `/<bucket>/<key>`, the key encoded per `/`-separated segment. The key must have no `.` or `..` segment (a URL parser would resolve it). */
export function s3Path(bucket?: string, key?: string): string {
  if (bucket === undefined) return "/";
  if (key === undefined) return `/${encodeSegment(bucket)}`;
  return `/${encodeSegment(bucket)}/${key.split("/").map(encodeSegment).join("/")}`;
}

/** The canonical query string of the given parameters: names and values URI-encoded, then sorted by encoded name (then value). */
export function s3Query(params: Record<string, string> = {}): string {
  // sorted AFTER encoding: SigV4 orders the encoded names (`a%2F` sorts before `a-`, the raw `a-` before `a/`)
  return Object.keys(params)
    .map((name) => [encodeSegment(name), encodeSegment(params[name] as string)] as const)
    .sort(([nameA, valueA], [nameB, valueB]) => (nameA < nameB ? -1 : nameA > nameB ? 1 : valueA < valueB ? -1 : valueA > valueB ? 1 : 0))
    .map(([name, value]) => `${name}=${value}`)
    .join("&");
}

/** How long a direct call to the sidecar may take before it is abandoned: a local server answers in milliseconds. */
const DIRECT_CALL_TIMEOUT_MS = 10_000;

/** One direct call from the test process: the verb, the bucket and key it addresses, a query, a body and a content type; `credentials` replaces the connection's key pair. */
export interface S3DirectRequest {
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  bucket?: string;
  key?: string;
  query?: Record<string, string>;
  body?: Buffer | string;
  contentType?: string;
  credentials?: { accessKey: string; secretKey: string };
}

/** The answer of a direct call: the HTTP status, the headers (lower-case names), the body as bytes and as UTF-8 text. */
export interface S3DirectAnswer {
  status: number;
  headers: Record<string, string>;
  body: Buffer;
  text: string;
}

/**
 * One signed S3 call from the TEST process to the sidecar, path-style on the connection's IP address. It is the control that shows what the server itself holds and answers (the
 * same bytes, content type and status the plugin sees), and the way a test makes and removes its own buckets and objects. Throws on a network failure or after 10 s; an HTTP error
 * status is returned, not thrown.
 */
export async function s3Direct(connection: Pick<S3Connection, "endpointUrl" | "accessKey" | "secretKey" | "region">, request: S3DirectRequest): Promise<S3DirectAnswer> {
  const body = Buffer.from(request.body ?? "");
  const path = s3Path(request.bucket, request.key);
  const query = s3Query(request.query);
  const url = new URL(`${path}${query ? `?${query}` : ""}`, connection.endpointUrl);
  const headers = signS3Request({
    method: request.method,
    host: url.host,
    path,
    query,
    headers: request.contentType === undefined ? {} : { "content-type": request.contentType },
    body,
    accessKey: request.credentials?.accessKey ?? connection.accessKey,
    secretKey: request.credentials?.secretKey ?? connection.secretKey,
    region: connection.region,
    now: new Date(),
  });
  const response = await fetch(url, { method: request.method, headers, body: request.method === "PUT" ? body : undefined, signal: AbortSignal.timeout(DIRECT_CALL_TIMEOUT_MS) });
  const bytes = Buffer.from(await response.arrayBuffer());
  return { status: response.status, headers: Object.fromEntries(response.headers.entries()), body: bytes, text: bytes.toString("utf8") };
}

/** The text of every `<tag>...</tag>` element of an XML answer, in order, with the five predefined entities and numeric character references decoded. */
export function xmlValues(xml: string, tag: string): string[] {
  const decode = (text: string): string =>
    text
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
      .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)))
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, "&");
  return [...xml.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "g"))].map((match) => decode(match[1] as string));
}

/** The statuses a bucket call counts as done: created (200), removed (204), or already gone (404). */
const BUCKET_GONE_STATUSES = [200, 204, 404];

/**
 * Makes a bucket straight on the sidecar; throws when the server does not answer 200. A region other than `us-east-1` needs the bucket's location constraint in the body, as on
 * AWS (measured: without it versitygw answers 400 `IllegalLocationConstraintException` for a server started in `us-west-1`).
 */
export async function s3CreateBucket(connection: S3Connection, bucket: string): Promise<void> {
  const body = `<CreateBucketConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><LocationConstraint>${connection.region}</LocationConstraint></CreateBucketConfiguration>`;
  const answer = await s3Direct(connection, { method: "PUT", bucket, body, contentType: "application/xml" });
  if (answer.status !== 200) throw new Error(`the S3 sidecar refused to create bucket ${bucket}: ${answer.status} ${answer.text}`);
}

/** The keys of a bucket as the server lists them (up to 1000), in the server's order. */
export async function s3DirectKeys(connection: S3Connection, bucket: string): Promise<string[]> {
  const answer = await s3Direct(connection, { method: "GET", bucket, query: { "list-type": "2" } });
  if (answer.status !== 200) throw new Error(`the S3 sidecar refused to list bucket ${bucket}: ${answer.status} ${answer.text}`);
  return xmlValues(answer.text, "Key");
}

/**
 * Removes a test's bucket whatever state the test ended in: deletes every object (up to 1000) and then the bucket. A bucket that is already gone (404) is fine; any other
 * failure throws, so a leak is not silent. Safe to call when the bucket was never created.
 */
export async function s3RemoveBucket(connection: S3Connection, bucket: string): Promise<void> {
  const listed = await s3Direct(connection, { method: "GET", bucket, query: { "list-type": "2" } });
  if (listed.status === 404) return;
  if (listed.status !== 200) throw new Error(`the S3 sidecar refused to list bucket ${bucket}: ${listed.status} ${listed.text}`);
  for (const key of xmlValues(listed.text, "Key")) {
    const removed = await s3Direct(connection, { method: "DELETE", bucket, key });
    if (!BUCKET_GONE_STATUSES.includes(removed.status)) throw new Error(`the S3 sidecar refused to delete ${bucket}/${key}: ${removed.status} ${removed.text}`);
  }
  const answer = await s3Direct(connection, { method: "DELETE", bucket });
  if (!BUCKET_GONE_STATUSES.includes(answer.status)) throw new Error(`the S3 sidecar refused to delete bucket ${bucket}: ${answer.status} ${answer.text}`);
}
