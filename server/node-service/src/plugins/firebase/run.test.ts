import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { getFirestore } from "firebase-admin/firestore";
import firebasePlugin from "./index";
import firebaseQueryConfig from "./queryConfig";
import { runFirebasePlugin } from "./run";

/**
 * firebase plugin (replaces the skipped live-service test).
 *
 * Boundary: the three firebase-admin entry points are module fakes (no emulator is available). The
 * Firestore fake is ONE chainable recording `Query`: every call is appended to `calls` as
 * [method, ...args] and the fake does not implement any Firestore semantics. Assertions are on that
 * recorded sequence, i.e. on the exact calls the plugin's structured-query translator makes.
 */
jest.mock("firebase-admin/app", () => ({
  getApps: jest.fn(),
  initializeApp: jest.fn(),
  deleteApp: jest.fn(),
  cert: jest.fn(),
}));
jest.mock("firebase-admin/database", () => ({ getDatabase: jest.fn() }));
jest.mock("firebase-admin/firestore", () => ({ getFirestore: jest.fn() }));

const STATUS_BAD_REQUEST = 400;
const PROJECT_ID = "demo-project";
const DATABASE_URL = "https://demo-default-rtdb.firebaseio.com";
const SERVICE_ACCOUNT = { project_id: PROJECT_ID, client_email: "svc@demo.iam", private_key: "KEY" };
const PRIVATE_KEY_JSON = JSON.stringify(SERVICE_ACCOUNT);
const COLLECTION = "users";
const DOC_ID = "u1";
const DB_REF = "/hello";
const DEFAULT_PAGE_SIZE = 10;
const COUNT_TOTAL = 42;
const GENERATED_APP = { name: PROJECT_ID, generated: true };
const CERT_MARKER = { certOf: "service-account" };
const STRING_INTEGER_VALUE = { integerValue: "5" };
const BIG_INTEGER_STRING = "9007199254740993"; // 2^53 + 1, not representable as a number

type Call = unknown[];
type Snapshot = { empty: boolean; docs: { data: () => unknown; id?: string }[] };

let calls: Call[];
let getSnapshots: Snapshot[];
let countValue: number;
let consoleError: jest.SpyInstance;

const doc = (data: unknown, id = "d"): Snapshot["docs"][number] => ({ data: () => data, id });
const snapshotOf = (...datas: unknown[]): Snapshot => ({ empty: datas.length === 0, docs: datas.map((d) => doc(d)) });

class FakeQuery {
  protected record(name: string, ...args: unknown[]) {
    calls.push([name, ...args]);
    return this;
  }
  where(...a: unknown[]) { return this.record("where", ...a); }
  orderBy(...a: unknown[]) { return this.record("orderBy", ...a); }
  limit(...a: unknown[]) { return this.record("limit", ...a); }
  startAfter(...a: unknown[]) { return this.record("startAfter", ...a); }
  startAt(...a: unknown[]) { return this.record("startAt", ...a); }
  endAt(...a: unknown[]) { return this.record("endAt", ...a); }
  select(...a: unknown[]) { return this.record("select", ...a); }
  count() {
    calls.push(["count"]);
    return {
      get: async () => {
        calls.push(["count.get"]);
        return { data: () => ({ count: countValue }) };
      },
    };
  }
  async get() {
    calls.push(["get"]);
    const next = getSnapshots.shift();
    if (!next) throw new Error("fake: no snapshot queued for get()");
    return next;
  }
}

let docSetRejection: Error | undefined;

class FakeDocRef {
  constructor(readonly id: string, private readonly rejectWith?: Error) {}
  async get() {
    calls.push(["doc.get", this.id]);
    return { data: () => ({ fetched: this.id }) };
  }
  async set(data: unknown) {
    calls.push(["doc.set", this.id, data]);
    if (this.rejectWith) throw this.rejectWith;
  }
  async update(data: unknown) {
    calls.push(["doc.update", this.id, data]);
  }
  async delete() {
    calls.push(["doc.delete", this.id]);
  }
  async listCollections() {
    calls.push(["doc.listCollections", this.id]);
    return [{ id: "sub1" }, { id: "sub2" }];
  }
}

