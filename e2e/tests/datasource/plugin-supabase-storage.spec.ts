import { randomBytes } from "node:crypto";
import type { Page } from "@playwright/test";
import { createApp, createNodePluginDatasource, executeAppQueryRaw, type RawAnswer, type RegisteredUser } from "../../src/api/client";
import { API_OK, TAGS } from "../../src/constants";
import { appDsl, button, nodePluginQuery, stackItems } from "../../src/dsl/builders";
import { recordedPluginDatasource, recordedPluginQuery } from "../../src/dsl/recorded";
import { boundText, boundTextTestId, openSeededView } from "../../src/components/scenario";
import { expect, test } from "../../src/fixtures";
import { recordsContain, type EchoRecord, type EchoTarget } from "../../src/security/echo";

/**
 * D11: the Supabase Storage plugin of node-service (`server/node-service/src/plugins/supabase/run.ts`, the plugin id `supabase`;
 * the Management API plugin `supabaseApi` is D8). It builds a `supabase-js` client for the data source's `projectUrl` with node-service's
 * proxy `fetch` and calls the Storage API below `<projectUrl>/storage/v1`. The project URL is the test's own echo target plus `/sb`, so
 * the tests prove the request the client builds and the path of the canned answer into the app. They are NOT a fidelity test of
 * Supabase.
 *
 * Measured on the images `3.0.0-e2e` and `3.0.1-e2e` (same requests and answers on both; supabase-js 2.45.4 prints itself in `x-client-info`):
 * - The client keeps the path of the project URL, with or without a trailing slash: `<target>/sb/storage/v1/...`. The host is the one of
 *   the project URL (the `e2e-echo` alias): no host name is derived from it, so every request reaches the echo.
 * - The API key travels in two headers, `apikey: <key>` and `authorization: Bearer <key>`; the tests assert both and that the key is
 *   in no other header, path or body of any request, nor in any answer of the query.
 * - Requests carry the proxy fetch's `node-fetch` user agent, `accept-encoding: gzip,deflate` and `connection: close`.
 *
 * Not covered: a real Supabase project, the data source form's connection test (the plugin wires none: its validator is not registered).
 */
const NODE_SERVICE_DETAILS = { tag: [TAGS.NODE_SERVICE] };

/** Candidate defect: only listObjects checks the bucket (`Bucket is required`); the other operations send a request for an empty bucket name. */
const EMPTY_BUCKET_DEFECT = { type: "defect", description: "D-77 candidate" } as const;
/** Observation: an upload without a content type sends an empty `content-type` header (the editor's default is an empty text). */
const EMPTY_CONTENT_TYPE_OBSERVATION = { type: "observation", description: "an upload without a content type sends an empty content-type header" } as const;

const HTTP_OK = 200;
const HTTP_UNAUTHORIZED = 401;
const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;
const QUERY_CODE_OK = "OK";
const QUERY_CODE_FAILED = "FAILED";
const MARKER_BYTES = 4;
const QUERY_ID = "q1";
const QUERY_NAME = "q";
const BUTTON_TEST_ID = "e2e-supabase-run";
const RESULT_NAME = "label";
const RAW_NAME = "raw";
const SUCCESS_NAME = "succeeded";
const JSON_CONTENT_TYPE = "application/json";
const TEXT_CONTENT_TYPE = "text/plain";
const SUPABASE_PLUGIN = "supabase";

/** The project URL of every test is the echo target plus this path; the Storage API lives below `STORAGE_PATH` of it. */
const PROJECT_PATH = "/sb";
const STORAGE_PATH = "/storage/v1";

/** What node-service's proxy fetch sends on every request (measured). */
const NODE_FETCH_AGENT = "node-fetch/1.0 (+https://github.com/bitinn/node-fetch)";
const ACCEPT_ENCODING = "gzip,deflate";
const CONNECTION_CLOSE = "close";
const ACCEPT_ANY = "*/*";
const CLIENT_INFO = /^supabase-js-node\/\d+\.\d+\.\d+$/;
/** What a normalised header holds instead of a value that differs per image. */
const SHAPE_OK = "<matches the expected shape>";
const SHAPE_BAD = "<does NOT match the expected shape>";
/** The header storage-js adds to every upload (measured). */
const UPLOAD_CACHE_CONTROL = "max-age=3600";
const UPLOAD_UPSERT = "false";

const CANNED_ERROR_MESSAGE = "e2e-storage-error";
const BUCKET_REQUIRED = "Bucket is required";

/** The validity of a signed URL, in seconds: the API takes seconds and the plugin asks for five minutes. */
const SIGNED_URL_SECONDS = 60 * 5;

const BUCKET = "e2e";
const FILE = "a.txt";
const PREFIX = "p";
/** The path and the search text of D11e: distinctive, so a record that holds them proves the field travelled. */
const SEARCH_PREFIX = "e2e-prefix-folder";
const SEARCH_TEXT = "e2e-search-needle";
const TIMESTAMP = "2020-01-01T00:00:00.000Z";

