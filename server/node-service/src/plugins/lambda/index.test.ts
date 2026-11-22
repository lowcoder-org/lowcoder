import { InvokeCommand, LambdaClient, ListFunctionsCommand } from "@aws-sdk/client-lambda";
import lambdaPlugin from "./index";

/**
 * lambda plugin: the SDK boundary is LambdaClient.prototype.send. The fake records every command input
 * and the credentials/region the client resolved, and answers per command class.
 */

const ACCESS_KEY = "AKIATESTKEY";
const SECRET_KEY = "test-secret-key";
const REGION = "ap-south-1";
const FUNCTION_NAME = "my-function";
const MARKER = "page-2";
const NEXT_MARKER = "page-3";
const LIMIT = 25;
const HTTP_ACCEPTED = 202;
const HTTP_NO_CONTENT = 204;
const INVOCATION_REQUEST_RESPONSE = "RequestResponse";
const INVOCATION_EVENT = "Event";
const INVOCATION_DRY_RUN = "DryRun";
const EMPTY_PAYLOAD_BYTES = "{}";

const dataSource = { accessKey: ACCESS_KEY, secretKey: SECRET_KEY, region: REGION };
type RunArgs = Parameters<typeof lambdaPlugin.run>;
const act = (a: Record<string, unknown>) => a as unknown as RunArgs[0];
const run = (a: Record<string, unknown>) => lambdaPlugin.run(act(a), dataSource, {} as RunArgs[2]);
const textBytes = (text: string) => Uint8Array.from(Buffer.from(text, "utf8"));
const hex = (bytes: Uint8Array) => Buffer.from(bytes).toString("hex");

type Sent = { command: object; input: any; accessKeyId?: string; secretAccessKey?: string; region?: string };
type Responder = (command: any) => any;
let sent: Sent[];
let responders: Map<Function, Responder>;
let sendSpy: jest.SpyInstance;
let warnSpy: jest.SpyInstance;

const respondTo = (commandClass: Function, responder: Responder) => responders.set(commandClass, responder);