class FakeCollection extends FakeQuery {
  doc(id: string) {
    calls.push(["collection.doc", id]);
    return new FakeDocRef(id, docSetRejection);
  }
  async add(data: unknown) {
    calls.push(["collection.add", data]);
    return { id: "generated" };
  }
}

const fakeFirestore = {
  collection: (name: string) => {
    calls.push(["collection", name]);
    return new FakeCollection();
  },
  doc: (path: string) => {
    calls.push(["firestore.doc", path]);
    return new FakeDocRef(path);
  },
  listCollections: async () => {
    calls.push(["firestore.listCollections"]);
    return [{ id: "users" }, { id: "orders" }];
  },
};

let rtdbValue: unknown;
const fakeDatabase = {
  ref: (path: string) => {
    calls.push(["rtdb.ref", path]);
    return {
      once: async (event: string) => {
        calls.push(["rtdb.once", event]);
        return { val: () => rtdbValue };
      },
      set: async (data: unknown) => void calls.push(["rtdb.set", data]),
      update: async (data: unknown) => void calls.push(["rtdb.update", data]),
      push: async (data: unknown) => void calls.push(["rtdb.push", data]),
    };
  },
};

const dataSource = { databaseUrl: DATABASE_URL, firestoreId: PROJECT_ID, privateKey: PRIVATE_KEY_JSON, specVersion: "" };
const run = (action: Record<string, unknown>, ds: Record<string, unknown> = dataSource) =>
  runFirebasePlugin(action as any, ds as any);
const queryAction = (query: Record<string, unknown>) => ({ actionName: "FS.QueryFireStore", collection: COLLECTION, query });
const callsNamed = (name: string) => calls.filter((c) => c[0] === name);
/** The calls made on the collection query (everything except the initial `collection` lookup). */
const queryCalls = () => calls.filter((c) => c[0] !== "collection");

beforeEach(() => {
  calls = [];
  getSnapshots = [];
  countValue = COUNT_TOTAL;
  rtdbValue = undefined;
  docSetRejection = undefined;
  (getApps as jest.Mock).mockReset().mockReturnValue([]);
  (initializeApp as jest.Mock).mockReset().mockReturnValue(GENERATED_APP);
  (cert as jest.Mock).mockReset().mockReturnValue(CERT_MARKER);
  (getFirestore as jest.Mock).mockReset().mockReturnValue(fakeFirestore);
  (getDatabase as jest.Mock).mockReset().mockReturnValue(fakeDatabase);
  consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  consoleError.mockRestore();
});

describe("app initialisation", () => {
  test("a privateKey that is not JSON gives a SyntaxError and touches no SDK", async () => {
    await expect(run({ actionName: "RTDB.QueryDatabase", databaseRef: DB_REF }, { ...dataSource, privateKey: "not json" })).rejects.toBeInstanceOf(
      SyntaxError
    );
    expect(initializeApp).not.toHaveBeenCalled();
    expect(getApps).not.toHaveBeenCalled();
  });

  test("a new app is initialised with cert(serviceAccount), databaseURL, projectId and the app name", async () => {
    rtdbValue = 1;
    await run({ actionName: "RTDB.QueryDatabase", databaseRef: DB_REF });
    expect(cert).toHaveBeenCalledWith(SERVICE_ACCOUNT);
    expect(initializeApp).toHaveBeenCalledTimes(1);
    expect(initializeApp).toHaveBeenCalledWith(
      { credential: CERT_MARKER, databaseURL: DATABASE_URL, projectId: PROJECT_ID },
      PROJECT_ID
    );
    expect(getDatabase).toHaveBeenCalledWith(GENERATED_APP);
  });

  test("an existing app named firestoreId is reused and initializeApp is not called", async () => {
    const existing = { name: PROJECT_ID, existing: true };
    (getApps as jest.Mock).mockReturnValue([{ name: "other" }, existing]);
    await run({ actionName: "RTDB.QueryDatabase", databaseRef: DB_REF });
    expect(initializeApp).not.toHaveBeenCalled();
    expect(cert).not.toHaveBeenCalled();
    expect(getDatabase).toHaveBeenCalledWith(existing);
  });

  test("an unknown action name resolves to undefined; the app is still resolved (before dispatch) but no database or Firestore call is made", async () => {
    await expect(run({ actionName: "FS.Nope" })).resolves.toBeUndefined();
    // getApps/initializeApp run before the action is dispatched (run.ts getOrInitializeApp), so they ARE called.
    expect(getApps).toHaveBeenCalledTimes(1);
    expect(initializeApp).toHaveBeenCalledTimes(1);
    // nothing after dispatch: no database/Firestore handle was requested and nothing was recorded
    expect(getDatabase).not.toHaveBeenCalled();
    expect(getFirestore).not.toHaveBeenCalled();
    expect(calls).toEqual([]);
  });
});

