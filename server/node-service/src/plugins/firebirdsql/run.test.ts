import Firebird from "node-firebird";
import { ServiceError } from "../../common/error";
import getI18nTranslator from "./i18n";
import firebirdsqlPlugin from "./index";
import run, { validateDataSourceConfig } from "./run";

/**
 * firebirdsql plugin. Boundary: `node-firebird` is a module fake with callback-style attach/query/detach
 * (run.ts wraps them with bluebird promisifyAll, which stays real). No Firebird server is needed: the
 * logic under test is option building, named-parameter rewriting and connection handling.
 */
jest.mock("node-firebird", () => ({ attach: jest.fn() }));

const i18n = getI18nTranslator(["en"]);
const CTX = { languages: ["en"] } as any;
const ROWS = [{ id: 1, name: "a" }];

const dataSource = {
  host: "  fb.example.com  ",
  port: 3050,
  database: "  /data/db.fdb ",
  username: " SYSDBA ",
  password: "masterkey",
  role: "  ",
  lowercaseKeys: true,
  blobAsText: false,
};

let queryImpl: (sql: string, params: unknown[], cb: (err: Error | null, rows?: unknown) => void) => void;
let queryCalls: { sql: string; params: unknown[] }[];
let detach: jest.Mock;
let attachError: Error | null;

beforeEach(() => {
  queryCalls = [];
  attachError = null;
  detach = jest.fn((cb?: (err?: Error | null) => void) => cb && cb(null));
  queryImpl = (_sql, _params, cb) => cb(null, ROWS);
  (Firebird.attach as unknown as jest.Mock).mockReset().mockImplementation((_options: unknown, cb: (err: Error | null, db?: unknown) => void) => {
    if (attachError) return cb(attachError);
    cb(null, {
      // node-firebird's query(sql, [params], cb): the params argument is optional
      query: (sql: string, paramsOrDone: unknown, maybeDone?: (err: Error | null, rows?: unknown) => void) => {
        const done = (typeof paramsOrDone === "function" ? paramsOrDone : maybeDone) as (err: Error | null, rows?: unknown) => void;
        const params = typeof paramsOrDone === "function" ? [] : (paramsOrDone as unknown[]);
        queryCalls.push({ sql, params });
        queryImpl(sql, params, done);
      },
      detach,
    });
  });
});

const attachOptions = () => (Firebird.attach as unknown as jest.Mock).mock.calls[0][0];
const act = (sql: string, params: object = {}) => ({ actionName: "Query", sql, params } as any);

describe("connection options", () => {
  test("host, database and username are trimmed; the other fields are passed through with the fixed defaults", async () => {
    await run(act("select 1"), dataSource as any, i18n);
    expect(attachOptions()).toEqual({
      host: "fb.example.com",
      port: 3050,
      database: "/data/db.fdb",
      user: "SYSDBA",
      password: "masterkey",
      lowercase_keys: true,
      role: null,
      pageSize: 4096,
      retryConnectionInterval: 1000,
      blobAsText: false,
      encoding: "UTF8",
    });
  });

  test.each([
    ["whitespace only", "  ", null],
    ["empty", "", null],
    ["padded", " r ", "r"],
    ["non-string", 5, null],
    ["undefined", undefined, null],
  ])("role %s is normalized", async (_name, role, expected) => {
    await run(act("select 1"), { ...dataSource, role } as any, i18n);
    expect(attachOptions().role).toBe(expected);
  });

  test("lowercase_keys and blobAsText are passed through", async () => {
    await run(act("select 1"), { ...dataSource, lowercaseKeys: false, blobAsText: true } as any, i18n);
    expect(attachOptions().lowercase_keys).toBe(false);
    expect(attachOptions().blobAsText).toBe(true);
  });
});

