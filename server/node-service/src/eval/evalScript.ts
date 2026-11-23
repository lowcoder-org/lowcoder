import fs from "fs";
import ivm from "isolated-vm";
import { isPlainObject } from "lodash";

/** Wall clock per evaluation, measured from isolate creation; includes the time spent in `runQueryLibrary`. */
export const EVAL_TIMEOUT_MS = 30_000;
/** The `evalClosure` timeout is this far above the wall-clock deadline, so the deadline is the limit and the native timeout only a backstop for synchronous code. */
export const EVAL_SYNC_BACKSTOP_MS = 1_000;
/** Nominal heap limit of one isolate (isolated-vm's default; its minimum is 8). */
export const EVAL_MEMORY_LIMIT_MB = 128;
/** Live isolates in the process. */
export const EVAL_MAX_CONCURRENT_ISOLATES = 8;
/** Evaluations that may wait for a slot; one more is rejected at once. */
export const EVAL_MAX_QUEUED = 32;
/** The longest an evaluation waits for a slot. Waiting does not count against `EVAL_TIMEOUT_MS`. */
export const EVAL_QUEUE_WAIT_MS = 10_000;

export type EvalLimits = { timeoutMs: number; memoryLimitMb: number; queueWaitMs: number };

export const DEFAULT_EVAL_LIMITS: EvalLimits = {
  timeoutMs: EVAL_TIMEOUT_MS,
  memoryLimitMb: EVAL_MEMORY_LIMIT_MB,
  queueWaitMs: EVAL_QUEUE_WAIT_MS,
};

export type HostBridge = {
  runQueryLibrary: (query: string, params?: Record<string, any>) => Promise<unknown>;
};

/** A limit of the evaluation service was reached: time, memory, queue, or the service is halted. */
export class EvalLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvalLimitError";
  }
}

const HALTED_MESSAGE = "evaluation service halted after a catastrophic isolate error";
const MALFORMED_RESULT_MESSAGE = "evaluation returned a malformed result";
const BRIDGE_ARGUMENT_MESSAGE = "bridge argument must be a JSON array string";
const BRIDGE_QUERY_MESSAGE = "runQueryLibrary: the query name must be a string";

type HostErrorType = new (message?: string) => Error;

/** Error types rebuilt on the host with their own type; any other name becomes an `Error` carrying that name. */
const HOST_ERROR_TYPES = new Map<string, HostErrorType>([
  ["Error", Error],
  ["TypeError", TypeError],
  ["RangeError", RangeError],
  ["SyntaxError", SyntaxError],
  ["ReferenceError", ReferenceError],
  ["EvalError", EvalError],
  ["URIError", URIError],
]);

/** What crosses the isolate boundary for a thrown value: strings only, never an error object. */
type Thrown =
  | { kind: "error"; name: string; message: string }
  | { kind: "string"; text: string }
  | { kind: "other" };

/** The one JSON string the in-isolate runner resolves to. */
type Envelope = { ok: true; json?: string } | { ok: false; thrown: Thrown };

/** Runs first inside every new context: removes what user code has no use for and defines `window` and `self`. */
const BOOTSTRAP_SOURCE = `
delete globalThis.WebAssembly;
delete globalThis.SharedArrayBuffer;
delete globalThis.Atomics;
for (const name of ["window", "self"]) {
  Object.defineProperty(globalThis, name, { value: globalThis, writable: false, enumerable: false, configurable: false });
}
`;

/**
 * Body of the in-isolate runner (`evalClosure`): $0 = context JSON, $1 = user code, $2 = bridge reference or undefined.
 * It always resolves to one JSON string (an Envelope). Everything it needs is captured before any context key or
 * user code can replace a global, and it never reads a global afterwards. The bridge reference stays a local of this
 * closure; the global only gets the wrapper function that closes over it.
 */