describe("realtime database", () => {
  test("RTDB.QueryDatabase returns once('value').val()", async () => {
    rtdbValue = { greeting: "hi" };
    await expect(run({ actionName: "RTDB.QueryDatabase", databaseRef: DB_REF })).resolves.toEqual({ greeting: "hi" });
    expect(calls).toEqual([["rtdb.ref", DB_REF], ["rtdb.once", "value"]]);
  });

  test.each([
    ["RTDB.SetData", "rtdb.set"],
    ["RTDB.UpdateData", "rtdb.update"],
    ["RTDB.AppendDataToList", "rtdb.push"],
  ])("%s calls %s with data and returns {success: true}", async (actionName, sdkCall) => {
    const data = { a: 1, nested: { b: [2] } };
    await expect(run({ actionName, databaseRef: DB_REF, data })).resolves.toEqual({ success: true });
    expect(calls).toEqual([["rtdb.ref", DB_REF], [sdkCall, data]]);
  });

  test("a Firestore-shaped action under an RTDB name gives 400 'not a realtime database action'", async () => {
    await expect(run({ actionName: "RTDB.SetData", collection: COLLECTION, data: {} })).rejects.toMatchObject({
      code: STATUS_BAD_REQUEST,
      message: "not a realtime database action:RTDB.SetData",
    });
    expect(callsNamed("rtdb.set")).toEqual([]);
  });
});

describe("FS.GetCollections", () => {
  test("with parentDocumentId lists the collections under that document", async () => {
    await expect(run({ actionName: "FS.GetCollections", parentDocumentId: "users/u1" })).resolves.toEqual(["sub1", "sub2"]);
    expect(calls).toEqual([["firestore.doc", "users/u1"], ["doc.listCollections", "users/u1"]]);
  });

  test("without parentDocumentId lists the root collections", async () => {
    await expect(run({ actionName: "FS.GetCollections" })).resolves.toEqual(["users", "orders"]);
    expect(calls).toEqual([["firestore.listCollections"]]);
  });
});

