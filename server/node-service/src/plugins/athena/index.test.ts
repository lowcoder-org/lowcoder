import {
  AthenaClient,
  GetQueryExecutionCommand,
  GetQueryResultsCommand,
  StartQueryExecutionCommand,
} from "@aws-sdk/client-athena";
import { ServiceError } from "../../common/error";
import athenaPlugin from "./index";

/**
 * athena plugin: the SDK boundary is AthenaClient.prototype.send. The fake records every command input
 * and the credentials/region the client resolved, and answers per command class. Timers are faked only
 * so that the plugin's 2 s poll delay and 60 s timeout run instantly; nextTick and setImmediate stay real.
 */

const ACCESS_KEY = "AKIATESTKEY";
const SECRET_KEY = "test-secret-key";
const REGION = "eu-west-1";
const S3_LOCATION = "s3://results-bucket/prefix/";
const QUERY_STRING = "select * from t";
const QUERY_EXECUTION_ID = "qe-1";
const POLL_DELAY_MS = 2000;
const TIMEOUT_MS = 60_000;
const BUSY_LOOP_CAP = 20;
const RUNNING_FOREVER_CAP = 100;
const UNKNOWN_STATE_ANSWERS = 3;
const STATUS_GATEWAY_TIMEOUT = 504;
const TIMEOUT_POLLS = TIMEOUT_MS / POLL_DELAY_MS;
const FAKE_TIMER_OPTIONS = { doNotFake: ["nextTick", "setImmediate"] as ("nextTick" | "setImmediate")[] };

const dataSource = { accessKey: ACCESS_KEY, secretKey: SECRET_KEY, region: REGION, s3Location: S3_LOCATION };
type RunArgs = Parameters<typeof athenaPlugin.run>;
const queryAction = { actionName: "Query", queryString: QUERY_STRING } as RunArgs[0];
const runQuery = () => athenaPlugin.run(queryAction, dataSource, {} as RunArgs[2]);

type Sent = { command: object; input: any; accessKeyId?: string; secretAccessKey?: string; region?: string };
let sent: Sent[];
let sendSpy: jest.SpyInstance;
/** state answers per GetQueryExecution call; the last entry repeats once the list is exhausted */
let stateAnswers: (string | undefined)[];
let getExecutionCalls: number;
let resultSet: unknown;
let executionCap: number;

const sentOf = (commandClass: Function) => sent.filter((s) => s.command instanceof commandClass);

beforeEach(() => {
  jest.useFakeTimers(FAKE_TIMER_OPTIONS);
  sent = [];
  stateAnswers = ["SUCCEEDED"];
  getExecutionCalls = 0;
  executionCap = BUSY_LOOP_CAP;
  resultSet = { Rows: [{ Data: [{ VarCharValue: "a" }] }, { Data: [{ VarCharValue: "1" }] }] };
  sendSpy = jest.spyOn(AthenaClient.prototype, "send").mockImplementation(async function (this: AthenaClient, command: any) {
    const credentials = await this.config.credentials();
    const region = await this.config.region();
    sent.push({ command, input: command.input, accessKeyId: credentials.accessKeyId, secretAccessKey: credentials.secretAccessKey, region });
    if (command instanceof StartQueryExecutionCommand) {
      return { QueryExecutionId: QUERY_EXECUTION_ID };
    }
    if (command instanceof GetQueryExecutionCommand) {
      getExecutionCalls += 1;
      if (getExecutionCalls >= executionCap) {
        throw new Error("busy-loop guard: too many polls");
      }
      const state = stateAnswers[Math.min(getExecutionCalls - 1, stateAnswers.length - 1)];
      return {
        QueryExecution: {
          Status: state === undefined ? {} : { State: state, StateChangeReason: `reason of ${state}` },
        },
      };
    }
    if (command instanceof GetQueryResultsCommand) {
      return { ResultSet: resultSet };
    }
    throw new Error(`unexpected command ${command.constructor.name}`);
  } as any);
});

afterEach(() => {
  sendSpy.mockRestore();
  jest.useRealTimers();
});