const RUNNER_SOURCE = `
return (async () => {
  const root = globalThis;
  const { stringify, parse } = JSON;
  const { keys, getOwnPropertyDescriptor, defineProperty } = Object;
  const ErrorCtor = Error, StringCtor = String;
  const AsyncFunction = (async () => {}).constructor;
  const describe = (e) => e instanceof ErrorCtor ? { kind: "error", name: StringCtor(e.name), message: StringCtor(e.message) }
    : typeof e === "string" ? { kind: "string", text: e } : { kind: "other" };
  const standardErrors = [Error, TypeError, RangeError, SyntaxError, ReferenceError, EvalError, URIError];
  const rebuild = (t) => {
    if (t.kind !== "error") return undefined;
    let Known = ErrorCtor;
    for (let i = 0; i < standardErrors.length; i++) if (standardErrors[i].name === t.name) Known = standardErrors[i];
    const e = new Known(t.message);
    e.name = t.name;
    return e;
  };
  try {
    if ($2 !== undefined) defineProperty(root, "runQueryLibrary", { enumerable: true, writable: false, configurable: false, value: async (query, params) => {
      const reply = parse(await $2.apply(undefined, [stringify([query, params])], { result: { promise: true } }));
      if (reply.ok) return reply.data;
      throw reply.thrown.kind === "string" ? reply.thrown.text : rebuild(reply.thrown);
    } });
    const context = parse($0);
    for (const key of keys(context)) {
      const own = getOwnPropertyDescriptor(root, key);
      if (own && !own.configurable) continue;
      defineProperty(root, key, { value: context[key], writable: false, enumerable: true, configurable: false });
    }
    const result = await new AsyncFunction("'use strict';\\n" + $1).call(root);
    return stringify({ ok: true, json: stringify(result) });
  } catch (e) {
    return stringify({ ok: false, thrown: describe(e) });
  }
})();
`;

let lodashSource: string | undefined;

/** lodash runs inside every isolate, so user code gets its own `_`; the text is read once per process. */
function getLodashSource(): string {
  lodashSource ??= fs.readFileSync(require.resolve("lodash/lodash.min.js"), "utf8");
  return lodashSource;
}

let activeIsolates = 0;
let halted = false;

type SlotWaiter = { admit: () => void };
const slotWaiters: SlotWaiter[] = [];

function acquireIsolateSlot(queueWaitMs: number): Promise<void> {
  if (activeIsolates < EVAL_MAX_CONCURRENT_ISOLATES) {
    activeIsolates += 1;
    return Promise.resolve();
  }
  if (slotWaiters.length >= EVAL_MAX_QUEUED) {
    return Promise.reject(new EvalLimitError(`too many evaluations waiting (${EVAL_MAX_QUEUED})`));
  }
  return new Promise<void>((resolve, reject) => {
    const waiter: SlotWaiter = {
      admit: () => {
        clearTimeout(timer);
        resolve();
      },
    };
    const timer = setTimeout(() => {
      slotWaiters.splice(slotWaiters.indexOf(waiter), 1);
      reject(new EvalLimitError(`waited more than ${queueWaitMs} ms for an evaluation slot`));
    }, queueWaitMs);
    slotWaiters.push(waiter);
  });
}

/** The slot goes to the oldest waiter; with nobody waiting it becomes free. */
function releaseIsolateSlot(): void {
  const next = slotWaiters.shift();
  if (next) {
    next.admit();
  } else {
    activeIsolates -= 1;
  }
}

function timeLimitError(limits: EvalLimits): EvalLimitError {
  return new EvalLimitError(`execution exceeded ${limits.timeoutMs} ms`);
}

function disposeIsolate(isolate: ivm.Isolate): void {
  if (!isolate.isDisposed) {
    isolate.dispose();
  }
}

/**
 * `onCatastrophicError` of every isolate: V8 lost control of an isolate and everything it held is unrecoverable
 * (isolated-vm's own guidance is to end the process). Exported for its test.
 */
export function handleCatastrophicIsolateError(message: string): void {
  console.error("isolated-vm catastrophic error, aborting node-service:", message);
  halted = true;
  process.abort();
}