describe("FS.ListFireStore", () => {
  test("defaults: no orderBy, pageSize 10, page 1 (no offset query, no startAfter), totalCount from count()", async () => {
    getSnapshots = [snapshotOf({ n: 1 }, { n: 2 })];
    const result = await run({ actionName: "FS.ListFireStore", collection: COLLECTION });
    expect(result).toEqual({ totalCount: COUNT_TOTAL, documents: [{ n: 1 }, { n: 2 }] });
    expect(calls).toEqual([["collection", COLLECTION], ["count"], ["count.get"], ["limit", DEFAULT_PAGE_SIZE], ["get"]]);
  });

  test("orderBy defaults the direction to asc and is applied before the count", async () => {
    getSnapshots = [snapshotOf()];
    await run({ actionName: "FS.ListFireStore", collection: COLLECTION, orderBy: "name" });
    expect(calls.slice(0, 3)).toEqual([["collection", COLLECTION], ["orderBy", "name", "asc"], ["count"]]);
  });

  test("an explicit orderDirection is passed through", async () => {
    getSnapshots = [snapshotOf()];
    await run({ actionName: "FS.ListFireStore", collection: COLLECTION, orderBy: "name", orderDirection: "desc" });
    expect(callsNamed("orderBy")).toEqual([["orderBy", "name", "desc"]]);
  });

  test("page 3 of size 10 reads limit(20), then startAfter(its last document), then limit(10)", async () => {
    const lastDoc = doc({ n: 20 }, "last");
    getSnapshots = [{ empty: false, docs: [doc({ n: 19 }), lastDoc] }, snapshotOf({ n: 21 })];
    const result = await run({ actionName: "FS.ListFireStore", collection: COLLECTION, pageSize: 10, pageNumber: 3 });
    expect(result).toEqual({ totalCount: COUNT_TOTAL, documents: [{ n: 21 }] });
    expect(calls).toEqual([
      ["collection", COLLECTION],
      ["count"],
      ["count.get"],
      ["limit", 20],
      ["get"],
      ["startAfter", lastDoc],
      ["limit", 10],
      ["get"],
    ]);
  });

  test("an empty offset page gives no startAfter", async () => {
    getSnapshots = [snapshotOf(), snapshotOf()];
    await run({ actionName: "FS.ListFireStore", collection: COLLECTION, pageSize: 5, pageNumber: 2 });
    expect(callsNamed("startAfter")).toEqual([]);
    expect(callsNamed("limit")).toEqual([["limit", 5], ["limit", 5]]);
  });

  test("an empty final snapshot gives documents: []", async () => {
    countValue = 0;
    getSnapshots = [snapshotOf()];
    await expect(run({ actionName: "FS.ListFireStore", collection: COLLECTION })).resolves.toEqual({ totalCount: 0, documents: [] });
  });

  test("a missing collection gives 400", async () => {
    await expect(run({ actionName: "FS.ListFireStore" })).rejects.toMatchObject({
      code: STATUS_BAD_REQUEST,
      message: "not a firestore action with collection:FS.ListFireStore",
    });
  });
});

