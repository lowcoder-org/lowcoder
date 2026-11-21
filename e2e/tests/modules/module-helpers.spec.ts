import type { APIRequestContext } from "@playwright/test";
import { LowcoderApiError } from "../../src/api/client";
import { API_OK } from "../../src/constants";
import { expect, test } from "../../src/fixtures";
import {
  HANDLER_RETRY_LIMIT,
  HandlerRetryBudget,
  MODULE_SCENARIO as M,
  SavedDslTimeoutError,
  scenarioModuleDsl,
  waitForSavedInstance,
  type SavedModuleInstance,
} from "../../src/modules/moduleScenario";

const APP_ID = "app-1";
const INSTANCE = M.FIRST_INSTANCE;
const STAGE = "module1's input";
/** The poll's timeout in these tests: long enough for several polls (intervals 100, 250, 500 ms), short enough to be cheap. */
const SHORT_POLL_TIMEOUT_MS = 1_500;
const HTTP_SERVER_ERROR = 500;

/** A request context whose `get` answers with `body` and `status`: no stack needed for the saved-DSL poll. */
function requestAnswering(status: number, body: unknown): APIRequestContext {
  const response = { text: async () => JSON.stringify(body), status: () => status, ok: () => status < HTTP_SERVER_ERROR };
  return { get: async () => response } as unknown as APIRequestContext;
}

/** A saved DSL holding one module instance `INSTANCE` with the given input value. */
function savedDslWithInput(value: string): unknown {
  const item = { name: INSTANCE, compType: "module", comp: { appId: "m", inputs: { [M.INPUT]: value } } };
  return { code: API_OK, data: { applicationDSL: { ui: { items: { i1: item } } } } };
}

const inputOf = (instance: SavedModuleInstance | undefined): string | undefined => instance?.comp.inputs?.[M.INPUT];

test.describe("helpers of the module scenarios", () => {
  test("waitForSavedInstance returns when the saved instance holds the expected value", async () => {
    await waitForSavedInstance(requestAnswering(200, savedDslWithInput("alpha")), APP_ID, INSTANCE, STAGE, inputOf, "alpha", {
      timeoutMs: SHORT_POLL_TIMEOUT_MS,
    });
  });

  test("waitForSavedInstance wraps an equality timeout, and only that, as SavedDslTimeoutError", async () => {
    const failure = await waitForSavedInstance(requestAnswering(200, savedDslWithInput("alpha")), APP_ID, INSTANCE, STAGE, inputOf, "beta", {
      timeoutMs: SHORT_POLL_TIMEOUT_MS,
    }).catch((error: unknown) => error);

    expect(failure, "a value that never arrives is the D-3 symptom").toBeInstanceOf(SavedDslTimeoutError);
    expect((failure as SavedDslTimeoutError).appId).toBe(APP_ID);
    expect((failure as SavedDslTimeoutError).stage).toBe(STAGE);
    expect((failure as Error).message, "the timeout used is named").toContain(`${SHORT_POLL_TIMEOUT_MS} ms`);
  });

  test("waitForSavedInstance lets an API failure propagate unchanged", async () => {
    const failure = await waitForSavedInstance(
      requestAnswering(HTTP_SERVER_ERROR, { code: 0, message: "boom" }),
      APP_ID,
      INSTANCE,
      STAGE,
      inputOf,
      "alpha",
      { timeoutMs: SHORT_POLL_TIMEOUT_MS },
    ).catch((error: unknown) => error);

    expect(failure, "an HTTP 500 is an API error, not a lost save").toBeInstanceOf(LowcoderApiError);
    expect(failure).not.toBeInstanceOf(SavedDslTimeoutError);
  });

  test("waitForSavedInstance lets a malformed DSL and a failing reader propagate unchanged", async () => {
    const malformed = await waitForSavedInstance(requestAnswering(200, { code: API_OK, data: {} }), APP_ID, INSTANCE, STAGE, inputOf, "alpha", {
      timeoutMs: SHORT_POLL_TIMEOUT_MS,
    }).catch((error: unknown) => error);
    expect(malformed, "an app without applicationDSL").toBeInstanceOf(TypeError);

    const readerBug = new RangeError("reader bug");
    const reading = await waitForSavedInstance(
      requestAnswering(200, savedDslWithInput("alpha")),
      APP_ID,
      INSTANCE,
      STAGE,
      () => {
        throw readerBug;
      },
      "alpha",
      { timeoutMs: SHORT_POLL_TIMEOUT_MS },
    ).catch((error: unknown) => error);
    expect(reading, "the reader's own error, the same object").toBe(readerBug);
  });

  test("the handler retry budget is one per test and a second use is refused", () => {
    const budget = new HandlerRetryBudget();
    expect(budget.available, "unused").toBe(true);
    expect(budget.spent).toBe(0);

    for (let use = 0; use < HANDLER_RETRY_LIMIT; use += 1) {
      budget.spend();
    }

    expect(HANDLER_RETRY_LIMIT, "p7 section 1: at most one handler retry").toBe(1);
    expect(budget.available, "spent by attempt 1, so attempt 2 of a D-3 retry has none").toBe(false);
    expect(budget.spent).toBe(HANDLER_RETRY_LIMIT);
    expect(() => budget.spend(), "a second retry").toThrow(/already spent/);
    expect(new HandlerRetryBudget().available, "another test starts with a fresh budget").toBe(true);
  });

  test("scenarioModuleDsl puts the given text template into the module's text and declares its interface", () => {
    const dsl = scenarioModuleDsl("X={{a}}") as {
      ui: { comp: { io: { inputs: { name: string }[]; outputs: { name: string }[] }; methods: { name: string }[]; events: { list: { name: string }[] }; container: { items: Record<string, { comp: { text?: string } }> } } };
    };
    const comp = dsl.ui.comp;

    expect(comp.io.inputs.map((entry) => entry.name)).toEqual([M.INPUT]);
    expect(comp.io.outputs.map((entry) => entry.name)).toEqual([M.OUTPUT]);
    expect(comp.methods.map((entry) => entry.name)).toEqual([M.METHOD]);
    expect(comp.events.list.map((entry) => entry.name)).toEqual([M.EVENT]);
    expect(comp.container.items.t1?.comp.text, "the text template").toBe("X={{a}}");
    expect((scenarioModuleDsl() as typeof dsl).ui.comp.container.items.t1?.comp.text, "the default template").toBe(M.TEXT_TEMPLATE);
  });
});
