import lodash from "lodash";
import { clearMockWindow, createBlackHole, evalFunc, getErrorMessage } from "./evalScript";

const REAL_WINDOW_PROBE_KEY = "p2RealWindowProbe";
const REAL_WINDOW_VALUE_KEY = "p2RealWindowValue";
const BLACKLISTED_GLOBALS = ["fetch", "setTimeout", "document", "XMLHttpRequest"];
const UNKNOWN_GLOBAL = "someNameNobodyDefined";
// Returning a black hole from evalFunc never settles (it looks like a thenable that never calls back), so a
// regression in the sandbox shows up as a hang. Fail fast instead of waiting for the 10 minute default.
const TEST_TIMEOUT_MS = 5000;
jest.setTimeout(TEST_TIMEOUT_MS);

const UNKNOWN_ERROR_MESSAGE = "UnknownError: unknown exception during eval";

afterEach(async () => {
  clearMockWindow();
  // remove what the disableLimit tests put on the module-level window
  await evalFunc(`delete window.${REAL_WINDOW_PROBE_KEY}; delete window.${REAL_WINDOW_VALUE_KEY};`, {}, { disableLimit: true });
});

describe("evalFunc results", () => {
  test("returns the value of return", async () => {
    await expect(evalFunc("return 1 + 2", {})).resolves.toBe(3);
  });

  test("returns undefined when the code has no return", async () => {
    await expect(evalFunc("const x = 1;", {})).resolves.toBeUndefined();
  });

  test("awaits an async value from a context function", async () => {
    const context = { fetchValue: async () => "from-context" };
    await expect(evalFunc("const v = await fetchValue(); return v + '!'", context)).resolves.toBe("from-context!");
  });

  test("a promise returned by the code is awaited", async () => {
    const context = { later: () => new Promise((resolve) => setTimeout(() => resolve(7), 5)) };
    await expect(evalFunc("return later()", context)).resolves.toBe(7);
  });

  test("rejects with the value the code throws (Error itself is not available in the sandbox, see B6)", async () => {
    await expect(evalFunc("throw 'boom'", {})).rejects.toBe("boom");
  });

  test("a syntax error in the code rejects the call", async () => {
    await expect(evalFunc("return (", {})).rejects.toBeInstanceOf(SyntaxError);
  });
});

describe("context access", () => {
  test("context values are readable", async () => {
    await expect(evalFunc("return a.b", { a: { b: 42 } })).resolves.toBe(42);
  });

  test("a context getter runs once, later reads come from the cache", async () => {
    let reads = 0;
    const context = {
      get counter() {
        reads += 1;
        return 5;
      },
    };
    await expect(evalFunc("return counter + counter + counter", context)).resolves.toBe(15);
    expect(reads).toBe(1);
  });

  test("this.toJSON is the mock window, the same object that window resolves to", async () => {
    await expect(evalFunc("return this.toJSON === window", {})).resolves.toBe(true);
  });

  test("the in operator on window is true for any name (the mock window claims every key)", async () => {
    await expect(evalFunc(`return [${JSON.stringify(UNKNOWN_GLOBAL)} in window, 'x' in window]`, {})).resolves.toEqual([
      true,
      true,
    ]);
  });

  test("assigning to a context name throws \"a can't be modified\"", async () => {
    await expect(evalFunc("a = 2", { a: 1 })).rejects.toThrow("a can't be modified");
  });

  test.each(["window", "globalThis", "self"])("assigning %s throws", async (name) => {
    await expect(evalFunc(`${name} = {}`, {})).rejects.toThrow(`${name} can't be modified`);
  });

  test("a new global assignment on a non-protected name is allowed", async () => {
    await expect(evalFunc("freshGlobal = 3; return freshGlobal", {})).resolves.toBe(3);
  });
});

describe("frozen context objects", () => {
  test("adding a property to a first-level context object throws a TypeError", async () => {
    await expect(evalFunc("a.x = 1", { a: { b: { c: {} } } })).rejects.toBeInstanceOf(TypeError);
  });

  test("adding a property to a second-level object throws a TypeError", async () => {
    await expect(evalFunc("a.b.x = 1", { a: { b: { c: {} } } })).rejects.toBeInstanceOf(TypeError);
  });

  test("changing an existing second-level value throws a TypeError", async () => {
    await expect(evalFunc("a.b = 2", { a: { b: 1 } })).rejects.toBeInstanceOf(TypeError);
  });

  test("boundary: the third level is not frozen, so a.b.c.x = 1 succeeds (freezing stops at two levels)", async () => {
    const context = { a: { b: { c: {} as any } } };
    await expect(evalFunc("a.b.c.x = 1; return a.b.c.x", context)).resolves.toBe(1);
    expect(context.a.b.c.x).toBe(1);
  });

  test("primitives and null in the context are passed through unchanged", async () => {
    await expect(evalFunc("return [n, s, z]", { n: 1, s: "s", z: null })).resolves.toEqual([1, "s", null]);
  });
});