describe("FS.QueryFireStore", () => {
  const field = (fieldPath: string) => ({ fieldPath });
  const fieldFilter = (path: string, op: string, value: unknown) => ({ fieldFilter: { field: field(path), op, value } });

  test("a missing query gives 400", async () => {
    await expect(run({ actionName: "FS.QueryFireStore", collection: COLLECTION })).rejects.toMatchObject({
      code: STATUS_BAD_REQUEST,
      message: "Missing structuredQuery in action data",
    });
  });

  test("an empty query counts, gets, and returns {totalCount, documents}", async () => {
    getSnapshots = [snapshotOf({ n: 1 })];
    await expect(run(queryAction({}))).resolves.toEqual({ totalCount: COUNT_TOTAL, documents: [{ n: 1 }] });
    expect(calls).toEqual([["collection", COLLECTION], ["count"], ["count.get"], ["get"]]);
  });

  test("an empty FS.QueryFireStore result is []", async () => {
    countValue = 0;
    getSnapshots = [snapshotOf()];
    await expect(run(queryAction({}))).resolves.toEqual([]);
  });

  test("select.fields gives select(...paths) before any filter", async () => {
    getSnapshots = [snapshotOf({ a: 1 })];
    await run(queryAction({ select: { fields: [field("a"), field("b.c")] }, where: fieldFilter("a", "EQUAL", { stringValue: "x" }) }));
    expect(queryCalls().slice(0, 2)).toEqual([["select", "a", "b.c"], ["where", "a", "==", "x"]]);
  });

  test("select without fields is ignored", async () => {
    getSnapshots = [snapshotOf({ a: 1 })];
    await run(queryAction({ select: {} }));
    expect(callsNamed("select")).toEqual([]);
  });

  test("a composite AND applies field and unary filters in order", async () => {
    getSnapshots = [snapshotOf({ a: 1 })];
    await run(
      queryAction({
        where: {
          compositeFilter: {
            op: "AND",
            filters: [
              fieldFilter("age", "GREATER_THAN", { integerValue: 18 }),
              { unaryFilter: { field: field("deleted"), op: "IS_NULL" } },
              fieldFilter("name", "EQUAL", { stringValue: "ann" }),
              { somethingElse: true },
            ],
          },
        },
      })
    );
    expect(callsNamed("where")).toEqual([
      ["where", "age", ">", 18],
      ["where", "deleted", "==", null],
      ["where", "name", "==", "ann"],
    ]);
  });

  test("a composite OR gives 400 and runs no query", async () => {
    await expect(
      run(queryAction({ where: { compositeFilter: { op: "OR", filters: [fieldFilter("a", "EQUAL", { stringValue: "x" })] } } }))
    ).rejects.toMatchObject({ code: STATUS_BAD_REQUEST, message: "Only 'AND' composite filters are currently supported." });
    expect(callsNamed("get")).toEqual([]);
  });

  test("a single fieldFilter is applied", async () => {
    getSnapshots = [snapshotOf()];
    await run(queryAction({ where: fieldFilter("city", "EQUAL", { stringValue: "Prague" }) }));
    expect(callsNamed("where")).toEqual([["where", "city", "==", "Prague"]]);
  });

  test("a where with neither compositeFilter nor fieldFilter applies no filter", async () => {
    getSnapshots = [snapshotOf()];
    await run(queryAction({ where: { unaryFilter: { field: field("a"), op: "IS_NULL" } } }));
    expect(callsNamed("where")).toEqual([]);
  });

  test.each([
    ["EQUAL", "=="],
    ["GREATER_THAN", ">"],
    ["LESS_THAN", "<"],
    ["GREATER_THAN_OR_EQUAL", ">="],
    ["LESS_THAN_OR_EQUAL", "<="],
    ["ARRAY_CONTAINS", "array-contains"],
    ["ARRAY_CONTAINS_ANY", "array-contains-any"],
  ])("operator %s maps to %s", async (op, firestoreOp) => {
    getSnapshots = [snapshotOf()];
    await run(queryAction({ where: fieldFilter("f", op, { stringValue: "v" }) }));
    expect(callsNamed("where")).toEqual([["where", "f", firestoreOp, "v"]]);
  });

  test("an unsupported operator gives 400", async () => {
    await expect(run(queryAction({ where: fieldFilter("f", "CONTAINS", { stringValue: "v" }) }))).rejects.toMatchObject({
      code: STATUS_BAD_REQUEST,
      message: "Unsupported operator: CONTAINS",
    });
  });

  test.each([
    ["integerValue", { integerValue: 7 }, 7],
    ["stringValue", { stringValue: "s" }, "s"],
    ["booleanValue true", { booleanValue: true }, true],
    ["booleanValue false (nullish, not falsy, chain)", { booleanValue: false }, false],
    ["doubleValue", { doubleValue: 1.5 }, 1.5],
  ])("value type %s is used as the where value", async (_name, value, expected) => {
    getSnapshots = [snapshotOf()];
    await run(queryAction({ where: fieldFilter("f", "EQUAL", value) }));
    expect(callsNamed("where")).toEqual([["where", "f", "==", expected]]);
  });

  test("a filter with no supported value type gives 400", async () => {
    await expect(run(queryAction({ where: fieldFilter("f", "EQUAL", { nullValue: null }) }))).rejects.toMatchObject({
      code: STATUS_BAD_REQUEST,
      message: "Unsupported value type in structuredQuery",
    });
  });

  test.each([
    ["IS_NULL", "=="],
    ["IS_NOT_NULL", "!="],
  ])("unary operator %s maps to where(field, %s, null)", async (op, firestoreOp) => {
    getSnapshots = [snapshotOf()];
    await run(queryAction({ where: { compositeFilter: { op: "AND", filters: [{ unaryFilter: { field: field("f"), op } }] } } }));
    expect(callsNamed("where")).toEqual([["where", "f", firestoreOp, null]]);
  });

  test('integerValue strings: "-12" gives -12 and "0" gives 0 (not skipped as falsy)', async () => {
    getSnapshots = [snapshotOf(), snapshotOf()];
    await run(queryAction({ where: fieldFilter("f", "EQUAL", { integerValue: "-12" }) }));
    expect(callsNamed("where")).toEqual([["where", "f", "==", -12]]);
    calls.length = 0;
    await run(queryAction({ where: fieldFilter("f", "EQUAL", { integerValue: "0" }) }));
    expect(callsNamed("where")).toEqual([["where", "f", "==", 0]]);
  });

  test("an integerValue above 2^53 is passed as an exact bigint", async () => {
    getSnapshots = [snapshotOf()];
    await run(queryAction({ where: fieldFilter("f", "EQUAL", { integerValue: BIG_INTEGER_STRING }) }));
    expect(callsNamed("where")).toEqual([["where", "f", "==", BigInt(BIG_INTEGER_STRING)]]);
  });

  test.each(["12abc", "", "1.5", true, null])("an invalid integerValue %p gives 400 and runs no query", async (invalid) => {
    await expect(run(queryAction({ where: fieldFilter("f", "EQUAL", { integerValue: invalid }) }))).rejects.toMatchObject({
      code: STATUS_BAD_REQUEST,
      message: `Invalid integerValue: ${String(invalid)}`,
    });
    expect(callsNamed("get")).toEqual([]);
    expect(callsNamed("count")).toEqual([]);
  });

  test("cursor integerValue strings are decoded", async () => {
    getSnapshots = [snapshotOf()];
    await run(queryAction({ startAt: { values: [{ integerValue: "3" }] }, endAt: { values: [{ integerValue: BIG_INTEGER_STRING }] } }));
    expect(callsNamed("startAt")).toEqual([["startAt", 3]]);
    expect(callsNamed("endAt")).toEqual([["endAt", BigInt(BIG_INTEGER_STRING)]]);
  });

  test('integerValue "-0" (and the number -0) gives +0 in a filter and a cursor', async () => {
    getSnapshots = [snapshotOf()];
    await run(queryAction({ where: fieldFilter("f", "EQUAL", { integerValue: "-0" }), startAt: { values: [{ integerValue: -0 }] } }));
    const whereCall = callsNamed("where")[0];
    const startAtCall = callsNamed("startAt")[0];
    expect(Object.is(whereCall[3], 0)).toBe(true);
    expect(Object.is(startAtCall[1], 0)).toBe(true);
  });

  test("IS_NAN and IS_NULL in one AND keep their own values", async () => {
    getSnapshots = [snapshotOf()];
    await run(
      queryAction({
        where: {
          compositeFilter: {
            op: "AND",
            filters: [
              { unaryFilter: { field: field("a"), op: "IS_NAN" } },
              { unaryFilter: { field: field("b"), op: "IS_NULL" } },
            ],
          },
        },
      })
    );
    expect(callsNamed("where")).toEqual([["where", "a", "==", NaN], ["where", "b", "==", null]]);
  });

  test("an unsupported unary operator gives 400", async () => {
    await expect(
      run(queryAction({ where: { compositeFilter: { op: "AND", filters: [{ unaryFilter: { field: field("f"), op: "IS_WEIRD" } }] } } }))
    ).rejects.toMatchObject({ code: STATUS_BAD_REQUEST, message: "Unsupported unary operator: IS_WEIRD" });
  });

  test("orderBy array: direction lowercased, default asc, entries without field.fieldPath skipped; applied after the count", async () => {
    getSnapshots = [snapshotOf()];
    await run(
      queryAction({
        orderBy: [
          { field: field("a"), direction: "DESC" },
          { field: field("b") },
          { field: {}, direction: "ASC" },
          { direction: "DESC" },
        ],
      })
    );
    expect(calls).toEqual([
      ["collection", COLLECTION],
      ["count"],
      ["count.get"],
      ["orderBy", "a", "desc"],
      ["orderBy", "b", "asc"],
      ["get"],
    ]);
  });

  test("an orderBy that is not an array is ignored", async () => {
    getSnapshots = [snapshotOf()];
    await run(queryAction({ orderBy: { field: field("a") } }));
    expect(callsNamed("orderBy")).toEqual([]);
  });

  test("limit is applied; limit 0 is not", async () => {
    getSnapshots = [snapshotOf(), snapshotOf()];
    await run(queryAction({ limit: 5 }));
    expect(callsNamed("limit")).toEqual([["limit", 5]]);
    calls.length = 0;
    await run(queryAction({ limit: 0 }));
    expect(callsNamed("limit")).toEqual([]);
  });

  test("offset reads limit(offset), then startAfter(its last document)", async () => {
    const lastDoc = doc({ n: 3 }, "last");
    getSnapshots = [{ empty: false, docs: [doc({ n: 2 }), lastDoc] }, snapshotOf({ n: 4 })];
    const result = await run(queryAction({ limit: 2, offset: 3 }));
    expect(result).toEqual({ totalCount: COUNT_TOTAL, documents: [{ n: 4 }] });
    expect(queryCalls()).toEqual([["count"], ["count.get"], ["limit", 2], ["limit", 3], ["get"], ["startAfter", lastDoc], ["get"]]);
  });

  test("an empty offset page gives no startAfter", async () => {
    getSnapshots = [snapshotOf(), snapshotOf({ n: 1 })];
    await run(queryAction({ offset: 4 }));
    expect(callsNamed("startAfter")).toEqual([]);
  });

  test("startAt and endAt take the extracted cursor values of every supported type", async () => {
    getSnapshots = [snapshotOf()];
    await run(
      queryAction({
        startAt: { values: [{ integerValue: 1 }, { stringValue: "a" }, { nullValue: null }] },
        endAt: { values: [{ booleanValue: false }, { doubleValue: 2.5 }] },
      })
    );
    expect(callsNamed("startAt")).toEqual([["startAt", 1, "a"]]);
    expect(callsNamed("endAt")).toEqual([["endAt", false, 2.5]]);
  });

  test("a startAt whose values are all unsupported is not applied, nor is an endAt without values", async () => {
    getSnapshots = [snapshotOf()];
    await run(queryAction({ startAt: { values: [{ nullValue: null }] }, endAt: { before: true } }));
    expect(callsNamed("startAt")).toEqual([]);
    expect(callsNamed("endAt")).toEqual([]);
  });

  test("an endAt whose values are all unsupported is not applied, nor is a startAt without values", async () => {
    getSnapshots = [snapshotOf()];
    await run(queryAction({ startAt: {}, endAt: { values: [{ nullValue: null }] } }));
    expect(callsNamed("startAt")).toEqual([]);
    expect(callsNamed("endAt")).toEqual([]);
  });

  test("the full translation order is select, where, count, orderBy, limit, offset, startAt, endAt, get", async () => {
    const lastDoc = doc({}, "last");
    getSnapshots = [{ empty: false, docs: [lastDoc] }, snapshotOf({ ok: true })];
    await run(
      queryAction({
        select: { fields: [field("a")] },
        where: fieldFilter("a", "LESS_THAN", { integerValue: 9 }),
        orderBy: [{ field: field("a"), direction: "DESC" }],
        limit: 4,
        offset: 1,
        startAt: { values: [{ integerValue: 1 }] },
        endAt: { values: [{ integerValue: 8 }] },
      })
    );
    expect(calls).toEqual([
      ["collection", COLLECTION],
      ["select", "a"],
      ["where", "a", "<", 9],
      ["count"],
      ["count.get"],
      ["orderBy", "a", "desc"],
      ["limit", 4],
      ["limit", 1],
      ["get"],
      ["startAfter", lastDoc],
      ["startAt", 1],
      ["endAt", 8],
      ["get"],
    ]);
  });
});

