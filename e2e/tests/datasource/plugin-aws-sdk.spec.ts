import { createHash, randomBytes } from "node:crypto";
import type { Page } from "@playwright/test";
import { createApp, createNodePluginDatasource, executeAppQueryRaw, nodePluginDatasourceBody, testDatasourceRaw, type RawAnswer, type RegisteredUser } from "../../src/api/client";
import { API_OK, TAGS } from "../../src/constants";
import { appDsl, button, nodePluginQuery, stackItems } from "../../src/dsl/builders";
import { recordedPluginDatasource, recordedPluginQuery } from "../../src/dsl/recorded";
import { parseSigV4Authorization } from "../../src/datasource/node-plugins";
import { boundText, boundTextTestId, openSeededView } from "../../src/components/scenario";
import { expect, test } from "../../src/fixtures";
import { DatasourcePage } from "../../src/pages/DatasourcePage";
import { echoUrlByIp, recordsContain, type EchoRecord, type EchoTarget } from "../../src/security/echo";

/**
 * D10: the DynamoDB and S3 plugins of node-service (`server/node-service/src/plugins/{dynamodb,s3}/run.ts`), which use the AWS SDK
 * for JavaScript v3 with a configurable endpoint. The endpoint is the test's own target on the echo sidecar (`<target>/ddb`,
 * `<target>/s3`), so the tests prove the signed request the SDK builds and the path of the canned answer into the app. They are NOT
 * a fidelity test of DynamoDB or S3.
 *
 * Measured on the images `3.0.0-e2e` and `3.0.1-e2e` (the SDK keeps the endpoint's path; the paths below carry a trailing slash for
 * the bucket-free calls):
 * - DynamoDB: `POST <target>/ddb/`, JSON protocol (`x-amz-target: DynamoDB_20120810.<Operation>`).
 * - S3 without a bucket (list buckets, the connection test): `GET <target>/s3/?x-id=ListBuckets` to the host of the endpoint.
 * - S3 with a bucket, endpoint given by IP address: path-style, `<target>/s3/<bucket>/<key>`, `Host` is the IP address.
 *
 * Every S3 call that takes a bucket goes to the echo's IP address (`E2E_ECHO_IP`), never to the `e2e-echo` alias: the SDK addresses a
 * bucket of a host NAME as `<bucket>.<host>`, a name the alias mapping does not cover and that may resolve outside the run network
 * (README, the echo sidecar bullet and the `E2E_ECHO_IP` row). For an IP address it falls back to path-style (the measurement above, asserted by the tests).
 *
 * The SDK signs with the current time and a random invocation id, so the tests assert the shape of those values (a pattern) and
 * every stable part: the credential scope, the service, the region, the list of signed headers, the content hash of the body, the
 * content type and the target header. The signature itself is checked for its shape only.
 *
 * Not covered: a real DynamoDB or S3 service (no vendor host is reachable), the SDK's retry of a 5xx answer.
 */
const NODE_SERVICE_DETAILS = { tag: [TAGS.NODE_SERVICE] };

/**
 * Candidate defect: `listObjects` refuses an empty bucket itself (`Bucket is required`, before any request), but `readFile`,
 * `uploadData` and `deleteFile` do not, so the SDK's own text (`Empty value provided for input HTTP label: Bucket.`) reaches the
 * user. No request is sent in either case.
 */
const BUCKET_CHECK_DEFECT = { type: "defect", description: "D-73 candidate" } as const;
const BUCKET_CHECK_DETAILS = { annotation: BUCKET_CHECK_DEFECT };

const HTTP_OK = 200;
const HTTP_NO_CONTENT = 204;
const HTTP_BAD_REQUEST = 400;
const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;
const QUERY_CODE_OK = "OK";
const QUERY_CODE_FAILED = "FAILED";
/** The `code` of the envelope of a refused connection test (`ResponseView.error(500, message)`). */
const REFUSED_CODE = 500;
const MARKER_BYTES = 4;
const QUERY_ID = "q1";
const QUERY_NAME = "q";
const BUTTON_TEST_ID = "e2e-aws-run";
const RESULT_NAME = "label";
const SUCCESS_NAME = "succeeded";

const DDB_PATH = "/ddb";
const S3_PATH = "/s3";
const DDB_CONTENT_TYPE = "application/x-amz-json-1.0";
const XML_CONTENT_TYPE = "application/xml";
const TEXT_CONTENT_TYPE = "text/plain";
const DDB_TARGET_PREFIX = "DynamoDB_20120810.";
const SERVICE_DDB = "dynamodb";
const SERVICE_S3 = "s3";
const DEFAULT_REGION = "us-west-1";

/** The bucket, key and table of the tests. */
const BUCKET = "e2e-bucket";
const OBJECT_KEY = "e2e.txt";
const TABLE = "e2e-table";

/** The validity of a signed URL the plugin asks for (`getFileSignedUrl`: `expiresIn: 60 * 5`). */
const SIGNED_URL_EXPIRES_SECONDS = "300";
const UNSIGNED_PAYLOAD = "UNSIGNED-PAYLOAD";
/** The SHA-256 of an empty body, the content hash of every S3 request without a body. */
const EMPTY_BODY_SHA256 = createHash("sha256").update("").digest("hex");

/** What the SDK sends on every request (measured): a retry budget of three attempts, and a kept-alive connection. */
const SDK_REQUEST_HEADER = "attempt=1; max=3";
const KEEP_ALIVE = "keep-alive";
const EXPECT_CONTINUE = "100-continue";
const DEFAULT_UPLOAD_CONTENT_TYPE = "application/octet-stream";

