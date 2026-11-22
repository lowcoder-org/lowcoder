import {
  CreateTableCommand,
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  ListTablesCommand,
  PutItemCommand,
  QueryCommand,
  ScanCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { ServiceError } from "../../common/error";
import dynamoDBPlugin from "./index";
import queryConfig, { ActionDataType } from "./queryConfig";
import { DataSourceDataType } from "./dataSourceConfig";
import { runDynamoDbQuery } from "./run";

/**
 * dynamodb plugin: the SDK boundary is DynamoDBClient.prototype.send (this suite replaces the skipped
 * live-service suite that needed a local DynamoDB on port 6789). The fake records every command and the
 * client configuration it was sent through, and answers per command class.
 */

const STATUS_BAD_REQUEST = 400;
const ACCESS_KEY = "AKIATESTKEY";
const SECRET_KEY = "test-secret-key";
const REGION = "us-east-2";
const ENDPOINT_HOST = "dynamo.local.test";
const ENDPOINT_PORT = 6789;
const ENDPOINT_URL = `http://${ENDPOINT_HOST}:${ENDPOINT_PORT}`;
const TABLE = "users";
const METADATA = { httpStatusCode: 200, requestId: "req-1" };

const dataSource = (over: Partial<DataSourceDataType> = {}): DataSourceDataType => ({
  accessKey: ACCESS_KEY,
  secretKey: SECRET_KEY,
  endpointUrl: ENDPOINT_URL,
  region: REGION,
  specVersion: "",
  ...over,
});
const act = (a: Record<string, unknown>) => a as unknown as ActionDataType;

type Sent = {
  command: object;
  input: any;
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
  endpoint?: { hostname: string; port?: number; protocol: string };
};
type Responder = (command: any) => any;
let sent: Sent[];
let responders: Map<Function, Responder>;
let sendSpy: jest.SpyInstance;

const respondTo = (commandClass: Function, responder: Responder) => responders.set(commandClass, responder);

beforeEach(() => {
  sent = [];
  responders = new Map();
  sendSpy = jest.spyOn(DynamoDBClient.prototype, "send").mockImplementation(async function (this: DynamoDBClient, command: any) {
    const config: any = this.config;
    const credentials = await config.credentials();
    const region = await config.region();
    const endpoint = typeof config.endpoint === "function" ? await config.endpoint() : undefined;
    sent.push({
      command,
      input: command.input,
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      region,
      endpoint,
    });
    const responder = responders.get(command.constructor);
    if (!responder) {
      throw new Error(`unexpected command ${command.constructor.name}`);
    }
    return responder(command);
  } as any);
});

afterEach(() => {
  sendSpy.mockRestore();
});

describe("argument validation", () => {
  test("an unknown action name is a 400 ServiceError and nothing is sent", async () => {
    const outcome = runDynamoDbQuery(act({ actionName: "Bogus", params: {} }), dataSource());
    await expect(outcome).rejects.toBeInstanceOf(ServiceError);
    await expect(outcome).rejects.toMatchObject({ message: "Unknown operation: Bogus", code: STATUS_BAD_REQUEST });
    expect(sendSpy).not.toHaveBeenCalled();
  });

  test.each([
    ["an array", []],
    ["a string", "{}"],
    ["null", null],
    ["a number", 5],
  ])("params that are %s are a 400 ServiceError and nothing is sent", async (_label, params) => {
    const outcome = runDynamoDbQuery(act({ actionName: "Scan", tableName: TABLE, params }), dataSource());
    await expect(outcome).rejects.toBeInstanceOf(ServiceError);
    await expect(outcome).rejects.toMatchObject({ message: "Parameters must be a plain object", code: STATUS_BAD_REQUEST });
    expect(sendSpy).not.toHaveBeenCalled();
  });

  test("the action name is checked before the params", async () => {
    await expect(runDynamoDbQuery(act({ actionName: "Bogus", params: [] }), dataSource())).rejects.toMatchObject({
      message: "Unknown operation: Bogus",
    });
  });
});

describe("client construction", () => {
  test("the data source's credentials, region and endpoint URL reach the client", async () => {
    respondTo(ListTablesCommand, () => ({ TableNames: [], $metadata: METADATA }));
    await runDynamoDbQuery(act({ actionName: "ListTables", params: {} }), dataSource());
    expect(sent).toHaveLength(1);
    expect(sent[0].accessKeyId).toBe(ACCESS_KEY);
    expect(sent[0].secretAccessKey).toBe(SECRET_KEY);
    expect(sent[0].region).toBe(REGION);
    expect(sent[0].endpoint).toMatchObject({ hostname: ENDPOINT_HOST, port: ENDPOINT_PORT, protocol: "http:" });
  });

  test("an absent endpoint URL leaves the client on its default endpoint resolution", async () => {
    respondTo(ListTablesCommand, () => ({ TableNames: [], $metadata: METADATA }));
    await runDynamoDbQuery(act({ actionName: "ListTables", params: {} }), dataSource({ endpointUrl: undefined as unknown as string }));
    expect(sent[0].endpoint).toBeUndefined();
  });

  // A cleared endpoint field arrives as "": it must not become a custom endpoint "" (the SDK throws `Invalid URL`).
  test("B39: an empty endpoint URL is treated as unset", async () => {
    respondTo(ListTablesCommand, () => ({ TableNames: [], $metadata: METADATA }));
    await runDynamoDbQuery(act({ actionName: "ListTables", params: {} }), dataSource({ endpointUrl: "" }));
    expect(sent[0].endpoint).toBeUndefined();
  });

  test("a null endpoint URL is treated as unset", async () => {
    respondTo(ListTablesCommand, () => ({ TableNames: [], $metadata: METADATA }));
    await runDynamoDbQuery(act({ actionName: "ListTables", params: {} }), dataSource({ endpointUrl: null as unknown as string }));
    expect(sent).toHaveLength(1);
    expect(sent[0].endpoint).toBeUndefined();
  });

  test("a non-empty invalid endpoint URL still reaches the client and the request fails", async () => {
    respondTo(ListTablesCommand, () => ({ TableNames: [], $metadata: METADATA }));
    const outcome = runDynamoDbQuery(act({ actionName: "ListTables", params: {} }), dataSource({ endpointUrl: "not a url" }));
    // The SDK's TypeError comes from another realm than the test's, so match on name and message.
    await expect(outcome).rejects.toMatchObject({ name: "TypeError", message: "Invalid URL" });
    expect(sent).toHaveLength(0);
  });
});

describe("actions", () => {
  test("PutItem sends the plain Item in DynamoDB-typed form with the action's table name", async () => {
    respondTo(PutItemCommand, () => ({ $metadata: METADATA }));
    const res = await runDynamoDbQuery(
      act({ actionName: "PutItem", tableName: TABLE, params: { Item: { id: "1", n: 2, flag: true, tags: ["a"], nested: { x: 1 } } } }),
      dataSource()
    );
    expect(sent[0].command).toBeInstanceOf(PutItemCommand);
    expect(sent[0].input).toStrictEqual({
      TableName: TABLE,
      Item: {
        id: { S: "1" },
        n: { N: "2" },
        flag: { BOOL: true },
        tags: { SS: ["a"] },
        nested: { M: { x: { N: "1" } } },
      },
    });
    expect(res).toStrictEqual({});
  });

  test("GetItem wraps the Key and unwraps the response Item back to plain JSON", async () => {
    respondTo(GetItemCommand, () => ({
      Item: { id: { S: "1" }, n: { N: "2" }, tags: { L: [{ S: "a" }] }, nested: { M: { ok: { BOOL: false } } } },
      $metadata: METADATA,
    }));
    const res = await runDynamoDbQuery(act({ actionName: "GetItem", tableName: TABLE, params: { Key: { id: "1" } } }), dataSource());
    expect(sent[0].command).toBeInstanceOf(GetItemCommand);
    expect(sent[0].input).toStrictEqual({ TableName: TABLE, Key: { id: { S: "1" } } });
    expect(res).toStrictEqual({ Item: { id: "1", n: 2, tags: ["a"], nested: { ok: false } } });
  });

  test("a response Key is unwrapped as well", async () => {
    respondTo(DeleteItemCommand, () => ({ Key: { id: { S: "1" } }, $metadata: METADATA }));
    const res = await runDynamoDbQuery(act({ actionName: "DeleteItem", tableName: TABLE, params: { Key: { id: "1" } } }), dataSource());
    expect(sent[0].command).toBeInstanceOf(DeleteItemCommand);
    expect(sent[0].input).toStrictEqual({ TableName: TABLE, Key: { id: { S: "1" } } });
    expect(res).toStrictEqual({ Key: { id: "1" } });
  });

  test.each([
    ["Scan", ScanCommand, { FilterExpression: "id > :n", ExpressionAttributeValues: { ":n": { N: "0" } } }],
    ["Query", QueryCommand, { KeyConditionExpression: "id = :n", ExpressionAttributeValues: { ":n": { N: "1" } } }],
  ])("%s passes typed params through and unwraps every response item", async (actionName, commandClass, params) => {
    respondTo(commandClass, () => ({
      Items: [{ id: { N: "1" }, name: { S: "alice" } }, { id: { N: "2" }, name: { S: "bob" } }],
      Count: 2,
      $metadata: METADATA,
    }));
    const res = await runDynamoDbQuery(act({ actionName, tableName: TABLE, params }), dataSource());
    expect(sent[0].command).toBeInstanceOf(commandClass);
    expect(sent[0].input).toStrictEqual({ TableName: TABLE, ...params });
    expect(res).toStrictEqual({
      Items: [{ id: 1, name: "alice" }, { id: 2, name: "bob" }],
      Count: 2,
    });
  });

  test("UpdateItem wraps the Key only; ExpressionAttributeValues are sent as given", async () => {
    respondTo(UpdateItemCommand, () => ({ $metadata: METADATA }));
    const params = { Key: { id: 1 }, UpdateExpression: "set age = :n", ExpressionAttributeValues: { ":n": { N: "18" } } };
    await runDynamoDbQuery(act({ actionName: "UpdateItem", tableName: TABLE, params }), dataSource());
    expect(sent[0].command).toBeInstanceOf(UpdateItemCommand);
    expect(sent[0].input).toStrictEqual({
      TableName: TABLE,
      Key: { id: { N: "1" } },
      UpdateExpression: "set age = :n",
      ExpressionAttributeValues: { ":n": { N: "18" } },
    });
  });

  test("only one of Key, Item and Items is wrapped, chosen in that order (Key before Item)", async () => {
    respondTo(PutItemCommand, () => ({ $metadata: METADATA }));
    await runDynamoDbQuery(act({ actionName: "PutItem", tableName: TABLE, params: { Key: { id: "1" }, Item: { id: "2" } } }), dataSource());
    expect(sent[0].input).toStrictEqual({ TableName: TABLE, Key: { id: { S: "1" } }, Item: { id: "2" } });
  });

  test("ListTables has no table name, so TableName is an empty string; a response without Key, Item or Items is returned as is minus $metadata", async () => {
    respondTo(ListTablesCommand, () => ({ TableNames: ["a", "b"], LastEvaluatedTableName: "b", $metadata: METADATA }));
    const res = await runDynamoDbQuery(act({ actionName: "ListTables", params: { Limit: 10 } }), dataSource());
    expect(sent[0].command).toBeInstanceOf(ListTablesCommand);
    expect(sent[0].input).toStrictEqual({ TableName: "", Limit: 10 });
    expect(res).toStrictEqual({ TableNames: ["a", "b"], LastEvaluatedTableName: "b" });
  });

  test("CreateTable sends the params unchanged (no Key, Item or Items to wrap)", async () => {
    respondTo(CreateTableCommand, () => ({ TableDescription: { TableName: TABLE }, $metadata: METADATA }));
    const params = {
      TableName: TABLE,
      AttributeDefinitions: [{ AttributeName: "id", AttributeType: "N" }],
      KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
    };
    const res = await runDynamoDbQuery(act({ actionName: "CreateTable", params: { ...params } }), dataSource());
    expect(sent[0].command).toBeInstanceOf(CreateTableCommand);
    expect(sent[0].input).toStrictEqual(params);
    expect(res).toStrictEqual({ TableDescription: { TableName: TABLE } });
  });

  test("$metadata is removed from every response", async () => {
    respondTo(ScanCommand, () => ({ Items: [], $metadata: METADATA }));
    const res = await runDynamoDbQuery(act({ actionName: "Scan", tableName: TABLE, params: {} }), dataSource());
    expect(res).not.toHaveProperty("$metadata");
    expect(res).toStrictEqual({ Items: [] });
  });

  test("an SDK error propagates unchanged", async () => {
    respondTo(GetItemCommand, () => {
      throw new Error("ResourceNotFoundException");
    });
    await expect(
      runDynamoDbQuery(act({ actionName: "GetItem", tableName: TABLE, params: { Key: { id: "1" } } }), dataSource())
    ).rejects.toThrow("ResourceNotFoundException");
  });
});

describe("dynamodb/index.ts", () => {
  const specOf = (data: Record<string, unknown>) => (dynamoDBPlugin.queryConfig as (d: any) => Promise<unknown>)(data);

  test("queryConfig without a spec version is the v1.0 config; v1.0 is the same; an unknown version gives undefined", async () => {
    expect(await specOf({})).toBe(queryConfig);
    expect(await specOf({ specVersion: "" })).toBe(queryConfig);
    expect(await specOf({ specVersion: "v1.0" })).toBe(queryConfig);
    expect(await specOf({ specVersion: "v9" })).toBeUndefined();
  });

  test("run delegates to runDynamoDbQuery with the data source", async () => {
    respondTo(GetItemCommand, () => ({ Item: { id: { S: "1" } }, $metadata: METADATA }));
    const res = await dynamoDBPlugin.run(
      act({ actionName: "GetItem", tableName: TABLE, params: { Key: { id: "1" } } }),
      dataSource(),
      {} as any
    );
    expect(res).toStrictEqual({ Item: { id: "1" } });
    expect(sent[0].region).toBe(REGION);
  });
});
