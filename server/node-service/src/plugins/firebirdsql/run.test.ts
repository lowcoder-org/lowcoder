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

// bluebird's promisifyAll refuses an object that already has a plain method with the "Async" suffix
const mockUnpromisifiableDb = () =>
  (Firebird.attach as unknown as jest.Mock).mockImplementationOnce((_o: unknown, cb: (err: Error | null, db?: unknown) => void) =>
    cb(null, { query: jest.fn(), queryAsync: () => undefined, detach })
  );

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

  test("a missing parameter does not attach", async () => {
    await run(act("select * from t where id = :x", {}), dataSource as any, i18n).catch(() => undefined);
    expect(Firebird.attach).not.toHaveBeenCalled();
  });

  test.each([
    [
      "a ':x' inside a literal with an escaped quote stays literal",
      "select * from t where s = 'it''s :x' and id = :id",
      { id: 1 },
      "select * from t where s = 'it''s :x' and id = ?",
      [1],
    ],
    [
      "a ':x' inside a double-quoted identifier stays literal",
      'select "a:b" from t where id = :id',
      { id: 1 },
      'select "a:b" from t where id = ?',
      [1],
    ],
    [
      "a ':x' inside a quoted identifier with an escaped double quote stays literal",
      'select "a"":x" from t where id = :id',
      { id: 1 },
      'select "a"":x" from t where id = ?',
      [1],
    ],
    ["an unterminated quoted identifier is sent unchanged with no parameters", 'select "a:x', {}, 'select "a:x', []],
    [
      "a ':x' in a line comment is ignored and the next line is scanned",
      "select 1 -- :nope\nfrom t where id = :id",
      { id: 1 },
      "select 1 -- :nope\nfrom t where id = ?",
      [1],
    ],
    ["a line comment at the end of the statement is copied to the end", "select :id -- :nope", { id: 1 }, "select ? -- :nope", [1]],
    ["a ':x' in a block comment is ignored", "select /* :nope */ :id", { id: 1 }, "select /* :nope */ ?", [1]],
    ["an unterminated block comment is sent unchanged with no parameters", "select :id /* :nope", { id: 1 }, "select ? /* :nope", [1]],
    ["an unterminated literal is sent unchanged with no parameters", "select ':x", {}, "select ':x", []],
    ["a ':' not followed by a name character is copied", "select a from t where b = : c", {}, "select a from t where b = : c", []],
  ])("%s", async (_name, sql, params, expectedSql, expectedParams) => {
    await run(act(sql as string, params as object), dataSource as any, i18n);
    expect(queryCalls).toEqual([{ sql: expectedSql, params: expectedParams }]);
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

  test("B20: detach after a failed query", async () => {
    queryImpl = (_s, _p, cb) => cb(new Error("syntax error"));
    await run(act("select * from t"), dataSource as any, i18n).catch(() => undefined);
    expect(detach).toHaveBeenCalledTimes(1);
  });

  test("run awaits detach before it resolves", async () => {
    let detached = false;
    detach.mockImplementation((cb: (err?: Error | null) => void) =>
      setImmediate(() => {
        detached = true;
        cb(null);
      })
    );
    await run(act("select 1"), dataSource as any, i18n);
    expect(detached).toBe(true);
  });

  test("a detach error after a successful query is logged and the rows are returned", async () => {
    const errorSpy = jest.spyOn(logger, "error").mockImplementation(() => undefined);
    detach.mockImplementation((cb: (err?: Error | null) => void) => cb(new Error("detach failed")));
    await expect(run(act("select * from t"), dataSource as any, i18n)).resolves.toBe(ROWS);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("detach failed"));
    errorSpy.mockRestore();
  });

  test("a query error wins over a detach error", async () => {
    const errorSpy = jest.spyOn(logger, "error").mockImplementation(() => undefined);
    queryImpl = (_s, _p, cb) => cb(new Error("syntax error"));
    detach.mockImplementation((cb: (err?: Error | null) => void) => cb(new Error("detach failed")));
    await expect(run(act("select * from t"), dataSource as any, i18n)).rejects.toMatchObject({ message: "syntax error" });
    errorSpy.mockRestore();
  });

  test("run detaches when promisifyAll fails after the attach", async () => {
    mockUnpromisifiableDb();
    await expect(run(act("select 1"), dataSource as any, i18n)).rejects.toBeInstanceOf(TypeError);
    expect(detach).toHaveBeenCalledTimes(1);
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

  test("validate detaches after a failed query", async () => {
    const failure = new Error("table unknown");
    queryImpl = (_s, _p, cb) => cb(failure);
    await expect(validateDataSourceConfig(dataSource as any)).rejects.toMatchObject({ message: failure.message });
    expect(detach).toHaveBeenCalledTimes(1);
  });

  test("validate detaches when promisifyAll fails after the attach", async () => {
    mockUnpromisifiableDb();
    await expect(validateDataSourceConfig(dataSource as any)).rejects.toBeInstanceOf(TypeError);
    expect(detach).toHaveBeenCalledTimes(1);
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

describe("B20: ':30' in a string literal is not a parameter", () => {
  test("B20: ':30' in a string literal is not a parameter", async () => {
    await run(act("select * from t where at = '10:30'", {}), dataSource as any, i18n);
    expect(queryCalls).toEqual([{ sql: "select * from t where at = '10:30'", params: [] }]);
  });
});
