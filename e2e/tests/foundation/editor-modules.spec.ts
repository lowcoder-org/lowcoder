import { createApp, createModule, getAppDsl } from "../../src/api/client";
import { SAVE_POLL_TIMEOUT_MS, TAGS } from "../../src/constants";
import { appDsl, moduleApp, tempState, text } from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";
import { EditorPage } from "../../src/pages/EditorPage";
import { PropertyPanel } from "../../src/pages/PropertyPanel";

const MODULE_NAME = "e2e-editor-module";
const STATE = "state1";
const EVENT = "event1";
const INSTANCE_INPUT = "moduleInput1";
const DROP_TARGET = { x: 200, y: 40 } as const;
const SECOND_DROP_TARGET = { x: 200, y: 450 } as const;
const FIRST_INSTANCE = "module1";
const SECOND_INSTANCE = "module2";
const HANDLER_VALUE = "event1-fired";

interface SavedInstance {
  name: string;
  compType: string;
  comp: {
    appId: string;
    inputs?: Record<string, string>;
    events?: { name: string; handler: { compType: string; comp: { name: string; params?: { comp: string }[] } } }[];
  };
}

async function savedInstance(
  request: Parameters<typeof getAppDsl>[0],
  appId: string,
  name: string,
): Promise<SavedInstance | undefined> {
  const dsl = (await getAppDsl(request, appId)).applicationDSL as { ui?: { items?: Record<string, SavedInstance> } };
  return Object.values(dsl.ui?.items ?? {}).find((item) => item.compType === "module" && item.name === name);
}

// A handler that is still being typed is saved as {name: "", methodName: ""} without `params`, hence the optional chaining.
// These tests save through the editor, so defect D-3 (a lost save after the readiness marker, ~1 in 36 runs) can fail
// them; the D-3 retry of p7 section 1 belongs to the scenario that is built on these page objects, not to them.
test.describe.configure({ retries: 0, timeout: 180_000 });

test.describe("module page objects of the editor", () => {
  test("dragModule, selectInComponentList, setValue, addEventHandler and setTempStateAction save an instance with a handler", {
    tag: TAGS.SLOW,
  }, async ({ page, apiUser }) => {
    const { appId: moduleId } = await createModule(page.request, {
      orgId: apiUser.orgId,
      name: MODULE_NAME,
      dsl: moduleApp({
        inputs: [{ name: INSTANCE_INPUT }],
        events: [EVENT],
        items: [text({ id: "t1", name: "text1", testId: "m-text", text: `in={{${INSTANCE_INPUT}.value}}` })],
      }),
    });
    const { appId } = await createApp(page.request, {
      orgId: apiUser.orgId,
      name: "e2e-editor-host",
      dsl: appDsl([], { tempStates: [tempState({ id: "s1", name: STATE, value: "null" })] }),
    });
    const editor = new EditorPage(page);
    const properties = new PropertyPanel(page);

    await editor.open(appId);
    await editor.dragModule(MODULE_NAME, DROP_TARGET);
    await editor.dragModule(MODULE_NAME, SECOND_DROP_TARGET);
    await editor.selectInComponentList(SECOND_INSTANCE);
    await properties.setValue(INSTANCE_INPUT, "beta");
    await properties.addEventHandler();
    await properties.setTempStateAction(STATE, HANDLER_VALUE, { eventName: EVENT });

    // The value is the last thing typed, so it is the last to be saved: wait for it, not for the state name.
    await expect
      .poll(async () => (await savedInstance(page.request, appId, SECOND_INSTANCE))?.comp.events?.[0]?.handler.comp.params?.[0]?.comp, {
        timeout: SAVE_POLL_TIMEOUT_MS,
        message: `the saved ${SECOND_INSTANCE} holds the typed value in its handler`,
      })
      .toBe(HANDLER_VALUE);
    const instance = await savedInstance(page.request, appId, SECOND_INSTANCE);
    const first = await savedInstance(page.request, appId, FIRST_INSTANCE);
    expect(first?.comp.events ?? [], "the first instance has no handler").toEqual([]);
    expect(instance?.comp.appId, "the instance points at the module").toBe(moduleId);
    expect(instance?.comp.inputs, "the typed input is saved").toEqual({ [INSTANCE_INPUT]: "beta" });
    expect(instance?.comp.events?.[0]?.name, "the handler is for the module's event").toBe(EVENT);
    expect(instance?.comp.events?.[0]?.handler.compType, "the action").toBe("setTempState");
    expect(instance?.comp.events?.[0]?.handler.comp.name, "the state the handler sets").toBe(STATE);
  });

  test("setTempStateAction retries once through the existing handler, then fails when the state is not offered", {
    tag: TAGS.SLOW,
  }, async ({ page, apiUser }, testInfo) => {
    await createModule(page.request, {
      orgId: apiUser.orgId,
      name: MODULE_NAME,
      dsl: moduleApp({ events: [EVENT], items: [text({ id: "t1", name: "text1", testId: "m-text", text: "x" })] }),
    });
    const { appId } = await createApp(page.request, {
      orgId: apiUser.orgId,
      name: "e2e-editor-retry",
      dsl: appDsl([], { tempStates: [tempState({ id: "s1", name: STATE, value: "null" })] }),
    });
    const editor = new EditorPage(page);
    const properties = new PropertyPanel(page);
    const retryReasons: string[] = [];

    await editor.open(appId);
    await editor.dragModule(MODULE_NAME, DROP_TARGET);
    await properties.addEventHandler();
    const failure = await properties
      .setTempStateAction("noSuchState", "x", { eventName: EVENT, onRetry: (reason) => retryReasons.push(reason) })
      .then(
        () => undefined,
        (error: unknown) => error,
      );

    testInfo.annotations.push({ type: "handler retry", description: `app ${appId}: ${retryReasons.join(" | ")}` });
    expect(retryReasons, "one retry before the failure").toHaveLength(1);
    expect(failure, "the second attempt fails too: the state does not exist").toBeInstanceOf(Error);
    expect((failure as Error).message, "the failure names the missing option").toContain("noSuchState");
  });

  test("setTempStateAction does not retry when the caller's retry budget is spent", {
    tag: TAGS.SLOW,
  }, async ({ page, apiUser }) => {
    await createModule(page.request, {
      orgId: apiUser.orgId,
      name: MODULE_NAME,
      dsl: moduleApp({ events: [EVENT], items: [text({ id: "t1", name: "text1", testId: "m-text", text: "x" })] }),
    });
    const { appId } = await createApp(page.request, {
      orgId: apiUser.orgId,
      name: "e2e-editor-no-retry",
      dsl: appDsl([], { tempStates: [tempState({ id: "s1", name: STATE, value: "null" })] }),
    });
    const editor = new EditorPage(page);
    const properties = new PropertyPanel(page);
    const retryReasons: string[] = [];

    await editor.open(appId);
    await editor.dragModule(MODULE_NAME, DROP_TARGET);
    await properties.addEventHandler();
    const failure = await properties
      .setTempStateAction("noSuchState", "x", { eventName: EVENT, retryAllowed: false, onRetry: (reason) => retryReasons.push(reason) })
      .then(
        () => undefined,
        (error: unknown) => error,
      );

    expect(retryReasons, "no retry was started").toEqual([]);
    expect(failure, "the first failure is thrown").toBeInstanceOf(Error);
    expect((failure as Error).message, "the failure names the missing option").toContain("noSuchState");
  });
});
