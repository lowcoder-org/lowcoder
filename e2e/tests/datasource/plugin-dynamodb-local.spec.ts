import { randomBytes } from "node:crypto";
import { connect } from "node:net";
import type { Page } from "@playwright/test";
import { createApp, createNodePluginDatasource, executeAppQueryRaw, type RawAnswer, type RegisteredUser } from "../../src/api/client";
import { API_OK, DYNAMODB, TAGS } from "../../src/constants";
import { appDsl, button, nodePluginQuery, stackItems } from "../../src/dsl/builders";
import { recordedPluginDatasource, recordedPluginQuery } from "../../src/dsl/recorded";
import { boundText, boundTextTestId, openSeededView } from "../../src/components/scenario";
import { dynamodbConnection, dynamodbDirect, type DynamodbConnection } from "../../src/datasource/dynamodb";
import { expect, test } from "../../src/fixtures";

/**
 * D15: the DynamoDB plugin of node-service (`server/node-service/src/plugins/dynamodb/`, the plugin id `dynamodb`, AWS SDK for JavaScript v3) run
 * against a REAL DynamoDB Local server, the sidecar of the run (`scripts/run-in-docker.sh` starts it only with
 * `E2E_INCLUDE_NODE_SERVICE_SIDECARS=1`; image, flags and setup in the README, "DynamoDB Local sidecar"). D10a to D10f run the same plugin against the
 * echo's canned answers; here the answers are the server's own. Every connection of these tests goes to the sidecar: the data source's endpoint is
 * `http://<alias>:8000` from `E2E_DYNAMODB_HOST`, never a placeholder. The server runs with `-inMemory -sharedDb`: table names are global to the
 * sidecar, so each test makes its own tables under a per-test marker, removes them in a `finally`, and shares no state with another test.
 *
 * "Direct" calls (`dynamodbDirect`) go from the test process to the sidecar in the API's own TYPED form. They are the controls that show what the
 * server itself holds (`{ "N": "1" }` where the plugin shows `1`), next to what the plugin makes of it for the app, and the way a test sets up
 * and removes what it needs.
 *
 * Measured on the images `3.0.0-e2e` and `3.0.1-e2e` against DynamoDB Local 3.3.2 (AWS SDK 3.668.0 in the plugin):
 * - The form offers CreateTable, ListTables, Query, Scan, PutItem, GetItem, UpdateItem and DeleteItem (no DescribeTable and no DeleteTable): a table
 *   is described and removed by direct calls here. Every answer is the SDK's output without `$metadata`, as the query's data (`success: true`, `queryCode: "OK"`).
 * - The plugin wraps `Key`, `Item` or `Items` of the parameters with `dynamodb-data-types` (plain JSON values become typed attributes) and unwraps `Item`
 *   and `Items` of the answer. Nothing else is wrapped or unwrapped: `ExpressionAttributeValues` and `ExclusiveStartKey` are sent as given (typed), and
 *   `LastEvaluatedKey` and `Attributes` (a `ReturnValues` answer) come back typed.
 * - Type mapping, plain JSON to the server: string S, number N, boolean BOOL, null NULL, object M, an array of numbers NS, an array of strings SS, any
 *   other array L (an array of strings is never a list: order is lost, duplicates and an empty array are refused). Back: N is a JavaScript number (digits
 *   beyond a double are lost), sets are arrays, B is a byte array that the answer's JSON turns into an object with index keys.
 * - A service error fails the query with the service's own message (`ResourceNotFoundException`, `ConditionalCheckFailedException`, `ValidationException`,
 *   `ResourceInUseException`: `success: false`, `queryCode: "FAILED"`, the message, no data).
 * - DynamoDB Local checks no credential: any access key is accepted, and with `-sharedDb` every key sees the same tables.
 *
 * Not covered: a real DynamoDB service (no vendor host is reachable; DynamoDB Local differs from it in limits, capacity, throttling and consistency),
 * indexes, transactions, batch operations, streams, TTL, and the signature (the server does not verify it; D10a to D10f assert the signed request).
 */
/** Candidate defect: the answer of `ReturnValues` (`Attributes`) and `LastEvaluatedKey` stay in the typed form while `Item` and `Items` are unwrapped. */
const TYPED_ANSWER_DEFECT = { type: "defect", description: "NSD-17 candidate" } as const;
/** Candidate defect: an array of strings or numbers is always written as a set (SS or NS): never a list, duplicates and an empty array are refused. */
const ARRAY_SETS_DEFECT = { type: "defect", description: "NSD-18 candidate" } as const;
/** Candidate defect: a binary attribute is read as a byte array, which the answer's JSON turns into an object with index keys; a number beyond a double loses digits. */
const VALUE_FIDELITY_DEFECT = { type: "defect", description: "NSD-19 candidate" } as const;
/** Candidate defect: an `ExclusiveStartKey` in the plain form (as `Key` is written) fails with a JavaScript `TypeError` of the SDK instead of a validation message. */
const PLAIN_START_KEY_DEFECT = { type: "defect", description: "NSD-20 candidate" } as const;

const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const QUERY_CODE_OK = "OK";
const QUERY_CODE_FAILED = "FAILED";
const MARKER_BYTES = 4;
const QUERY_ID = "q1";
const QUERY_NAME = "q";

/** The recorded variants of the actions (`recordedPluginQuery("dynamodb", variant)`; `""` is the editor's default action, Query). */
const VARIANT = {
  QUERY: "",
  SCAN: "Scan",
  PUT_ITEM: "PutItem",
  GET_ITEM: "GetItem",
  UPDATE_ITEM: "UpdateItem",
  DELETE_ITEM: "DeleteItem",
  LIST_TABLES: "ListTables",
  CREATE_TABLE: "CreateTable",
} as const;

