import { createApp, createModule, publishApp } from "../../src/api/client";
import { appDsl, button, eventHandler, executeComp, moduleInstance, setTempState, stackItems, tempState, text } from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";
import { expectTextStays } from "../../src/logic/helpers";
import { MODULE_SCENARIO as M, scenarioModuleDsl } from "../../src/modules/moduleScenario";
import { AppViewPage } from "../../src/pages/AppViewPage";

const FIRST_INPUT = "alpha";
const SECOND_INPUT = "beta";
const TYPED_VALUE = "hello";
const STRICT_PROBE_TIMEOUT_MS = 5_000;
const STRICT_PROBE_TOTAL_MS = 20_000;

// M1 (p6 section 2): two instances of one module, every direction across the module boundary.
test("two instances of one module: inputs in, output out, method in, event out", async ({ page, apiUser }) => {
  const { appId: moduleId } = await createModule(page.request, { orgId: apiUser.orgId, name: "e2e-m1-module", dsl: scenarioModuleDsl() });
  await publishApp(page.request, moduleId);
  const hostDsl = appDsl(
    stackItems([
      moduleInstance({
        id: "m1",
        name: M.FIRST_INSTANCE,
        moduleId,
        inputs: { [M.INPUT]: FIRST_INPUT },
        events: [eventHandler(M.EVENT, setTempState(M.STATE, M.FIRED_VALUE))],
      }),
      moduleInstance({ id: "m2", name: M.SECOND_INSTANCE, moduleId, inputs: { [M.INPUT]: SECOND_INPUT } }),
      text({ id: "x1", name: "tOut", testId: M.HOST_OUT_ID, text: `out1={{${M.FIRST_INSTANCE}.${M.OUTPUT}}} out2={{${M.SECOND_INSTANCE}.${M.OUTPUT}}}` }),
      text({ id: "x2", name: "tState", testId: M.HOST_STATE_ID, text: `state={{${M.STATE}.value}}` }),
      button({
        id: "b1",
        name: "bCall",
        text: "CallMethod",
        testId: M.HOST_CALL_ID,
        onEvent: [eventHandler("click", executeComp(M.FIRST_INSTANCE, M.METHOD))],
      }),
    ]),
    { tempStates: [tempState({ id: "s1", name: M.STATE, value: "null" })] },
  );
  const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-m1-host", dsl: hostDsl });
  await publishApp(page.request, appId);
  const view = new AppViewPage(page);
  const module1 = view.inModule(M.FIRST_INSTANCE);
  const module2 = view.inModule(M.SECOND_INSTANCE);
  const module1Input = module1.getByTestId(M.INNER_INPUT_ID).getByRole("textbox");

  await view.open(appId);

  // inputs in
  await expect(module1.getByTestId(M.INNER_TEXT_ID), "input in, instance 1").toHaveText(`in=${FIRST_INPUT}`);
  await expect(module2.getByTestId(M.INNER_TEXT_ID), "input in, instance 2").toHaveText(`in=${SECOND_INPUT}`);
  // test ids repeat: the unscoped locator matches both instances and is ambiguous
  await expect(view.byTestId(M.INNER_TEXT_ID), "the module's test id repeats once per instance").toHaveCount(2);
  // (the instances re-render while they load, so the locator can briefly match nothing: retry until it is ambiguous)
  await expect(async () => {
    await expect(
      view.byTestId(M.INNER_TEXT_ID).innerText({ timeout: STRICT_PROBE_TIMEOUT_MS }),
      "an unscoped locator of a module's component violates strict mode",
    ).rejects.toThrow(/strict mode violation/);
  }).toPass({ timeout: STRICT_PROBE_TOTAL_MS });

  // output out: instances keep separate state
  await module1Input.fill(TYPED_VALUE);
  await expect(view.byTestId(M.HOST_OUT_ID), "output out").toHaveText(`out1=${TYPED_VALUE} out2=`);

  // method in
  await view.buttonByTestId(M.HOST_CALL_ID).click();
  await expect(module1Input, "method in: the module's input got the method's value").toHaveValue(M.METHOD_VALUE);
  await expect(view.byTestId(M.HOST_OUT_ID), "the method's effect reaches the output").toHaveText(`out1=${M.METHOD_VALUE} out2=`);

  // event without a handler: the previous step's text shows that the page runs its bindings, then the window
  await module2.getByTestId(M.INNER_FIRE_ID).getByRole("button").click();
  await expectTextStays(page, view.byTestId(M.HOST_STATE_ID), "state=", "the event of the instance without a handler changes nothing");

  // event out: the same event path delivers on the instance that has a handler
  await module1.getByTestId(M.INNER_FIRE_ID).getByRole("button").click();
  await expect(view.byTestId(M.HOST_STATE_ID), "event out: the handler of instance 1 ran").toHaveText(`state=${M.FIRED_VALUE}`);
});
