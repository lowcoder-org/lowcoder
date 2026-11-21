import type { APIRequestContext } from "@playwright/test";
import { expect } from "@playwright/test";
import { getAppDsl } from "../api/client";
import { SAVE_POLL_TIMEOUT_MS } from "../constants";
import { button, eventHandler, input, moduleApp, stackItems, text, triggerModuleEvent, executeComp, type DslItem } from "../dsl/builders";

/**
 * Names, test ids and DSL shared by the module scenarios M1 to M3 (client/E2E-TESTING-components-p6-module-scenarios-plan.md):
 * one module with an input, a text showing it, a button that raises an event, an output and a method.
 */
export const MODULE_SCENARIO = {
  INPUT: "moduleInput1",
  OUTPUT: "output1",
  EVENT: "event1",
  METHOD: "method1",
  STATE: "state1",
  FIRED_VALUE: "event1-fired",
  METHOD_VALUE: "set-by-method",
  FIRST_INSTANCE: "module1",
  SECOND_INSTANCE: "module2",
  /** The module's inner input component name and the test ids of its parts (repeated once per instance). */
  INNER_INPUT_NAME: "input1",
  INNER_INPUT_ID: "m-input",
  INNER_TEXT_ID: "m-text",
  INNER_FIRE_ID: "m-fire",
  /** Test ids of the host's own texts and button. */
  HOST_OUT_ID: "t-out",
  HOST_STATE_ID: "t-state",
  HOST_CALL_ID: "b-call",
  /** The text of the module's text component, with `{{moduleInput1.value}}` its input. */
  TEXT_TEMPLATE: "in={{moduleInput1.value}}",
} as const;

/** `actionTimeout` of the module specs that drive the editor: a stuck click fails in this time, not at the test timeout. */
export const MODULE_ACTION_TIMEOUT_MS = 10_000;
/** The time limit of the specs that save through the editor (retried once by D-3 retry; p7 section 1). */
export const EDITOR_SAVE_SPEC_TIMEOUT_MS = 180_000;
/** Annotation type of M3's handler retry (p7 section 1; the D-3 retry's is `D3_RETRY_ANNOTATION`); the PR lists every one of the gate runs. */
export const HANDLER_RETRY_ANNOTATION = "handler retry";
/** Handler retries of one M3 test, over all its D-3 attempts (p7 section 1, "Retry ownership"). */
export const HANDLER_RETRY_LIMIT = 1;

/**
 * The handler-retry budget of one test: counted over the whole test, so the fresh app of a D-3 retry does not reset it.
 * A step-4 failure after the budget is spent fails the test instead of starting another retry.
 */
export class HandlerRetryBudget {
  private spentRetries = 0;

  get available(): boolean {
    return this.spentRetries < HANDLER_RETRY_LIMIT;
  }

  get spent(): number {
    return this.spentRetries;
  }

  /** Uses the one retry; throws when it is already spent, so a second use cannot go unnoticed. */
  spend(): void {
    if (!this.available) {
      throw new Error(`the handler retry budget of ${HANDLER_RETRY_LIMIT} is already spent`);
    }
    this.spentRetries += 1;
  }
}

/** How long a mounted host is observed for a module republished under it (the 4 s of the probe, defect O-13). */
export const MOUNTED_HOST_OBSERVATION_MS = 4_000;

/** The module of M1 to M3. `textTemplate` is the module text's expression; M2 changes it to tell versions apart. */
export function scenarioModuleDsl(textTemplate: string = MODULE_SCENARIO.TEXT_TEMPLATE): object {
  return moduleApp({
    inputs: [{ name: MODULE_SCENARIO.INPUT }],
    outputs: [{ name: MODULE_SCENARIO.OUTPUT, value: `{{${MODULE_SCENARIO.INNER_INPUT_NAME}.value}}` }],
    methods: [
      {
        name: MODULE_SCENARIO.METHOD,
        action: executeComp(MODULE_SCENARIO.INNER_INPUT_NAME, "setValue", [{ name: "value", value: MODULE_SCENARIO.METHOD_VALUE }]),
      },
    ],
    events: [MODULE_SCENARIO.EVENT],
    items: scenarioModuleItems(textTemplate),
  });
}