/** The server's own error types (`__type` of the answer, after the `#`), DynamoDB Local 3.3.2, and the message the plugin reports for each. */
const SERVER_ERRORS = {
  TABLE_MISSING: { type: "ResourceNotFoundException", message: "Cannot do operations on a non-existent table" },
  CONDITION_FAILED: { type: "ConditionalCheckFailedException", message: "The conditional request failed" },
  TABLE_EXISTS: { type: "ResourceInUseException", message: "Cannot create preexisting table" },
  KEY_MISSING: { type: "ValidationException", message: "One of the required keys was not given a value" },
  KEY_TYPE: { type: "ValidationException", message: "One or more parameter values were invalid: Type mismatch for key" },
  EMPTY_NUMBER_SET: { type: "ValidationException", message: "One or more parameter values were invalid: An number set  may not be empty" },
  EMPTY_KEY: { type: "ValidationException", message: "The number of conditions on the keys is invalid" },
  NO_KEY_CONDITION: { type: "ValidationException", message: "Either the KeyConditions or KeyConditionExpression parameter must be specified in the request." },
  TABLE_NAME: {
    type: "ValidationException",
    message: "Invalid table/index name.  Table/index names must be between 3 and 255 characters long, and may contain only the characters a-z, A-Z, 0-9, '_', '-', and '.'",
  },
} as const;
const DUPLICATE_SET_MESSAGE = "One or more parameter values were invalid: Input collection [a, a] contains duplicates";
/** The SDK's own text for an `ExclusiveStartKey` it cannot serialise (measured). */
const PLAIN_START_KEY_MESSAGE = "Cannot read properties of undefined (reading '0')";

/** The shapes of what the server generates for a table. */
const TABLE_ARN = /^arn:aws:dynamodb:[a-z0-9-]+:\d{12}:table\/e2e_ddb_[0-9a-f]+/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

/** The limit of the paged scan of D15c, and the most requests it may take (a loop that never reaches a last page must end). */
const SCAN_PAGE_SIZE = 2;
const MAX_SCAN_PAGES = 10;

/** A port of the sidecar's host where nothing listens: the control that a refused connection is seen as one. */
const CLOSED_PORT = 8001;
const CONNECT_TIMEOUT_MS = 5000;
const REFUSED_MESSAGE = /^connect ECONNREFUSED \d+\.\d+\.\d+\.\d+:8001$/;

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

/** A table name of this test only (letters, digits, `_`). */
function uniqueTable(suffix = ""): string {
  return `e2e_ddb_${uniqueMarker()}${suffix}`;
}

/** One saved query: the recording's variant and the action's fields over the recorded defaults. */
interface DdbQuery {
  variant: string;
  action: Record<string, unknown>;
}

/** The form's action fields: the table (for the actions that have the field) and the JSON parameters. */
const onTable = (variant: string, tableName: string, params: unknown): DdbQuery => ({ variant, action: { tableName, params: JSON.stringify(params) } });
const withoutTable = (variant: string, params: unknown): DdbQuery => ({ variant, action: { params: JSON.stringify(params) } });

/** The key schema and attribute definitions of a table with a number hash key `id`, as the form's CreateTable default has. */
const HASH_ONLY_SCHEMA = (table: string): Record<string, unknown> => ({
  TableName: table,
  AttributeDefinitions: [{ AttributeName: "id", AttributeType: "N" }],
  KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
  ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
  StreamSpecification: { StreamEnabled: false },
});
/** A table with a string hash key `pk` and a number range key `sk` (for Query: the items of one partition in key order). */
const HASH_RANGE_SCHEMA = (table: string): Record<string, unknown> => ({
  TableName: table,
  AttributeDefinitions: [
    { AttributeName: "pk", AttributeType: "S" },
    { AttributeName: "sk", AttributeType: "N" },
  ],
  KeySchema: [
    { AttributeName: "pk", KeyType: "HASH" },
    { AttributeName: "sk", KeyType: "RANGE" },
  ],
  ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
});

/** The credentials a data source holds when they are not the suite's. */
interface Credentials {
  accessKey?: string;
  secretKey?: string;
  endpointUrl?: string;
}

/** The data source fields of the sidecar over the recorded form body. */
function sidecarConfig(overrides: Credentials = {}): Record<string, unknown> {
  const sidecar = dynamodbConnection();
  return {
    accessKey: overrides.accessKey ?? sidecar.accessKey,
    secretKey: overrides.secretKey ?? sidecar.secretKey,
    endpointUrl: overrides.endpointUrl ?? sidecar.endpointUrl,
    region: sidecar.region,
  };
}

async function ddbDatasource(page: Page, apiUser: RegisteredUser, overrides: Credentials = {}): Promise<string> {
  return createNodePluginDatasource(page.request, { orgId: apiUser.orgId, recorded: recordedPluginDatasource("dynamodb"), config: sidecarConfig(overrides) });
}

function savedQueries(datasourceId: string, queries: Record<string, DdbQuery>): ReturnType<typeof nodePluginQuery>[] {
  return Object.entries(queries).map(([id, query]) => nodePluginQuery({ id, name: id, datasourceId, recorded: recordedPluginQuery("dynamodb", query.variant), action: query.action }));
}