describe("named parameters", () => {
  test("':id', ':obj.n' and ':arr[0]' become '?' with the values in order (lodash path)", async () => {
    const params = { id: 7, obj: { n: "nn" }, arr: ["first", "second"] };
    await run(act("select * from t where id = :id and n = :obj.n and a = :arr[0]", params), dataSource as any, i18n);
    expect(queryCalls).toEqual([{ sql: "select * from t where id = ? and n = ? and a = ?", params: [7, "nn", "first"] }]);
  });

  test("the same name used twice is sent twice, in statement order", async () => {
    await run(act("select :b, :a, :b", { a: 1, b: 2 }), dataSource as any, i18n);
    expect(queryCalls[0]).toEqual({ sql: "select ?, ?, ?", params: [2, 1, 2] });
  });

  test("a statement without placeholders is sent unchanged with no parameters", async () => {
    await run(act("select 1 from rdb$database"), dataSource as any, i18n);
    expect(queryCalls[0]).toEqual({ sql: "select 1 from rdb$database", params: [] });
  });

  test("a missing parameter gives ServiceError 'Named parameter \"x\" not found in Query Parameters object.' and sends no query", async () => {
    const error = await run(act("select * from t where id = :x", {}), dataSource as any, i18n).catch((e) => e);
    expect(error).toBeInstanceOf(ServiceError);
    expect(error.message).toBe('Named parameter "x" not found in Query Parameters object.');
    expect(queryCalls).toEqual([]);
  });
});

describe("results and detach", () => {
  test("the rows of query are returned and detach is called", async () => {
    await expect(run(act("select * from t"), dataSource as any, i18n)).resolves.toBe(ROWS);
    expect(detach).toHaveBeenCalledTimes(1);
  });

  test("a non-Query action resolves to undefined and does not attach", async () => {
    await expect(run({ actionName: "Other" } as any, dataSource as any, i18n)).resolves.toBeUndefined();
    expect(Firebird.attach).not.toHaveBeenCalled();
  });

  test("an attach error is re-thrown (same message; bluebird may wrap the object)", async () => {
    attachError = new Error("connection refused");
    await expect(run(act("select 1"), dataSource as any, i18n)).rejects.toMatchObject({ message: attachError!.message });
  });
});

describe("validateDataSourceConfig", () => {
  test("runs SELECT 1 FROM RDB$DATABASE; and returns {success: true}", async () => {
    await expect(validateDataSourceConfig(dataSource as any)).resolves.toEqual({ success: true });
    expect(queryCalls).toEqual([{ sql: "SELECT 1 FROM RDB$DATABASE;", params: [] }]);
    expect(attachOptions().host).toBe("fb.example.com");
  });

  test("an attach error is re-thrown", async () => {
    attachError = new Error("bad password");
    await expect(validateDataSourceConfig(dataSource as any)).rejects.toMatchObject({ message: attachError!.message });
  });

  test("a query error is re-thrown", async () => {
    const failure = new Error("table unknown");
    queryImpl = (_s, _p, cb) => cb(failure);
    await expect(validateDataSourceConfig(dataSource as any)).rejects.toMatchObject({ message: failure.message });
  });
});

describe("plugin factory (index.ts)", () => {
  test("localizes name and description and exposes id, category and the localized configs", () => {
    const plugin = firebirdsqlPlugin(CTX);
    expect(plugin.id).toBe("firebird");
    expect(plugin.name).toBe("FirebirdSQL");
    expect(plugin.description).toBe("Support for FirebirdSQL database");
    expect(plugin.category).toBe("database");
    expect((plugin.queryConfig as any).label).toBe("Actions");
  });

  test("validateDataSourceConfig delegates to the run module", async () => {
    await expect(firebirdsqlPlugin(CTX).validateDataSourceConfig!(dataSource as any, CTX)).resolves.toEqual({ success: true });
  });

  test("run passes the rows through and errors through unchanged", async () => {
    const plugin = firebirdsqlPlugin(CTX);
    await expect(plugin.run(act("select * from t"), dataSource as any, CTX)).resolves.toBe(ROWS);
    const failure = new Error("boom");
    queryImpl = (_s, _p, cb) => cb(failure);
    await expect(plugin.run(act("select * from t"), dataSource as any, CTX)).rejects.toMatchObject({ message: failure.message });
  });
});

describe("B20: detach after a failed query; ':30' in a string literal is not a parameter", () => {
  // SUSPECTED BUG B20 (firebirdsql/run.ts:71-78, :44). Each test asserts the CORRECT behaviour.
  test.failing("B20: detach after a failed query", async () => {
    queryImpl = (_s, _p, cb) => cb(new Error("syntax error"));
    await run(act("select * from t"), dataSource as any, i18n).catch(() => undefined);
    expect(detach).toHaveBeenCalledTimes(1);
  });

  test.failing("B20: ':30' in a string literal is not a parameter", async () => {
    await run(act("select * from t where at = '10:30'", {}), dataSource as any, i18n);
    expect(queryCalls).toEqual([{ sql: "select * from t where at = '10:30'", params: [] }]);
  });
});