describe("FS document actions", () => {
  test("FS.GetDocument uses collection(c).doc(id) and returns the data", async () => {
    await expect(run({ actionName: "FS.GetDocument", collection: COLLECTION, documentId: DOC_ID })).resolves.toEqual({ fetched: DOC_ID });
    expect(calls).toEqual([["collection", COLLECTION], ["collection.doc", DOC_ID], ["doc.get", DOC_ID]]);
  });

  test("FS.UpdateDocument updates the document and returns {success: true}", async () => {
    const data = { name: "new" };
    await expect(run({ actionName: "FS.UpdateDocument", collection: COLLECTION, documentId: DOC_ID, data })).resolves.toEqual({
      success: true,
    });
    expect(calls).toEqual([["collection", COLLECTION], ["collection.doc", DOC_ID], ["doc.update", DOC_ID, data]]);
  });

  test("FS.DeleteDocument deletes the document and returns {success: true}", async () => {
    await expect(run({ actionName: "FS.DeleteDocument", collection: COLLECTION, documentId: DOC_ID })).resolves.toEqual({ success: true });
    expect(calls).toEqual([["collection", COLLECTION], ["collection.doc", DOC_ID], ["doc.delete", DOC_ID]]);
  });

  test.each(["FS.GetDocument", "FS.UpdateDocument", "FS.DeleteDocument"])("%s without documentId gives 400", async (actionName) => {
    await expect(run({ actionName, collection: COLLECTION, data: {} })).rejects.toMatchObject({
      code: STATUS_BAD_REQUEST,
      message: `not a firestore action with collection and documentId:${actionName}`,
    });
  });

  test("FS.InsertDocument with a documentId calls doc(id).set(data)", async () => {
    const data = { a: 1 };
    await expect(run({ actionName: "FS.InsertDocument", collection: COLLECTION, documentId: DOC_ID, data })).resolves.toEqual({ success: true });
    expect(calls).toEqual([["collection", COLLECTION], ["collection.doc", DOC_ID], ["doc.set", DOC_ID, data]]);
  });

  test("FS.InsertDocument without a documentId calls add(data)", async () => {
    const data = { a: 1 };
    await expect(run({ actionName: "FS.InsertDocument", collection: COLLECTION, data })).resolves.toEqual({ success: true });
    expect(calls).toEqual([["collection", COLLECTION], ["collection.add", data]]);
  });
});