/** A saved app with one manual DynamoDB query per entry of `queries` on one data source (not published: the draft runs with `viewMode: false`). */
async function ddbApp(page: Page, apiUser: RegisteredUser, queries: Record<string, DdbQuery>, overrides: Credentials = {}): Promise<string> {
  const datasourceId = await ddbDatasource(page, apiUser, overrides);
  const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-dynamodb-local", dsl: appDsl([], { queries: savedQueries(datasourceId, queries) }) });
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

/** The sidecar's answer to a direct call: the status and the body. */
async function direct(operation: string, input: unknown): Promise<{ status: number; body: unknown }> {
  return dynamodbDirect(dynamodbConnection(), operation, input);
}

/** The server's own error: the HTTP status, the type after the `#` of `__type` and the message. */
async function directError(operation: string, input: unknown): Promise<{ status: number; type: string; message: string }> {
  const answer = await direct(operation, input);
  const body = answer.body as { __type?: string; message?: string; Message?: string };
  return { status: answer.status, type: String(body.__type).split("#")[1] ?? "", message: body.message ?? body.Message ?? "" };
}

/** Makes a table straight on the sidecar and waits until the server says it is active. */
async function createDirect(schema: Record<string, unknown>): Promise<void> {
  const answer = await direct("CreateTable", schema);
  expect(answer.status, `the server created ${String(schema.TableName)}`).toBe(HTTP_OK);
  expect((answer.body as { TableDescription: { TableStatus: string } }).TableDescription.TableStatus, "the table is active").toBe("ACTIVE");
}

/** Removes a test's table whatever state the test ended in (400 `ResourceNotFoundException` when it is already gone is fine). */
async function removeDirect(table: string): Promise<void> {
  const answer = await direct("DeleteTable", { TableName: table });
  expect([HTTP_OK, HTTP_BAD_REQUEST], `removing ${table}`).toContain(answer.status);
}

/** The item the server holds, in its own typed form (`undefined` when there is none). */
async function directItem(table: string, key: Record<string, unknown>): Promise<unknown> {
  const answer = await direct("GetItem", { TableName: table, Key: key, ConsistentRead: true });
  expect(answer.status, `the server answered the read of ${table}`).toBe(HTTP_OK);
  return (answer.body as { Item?: unknown }).Item;
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

/** An item of every attribute type the plugin can write from plain JSON (the numbers and strings are NOT arrays). */
const ALL_TYPES_ITEM = {
  id: 1,
  text: "Alice",
  emptyText: "",
  integer: 42,
  negative: -7,
  fraction: 3.5,
  yes: true,
  no: false,
  nothing: null,
  object: { a: 1, nested: { b: "two" } },
  numberSet: [2, 1.5],
  stringSet: ["b", "a"],
  mixedList: [1, "a", true],
  listOfObjects: [{ x: 1 }, { y: "z" }],
} as const;

/** The same item as the server holds it (DynamoDB's typed form). `numberSet` and `stringSet` are sets, which the server sorts. */
const ALL_TYPES_TYPED = {
  id: { N: "1" },
  text: { S: "Alice" },
  emptyText: { S: "" },
  integer: { N: "42" },
  negative: { N: "-7" },
  fraction: { N: "3.5" },
  yes: { BOOL: true },
  no: { BOOL: false },
  nothing: { NULL: true },
  object: { M: { a: { N: "1" }, nested: { M: { b: { S: "two" } } } } },
  numberSet: { NS: ["1.5", "2"] },
  stringSet: { SS: ["a", "b"] },
  mixedList: { L: [{ N: "1" }, { S: "a" }, { BOOL: true }] },
  listOfObjects: { L: [{ M: { x: { N: "1" } } }, { M: { y: { S: "z" } } }] },
} as const;

/** What the plugin answers for that item: the sets come back as arrays, in the server's order. */
const ALL_TYPES_PLAIN = { ...ALL_TYPES_ITEM, numberSet: [1.5, 2], stringSet: ["a", "b"] } as const;

test.describe("DynamoDB data source against a real DynamoDB Local server", { tag: [TAGS.NODE_SERVICE, TAGS.NODE_SERVICE_SIDECAR] }, () => {
  test("D15a: a table is created, listed, described and removed, and the server agrees at each step", async ({ page, apiUser }) => {
    const table = uniqueTable();
    const second = `${table}_b`;
    const third = `${table}_c`;
    try {
      const appId = await ddbApp(page, apiUser, {
        create: withoutTable(VARIANT.CREATE_TABLE, HASH_ONLY_SCHEMA(table)),
        createAgain: withoutTable(VARIANT.CREATE_TABLE, HASH_ONLY_SCHEMA(table)),
        createSecond: withoutTable(VARIANT.CREATE_TABLE, HASH_RANGE_SCHEMA(second)),
        listAll: withoutTable(VARIANT.LIST_TABLES, { Limit: 100 }),
        firstOfTwo: withoutTable(VARIANT.LIST_TABLES, { ExclusiveStartTableName: `${table}`, Limit: 1 }),
        afterFirst: withoutTable(VARIANT.LIST_TABLES, { ExclusiveStartTableName: table, Limit: 5 }),
      });

      expect((await directError("DescribeTable", { TableName: table })).type, "before the create the server has no such table").toBe(SERVER_ERRORS.TABLE_MISSING.type);
      const before = (await runForData(page, appId, "listAll")) as { TableNames: string[] };
      expect(before.TableNames, "before the create the table is not listed").not.toContain(table);

      const created = (await runForData(page, appId, "create")) as { TableDescription: Record<string, unknown> };
      expect(created, "the create answers the table's description, without `$metadata`").toEqual({
        TableDescription: {
          AttributeDefinitions: [{ AttributeName: "id", AttributeType: "N" }],
          CreationDateTime: expect.stringMatching(ISO_DATE),
          DeletionProtectionEnabled: false,
          ItemCount: 0,
          KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
          ProvisionedThroughput: {
            LastDecreaseDateTime: expect.stringMatching(ISO_DATE),
            LastIncreaseDateTime: expect.stringMatching(ISO_DATE),
            NumberOfDecreasesToday: 0,
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1,
          },
          TableArn: expect.stringMatching(TABLE_ARN),
          TableName: table,
          TableSizeBytes: 0,
          TableStatus: "ACTIVE",
        },
      });
      const described = await direct("DescribeTable", { TableName: table });
      expect({ status: described.status, name: (described.body as { Table: { TableName: string; TableStatus: string } }).Table.TableName }, "the server's own view").toEqual({ status: HTTP_OK, name: table });
      const listed = (await runForData(page, appId, "listAll")) as { TableNames: string[] };
      expect(listed.TableNames, "the new table is listed").toContain(table);
      expect(listed.TableNames, "in name order").toEqual([...listed.TableNames].sort());

      // a second create of the same name is the server's refusal, with its message
      expectFailed(await runDraft(page, appId, "createAgain"), SERVER_ERRORS.TABLE_EXISTS.message);
      expect(await directError("CreateTable", HASH_ONLY_SCHEMA(table)), "the server's own refusal").toEqual({ status: HTTP_BAD_REQUEST, ...SERVER_ERRORS.TABLE_EXISTS });

      // paging through the names: the name after `table` is the second table of this test (its name sorts right after: the same marker, a longer name)
      await runForData(page, appId, "createSecond");
      // a third table, so that a name follows the second whatever other tests have made: the server returns the continuation key only when more names follow
      await createDirect(HASH_ONLY_SCHEMA(third));
      expect(await runForData(page, appId, "firstOfTwo"), "a page of one name: the table after the start name, and the key to continue (a name follows)").toEqual({ TableNames: [second], LastEvaluatedTableName: second });
      const after = (await runForData(page, appId, "afterFirst")) as { TableNames: string[]; LastEvaluatedTableName?: string };
      expect(after.TableNames[0], "the page that starts after the first table begins with the second").toBe(second);
      expect(after.TableNames, "in name order").toEqual([...after.TableNames].sort());
      expect(after.TableNames.every((name) => name > table), "every name after the start name").toBe(true);
    } finally {
      await removeDirect(table);
      await removeDirect(second);
      await removeDirect(third);
    }
  });

  test("D15b: an item of every type the plugin writes is stored in the typed form and read back as plain values", async ({ page, apiUser }) => {
    const table = uniqueTable();
    try {
      await createDirect(HASH_ONLY_SCHEMA(table));
      const appId = await ddbApp(page, apiUser, {
        put: onTable(VARIANT.PUT_ITEM, table, { Item: ALL_TYPES_ITEM }),
        get: onTable(VARIANT.GET_ITEM, table, { Key: { id: 1 } }),
        getMissing: onTable(VARIANT.GET_ITEM, table, { Key: { id: 2 } }),
      });

      expect(await runForData(page, appId, "getMissing"), "before the put there is no item: the answer is an empty object").toEqual({});
      expect(await directItem(table, { id: { N: "1" } }), "the server holds no item before the put").toBeUndefined();
      expect(await runForData(page, appId, "put"), "a put answers an empty object").toEqual({});
      expect(await directItem(table, { id: { N: "1" } }), "the server's own copy: the typed form of every attribute").toEqual(ALL_TYPES_TYPED);
      expect(await runForData(page, appId, "get"), "the plugin's read: plain values, the sets as arrays").toEqual({ Item: ALL_TYPES_PLAIN });
    } finally {
      await removeDirect(table);
    }
  });

  test("D15c: Query and Scan read items, and the plugin unwraps Items but leaves LastEvaluatedKey typed and takes the next page's ExclusiveStartKey typed", async ({ page, apiUser }) => {
    const table = uniqueTable();
    const partition = `p-${uniqueMarker()}`;
    const rows = [1, 2, 3, 4, 5].map((sk) => ({ pk: partition, sk, label: `row-${sk}` }));
    try {
      await createDirect(HASH_RANGE_SCHEMA(table));
      for (const row of rows) {
        const put = await direct("PutItem", { TableName: table, Item: { pk: { S: row.pk }, sk: { N: String(row.sk) }, label: { S: row.label } } });
        expect(put.status, `the server stored ${row.label}`).toBe(HTTP_OK);
      }
      const key = (sk: number): Record<string, unknown> => ({ pk: { S: partition }, sk: { N: String(sk) } });
      const partitionValues = { ":p": { S: partition } };
      const appId = await ddbApp(page, apiUser, {
        all: onTable(VARIANT.QUERY, table, { KeyConditionExpression: "pk = :p", ExpressionAttributeValues: partitionValues }),
        range: onTable(VARIANT.QUERY, table, { KeyConditionExpression: "pk = :p AND sk > :m", ExpressionAttributeValues: { ...partitionValues, ":m": { N: "3" } }, ProjectionExpression: "sk" }),
        descending: onTable(VARIANT.QUERY, table, { KeyConditionExpression: "pk = :p", ExpressionAttributeValues: partitionValues, ScanIndexForward: false, Limit: 1 }),
        pageOne: onTable(VARIANT.QUERY, table, { KeyConditionExpression: "pk = :p", ExpressionAttributeValues: partitionValues, Limit: 2 }),
        pageTwo: onTable(VARIANT.QUERY, table, { KeyConditionExpression: "pk = :p", ExpressionAttributeValues: partitionValues, Limit: 2, ExclusiveStartKey: key(2) }),
        pageLast: onTable(VARIANT.QUERY, table, { KeyConditionExpression: "pk = :p", ExpressionAttributeValues: partitionValues, Limit: 2, ExclusiveStartKey: key(4) }),
        scanFiltered: onTable(VARIANT.SCAN, table, { FilterExpression: "sk >= :m", ExpressionAttributeValues: { ":m": { N: "4" } } }),
        scanCount: onTable(VARIANT.SCAN, table, { Select: "COUNT" }),
        noCondition: onTable(VARIANT.QUERY, table, {}),
      });

      expect(await runForData(page, appId, "all"), "every item of the partition, unwrapped, with the counts").toEqual({ Count: 5, Items: rows, ScannedCount: 5 });
      expect(await runForData(page, appId, "range"), "a range condition with a projection").toEqual({ Count: 2, Items: [{ sk: 4 }, { sk: 5 }], ScannedCount: 2 });
      expect(await runForData(page, appId, "descending"), "descending order, the first item, and the key to continue (typed)").toEqual({
        Count: 1,
        Items: [rows[4]],
        LastEvaluatedKey: key(5),
        ScannedCount: 1,
      });
      expect(await runForData(page, appId, "pageOne"), "the first page: two items and the typed LastEvaluatedKey").toEqual({ Count: 2, Items: [rows[0], rows[1]], LastEvaluatedKey: key(2), ScannedCount: 2 });
      expect(await runForData(page, appId, "pageTwo"), "the typed key of the first page continues after its last item").toEqual({ Count: 2, Items: [rows[2], rows[3]], LastEvaluatedKey: key(4), ScannedCount: 2 });
      expect(await runForData(page, appId, "pageLast"), "the last page has no LastEvaluatedKey").toEqual({ Count: 1, Items: [rows[4]], ScannedCount: 1 });
      const scanned = (await runForData(page, appId, "scanFiltered")) as { Count: number; Items: unknown[]; ScannedCount: number };
      expect(scanned.ScannedCount, "the scan reads every item and filters afterwards").toBe(5);
      expect({ count: scanned.Count, items: [...scanned.Items].sort((a, b) => (a as { sk: number }).sk - (b as { sk: number }).sk) }, "the filtered items").toEqual({ count: 2, items: [rows[3], rows[4]] });
      expect(await runForData(page, appId, "scanCount"), "a count-only scan has no Items").toEqual({ Count: 5, ScannedCount: 5 });
      // a scan does not promise an order, nor where the server cuts a page: feed each returned (typed) LastEvaluatedKey into the next request until none is returned
      type ScanPage = { Count: number; Items: typeof rows; LastEvaluatedKey?: Record<string, unknown>; ScannedCount: number };
      const sentStartKeys: (Record<string, unknown> | undefined)[] = [];
      const pages: ScanPage[] = [];
      for (let request = 0; request < MAX_SCAN_PAGES; request++) {
        const startKey = pages[request - 1]?.LastEvaluatedKey;
        sentStartKeys.push(startKey);
        const pageApp = await ddbApp(page, apiUser, { scan: onTable(VARIANT.SCAN, table, startKey === undefined ? { Limit: SCAN_PAGE_SIZE } : { Limit: SCAN_PAGE_SIZE, ExclusiveStartKey: startKey }) });
        pages.push((await runForData(page, pageApp, "scan")) as ScanPage);
        if (pages[request]?.LastEvaluatedKey === undefined) break;
      }
      const allItems = pages.flatMap((scanned) => scanned.Items);
      const bySortKey = (a: { sk: number }, b: { sk: number }): number => a.sk - b.sk;
      expect([...allItems].sort(bySortKey), "the pages together hold every item of the test exactly once: none missing, none twice").toEqual(rows);
      expect(
        pages.every((scanned) => scanned.Items.length <= SCAN_PAGE_SIZE && scanned.Count === scanned.Items.length && scanned.ScannedCount === scanned.Items.length),
        "every page holds at most the limit, and its counts are its items",
      ).toBe(true);
      expect(pages[pages.length - 1]?.LastEvaluatedKey, "the last page has no key").toBeUndefined();
      expect(pages.slice(0, -1).every((scanned) => scanned.LastEvaluatedKey !== undefined), "every page before the last has a typed key").toBe(true);
      expect(pages.length, "the five items needed at least three requests at a limit of two: paging really happened").toBeGreaterThanOrEqual(Math.ceil(rows.length / SCAN_PAGE_SIZE));
      expect(sentStartKeys, "the first request had no start key, each later one started from the key the page before returned").toEqual([undefined, ...pages.slice(0, -1).map((scanned) => scanned.LastEvaluatedKey)]);
      expectFailed(await runDraft(page, appId, "noCondition"), SERVER_ERRORS.NO_KEY_CONDITION.message);
    } finally {
      await removeDirect(table);
    }
  });

  test("D15d: UpdateItem changes attributes and a conditional update that does not hold changes nothing", { annotation: TYPED_ANSWER_DEFECT }, async ({ page, apiUser }) => {
    const table = uniqueTable();
    try {
      await createDirect(HASH_ONLY_SCHEMA(table));
      const put = await direct("PutItem", { TableName: table, Item: { id: { N: "1" }, name: { S: "Alice" }, age: { N: "17" } } });
      expect(put.status, "the server stored the item").toBe(HTTP_OK);
      const appId = await ddbApp(page, apiUser, {
        update: onTable(VARIANT.UPDATE_ITEM, table, { Key: { id: 1 }, UpdateExpression: "set age = :n, tags = :t", ExpressionAttributeValues: { ":n": { N: "18" }, ":t": { SS: ["x", "y"] } } }),
        updateNew: onTable(VARIANT.UPDATE_ITEM, table, { Key: { id: 1 }, UpdateExpression: "set age = :n", ExpressionAttributeValues: { ":n": { N: "19" } }, ReturnValues: "ALL_NEW" }),
        conditionFails: onTable(VARIANT.UPDATE_ITEM, table, {
          Key: { id: 1 },
          UpdateExpression: "set age = :n",
          ConditionExpression: "age = :old",
          ExpressionAttributeValues: { ":n": { N: "99" }, ":old": { N: "1" } },
        }),
        conditionHolds: onTable(VARIANT.UPDATE_ITEM, table, {
          Key: { id: 1 },
          UpdateExpression: "set age = :n",
          ConditionExpression: "age = :old",
          ExpressionAttributeValues: { ":n": { N: "20" }, ":old": { N: "19" } },
        }),
        get: onTable(VARIANT.GET_ITEM, table, { Key: { id: 1 } }),
      });

      expect(await runForData(page, appId, "update"), "an update answers an empty object").toEqual({});
      expect(await runForData(page, appId, "get"), "the item as the plugin reads it after the update").toEqual({ Item: { id: 1, name: "Alice", age: 18, tags: ["x", "y"] } });
      expect(await directItem(table, { id: { N: "1" } }), "the server's own copy").toEqual({ id: { N: "1" }, name: { S: "Alice" }, age: { N: "18" }, tags: { SS: ["x", "y"] } });
      // NSD-17 candidate: Attributes of ReturnValues stays typed while Item is unwrapped
      expect(await runForData(page, appId, "updateNew"), "ALL_NEW: the attributes are NOT unwrapped").toEqual({
        Attributes: { id: { N: "1" }, name: { S: "Alice" }, age: { N: "19" }, tags: { SS: ["x", "y"] } },
      });
      expectFailed(await runDraft(page, appId, "conditionFails"), SERVER_ERRORS.CONDITION_FAILED.message);
      expect((await directItem(table, { id: { N: "1" } }) as { age: unknown }).age, "the failed condition changed nothing").toEqual({ N: "19" });
      expect(await directError("UpdateItem", { TableName: table, Key: { id: { N: "1" } }, UpdateExpression: "set age = :n", ConditionExpression: "age = :old", ExpressionAttributeValues: { ":n": { N: "99" }, ":old": { N: "1" } } }), "the server's own refusal").toEqual({
        status: HTTP_BAD_REQUEST,
        ...SERVER_ERRORS.CONDITION_FAILED,
      });
      expect(await runForData(page, appId, "conditionHolds"), "positive control: the same query with a condition that holds updates").toEqual({});
      expect((await directItem(table, { id: { N: "1" } }) as { age: unknown }).age, "the update with the true condition was applied").toEqual({ N: "20" });
    } finally {
      await removeDirect(table);
    }
  });

  test("D15e: DeleteItem removes an item, an absent item is not an error (the server reports the capacity), and a condition that does not hold keeps the item", { annotation: TYPED_ANSWER_DEFECT }, async ({ page, apiUser }) => {
    const table = uniqueTable();
    try {
      await createDirect(HASH_ONLY_SCHEMA(table));
      for (const id of [1, 2, 3, 4]) {
        const put = await direct("PutItem", { TableName: table, Item: { id: { N: String(id) }, name: { S: `item-${id}` } } });
        expect(put.status, `the server stored item ${id}`).toBe(HTTP_OK);
      }
      const appId = await ddbApp(page, apiUser, {
        remove: onTable(VARIANT.DELETE_ITEM, table, { Key: { id: 1 } }),
        removeOld: onTable(VARIANT.DELETE_ITEM, table, { Key: { id: 2 }, ReturnValues: "ALL_OLD" }),
        removeAbsent: onTable(VARIANT.DELETE_ITEM, table, { Key: { id: 99 } }),
        conditionFails: onTable(VARIANT.DELETE_ITEM, table, { Key: { id: 3 }, ConditionExpression: "attribute_not_exists(id)" }),
        conditionHolds: onTable(VARIANT.DELETE_ITEM, table, { Key: { id: 4 }, ConditionExpression: "attribute_exists(id)" }),
      });

      expect(await directItem(table, { id: { N: "1" } }), "before the delete the server holds the item").toEqual({ id: { N: "1" }, name: { S: "item-1" } });
      expect(await runForData(page, appId, "remove"), "a delete answers an empty object").toEqual({});
      expect(await directItem(table, { id: { N: "1" } }), "the server no longer holds the item").toBeUndefined();
      // NSD-17 candidate: Attributes of ReturnValues stays typed
      expect(await runForData(page, appId, "removeOld"), "ALL_OLD: the deleted item's attributes, NOT unwrapped").toEqual({ Attributes: { id: { N: "2" }, name: { S: "item-2" } } });
      expect(await directItem(table, { id: { N: "2" } }), "the item with ALL_OLD is gone too").toBeUndefined();
      expect(await runForData(page, appId, "removeAbsent"), "an item that was never there: success, and the server reports the capacity it used (the delete of an existing item above reports none)").toEqual({
        ConsumedCapacity: { CapacityUnits: 1, TableName: table },
      });
      expectFailed(await runDraft(page, appId, "conditionFails"), SERVER_ERRORS.CONDITION_FAILED.message);
      expect(await directItem(table, { id: { N: "3" } }), "the failed condition kept the item").toEqual({ id: { N: "3" }, name: { S: "item-3" } });
      expect(await directItem(table, { id: { N: "4" } }), "before the conditional delete that holds, the server holds the item").toEqual({ id: { N: "4" }, name: { S: "item-4" } });
      expect(await runForData(page, appId, "conditionHolds"), "positive control: a conditional delete whose condition holds succeeds").toEqual({});
      expect(await directItem(table, { id: { N: "4" } }), "and the item is gone").toBeUndefined();
    } finally {
      await removeDirect(table);
    }
  });

  test("D15f: a missing table, a failed condition and a validation error fail the query with the server's message, and the same actions succeed on a table that exists", async ({ page, apiUser }) => {
    const table = uniqueTable();
    const missing = uniqueTable("_missing");
    try {
      await createDirect(HASH_ONLY_SCHEMA(table));
      const appId = await ddbApp(page, apiUser, {
        getMissingTable: onTable(VARIANT.GET_ITEM, missing, { Key: { id: 1 } }),
        putMissingTable: onTable(VARIANT.PUT_ITEM, missing, { Item: { id: 1 } }),
        getOk: onTable(VARIANT.GET_ITEM, table, { Key: { id: 1 } }),
        putOk: onTable(VARIANT.PUT_ITEM, table, { Item: { id: 1, name: "Alice" } }),
        putIfAbsent: onTable(VARIANT.PUT_ITEM, table, { Item: { id: 1, name: "Bob" }, ConditionExpression: "attribute_not_exists(id)" }),
        putIfAbsentNew: onTable(VARIANT.PUT_ITEM, table, { Item: { id: 2, name: "Carol" }, ConditionExpression: "attribute_not_exists(id)" }),
        putWithoutKey: onTable(VARIANT.PUT_ITEM, table, { Item: { name: "no key" } }),
        putWrongKeyType: onTable(VARIANT.PUT_ITEM, table, { Item: { id: "one" } }),
        getEmptyKey: onTable(VARIANT.GET_ITEM, table, { Key: {} }),
        getEmptyTableName: onTable(VARIANT.GET_ITEM, "", { Key: { id: 1 } }),
        createBadName: withoutTable(VARIANT.CREATE_TABLE, { TableName: "ab" }),
      });

      expect(await directError("GetItem", { TableName: missing, Key: { id: { N: "1" } } }), "the server's own error for a missing table").toEqual({ status: HTTP_BAD_REQUEST, ...SERVER_ERRORS.TABLE_MISSING });
      expectFailed(await runDraft(page, appId, "getMissingTable"), SERVER_ERRORS.TABLE_MISSING.message);
      expectFailed(await runDraft(page, appId, "putMissingTable"), SERVER_ERRORS.TABLE_MISSING.message);
      expect(await runForData(page, appId, "getOk"), "positive control: the same read of a table that exists is an empty object before the put").toEqual({});

      expect(await runForData(page, appId, "putOk"), "positive control: a put without a condition succeeds").toEqual({});
      expectFailed(await runDraft(page, appId, "putIfAbsent"), SERVER_ERRORS.CONDITION_FAILED.message);
      expect(await directItem(table, { id: { N: "1" } }), "the refused put left the first item").toEqual({ id: { N: "1" }, name: { S: "Alice" } });
      expect(await runForData(page, appId, "putIfAbsentNew"), "positive control: the same conditional put of an id that is absent succeeds").toEqual({});
      expect(await directItem(table, { id: { N: "2" } }), "and the item is stored").toEqual({ id: { N: "2" }, name: { S: "Carol" } });

      expectFailed(await runDraft(page, appId, "putWithoutKey"), SERVER_ERRORS.KEY_MISSING.message);
      expectFailed(await runDraft(page, appId, "putWrongKeyType"), SERVER_ERRORS.KEY_TYPE.message);
      expectFailed(await runDraft(page, appId, "getEmptyKey"), SERVER_ERRORS.EMPTY_KEY.message);
      expect(await directError("GetItem", { TableName: table, Key: {} }), "the server's own validation error for an empty key").toEqual({ status: HTTP_BAD_REQUEST, ...SERVER_ERRORS.EMPTY_KEY });
      expectFailed(await runDraft(page, appId, "getEmptyTableName"), SERVER_ERRORS.TABLE_NAME.message);
      expectFailed(await runDraft(page, appId, "createBadName"), SERVER_ERRORS.TABLE_NAME.message);
    } finally {
      await removeDirect(table);
    }
  });

  test("D15g: an array of strings or numbers is written as a set, never a list: order is lost, duplicates and an empty array are refused", { annotation: ARRAY_SETS_DEFECT }, async ({ page, apiUser }) => {
    const table = uniqueTable();
    try {
      await createDirect(HASH_ONLY_SCHEMA(table));
      const appId = await ddbApp(page, apiUser, {
        putStrings: onTable(VARIANT.PUT_ITEM, table, { Item: { id: 1, names: ["zeta", "alpha", "mid"] } }),
        putNumbers: onTable(VARIANT.PUT_ITEM, table, { Item: { id: 2, numbers: [30, 10, 20] } }),
        putMixed: onTable(VARIANT.PUT_ITEM, table, { Item: { id: 3, mixed: ["zeta", 1, "alpha"] } }),
        putDuplicates: onTable(VARIANT.PUT_ITEM, table, { Item: { id: 4, names: ["a", "a"] } }),
        putEmpty: onTable(VARIANT.PUT_ITEM, table, { Item: { id: 5, none: [] } }),
        getStrings: onTable(VARIANT.GET_ITEM, table, { Key: { id: 1 } }),
        getNumbers: onTable(VARIANT.GET_ITEM, table, { Key: { id: 2 } }),
      });

      expect(await runForData(page, appId, "putStrings")).toEqual({});
      expect(await runForData(page, appId, "putNumbers")).toEqual({});
      expect(await runForData(page, appId, "putMixed"), "positive control: an array of mixed values is a list, in order").toEqual({});
      expect(await directItem(table, { id: { N: "1" } }), "the server holds the strings as a string set").toEqual({ id: { N: "1" }, names: { SS: ["alpha", "mid", "zeta"] } });
      expect(await directItem(table, { id: { N: "2" } }), "the server holds the numbers as a number set").toEqual({ id: { N: "2" }, numbers: { NS: ["10", "20", "30"] } });
      expect(await directItem(table, { id: { N: "3" } }), "positive control: the mixed array is a list").toEqual({ id: { N: "3" }, mixed: { L: [{ S: "zeta" }, { N: "1" }, { S: "alpha" }] } });
      expect(await runForData(page, appId, "getStrings"), "the written order is lost").toEqual({ Item: { id: 1, names: ["alpha", "mid", "zeta"] } });
      expect(await runForData(page, appId, "getNumbers"), "the numbers come back sorted").toEqual({ Item: { id: 2, numbers: [10, 20, 30] } });
      expectFailed(await runDraft(page, appId, "putDuplicates"), DUPLICATE_SET_MESSAGE);
      expectFailed(await runDraft(page, appId, "putEmpty"), SERVER_ERRORS.EMPTY_NUMBER_SET.message);
      expect(await directItem(table, { id: { N: "4" } }), "the refused puts stored nothing").toBeUndefined();
      expect(await directItem(table, { id: { N: "5" } }), "the refused empty array stored nothing").toBeUndefined();
    } finally {
      await removeDirect(table);
    }
  });

  test("D15h: a binary attribute is read as an object with index keys, a number beyond a double loses digits, and a typed value in an Item is written as a map", { annotation: VALUE_FIDELITY_DEFECT }, async ({ page, apiUser }) => {
    const table = uniqueTable();
    const hello = Buffer.from("hello");
    const bigNumber = "12345678901234567890";
    try {
      await createDirect(HASH_ONLY_SCHEMA(table));
      const put = await direct("PutItem", { TableName: table, Item: { id: { N: "1" }, blob: { B: hello.toString("base64") }, blobs: { BS: [hello.toString("base64")] }, big: { N: bigNumber } } });
      expect(put.status, "the server stored the binary and the big number").toBe(HTTP_OK);
      const appId = await ddbApp(page, apiUser, {
        get: onTable(VARIANT.GET_ITEM, table, { Key: { id: 1 } }),
        putTyped: onTable(VARIANT.PUT_ITEM, table, { Item: { id: 2, blob: { B: hello.toString("base64") } } }),
        getTyped: onTable(VARIANT.GET_ITEM, table, { Key: { id: 2 } }),
      });

      expect(await directItem(table, { id: { N: "1" } }), "the server's own copy: a binary, a binary set and the exact number").toEqual({
        id: { N: "1" },
        blob: { B: hello.toString("base64") },
        blobs: { BS: [hello.toString("base64")] },
        big: { N: bigNumber },
      });
      const indexed = Object.fromEntries([...hello].map((byte, index) => [String(index), byte]));
      expect(await runForData(page, appId, "get"), "the plugin's read: the binary is an object with index keys, the number is a double").toEqual({
        Item: { id: 1, blob: indexed, blobs: [indexed], big: 12345678901234567000 },
      });
      // a typed value inside `Item` is wrapped like any object: the plugin cannot write a binary
      expect(await runForData(page, appId, "putTyped")).toEqual({});
      expect(await directItem(table, { id: { N: "2" } }), "the server holds a map whose `B` member is a string").toEqual({ id: { N: "2" }, blob: { M: { B: { S: hello.toString("base64") } } } });
      expect(await runForData(page, appId, "getTyped"), "positive control: a plain map reads back as the object that was written").toEqual({ Item: { id: 2, blob: { B: hello.toString("base64") } } });
    } finally {
      await removeDirect(table);
    }
  });

  test("D15i: an ExclusiveStartKey in the plain form fails with a TypeError of the SDK, and the typed form of the same key continues the read", { annotation: PLAIN_START_KEY_DEFECT }, async ({ page, apiUser }) => {
    const table = uniqueTable();
    try {
      await createDirect(HASH_ONLY_SCHEMA(table));
      for (const id of [1, 2, 3]) {
        const put = await direct("PutItem", { TableName: table, Item: { id: { N: String(id) } } });
        expect(put.status, `the server stored item ${id}`).toBe(HTTP_OK);
      }
      const appId = await ddbApp(page, apiUser, {
        plain: onTable(VARIANT.SCAN, table, { Limit: 1, ExclusiveStartKey: { id: 1 } }),
        typed: onTable(VARIANT.SCAN, table, { Limit: 1, ExclusiveStartKey: { id: { N: "1" } } }),
      });

      expectFailed(await runDraft(page, appId, "plain"), PLAIN_START_KEY_MESSAGE);
      const typed = (await runForData(page, appId, "typed")) as { Count: number; Items: { id: number }[]; ScannedCount: number };
      expect({ count: typed.Count, scanned: typed.ScannedCount, items: typed.Items.length }, "positive control: the typed key continues the read").toEqual({ count: 1, scanned: 1, items: 1 });
    } finally {
      await removeDirect(table);
    }
  });

  test("D15j: any access key reaches the same tables, and a data source on a closed port of the sidecar's host fails with the connection error", async ({ page, apiUser }) => {
    const table = uniqueTable();
    const sidecar: DynamodbConnection = dynamodbConnection();
    const otherKey = `other${uniqueMarker()}`;
    const closedUrl = `http://${new URL(sidecar.endpointUrl).hostname}:${CLOSED_PORT}`;
    try {
      await createDirect(HASH_ONLY_SCHEMA(table));
      const queries = { get: onTable(VARIANT.GET_ITEM, table, { Key: { id: 1 } }), put: onTable(VARIANT.PUT_ITEM, table, { Item: { id: 1, owner: otherKey } }) };
      const otherApp = await ddbApp(page, apiUser, queries, { accessKey: otherKey, secretKey: `secret-${otherKey}` });
      const closedApp = await ddbApp(page, apiUser, { get: queries.get }, { endpointUrl: closedUrl });
      const suiteApp = await ddbApp(page, apiUser, { get: queries.get });

      expect(await runForData(page, otherApp, "put"), "another access key writes to the table the suite's key made").toEqual({});
      expect(await directItem(table, { id: { N: "1" } }), "the server holds the item").toEqual({ id: { N: "1" }, owner: { S: otherKey } });
      expect(await runForData(page, suiteApp, "get"), "the suite's own key reads what the other key wrote (a shared database)").toEqual({ Item: { id: 1, owner: otherKey } });
      expectFailed(await runDraft(page, closedApp, "get"), expect.stringMatching(REFUSED_MESSAGE) as unknown as string);
    } finally {
      await removeDirect(table);
    }
  });

  test("D15k: the published view shows an item of the server after a click", async ({ page, apiUser }) => {
    const table = uniqueTable();
    const name = `name-${uniqueMarker()}`;
    try {
      await createDirect(HASH_ONLY_SCHEMA(table));
      const put = await direct("PutItem", { TableName: table, Item: { id: { N: "1" }, name: { S: name } } });
      expect(put.status, "the server stored the item").toBe(HTTP_OK);
      const datasourceId = await ddbDatasource(page, apiUser);
      // before the first run `q.data` is not an object
      const expression = `{{${QUERY_NAME}.data ? ${QUERY_NAME}.data.Item.name : ""}}`;
      const view = await openSeededView(
        page,
        apiUser.orgId,
        "e2e-dynamodb-local-view",
        stackItems([
          button({ id: "b1", name: "button1", text: "Run", testId: "e2e-dynamodb-run", onClickQuery: QUERY_NAME }),
          boundText({ id: "t1", name: "label", expression }),
          // `success` also reads `true` before the first run (measured, D5e), so only the state after the click proves anything
          boundText({ id: "t2", name: "succeeded", expression: `{{String(${QUERY_NAME}.success)}}` }),
        ]),
        {
          queries: [
            nodePluginQuery({
              id: QUERY_ID,
              name: QUERY_NAME,
              datasourceId,
              recorded: recordedPluginQuery("dynamodb", VARIANT.GET_ITEM),
              action: onTable(VARIANT.GET_ITEM, table, { Key: { id: 1 } }).action,
            }),
          ],
        },
      );

      await expect(view.byTestId(boundTextTestId("label")), "before the click the text is empty").toHaveText("");
      await view.buttonByTestId("e2e-dynamodb-run").click();
      await expect(view.byTestId(boundTextTestId("succeeded")), "after the click the query succeeded").toHaveText("true");
      await expect(view.byTestId(boundTextTestId("label")), "after the click the text shows the server's item").toHaveText(name);
    } finally {
      await removeDirect(table);
    }
  });

  test("D15l: the runner reaches the sidecar over HTTP and TCP, and a closed port of the same host is refused", async () => {
    const sidecar: DynamodbConnection = dynamodbConnection();
    const host = new URL(sidecar.endpointUrl).hostname;

    const listed = await dynamodbDirect(sidecar, "ListTables", {});

    expect(listed.status, "the server answers a signed ListTables").toBe(HTTP_OK);
    expect(Object.keys(listed.body as object), "the answer lists tables").toContain("TableNames");
    const withoutCredentials = await fetch(`${sidecar.endpointUrl}/`, { method: "POST", headers: { "X-Amz-Target": "DynamoDB_20120810.ListTables", "Content-Type": "application/x-amz-json-1.0" }, body: "{}" });
    expect(withoutCredentials.status, "positive control: without a credential scope the server refuses").toBe(HTTP_BAD_REQUEST);
    expect(await tcpOutcome(host, DYNAMODB.PORT), "the sidecar's HTTP port").toBe("connected");
    expect(await tcpOutcome(host, CLOSED_PORT), "positive control: a port nothing listens on is refused").toBe("ECONNREFUSED");
  });
});