describe("sandbox traps reached from a context function", () => {
  // A context function is called with the sandbox as `this` (with-statement call semantics).
  const context = () => ({
    protectedValue: 1,
    defineIt(this: any, name: string) {
      Object.defineProperty(this, name, { value: 1, configurable: true });
      return "defined";
    },
    deleteIt(this: any, name: string) {
      return delete this[name];
    },
    setProto(this: any) {
      Object.setPrototypeOf(this, {});
    },
  });

  test("defineProperty on a protected name throws \"can't define property:\"", async () => {
    await expect(evalFunc("return defineIt('protectedValue')", context())).rejects.toThrow(
      "can't define property:protectedValue"
    );
  });

  test("defineProperty on a global name such as window throws", async () => {
    await expect(evalFunc("return defineIt('window')", context())).rejects.toThrow("can't define property:window");
  });

  test("defineProperty on a non-protected name succeeds", async () => {
    await expect(evalFunc("defineIt('freeName'); return freeName", context())).resolves.toBe(1);
  });

  test("delete on a protected name throws \"can't delete property:\"", async () => {
    await expect(evalFunc("return deleteIt('protectedValue')", context())).rejects.toThrow(
      "can't delete property:protectedValue"
    );
  });

  test("delete on a non-protected name succeeds and removes it", async () => {
    await expect(
      evalFunc("freeName = 1; const ok = deleteIt('freeName'); return [ok, typeof freeName]", context())
    ).resolves.toEqual([true, "undefined"]);
  });

  test("setPrototypeOf on the sandbox throws \"can't invoke setPrototypeOf\"", async () => {
    await expect(evalFunc("setProto()", context())).rejects.toThrow("can't invoke setPrototypeOf");
  });
});

describe("blacklisted globals", () => {
  test.each(BLACKLISTED_GLOBALS)("%s is a black hole, not the host's implementation", async (name) => {
    // typeof is "function" for a black hole (callable proxy) and the unlisted control name is undefined,
    // so this fails if the blacklist lookup is removed.
    await expect(evalFunc(`return [typeof ${name}, typeof ${UNKNOWN_GLOBAL}]`, {})).resolves.toEqual([
      "function",
      "undefined",
    ]);
    const hostValue = (globalThis as any)[name];
    if (hostValue !== undefined) {
      await expect(evalFunc(`return ${name} === hostValue`, { hostValue })).resolves.toBe(false);
    }
  });

  test("calling, chaining and interpolating a black hole all give an empty string and nothing runs", async () => {
    const context = { String };
    await expect(
      evalFunc("return [`${fetch('http://127.0.0.1:1/never')}`, `${fetch.a.b.c}`, String(setTimeout(() => 1, 1)), '' + document.body.innerHTML]", context)
    ).resolves.toEqual(["", "", "", ""]);
  });

  test("a call on a blacklisted timer never schedules the callback", async () => {
    let fired = false;
    await evalFunc("setTimeout(() => { markFired(); }, 0); return 1", { markFired: () => (fired = true) });
    await new Promise((r) => setTimeout(r, 20));
    expect(fired).toBe(false);
  });
});

describe("createBlackHole", () => {
  test("toString and Symbol.toPrimitive give an empty string", () => {
    const hole = createBlackHole();
    expect(hole.toString()).toBe("");
    expect(hole[Symbol.toPrimitive]()).toBe("");
    expect(`${hole}`).toBe("");
    expect(hole + "x").toBe("x");
  });

  test("any property or call gives another black hole", () => {
    const hole = createBlackHole();
    const prop = hole.anything;
    const called = hole();
    expect(typeof prop).toBe("function");
    expect(typeof called).toBe("function");
    expect(prop).not.toBe(hole);
    expect(called).not.toBe(hole);
    expect(`${prop.deeper.deeper()}`).toBe("");
  });
});