describe("error handling", () => {
  test("an SDK rejection is logged with the action name and re-thrown unchanged", async () => {
    const failure = new Error("PERMISSION_DENIED");
    docSetRejection = failure;
    await expect(run({ actionName: "FS.InsertDocument", collection: COLLECTION, documentId: DOC_ID, data: {} })).rejects.toBe(failure);
    expect(consoleError).toHaveBeenCalledWith("Error in action FS.InsertDocument:", failure);
  });
});

describe("plugin object (index.ts)", () => {
  test("queryConfig gives the v1.0 spec for an empty or v1.0 specVersion and nothing for an unknown one", async () => {
    const queryConfig = firebasePlugin.queryConfig as (data: { specVersion?: string }) => Promise<unknown>;
    expect(await queryConfig({})).toBe(firebaseQueryConfig);
    expect(await queryConfig({ specVersion: "v1.0" })).toBe(firebaseQueryConfig);
    expect(await queryConfig({ specVersion: "v9.9" })).toBeUndefined();
  });

  test("run delegates to runFirebasePlugin with the action and the data source", async () => {
    rtdbValue = { greeting: "hi" };
    await expect(
      firebasePlugin.run({ actionName: "RTDB.QueryDatabase", databaseRef: DB_REF } as any, dataSource as any, { languages: ["en"] } as any)
    ).resolves.toEqual({ greeting: "hi" });
    expect(calls).toEqual([["rtdb.ref", DB_REF], ["rtdb.once", "value"]]);
  });
});

