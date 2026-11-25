import { createHash, randomBytes } from "node:crypto";
import { connect } from "node:net";
import type { Page } from "@playwright/test";
import { createApp, createNodePluginDatasource, executeAppQueryRaw, nodePluginDatasourceBody, testDatasourceRaw, type RawAnswer, type RegisteredUser } from "../../src/api/client";
import { API_OK, S3, TAGS } from "../../src/constants";
import { appDsl, nodePluginQuery } from "../../src/dsl/builders";
import { recordedPluginDatasource, recordedPluginQuery } from "../../src/dsl/recorded";
import { s3Connection, s3CreateBucket, s3Direct, s3DirectKeys, s3RemoveBucket, xmlValues, type S3Connection } from "../../src/datasource/s3";
import { expect, test } from "../../src/fixtures";
import { DatasourcePage } from "../../src/pages/DatasourcePage";

/**
 * D16: the S3 plugin of node-service (`server/node-service/src/plugins/s3/`, the plugin id `s3`, AWS SDK for JavaScript v3) run against a REAL S3-compatible
 * server, the sidecar of the run (versitygw with its POSIX backend; `scripts/run-in-docker.sh` starts it only with `E2E_INCLUDE_NODE_SERVICE_SIDECARS=1`; image, auth
 * and cost in the README, "S3 sidecar"). D10g to D10q run the same plugin against the echo's canned answers; here the answers are the server's own.
 *
 * Addressing: every bucket call of these tests goes to the sidecar's IP address (`E2E_S3_IP`, endpoint `http://<ip>:7070`), never to a name. The AWS SDK addresses a
 * bucket of a host NAME as `<bucket>.<host>` (virtual-host style), a name that nothing maps and that may resolve outside the run network; for an IP address it uses
 * path-style (`<endpoint>/<bucket>/<key>`). The server has no name alias at all, so no test can reach it by name. The server verifies AWS Signature Version 4 for one root
 * user (throw-away key pair in `S3` of `src/constants.ts`), so a wrong key or secret is refused by the server itself, not simulated.
 *
 * Every test makes its own bucket (a unique name), creates it INSIDE the try and removes its objects and the bucket in the `finally` (`s3RemoveBucket`): buckets are
 * global to the sidecar, so no test counts buckets or objects it did not create. "Direct" calls (`s3Direct`, signed in the test process) are the controls that show what
 * the server itself holds and answers, next to what the plugin makes of it for the app, and the way a test sets up and removes what it needs.
 *
 * Measured on the images `3.0.0-e2e` and `3.0.1-e2e` against versitygw v1.11.0 (the AWS SDK of the plugin is the one D10 measures, version 3.668.0 in its user agent):
 * - Every answer of the plugin is `success: true, queryCode: "OK"` with the data below, or `success: false, queryCode: "FAILED"` with the server's own message and no data.
 * - `listBuckets`: `[{ name }]`. `listObjects`: `[{ name, size, lastModified, signedUrl, url }]`: it sends ListObjects (version 1) with the prefix, the delimiter and `limit` as
 *   max-keys and nothing else, so the keys that a delimiter folds into prefixes are dropped (NSD-22) and a truncated listing cannot be continued (NSD-21).
 * - `readFile`: `{ contentType, length, lastModified, data }` (the echo scenarios saw neither `length` nor `lastModified`: its canned answers carry no such headers).
 * - `uploadData`: `{ fileName, signedUrl, url }`; `deleteFile`: `{ success: true }` for a key that exists and for one that does not.
 * - A service error fails the query with the server's message: `NoSuchBucket`, `NoSuchKey`, `InvalidAccessKeyId`, `SignatureDoesNotMatch`.
 *
 * Not covered: a real AWS S3 (no vendor host is reachable; versitygw differs from S3 in limits, versioning, ACLs, storage classes, checksums, listing details such as ETag
 * and owner, which the plugin does not return anyway), multipart upload, requests the plugin never makes (copy, tagging, ranges), and a presigned URL after it has expired
 * (it lives 300 s), and a presigned URL fetched from inside the app container (hand-measured, README).
 */
/** Candidate defect: `listObjects` has no continuation: it sends no marker and returns neither `IsTruncated` nor a next marker, so a bucket with more keys than `limit` silently shows its first page. */
const NO_CONTINUATION_DEFECT = { type: "defect", description: "NSD-21 candidate" } as const;
/** Candidate defect: `listObjects` with a delimiter returns only `Contents`: the common prefixes ("folders") the server answers are dropped. */
const COMMON_PREFIXES_DEFECT = { type: "defect", description: "NSD-22 candidate" } as const;
/** Candidate defect: the `url` of `listObjects` and `uploadData` is the endpoint, the bucket and the key joined as they are: a key with `?`, `#` or `%` names another resource, and a space or non-ASCII text is not a valid URL until a client encodes it. */
const UNENCODED_URL_DEFECT = { type: "defect", description: "NSD-24 candidate" } as const;
/** Candidate defect: `uploadData` decodes the data as base64 by default and Node's decoder accepts text that is not base64, so plain text typed into the form is stored as other bytes without a message. */
const LENIENT_BASE64_DEFECT = { type: "defect", description: "NSD-23 candidate" } as const;

const HTTP_OK = 200;
const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;
const QUERY_CODE_OK = "OK";
const QUERY_CODE_FAILED = "FAILED";
/** The `code` of the envelope of a refused connection test (`ResponseView.error(500, message)`). */
const REFUSED_CODE = 500;
const MARKER_BYTES = 4;
const SERVICE_S3 = "s3";
/** A region the sidecar is not started in (`S3.REGION`): a request signed for it is refused by the server. */
const WRONG_REGION = "eu-west-1";