describe("Query", () => {
  test("starts the execution with the query string and the data source's result location, through a client built from the data source", async () => {
    const rows = await runQuery();

    expect(sentOf(StartQueryExecutionCommand)).toHaveLength(1);
    const start = sentOf(StartQueryExecutionCommand)[0];
    expect(start.input).toStrictEqual({
      QueryString: QUERY_STRING,
      ResultConfiguration: { OutputLocation: S3_LOCATION },
    });
    expect(start.accessKeyId).toBe(ACCESS_KEY);
    expect(start.secretAccessKey).toBe(SECRET_KEY);
    expect(start.region).toBe(REGION);
    expect(rows).toStrictEqual([{ a: "1" }]);
  });

  test("polls QUEUED, RUNNING, SUCCEEDED with a 2 s wait after each unfinished state, then fetches the results for the same id", async () => {
    stateAnswers = ["QUEUED", "RUNNING", "SUCCEEDED"];
    const promise = runQuery();

    await jest.advanceTimersByTimeAsync(0);
    expect(getExecutionCalls).toBe(1);
    await jest.advanceTimersByTimeAsync(POLL_DELAY_MS - 1);
    expect(getExecutionCalls).toBe(1);
    await jest.advanceTimersByTimeAsync(1);
    expect(getExecutionCalls).toBe(2);
    await jest.advanceTimersByTimeAsync(POLL_DELAY_MS - 1);
    expect(getExecutionCalls).toBe(2);
    expect(sentOf(GetQueryResultsCommand)).toHaveLength(0);
    await jest.advanceTimersByTimeAsync(1);

    expect(await promise).toStrictEqual([{ a: "1" }]);
    expect(getExecutionCalls).toBe(3);
    for (const call of sentOf(GetQueryExecutionCommand)) {
      expect(call.input).toStrictEqual({ QueryExecutionId: QUERY_EXECUTION_ID });
    }
    expect(sentOf(GetQueryResultsCommand)).toHaveLength(1);
    expect(sentOf(GetQueryResultsCommand)[0].input).toStrictEqual({ QueryExecutionId: QUERY_EXECUTION_ID });
  });

  test.each(["FAILED", "CANCELLED"])("%s rejects with a ServiceError naming the state and the reason, and fetches no results", async (state) => {
    stateAnswers = [state];
    const outcome = runQuery();
    const assertion = expect(outcome).rejects.toBeInstanceOf(ServiceError);
    await jest.advanceTimersByTimeAsync(0);
    await assertion;
    await expect(outcome).rejects.toMatchObject({
      message: `query execution state: ${state}, reason: reason of ${state}`,
      code: 500,
    });
    expect(sentOf(GetQueryResultsCommand)).toHaveLength(0);
  });

  test("a non-Query action returns undefined and sends nothing", async () => {
    const res = await athenaPlugin.run({ actionName: "Other" } as unknown as RunArgs[0], dataSource, {} as RunArgs[2]);
    expect(res).toBeUndefined();
    expect(sendSpy).not.toHaveBeenCalled();
  });
});

describe("parseResultSet (through Query)", () => {
  test("the header row gives the column names and later rows become objects", async () => {
    resultSet = {
      Rows: [
        { Data: [{ VarCharValue: "id" }, { VarCharValue: "name" }] },
        { Data: [{ VarCharValue: "1" }, { VarCharValue: "alice" }] },
        { Data: [{ VarCharValue: "2" }, { VarCharValue: "bob" }] },
      ],
    };
    expect(await runQuery()).toStrictEqual([
      { id: "1", name: "alice" },
      { id: "2", name: "bob" },
    ]);
  });

  test("a missing or empty column name becomes _col_<index>, and a missing VarCharValue becomes an empty string", async () => {
    resultSet = {
      Rows: [
        { Data: [{ VarCharValue: "id" }, {}, { VarCharValue: "" }] },
        { Data: [{}, { VarCharValue: "x" }, { VarCharValue: "y" }] },
      ],
    };
    expect(await runQuery()).toStrictEqual([{ id: "", _col_1: "x", _col_2: "y" }]);
  });

  test("a header without Data gives _col_ names for every value; a data row without Data gives an empty object", async () => {
    resultSet = {
      Rows: [{}, { Data: [{ VarCharValue: "v0" }, { VarCharValue: "v1" }] }, {}],
    };
    expect(await runQuery()).toStrictEqual([{ _col_0: "v0", _col_1: "v1" }, {}]);
  });

  test("an undefined ResultSet gives an empty array", async () => {
    resultSet = undefined;
    expect(await runQuery()).toEqual([]);
  });

  test("a header-only result gives an empty array", async () => {
    resultSet = { Rows: [{ Data: [{ VarCharValue: "id" }] }] };
    expect(await runQuery()).toEqual([]);
  });
});