function scenarioModuleItems(textTemplate: string): DslItem[] {
  return stackItems([
    input({ id: "i1", name: MODULE_SCENARIO.INNER_INPUT_NAME, testId: MODULE_SCENARIO.INNER_INPUT_ID }),
    text({ id: "t1", name: "text1", testId: MODULE_SCENARIO.INNER_TEXT_ID, text: textTemplate }),
    button({
      id: "b1",
      name: "button1",
      text: "Fire",
      testId: MODULE_SCENARIO.INNER_FIRE_ID,
      onEvent: [eventHandler("click", triggerModuleEvent(MODULE_SCENARIO.EVENT))],
    }),
  ]);
}

/** A module instance as the editor saves it, reduced to what the scenarios read. */
export interface SavedModuleInstance {
  name: string;
  compType: string;
  comp: {
    appId: string;
    inputs?: Record<string, string>;
    events?: { name: string; handler: { compType: string; comp: { name: string; params?: { comp: string }[] } } }[];
  };
}

/** Thrown when the saved DSL did not come to hold an edit within `timeoutMs`: the D-3 symptom (a lost save). */
export class SavedDslTimeoutError extends Error {
  constructor(
    readonly stage: string,
    readonly appId: string,
    cause: string,
    timeoutMs: number = SAVE_POLL_TIMEOUT_MS,
  ) {
    super(`saved DSL of app ${appId} did not hold "${stage}" within ${timeoutMs} ms: ${cause}`);
    this.name = "SavedDslTimeoutError";
  }
}

/** The saved (draft) instance of a module named `name` in app `appId`, or undefined when the DSL has none. */
export async function readSavedInstance(
  request: APIRequestContext,
  appId: string,
  name: string,
): Promise<SavedModuleInstance | undefined> {
  const dsl = (await getAppDsl(request, appId)).applicationDSL as { ui?: { items?: Record<string, SavedModuleInstance> } };
  return Object.values(dsl.ui?.items ?? {}).find((item) => item.compType === "module" && item.name === name);
}

/** Whether `error` is the failure of the `toEqual` of an `expect.poll` (the value never became equal): it carries `matcherResult`. */
function isEqualityFailure(error: unknown): boolean {
  return error instanceof Error && typeof (error as { matcherResult?: unknown }).matcherResult === "object";
}

/**
 * Polls the saved DSL until `read(instance)` returns `expected`; when it never does within `options.timeoutMs`
 * (default SAVE_POLL_TIMEOUT_MS) throws SavedDslTimeoutError (not an assertion error), so a caller can tell a lost
 * save from any other failure. Only that equality timeout is wrapped: an error of the API call, of the DSL's shape or
 * of `read` itself propagates unchanged, so a real regression is not retried as D-3. The poll is the suite's save wait.
 */
export async function waitForSavedInstance<T>(
  request: APIRequestContext,
  appId: string,
  instanceName: string,
  stage: string,
  read: (instance: SavedModuleInstance | undefined) => T,
  expected: T,
  options: { timeoutMs?: number } = {},
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? SAVE_POLL_TIMEOUT_MS;
  let pollFailure: unknown;
  try {
    await expect
      .poll(
        async () => {
          try {
            return read(await readSavedInstance(request, appId, instanceName));
          } catch (error) {
            pollFailure = error;
            throw error;
          }
        },
        { timeout: timeoutMs, message: `the saved ${instanceName} of ${appId} holds ${stage}` },
      )
      .toEqual(expected);
  } catch (error) {
    if (error === pollFailure || !isEqualityFailure(error)) {
      throw error;
    }
    const message = (error as Error).message;
    throw new SavedDslTimeoutError(stage, appId, message.split("\n")[0] ?? message, timeoutMs);
  }
}
