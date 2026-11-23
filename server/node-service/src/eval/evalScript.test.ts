import lodash from "lodash";
import ivm from "isolated-vm";
import {
  callHostBridge,
  DEFAULT_EVAL_LIMITS,
  EVAL_MAX_CONCURRENT_ISOLATES,
  EVAL_MAX_QUEUED,
  EVAL_MEMORY_LIMIT_MB,
  EVAL_QUEUE_WAIT_MS,
  EVAL_SYNC_BACKSTOP_MS,
  EVAL_TIMEOUT_MS,
  EvalLimitError,
  evalFunc,
  getErrorMessage,
  HostBridge,
  parseEnvelope,
} from "./evalScript";

// Lifecycle observation seam: `Isolate.prototype` of the native module is frozen, so jest.spyOn cannot patch it.
// The module is replaced by a copy whose Isolate is a subclass that counts the calls and delegates to the real one.
// (Variables used by the factory must start with "mock".)
const mockLifecycle = { dispose: 0, createContext: 0, failNextCreateContext: false };
const SETUP_FAILED_MESSAGE = "setup failed";
jest.mock("isolated-vm", () => {
  const real = jest.requireActual("isolated-vm");
  class ObservedIsolate extends real.Isolate {
    dispose() {
      mockLifecycle.dispose += 1;
      return super.dispose();
    }
    createContext(...args: unknown[]) {
      mockLifecycle.createContext += 1;
      if (mockLifecycle.failNextCreateContext) {
        mockLifecycle.failNextCreateContext = false;
        return Promise.reject(new Error("setup failed"));
      }
      return super.createContext(...args);
    }
  }
  // the native module keeps its classes on the prototype of its exports, so a spread would lose them
  return Object.create(real, { Isolate: { value: ObservedIsolate, enumerable: true } });
});

// Endless code is stopped by the evaluation limits; fail fast instead of waiting for the 10 minute default.
const TEST_TIMEOUT_MS = 5000;
jest.setTimeout(TEST_TIMEOUT_MS);

const UNKNOWN_ERROR_MESSAGE = "UnknownError: unknown exception during eval";
const HOST_ONLY_NAMES = [
  "process",
  "require",
  "module",
  "exports",
  "Buffer",
  "global",
  "setTimeout",
  "setInterval",
  "setImmediate",
  "clearInterval",
  "fetch",
  "XMLHttpRequest",
  "document",
  "WebAssembly",
  "SharedArrayBuffer",
  "Atomics",
];
const REMOVED_FROM_ISOLATE = ["WebAssembly", "SharedArrayBuffer", "Atomics"];
const STANDARD_NAMES = [
  "Object", "Array", "String", "Number", "Boolean", "Symbol", "BigInt", "Date", "RegExp", "Map", "Set", "WeakMap",
  "WeakSet", "Promise", "Error", "TypeError", "RangeError", "SyntaxError", "ReferenceError", "EvalError", "URIError",
  "parseInt", "parseFloat", "isNaN", "isFinite", "encodeURIComponent", "decodeURIComponent", "encodeURI", "decodeURI",
  "NaN", "Infinity", "JSON", "Math",
];
// Names the in-isolate runner reads; a context key of the same name must not break it.
const RUNNER_BUILTINS = ["Object", "globalThis", "JSON", "Error", "String"];
// Methods an ivm.Reference has and no standard function or object inherits (`apply` is left out: every function inherits it).
const REFERENCE_PROBE_METHODS = ["applySync", "derefInto"];
const SHORT_TIMEOUT_MS = 200;
const SHORT_LIMITS = { ...DEFAULT_EVAL_LIMITS, timeoutMs: SHORT_TIMEOUT_MS };
const SMALL_HEAP_LIMITS = { ...DEFAULT_EVAL_LIMITS, timeoutMs: 3000, memoryLimitMb: 16 };
const SHORT_QUEUE_LIMITS = { ...DEFAULT_EVAL_LIMITS, queueWaitMs: 200 };
const POLL_INTERVAL_MS = 5;
const SETTLE_MS = 100;
const BRIDGE_DELAY_MS = 600;
const BRIDGE_LIMIT_MS = 1000;
const FAST_MS = 2000;
const BACKSTOP_TEST_MS = 3000;
const DISTINCT_TIMEOUT_MS = 4321;
const SETUP_FAILURES = EVAL_MAX_CONCURRENT_ISOLATES + 1;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function waitUntil(condition: () => boolean) {
  const deadline = Date.now() + TEST_TIMEOUT_MS;
  while (!condition()) {
    if (Date.now() > deadline) throw new Error("condition not reached");
    await sleep(POLL_INTERVAL_MS);
  }
}