/** The recorded variants of the actions (`recordedPluginQuery("s3", variant)`; `""` is the editor's default action, listBuckets). */
const VARIANT = {
  LIST_BUCKETS: "",
  LIST_OBJECTS: "ListObjects",
  READ_FILE: "ReadFile",
  UPLOAD_DATA: "UploadData",
  DELETE_FILE: "DeleteFile",
} as const;

/**
 * The text of the connection test of the form, measured (`Connection Successful` toast; the refusal text is the server's message after this prefix, followed by a full
 * stop the application adds: a message that already ends in one, as most of the server's do, shows two).
 */
const CONNECTION_OK_TOAST = "Connection Successful";
const CONNECTION_FAILED_PREFIX = "Failed to connect data source: ";

/** The server's own messages (versitygw v1.11.0), which the plugin reports as the query's message. */
const SERVER_MESSAGES = {
  NO_SUCH_BUCKET: "The specified bucket does not exist.",
  NO_SUCH_KEY: "The specified key does not exist.",
  INVALID_ACCESS_KEY: "The AWS Access Key Id you provided does not exist in our records.",
  SIGNATURE_MISMATCH: "The request signature we calculated does not match the signature you provided. Check your key and signing method.",
} as const;

/** What the plugin answers for an empty bucket name: `listObjects` checks it itself, the other actions hand the SDK's own text to the user (NSD-8 candidate, as in D10). */
const BUCKET_REQUIRED_MESSAGE = "Bucket is required";
const SDK_EMPTY_BUCKET_MESSAGE = "Empty value provided for input HTTP label: Bucket.";
const BUCKET_CHECK_DEFECT = { type: "defect", description: "NSD-8 candidate" } as const;

/** The shapes of values the server generates. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const SIGNATURE = /^[0-9a-f]{64}$/;

/** The validity of a presigned URL the plugin asks for (`getFileSignedUrl`: `expiresIn: 60 * 5`). */
const SIGNED_URL_EXPIRES_SECONDS = "300";

/** The content types of the uploads of these tests. */
const TEXT_TYPE = "text/plain; charset=utf-8";
const BINARY_TYPE = "application/octet-stream";
const PNG_TYPE = "image/png";

/** The whole envelope of a successful connection test, and of one refused because nothing listens at the endpoint (measured; the text is the connection error the SDK reports). */
const ACCEPTED_ENVELOPE = { code: API_OK, message: "", data: true, success: true } as const;
const closedPortEnvelope = (host: string): object => ({ code: REFUSED_CODE, message: `${CONNECTION_FAILED_PREFIX}connect ECONNREFUSED ${host}:${CLOSED_PORT}.`, success: false });

/** The size of the large upload (the form sends it as a base64 string of about 1.33 times this length). */
const LARGE_BODY_BYTES = 3 * 1024 * 1024;

/** A port of the sidecar's host where nothing listens: the control that a refused connection is seen as one. */
const CLOSED_PORT = 7071;
const CONNECT_TIMEOUT_MS = 5000;

/** The envelope of `POST /api/query/execute` (`QueryResultView`), the fields these tests read. */
interface QueryEnvelope {
  success?: boolean;
  queryCode?: string;
  message?: string | null;
  data?: unknown;
}

function envelopeOf(answer: RawAnswer): QueryEnvelope {
  return answer.json as QueryEnvelope;
}

function uniqueMarker(): string {
  return randomBytes(MARKER_BYTES).toString("hex");
}

/** A bucket name of this test only (3 to 63 characters: lower-case letters, digits, hyphens). */
function uniqueBucket(): string {
  return `e2e-s3-${uniqueMarker()}`;
}

/** One saved query: the recording's variant and the action's fields over the recorded defaults. */
interface S3Query {
  variant: string;
  action: Record<string, unknown>;
}

const listBuckets = (): S3Query => ({ variant: VARIANT.LIST_BUCKETS, action: {} });
const listObjects = (bucket: string, extra: Record<string, unknown> = {}): S3Query => ({ variant: VARIANT.LIST_OBJECTS, action: { bucket, ...extra } });
const readFile = (bucket: string, fileName: string, encoding?: string): S3Query => ({ variant: VARIANT.READ_FILE, action: { bucket, fileName, ...(encoding ? { encoding } : {}) } });
const uploadData = (bucket: string, fileName: string, data: string, extra: Record<string, unknown> = {}): S3Query => ({
  variant: VARIANT.UPLOAD_DATA,
  action: { bucket, fileName, data, ...extra },
});
const deleteFile = (bucket: string, fileName: string): S3Query => ({ variant: VARIANT.DELETE_FILE, action: { bucket, fileName } });

/** The data source fields a test overrides over the sidecar's own. */
interface Overrides {
  accessKey?: string;
  secretKey?: string;
  endpointUrl?: string;
  region?: string;
}

/** The data source fields of the sidecar over the recorded form body. */
function sidecarConfig(overrides: Overrides = {}): Record<string, unknown> {
  const sidecar = s3Connection();
  return {
    accessKey: overrides.accessKey ?? sidecar.accessKey,
    secretKey: overrides.secretKey ?? sidecar.secretKey,
    endpointUrl: overrides.endpointUrl ?? sidecar.endpointUrl,
    region: overrides.region ?? sidecar.region,
  };
}

async function s3Datasource(page: Page, apiUser: RegisteredUser, overrides: Overrides = {}): Promise<string> {
  return createNodePluginDatasource(page.request, { orgId: apiUser.orgId, recorded: recordedPluginDatasource(SERVICE_S3), config: sidecarConfig(overrides) });
}