/** Canned Storage API answers. */
const BUCKETS = [{ id: BUCKET, name: BUCKET, owner: "e2e-owner", public: false, created_at: TIMESTAMP, updated_at: TIMESTAMP }];
const LISTED_FILES = [{ name: FILE, id: "e2e-id", updated_at: TIMESTAMP, metadata: { size: 5 } }];
const UPLOAD_ANSWER = { Key: `${BUCKET}/up.txt`, Id: "e2e-upload-id" };

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

function onlyRecord(records: EchoRecord[]): EchoRecord {
  expect(records, "the echo received exactly one request").toHaveLength(1);
  return records[0] as EchoRecord;
}

/** The API key of a test: a value that must reach the echo only in the two headers that carry it. */
function keyOf(marker: string): string {
  return `e2eSecretKey${marker}`;
}

/** The URL of the Storage API below the echo target, as the plugin's results show it (`url`, `signedUrl`). */
function storageUrl(echo: EchoTarget): string {
  return `${echo.url}${PROJECT_PATH}${STORAGE_PATH}`;
}

/** What one recorded storage request must look like. `json` is the parsed body of a JSON request, `rawBody` the exact text of any other. */
interface ExpectedStorageRequest {
  method: string;
  /** Path and query below `<target>/sb/storage/v1`. */
  path: string;
  key: string;
  json?: unknown;
  rawBody?: string;
  /** The `content-type` of a request that has a body (JSON requests default to `application/json`). */
  contentType?: string;
  /** Further stable headers (`cache-control`, `x-upsert`). */
  extraHeaders?: Record<string, string>;
}

/**
 * Asserts one recorded storage request completely: method, path and query, body (a JSON body member for member, other bodies as text),
 * the COMPLETE header set (each header's value; `x-client-info` by shape) and that the API key is in exactly the headers `apikey` and
 * `authorization` (`Bearer <key>`).
 */
function expectStorageRequest(record: EchoRecord, echo: EchoTarget, expected: ExpectedStorageRequest, label: string): void {
  expect(record.method, `${label}: the method`).toBe(expected.method);
  expect(record.path, `${label}: the path and query`).toBe(`${echo.path}${PROJECT_PATH}${STORAGE_PATH}${expected.path}`);
  const hasBody = expected.json !== undefined || expected.rawBody !== undefined;
  if (expected.json !== undefined) {
    expect(JSON.parse(record.body), `${label}: the JSON body, member for member`).toEqual(expected.json);
  } else {
    expect(record.body, `${label}: the body`).toBe(expected.rawBody ?? "");
  }
  const clientInfo = record.headers["x-client-info"];
  expect(
    { ...record.headers, "x-client-info": typeof clientInfo === "string" && CLIENT_INFO.test(clientInfo) ? SHAPE_OK : SHAPE_BAD },
    `${label}: the complete header set`,
  ).toEqual({
    apikey: expected.key,
    authorization: `Bearer ${expected.key}`,
    "x-client-info": SHAPE_OK,
    accept: ACCEPT_ANY,
    "user-agent": NODE_FETCH_AGENT,
    "accept-encoding": ACCEPT_ENCODING,
    host: new URL(echo.url).host,
    connection: CONNECTION_CLOSE,
    ...(hasBody ? { "content-length": String(Buffer.byteLength(record.body)), "content-type": expected.contentType ?? JSON_CONTENT_TYPE } : {}),
    ...expected.extraHeaders,
  });
}

/**
 * The API key is in the headers `apikey` and `authorization` by design (asserted by `expectStorageRequest`) and nowhere else: with those two
 * removed, no header, path or body of any request holds it, and no answer of the query does. Positive control: the unstripped records do hold it.
 */
function expectKeyOnlyInItsHeaders(records: EchoRecord[], key: string, answers: Array<{ json: unknown }>, label: string): void {
  expect(recordsContain(records, key), `${label}: positive control, the key reaches the echo in its two headers`).toBe(true);
  const stripped = records.map((record) => {
    const { apikey: _apikey, authorization: _authorization, ...others } = record.headers;
    return { ...record, headers: others };
  });
  expect(recordsContain(stripped, key), `${label}: the key is in no other header, path or body`).toBe(false);
  for (const answer of answers) expect(JSON.stringify(answer.json).includes(key), `${label}: the key is in no answer of the query`).toBe(false);
}

/** Asserts a signed-URL body's `expiresIn` is five minutes in seconds and returns it; the rest of the body is asserted by the caller. */
function expiresInOf(record: EchoRecord, label: string): number {
  const value = (JSON.parse(record.body) as { expiresIn?: unknown }).expiresIn;
  expect(value, `${label}: expiresIn is the validity in seconds`).toBe(SIGNED_URL_SECONDS);
  return SIGNED_URL_SECONDS;
}