// A bridge whose calls are counted and stay pending until the test releases them; calls made after the release resolve at once.
function heldBridge() {
  const pending: Array<() => void> = [];
  const state = { calls: 0, released: false };
  const bridge: HostBridge = {
    runQueryLibrary: () => {
      state.calls += 1;
      return state.released ? Promise.resolve("released") : new Promise((resolve) => pending.push(() => resolve("released")));
    },
  };
  return {
    bridge,
    state,
    release() {
      state.released = true;
      pending.splice(0).forEach((resolveCall) => resolveCall());
    },
  };
}

const resolvingBridge = (value: unknown): HostBridge => ({ runQueryLibrary: jest.fn().mockResolvedValue(value) });
const rejectingBridge = (reason: unknown): HostBridge => ({ runQueryLibrary: jest.fn().mockRejectedValue(reason) });

beforeEach(() => {
  mockLifecycle.dispose = 0;
  mockLifecycle.createContext = 0;
  mockLifecycle.failNextCreateContext = false;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("evalFunc results", () => {
  test("returns the value of return", async () => {
    await expect(evalFunc("return 1 + 2", {})).resolves.toBe(3);
  });

  test("returns undefined when the code has no return", async () => {
    await expect(evalFunc("const x = 1;", {})).resolves.toBeUndefined();
  });

  test("awaits a promise inside the code", async () => {
    await expect(evalFunc("const v = await Promise.resolve('from-code'); return v + '!'", {})).resolves.toBe("from-code!");
  });

  test("a promise returned by the code is awaited", async () => {
    await expect(evalFunc("return Promise.resolve().then(() => 7)", {})).resolves.toBe(7);
  });

  test("rejects with the value the code throws", async () => {
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

  test("assigning to a context name rejects with a read-only TypeError", async () => {
    const rejection = evalFunc("a = 2", { a: 1 });
    await expect(rejection).rejects.toBeInstanceOf(TypeError);
    await expect(rejection).rejects.toThrow(/read only property 'a'/);
  });

  test.each(["window", "self"])("assigning %s rejects with a read-only TypeError", async (name) => {
    const rejection = evalFunc(`${name} = {}`, {});
    await expect(rejection).rejects.toBeInstanceOf(TypeError);
    await expect(rejection).rejects.toThrow(new RegExp(`read only property '${name}'`));
  });

  test("an undeclared assignment rejects with ReferenceError (strict mode)", async () => {
    await expect(evalFunc("freshGlobal = 3", {})).rejects.toBeInstanceOf(ReferenceError);
    await expect(evalFunc("globalThis.freshGlobal = 3; return freshGlobal", {})).resolves.toBe(3);
  });

  test("primitives and null in the context are passed through unchanged", async () => {
    await expect(evalFunc("return [n, s, z]", { n: 1, s: "s", z: null })).resolves.toEqual([1, "s", null]);
  });
});

describe("window and lodash", () => {
  test("_ is lodash loaded in the isolate and window._ is the same object", async () => {
    await expect(evalFunc("return [_.VERSION, window._ === _, _.map([1, 2, 3], (n) => n * 2)]", {})).resolves.toEqual([
      lodash.VERSION,
      true,
      [2, 4, 6],
    ]);
  });
});

describe("isolation (B43)", () => {
  test.each(HOST_ONLY_NAMES)("%s is undefined inside the isolate", async (name) => {
    await expect(evalFunc(`return typeof ${name}`, {})).resolves.toBe("undefined");
  });

  test("the function constructors are the isolate's own", async () => {
    await expect(
      evalFunc(
        "return [(() => 0).constructor('return typeof process')(), await (async () => 0).constructor('return typeof process')()]",
        {}
      )
    ).resolves.toEqual(["undefined", "undefined"]);
  });

  test("dynamic import() rejects inside the isolate", async () => {
    await expect(evalFunc('return import("node:process").then((m) => typeof m.default.env)', {})).rejects.toBeDefined();
  });

  test("a prototype or built-in changed by one call is intact in the next", async () => {
    await evalFunc("Array.prototype.polluted = 1; JSON.stringify = null; return 1", {});
    await expect(evalFunc("return [typeof [].polluted, JSON.stringify({ a: 1 })]", {})).resolves.toEqual([
      "undefined",
      '{"a":1}',
    ]);
  });

  test("every evaluation disposes its isolate", async () => {
    await evalFunc("return 1", {});
    await expect(evalFunc("throw 'x'", {})).rejects.toBe("x");
    await expect(evalFunc("while (true) {}", {}, undefined, SHORT_LIMITS)).rejects.toBeInstanceOf(EvalLimitError);
    expect(mockLifecycle.dispose).toBe(3);
  });

  describe("the isolate global", () => {
    async function bareGlobalNames(): Promise<string[]> {
      const bare = new ivm.Isolate();
      try {
        const context = await bare.createContext();
        return await context.eval("Object.getOwnPropertyNames(globalThis)", { copy: true });
      } finally {
        bare.dispose();
      }
    }

    const expectedNames = async (...extra: string[]) =>
      [...(await bareGlobalNames()).filter((name) => !REMOVED_FROM_ISOLATE.includes(name)), "_", "window", "self", ...extra].sort();

    test("holds only V8's own names plus _, window and self", async () => {
      const names = (await evalFunc("return Object.getOwnPropertyNames(globalThis)", {})) as string[];
      expect([...names].sort()).toEqual(await expectedNames());
    });

    test("with a bridge, gains only runQueryLibrary, which is not an isolated-vm Reference", async () => {
      const bridge = resolvingBridge("never");
      const code = `
        const hasMethod = (o, m) => {
          for (let p = o; p; p = Object.getPrototypeOf(p)) {
            const d = Object.getOwnPropertyDescriptor(p, m);
            if (d) return typeof d.value === "function";
          }
          return false;
        };
        const seen = new Set();
        let found = 0;
        const visit = (v, depth) => {
          if ((typeof v !== "object" && typeof v !== "function") || v === null || seen.has(v) || depth > 3) return;
          seen.add(v);
          if (methods.every((m) => hasMethod(v, m))) found++;
          for (const k of Reflect.ownKeys(v)) {
            const d = Object.getOwnPropertyDescriptor(v, k);
            if (d && "value" in d) visit(d.value, depth + 1);
          }
        };
        visit(globalThis, 0);
        return [
          Object.getOwnPropertyNames(globalThis),
          typeof runQueryLibrary,
          Reflect.ownKeys(runQueryLibrary).map(String).sort(),
          Object.getPrototypeOf(runQueryLibrary) === Object.getPrototypeOf(async () => {}),
          found,
        ];`;
      const [names, kind, ownKeys, asyncPrototype, found] = (await evalFunc(code, { methods: REFERENCE_PROBE_METHODS }, bridge)) as [
        string[],
        string,
        string[],
        boolean,
        number
      ];
      expect([...names].sort()).toEqual(await expectedNames("runQueryLibrary", "methods"));
      expect([kind, ownKeys, asyncPrototype, found]).toEqual(["function", ["length", "name"], true, 0]);
      expect(bridge.runQueryLibrary).not.toHaveBeenCalled();
    });
  });
});

describe("context and results", () => {
  test("a context object is a copy: changes stay inside the call", async () => {
    const context = { a: { b: 1 } };
    await expect(evalFunc("a.b = 2; return a.b", context)).resolves.toBe(2);
    expect(context.a.b).toBe(1);
  });

  test("the context wins over a built-in and over _", async () => {
    await expect(evalFunc("return [JSON, _]", { JSON: 5, _: 6 })).resolves.toEqual([5, 6]);
  });

  test.each(RUNNER_BUILTINS)("a context key %s that replaces a runner built-in leaves setup, results and errors working", async (name) => {
    const context = { [name]: 5, a: 1 };
    await expect(evalFunc(`return [typeof ${name}, a]`, context)).resolves.toEqual(["number", 1]);
    const rejection = evalFunc('throw new RangeError("r")', context);
    await expect(rejection).rejects.toBeInstanceOf(RangeError);
    await expect(rejection).rejects.toThrow("r");
  });

  test("context keys that replace runner built-ins do not break the bridge", async () => {
    const context = { Object: 5, JSON: 6, Error: 7, String: 8, globalThis: 9 };
    await expect(evalFunc('return await runQueryLibrary("q")', context, resolvingBridge({ rows: [1] }))).resolves.toEqual({
      rows: [1],
    });
    await expect(
      evalFunc('try { await runQueryLibrary("q") } catch (e) { return [e.name, e.message] }', context, rejectingBridge(new TypeError("t")))
    ).resolves.toEqual(["TypeError", "t"]);
  });

  test("a context key naming a non-configurable global is ignored", async () => {
    await expect(evalFunc("return [Number.isNaN(NaN), typeof undefined]", { NaN: 5, undefined: 1 })).resolves.toEqual([true, "undefined"]);
  });

  test.each([[["a", "b"]], ["ab"]])("a context that is not a JSON object is ignored (%p)", async (context) => {
    await expect(evalFunc("return Object.keys(globalThis).filter((k) => /^[0-9]+$/.test(k)).length", context)).resolves.toBe(0);
  });

  test("functions and undefined in the result are dropped as JSON does", async () => {
    await expect(evalFunc("return { f() {}, u: undefined, n: 1, d: new Date(0) }", {})).resolves.toEqual({
      n: 1,
      d: "1970-01-01T00:00:00.000Z",
    });
  });

  test.each([["a BigInt", "return 1n"], ["a cycle", "const o = {}; o.o = o; return o"]])(
    "a result JSON cannot represent (%s) rejects with TypeError",
    async (_name, code) => {
      await expect(evalFunc(code, {})).rejects.toBeInstanceOf(TypeError);
    }
  );

  test("the ECMAScript built-ins user code relies on are present", async () => {
    const hostTypes = STANDARD_NAMES.map((name) => typeof (globalThis as any)[name]);
    await expect(evalFunc("return names.map((n) => typeof globalThis[n])", { names: STANDARD_NAMES })).resolves.toEqual(hostTypes);
  });

  test("B6: JSON, Math and Date work in user code", async () => {
    await expect(
      evalFunc("return [JSON.stringify({ a: 1 }), Math.max(1, 3), new Date(0).getTime()]", {})
    ).resolves.toEqual(['{"a":1}', 3, 0]);
  });

  test("B23: a global from one evalFunc call is not visible in the next", async () => {
    await evalFunc("globalThis.leakedBetweenRequests = 'secret'", {});
    await expect(evalFunc("return typeof leakedBetweenRequests", {})).resolves.toBe("undefined");
  });
});

describe("errors", () => {
  test("a host error type thrown by user code keeps its type", async () => {
    await expect(evalFunc('return JSON.parse("{")', {})).rejects.toBeInstanceOf(SyntaxError);
  });

  test("an Error subclass keeps its name and message", async () => {
    const rejection = evalFunc('class MyErr extends Error { constructor(m) { super(m); this.name = "MyErr"; } } throw new MyErr("x")', {});
    await expect(rejection).rejects.toMatchObject({ name: "MyErr", message: "x" });
    expect(getErrorMessage(await rejection.catch((e) => e))).toBe("MyErr: x");
  });

  test("an error named like an Object.prototype member is not mistaken for a host error type", async () => {
    const error = await evalFunc('const e = new Error("x"); e.name = "constructor"; throw e', {}).catch((e) => e);
    expect(error).toBeInstanceOf(Error);
    expect(getErrorMessage(error)).toBe("constructor: x");
  });

  test("a thrown non-Error object rejects with undefined", async () => {
    await expect(evalFunc('throw { message: "x" }', {})).rejects.toBeUndefined();
  });

  test("a runner sabotaged by the code rejects with the isolate's own error", async () => {
    const code = 'Object.defineProperty(Error.prototype, "name", { get() { throw new RangeError("sabotaged"); } }); throw new Error("x")';
    await expect(evalFunc(code, {})).rejects.toThrow("sabotaged");
  });

  test.each([
    ["a toJSON that answers a number", "Object.prototype.toJSON = () => 5; return 1"],
    ["a toJSON that answers nothing", "Object.prototype.toJSON = () => undefined; return 1"],
  ])("an unreadable result (%s) rejects with a malformed-result error", async (_name, code) => {
    await expect(evalFunc(code, {})).rejects.toThrow("evaluation returned a malformed result");
  });
});

describe("parseEnvelope", () => {
  test("reads a result envelope and an error envelope", () => {
    expect(parseEnvelope('{"ok":true,"json":"1"}')).toEqual({ ok: true, json: "1" });
    expect(parseEnvelope('{"ok":true}')).toEqual({ ok: true });
    expect(parseEnvelope('{"ok":false,"thrown":{"kind":"string","text":"s"}}')).toEqual({ ok: false, thrown: { kind: "string", text: "s" } });
    expect(parseEnvelope('{"ok":false,"thrown":{"kind":"other"}}')).toEqual({ ok: false, thrown: { kind: "other" } });
  });

  test.each([
    ["undefined", undefined],
    ["a JSON number", "5"],
    ["JSON null", "null"],
    ["ok that is not a boolean", '{"ok":1}'],
    ["a result whose json is not a string", '{"ok":true,"json":5}'],
    ["an error without thrown", '{"ok":false}'],
    ["thrown that is null", '{"ok":false,"thrown":null}'],
    ["thrown of an unknown kind", '{"ok":false,"thrown":{"kind":"x"}}'],
    ["an error whose name is not a string", '{"ok":false,"thrown":{"kind":"error","name":1,"message":"m"}}'],
    ["a string whose text is not a string", '{"ok":false,"thrown":{"kind":"string","text":1}}'],
  ])("rejects %s as malformed", (_name, raw) => {
    expect(() => parseEnvelope(raw)).toThrow("evaluation returned a malformed result");
  });
});

describe("limits", () => {
  test("an endless loop is stopped after the timeout", async () => {
    const started = Date.now();
    const rejection = evalFunc("while (true) {}", {}, undefined, SHORT_LIMITS);
    await expect(rejection).rejects.toBeInstanceOf(EvalLimitError);
    await expect(rejection).rejects.toThrow(`execution exceeded ${SHORT_TIMEOUT_MS} ms`);
    expect(Date.now() - started).toBeLessThan(FAST_MS);
  });

  test("an endless loop stopped by the evalClosure backstop gives the same time-limit error", async () => {
    const realSetTimeout = global.setTimeout;
    // the deadline timer of SHORT_LIMITS is made inert, so only isolated-vm's own timeout can end the loop
    jest.spyOn(global, "setTimeout").mockImplementation(((handler: () => void, delay?: number, ...args: unknown[]) =>
      delay === SHORT_TIMEOUT_MS ? { unref: () => undefined } : realSetTimeout(handler, delay, ...args)) as typeof setTimeout);
    const started = Date.now();
    const rejection = evalFunc("while (true) {}", {}, undefined, SHORT_LIMITS);
    await expect(rejection).rejects.toBeInstanceOf(EvalLimitError);
    await expect(rejection).rejects.toThrow(`execution exceeded ${SHORT_TIMEOUT_MS} ms`);
    expect(Date.now() - started).toBeLessThan(BACKSTOP_TEST_MS);
  });

  test("a promise that never settles is stopped after the timeout", async () => {
    const started = Date.now();
    const rejection = evalFunc("await new Promise(() => {})", {}, undefined, SHORT_LIMITS);
    await expect(rejection).rejects.toBeInstanceOf(EvalLimitError);
    await expect(rejection).rejects.toThrow(`execution exceeded ${SHORT_TIMEOUT_MS} ms`);
    expect(Date.now() - started).toBeLessThan(FAST_MS);
  });

  test("an allocation beyond the memory limit gives the memory error and the next call works", async () => {
    await expect(
      evalFunc("const a = []; for (;;) a.push(new Array(1e5).fill(1));", {}, undefined, SMALL_HEAP_LIMITS)
    ).rejects.toThrow(`execution exceeded the ${SMALL_HEAP_LIMITS.memoryLimitMb} MB memory limit`);
    await expect(evalFunc("return 1", {})).resolves.toBe(1);
  });

  test("the evaluation limits have their documented values", () => {
    expect(EVAL_TIMEOUT_MS).toBe(30000);
    expect(EVAL_SYNC_BACKSTOP_MS).toBe(1000);
    expect(EVAL_MEMORY_LIMIT_MB).toBe(128);
    expect(EVAL_MAX_CONCURRENT_ISOLATES).toBe(8);
    expect(EVAL_MAX_QUEUED).toBe(32);
    expect(EVAL_QUEUE_WAIT_MS).toBe(10000);
    expect(DEFAULT_EVAL_LIMITS).toEqual({ timeoutMs: 30000, memoryLimitMb: 128, queueWaitMs: 10000 });
  });

  test("at most EVAL_MAX_CONCURRENT_ISOLATES evaluations run at once", async () => {
    const held = heldBridge();
    const calls = Array.from({ length: EVAL_MAX_CONCURRENT_ISOLATES + 1 }, () =>
      evalFunc('return await runQueryLibrary("q")', {}, held.bridge)
    );
    await waitUntil(() => held.state.calls === EVAL_MAX_CONCURRENT_ISOLATES);
    await sleep(SETTLE_MS);
    expect(held.state.calls).toBe(EVAL_MAX_CONCURRENT_ISOLATES);
    held.release();
    await expect(Promise.all(calls)).resolves.toEqual(calls.map(() => "released"));
    expect(held.state.calls).toBe(EVAL_MAX_CONCURRENT_ISOLATES + 1);
  });

  test("a call beyond the slot and queue bounds is rejected at once", async () => {
    const held = heldBridge();
    const admitted = Array.from({ length: EVAL_MAX_CONCURRENT_ISOLATES + EVAL_MAX_QUEUED }, () =>
      evalFunc('return await runQueryLibrary("q")', {}, held.bridge)
    );
    await waitUntil(() => held.state.calls === EVAL_MAX_CONCURRENT_ISOLATES);
    const rejection = evalFunc("return 1", {});
    await expect(rejection).rejects.toBeInstanceOf(EvalLimitError);
    await expect(rejection).rejects.toThrow(`too many evaluations waiting (${EVAL_MAX_QUEUED})`);
    held.release();
    await expect(Promise.all(admitted)).resolves.toEqual(admitted.map(() => "released"));
  });

  test("a call that waits longer than queueWaitMs for a slot is rejected and leaves the queue", async () => {
    const held = heldBridge();
    const running = Array.from({ length: EVAL_MAX_CONCURRENT_ISOLATES }, () =>
      evalFunc('return await runQueryLibrary("q")', {}, held.bridge)
    );
    await waitUntil(() => held.state.calls === EVAL_MAX_CONCURRENT_ISOLATES);
    const started = Date.now();
    const rejection = evalFunc("return 1", {}, undefined, SHORT_QUEUE_LIMITS);
    await expect(rejection).rejects.toBeInstanceOf(EvalLimitError);
    await expect(rejection).rejects.toThrow(`waited more than ${SHORT_QUEUE_LIMITS.queueWaitMs} ms for an evaluation slot`);
    expect(Date.now() - started).toBeLessThan(FAST_MS);
    held.release();
    await Promise.all(running);
    await expect(evalFunc("return 1", {})).resolves.toBe(1);
  });

  test("the wall-clock limit includes time spent in runQueryLibrary", async () => {
    const bridge: HostBridge = { runQueryLibrary: () => new Promise((resolve) => setTimeout(() => resolve("ok"), BRIDGE_DELAY_MS)) };
    const limits = { ...DEFAULT_EVAL_LIMITS, timeoutMs: BRIDGE_LIMIT_MS };
    await expect(evalFunc('return await runQueryLibrary("q")', {}, bridge, limits)).resolves.toBe("ok");
    await expect(evalFunc('await runQueryLibrary("q"); return await runQueryLibrary("q")', {}, bridge, limits)).rejects.toThrow(
      `execution exceeded ${BRIDGE_LIMIT_MS} ms`
    );
  });

  test("every path clears its deadline timer and disposes its isolate", async () => {
    const setSpy = jest.spyOn(global, "setTimeout");
    const clearSpy = jest.spyOn(global, "clearTimeout");
    const limits = { ...DEFAULT_EVAL_LIMITS, timeoutMs: DISTINCT_TIMEOUT_MS };
    await evalFunc("return 1", {}, undefined, limits);
    await expect(evalFunc("throw 'x'", {}, undefined, limits)).rejects.toBe("x");
    mockLifecycle.failNextCreateContext = true;
    await expect(evalFunc("return 1", {}, undefined, limits)).rejects.toThrow(SETUP_FAILED_MESSAGE);
    const deadlineTimers = setSpy.mock.results.filter((_result, index) => setSpy.mock.calls[index][1] === DISTINCT_TIMEOUT_MS);
    expect(deadlineTimers).toHaveLength(3);
    const cleared = clearSpy.mock.calls.map(([handle]) => handle);
    for (const timer of deadlineTimers) {
      expect(cleared).toContain(timer.value);
    }
    expect(mockLifecycle.dispose).toBe(3);
  });

  test("a setup failure releases its slot", async () => {
    for (let i = 0; i < SETUP_FAILURES; i += 1) {
      mockLifecycle.failNextCreateContext = true;
      await expect(evalFunc("return 1", {})).rejects.toThrow(SETUP_FAILED_MESSAGE);
    }
    const started = Date.now();
    await expect(evalFunc("return 1", {})).resolves.toBe(1);
    expect(Date.now() - started).toBeLessThan(FAST_MS);
  });

  test("a catastrophic isolate error is logged, halts new evaluations and aborts the process", async () => {
    const abort = jest.spyOn(process, "abort").mockImplementation((() => undefined) as () => never);
    const log = jest.spyOn(console, "error").mockImplementation(() => undefined);
    await jest.isolateModulesAsync(async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fresh: typeof import("./evalScript") = require("./evalScript");
      fresh.handleCatastrophicIsolateError("boom");
      expect(log).toHaveBeenCalledWith(expect.any(String), "boom");
      expect(abort).toHaveBeenCalledTimes(1);
      await expect(fresh.evalFunc("return 1", {})).rejects.toThrow("evaluation service halted after a catastrophic isolate error");
    });
  });
});

describe("host bridge", () => {
  test("runQueryLibrary receives plain copies and its result is copied in", async () => {
    const bridge = resolvingBridge({ rows: [1] });
    await expect(evalFunc('return await runQueryLibrary("q", { a: [1] })', {}, bridge)).resolves.toEqual({ rows: [1] });
    expect(bridge.runQueryLibrary).toHaveBeenCalledWith("q", { a: [1] });
  });

  test("without a bridge runQueryLibrary is undefined", async () => {
    await expect(evalFunc("return typeof runQueryLibrary", {})).resolves.toBe("undefined");
  });

  test("a bridge cannot be replaced by a context key of the same name", async () => {
    await expect(evalFunc("return typeof runQueryLibrary", { runQueryLibrary: 5 }, resolvingBridge(1))).resolves.toBe("function");
  });

  test("a query name that is not a string rejects inside the code and does not reach the bridge", async () => {
    const bridge = resolvingBridge("never");
    await expect(
      evalFunc("try { await runQueryLibrary(5) } catch (e) { return [e instanceof TypeError, e.message] }", {}, bridge)
    ).resolves.toEqual([true, "runQueryLibrary: the query name must be a string"]);
    expect(bridge.runQueryLibrary).not.toHaveBeenCalled();
  });

  test("params that are not an object reach the bridge as undefined", async () => {
    const bridge = resolvingBridge("ok");
    await expect(evalFunc('await runQueryLibrary("q", "x"); await runQueryLibrary("q", null); return 1', {}, bridge)).resolves.toBe(1);
    expect(bridge.runQueryLibrary).toHaveBeenCalledTimes(2);
    expect(bridge.runQueryLibrary).toHaveBeenNthCalledWith(1, "q", undefined);
    expect(bridge.runQueryLibrary).toHaveBeenNthCalledWith(2, "q", undefined);
  });

  test("a bridge failure reaches the code as an Error with the same name and message, or as the same string", async () => {
    await expect(
      evalFunc(
        'try { await runQueryLibrary("q") } catch (e) { return [e instanceof Error, e.name, e.message] }',
        {},
        rejectingBridge(new TypeError("t"))
      )
    ).resolves.toEqual([true, "TypeError", "t"]);
    await expect(evalFunc('try { await runQueryLibrary("q") } catch (e) { return e }', {}, rejectingBridge("s"))).resolves.toBe("s");
  });

  test("a bridge failure that is neither an Error nor a string reaches the code as undefined", async () => {
    await expect(
      evalFunc('try { await runQueryLibrary("q") } catch (e) { return typeof e }', {}, rejectingBridge({ code: 1 }))
    ).resolves.toBe("undefined");
  });

  test("a bridge result JSON cannot represent reaches the code as a TypeError", async () => {
    await expect(
      evalFunc('try { await runQueryLibrary("q") } catch (e) { return e.name }', {}, resolvingBridge(BigInt(1)))
    ).resolves.toBe("TypeError");
  });
});

describe("callHostBridge", () => {
  const bridge = (): HostBridge => ({ runQueryLibrary: jest.fn().mockResolvedValue("data") });

  test("answers ok with the bridge's data", async () => {
    const host = bridge();
    await expect(callHostBridge(host, JSON.stringify(["q", { a: 1 }]))).resolves.toBe('{"ok":true,"data":"data"}');
    expect(host.runQueryLibrary).toHaveBeenCalledWith("q", { a: 1 });
  });

  test.each([
    ["not a string", 5],
    ["a string that is not a JSON array", '{"a":1}'],
    ["a string that is not JSON", "{"],
  ])("an argument that is %s answers a TypeError without calling the bridge", async (_name, argument) => {
    const host = bridge();
    const reply = JSON.parse(await callHostBridge(host, argument));
    expect(reply).toEqual({ ok: false, thrown: { kind: "error", name: "TypeError", message: "bridge argument must be a JSON array string" } });
    expect(host.runQueryLibrary).not.toHaveBeenCalled();
  });

  test("a query name that is not a string answers a TypeError without calling the bridge", async () => {
    const host = bridge();
    const reply = JSON.parse(await callHostBridge(host, JSON.stringify([5])));
    expect(reply).toEqual({ ok: false, thrown: { kind: "error", name: "TypeError", message: "runQueryLibrary: the query name must be a string" } });
    expect(host.runQueryLibrary).not.toHaveBeenCalled();
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