beforeEach(() => {
  sent = [];
  responders = new Map();
  warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
  sendSpy = jest.spyOn(LambdaClient.prototype, "send").mockImplementation(async function (this: LambdaClient, command: any) {
    const credentials = await this.config.credentials();
    const region = await this.config.region();
    sent.push({
      command,
      input: command.input,
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      region,
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
  warnSpy.mockRestore();
});

describe("validateDataSourceConfig", () => {
  const validate = () => lambdaPlugin.validateDataSourceConfig!(dataSource as any, {} as RunArgs[2]);

  test("sends ListFunctions with MaxItems 1 through a client built from the data source; Functions as an array is success", async () => {
    respondTo(ListFunctionsCommand, () => ({ Functions: [] }));
    expect(await validate()).toStrictEqual({ success: true });
    expect(sent).toHaveLength(1);
    expect(sent[0].input).toStrictEqual({ MaxItems: 1 });
    expect(sent[0].accessKeyId).toBe(ACCESS_KEY);
    expect(sent[0].secretAccessKey).toBe(SECRET_KEY);
    expect(sent[0].region).toBe(REGION);
  });

  test("a response without Functions is not success", async () => {
    respondTo(ListFunctionsCommand, () => ({}));
    expect(await validate()).toStrictEqual({ success: false });
  });

  test("an SDK error propagates", async () => {
    respondTo(ListFunctionsCommand, () => {
      throw new Error("AccessDenied");
    });
    await expect(validate()).rejects.toThrow("AccessDenied");
  });
});

describe("ListFunctions", () => {
  test("sends Marker and MaxItems and maps the function names and the next marker", async () => {
    respondTo(ListFunctionsCommand, () => ({ Functions: [{ FunctionName: "a" }, { FunctionName: "b" }], NextMarker: NEXT_MARKER }));
    const res = await run({ actionName: "ListFunctions", marker: MARKER, limit: LIMIT });
    expect(res).toStrictEqual({ functions: ["a", "b"], nextMarker: NEXT_MARKER });
    expect(sent[0].input).toStrictEqual({ Marker: MARKER, MaxItems: LIMIT });
    expect(sent[0].accessKeyId).toBe(ACCESS_KEY);
    expect(sent[0].secretAccessKey).toBe(SECRET_KEY);
    expect(sent[0].region).toBe(REGION);
  });

  test("an empty marker is sent as undefined", async () => {
    respondTo(ListFunctionsCommand, () => ({ Functions: [] }));
    await run({ actionName: "ListFunctions", marker: "", limit: LIMIT });
    expect(sent[0].input.Marker).toBeUndefined();
    expect(sent[0].input.MaxItems).toBe(LIMIT);
  });

  test("a response without Functions gives an empty list, and without NextMarker an empty string", async () => {
    respondTo(ListFunctionsCommand, () => ({}));
    expect(await run({ actionName: "ListFunctions", marker: "", limit: LIMIT })).toStrictEqual({ functions: [], nextMarker: "" });
  });
});

describe("InvokeFunction", () => {
  const invoke = (extra: Record<string, unknown>) => run({ actionName: "InvokeFunction", functionName: FUNCTION_NAME, ...extra });

  test("RequestResponse sends the function name, type and payload bytes, and returns the parsed JSON payload", async () => {
    respondTo(InvokeCommand, () => ({ StatusCode: 200, Payload: textBytes(JSON.stringify({ ok: true, n: 1 })) }));
    const res = await invoke({ invocationType: INVOCATION_REQUEST_RESPONSE, payload: { a: 1 } });
    expect(res).toStrictEqual({ ok: true, n: 1 });
    expect(sent).toHaveLength(1);
    expect(sent[0].input.FunctionName).toBe(FUNCTION_NAME);
    expect(sent[0].input.InvocationType).toBe(INVOCATION_REQUEST_RESPONSE);
    expect(Buffer.from(sent[0].input.Payload).toString("utf8")).toBe('{"a":1}');
    expect(sent[0].accessKeyId).toBe(ACCESS_KEY);
    expect(sent[0].secretAccessKey).toBe(SECRET_KEY);
    expect(sent[0].region).toBe(REGION);
  });

  test("RequestResponse without a Payload in the response gives an empty object", async () => {
    respondTo(InvokeCommand, () => ({ StatusCode: 200 }));
    expect(await invoke({ invocationType: INVOCATION_REQUEST_RESPONSE, payload: {} })).toStrictEqual({});
  });

  test("RequestResponse with a payload that is not JSON gives an empty object", async () => {
    respondTo(InvokeCommand, () => ({ StatusCode: 200, Payload: textBytes("not json {") }));
    expect(await invoke({ invocationType: INVOCATION_REQUEST_RESPONSE, payload: {} })).toStrictEqual({});
    expect(warnSpy).toHaveBeenCalledWith("can not json parse:", "not json {");
  });

  test.each([
    [INVOCATION_EVENT, HTTP_ACCEPTED],
    [INVOCATION_DRY_RUN, HTTP_NO_CONTENT],
  ])("%s returns only the status code and does not read the payload", async (invocationType, statusCode) => {
    respondTo(InvokeCommand, () => ({ StatusCode: statusCode, Payload: textBytes('{"ignored":true}') }));
    expect(await invoke({ invocationType, payload: { a: 1 } })).toStrictEqual({ statusCode });
    expect(sent[0].input.InvocationType).toBe(invocationType);
  });

  test("a missing payload sends the bytes of {}", async () => {
    respondTo(InvokeCommand, () => ({ StatusCode: HTTP_ACCEPTED }));
    await invoke({ invocationType: INVOCATION_EVENT });
    expect(hex(sent[0].input.Payload)).toBe(hex(textBytes(EMPTY_PAYLOAD_BYTES)));
  });

  test("an SDK error propagates", async () => {
    respondTo(InvokeCommand, () => {
      throw new Error("ResourceNotFoundException");
    });
    await expect(invoke({ invocationType: INVOCATION_EVENT, payload: {} })).rejects.toThrow("ResourceNotFoundException");
  });

  test.failing("B15: the payload is sent as UTF-8 bytes", async () => {
    respondTo(InvokeCommand, () => ({ StatusCode: HTTP_ACCEPTED }));
    await invoke({ invocationType: INVOCATION_EVENT, payload: { s: "€" } });
    expect(hex(sent[0].input.Payload)).toBe(hex(textBytes('{"s":"€"}')));
    expect(hex(sent[0].input.Payload)).toContain("e282ac");
  });

  test("Latin-1 characters of the payload are sent as the same code points as single bytes", async () => {
    // Characterisation of the part of the charCodeAt mapping that is correct; the multi-byte case is B15.
    respondTo(InvokeCommand, () => ({ StatusCode: HTTP_ACCEPTED }));
    await invoke({ invocationType: INVOCATION_EVENT, payload: { s: "abc" } });
    expect(hex(sent[0].input.Payload)).toBe(hex(textBytes('{"s":"abc"}')));
  });
});

describe("other actions", () => {
  test("an unknown action returns undefined and sends nothing", async () => {
    expect(await run({ actionName: "Nope" })).toBeUndefined();
    expect(sendSpy).not.toHaveBeenCalled();
  });
});