describe("B13: IS_NAN filters NaN; integerValue is a number", () => {
  // IS_NAN / IS_NOT_NAN must reach the SDK as NaN comparisons (not null ones), and a string integerValue must be decoded.
  const unaryQuery = (op: string) => ({
    where: { compositeFilter: { op: "AND", filters: [{ unaryFilter: { field: { fieldPath: "f" }, op } }] } },
  });

  test("B13: IS_NAN filters NaN", async () => {
    getSnapshots = [snapshotOf()];
    await run(queryAction(unaryQuery("IS_NAN")));
    expect(callsNamed("where")).toEqual([["where", "f", "==", NaN]]);
  });

  test("B13: IS_NOT_NAN filters not-NaN", async () => {
    getSnapshots = [snapshotOf()];
    await run(queryAction(unaryQuery("IS_NOT_NAN")));
    expect(callsNamed("where")).toEqual([["where", "f", "!=", NaN]]);
  });

  test("B13: integerValue is a number", async () => {
    getSnapshots = [snapshotOf()];
    await run(queryAction({ where: { fieldFilter: { field: { fieldPath: "f" }, op: "EQUAL", value: STRING_INTEGER_VALUE } } }));
    expect(callsNamed("where")).toEqual([["where", "f", "==", 5]]);
  });
});