/** The text the connection test of the form shows, measured (`Connection Successful` toast; the refusal text follows `ResponseView.error`). */
const CONNECTION_OK_TOAST = "Connection Successful";
const CONNECTION_FAILED_PREFIX = "Failed to connect data source: ";
const ACCESS_DENIED_TEXT = "Access Denied";

/** Shapes of the values the SDK generates per request. */
const SDK_VERSION = "\\d+\\.\\d+\\.\\d+";
const SDK_AGENT = new RegExp(`^aws-sdk-js/${SDK_VERSION}$`);
const AMZ_DATE = /^\d{8}T\d{6}Z$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const SIGNATURE = /^[0-9a-f]{64}$/;
/** What a normalised header holds instead of a value that differs per request. */
const SHAPE_OK = "<matches the expected shape>";
const SHAPE_BAD = "<does NOT match the expected shape>";

/** The signed-header lists (measured): they carry no `expect`, which the SDK does not sign. */
const SIGNED_DDB = ["amz-sdk-invocation-id", "amz-sdk-request", "content-length", "content-type", "host", "x-amz-content-sha256", "x-amz-date", "x-amz-target", "x-amz-user-agent"];
const SIGNED_S3_GET = ["amz-sdk-invocation-id", "amz-sdk-request", "host", "x-amz-content-sha256", "x-amz-date", "x-amz-user-agent"];
const SIGNED_S3_PUT = ["amz-sdk-invocation-id", "amz-sdk-request", "content-length", "content-type", "host", "x-amz-content-sha256", "x-amz-date", "x-amz-user-agent"];

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