/** A saved app with one manual S3 query per entry of `queries` on one data source (not published: the draft runs with `viewMode: false`). */
async function s3App(page: Page, apiUser: RegisteredUser, queries: Record<string, S3Query>, overrides: Overrides = {}): Promise<string> {
  const datasourceId = await s3Datasource(page, apiUser, overrides);
  const saved = Object.entries(queries).map(([id, query]) => nodePluginQuery({ id, name: id, datasourceId, recorded: recordedPluginQuery(SERVICE_S3, query.variant), action: query.action }));
  const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-s3-server", dsl: appDsl([], { queries: saved }) });
  return appId;
}

async function runDraft(page: Page, appId: string, queryId: string): Promise<RawAnswer> {
  return executeAppQueryRaw(page.request, { applicationId: appId, queryId, viewMode: false });
}

function expectRan(answer: RawAnswer): void {
  expect({ status: answer.status, code: answer.code }, "the query request was answered").toEqual({ status: HTTP_OK, code: API_OK });
}

function expectSucceeded(answer: RawAnswer): void {
  expectRan(answer);
  expect(envelopeOf(answer).success, "the query succeeded").toBe(true);
  expect(envelopeOf(answer).queryCode, "the query code").toBe(QUERY_CODE_OK);
}

function expectFailed(answer: RawAnswer, message: string): void {
  expectRan(answer);
  expect(
    { success: envelopeOf(answer).success, queryCode: envelopeOf(answer).queryCode, message: envelopeOf(answer).message, data: envelopeOf(answer).data },
    "the query failed with the measured message",
  ).toEqual({ success: false, queryCode: QUERY_CODE_FAILED, message, data: null });
}

/** Runs a query whose answer the test asserts as data: the success state first, then the data. */
async function runForData(page: Page, appId: string, queryId: string): Promise<unknown> {
  const answer = await runDraft(page, appId, queryId);
  expectSucceeded(answer);
  return envelopeOf(answer).data;
}

/** The sidecar's connection (the test fails loudly when the run did not start it). */
function server(): S3Connection {
  return s3Connection();
}

/** The object the server holds, as a direct call answers it (`undefined` status 404: no such key). */
async function directObject(bucket: string, key: string): Promise<{ status: number; type?: string; bytes: Buffer }> {
  const answer = await s3Direct(server(), { method: "GET", bucket, key });
  return { status: answer.status, type: answer.headers["content-type"], bytes: answer.body };
}

/** Puts an object straight on the sidecar. */
async function directPut(bucket: string, key: string, body: Buffer | string, contentType?: string): Promise<void> {
  const answer = await s3Direct(server(), { method: "PUT", bucket, key, body, contentType });
  expect(answer.status, `the server stored ${bucket}/${key}`).toBe(HTTP_OK);
}

/** How a TCP connection to `host:port` ended: `connected`, or the error code Node reports (`ECONNREFUSED`, ...). */
async function tcpOutcome(host: string, port: number): Promise<string> {
  return new Promise((resolve) => {
    const socket = connect({ host, port });
    socket.setTimeout(CONNECT_TIMEOUT_MS, () => {
      socket.destroy();
      resolve("timeout");
    });
    socket.once("connect", () => {
      socket.destroy();
      resolve("connected");
    });
    socket.once("error", (error: NodeJS.ErrnoException) => resolve(error.code ?? error.message));
  });
}

const sha256 = (bytes: Buffer): string => createHash("sha256").update(bytes).digest("hex");

/** The URL the plugin reports for an object: the endpoint, the bucket and the key, not encoded (`getFileUrl`). */
const fileUrl = (bucket: string, key: string): string => `${server().endpointUrl}/${bucket}/${key}`;

