import type { Page, TestInfo } from "@playwright/test";
import { createApp, createModule, getAppDsl, publishApp, updateApp } from "../../src/api/client";
import { D3_RETRY_ANNOTATION, TAGS } from "../../src/constants";
import { appDsl, tempState, text } from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";
import { expectTextStays } from "../../src/logic/helpers";
import {
  EDITOR_SAVE_SPEC_TIMEOUT_MS,
  HANDLER_RETRY_ANNOTATION,
  HandlerRetryBudget,
  MODULE_ACTION_TIMEOUT_MS,
  MODULE_SCENARIO as M,
  readSavedInstance,
  SavedDslTimeoutError,
  scenarioModuleDsl,
  waitForSavedInstance,
} from "../../src/modules/moduleScenario";
import { AppViewPage } from "../../src/pages/AppViewPage";
import { EditorPage } from "../../src/pages/EditorPage";
import { PropertyPanel } from "../../src/pages/PropertyPanel";

const MODULE_NAME = "e2e-m3-module";
const FIRST_DROP = { x: 200, y: 40 } as const;
const SECOND_DROP = { x: 200, y: 450 } as const;
const FIRST_INPUT = "alpha";
const SECOND_INPUT = "beta";
const HOST_STATE_TEXT_ID_NAME = "tState";
/** Rows between the lowest saved item and the text added to the host before it is published. */
const TEXT_GAP_ROWS = 2;
const TEXT_HEIGHT_ROWS = 5;

// M3 saves through the editor, so it carries the D-3 retry and the handler retry and no Playwright retry (the config adds
// one under CI, which would multiply the documented ones). The longer limit holds two attempts and the handler retry.
test.describe.configure({ retries: 0, timeout: EDITOR_SAVE_SPEC_TIMEOUT_MS });
test.use({ actionTimeout: MODULE_ACTION_TIMEOUT_MS });

// The D-3 gate counts the retry annotations of the repeated runs, and the reporters of a shared checkout
// overwrite each other's files: every run prints its own, one line per annotation.
test.afterEach(({}, testInfo) => {
  for (const { type, description } of testInfo.annotations) {
    console.log(`ANNOTATION ${testInfo.title.slice(0, 20)} repeat=${testInfo.repeatEachIndex} ${type}: ${description}`);
  }
});


function annotate(testInfo: TestInfo, type: string, description: string): void {
  testInfo.annotations.push({ type, description });
}

/** Thrown when the handler's save is still missing after the one handler retry: fails the test, no D-3 retry. */
class HandlerSaveError extends Error {
  constructor(appId: string, cause: string) {
    super(`the saved module2 handler of app ${appId} is not setTempState/${M.STATE}/${M.FIRED_VALUE} after the handler retry: ${cause}`);
    this.name = "HandlerSaveError";
  }
}

const handlerKey = (instance: Awaited<ReturnType<typeof readSavedInstance>>): string => {
  const handler = instance?.comp.events?.[0]?.handler;
  return `${handler?.compType}|${handler?.comp.name}|${handler?.comp.params?.[0]?.comp}`;
};
const EXPECTED_HANDLER = `setTempState|${M.STATE}|${M.FIRED_VALUE}`;

/**
 * One attempt of the editor steps on a fresh host app. A saved-DSL poll that times out (a lost save, D-3) throws
 * SavedDslTimeoutError, except the one of the handler (step 4), which belongs to the handler retry.
 */
async function buildHostInEditor(
  page: Page,
  testInfo: TestInfo,
  retries: HandlerRetryBudget,
  params: { orgId: string; moduleId: string; attempt: number },
): Promise<string> {
  const { appId } = await createApp(page.request, {
    orgId: params.orgId,
    name: `e2e-m3-host-${params.attempt}`,
    dsl: appDsl([], { tempStates: [tempState({ id: "s1", name: M.STATE, value: "null" })] }),
  });
  const editor = new EditorPage(page);
  const properties = new PropertyPanel(page);
  const saved = <T>(instance: string, stage: string, read: Parameters<typeof waitForSavedInstance<T>>[4], expected: T) =>
    waitForSavedInstance(page.request, appId, instance, stage, read, expected);

  await editor.open(appId);

  // 1. two drags: module1, module2 (the last dropped is selected)
  for (const [index, target] of [FIRST_DROP, SECOND_DROP].entries()) {
    const instanceName = `module${index + 1}`;
    await editor.dragModule(MODULE_NAME, target);
    await expect(page.getByRole("treeitem", { name: instanceName }), `${instanceName} is listed in Active Components`).toBeVisible();
    await saved(instanceName, `the dropped ${instanceName}`, (instance) => instance?.name, instanceName);
  }

  // 2. the input of module2
  await editor.selectInComponentList(M.SECOND_INSTANCE);
  await properties.setValue(M.INPUT, SECOND_INPUT);
  await saved(M.SECOND_INSTANCE, "module2's input", (instance) => instance?.comp.inputs?.[M.INPUT], SECOND_INPUT);

  // 3. an event handler
  await properties.addEventHandler();
  await saved(M.SECOND_INSTANCE, "module2's event handler", (instance) => instance?.comp.events?.[0]?.name, M.EVENT);

  // 4. its action: set the temporary state. The handler retry owns a failed step and a timeout of this save poll.
  await properties.setTempStateAction(M.STATE, M.FIRED_VALUE, {
    eventName: M.EVENT,
    // One handler retry per test, over all D-3 attempts: when attempt 1 spent it, a failure here fails the test.
    retryAllowed: retries.available,
    onRetry: (reason) => {
      retries.spend();
      annotate(testInfo, HANDLER_RETRY_ANNOTATION, `app ${appId}: ${reason}`);
    },
  });
  try {
    await waitForSavedInstance(page.request, appId, M.SECOND_INSTANCE, "module2's handler", handlerKey, EXPECTED_HANDLER);
  } catch (error) {
    if (!(error instanceof SavedDslTimeoutError) || !retries.available) {
      throw error instanceof SavedDslTimeoutError ? new HandlerSaveError(appId, error.message) : error;
    }
    retries.spend();
    annotate(testInfo, HANDLER_RETRY_ANNOTATION, `app ${appId}: ${error.message}`);
    await properties.reenterTempStateAction(M.STATE, M.FIRED_VALUE, M.EVENT);
    await waitForSavedInstance(page.request, appId, M.SECOND_INSTANCE, "module2's handler after the handler retry", handlerKey, EXPECTED_HANDLER).catch(
      (retryError: unknown) => {
        throw retryError instanceof SavedDslTimeoutError ? new HandlerSaveError(appId, retryError.message) : retryError;
      },
    );
  }

  // 5-6. the input of module1
  await editor.selectInComponentList(M.FIRST_INSTANCE);
  await properties.setValue(M.INPUT, FIRST_INPUT);
  await saved(M.FIRST_INSTANCE, "module1's input", (instance) => instance?.comp.inputs?.[M.INPUT], FIRST_INPUT);
  return appId;
}