/** A data source from the recording whose project URL is the echo target's `/sb` (`suffix` appended, e.g. a slash) and whose key is `key`. */
async function supabaseDatasource(page: Page, apiUser: RegisteredUser, echo: EchoTarget, key: string, suffix = ""): Promise<string> {
  return createNodePluginDatasource(page.request, {
    orgId: apiUser.orgId,
    recorded: recordedPluginDatasource(SUPABASE_PLUGIN),
    config: { projectUrl: `${echo.url}${PROJECT_PATH}${suffix}`, apiKey: key },
  });
}

/** A saved app with one manual query of the recorded `variant` (not published: the draft runs with `viewMode: false`). */
async function supabaseApp(page: Page, apiUser: RegisteredUser, echo: EchoTarget, key: string, variant: string, action: Record<string, unknown>, suffix = ""): Promise<string> {
  const datasourceId = await supabaseDatasource(page, apiUser, echo, key, suffix);
  const query = nodePluginQuery({ id: QUERY_ID, name: QUERY_NAME, datasourceId, recorded: recordedPluginQuery(SUPABASE_PLUGIN, variant), action });
  const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-supabase", dsl: appDsl([], { queries: [query] }) });
  return appId;
}

async function runDraft(page: Page, appId: string): Promise<RawAnswer> {
  return executeAppQueryRaw(page.request, { applicationId: appId, queryId: QUERY_ID, viewMode: false });
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
  expect({ success: envelopeOf(answer).success, queryCode: envelopeOf(answer).queryCode, message: envelopeOf(answer).message, data: envelopeOf(answer).data }, "the query failed with the message of the answer").toEqual({
    success: false,
    queryCode: QUERY_CODE_FAILED,
    message,
    data: null,
  });
}

/** Makes the echo answer everything below the storage API of this test's project with `body`, unless a longer sub-path has its own answer. */
async function answerStorage(echo: EchoTarget, subPath: string, status: number, body: unknown, contentType = JSON_CONTENT_TYPE): Promise<void> {
  await echo.answer(`${PROJECT_PATH}${STORAGE_PATH}${subPath}`, { status, contentType, body: typeof body === "string" ? body : JSON.stringify(body) });
}