test.describe("S3 data source against a real S3-compatible server", { tag: [TAGS.NODE_SERVICE, TAGS.NODE_SERVICE_SIDECAR] }, () => {
  test("D16a: the connection test lists the buckets with the right key pair, and the server itself refuses a wrong access key, a wrong secret and a wrong region", async ({ page, apiUser }) => {
    const bodyFor = (overrides: Overrides): object => nodePluginDatasourceBody(recordedPluginDatasource(SERVICE_S3), { orgId: apiUser.orgId, config: sidecarConfig(overrides) });

    const accepted = await testDatasourceRaw(page.request, bodyFor({}));
    expect({ status: accepted.status, json: accepted.json }, "the right key pair: the envelope of a success").toEqual({ status: HTTP_OK, json: { code: API_OK, message: "", data: true, success: true } });

    const refusals: Array<{ title: string; overrides: Overrides; message: string }> = [
      { title: "wrong access key", overrides: { accessKey: `${S3.ACCESS_KEY}x` }, message: SERVER_MESSAGES.INVALID_ACCESS_KEY },
      { title: "wrong secret", overrides: { secretKey: `${S3.SECRET_KEY}x` }, message: SERVER_MESSAGES.SIGNATURE_MISMATCH },
      { title: "wrong region", overrides: { region: WRONG_REGION }, message: `The authorization header is malformed; the region '${WRONG_REGION}' is wrong; expecting '${S3.REGION}'` },
    ];
    for (const refusal of refusals) {
      const refused = await testDatasourceRaw(page.request, bodyFor(refusal.overrides));
      expect({ status: refused.status, code: refused.code, json: refused.json }, refusal.title).toEqual({
        status: HTTP_OK,
        code: REFUSED_CODE,
        json: { code: REFUSED_CODE, message: `${CONNECTION_FAILED_PREFIX}${refusal.message}.`, success: false },
      });
    }
    // the same bodies with the right key pair are accepted again: the answer above came from the key pair, not from the endpoint or the form
    const again = await testDatasourceRaw(page.request, bodyFor({}));
    expect(again.json, "control: the right key pair is accepted after the refusals").toEqual({ code: API_OK, message: "", data: true, success: true });
  });
  test("D16b: the form's Test Connection button shows the server's own refusal of a wrong secret, and the success once the secret is right", async ({ page, apiUser }) => {
    // `apiUser` signs a new user in on the page (the data source page needs a session); the form is the subject, the user makes nothing
    expect(apiUser.orgId, "the page is signed in as a user with a workspace").toBeTruthy();
    const sidecar = server();
    const datasources = new DatasourcePage(page);
    await datasources.open();
    await datasources.newButton.click();
    await page.getByText("AWS S3", { exact: true }).first().click();
    // the field ids of the form (measured in D10: `name`, `accessKey`, `secretKey`, `endpointUrl`)
    await page.locator("#name").fill("e2e-s3-form");
    await page.locator("#accessKey").fill(sidecar.accessKey);
    await page.locator("#secretKey").fill(`${sidecar.secretKey}x`);
    await page.locator("#endpointUrl").fill(sidecar.endpointUrl);
    const testButton = page.getByRole("button", { name: "Test Connection" });
    await expect(page.getByText(CONNECTION_OK_TOAST), "before the first click no result is shown").toHaveCount(0);

    await testButton.click();

    await expect(page.getByText(`${CONNECTION_FAILED_PREFIX}${SERVER_MESSAGES.SIGNATURE_MISMATCH}.`), "the server's refusal of the wrong secret is shown").toBeVisible();
    await expect(page.getByText(CONNECTION_OK_TOAST), "and no success with it").toHaveCount(0);

    await page.locator("#secretKey").fill(sidecar.secretKey);
    await testButton.click();

    await expect(page.getByText(CONNECTION_OK_TOAST), "with the right secret the same form reports success").toBeVisible();
  });

  test("D16c: a listBuckets query shows a bucket the moment the server has it, as a name only", async ({ page, apiUser }) => {
    const bucket = uniqueBucket();
    try {
      const appId = await s3App(page, apiUser, { buckets: listBuckets() });

      const before = (await runForData(page, appId, "buckets")) as Array<{ name: string }>;
      expect(before.map((entry) => entry.name), "before the create the bucket is not listed").not.toContain(bucket);

      await s3CreateBucket(server(), bucket);
      const after = (await runForData(page, appId, "buckets")) as Array<{ name: string }>;
      expect(after.map((entry) => entry.name), "after the create the bucket is listed").toContain(bucket);
      expect(after.every((entry) => Object.keys(entry).join() === "name"), "every entry holds the name and nothing else").toBe(true);
      const direct = await s3Direct(server(), { method: "GET" });
      expect({ status: direct.status, listed: xmlValues(direct.text, "Name").includes(bucket) }, "the server's own listing agrees").toEqual({ status: HTTP_OK, listed: true });
    } finally {
      await s3RemoveBucket(server(), bucket);
    }
  });
  test("D16d: uploadData stores the decoded bytes with the content type and readFile answers them back, as text or as base64, with the server's length and time", async ({ page, apiUser }) => {
    const bucket = uniqueBucket();
    const text = "héllo wörld\nline 2: 日本語";
    const key = "docs/e2e file.txt";
    const binary = Buffer.from(Array.from({ length: 256 }, (_, value) => value));
    try {
      await s3CreateBucket(server(), bucket);
      const appId = await s3App(page, apiUser, {
        putText: uploadData(bucket, key, text, { encoding: "utf8", contentType: TEXT_TYPE }),
        readText: readFile(bucket, key, "utf8"),
        readBase64: readFile(bucket, key),
        putBinary: uploadData(bucket, "bin/all-bytes.bin", binary.toString("base64"), { contentType: PNG_TYPE }),
        readBinary: readFile(bucket, "bin/all-bytes.bin"),
        putDefaultType: uploadData(bucket, "bin/no-type.bin", binary.toString("base64"), { contentType: "" }),
        putOver: uploadData(bucket, key, "second version", { encoding: "utf8", contentType: "text/markdown" }),
        readOver: readFile(bucket, key, "utf8"),
      });

      expect((await directObject(bucket, key)).status, "before the upload the server has no such key").toBe(HTTP_NOT_FOUND);
      expect(await runForData(page, appId, "putText"), "the upload answers the name, no signed URL, and the file URL").toEqual({ fileName: key, signedUrl: "", url: fileUrl(bucket, key) });
      const stored = await directObject(bucket, key);
      expect({ status: stored.status, type: stored.type, text: stored.bytes.toString("utf8") }, "the server holds the decoded text with the content type").toEqual({ status: HTTP_OK, type: TEXT_TYPE, text });

      const asText = (await runForData(page, appId, "readText")) as Record<string, unknown>;
      expect(asText, "readFile as text: type, length in bytes, time and the data").toEqual({
        contentType: TEXT_TYPE,
        length: Buffer.byteLength(text),
        lastModified: expect.stringMatching(ISO_DATE),
        data: text,
      });
      const asBase64 = (await runForData(page, appId, "readBase64")) as Record<string, unknown>;
      expect({ ...asBase64, lastModified: typeof asBase64.lastModified }, "readFile without an encoding is base64 of the same bytes").toEqual({
        contentType: TEXT_TYPE,
        length: Buffer.byteLength(text),
        lastModified: "string",
        data: Buffer.from(text, "utf8").toString("base64"),
      });

      await runForData(page, appId, "putBinary");
      const storedBinary = await directObject(bucket, "bin/all-bytes.bin");
      expect({ status: storedBinary.status, type: storedBinary.type, sha: sha256(storedBinary.bytes), size: storedBinary.bytes.length }, "all 256 byte values arrive unchanged, with the given type").toEqual({
        status: HTTP_OK,
        type: PNG_TYPE,
        sha: sha256(binary),
        size: 256,
      });
      expect(((await runForData(page, appId, "readBinary")) as { data: string; length: number }).data, "read back as base64: the same bytes").toBe(binary.toString("base64"));

      await runForData(page, appId, "putDefaultType");
      expect((await directObject(bucket, "bin/no-type.bin")).type, "an empty content type is stored as the SDK's default for a binary body").toBe(BINARY_TYPE);

      await runForData(page, appId, "putOver");
      const over = await directObject(bucket, key);
      expect({ type: over.type, text: over.bytes.toString("utf8") }, "an upload to an existing key replaces the object and its type").toEqual({ type: "text/markdown", text: "second version" });
      expect(((await runForData(page, appId, "readOver")) as { data: string }).data, "and the plugin reads the new version").toBe("second version");
    } finally {
      await s3RemoveBucket(server(), bucket);
    }
  });

  test("D16e: listObjects applies the prefix, the delimiter and the limit of the server, and answers name, size, time, an empty signed URL and the file URL", async ({ page, apiUser }) => {
    const bucket = uniqueBucket();
    const keys = ["p/a.txt", "p/b.txt", "p/sub/c.txt", "q/d.txt", "root.txt"];
    try {
      await s3CreateBucket(server(), bucket);
      for (const key of keys) await directPut(bucket, key, `body of ${key}`, TEXT_TYPE);
      const appId = await s3App(page, apiUser, {
        all: listObjects(bucket),
        prefix: listObjects(bucket, { prefix: "p/" }),
        none: listObjects(bucket, { prefix: "zzz/" }),
        limit: listObjects(bucket, { limit: 2 }),
      });
      expect(await s3DirectKeys(server(), bucket), "the server holds the five keys").toEqual(keys);

      const all = (await runForData(page, appId, "all")) as Array<Record<string, unknown>>;
      expect(all, "every object: name, size in bytes, time, no signed URL, and the file URL").toEqual(
        keys.map((key) => ({ name: key, size: Buffer.byteLength(`body of ${key}`), lastModified: expect.stringMatching(ISO_DATE), signedUrl: "", url: fileUrl(bucket, key) })),
      );
      expect((await runForData(page, appId, "prefix") as Array<{ name: string }>).map((entry) => entry.name), "a prefix selects the keys below it").toEqual(["p/a.txt", "p/b.txt", "p/sub/c.txt"]);
      expect(await runForData(page, appId, "none"), "a prefix nothing has: an empty list, a success").toEqual([]);
      expect((await runForData(page, appId, "limit") as Array<{ name: string }>).map((entry) => entry.name), "a limit of 2 is the first two keys in order").toEqual(["p/a.txt", "p/b.txt"]);
    } finally {
      await s3RemoveBucket(server(), bucket);
    }
  });
  test("D16f: a listing cut by the limit cannot be continued (the plugin sends no marker and shows no truncation flag)", { annotation: NO_CONTINUATION_DEFECT }, async ({ page, apiUser }) => {
    const bucket = uniqueBucket();
    const keys = ["k/1.txt", "k/2.txt", "k/3.txt", "k/4.txt", "k/5.txt"];
    try {
      await s3CreateBucket(server(), bucket);
      for (const key of keys) await directPut(bucket, key, key);
      const appId = await s3App(page, apiUser, { first: listObjects(bucket, { limit: 2 }), whole: listObjects(bucket, { limit: 100 }) });

      // control: the server itself reports the cut and offers a continuation token, so a client that asked could go on
      const page1 = await s3Direct(server(), { method: "GET", bucket, query: { "list-type": "2", "max-keys": "2" } });
      expect({ status: page1.status, keys: xmlValues(page1.text, "Key"), truncated: xmlValues(page1.text, "IsTruncated"), hasToken: xmlValues(page1.text, "NextContinuationToken").length }, "the server's own first page").toEqual({
        status: HTTP_OK,
        keys: keys.slice(0, 2),
        truncated: ["true"],
        hasToken: 1,
      });

      const first = await runDraft(page, appId, "first");
      expectSucceeded(first);
      expect(envelopeOf(first).data, "the plugin's answer is a bare array of the first two objects: no token, no flag, no marker field").toEqual(
        keys.slice(0, 2).map((key) => ({ name: key, size: key.length, lastModified: expect.stringMatching(ISO_DATE), signedUrl: "", url: fileUrl(bucket, key) })),
      );
      expect((await runForData(page, appId, "whole") as Array<{ name: string }>).map((entry) => entry.name), "positive control: with a limit above the count the same query shows all five, so the cut came from the limit").toEqual(keys);
    } finally {
      await s3RemoveBucket(server(), bucket);
    }
  });

  test("D16g: listObjects with a delimiter returns only the keys of that level and drops the common prefixes the server answers", { annotation: COMMON_PREFIXES_DEFECT }, async ({ page, apiUser }) => {
    const bucket = uniqueBucket();
    const keys = ["p/a.txt", "p/sub/c.txt", "q/d.txt", "root.txt"];
    try {
      await s3CreateBucket(server(), bucket);
      for (const key of keys) await directPut(bucket, key, key);
      const appId = await s3App(page, apiUser, { top: listObjects(bucket, { delimiter: "/" }), inP: listObjects(bucket, { prefix: "p/", delimiter: "/" }) });

      const direct = await s3Direct(server(), { method: "GET", bucket, query: { delimiter: "/", "list-type": "2" } });
      expect({ keys: xmlValues(direct.text, "Key"), prefixes: xmlValues(direct.text, "Prefix").filter((prefix) => prefix !== "") }, "control: the server answers one key and two common prefixes").toEqual({
        keys: ["root.txt"],
        prefixes: ["p/", "q/"],
      });

      expect((await runForData(page, appId, "top") as Array<{ name: string }>).map((entry) => entry.name), "the plugin shows the key and no folder").toEqual(["root.txt"]);
      expect((await runForData(page, appId, "inP") as Array<{ name: string }>).map((entry) => entry.name), "below a prefix the same: the key of that level only, the sub-folder is missing").toEqual(["p/a.txt"]);
    } finally {
      await s3RemoveBucket(server(), bucket);
    }
  });

  test("D16h: deleteFile removes an existing key and answers success for a key that does not exist, leaving the others", async ({ page, apiUser }) => {
    const bucket = uniqueBucket();
    try {
      await s3CreateBucket(server(), bucket);
      await directPut(bucket, "keep.txt", "keep");
      await directPut(bucket, "gone.txt", "gone");
      const appId = await s3App(page, apiUser, { removeExisting: deleteFile(bucket, "gone.txt"), removeAbsent: deleteFile(bucket, "never-was.txt") });

      expect(await s3DirectKeys(server(), bucket), "before the delete the server holds both keys").toEqual(["gone.txt", "keep.txt"]);
      expect(await runForData(page, appId, "removeExisting"), "the plugin's own answer").toEqual({ success: true });
      expect({ keys: await s3DirectKeys(server(), bucket), gone: (await directObject(bucket, "gone.txt")).status }, "the key is gone from the server, the other stays").toEqual({ keys: ["keep.txt"], gone: HTTP_NOT_FOUND });

      expect(await runForData(page, appId, "removeAbsent"), "a key that was never there is the same answer").toEqual({ success: true });
      expect(await s3DirectKeys(server(), bucket), "and nothing else changed").toEqual(["keep.txt"]);
    } finally {
      await s3RemoveBucket(server(), bucket);
    }
  });
  test("D16i: a presigned URL from listObjects and from uploadData works from the test process, and the same object without the signature or with a changed one is refused", async ({ page, apiUser }) => {
    const bucket = uniqueBucket();
    const key = "signed/e2e file.txt";
    const content = "content behind a presigned URL";
    try {
      await s3CreateBucket(server(), bucket);
      await directPut(bucket, key, content, TEXT_TYPE);
      const appId = await s3App(page, apiUser, {
        listSigned: listObjects(bucket, { returnSignedUrl: true }),
        putSigned: uploadData(bucket, "uploaded.txt", "uploaded and signed", { encoding: "utf8", contentType: TEXT_TYPE, returnSignedUrl: true }),
      });

      const listed = (await runForData(page, appId, "listSigned")) as Array<{ name: string; signedUrl: string; url: string }>;
      expect(listed.map((file) => file.name), "the one object").toEqual([key]);
      const signed = new URL(listed[0]?.signedUrl ?? "");
      expect({ origin: signed.origin, path: signed.pathname }, "the presigned URL addresses the object path-style below the sidecar's IP address").toEqual({ origin: server().endpointUrl, path: "/" + bucket + "/signed/e2e%20file.txt" });
      const params = Object.fromEntries(signed.searchParams);
      expect(
        {
          algorithm: params["X-Amz-Algorithm"],
          payload: params["X-Amz-Content-Sha256"],
          credentialScope: params["X-Amz-Credential"]?.replace(/\/\d{8}\//, "/<date>/"),
          expires: params["X-Amz-Expires"],
          signedHeaders: params["X-Amz-SignedHeaders"],
          signature: SIGNATURE.test(params["X-Amz-Signature"] ?? ""),
        },
        "the stable parts of the presigned URL",
      ).toEqual({
        algorithm: "AWS4-HMAC-SHA256",
        payload: "UNSIGNED-PAYLOAD",
        credentialScope: `${S3.ACCESS_KEY}/<date>/${S3.REGION}/s3/aws4_request`,
        expires: SIGNED_URL_EXPIRES_SECONDS,
        signedHeaders: "host",
        signature: true,
      });

      const fetched = await fetch(signed);
      expect({ status: fetched.status, type: fetched.headers.get("content-type"), text: await fetched.text() }, "the presigned URL downloads the object from the test process, with no key pair").toEqual({ status: HTTP_OK, type: TEXT_TYPE, text: content });

      const unsigned = await fetch(listed[0]?.url ?? "");
      const unsignedText = await unsigned.text();
      expect({ status: unsigned.status, code: xmlValues(unsignedText, "Code") }, "the plain `url` of the same object is refused: the bucket is not public").toEqual({ status: HTTP_FORBIDDEN, code: ["AccessDenied"] });
      const tampered = new URL(signed);
      tampered.searchParams.set("X-Amz-Signature", "0".repeat(64));
      const tamperedAnswer = await fetch(tampered);
      expect({ status: tamperedAnswer.status, code: xmlValues(await tamperedAnswer.text(), "Code") }, "a changed signature is refused by the server's verification").toEqual({ status: HTTP_FORBIDDEN, code: ["SignatureDoesNotMatch"] });
      const otherKey = new URL(signed);
      otherKey.pathname = `/${bucket}/other-key.txt`;
      expect((await fetch(otherKey)).status, "the signature belongs to the key: another key with the same signature is refused").toBe(HTTP_FORBIDDEN);

      const uploaded = (await runForData(page, appId, "putSigned")) as { fileName: string; signedUrl: string; url: string };
      expect({ fileName: uploaded.fileName, url: uploaded.url }, "the upload answers the name and the file URL").toEqual({ fileName: "uploaded.txt", url: fileUrl(bucket, "uploaded.txt") });
      const uploadedFetch = await fetch(uploaded.signedUrl);
      expect({ status: uploadedFetch.status, text: await uploadedFetch.text() }, "the signed URL of the upload downloads what was uploaded").toEqual({ status: HTTP_OK, text: "uploaded and signed" });
    } finally {
      await s3RemoveBucket(server(), bucket);
    }
  });

  test("D16j: keys with spaces, unicode, reserved characters and slashes are stored under their exact names, listed, and read back", { annotation: UNENCODED_URL_DEFECT }, async ({ page, apiUser }) => {
    const bucket = uniqueBucket();
    const keys = ["a+b&c=d.txt", "dir/e2e file.txt", "deep/er/est/key.txt", "percent%20sign.txt", "q?mark#hash.txt", "quote'(star)*!.txt", "semi;colon,comma.txt", "ünï/日本語.txt"];
    try {
      await s3CreateBucket(server(), bucket);
      const queries: Record<string, S3Query> = {};
      keys.forEach((key, index) => {
        queries[`put${index}`] = uploadData(bucket, key, `content of ${key}`, { encoding: "utf8", contentType: TEXT_TYPE });
        queries[`read${index}`] = readFile(bucket, key, "utf8");
      });
      queries.list = listObjects(bucket, { limit: 100 });
      const appId = await s3App(page, apiUser, queries);

      expect(await s3DirectKeys(server(), bucket), "before the uploads the bucket is empty").toEqual([]);
      for (const [index, key] of keys.entries()) {
        expect(await runForData(page, appId, `put${index}`), `upload of ${key}`).toEqual({ fileName: key, signedUrl: "", url: fileUrl(bucket, key) });
      }
      expect(await s3DirectKeys(server(), bucket), "the server holds exactly the keys that were sent, byte for byte").toEqual([...keys].sort());
      for (const [index, key] of keys.entries()) {
        expect(((await runForData(page, appId, `read${index}`)) as { data: string }).data, `read of ${key}`).toBe(`content of ${key}`);
        expect(new TextDecoder().decode((await directObject(bucket, key)).bytes), `the server's own copy of ${key}`).toBe(`content of ${key}`);
      }
      const listed = (await runForData(page, appId, "list")) as Array<{ name: string; url: string }>;
      expect(listed.map((file) => file.name), "the listing shows the same names").toEqual([...keys].sort());
      expect(listed.map((file) => file.url), "the `url` of each object is the endpoint, the bucket and the key as they are: spaces and reserved characters are not encoded").toEqual([...keys].sort().map((key) => fileUrl(bucket, key)));
    } finally {
      await s3RemoveBucket(server(), bucket);
    }
  });

  test("D16k: the server's own errors reach the query as its message: a missing bucket for every action, a missing key, a wrong access key and a wrong secret", async ({ page, apiUser }) => {
    const bucket = uniqueBucket();
    const missing = uniqueBucket();
    try {
      await s3CreateBucket(server(), bucket);
      await directPut(bucket, "present.txt", "present");
      const queries = {
        listMissing: listObjects(missing),
        readMissingBucket: readFile(missing, "present.txt", "utf8"),
        uploadMissing: uploadData(missing, "x.txt", "x", { encoding: "utf8" }),
        deleteMissing: deleteFile(missing, "present.txt"),
        readMissingKey: readFile(bucket, "absent.txt", "utf8"),
        readPresent: readFile(bucket, "present.txt", "utf8"),
        list: listObjects(bucket),
      };
      const appId = await s3App(page, apiUser, queries);
      const wrongKey = await s3App(page, apiUser, { buckets: listBuckets(), list: queries.list, read: queries.readPresent, upload: uploadData(bucket, "x.txt", "x", { encoding: "utf8" }), remove: deleteFile(bucket, "present.txt") }, { accessKey: `${S3.ACCESS_KEY}x` });
      const wrongSecret = await s3App(page, apiUser, { list: queries.list, read: queries.readPresent, upload: uploadData(bucket, "x.txt", "x", { encoding: "utf8" }), remove: deleteFile(bucket, "present.txt"), buckets: listBuckets() }, { secretKey: `${S3.SECRET_KEY}x` });

      // positive controls first: the same data source reads and lists the bucket that exists
      expect(((await runForData(page, appId, "readPresent")) as { data: string }).data, "control: the existing key is read").toBe("present");
      expect((await runForData(page, appId, "list") as Array<{ name: string }>).map((file) => file.name), "control: the existing bucket is listed").toEqual(["present.txt"]);

      expectFailed(await runDraft(page, appId, "listMissing"), SERVER_MESSAGES.NO_SUCH_BUCKET);
      expectFailed(await runDraft(page, appId, "readMissingBucket"), SERVER_MESSAGES.NO_SUCH_BUCKET);
      expectFailed(await runDraft(page, appId, "uploadMissing"), SERVER_MESSAGES.NO_SUCH_BUCKET);
      expectFailed(await runDraft(page, appId, "deleteMissing"), SERVER_MESSAGES.NO_SUCH_BUCKET);
      expectFailed(await runDraft(page, appId, "readMissingKey"), SERVER_MESSAGES.NO_SUCH_KEY);
      expect(await s3DirectKeys(server(), bucket), "the failed calls changed nothing").toEqual(["present.txt"]);

      for (const queryId of ["buckets", "list", "read", "upload", "remove"]) expectFailed(await runDraft(page, wrongKey, queryId), SERVER_MESSAGES.INVALID_ACCESS_KEY);
      for (const queryId of ["buckets", "list", "read", "upload", "remove"]) expectFailed(await runDraft(page, wrongSecret, queryId), SERVER_MESSAGES.SIGNATURE_MISMATCH);
      expect(await s3DirectKeys(server(), bucket), "the refused upload and delete changed nothing").toEqual(["present.txt"]);
    } finally {
      await s3RemoveBucket(server(), bucket);
      await s3RemoveBucket(server(), missing);
    }
  });

  test("D16l: a bucket call without a bucket name reaches no bucket", { annotation: BUCKET_CHECK_DEFECT }, async ({ page, apiUser }) => {
    const bucket = uniqueBucket();
    try {
      await s3CreateBucket(server(), bucket);
      const appId = await s3App(page, apiUser, {
        listEmpty: listObjects(""),
        readEmpty: readFile("", "e2e.txt", "utf8"),
        uploadEmpty: uploadData("", "e2e.txt", "x", { encoding: "utf8" }),
        deleteEmpty: deleteFile("", "e2e.txt"),
        listReal: listObjects(bucket),
      });

      // the one operation that checks the bucket itself; NSD-8 candidate: the others hand the SDK's own text to the user (measured)
      expectFailed(await runDraft(page, appId, "listEmpty"), BUCKET_REQUIRED_MESSAGE);
      expectFailed(await runDraft(page, appId, "readEmpty"), SDK_EMPTY_BUCKET_MESSAGE);
      expectFailed(await runDraft(page, appId, "uploadEmpty"), SDK_EMPTY_BUCKET_MESSAGE);
      expectFailed(await runDraft(page, appId, "deleteEmpty"), SDK_EMPTY_BUCKET_MESSAGE);
      expect(await s3DirectKeys(server(), bucket), "nothing was stored in the existing bucket").toEqual([]);
      // positive control: the same data source with a bucket name works, so the refusals above came from the missing name
      expect(await runForData(page, appId, "listReal"), "the listing of the real, empty bucket").toEqual([]);
    } finally {
      await s3RemoveBucket(server(), bucket);
    }
  });

  test("D16m: a body of several megabytes is stored byte for byte and read back, and the server's length and the plugin's length agree", async ({ page, apiUser }) => {
    const bucket = uniqueBucket();
    const bytes = randomBytes(LARGE_BODY_BYTES);
    try {
      await s3CreateBucket(server(), bucket);
      const appId = await s3App(page, apiUser, {
        put: uploadData(bucket, "large.bin", bytes.toString("base64"), { contentType: BINARY_TYPE }),
        read: readFile(bucket, "large.bin"),
        list: listObjects(bucket),
      });

      expect(await runForData(page, appId, "put"), "the upload answers the name").toMatchObject({ fileName: "large.bin" });
      const stored = await directObject(bucket, "large.bin");
      expect({ status: stored.status, size: stored.bytes.length, sha: sha256(stored.bytes) }, "the server holds every byte").toEqual({ status: HTTP_OK, size: LARGE_BODY_BYTES, sha: sha256(bytes) });
      const read = (await runForData(page, appId, "read")) as { length: number; data: string };
      expect({ length: read.length, sha: sha256(Buffer.from(read.data, "base64")) }, "the plugin reads the same length and bytes").toEqual({ length: LARGE_BODY_BYTES, sha: sha256(bytes) });
      expect(((await runForData(page, appId, "list")) as Array<{ size: number }>).map((file) => file.size), "and the listing's size").toEqual([LARGE_BODY_BYTES]);
    } finally {
      await s3RemoveBucket(server(), bucket);
    }
  });

  test("D16n: uploadData with the default encoding decodes text that is not base64 into other bytes and stores them without a message", { annotation: LENIENT_BASE64_DEFECT }, async ({ page, apiUser }) => {
    const bucket = uniqueBucket();
    const typed = "hello world, this is not base64!";
    try {
      await s3CreateBucket(server(), bucket);
      const appId = await s3App(page, apiUser, {
        defaultEncoding: uploadData(bucket, "typed.txt", typed),
        asText: uploadData(bucket, "typed-as-text.txt", typed, { encoding: "utf8" }),
      });

      await runForData(page, appId, "asText");
      expect((await directObject(bucket, "typed-as-text.txt")).bytes.toString("utf8"), "control: with the text encoding the typed text is stored as typed").toBe(typed);
      expect(await runForData(page, appId, "defaultEncoding"), "with the default encoding the upload succeeds").toMatchObject({ fileName: "typed.txt" });
      const stored = (await directObject(bucket, "typed.txt")).bytes;
      expect(stored.equals(Buffer.from(typed, "base64")), "the server holds what Node's lenient base64 decoder made of the typed text").toBe(true);
      expect(stored.toString("utf8"), "which is not the typed text").not.toBe(typed);
    } finally {
      await s3RemoveBucket(server(), bucket);
    }
  });

  test("D16o: a connection to a port where nothing listens is refused locally, and the same data source works on the server's port", async ({ page, apiUser }) => {
    const sidecar = server();
    const host = new URL(sidecar.endpointUrl).hostname;
    expect(await tcpOutcome(host, CLOSED_PORT), "nothing listens on the closed port").toBe("ECONNREFUSED");
    expect(await tcpOutcome(host, S3.PORT), "control: the sidecar's port accepts the connection").toBe("connected");
    const body = nodePluginDatasourceBody(recordedPluginDatasource(SERVICE_S3), { orgId: apiUser.orgId, config: sidecarConfig({ endpointUrl: `http://${host}:${CLOSED_PORT}` }) });

    const refused = await testDatasourceRaw(page.request, body);

    expect({ status: refused.status, json: refused.json }, "the connection test of the closed port is refused with the connection error").toEqual({ status: HTTP_OK, json: closedPortEnvelope(host) });
    const accepted = await testDatasourceRaw(page.request, nodePluginDatasourceBody(recordedPluginDatasource(SERVICE_S3), { orgId: apiUser.orgId, config: sidecarConfig() }));
    expect({ status: accepted.status, json: accepted.json }, "control: the server's port is accepted with the envelope of a success").toEqual({ status: HTTP_OK, json: ACCEPTED_ENVELOPE });
  });
});
