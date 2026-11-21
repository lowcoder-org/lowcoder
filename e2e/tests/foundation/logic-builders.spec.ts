import { createApp, publishApp } from "../../src/api/client";
import {
  appDsl,
  button,
  component,
  containerOf,
  dataResponder,
  eventHandler,
  executeComp,
  input,
  jsQuery,
  recordedHookOf,
  runScript,
  setTempState,
  stackItems,
  tempState,
  text,
  transformer,
} from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";
import { DEBOUNCE_SETTLE_MS } from "../../src/logic/helpers";
import { AppViewPage } from "../../src/pages/AppViewPage";

const MODAL_NAME = "modal1";
const TIMEOUT_DELAY_MS = "1500";

test.describe("builders seed an app the published view runs", () => {
  test("event handlers, a transformer, a data responder, a modal hook, a query with options and a recorded component", async ({
    page,
    apiUser,
  }) => {
    const dsl = appDsl(
      stackItems([
        input({ id: "i1", name: "input1", testId: "e2e-input", value: "typed" }),
        button({
          id: "b1",
          name: "bSet",
          text: "Set",
          testId: "e2e-set",
          onEvent: [eventHandler("click", setTempState("state1", "clicked-{{1+1}}"))],
        }),
        button({
          id: "b2",
          name: "bGuarded",
          text: "Guarded",
          testId: "e2e-guarded",
          onEvent: [eventHandler("click", setTempState("state3", "ran"), { condition: "{{input1.value === 'go'}}" })],
        }),
        button({
          id: "b3",
          name: "bModal",
          text: "OpenModal",
          testId: "e2e-open-modal",
          onEvent: [eventHandler("click", executeComp(MODAL_NAME, "openModal"))],
        }),
        text({ id: "t1", name: "tState", testId: "e2e-state", text: "s1={{state1.value}}" }),
        text({ id: "t2", name: "tTransformer", testId: "e2e-transformer", text: "tr={{transformer1.value}}" }),
        text({ id: "t3", name: "tResponder", testId: "e2e-responder", text: "s2={{state2.value}}" }),
        text({ id: "t4", name: "tGuard", testId: "e2e-guard", text: "s3={{state3.value}}" }),
        text({ id: "t5", name: "tQuery", testId: "e2e-query", text: "q={{onTimeoutQuery.data}}" }),
        component("text", { id: "c1", testId: "e2e-recorded", comp: { text: "recorded-text" } }),
        component("switch", { id: "c2", testId: "e2e-switch" }),
      ]),
      {
        tempStates: [
          tempState({ id: "s1", name: "state1", value: "null" }),
          tempState({ id: "s2", name: "state2", value: "null" }),
          tempState({ id: "s3", name: "state3", value: "null" }),
        ],
        transformers: [transformer({ name: "transformer1", script: "return state1.value + '!'" })],
        dataResponders: [
          dataResponder({
            name: "dataResponder1",
            data: "{{state1.value}}",
            onEvent: [eventHandler("dataChange", runScript("state2.setValue('resp-' + state1.value)"))],
          }),
        ],
        queries: [
          jsQuery({
            id: "q1",
            name: "onTimeoutQuery",
            script: "return 'timed'",
            trigger: "onTimeout",
            delayTime: TIMEOUT_DELAY_MS,
            notification: { showSuccess: false },
          }),
        ],
        hooks: [
          recordedHookOf("modal", {
            container: containerOf([text({ id: "mt", name: "modalText", testId: "e2e-modal-text", text: "inside-modal" })]),
          }),
        ],
      },
    );
    const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-logic-builders", dsl });
    await publishApp(page.request, appId);
    const view = new AppViewPage(page);

    await view.open(appId);

    await expect(view.byTestId("e2e-recorded"), "a recorded text component with an override").toHaveText("recorded-text");
    await expect(view.byTestId("e2e-switch").getByRole("switch"), "a recorded switch renders").toBeVisible();
    await expect(view.byTestId("e2e-input").getByRole("textbox"), "the input's initial value").toHaveValue("typed");
    await expect(view.byTestId("e2e-query"), "a query with trigger onTimeout and delayTime runs once the delay passed").toHaveText(
      "q=timed",
    );

    await view.buttonByTestId("e2e-set").click();
    await expect(view.byTestId("e2e-state"), "setTempState evaluates its value").toHaveText("s1=clicked-2");
    await expect(view.byTestId("e2e-transformer"), "the transformer follows the state").toHaveText("tr=clicked-2!");
    await expect(view.byTestId("e2e-responder"), "the data responder ran its handler on the change").toHaveText(
      "s2=resp-clicked-2",
    );

    await view.buttonByTestId("e2e-guarded").click();
    await page.waitForTimeout(DEBOUNCE_SETTLE_MS);
    await expect(view.byTestId("e2e-guard"), "a handler whose condition is false does not run").toHaveText("s3=");
    await view.byTestId("e2e-input").getByRole("textbox").fill("go");
    await view.buttonByTestId("e2e-guarded").click();
    await expect(view.byTestId("e2e-guard"), "the same handler runs once its condition holds").toHaveText("s3=ran");

    await expect(view.byTestId("e2e-modal-text"), "the modal's body is not on the page before it opens").toHaveCount(0);
    await view.buttonByTestId("e2e-open-modal").click();
    await expect(view.byTestId("e2e-modal-text"), "the modal hook opens through executeComp").toBeVisible();
  });
});