describe("B14", () => {
  test("B14: Rows [] gives []", async () => {
    resultSet = { Rows: [] };
    expect(await runQuery()).toEqual([]);
  });

  test("a ResultSet without Rows gives []", async () => {
    resultSet = {};
    expect(await runQuery()).toEqual([]);
  });

  test("B14: RUNNING after 60 s rejects with a timeout", async () => {
    stateAnswers = ["RUNNING"];
    executionCap = RUNNING_FOREVER_CAP;
    const outcome = runQuery().then(
      (value) => ({ resolved: value }),
      (error) => ({ rejected: error })
    );
    await jest.advanceTimersByTimeAsync(TIMEOUT_MS + POLL_DELAY_MS);
    const result: any = await outcome;
    expect(result.rejected).toBeInstanceOf(Error);
    expect(String(result.rejected.message)).toMatch(/time/i);
    expect(sentOf(GetQueryResultsCommand)).toHaveLength(0);
  });

  test("B14: an unknown state is not re-polled without the 2 s wait", async () => {
    // GetQueryExecution answers a state outside the plugin's switch (no Status) 3 times, then SUCCEEDED, so
    // the loop ends either way; the 20th call throws, so a loop that never ends fails fast.
    stateAnswers = [...Array(UNKNOWN_STATE_ANSWERS).fill(undefined), "SUCCEEDED"];
    const promise = runQuery();
    await jest.advanceTimersByTimeAsync(0); // flushes microtasks only; no fake time passes
    const callsBeforeAnyWait = getExecutionCalls;
    await jest.advanceTimersByTimeAsync((UNKNOWN_STATE_ANSWERS + 1) * POLL_DELAY_MS);
    await promise;
    expect(callsBeforeAnyWait).toBe(1);
  });

  const settle = (promise: Promise<unknown>) =>
    promise.then(
      (value) => ({ resolved: value }),
      (error) => ({ rejected: error })
    );

  test("the timeout is a 504 ServiceError naming the last state, after exactly 30 polls", async () => {
    stateAnswers = ["RUNNING"];
    executionCap = RUNNING_FOREVER_CAP;
    const outcome = settle(runQuery());
    await jest.advanceTimersByTimeAsync(TIMEOUT_MS + POLL_DELAY_MS);
    const result: any = await outcome;
    expect(result.rejected).toBeInstanceOf(ServiceError);
    expect(result.rejected).toMatchObject({
      code: STATUS_GATEWAY_TIMEOUT,
      message: "query execution timed out after 60 s, last state: RUNNING",
    });
    expect(getExecutionCalls).toBe(TIMEOUT_POLLS);
    expect(sentOf(GetQueryResultsCommand)).toHaveLength(0);
  });

  test("a state that is never known times out with last state UNKNOWN", async () => {
    stateAnswers = [undefined];
    executionCap = RUNNING_FOREVER_CAP;
    const outcome = settle(runQuery());
    await jest.advanceTimersByTimeAsync(TIMEOUT_MS + POLL_DELAY_MS);
    const result: any = await outcome;
    expect(result.rejected).toBeInstanceOf(ServiceError);
    expect(result.rejected.code).toBe(STATUS_GATEWAY_TIMEOUT);
    expect(String(result.rejected.message)).toMatch(/last state: UNKNOWN$/);
    expect(getExecutionCalls).toBe(TIMEOUT_POLLS);
    expect(sentOf(GetQueryResultsCommand)).toHaveLength(0);
  });

  test("SUCCEEDED on the last poll before the deadline still returns the rows", async () => {
    stateAnswers = [...Array(TIMEOUT_POLLS - 1).fill("RUNNING"), "SUCCEEDED"];
    executionCap = RUNNING_FOREVER_CAP;
    const outcome = settle(runQuery());
    await jest.advanceTimersByTimeAsync(TIMEOUT_MS);
    const result: any = await outcome;
    expect(result).toStrictEqual({ resolved: [{ a: "1" }] });
    expect(getExecutionCalls).toBe(TIMEOUT_POLLS);
    expect(sentOf(GetQueryResultsCommand)).toHaveLength(1);
  });

  test("an unknown state followed by FAILED still rejects with the FAILED error", async () => {
    stateAnswers = [undefined, "FAILED"];
    const outcome = settle(runQuery());
    await jest.advanceTimersByTimeAsync(POLL_DELAY_MS);
    const result: any = await outcome;
    expect(result.rejected).toMatchObject({
      message: "query execution state: FAILED, reason: reason of FAILED",
      code: 500,
    });
    expect(sentOf(GetQueryResultsCommand)).toHaveLength(0);
  });
});
