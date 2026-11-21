import { createApp, createModule, getAppDsl, LowcoderApiError, publishApp } from "../../src/api/client";
import { API_OK, APP_TYPE_MODULE, NEGATIVE_EVENT_WINDOW_MS, SECOND_VERSION_TAG, applicationPath } from "../../src/constants";
import {
  appDsl,
  button,
  eventHandler,
  executeComp,
  input,
  moduleApp,
  moduleInstance,
  setTempState,
  stackItems,
  tempState,
  text,
  triggerModuleEvent,
} from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";
import { AppViewPage } from "../../src/pages/AppViewPage";

const STATE = "state1";
const EVENT = "event1";
const METHOD = "method1";
const FIRED = "event1-fired";
const METHOD_VALUE = "set-by-method";

const MODULE_ITEMS = stackItems([
  input({ id: "i1", name: "input1", testId: "m-input" }),
  text({ id: "t1", name: "text1", testId: "m-text", text: "in={{moduleInput1.value}}" }),
  button({
    id: "b1",
    name: "button1",
    text: "Fire",
    testId: "m-fire",
    onEvent: [eventHandler("click", triggerModuleEvent(EVENT))],
  }),
]);

function moduleDsl(): object {
  return moduleApp({
    inputs: [{ name: "moduleInput1" }],
    outputs: [{ name: "output1", value: "{{input1.value}}" }],
    methods: [{ name: METHOD, action: executeComp("input1", "setValue", [{ name: "value", value: METHOD_VALUE }]) }],
    events: [EVENT],
    items: MODULE_ITEMS,
  });
}

test.describe("createModule, moduleApp and moduleInstance against the stack", () => {
  test("a created module is type 2, keeps its DSL, and two instances work in a host", async ({ page, apiUser }) => {
    const { appId: moduleId } = await createModule(page.request, { orgId: apiUser.orgId, name: "e2e-module", dsl: moduleDsl() });

    const stored = (await (await page.request.get(applicationPath(moduleId))).json()) as {
      code: number;
      data: { applicationInfoView: { applicationType: number } };
    };
    expect(stored.code, "the module can be read back").toBe(API_OK);
    expect(stored.data.applicationInfoView.applicationType, "stored application type").toBe(APP_TYPE_MODULE);
    const storedDsl = (await getAppDsl(page.request, moduleId)).applicationDSL as { ui: { compType: string; comp: { events: unknown } } };
    expect(storedDsl.ui.compType, "stored DSL root").toBe("module");
    expect(storedDsl.ui.comp.events, "stored module events").toEqual({ list: [{ name: EVENT }], enableEventTestMessage: true });

    await publishApp(page.request, moduleId);
    const hostDsl = appDsl(
      stackItems([
        moduleInstance({
          id: "m1",
          name: "module1",
          moduleId,
          inputs: { moduleInput1: "alpha" },
          events: [eventHandler(EVENT, setTempState(STATE, FIRED))],
        }),
        moduleInstance({ id: "m2", name: "module2", moduleId, inputs: { moduleInput1: "beta" } }),
        text({ id: "x1", name: "tOut", testId: "t-out", text: "out1={{module1.output1}} out2={{module2.output1}}" }),
        text({ id: "x2", name: "tState", testId: "t-state", text: `state={{${STATE}.value}}` }),
        button({
          id: "b1",
          name: "bCall",
          text: "CallMethod",
          testId: "b-call",
          onEvent: [eventHandler("click", executeComp("module1", METHOD))],
        }),
      ]),
      { tempStates: [tempState({ id: "s1", name: STATE, value: "null" })] },
    );
    const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-module-host", dsl: hostDsl });
    await publishApp(page.request, appId);
    const view = new AppViewPage(page);
    const module1 = view.inModule("module1");
    const module2 = view.inModule("module2");

    await view.open(appId);

    await expect(module1.getByTestId("m-text"), "input in, instance 1").toHaveText("in=alpha");
    await expect(module2.getByTestId("m-text"), "input in, instance 2").toHaveText("in=beta");
    await expect(view.byTestId("m-text"), "the module's test id repeats once per instance, so locators are scoped").toHaveCount(2);

    await module1.getByTestId("m-input").getByRole("textbox").fill("hello");
    await expect(view.byTestId("t-out"), "output out; instances keep separate state").toHaveText("out1=hello out2=");

    await view.buttonByTestId("b-call").click();
    await expect(module1.getByTestId("m-input").getByRole("textbox"), "method in").toHaveValue(METHOD_VALUE);
    await expect(view.byTestId("t-out"), "the method's effect reaches the output").toHaveText(`out1=${METHOD_VALUE} out2=`);

    await module2.getByTestId("m-fire").getByRole("button").click();
    const deadline = Date.now() + NEGATIVE_EVENT_WINDOW_MS;
    while (Date.now() < deadline) {
      expect(await view.byTestId("t-state").innerText(), "an event of the instance without a handler changes nothing").toBe("state=");
      await page.waitForTimeout(NEGATIVE_EVENT_WINDOW_MS / 10);
    }
    await module1.getByTestId("m-fire").getByRole("button").click();
    await expect(view.byTestId("t-state"), "event out: the handler of instance 1 ran").toHaveText(`state=${FIRED}`);
  });

  test("a module is republished under a new tag, and the same tag again is refused", async ({ page, apiUser }) => {
    const { appId: moduleId } = await createModule(page.request, { orgId: apiUser.orgId, name: "e2e-module-versions" });

    await publishApp(page.request, moduleId);
    await publishApp(page.request, moduleId, SECOND_VERSION_TAG);
    const again = await publishApp(page.request, moduleId, SECOND_VERSION_TAG).then(
      () => undefined,
      (error: unknown) => error,
    );

    expect(again, "publishing an existing tag fails with the API error type").toBeInstanceOf(LowcoderApiError);
  });
});