function sha256Hex(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function onlyRecord(records: EchoRecord[]): EchoRecord {
  expect(records, "the echo received exactly one request").toHaveLength(1);
  return records[0] as EchoRecord;
}

/** The credentials and the region of a data source: the access key carries the test's marker, the secret is a value that must never reach the echo. */
interface Credentials {
  accessKey: string;
  secretKey: string;
  region: string;
}

function credentialsOf(marker: string, region = DEFAULT_REGION): Credentials {
  return { accessKey: `E2EKEY${marker}`, secretKey: `e2eSecret${marker}`, region };
}

/** What one signed request must look like. `body` is the exact text the echo recorded; `host` is what the `Host` header must hold. */
interface ExpectedSigned {
  method: string;
  /** Path and query below the echo, as recorded. */
  path: string;
  body: string;
  host: string;
  credentials: Credentials;
  service: string;
  signedHeaders: string[];
  /** The stable headers besides the common set (`content-type`, `x-amz-target`, `expect`). */
  extraHeaders: Record<string, string>;
}

/**
 * Asserts one recorded SDK request completely: method, path and query, body, the COMPLETE header set (no header besides the ones
 * listed; each header's value, or for the per-request values their shape) and the parts of the SigV4 `Authorization` header (access
 * key, date equal to the one of `x-amz-date`, region, service, the signed-header list, a 64-digit signature). The secret key is
 * not asserted here: see `expectSecretNotSent`.
 */
function expectSignedRequest(record: EchoRecord, expected: ExpectedSigned, label: string): void {
  expect(record.method, `${label}: the method`).toBe(expected.method);
  expect(record.path, `${label}: the path and query`).toBe(expected.path);
  expect(record.body, `${label}: the body`).toBe(expected.body);
  const { authorization, ...others } = record.headers;
  const agentOf = (service: string): RegExp => new RegExp(`^aws-sdk-js/${SDK_VERSION} ua/2\\.1 os/\\S+ lang/js md/nodejs#\\S+ api/${service}#${SDK_VERSION} m/[A-Za-z,]+$`);
  const shape = (name: string, pattern: RegExp): string => (typeof others[name] === "string" && pattern.test(others[name] as string) ? SHAPE_OK : SHAPE_BAD);
  const parsed = parseSigV4Authorization(authorization);
  expect(parsed, `${label}: the Authorization header is a SigV4 header`).toBeDefined();
  expect(
    { ...others, "x-amz-user-agent": shape("x-amz-user-agent", SDK_AGENT), "user-agent": shape("user-agent", agentOf(expected.service)), "amz-sdk-invocation-id": shape("amz-sdk-invocation-id", UUID), "x-amz-date": shape("x-amz-date", AMZ_DATE) },
    `${label}: every header besides Authorization`,
  ).toEqual({
    ...expected.extraHeaders,
    host: expected.host,
    "amz-sdk-request": SDK_REQUEST_HEADER,
    "x-amz-content-sha256": expected.extraHeaders["x-amz-content-sha256"] ?? sha256Hex(expected.body),
    connection: KEEP_ALIVE,
    "x-amz-user-agent": SHAPE_OK,
    "user-agent": SHAPE_OK,
    "amz-sdk-invocation-id": SHAPE_OK,
    "x-amz-date": SHAPE_OK,
  });
  expect(
    { accessKey: parsed?.accessKey, date: parsed?.date, region: parsed?.region, service: parsed?.service, signedHeaders: parsed?.signedHeaders },
    `${label}: the credential scope and the signed headers`,
  ).toEqual({
    accessKey: expected.credentials.accessKey,
    date: String(others["x-amz-date"]).slice(0, "YYYYMMDD".length),
    region: expected.credentials.region,
    service: expected.service,
    signedHeaders: expected.signedHeaders,
  });
  expect(SIGNATURE.test(parsed?.signature ?? ""), `${label}: the signature has the shape of a SigV4 signature`).toBe(true);
}

/** The access key travels in the credential scope of every request (the positive control), the secret key never leaves node-service. */
function expectSecretNotSent(records: EchoRecord[], credentials: Credentials, label: string): void {
  expect(recordsContain(records, credentials.accessKey), `${label}: positive control, the access key is in the credential scope`).toBe(true);
  expect(recordsContain(records, credentials.secretKey), `${label}: the secret key is in no header, path or body`).toBe(false);
}

/** The body of a JSON-protocol request, parsed (the SDK orders the members its own way). */
function ddbBodyOf(record: EchoRecord): unknown {
  return JSON.parse(record.body);
}

function ddbHeaders(operation: string, body: string): Record<string, string> {
  return { "content-type": DDB_CONTENT_TYPE, "x-amz-target": `${DDB_TARGET_PREFIX}${operation}`, "content-length": String(Buffer.byteLength(body)) };
}

/** Asserts the DynamoDB request of the echo for `operation`; `body` is the member set the plugin sends. */
function expectDdbRequest(record: EchoRecord, echo: EchoTarget, params: { operation: string; credentials: Credentials; body: unknown }, label: string): void {
  expect(ddbBodyOf(record), `${label}: the request body, member for member`).toEqual(params.body);
  expectSignedRequest(
    record,
    {
      method: "POST",
      path: `${echo.path}${DDB_PATH}/`,
      body: record.body,
      host: new URL(echo.url).host,
      credentials: params.credentials,
      service: SERVICE_DDB,
      signedHeaders: SIGNED_DDB,
      extraHeaders: ddbHeaders(params.operation, record.body),
    },
    label,
  );
}

/** A DynamoDB data source from the recording, its endpoint the echo target's `/ddb`; returns its id. */
async function ddbDatasource(page: Page, apiUser: RegisteredUser, echo: EchoTarget, credentials: Credentials): Promise<string> {
  return createNodePluginDatasource(page.request, {
    orgId: apiUser.orgId,
    recorded: recordedPluginDatasource(SERVICE_DDB),
    config: { ...credentials, endpointUrl: `${echo.url}${DDB_PATH}` },
  });
}

/** A saved app with one manual DynamoDB query of the recorded `variant` (not published: the draft runs with `viewMode: false`). */
async function ddbApp(page: Page, apiUser: RegisteredUser, echo: EchoTarget, credentials: Credentials, variant: string, action: Record<string, unknown>): Promise<string> {
  const datasourceId = await ddbDatasource(page, apiUser, echo, credentials);
  const query = nodePluginQuery({ id: QUERY_ID, name: QUERY_NAME, datasourceId, recorded: recordedPluginQuery(SERVICE_DDB, variant), action });
  const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-dynamodb", dsl: appDsl([], { queries: [query] }) });
  return appId;
}

/**
 * The endpoint of an S3 data source: the echo target's `/s3` on the echo's IP address (`bucketCalls`: every call that takes a bucket)
 * or on the `e2e-echo` alias (calls without a bucket, which derive no host name).
 */
function s3Endpoint(echo: EchoTarget, addressing: "ip" | "alias"): string {
  return `${addressing === "ip" ? echoUrlByIp(echo.url, process.env) : echo.url}${S3_PATH}`;
}

/** The `Host` header the S3 request of `addressing` carries. */
function s3Host(echo: EchoTarget, addressing: "ip" | "alias"): string {
  return new URL(s3Endpoint(echo, addressing)).host;
}

async function s3Datasource(page: Page, apiUser: RegisteredUser, echo: EchoTarget, credentials: Credentials, addressing: "ip" | "alias"): Promise<string> {
  return createNodePluginDatasource(page.request, {
    orgId: apiUser.orgId,
    recorded: recordedPluginDatasource(SERVICE_S3),
    config: { ...credentials, endpointUrl: s3Endpoint(echo, addressing) },
  });
}

/** A saved app with one manual S3 query of the recorded `variant`. */
async function s3App(page: Page, apiUser: RegisteredUser, echo: EchoTarget, credentials: Credentials, addressing: "ip" | "alias", variant: string, action: Record<string, unknown>): Promise<string> {
  const datasourceId = await s3Datasource(page, apiUser, echo, credentials, addressing);
  const query = nodePluginQuery({ id: QUERY_ID, name: QUERY_NAME, datasourceId, recorded: recordedPluginQuery(SERVICE_S3, variant), action });
  const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-s3", dsl: appDsl([], { queries: [query] }) });
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
  expect({ success: envelopeOf(answer).success, queryCode: envelopeOf(answer).queryCode, message: envelopeOf(answer).message, data: envelopeOf(answer).data }, "the query failed with the measured message").toEqual({
    success: false,
    queryCode: QUERY_CODE_FAILED,
    message,
    data: null,
  });
}

const BUCKETS_XML = (names: string[]): string =>
  `<?xml version="1.0" encoding="UTF-8"?><ListAllMyBucketsResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><Owner><ID>e2e-owner</ID><DisplayName>e2e</DisplayName></Owner><Buckets>${names.map((name) => `<Bucket><Name>${name}</Name><CreationDate>2020-01-01T00:00:00.000Z</CreationDate></Bucket>`).join("")}</Buckets></ListAllMyBucketsResult>`;

const OBJECTS_XML = `<?xml version="1.0" encoding="UTF-8"?><ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><Name>${BUCKET}</Name><Prefix></Prefix><MaxKeys>10</MaxKeys><IsTruncated>false</IsTruncated><Contents><Key>${OBJECT_KEY}</Key><LastModified>2020-01-01T00:00:00.000Z</LastModified><ETag>"e2e"</ETag><Size>5</Size><StorageClass>STANDARD</StorageClass></Contents></ListBucketResult>`;

const ACCESS_DENIED_XML = `<?xml version="1.0" encoding="UTF-8"?><Error><Code>AccessDenied</Code><Message>${ACCESS_DENIED_TEXT}</Message><RequestId>e2e-request</RequestId></Error>`;

/** The `GET <target>/s3/` request of the bucket-free calls (list buckets, the connection test): the query holds only the operation id. */
function expectListBucketsRequest(record: EchoRecord, echo: EchoTarget, credentials: Credentials, label: string): void {
  expectSignedRequest(
    record,
    {
      method: "GET",
      path: `${echo.path}${S3_PATH}/?x-id=ListBuckets`,
      body: "",
      host: s3Host(echo, "alias"),
      credentials,
      service: SERVICE_S3,
      signedHeaders: SIGNED_S3_GET,
      extraHeaders: { "x-amz-content-sha256": EMPTY_BODY_SHA256 },
    },
    label,
  );
}

/** A path-style S3 request with a bucket, to the echo's IP address. */
function expectBucketRequest(
  record: EchoRecord,
  echo: EchoTarget,
  params: { method: string; pathAndQuery: string; credentials: Credentials; body?: string; uploadContentType?: string },
  label: string,
): void {
  const body = params.body ?? "";
  const upload = params.uploadContentType !== undefined;
  expectSignedRequest(
    record,
    {
      method: params.method,
      path: `${echo.path}${S3_PATH}/${params.pathAndQuery}`,
      body,
      host: s3Host(echo, "ip"),
      credentials: params.credentials,
      service: SERVICE_S3,
      signedHeaders: upload ? SIGNED_S3_PUT : SIGNED_S3_GET,
      extraHeaders: upload
        ? { "content-type": params.uploadContentType as string, "content-length": String(Buffer.byteLength(body)), expect: EXPECT_CONTINUE }
        : { "x-amz-content-sha256": EMPTY_BODY_SHA256 },
    },
    label,
  );
}

test.describe("DynamoDB data source against the echo", NODE_SERVICE_DETAILS, () => {
  test("D10a: ListTables is a signed JSON call answered from the endpoint", async ({ page, apiUser, echo }) => {
    const credentials = credentialsOf(uniqueMarker(), "eu-central-1");
    await echo.answer(DDB_PATH, { status: HTTP_OK, contentType: DDB_CONTENT_TYPE, body: JSON.stringify({ TableNames: [TABLE] }) });
    const appId = await ddbApp(page, apiUser, echo, credentials, "ListTables", {});
    expect(await echo.received(), "before the run the echo holds nothing of this test").toEqual([]);

    const answer = await runDraft(page, appId);

    expectSucceeded(answer);
    const records = await echo.received();
    // the recorded parameters (`{ "Limit": 10 }`) plus the empty table name the plugin always adds
    expectDdbRequest(onlyRecord(records), echo, { operation: "ListTables", credentials, body: { TableName: "", Limit: 10 } }, "ListTables");
    expectSecretNotSent(records, credentials, "ListTables");
    expect(envelopeOf(answer).data, "the answer without its `$metadata`").toEqual({ TableNames: [TABLE] });
  });

  test("D10b: GetItem wraps the key and unwraps the typed attributes", async ({ page, apiUser, echo }) => {
    const credentials = credentialsOf(uniqueMarker());
    const id = `e2e-${uniqueMarker()}`;
    await echo.answer(DDB_PATH, {
      status: HTTP_OK,
      contentType: DDB_CONTENT_TYPE,
      body: JSON.stringify({ Item: { id: { S: id }, n: { N: "3" }, tags: { SS: ["a", "b"] }, ok: { BOOL: true } } }),
    });
    const appId = await ddbApp(page, apiUser, echo, credentials, "GetItem", { tableName: TABLE, params: JSON.stringify({ Key: { id } }) });

    const answer = await runDraft(page, appId);

    expectSucceeded(answer);
    expectSecretNotSent(await echo.received(), credentials, "D10b");
    const records = await echo.received();
    expectDdbRequest(onlyRecord(records), echo, { operation: "GetItem", credentials, body: { TableName: TABLE, Key: { id: { S: id } } } }, "GetItem");
    expect(envelopeOf(answer).data, "the item without type wrappers: a string, a number, a string set and a boolean").toEqual({ Item: { id, n: 3, tags: ["a", "b"], ok: true } });
  });

  test("D10c: PutItem wraps a number, a string and a boolean of the item", async ({ page, apiUser, echo }) => {
    const credentials = credentialsOf(uniqueMarker());
    await echo.answer(DDB_PATH, { status: HTTP_OK, contentType: DDB_CONTENT_TYPE, body: "{}" });
    const appId = await ddbApp(page, apiUser, echo, credentials, "PutItem", { tableName: TABLE, params: JSON.stringify({ Item: { id: 7, name: "Alice", ok: true } }) });

    const answer = await runDraft(page, appId);

    expectSucceeded(answer);
    expectSecretNotSent(await echo.received(), credentials, "D10c");
    expectDdbRequest(
      onlyRecord(await echo.received()),
      echo,
      { operation: "PutItem", credentials, body: { TableName: TABLE, Item: { id: { N: "7" }, name: { S: "Alice" }, ok: { BOOL: true } } } },
      "PutItem",
    );
    expect(envelopeOf(answer).data, "an empty answer is an empty object").toEqual({});
  });

  test("D10d: Query keeps the expression and unwraps every item of the list", async ({ page, apiUser, echo }) => {
    const credentials = credentialsOf(uniqueMarker());
    await echo.answer(DDB_PATH, {
      status: HTTP_OK,
      contentType: DDB_CONTENT_TYPE,
      body: JSON.stringify({ Items: [{ id: { N: "1" } }, { id: { N: "2" } }], Count: 2, ScannedCount: 2 }),
    });
    const appId = await ddbApp(page, apiUser, echo, credentials, "", { tableName: TABLE });

    const answer = await runDraft(page, appId);

    expectSucceeded(answer);
    expectSecretNotSent(await echo.received(), credentials, "D10d");
    // the recorded default parameters of the Query action
    expectDdbRequest(
      onlyRecord(await echo.received()),
      echo,
      { operation: "Query", credentials, body: { TableName: TABLE, KeyConditionExpression: "id = :n", ExpressionAttributeValues: { ":n": { N: "1" } } } },
      "Query",
    );
    expect(envelopeOf(answer).data, "the unwrapped items and the counts").toEqual({ Items: [{ id: 1 }, { id: 2 }], Count: 2, ScannedCount: 2 });
  });

  test("D10e: a service error answers the query as failed with the service's message", async ({ page, apiUser, echo }) => {
    const credentials = credentialsOf(uniqueMarker());
    await echo.answer(DDB_PATH, {
      status: HTTP_BAD_REQUEST,
      contentType: DDB_CONTENT_TYPE,
      body: JSON.stringify({ __type: "com.amazonaws.dynamodb.v20120810#ResourceNotFoundException", message: "Requested resource not found" }),
    });
    const appId = await ddbApp(page, apiUser, echo, credentials, "GetItem", { tableName: TABLE });

    const answer = await runDraft(page, appId);

    expectFailed(answer, "Requested resource not found");
    // the recorded default key `{ id: 1 }` is wrapped to a number; one request only (a 400 is not retried)
    const records = await echo.received();
    expectDdbRequest(onlyRecord(records), echo, { operation: "GetItem", credentials, body: { TableName: TABLE, Key: { id: { N: "1" } } } }, "the failing GetItem");
    expectSecretNotSent(records, credentials, "the failing GetItem");
  });

  test("D10f: the published view shows an item after a click", async ({ page, apiUser, echo }) => {
    const credentials = credentialsOf(uniqueMarker());
    const id = `e2e-${uniqueMarker()}`;
    await echo.answer(DDB_PATH, { status: HTTP_OK, contentType: DDB_CONTENT_TYPE, body: JSON.stringify({ Item: { id: { S: id } } }) });
    const datasourceId = await ddbDatasource(page, apiUser, echo, credentials);
    // before the first run `q.data` is not an object
    const expression = `{{${QUERY_NAME}.data ? ${QUERY_NAME}.data.Item.id : ""}}`;
    const view = await openSeededView(
      page,
      apiUser.orgId,
      "e2e-dynamodb-view",
      stackItems([
        button({ id: "b1", name: "button1", text: "Run", testId: BUTTON_TEST_ID, onClickQuery: QUERY_NAME }),
        boundText({ id: "t1", name: RESULT_NAME, expression }),
        // `success` also reads `true` before the first run (measured on the Turso view), so only the state after the click proves anything
        boundText({ id: "t2", name: SUCCESS_NAME, expression: `{{String(${QUERY_NAME}.success)}}` }),
      ]),
      { queries: [nodePluginQuery({ id: QUERY_ID, name: QUERY_NAME, datasourceId, recorded: recordedPluginQuery(SERVICE_DDB, "GetItem"), action: { tableName: TABLE } })] },
    );

    await expect(view.byTestId(boundTextTestId(RESULT_NAME)), "before the click the text is empty").toHaveText("");
    expect(await echo.received(), "before the click the echo holds nothing of this test").toEqual([]);
    await view.buttonByTestId(BUTTON_TEST_ID).click();
    await expect(view.byTestId(boundTextTestId(SUCCESS_NAME)), "after the click the query succeeded").toHaveText("true");
    await expect(view.byTestId(boundTextTestId(RESULT_NAME)), "after the click the text shows the item's id").toHaveText(id);
    const records = await echo.received();
    expectDdbRequest(onlyRecord(records), echo, { operation: "GetItem", credentials, body: { TableName: TABLE, Key: { id: { N: "1" } } } }, "the click's GetItem");
    expectSecretNotSent(records, credentials, "the click's GetItem");
  });
});

test.describe("S3 data source against the echo", NODE_SERVICE_DETAILS, () => {
  test("D10g: the connection test lists the buckets at the endpoint", async ({ page, apiUser, echo }) => {
    const credentials = credentialsOf(uniqueMarker());
    await echo.answer(S3_PATH, { status: HTTP_OK, contentType: XML_CONTENT_TYPE, body: BUCKETS_XML([BUCKET]) });
    const body = nodePluginDatasourceBody(recordedPluginDatasource(SERVICE_S3), { orgId: apiUser.orgId, config: { ...credentials, endpointUrl: s3Endpoint(echo, "alias") } });
    expect(await echo.received(), "before the test the echo holds nothing of this test").toEqual([]);

    const answer = await testDatasourceRaw(page.request, body);

    expect({ status: answer.status, json: answer.json }, "the envelope: code 1, success, data true").toEqual({ status: HTTP_OK, json: { code: API_OK, message: "", data: true, success: true } });
    const records = await echo.received();
    expectListBucketsRequest(onlyRecord(records), echo, credentials, "the connection test");
    expectSecretNotSent(records, credentials, "the connection test");
  });

  test("D10h: a refused connection test reports the service's error, and the same call succeeds once the endpoint answers", async ({ page, apiUser, echo }) => {
    const credentials = credentialsOf(uniqueMarker());
    const body = nodePluginDatasourceBody(recordedPluginDatasource(SERVICE_S3), { orgId: apiUser.orgId, config: { ...credentials, endpointUrl: s3Endpoint(echo, "alias") } });
    await echo.answer(S3_PATH, { status: HTTP_FORBIDDEN, contentType: XML_CONTENT_TYPE, body: ACCESS_DENIED_XML });

    const refused = await testDatasourceRaw(page.request, body);

    // `ResponseView.error(500, message)`: the HTTP status stays 200 (measured), the refusal is in the envelope
    expect({ status: refused.status, code: refused.code, json: refused.json }, "the refusal").toEqual({
      status: HTTP_OK,
      code: REFUSED_CODE,
      json: { code: REFUSED_CODE, message: `${CONNECTION_FAILED_PREFIX}${ACCESS_DENIED_TEXT}.`, success: false },
    });
    const afterRefusal = await echo.received();
    expectListBucketsRequest(onlyRecord(afterRefusal), echo, credentials, "the refused connection test");
    expectSecretNotSent(afterRefusal, credentials, "the refused connection test");

    await echo.answer(S3_PATH, { status: HTTP_OK, contentType: XML_CONTENT_TYPE, body: BUCKETS_XML([BUCKET]) });
    const accepted = await testDatasourceRaw(page.request, body);

    expect(accepted.json, "control: the same body is accepted when the endpoint answers 200, so the endpoint's answer decided").toEqual({ code: API_OK, message: "", data: true, success: true });
    const records = await echo.received();
    expect(records, "the echo holds exactly the two calls").toHaveLength(2);
    for (const [index, record] of records.entries()) expectListBucketsRequest(record, echo, credentials, `connection test ${index + 1}`);
    expectSecretNotSent(records, credentials, "both connection tests");
  });

  test("D10i: the form's Test Connection button reports the endpoint's answer", async ({ page, apiUser, echo }) => {
    const credentials = credentialsOf(uniqueMarker());
    const datasources = new DatasourcePage(page);
    await datasources.open();
    await datasources.newButton.click();
    await page.getByText("AWS S3", { exact: true }).first().click();
    // the field ids of the form (measured: `name`, `accessKey`, `secretKey`, `endpointUrl`)
    await page.locator("#name").fill("e2e-s3-form");
    await page.locator("#accessKey").fill(credentials.accessKey);
    await page.locator("#secretKey").fill(credentials.secretKey);
    await page.locator("#endpointUrl").fill(s3Endpoint(echo, "alias"));
    const testButton = page.getByRole("button", { name: "Test Connection" });
    await echo.answer(S3_PATH, { status: HTTP_FORBIDDEN, contentType: XML_CONTENT_TYPE, body: ACCESS_DENIED_XML });
    await expect(page.getByText(CONNECTION_OK_TOAST), "before the first click no result is shown").toHaveCount(0);
    expect(await echo.received(), "before the first click the echo holds nothing of this test").toEqual([]);

    await testButton.click();

    await expect(page.getByText(`${CONNECTION_FAILED_PREFIX}${ACCESS_DENIED_TEXT}.`), "the refusal of the service is shown").toBeVisible();
    const afterFirst = await echo.received();
    expectListBucketsRequest(onlyRecord(afterFirst), echo, credentials, "the first click");
    expectSecretNotSent(afterFirst, credentials, "the first click");

    await echo.answer(S3_PATH, { status: HTTP_OK, contentType: XML_CONTENT_TYPE, body: BUCKETS_XML([BUCKET]) });
    await testButton.click();

    await expect(page.getByText(CONNECTION_OK_TOAST), "once the endpoint answers 200 the success is shown").toBeVisible();
    const records = await echo.received();
    expect(records, "the echo holds exactly the two clicks' requests").toHaveLength(2);
    for (const [index, record] of records.entries()) expectListBucketsRequest(record, echo, credentials, `click ${index + 1}`);
    expectSecretNotSent(records, credentials, "the form's connection test");
  });

  test("D10j: a listBuckets query answers the bucket names", async ({ page, apiUser, echo }) => {
    const credentials = credentialsOf(uniqueMarker(), "eu-west-3");
    await echo.answer(S3_PATH, { status: HTTP_OK, contentType: XML_CONTENT_TYPE, body: BUCKETS_XML([BUCKET, `${BUCKET}-2`]) });
    const appId = await s3App(page, apiUser, echo, credentials, "alias", "", {});
    expect(await echo.received(), "before the run the echo holds nothing of this test").toEqual([]);

    const answer = await runDraft(page, appId);

    expectSucceeded(answer);
    expectSecretNotSent(await echo.received(), credentials, "D10j");
    expectListBucketsRequest(onlyRecord(await echo.received()), echo, credentials, "listBuckets");
    expect(envelopeOf(answer).data, "the names, nothing else").toEqual([{ name: BUCKET }, { name: `${BUCKET}-2` }]);
  });

  test("D10k: a listObjects call addresses the bucket in the path of the echo's IP address", async ({ page, apiUser, echo }) => {
    const credentials = credentialsOf(uniqueMarker());
    await echo.answer(S3_PATH, { status: HTTP_OK, contentType: XML_CONTENT_TYPE, body: OBJECTS_XML });
    const appId = await s3App(page, apiUser, echo, credentials, "ip", "ListObjects", { bucket: BUCKET, prefix: "p/", delimiter: "/", limit: 3 });

    const answer = await runDraft(page, appId);

    expectSucceeded(answer);
    const records = await echo.received();
    // path-style: `<endpoint path>/<bucket>/`, never a `<bucket>.<host>` address, so the request reached the echo and carries the IP as its host
    expectBucketRequest(onlyRecord(records), echo, { method: "GET", pathAndQuery: `${BUCKET}/?delimiter=%2F&max-keys=3&prefix=p%2F`, credentials }, "listObjects");
    expect(onlyRecord(records).headers.host, "the host is the IP address of the echo, not a derived name").toBe(new URL(echoUrlByIp(echo.url, process.env)).host);
    expectSecretNotSent(records, credentials, "listObjects");
    expect(envelopeOf(answer).data, "name, size, time, an empty signed URL and the file URL below the endpoint").toEqual([
      { name: OBJECT_KEY, size: 5, lastModified: "2020-01-01T00:00:00.000Z", signedUrl: "", url: `${s3Endpoint(echo, "ip")}/${BUCKET}/${OBJECT_KEY}` },
    ]);
  });

  test("D10l: listObjects with returnSignedUrl adds a presigned URL for each file and sends nothing more", async ({ page, apiUser, echo }) => {
    const credentials = credentialsOf(uniqueMarker());
    await echo.answer(S3_PATH, { status: HTTP_OK, contentType: XML_CONTENT_TYPE, body: OBJECTS_XML });
    const appId = await s3App(page, apiUser, echo, credentials, "ip", "ListObjects", { bucket: BUCKET, returnSignedUrl: true });

    const answer = await runDraft(page, appId);

    expectSucceeded(answer);
    expectSecretNotSent(await echo.received(), credentials, "D10l");
    const records = await echo.received();
    expectBucketRequest(onlyRecord(records), echo, { method: "GET", pathAndQuery: `${BUCKET}/?delimiter=&max-keys=10&prefix=`, credentials }, "listObjects");
    const files = envelopeOf(answer).data as Array<{ name: string; signedUrl: string; url: string }>;
    expect(files.map((file) => file.name), "the one file").toEqual([OBJECT_KEY]);
    const signed = new URL(files[0]?.signedUrl ?? "");
    expect({ origin: signed.origin, path: signed.pathname }, "the presigned URL addresses the file below the IP endpoint").toEqual({
      origin: new URL(echoUrlByIp(echo.url, process.env)).origin,
      path: `${echo.path}${S3_PATH}/${BUCKET}/${OBJECT_KEY}`,
    });
    const params = Object.fromEntries(signed.searchParams);
    expect(Object.keys(params).sort(), "the query parameters of a presigned GET").toEqual(
      ["X-Amz-Algorithm", "X-Amz-Content-Sha256", "X-Amz-Credential", "X-Amz-Date", "X-Amz-Expires", "X-Amz-Signature", "X-Amz-SignedHeaders", "x-id"].sort(),
    );
    expect(
      {
        algorithm: params["X-Amz-Algorithm"],
        payload: params["X-Amz-Content-Sha256"],
        credentialScope: params["X-Amz-Credential"]?.replace(/\/\d{8}\//, "/<date>/"),
        expires: params["X-Amz-Expires"],
        signedHeaders: params["X-Amz-SignedHeaders"],
        operation: params["x-id"],
      },
      "the stable parts of the presigned URL",
    ).toEqual({
      algorithm: "AWS4-HMAC-SHA256",
      payload: UNSIGNED_PAYLOAD,
      credentialScope: `${credentials.accessKey}/<date>/${credentials.region}/${SERVICE_S3}/aws4_request`,
      expires: SIGNED_URL_EXPIRES_SECONDS,
      signedHeaders: "host",
      operation: "GetObject",
    });
    expect(AMZ_DATE.test(params["X-Amz-Date"] ?? ""), "the signing time has the shape of an SDK date").toBe(true);
    expect(SIGNATURE.test(params["X-Amz-Signature"] ?? ""), "the signature has the shape of a SigV4 signature").toBe(true);
    expect(records.length, "presigning is local: the echo holds only the listing").toBe(1);
  });

  test.describe("a file operation addresses the object in the path of the echo's IP address", () => {
    const TEXT = "hello e2e";
    const KEY = "dir/e2e file.txt";
    const ENCODED_KEY = "dir/e2e%20file.txt";
    for (const row of [
      { title: "text", encoding: "utf8", expected: TEXT },
      { title: "base64 (the default)", encoding: undefined, expected: Buffer.from(TEXT, "utf8").toString("base64") },
    ]) {
      test(`D10m: readFile as ${row.title} answers the content type and the data`, async ({ page, apiUser, echo }) => {
        const credentials = credentialsOf(uniqueMarker());
        await echo.answer(S3_PATH, { status: HTTP_OK, contentType: TEXT_CONTENT_TYPE, body: TEXT });
        const appId = await s3App(page, apiUser, echo, credentials, "ip", "ReadFile", { bucket: BUCKET, fileName: KEY, ...(row.encoding ? { encoding: row.encoding } : {}) });

        const answer = await runDraft(page, appId);

        expectSucceeded(answer);
    expectSecretNotSent(await echo.received(), credentials, "D10m");
        expectBucketRequest(onlyRecord(await echo.received()), echo, { method: "GET", pathAndQuery: `${BUCKET}/${ENCODED_KEY}?x-id=GetObject`, credentials }, "readFile");
        // measured: the answer holds no `length` and no `lastModified` (why is NOT VERIFIED)
        expect(envelopeOf(answer).data, "the content type and the data in the requested encoding").toEqual({ contentType: TEXT_CONTENT_TYPE, data: row.expected });
      });
    }

    for (const row of [
      { title: "text with a content type", action: { encoding: "utf8", data: "hello up", contentType: TEXT_CONTENT_TYPE }, body: "hello up", contentType: TEXT_CONTENT_TYPE },
      { title: "base64 without a content type", action: { data: Buffer.from("hello", "utf8").toString("base64"), contentType: "" }, body: "hello", contentType: DEFAULT_UPLOAD_CONTENT_TYPE },
    ]) {
      test(`D10n: uploadData of ${row.title} puts the decoded bytes`, async ({ page, apiUser, echo }) => {
        const credentials = credentialsOf(uniqueMarker());
        await echo.answer(S3_PATH, { status: HTTP_OK, contentType: XML_CONTENT_TYPE, body: "" });
        const appId = await s3App(page, apiUser, echo, credentials, "ip", "UploadData", { bucket: BUCKET, fileName: "up.bin", ...row.action });

        const answer = await runDraft(page, appId);

        expectSucceeded(answer);
    expectSecretNotSent(await echo.received(), credentials, "D10n");
        expectBucketRequest(
          onlyRecord(await echo.received()),
          echo,
          { method: "PUT", pathAndQuery: `${BUCKET}/up.bin?x-id=PutObject`, credentials, body: row.body, uploadContentType: row.contentType },
          "uploadData",
        );
        // measured: an empty content type is sent as `application/octet-stream` (the SDK's default for a binary body)
        expect(envelopeOf(answer).data, "the name, no signed URL and the file URL below the endpoint").toEqual({
          fileName: "up.bin",
          signedUrl: "",
          url: `${s3Endpoint(echo, "ip")}/${BUCKET}/up.bin`,
        });
      });
    }

    test("D10o: deleteFile sends a DELETE and answers success", async ({ page, apiUser, echo }) => {
      const credentials = credentialsOf(uniqueMarker());
      await echo.answer(S3_PATH, { status: HTTP_NO_CONTENT, contentType: XML_CONTENT_TYPE, body: "" });
      const appId = await s3App(page, apiUser, echo, credentials, "ip", "DeleteFile", { bucket: BUCKET, fileName: OBJECT_KEY });

      const answer = await runDraft(page, appId);

      expectSucceeded(answer);
    expectSecretNotSent(await echo.received(), credentials, "D10o");
      expectBucketRequest(onlyRecord(await echo.received()), echo, { method: "DELETE", pathAndQuery: `${BUCKET}/${OBJECT_KEY}?x-id=DeleteObject`, credentials }, "deleteFile");
      expect(envelopeOf(answer).data, "the plugin's own answer").toEqual({ success: true });
    });
  });

  test("D10p: a service error of a bucket call answers the query as failed with the service's message", async ({ page, apiUser, echo }) => {
    const credentials = credentialsOf(uniqueMarker());
    await echo.answer(S3_PATH, { status: HTTP_FORBIDDEN, contentType: XML_CONTENT_TYPE, body: ACCESS_DENIED_XML });
    const denied = await s3App(page, apiUser, echo, credentials, "ip", "ListObjects", { bucket: BUCKET });

    expectFailed(await runDraft(page, denied), ACCESS_DENIED_TEXT);
    const afterListing = await echo.received();
    expectBucketRequest(onlyRecord(afterListing), echo, { method: "GET", pathAndQuery: `${BUCKET}/?delimiter=&max-keys=10&prefix=`, credentials }, "the denied listObjects");

    await echo.answer(S3_PATH, { status: HTTP_NOT_FOUND, contentType: XML_CONTENT_TYPE, body: `<?xml version="1.0" encoding="UTF-8"?><Error><Code>NoSuchKey</Code><Message>The specified key does not exist.</Message></Error>` });
    const missing = await s3App(page, apiUser, echo, credentials, "ip", "ReadFile", { bucket: BUCKET, fileName: "absent.txt" });

    expectFailed(await runDraft(page, missing), "The specified key does not exist.");
    const records = await echo.received();
    expect(records, "the echo holds exactly the listing and the read").toHaveLength(2);
    expectBucketRequest(records[1] as EchoRecord, echo, { method: "GET", pathAndQuery: `${BUCKET}/absent.txt?x-id=GetObject`, credentials }, "the failing readFile");
    expectSecretNotSent(records, credentials, "the denied calls");
  });

  test("D10q: a bucket call without a bucket sends nothing", BUCKET_CHECK_DETAILS, async ({ page, apiUser, echo }) => {
    const credentials = credentialsOf(uniqueMarker());
    await echo.answer(S3_PATH, { status: HTTP_OK, contentType: XML_CONTENT_TYPE, body: OBJECTS_XML });
    const sdkText = "Empty value provided for input HTTP label: Bucket.";
    const rows: Array<{ variant: string; action: Record<string, unknown>; message: string }> = [
      // the one operation that checks the bucket itself
      { variant: "ListObjects", action: { bucket: "" }, message: "Bucket is required" },
      // D-73 candidate: the others hand the SDK's own text to the user (measured)
      { variant: "ReadFile", action: { bucket: "", fileName: OBJECT_KEY }, message: sdkText },
      { variant: "UploadData", action: { bucket: "", fileName: OBJECT_KEY, encoding: "utf8", data: "x" }, message: sdkText },
      { variant: "DeleteFile", action: { bucket: "", fileName: OBJECT_KEY }, message: sdkText },
    ];
    for (const row of rows) {
      const appId = await s3App(page, apiUser, echo, credentials, "ip", row.variant, row.action);
      expectFailed(await runDraft(page, appId), row.message);
    }
    expect(await echo.received(), "no call without a bucket reached the echo").toEqual([]);

    // positive control: the same data source and a bucket does send its request, so an empty echo above is not an echo that cannot be reached
    const control = await s3App(page, apiUser, echo, credentials, "ip", "ListObjects", { bucket: BUCKET });
    expectSucceeded(await runDraft(page, control));
    const records = await echo.received();
    expectBucketRequest(onlyRecord(records), echo, { method: "GET", pathAndQuery: `${BUCKET}/?delimiter=&max-keys=10&prefix=`, credentials }, "the control listObjects");
    expectSecretNotSent(records, credentials, "the control listObjects");
  });
});