describe("window and lodash", () => {
  test("_ is lodash and window._ is the same object", async () => {
    await expect(evalFunc("return _ === lodash && window._ === lodash", { lodash })).resolves.toBe(true);
    await expect(evalFunc("return _.map([1, 2, 3], (n) => n * 2)", {})).resolves.toEqual([2, 4, 6]);
  });

  test("a method without a prototype on the module window is bound to it, not to the sandbox", async () => {
    // The original expectation was `toString()` here, but toString exists on the mock window target (Object.prototype),
    // so the bind branch (evalScript.ts:69-71) is only reachable for a prototype-less function the module
    // window really owns. disableLimit lets the code put one there.
    await evalFunc(`window.${REAL_WINDOW_PROBE_KEY} = { m() { return this.localOnly; } }.m;`, {}, { disableLimit: true });
    // localOnly is set on the mock window (the sandbox target). If probe ran with the sandbox as this it would see 1.
    await expect(evalFunc(`localOnly = 1; return ${REAL_WINDOW_PROBE_KEY}()`, {})).resolves.toBeUndefined();
  });

  test("a function with a prototype on the module window is returned unbound", async () => {
    await evalFunc(
      `window.${REAL_WINDOW_PROBE_KEY} = function () { return this.localOnly; };`,
      {},
      { disableLimit: true }
    );
    await expect(evalFunc(`localOnly = 1; return ${REAL_WINDOW_PROBE_KEY}()`, {})).resolves.toBe(1);
  });
});

describe("disableLimit", () => {
  test("window is the module window, so writes land there and not on the mock window", async () => {
    await evalFunc(`window.${REAL_WINDOW_VALUE_KEY} = 5`, {}, { disableLimit: true });
    await expect(evalFunc(`return window.${REAL_WINDOW_VALUE_KEY}`, {}, { disableLimit: true })).resolves.toBe(5);
    // limited code reaches it only through the fall-through lookup, never as an own property of the mock window
    await expect(evalFunc(`window.${REAL_WINDOW_VALUE_KEY} = 6; return window.${REAL_WINDOW_VALUE_KEY}`, {})).resolves.toBe(6);
    await expect(evalFunc(`return window.${REAL_WINDOW_VALUE_KEY}`, {}, { disableLimit: true })).resolves.toBe(5);
  });

  test("unknown names resolve against the module window and skip the blacklist", async () => {
    await expect(evalFunc(`return [typeof fetch, typeof ${UNKNOWN_GLOBAL}]`, {}, { disableLimit: true })).resolves.toEqual([
      "undefined",
      "undefined",
    ]);
    await expect(evalFunc("return typeof _", {}, { disableLimit: true })).resolves.toBe("function");
  });

  test("context names still win and stay protected", async () => {
    await expect(evalFunc("return a", { a: 9 }, { disableLimit: true })).resolves.toBe(9);
    await expect(evalFunc("a = 1", { a: 9 }, { disableLimit: true })).rejects.toThrow("a can't be modified");
  });
});

describe("clearMockWindow", () => {
  test("drops globals assigned by earlier evaluations", async () => {
    await evalFunc("keptGlobal = 1", {});
    clearMockWindow();
    await expect(evalFunc("return typeof keptGlobal", {})).resolves.toBe("undefined");
  });
});

describe("known bugs (the correct behaviour is asserted and fails today)", () => {
  test.failing("B23: a global from one evalFunc call is not visible in the next", async () => {
    await evalFunc("leakedBetweenRequests = 'secret'", {});
    await expect(evalFunc("return typeof leakedBetweenRequests", {})).resolves.toBe("undefined");
  });

  test.failing("B6: JSON, Math and Date work in user code", async () => {
    await expect(
      evalFunc("return [JSON.stringify({ a: 1 }), Math.max(1, 3), new Date(0).getTime()]", {})
    ).resolves.toEqual(['{"a":1}', 3, 0]);
  });
});

describe("getErrorMessage", () => {
  test("an Error gives Name: message", () => {
    expect(getErrorMessage(new TypeError("bad"))).toBe("TypeError: bad");
  });

  test("a string is returned as is", () => {
    expect(getErrorMessage("plain")).toBe("plain");
  });

  test.each([[undefined], [null], [42], [{ message: "x" }]])("%p gives the unknown-exception message", (value) => {
    expect(getErrorMessage(value)).toBe(UNKNOWN_ERROR_MESSAGE);
  });
});