function describeThrown(e: unknown): Thrown {
  if (e instanceof Error) {
    return { kind: "error", name: String(e.name), message: String(e.message) };
  }
  return typeof e === "string" ? { kind: "string", text: e } : { kind: "other" };
}

/** The bridge argument is one JSON string; anything else, including text that is not JSON, is not an argument list. */
function parseBridgeArguments(argument: unknown): unknown {
  if (typeof argument !== "string") {
    return undefined;
  }
  try {
    return JSON.parse(argument);
  } catch {
    return undefined;
  }
}

/**
 * The host function behind the bridge reference. It takes one JSON string, checks it before the bridge sees it,
 * and always answers one JSON string: it never rejects, so no error object crosses the boundary. Exported for its test.
 */
export async function callHostBridge(bridge: HostBridge, argument: unknown): Promise<string> {
  try {
    const args = parseBridgeArguments(argument);
    if (!Array.isArray(args)) {
      return JSON.stringify({ ok: false, thrown: { kind: "error", name: "TypeError", message: BRIDGE_ARGUMENT_MESSAGE } });
    }
    const [query, params] = args;
    if (typeof query !== "string") {
      return JSON.stringify({ ok: false, thrown: { kind: "error", name: "TypeError", message: BRIDGE_QUERY_MESSAGE } });
    }
    const data = await bridge.runQueryLibrary(query, typeof params === "object" && params !== null ? params : undefined);
    return JSON.stringify({ ok: true, data });
  } catch (e) {
    return JSON.stringify({ ok: false, thrown: describeThrown(e) });
  }
}

function isThrown(value: unknown): value is Thrown {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const thrown = value as Record<string, unknown>;
  switch (thrown.kind) {
    case "error":
      return typeof thrown.name === "string" && typeof thrown.message === "string";
    case "string":
      return typeof thrown.text === "string";
    default:
      return thrown.kind === "other";
  }
}

function isEnvelope(value: unknown): value is Envelope {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const envelope = value as Record<string, unknown>;
  if (envelope.ok === true) {
    return envelope.json === undefined || typeof envelope.json === "string";
  }
  return envelope.ok === false && isThrown(envelope.thrown);
}

/**
 * Reads what the runner resolved to. User code that changes a prototype the runner serialises with
 * (`Object.prototype.toJSON`) can make it unreadable; that is an error, not a result. Exported for its test.
 */
export function parseEnvelope(raw: unknown): Envelope {
  const parsed: unknown = typeof raw === "string" ? JSON.parse(raw) : undefined;
  if (!isEnvelope(parsed)) {
    throw new Error(MALFORMED_RESULT_MESSAGE);
  }
  return parsed;
}

/** The rejection is built from strings only. */
function toHostThrown(thrown: Thrown): unknown {
  switch (thrown.kind) {
    case "error": {
      const ErrorType = HOST_ERROR_TYPES.get(thrown.name);
      if (ErrorType) {
        return new ErrorType(thrown.message);
      }
      const error = new Error(thrown.message);
      error.name = thrown.name;
      return error;
    }
    case "string":
      return thrown.text;
    default:
      return undefined;
  }
}

async function runInIsolate(
  isolate: ivm.Isolate,
  functionBody: string,
  contextJson: string,
  bridgeReference: ivm.Reference | undefined,
  limits: EvalLimits
): Promise<unknown> {
  const context = await isolate.createContext();
  const syncOptions = { timeout: limits.timeoutMs };
  await (await isolate.compileScript(BOOTSTRAP_SOURCE)).run(context, syncOptions);
  await (await isolate.compileScript(getLodashSource())).run(context, syncOptions);
  return context.evalClosure(RUNNER_SOURCE, [contextJson, functionBody, bridgeReference], {
    result: { promise: true },
    timeout: limits.timeoutMs + EVAL_SYNC_BACKSTOP_MS,
  });
}

