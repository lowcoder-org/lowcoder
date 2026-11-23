import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { DuckDBConnection, DuckDBInstance } from "@duckdb/node-api";
import { ServiceError } from "../../common/error";
import duckdbPlugin from "./index";

/**
 * duckdb plugin against the real engine (in-memory). Only one test fakes anything: the connect-failure
 * test replaces DuckDBInstance.prototype.connect with a rejecting stub. Resources: the plugin opens a
 * DuckDBInstance and a DuckDBConnection on every run. Every instance the plugin creates is captured
 * through a pass-through spy on DuckDBInstance.create and closed in afterEach, so these tests never leave
 * native instances behind even if the plugin fails to close one. The B21 tests
 * observe the PUBLIC closeSync() methods through pass-through spies; afterEach cleanup runs after the
 * assertions, so it is not counted.
 */

const DATA_SOURCE = { databaseFile: ":memory:", options: "{}" };
const CTX = { languages: ["en"] } as any;
const BIGINT_QUERY = "select 1::BIGINT as a, 'x' as b";
const INVALID_SQL = "selec nope";

let opened: DuckDBInstance[];
let instanceClose: jest.SpyInstance;
let connectionClose: jest.SpyInstance;

beforeEach(() => {
  opened = [];
  const realCreate = DuckDBInstance.create.bind(DuckDBInstance);
  jest.spyOn(DuckDBInstance, "create").mockImplementation(async (...args: Parameters<typeof DuckDBInstance.create>) => {
    const instance = await realCreate(...args);
    opened.push(instance);
    return instance;
  });
  instanceClose = jest.spyOn(DuckDBInstance.prototype, "closeSync");
  connectionClose = jest.spyOn(DuckDBConnection.prototype, "closeSync");
});

afterEach(() => {
  // cleanup is not part of what is observed: take the counts out of the way first
  instanceClose.mockClear();
  for (const instance of opened) {
    try {
      DuckDBInstance.prototype.closeSync.call(instance);
    } catch {
      // already closed by the plugin
    }
  }
  jest.restoreAllMocks();
});

const query = (queryString: string, dataSource: Record<string, unknown> = DATA_SOURCE) =>
  duckdbPlugin.run!({ actionName: "Query", queryString } as any, dataSource as any, CTX);
const settle = (p: Promise<unknown>) => p.then(() => undefined, () => undefined);

describe("Query", () => {
  test("a bigint column is serialized as a string and other values pass through", async () => {
    const rows: Record<string, unknown>[] = await query(BIGINT_QUERY);
    expect(rows).toHaveLength(1);
    expect(Object.values(rows[0])).toEqual(["1", "x"]);
  });

  test("every row of a multi-row result is returned", async () => {
    const rows: Record<string, unknown>[] = await query("select * from range(3)");
    expect(rows.map((r) => Object.values(r))).toEqual([["0"], ["1"], ["2"]]);
  });

  test("invalid SQL gives a ServiceError carrying DuckDB's message", async () => {
    const error = await query(INVALID_SQL).catch((e) => e);
    expect(error).toBeInstanceOf(ServiceError);
    expect(error.message).toMatch(/syntax error/i);
  });

  test("the connection is closed once after a successful Query", async () => {
    await query("select 1 as a");
    expect(connectionClose).toHaveBeenCalledTimes(1);
  });

  test("the connection is closed once after a failing Query", async () => {
    await settle(query(INVALID_SQL));
    expect(connectionClose).toHaveBeenCalledTimes(1);
  });

  test("options that are not JSON give a SyntaxError and open nothing", async () => {
    await expect(query("select 1", { databaseFile: ":memory:", options: "{not json" })).rejects.toBeInstanceOf(SyntaxError);
    expect(opened).toHaveLength(0);
  });

  test("the options are passed to DuckDB (an invalid option name is rejected by the engine)", async () => {
    await expect(query("select 1", { databaseFile: ":memory:", options: JSON.stringify({ no_such_option: "1" }) })).rejects.toThrow(
      /no_such_option/
    );
  });

  test("a non-Query action resolves to undefined", async () => {
    await expect(duckdbPlugin.run!({ actionName: "Other" } as any, DATA_SOURCE as any, CTX)).resolves.toBeUndefined();
  });
});

describe("B26: duckdb rows keep their column names", () => {
  test("B26: duckdb rows keep their column names", async () => {
    await expect(query(BIGINT_QUERY)).resolves.toEqual([{ a: "1", b: "x" }]);
  });

  test("duplicate column names are kept apart", async () => {
    await expect(query("select 1 as a, 2 as a")).resolves.toEqual([{ a: 1, "a:1": 2 }]);
  });

  test("a multi-row bigint column keeps its name", async () => {
    await expect(query("select * from range(3)")).resolves.toEqual([{ range: "0" }, { range: "1" }, { range: "2" }]);
  });

  test("a HUGEINT keeps its name and its full value as a string", async () => {
    await expect(query("select 170141183460469231731687303715884105727::HUGEINT as h")).resolves.toEqual([
      { h: "170141183460469231731687303715884105727" },
    ]);
  });

  test("an empty result is []", async () => {
    await expect(query("select 1 as a where false")).resolves.toEqual([]);
  });
});

describe("B21: the instance is closed after every run", () => {
  test("B21: the instance is closed after every run (successful Query)", async () => {
    await settle(query("select 1 as a"));
    expect(instanceClose).toHaveBeenCalledTimes(1);
  });

  test("B21: the instance is closed after every run (failing Query)", async () => {
    await settle(query(INVALID_SQL));
    expect(instanceClose).toHaveBeenCalledTimes(1);
  });

  test("B21: the instance is closed after every run (non-Query action)", async () => {
    await settle(duckdbPlugin.run!({ actionName: "Other" } as any, DATA_SOURCE as any, CTX) as Promise<unknown>);
    expect(instanceClose).toHaveBeenCalledTimes(1);
  });

  test("B21: a non-Query action closes its connection", async () => {
    await settle(duckdbPlugin.run!({ actionName: "Other" } as any, DATA_SOURCE as any, CTX) as Promise<unknown>);
    expect(connectionClose).toHaveBeenCalledTimes(1);
  });

  test("the instance is closed when connect() fails", async () => {
    jest.spyOn(DuckDBInstance.prototype, "connect").mockRejectedValueOnce(new Error("connect failed"));
    await expect(query("select 1 as a")).rejects.toMatchObject({ message: "connect failed" });
    expect(instanceClose).toHaveBeenCalledTimes(1);
    expect(connectionClose).toHaveBeenCalledTimes(0);
  });

  test("the connection is closed before the instance", async () => {
    await query("select 1 as a");
    expect(connectionClose.mock.invocationCallOrder[0]).toBeLessThan(instanceClose.mock.invocationCallOrder[0]);
  });

  test("rows written by one run are read by the next (closing loses no data)", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "duckdb-"));
    try {
      const fileSource = { databaseFile: path.join(dir, "data.duckdb"), options: "{}" };
      await query("create table t as select 1 as x", fileSource);
      const rows: Record<string, unknown>[] = await query("select x from t", fileSource);
      expect(rows.map((r) => Object.values(r))).toEqual([[1]]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