/** The host's saved DSL plus a text showing the temporary state (the editor part is done), ready to publish. */
async function addStateText(page: Page, appId: string): Promise<void> {
  const savedDsl = (await getAppDsl(page.request, appId)).applicationDSL as {
    ui: { layout: Record<string, { y: number; h: number }>; items: Record<string, object> };
  };
  const lowestRow = Math.max(...Object.values(savedDsl.ui.layout).map((entry) => entry.y + entry.h));
  const stateText = text({
    id: "tstate",
    name: HOST_STATE_TEXT_ID_NAME,
    testId: M.HOST_STATE_ID,
    text: `state={{${M.STATE}.value}}`,
    y: lowestRow + TEXT_GAP_ROWS,
  });
  const positions = Object.keys(savedDsl.ui.layout).length;
  await updateApp(page.request, appId, {
    dsl: {
      ...savedDsl,
      ui: {
        layout: { ...savedDsl.ui.layout, [stateText.id]: { i: stateText.id, ...stateText.layout, h: TEXT_HEIGHT_ROWS, pos: positions } },
        items: { ...savedDsl.ui.items, [stateText.id]: stateText.item },
      },
    },
  });
}

test("a host built in the editor: two module instances, an input, and an event handler that sets a state", {
  tag: TAGS.SLOW,
}, async ({ page, apiUser }, testInfo) => {
  const { appId: moduleId } = await createModule(page.request, { orgId: apiUser.orgId, name: MODULE_NAME, dsl: scenarioModuleDsl() });
  await publishApp(page.request, moduleId);
  const retries = new HandlerRetryBudget();

  // D-3 retry: a lost save redoes the editor steps once on a fresh app; a second lost save fails the test.
  let appId: string;
  try {
    appId = await buildHostInEditor(page, testInfo, retries, { orgId: apiUser.orgId, moduleId, attempt: 1 });
  } catch (error) {
    if (!(error instanceof SavedDslTimeoutError)) {
      throw error;
    }
    annotate(testInfo, D3_RETRY_ANNOTATION, `app ${error.appId}: ${error.message}`);
    appId = await buildHostInEditor(page, testInfo, retries, { orgId: apiUser.orgId, moduleId, attempt: 2 });
  }

  // The saved DSL (the last poll above guarded this read).
  const first = await readSavedInstance(page.request, appId, M.FIRST_INSTANCE);
  const second = await readSavedInstance(page.request, appId, M.SECOND_INSTANCE);
  expect(first?.comp.appId, "module1 points at the module").toBe(moduleId);
  expect(first?.comp.inputs, "module1's input").toEqual({ [M.INPUT]: FIRST_INPUT });
  expect(first?.comp.events ?? [], "module1 has no handler").toEqual([]);
  expect(second?.comp.appId, "module2 points at the module").toBe(moduleId);
  expect(second?.comp.inputs, "module2's input").toEqual({ [M.INPUT]: SECOND_INPUT });
  expect(second?.comp.events?.[0]?.name, "module2's handler is for the module's event").toBe(M.EVENT);
  expect(handlerKey(second), "module2's handler action").toBe(EXPECTED_HANDLER);

  // Publish and view. Leave the editor first, so that it cannot save over the DSL that is changed by API next.
  await page.goto("about:blank");
  await addStateText(page, appId);
  await publishApp(page.request, appId);
  const view = new AppViewPage(page);
  const module1 = view.inModule(M.FIRST_INSTANCE);
  const module2 = view.inModule(M.SECOND_INSTANCE);

  await view.open(appId);
  await expect(module1.getByTestId(M.INNER_TEXT_ID), "the view shows module1's input").toHaveText(`in=${FIRST_INPUT}`);
  await expect(module2.getByTestId(M.INNER_TEXT_ID), "the view shows module2's input").toHaveText(`in=${SECOND_INPUT}`);

  await module1.getByTestId(M.INNER_FIRE_ID).getByRole("button").click();
  await expectTextStays(page, view.byTestId(M.HOST_STATE_ID), "state=", "module1 has no handler: its event changes nothing");
  await module2.getByTestId(M.INNER_FIRE_ID).getByRole("button").click();
  await expect(view.byTestId(M.HOST_STATE_ID), "module2's handler, built in the editor, ran").toHaveText(`state=${M.FIRED_VALUE}`);
});