export function getErrorMessage(err: unknown) {
  const errorMesasge =
    err instanceof Error
      ? err.name + ": " + err.message
      : typeof err === "string"
      ? err
      : "UnknownError: unknown exception during eval";
  return errorMesasge;
}

/**
 * Evaluates `functionBody` (the body of an async function) in a new V8 isolate with its own built-ins and a
 * fresh global, and resolves to the JSON-serialisable result or rejects with the error the code threw.
 * `context` (a plain object; anything else is ignored) becomes read-only globals, as a copy; `bridge`, when given,
 * becomes the global `runQueryLibrary`. Only JSON strings and the one bridge reference cross the boundary, and the
 * bridge's cookie never enters the isolate.
 *
 * Limits (per call, not per caller): `limits.timeoutMs` wall clock including time inside the bridge,
 * `limits.memoryLimitMb` heap, at most EVAL_MAX_CONCURRENT_ISOLATES evaluations at once and EVAL_MAX_QUEUED waiting
 * for up to `limits.queueWaitMs`; a limit rejects with `EvalLimitError`.
 *
 * Not covered:
 * - an isolate is a separate V8 heap in the same OS process, not an OS sandbox: a V8 or isolated-vm bug can still
 *   mean code execution as the service's user;
 * - the memory limit is approximate: isolated-vm documents that hostile code may reach 2-3 times the limit;
 * - there is no cancellation: a queued call whose client disconnected still waits for its slot, and an admitted
 *   call runs until it settles or reaches the time limit;
 * - a catastrophic isolate error logs and aborts the whole process (handleCatastrophicIsolateError); calls in
 *   flight are lost and later calls of that process reject with an EvalLimitError;
 * - timing side channels between isolates, and one caller occupying every slot and queue place, are not addressed.
 */
export async function evalFunc(
  functionBody: string,
  context: unknown,
  bridge?: HostBridge,
  limits: EvalLimits = DEFAULT_EVAL_LIMITS
): Promise<unknown> {
  if (halted) {
    throw new EvalLimitError(HALTED_MESSAGE);
  }
  await acquireIsolateSlot(limits.queueWaitMs);
  let isolate: ivm.Isolate | undefined;
  let timer: NodeJS.Timeout | undefined;
  let bridgeReference: ivm.Reference | undefined;
  try {
    const created = new ivm.Isolate({
      memoryLimit: limits.memoryLimitMb,
      onCatastrophicError: handleCatastrophicIsolateError,
    });
    isolate = created;
    const startedAt = performance.now();
    let timedOut = false;
    let expire: (reason: Error) => void = () => undefined;
    const deadline = new Promise<never>((_resolve, reject) => {
      expire = reject;
    });
    timer = setTimeout(() => {
      timedOut = true;
      disposeIsolate(created);
      expire(timeLimitError(limits));
    }, limits.timeoutMs);
    timer.unref();
    if (bridge) {
      bridgeReference = new ivm.Reference((argument: unknown) => callHostBridge(bridge, argument));
    }
    const contextJson = JSON.stringify(isPlainObject(context) ? context : {});
    let raw: unknown;
    try {
      raw = await Promise.race([runInIsolate(created, functionBody, contextJson, bridgeReference, limits), deadline]);
    } catch (e) {
      // classified by the deadline, not by which mechanism fired or by its message text
      if (timedOut || performance.now() - startedAt >= limits.timeoutMs) {
        throw timeLimitError(limits);
      }
      if (created.isDisposed) {
        throw new EvalLimitError(`execution exceeded the ${limits.memoryLimitMb} MB memory limit`);
      }
      throw e;
    }
    const envelope = parseEnvelope(raw);
    if (envelope.ok) {
      return envelope.json === undefined ? undefined : JSON.parse(envelope.json);
    }
    throw toHostThrown(envelope.thrown);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    bridgeReference?.release();
    if (isolate !== undefined) {
      disposeIsolate(isolate);
    }
    releaseIsolateSlot();
  }
}