test.describe("Supabase Storage data source against the echo", NODE_SERVICE_DETAILS, () => {
  test("D11a: listBuckets is a GET of the bucket list with the key in apikey and authorization", async ({ page, apiUser, echo }) => {
    const key = keyOf(uniqueMarker());
    await answerStorage(echo, "/bucket", HTTP_OK, BUCKETS);
    const appId = await supabaseApp(page, apiUser, echo, key, "", {});
    expect(await echo.received(), "before the run the echo holds nothing of this test").toEqual([]);

    const answer = await runDraft(page, appId);

    expectSucceeded(answer);
    const records = await echo.received();
    expectStorageRequest(onlyRecord(records), echo, { method: "GET", path: "/bucket", key }, "listBuckets");
    expectKeyOnlyInItsHeaders(records, key, [answer], "listBuckets");
    expect(envelopeOf(answer).data, "the buckets exactly as the API answered").toEqual(BUCKETS);
  });

  for (const row of [
    { title: "without a trailing slash", suffix: "" },
    { title: "with a trailing slash", suffix: "/" },
  ]) {
    test(`D11b: a project URL ${row.title} keeps its path and reaches the storage API below it`, async ({ page, apiUser, echo }) => {
      const key = keyOf(uniqueMarker());
      await answerStorage(echo, "/bucket", HTTP_OK, BUCKETS);
      const appId = await supabaseApp(page, apiUser, echo, key, "", {}, row.suffix);

      const answer = await runDraft(page, appId);

      expectSucceeded(answer);
      // the same path with and without the slash: `<target>/sb/storage/v1/bucket`, never `<target>/storage/v1/bucket`
      const records = await echo.received();
      expectStorageRequest(onlyRecord(records), echo, { method: "GET", path: "/bucket", key }, `project URL ${row.title}`);
      expectKeyOnlyInItsHeaders(records, key, [answer], `project URL ${row.title}`);
      expect(envelopeOf(answer).data, "the buckets").toEqual(BUCKETS);
    });
  }

  test("D11c: listObjects posts the prefix with the editor's defaults and answers each file with its public URL", async ({ page, apiUser, echo }) => {
    const key = keyOf(uniqueMarker());
    await answerStorage(echo, `/object/list/${BUCKET}`, HTTP_OK, LISTED_FILES);
    const appId = await supabaseApp(page, apiUser, echo, key, "ListObjects", { bucket: BUCKET, path: PREFIX });

    const answer = await runDraft(page, appId);

    expectSucceeded(answer);
    const records = await echo.received();
    // bucket in the PATH, not the host; the recorded defaults: limit 10, offset 0 (an empty text), sort by name ascending
    expectStorageRequest(
      onlyRecord(records),
      echo,
      { method: "POST", path: `/object/list/${BUCKET}`, key, json: { limit: 10, offset: 0, sortBy: { column: "name", order: "asc" }, prefix: PREFIX } },
      "listObjects",
    );
    expectKeyOnlyInItsHeaders(records, key, [answer], "listObjects");
    expect(envelopeOf(answer).data, "the listed file and the public URL of it below the project URL, no signed URL").toEqual([
      { ...LISTED_FILES[0], url: `${storageUrl(echo)}/object/public/${BUCKET}/${PREFIX}/${FILE}` },
    ]);
  });

  test("D11d: listObjects sends the limit, the offset and the sort order of the query", async ({ page, apiUser, echo }) => {
    const key = keyOf(uniqueMarker());
    await answerStorage(echo, `/object/list/${BUCKET}`, HTTP_OK, []);
    const sortBy = { column: "updated_at", order: "desc" };
    const appId = await supabaseApp(page, apiUser, echo, key, "ListObjects", { bucket: BUCKET, path: "", limit: 3, offset: 2, sortBy: JSON.stringify(sortBy) });

    const answer = await runDraft(page, appId);

    expectSucceeded(answer);
    const records = await echo.received();
    expectStorageRequest(onlyRecord(records), echo, { method: "POST", path: `/object/list/${BUCKET}`, key, json: { limit: 3, offset: 2, sortBy, prefix: "" } }, "listObjects with paging");
    expectKeyOnlyInItsHeaders(records, key, [answer], "listObjects with paging");
    expect(envelopeOf(answer).data, "an empty listing is an empty list").toEqual([]);
  });

  test("D11e: the search field of listObjects is sent", async ({ page, apiUser, echo }) => {
    const key = keyOf(uniqueMarker());
    await answerStorage(echo, `/object/list/${BUCKET}`, HTTP_OK, []);
    const searched = await supabaseApp(page, apiUser, echo, key, "ListObjects", { bucket: BUCKET, path: SEARCH_PREFIX, search: SEARCH_TEXT });

    const answer = await runDraft(page, searched);

    expectSucceeded(answer);
    const records = await echo.received();
    // the search text travels in the body next to the prefix, paging and sorting
    expectStorageRequest(
      onlyRecord(records),
      echo,
      { method: "POST", path: `/object/list/${BUCKET}`, key, json: { limit: 10, offset: 0, sortBy: { column: "name", order: "asc" }, prefix: SEARCH_PREFIX, search: SEARCH_TEXT } },
      "listObjects with a search text",
    );
    expect(recordsContain(records, SEARCH_TEXT), "the search text reaches the echo").toBe(true);
    expectKeyOnlyInItsHeaders(records, key, [answer], "listObjects with a search text");
  });

  test("D11f: listObjects with returnSignedUrl signs every listed path in one more request", async ({ page, apiUser, echo }) => {
    const key = keyOf(uniqueMarker());
    const signedPath = `/object/sign/${BUCKET}/${PREFIX}/${FILE}?token=t1`;
    await answerStorage(echo, `/object/list/${BUCKET}`, HTTP_OK, LISTED_FILES);
    await answerStorage(echo, `/object/sign/${BUCKET}`, HTTP_OK, [{ error: null, path: `${PREFIX}/${FILE}`, signedURL: signedPath }]);
    const appId = await supabaseApp(page, apiUser, echo, key, "ListObjects", { bucket: BUCKET, path: PREFIX, returnSignedUrl: true });

    const answer = await runDraft(page, appId);

    expectSucceeded(answer);
    const records = await echo.received();
    expect(records, "the echo holds the listing and the signing").toHaveLength(2);
    expectStorageRequest(records[0] as EchoRecord, echo, { method: "POST", path: `/object/list/${BUCKET}`, key, json: { limit: 10, offset: 0, sortBy: { column: "name", order: "asc" }, prefix: PREFIX } }, "the listing");
    const expiresIn = expiresInOf(records[1] as EchoRecord, "the signing");
    expectStorageRequest(records[1] as EchoRecord, echo, { method: "POST", path: `/object/sign/${BUCKET}`, key, json: { expiresIn, paths: [`${PREFIX}/${FILE}`] } }, "the signing");
    expectKeyOnlyInItsHeaders(records, key, [answer], "listObjects with signed URLs");
    expect(envelopeOf(answer).data, "the file with its signed URL (the API's relative URL below the project's storage URL) and its public URL").toEqual([
      { ...LISTED_FILES[0], signedUrl: `${storageUrl(echo)}${signedPath}`, url: `${storageUrl(echo)}/object/public/${BUCKET}/${PREFIX}/${FILE}` },
    ]);
  });

  for (const row of [
    { title: "text", encoding: "utf8", expected: "hello e2e" },
    { title: "base64 (the default)", encoding: undefined, expected: Buffer.from("hello e2e", "utf8").toString("base64") },
  ]) {
    test(`D11g: readFile as ${row.title} downloads the object and answers its data and content type`, async ({ page, apiUser, echo }) => {
      const key = keyOf(uniqueMarker());
      await answerStorage(echo, `/object/${BUCKET}`, HTTP_OK, "hello e2e", TEXT_CONTENT_TYPE);
      const appId = await supabaseApp(page, apiUser, echo, key, "ReadFile", { bucket: BUCKET, fileName: "dir/a b.txt", ...(row.encoding ? { encoding: row.encoding } : {}) });

      const answer = await runDraft(page, appId);

      expectSucceeded(answer);
      const records = await echo.received();
      // the object name is percent-encoded in the path, bucket first
      expectStorageRequest(onlyRecord(records), echo, { method: "GET", path: `/object/${BUCKET}/dir/a%20b.txt`, key }, "readFile");
      expectKeyOnlyInItsHeaders(records, key, [answer], "readFile");
      expect(envelopeOf(answer).data, "the data in the requested encoding and the answer's content type").toEqual({ data: row.expected, type: TEXT_CONTENT_TYPE });
    });
  }

  test("D11h: readFile with a transform downloads the rendered image and sends the transform as query parameters", async ({ page, apiUser, echo }) => {
    const key = keyOf(uniqueMarker());
    await answerStorage(echo, `/render/image`, HTTP_OK, "image-bytes", "image/png");
    const appId = await supabaseApp(page, apiUser, echo, key, "ReadFile", { bucket: BUCKET, fileName: "x.png", encoding: "utf8", transform: JSON.stringify({ width: 10 }) });

    const answer = await runDraft(page, appId);

    expectSucceeded(answer);
    const records = await echo.received();
    expectStorageRequest(onlyRecord(records), echo, { method: "GET", path: `/render/image/authenticated/${BUCKET}/x.png?width=10`, key }, "readFile with a transform");
    expectKeyOnlyInItsHeaders(records, key, [answer], "readFile with a transform");
    expect(envelopeOf(answer).data, "the rendered bytes and their content type").toEqual({ data: "image-bytes", type: "image/png" });
  });

  test("D11i: uploadData of text with a content type posts the text and answers the stored path", async ({ page, apiUser, echo }) => {
    const key = keyOf(uniqueMarker());
    await answerStorage(echo, `/object/${BUCKET}`, HTTP_OK, UPLOAD_ANSWER);
    const appId = await supabaseApp(page, apiUser, echo, key, "UploadData", { bucket: BUCKET, fileName: "up.txt", encoding: "utf8", data: "hello up", contentType: TEXT_CONTENT_TYPE });

    const answer = await runDraft(page, appId);

    expectSucceeded(answer);
    const records = await echo.received();
    expectStorageRequest(
      onlyRecord(records),
      echo,
      { method: "POST", path: `/object/${BUCKET}/up.txt`, key, rawBody: "hello up", contentType: TEXT_CONTENT_TYPE, extraHeaders: { "cache-control": UPLOAD_CACHE_CONTROL, "x-upsert": UPLOAD_UPSERT } },
      "uploadData",
    );
    expectKeyOnlyInItsHeaders(records, key, [answer], "uploadData");
    expect(envelopeOf(answer).data, "the path the API answered, its id and the full path").toEqual({ path: "up.txt", id: UPLOAD_ANSWER.Id, fullPath: UPLOAD_ANSWER.Key });
  });

  test("D11j: uploadData of base64 without a content type posts the decoded bytes with an empty content-type header", { annotation: EMPTY_CONTENT_TYPE_OBSERVATION }, async ({ page, apiUser, echo }) => {
    const key = keyOf(uniqueMarker());
    await answerStorage(echo, `/object/${BUCKET}`, HTTP_OK, UPLOAD_ANSWER);
    const appId = await supabaseApp(page, apiUser, echo, key, "UploadData", { bucket: BUCKET, fileName: "up.txt", data: Buffer.from("hello", "utf8").toString("base64") });

    const answer = await runDraft(page, appId);

    expectSucceeded(answer);
    const records = await echo.received();
    expectStorageRequest(
      onlyRecord(records),
      echo,
      { method: "POST", path: `/object/${BUCKET}/up.txt`, key, rawBody: "hello", contentType: "", extraHeaders: { "cache-control": UPLOAD_CACHE_CONTROL, "x-upsert": UPLOAD_UPSERT } },
      "uploadData without a content type",
    );
    expectKeyOnlyInItsHeaders(records, key, [answer], "uploadData without a content type");
    expect(envelopeOf(answer).data, "the stored path").toEqual({ path: "up.txt", id: UPLOAD_ANSWER.Id, fullPath: UPLOAD_ANSWER.Key });
  });

  test("D11k: uploadData with returnSignedUrl uploads, then asks for a signed URL of the same name", async ({ page, apiUser, echo }) => {
    const key = keyOf(uniqueMarker());
    const signedPath = `/object/sign/${BUCKET}/up.txt?token=t2`;
    await answerStorage(echo, `/object/${BUCKET}`, HTTP_OK, UPLOAD_ANSWER);
    await answerStorage(echo, `/object/sign/${BUCKET}`, HTTP_OK, { signedURL: signedPath });
    const appId = await supabaseApp(page, apiUser, echo, key, "UploadData", { bucket: BUCKET, fileName: "up.txt", encoding: "utf8", data: "hello up", contentType: TEXT_CONTENT_TYPE, returnSignedUrl: true });

    const answer = await runDraft(page, appId);

    expectSucceeded(answer);
    const records = await echo.received();
    expect(records, "the echo holds the upload and the signing").toHaveLength(2);
    expectStorageRequest(
      records[0] as EchoRecord,
      echo,
      { method: "POST", path: `/object/${BUCKET}/up.txt`, key, rawBody: "hello up", contentType: TEXT_CONTENT_TYPE, extraHeaders: { "cache-control": UPLOAD_CACHE_CONTROL, "x-upsert": UPLOAD_UPSERT } },
      "the upload",
    );
    const expiresIn = expiresInOf(records[1] as EchoRecord, "the signing");
    expectStorageRequest(records[1] as EchoRecord, echo, { method: "POST", path: `/object/sign/${BUCKET}/up.txt`, key, json: { expiresIn } }, "the signing");
    expectKeyOnlyInItsHeaders(records, key, [answer], "uploadData with a signed URL");
    expect(envelopeOf(answer).data, "the stored path and the signed URL below the project's storage URL").toEqual({
      path: "up.txt",
      id: UPLOAD_ANSWER.Id,
      fullPath: UPLOAD_ANSWER.Key,
      signedUrl: `${storageUrl(echo)}${signedPath}`,
    });
  });

  test("D11l: deleteFile sends a DELETE with the name in a prefixes list and answers success", async ({ page, apiUser, echo }) => {
    const key = keyOf(uniqueMarker());
    await answerStorage(echo, `/object/${BUCKET}`, HTTP_OK, []);
    const appId = await supabaseApp(page, apiUser, echo, key, "DeleteFile", { bucket: BUCKET, fileName: FILE });

    const answer = await runDraft(page, appId);

    expectSucceeded(answer);
    const records = await echo.received();
    expectStorageRequest(onlyRecord(records), echo, { method: "DELETE", path: `/object/${BUCKET}`, key, json: { prefixes: [FILE] } }, "deleteFile");
    expectKeyOnlyInItsHeaders(records, key, [answer], "deleteFile");
    expect(envelopeOf(answer).data, "the plugin's own answer, not the API's").toEqual({ success: true });
  });

  test("D11m: createSignedUrl posts the validity and answers the signed URL below the project's storage URL", async ({ page, apiUser, echo }) => {
    const key = keyOf(uniqueMarker());
    const signedPath = `/object/sign/${BUCKET}/${FILE}?token=t3`;
    await answerStorage(echo, `/object/sign/${BUCKET}`, HTTP_OK, { signedURL: signedPath });
    const first = await supabaseApp(page, apiUser, echo, key, "CreateSignedUrl", { bucket: BUCKET, fileName: FILE });

    const answer = await runDraft(page, first);

    expectSucceeded(answer);
    const records = await echo.received();
    const firstRecord = onlyRecord(records);
    const expiresIn = expiresInOf(firstRecord, "the first signing");
    expectStorageRequest(firstRecord, echo, { method: "POST", path: `/object/sign/${BUCKET}/${FILE}`, key, json: { expiresIn } }, "createSignedUrl");
    expectKeyOnlyInItsHeaders(records, key, [answer], "createSignedUrl");
    expect(envelopeOf(answer).data, "the signed URL").toEqual({ signedUrl: `${storageUrl(echo)}${signedPath}` });

    // a second query sends the very same validity
    const second = await supabaseApp(page, apiUser, echo, key, "CreateSignedUrl", { bucket: BUCKET, fileName: FILE });
    const secondAnswer = await runDraft(page, second);
    expectSucceeded(secondAnswer);
    const afterSecond = await echo.received();
    expect(afterSecond, "the echo holds both signings").toHaveLength(2);
    expect(expiresInOf(afterSecond[1] as EchoRecord, "the second signing"), "the second signing carries the same expiresIn").toBe(expiresIn);
    expectStorageRequest(afterSecond[1] as EchoRecord, echo, { method: "POST", path: `/object/sign/${BUCKET}/${FILE}`, key, json: { expiresIn } }, "createSignedUrl, second query");
    expect(envelopeOf(secondAnswer).data, "the second signed URL").toEqual({ signedUrl: `${storageUrl(echo)}${signedPath}` });
    expectKeyOnlyInItsHeaders(afterSecond, key, [answer, secondAnswer], "both createSignedUrl queries");
  });

  test.describe("a storage error answer fails the query with the message of the answer", () => {
    const rows = [
      {
        title: "listBuckets 400",
        variant: "",
        action: {},
        subPath: "/bucket",
        status: HTTP_BAD_REQUEST,
        request: { method: "GET", path: "/bucket" },
        okBody: BUCKETS,
        okData: BUCKETS,
      },
      {
        title: "readFile 404",
        variant: "ReadFile",
        action: { bucket: BUCKET, fileName: "absent.txt", encoding: "utf8" },
        subPath: `/object/${BUCKET}`,
        status: HTTP_NOT_FOUND,
        request: { method: "GET", path: `/object/${BUCKET}/absent.txt` },
        okBody: "present",
        okData: { data: "present", type: JSON_CONTENT_TYPE },
      },
      {
        title: "listBuckets 401",
        variant: "",
        action: {},
        subPath: "/bucket",
        status: HTTP_UNAUTHORIZED,
        request: { method: "GET", path: "/bucket" },
        okBody: BUCKETS,
        okData: BUCKETS,
      },
    ];
    for (const row of rows) {
      test(`D11n: ${row.title}`, async ({ page, apiUser, echo }) => {
        const key = keyOf(uniqueMarker());
        await answerStorage(echo, row.subPath, row.status, { statusCode: String(row.status), error: "e2e", message: CANNED_ERROR_MESSAGE });
        const appId = await supabaseApp(page, apiUser, echo, key, row.variant, row.action);

        const failed = await runDraft(page, appId);

        // the message of the answer reaches the user
        expectFailed(failed, CANNED_ERROR_MESSAGE);
        const afterFailure = await echo.received();
        expectStorageRequest(onlyRecord(afterFailure), echo, { ...row.request, key }, `the failing ${row.title}`);

        // control: the same query on the same data source succeeds once the API answers 200, so the answer decided
        await answerStorage(echo, row.subPath, HTTP_OK, row.okBody);
        const control = await runDraft(page, appId);

        expectSucceeded(control);
        expect(envelopeOf(control).data, "control: the canned success data").toEqual(row.okData);
        const records = await echo.received();
        expect(records, "the echo holds the failing and the control request").toHaveLength(2);
        expectStorageRequest(records[1] as EchoRecord, echo, { ...row.request, key }, `the control ${row.title}`);
        expectKeyOnlyInItsHeaders(records, key, [failed, control], row.title);
      });
    }

    test("D11o: createSignedUrl and listObjects fail the same way", async ({ page, apiUser, echo }) => {
      const key = keyOf(uniqueMarker());
      await answerStorage(echo, "", HTTP_BAD_REQUEST, { statusCode: "400", error: "e2e", message: CANNED_ERROR_MESSAGE });
      const signing = await supabaseApp(page, apiUser, echo, key, "CreateSignedUrl", { bucket: BUCKET, fileName: FILE });
      const listing = await supabaseApp(page, apiUser, echo, key, "ListObjects", { bucket: BUCKET });

      const signingAnswer = await runDraft(page, signing);
      const listingAnswer = await runDraft(page, listing);

      expectFailed(signingAnswer, CANNED_ERROR_MESSAGE);
      expectFailed(listingAnswer, CANNED_ERROR_MESSAGE);
      const records = await echo.received();
      expect(records, "the echo holds the signing and the listing").toHaveLength(2);
      expectStorageRequest(records[0] as EchoRecord, echo, { method: "POST", path: `/object/sign/${BUCKET}/${FILE}`, key, json: { expiresIn: expiresInOf(records[0] as EchoRecord, "the signing") } }, "the failing signing");
      expectStorageRequest(records[1] as EchoRecord, echo, { method: "POST", path: `/object/list/${BUCKET}`, key, json: { limit: 10, offset: 0, sortBy: { column: "name", order: "asc" }, prefix: "" } }, "the failing listing");
      expectKeyOnlyInItsHeaders(records, key, [signingAnswer, listingAnswer], "the failing calls");

      // control: the same two queries succeed once the API answers 200 on those paths, so the answers decided
      const signedPath = `/object/sign/${BUCKET}/${FILE}?token=t5`;
      await answerStorage(echo, "/object/sign", HTTP_OK, { signedURL: signedPath });
      await answerStorage(echo, "/object/list", HTTP_OK, []);
      const signedAnswer = await runDraft(page, signing);
      const listedAnswer = await runDraft(page, listing);

      expectSucceeded(signedAnswer);
      expectSucceeded(listedAnswer);
      expect(envelopeOf(signedAnswer).data, "control: the signed URL").toEqual({ signedUrl: `${storageUrl(echo)}${signedPath}` });
      expect(envelopeOf(listedAnswer).data, "control: the empty listing").toEqual([]);
      const all = await echo.received();
      expect(all, "the echo holds the two failing and the two control requests").toHaveLength(4);
      expectStorageRequest(all[2] as EchoRecord, echo, { method: "POST", path: `/object/sign/${BUCKET}/${FILE}`, key, json: { expiresIn: expiresInOf(all[2] as EchoRecord, "the control signing") } }, "the control signing");
      expectStorageRequest(all[3] as EchoRecord, echo, { method: "POST", path: `/object/list/${BUCKET}`, key, json: { limit: 10, offset: 0, sortBy: { column: "name", order: "asc" }, prefix: "" } }, "the control listing");
      expectKeyOnlyInItsHeaders(all, key, [signingAnswer, listingAnswer, signedAnswer, listedAnswer], "the failing and the control calls");
    });
  });

  test("D11p: only listObjects refuses an empty bucket; the other operations send a request for it", { annotation: EMPTY_BUCKET_DEFECT }, async ({ page, apiUser, echo }) => {
    const key = keyOf(uniqueMarker());
    await answerStorage(echo, "/object", HTTP_OK, UPLOAD_ANSWER);
    await answerStorage(echo, "/object/sign", HTTP_OK, { signedURL: "/object/sign/x?token=t4" });
    const listing = await supabaseApp(page, apiUser, echo, key, "ListObjects", { bucket: "" });

    const refused = await runDraft(page, listing);
    expectFailed(refused, BUCKET_REQUIRED);
    expect(await echo.received(), "listObjects sent nothing").toEqual([]);

    // D-77 candidate: the other four send a request whose path has an empty bucket segment
    const rows: Array<{ variant: string; action: Record<string, unknown>; request: Omit<ExpectedStorageRequest, "key"> }> = [
      { variant: "ReadFile", action: { bucket: "", fileName: "x.txt", encoding: "utf8" }, request: { method: "GET", path: "/object//x.txt" } },
      {
        variant: "UploadData",
        action: { bucket: "", fileName: "x.txt", encoding: "utf8", data: "x", contentType: TEXT_CONTENT_TYPE },
        request: { method: "POST", path: "/object//x.txt", rawBody: "x", contentType: TEXT_CONTENT_TYPE, extraHeaders: { "cache-control": UPLOAD_CACHE_CONTROL, "x-upsert": UPLOAD_UPSERT } },
      },
      { variant: "DeleteFile", action: { bucket: "", fileName: "x.txt" }, request: { method: "DELETE", path: "/object/", json: { prefixes: ["x.txt"] } } },
      { variant: "CreateSignedUrl", action: { bucket: "", fileName: "x.txt" }, request: { method: "POST", path: "/object/sign//x.txt" } },
    ];
    const answers: RawAnswer[] = [refused];
    for (const [index, row] of rows.entries()) {
      const appId = await supabaseApp(page, apiUser, echo, key, row.variant, row.action);
      const answer = await runDraft(page, appId);
      answers.push(answer);
      expectSucceeded(answer);
      const records = await echo.received();
      expect(records, `${row.variant}: exactly one more request reached the echo`).toHaveLength(index + 1);
      const record = records[index] as EchoRecord;
      const request = row.variant === "CreateSignedUrl" ? { ...row.request, json: { expiresIn: expiresInOf(record, row.variant) } } : row.request;
      expectStorageRequest(record, echo, { ...request, key }, `${row.variant} with an empty bucket`);
    }
    expectKeyOnlyInItsHeaders(await echo.received(), key, answers, "the empty-bucket calls");
  });

  test("D11q: the published view shows the bucket name after a click", async ({ page, apiUser, echo }) => {
    const key = keyOf(uniqueMarker());
    await answerStorage(echo, "/bucket", HTTP_OK, BUCKETS);
    const datasourceId = await supabaseDatasource(page, apiUser, echo, key);
    // before the first run `q.data` is not a list
    const expression = `{{${QUERY_NAME}.data ? ${QUERY_NAME}.data[0].name : ""}}`;
    const view = await openSeededView(
      page,
      apiUser.orgId,
      "e2e-supabase-view",
      stackItems([
        button({ id: "b1", name: "button1", text: "Run", testId: BUTTON_TEST_ID, onClickQuery: QUERY_NAME }),
        boundText({ id: "t1", name: RESULT_NAME, expression }),
        // `success` also reads `true` before the first run (measured on the Turso view), so only the state after the click proves anything
        boundText({ id: "t2", name: SUCCESS_NAME, expression: `{{String(${QUERY_NAME}.success)}}` }),
        // the whole answer of the query as text, to search it for the key
        boundText({ id: "t3", name: RAW_NAME, expression: `{{JSON.stringify(${QUERY_NAME}.data)}}` }),
      ]),
      { queries: [nodePluginQuery({ id: QUERY_ID, name: QUERY_NAME, datasourceId, recorded: recordedPluginQuery(SUPABASE_PLUGIN, ""), action: {} })] },
    );

    await expect(view.byTestId(boundTextTestId(RESULT_NAME)), "before the click the text is empty").toHaveText("");
    expect(await echo.received(), "before the click the echo holds nothing of this test").toEqual([]);
    await view.buttonByTestId(BUTTON_TEST_ID).click();
    await expect(view.byTestId(boundTextTestId(SUCCESS_NAME)), "after the click the query succeeded").toHaveText("true");
    await expect(view.byTestId(boundTextTestId(RESULT_NAME)), "after the click the text shows the bucket's name").toHaveText(BUCKET);
    const records = await echo.received();
    expectStorageRequest(onlyRecord(records), echo, { method: "GET", path: "/bucket", key }, "the click's listBuckets");
    const shownAnswer = (await view.byTestId(boundTextTestId(RAW_NAME)).textContent()) ?? "";
    expect(JSON.parse(shownAnswer), "the whole answer the view holds is the canned buckets").toEqual(BUCKETS);
    expectKeyOnlyInItsHeaders(records, key, [{ json: JSON.parse(shownAnswer) }], "the click's listBuckets");
  });
});
