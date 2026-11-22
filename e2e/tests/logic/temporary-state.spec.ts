import { createApp, publishApp } from "../../src/api/client";
import { TAGS } from "../../src/constants";
import {
  appDsl,
  button,
  dataResponder,
  eventHandler,
  jsQuery,
  runScript,
  setTempState,
  stackItems,
  tempState,
  text,
  transformer,
} from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";
import { expectTextStays } from "../../src/logic/helpers";
import { AppViewPage } from "../../src/pages/AppViewPage";

/** No success toast: the probes ran with it off and a toast stays on screen over the buttons below it. */
const QUIET = { showSuccess: false } as const;
const SET_STATE_ID = "e2e-set-state";
const JS_STATE_ID = "e2e-js-state";
const QUERY_EVENT_ID = "e2e-query-event";
const SET_IN_ID = "e2e-set-in";
const BAD_PATH_ID = "e2e-bad-path";
const SCALAR_ID = "e2e-scalar";
const NULL_STATE_ID = "e2e-null-state";

test.describe("temporary states", () => {
  test("a state is set by an event, a JS query and a query event; transformer, data responder and setIn follow it", {
    tag: TAGS.CORE,
  }, async ({ page, apiUser }) => {
    const dsl = appDsl(
      stackItems([
        button({
          id: "b1",
          name: "bSet",
          text: "SetState",
          testId: SET_STATE_ID,
          onEvent: [eventHandler("click", setTempState("state1", "clicked-{{1+1}}"))],
        }),
        button({ id: "b2", name: "bJs", text: "JsState", testId: JS_STATE_ID, onClickQuery: "setq" }),
        button({ id: "b3", name: "bQuery", text: "RunQuery", testId: QUERY_EVENT_ID, onClickQuery: "query1" }),
        button({ id: "b4", name: "bSetIn", text: "SetIn", testId: SET_IN_ID, onClickQuery: "setinq" }),
        text({ id: "t1", name: "tState", testId: "e2e-s1", text: "s1={{state1.value}}" }),
        text({ id: "t2", name: "tTransformer", testId: "e2e-tr", text: "tr={{transformer1.value}}" }),
        text({ id: "t3", name: "tResponder", testId: "e2e-s2", text: "s2={{state2.value}}" }),
        text({ id: "t4", name: "tQueryEvent", testId: "e2e-s3", text: "s3={{state3.value}}" }),
        text({ id: "t5", name: "tSetIn", testId: "e2e-in", text: "in={{state4.value.a.b}}" }),
        text({ id: "t6", name: "tSetInJson", testId: "e2e-json", text: "json={{JSON.stringify(state4.value)}}" }),
      ]),
      {
        tempStates: [
          tempState({ id: "s1", name: "state1", value: "null" }),
          tempState({ id: "s2", name: "state2", value: "null" }),
          tempState({ id: "s3", name: "state3", value: "null" }),
          tempState({ id: "s4", name: "state4", value: "{}" }),
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
          jsQuery({ id: "q1", name: "setq", script: "state1.setValue('from-js')", notification: QUIET }),
          jsQuery({
            id: "q2",
            name: "query1",
            script: "return 1",
            onEvent: [eventHandler("success", setTempState("state3", "ok"))],
            notification: QUIET,
          }),
          jsQuery({ id: "q3", name: "setinq", script: "state4.setIn(['a','b'], 1)", notification: QUIET }),
        ],
      },
    );
    const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-temp-states", dsl });
    await publishApp(page.request, appId);
    const view = new AppViewPage(page);

    await view.open(appId);
    await expect(view.byTestId("e2e-tr"), "the transformer reads the state's initial null").toHaveText("tr=null!");
    await expectTextStays(page, view.byTestId("e2e-s2"), "s2=", "the data responder does not fire on load, not even late");

    await view.buttonByTestId(SET_STATE_ID).click();
    await expect(view.byTestId("e2e-s1"), "the event sets the state; its value is evaluated").toHaveText("s1=clicked-2");
    await expect(view.byTestId("e2e-tr"), "the transformer follows the state").toHaveText("tr=clicked-2!");
    await expect(view.byTestId("e2e-s2"), "the data responder ran its handler on the change").toHaveText("s2=resp-clicked-2");

    await view.buttonByTestId(JS_STATE_ID).click();
    await expect(view.byTestId("e2e-s1"), "a JS query sets the state").toHaveText("s1=from-js");

    await expect(view.byTestId("e2e-s3"), "the query's success handler has not run yet").toHaveText("s3=");
    await view.buttonByTestId(QUERY_EVENT_ID).click();
    await expect(view.byTestId("e2e-s3"), "the success handler of a query sets a state").toHaveText("s3=ok");

    await page.reload();
    await expect(view.byTestId("e2e-s1"), "states are not persisted: after a reload the state is its initial value").toHaveText("s1=");
    await expect(view.byTestId("e2e-s3"), "the query-event state is initial again").toHaveText("s3=");

    await view.buttonByTestId(SET_IN_ID).click();
    await expect(view.byTestId("e2e-in"), "setIn with an array path sets a nested value").toHaveText("in=1");
    await expect(view.byTestId("e2e-json"), "the state holds the nested object").toHaveText('json={"a":{"b":1}}');
  });

  /**
   * Defect CD-7: `setIn` with a path that is not an array or on a state
   * that is not an object or array throws inside an async executor, so the query that calls it ends as a SUCCESS, the
   * `fail` handler does not run and the state is unchanged. This test asserts today's behaviour (the `success` handler
   * ran, nothing changed) and makes no assertion on toasts. The scripts do not `return` the call, as the probe's did
   * (probes/logic-c1.spec.ts); when CD-7 is fixed, return the `setIn` promise and expect the `fail` handler instead.
   */
  test("setIn with a string path, on a string state and on a null state ends as success and changes nothing", {
    annotation: { type: "defect", description: "CD-7" },
  }, async ({ page, apiUser }) => {
    const handlers = (prefix: string) => [
      eventHandler("fail", setTempState("state3", `${prefix}-failed`)),
      eventHandler("success", setTempState("state3", `${prefix}-success`)),
    ];
    const dsl = appDsl(
      stackItems([
        button({ id: "b1", name: "bBad", text: "BadPath", testId: BAD_PATH_ID, onClickQuery: "badq" }),
        button({ id: "b2", name: "bScalar", text: "Scalar", testId: SCALAR_ID, onClickQuery: "scalarq" }),
        button({ id: "b3", name: "bNull", text: "Null", testId: NULL_STATE_ID, onClickQuery: "nullq" }),
        text({ id: "t1", name: "tJson", testId: "e2e-json", text: "json={{JSON.stringify(state4.value)}}" }),
        text({ id: "t2", name: "tString", testId: "e2e-string", text: "s1={{JSON.stringify(state1.value)}}" }),
        text({ id: "t3", name: "tNull", testId: "e2e-null", text: "s5={{JSON.stringify(state5.value)}}" }),
        text({ id: "t4", name: "tOutcome", testId: "e2e-outcome", text: "s3={{state3.value}}" }),
      ]),
      {
        tempStates: [
          tempState({ id: "s1", name: "state1", value: JSON.stringify("abc") }),
          tempState({ id: "s3", name: "state3", value: "null" }),
          tempState({ id: "s4", name: "state4", value: "{}" }),
          tempState({ id: "s5", name: "state5", value: "null" }),
        ],
        queries: [
          jsQuery({ id: "q1", name: "badq", script: "state4.setIn('a.b', 2)", onEvent: handlers("badpath"), notification: QUIET }),
          jsQuery({ id: "q2", name: "scalarq", script: "state1.setIn(['a','b'], 3)", onEvent: handlers("scalar"), notification: QUIET }),
          jsQuery({ id: "q3", name: "nullq", script: "state5.setIn(['a','b'], 4)", onEvent: handlers("null"), notification: QUIET }),
        ],
      },
    );
    const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-set-in-errors", dsl });
    await publishApp(page.request, appId);
    const view = new AppViewPage(page);

    await view.open(appId);
    await expect(view.byTestId("e2e-outcome"), "no handler ran on load").toHaveText("s3=");

    await view.buttonByTestId(BAD_PATH_ID).click();
    await expect(view.byTestId("e2e-outcome"), "a string path: the query ended as success, not as failure").toHaveText("s3=badpath-success");
    await expect(view.byTestId("e2e-json"), "a string path: the object state is unchanged").toHaveText("json={}");

    await view.buttonByTestId(SCALAR_ID).click();
    await expect(view.byTestId("e2e-outcome"), "a string state: success").toHaveText("s3=scalar-success");
    await expect(view.byTestId("e2e-string"), "a string state: unchanged").toHaveText('s1="abc"');

    await view.buttonByTestId(NULL_STATE_ID).click();
    await expect(view.byTestId("e2e-outcome"), "a null state: success").toHaveText("s3=null-success");
    await expect(view.byTestId("e2e-null"), "a null state: unchanged").toHaveText("s5=null");
  });
});
