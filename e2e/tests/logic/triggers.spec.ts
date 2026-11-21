import { createApp, createPostgresDatasource, publishApp } from "../../src/api/client";
import { SEEDED_ITEM_NAMES, TAGS } from "../../src/constants";
import {
  appDsl,
  button,
  eventHandler,
  executeQuery,
  input,
  jsQuery,
  postgresQuery,
  setTempState,
  stackItems,
  tempState,
  text,
} from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";
import { countAfterEquals, DEBOUNCE_SETTLE_MS, expectTextStays, rawLocalStorage } from "../../src/logic/helpers";
import { postgresConnection } from "../../src/postgres";
import { AppViewPage } from "../../src/pages/AppViewPage";

/** No toast for a success; a toast stays on screen for seconds over the controls below it. */
const QUIET = { showSuccess: false } as const;
/** No toast for either outcome (a failing query). */
const SILENT = { showSuccess: false, showFail: false } as const;

/** `onTimeout` delay, ms as the string the DSL takes, and how far the page clock jumps past it. */
const TIMEOUT_DELAY_MS = "2000";
const TIMEOUT_CLOCK_RUN_MS = 2_500;
/** Clock time run after the delay, to show that the query does not run again. */
const TIMEOUT_LATER_CLOCK_RUN_MS = 3_000;
/** Period of the periodic query and how far the clock runs: at least two periods fit in it. */
const PERIOD_MS = "500";
const PERIODIC_CLOCK_RUN_MS = 3_000;
const PERIODIC_MIN_RUNS = 2;
/**
 * The input-change query ignores the first dependency change for its first 500 ms (queryComp.tsx:204, :291-301). The
 * probes did not reproduce a swallowed fill, but priming and waiting longer than that is harmless insurance (p5 L3).
 */
const INPUT_CHANGE_GUARD_MS = 1_000;
const CONFIRMATION_MESSAGE = "Really run?";
const LEFT_KEY_VALUE = '{"left":"yes"}';

test.describe("query triggers", () => {
  test("a page-load query runs, a manual one waits, events run queries and chain them", { tag: TAGS.CORE }, async ({
    page,
    apiUser,
  }) => {
    const dsl = appDsl(
      stackItems([
        button({ id: "b1", name: "bQuery1", text: "RunQuery1", testId: "e2e-run-q1", onClickQuery: "query1" }),
        button({ id: "b2", name: "bFail", text: "RunFail", testId: "e2e-run-fail", onClickQuery: "failq" }),
        text({ id: "t1", name: "tLoad", testId: "e2e-load", text: "load={{loadq.data}}" }),
        text({ id: "t2", name: "tQ1", testId: "e2e-q1", text: "q1={{query1.data}}" }),
        text({ id: "t3", name: "tSuccess", testId: "e2e-s3", text: "s3={{state3.value}}" }),
        text({ id: "t4", name: "tFail", testId: "e2e-s2", text: "s2={{state2.value}}" }),
        text({ id: "t5", name: "tQ2", testId: "e2e-q2", text: "q2={{query2.data}}" }),
        text({ id: "t6", name: "tEv", testId: "e2e-ev", text: "ev={{evq.data}}" }),
      ]),
      {
        tempStates: [tempState({ id: "s2", name: "state2", value: "null" }), tempState({ id: "s3", name: "state3", value: "null" })],
        queries: [
          jsQuery({ id: "q1", name: "loadq", script: "return 'loaded-42'", trigger: "automatic", notification: QUIET }),
          jsQuery({
            id: "q2",
            name: "query1",
            script: "return 'q1-' + 1",
            // The success handlers: a temporary state, and (chaining by event) another query.
            onEvent: [eventHandler("success", setTempState("state3", "ok")), eventHandler("success", executeQuery("evq"))],
            notification: QUIET,
          }),
          jsQuery({
            id: "q3",
            name: "failq",
            script: "throw new Error('boom')",
            onEvent: [eventHandler("fail", setTempState("state2", "failed"))],
            notification: SILENT,
          }),
          jsQuery({
            id: "q4",
            name: "query2",
            script: "return query1.data + '-chained'",
            trigger: "onQueryExecution",
            depQueryName: "query1",
            notification: QUIET,
          }),
          jsQuery({ id: "q5", name: "evq", script: "return query1.data + '-by-event'", notification: QUIET }),
        ],
      },
    );
    const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-triggers-basic", dsl });
    await publishApp(page.request, appId);
    const view = new AppViewPage(page);

    await view.open(appId);

    await expect(view.byTestId("e2e-load"), "an automatic query runs on page load").toHaveText("load=loaded-42");
    for (const [testId, expected] of [
      ["e2e-q1", "q1="],
      ["e2e-s3", "s3="],
      ["e2e-q2", "q2="],
      ["e2e-ev", "ev="],
      ["e2e-s2", "s2="],
    ] as const) {
      await expect(view.byTestId(testId), `before any click: ${expected}`).toHaveText(expected);
    }

    await view.buttonByTestId("e2e-run-q1").click();
    await expect(view.byTestId("e2e-q1"), "a button event runs a manual query").toHaveText("q1=q1-1");
    await expect(view.byTestId("e2e-s3"), "the success handler set the state").toHaveText("s3=ok");
    await expect(view.byTestId("e2e-q2"), "the chained query ran after query1").toHaveText("q2=q1-1-chained");
    await expect(view.byTestId("e2e-ev"), "the success handler ran another query, which saw query1's result").toHaveText(
      "ev=q1-1-by-event",
    );

    await view.buttonByTestId("e2e-run-fail").click();
    await expect(view.byTestId("e2e-s2"), "the fail handler of a throwing query ran").toHaveText("s2=failed");
  });

  test("an input change re-runs a PostgreSQL query", { tag: [TAGS.CORE, TAGS.SLOW] }, async ({ page, apiUser }) => {
    const datasourceId = await createPostgresDatasource(page.request, {
      orgId: apiUser.orgId,
      name: "e2e-shop",
      connection: postgresConnection(),
    });
    const [first, second] = SEEDED_ITEM_NAMES;
    const dsl = appDsl(
      stackItems([
        input({ id: "i1", name: "input1", testId: "e2e-input" }),
        text({ id: "t1", name: "tSafe", testId: "e2e-name", text: "name={{query1.data && query1.data[0] ? query1.data[0].name : ''}}" }),
        text({ id: "t2", name: "tRows", testId: "e2e-rows", text: "rows={{JSON.stringify(query1.data)}}" }),
      ]),
      {
        queries: [
          postgresQuery({
            id: "q1",
            name: "query1",
            datasourceId,
            sql: "SELECT name FROM items WHERE name = {{input1.value}}",
            trigger: "onInputChange",
            notification: QUIET,
          }),
        ],
      },
    );
    const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-triggers-input", dsl });
    await publishApp(page.request, appId);
    const view = new AppViewPage(page);
    const box = view.byTestId("e2e-input").getByRole("textbox");

    await view.open(appId);
    await expect(box, "the input is on the page").toBeVisible();
    await box.fill("zzz");
    await page.waitForTimeout(INPUT_CHANGE_GUARD_MS);
    await box.fill(second);

    await expect(view.byTestId("e2e-name"), "typing a name re-runs the query with it").toHaveText(`name=${second}`);
    await expect(view.byTestId("e2e-rows"), "the query's result is the matching row").toHaveText(`rows=[{"name":"${second}"}]`);
    await box.fill(first);
    await expect(view.byTestId("e2e-name"), "the next value follows").toHaveText(`name=${first}`);
  });

  test("an onTimeout query runs once after its delay (page clock)", async ({ page, apiUser }) => {
    const dsl = appDsl(
      stackItems([
        text({ id: "t1", name: "tCount", testId: "e2e-count", text: "n={{state1.value}}" }),
        text({ id: "t2", name: "tData", testId: "e2e-data", text: "d={{timeoutq.data}}" }),
      ]),
      {
        tempStates: [tempState({ id: "s1", name: "state1", value: "0" })],
        queries: [
          jsQuery({
            id: "q1",
            name: "timeoutq",
            script: "state1.setValue(state1.value + 1); return 'timed'",
            trigger: "onTimeout",
            delayTime: TIMEOUT_DELAY_MS,
            notification: QUIET,
          }),
        ],
      },
    );
    const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-triggers-timeout", dsl });
    await publishApp(page.request, appId);
    const view = new AppViewPage(page);

    await page.clock.install();
    await view.open(appId);
    await expect(view.byTestId("e2e-count"), "not run right after load").toHaveText("n=0");
    await expect(view.byTestId("e2e-data"), "no result before the delay").toHaveText("d=");

    await page.clock.runFor(TIMEOUT_CLOCK_RUN_MS);
    await expect(view.byTestId("e2e-data"), "ran after the delay").toHaveText("d=timed");
    await expect(view.byTestId("e2e-count"), "it ran once").toHaveText("n=1");

    await page.clock.runFor(TIMEOUT_LATER_CLOCK_RUN_MS);
    await expectTextStays(page, view.byTestId("e2e-count"), "n=1", "later clock time does not run an onTimeout query again");
  });

  test("an automatic query with periodic runs repeatedly, a manual one does not (page clock)", async ({ page, apiUser }) => {
    const dsl = appDsl(
      stackItems([
        text({ id: "t1", name: "tAuto", testId: "e2e-auto", text: "auto={{state1.value}}" }),
        text({ id: "t2", name: "tManual", testId: "e2e-manual", text: "manual={{state2.value}}" }),
      ]),
      {
        tempStates: [tempState({ id: "s1", name: "state1", value: "0" }), tempState({ id: "s2", name: "state2", value: "0" })],
        queries: [
          jsQuery({
            id: "q1",
            name: "periodq",
            script: "state1.setValue(state1.value + 1); return 1",
            trigger: "automatic",
            periodic: true,
            periodicTime: PERIOD_MS,
            notification: QUIET,
          }),
          jsQuery({
            id: "q2",
            name: "manualperiodq",
            script: "state2.setValue(state2.value + 1); return 1",
            trigger: "manual",
            periodic: true,
            periodicTime: PERIOD_MS,
            notification: QUIET,
          }),
        ],
      },
    );
    const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-triggers-periodic", dsl });
    await publishApp(page.request, appId);
    const view = new AppViewPage(page);

    await page.clock.install();
    await view.open(appId);
    await expect(view.byTestId("e2e-auto"), "the periodic query ran on load").not.toHaveText("auto=0");
    const before = await countAfterEquals(view.byTestId("e2e-auto"));

    await page.clock.runFor(PERIODIC_CLOCK_RUN_MS);
    await expect
      .poll(async () => (await countAfterEquals(view.byTestId("e2e-auto"))) - before, {
        message: `the periodic query ran at least ${PERIODIC_MIN_RUNS} more times while the clock ran ${PERIODIC_CLOCK_RUN_MS} ms (count was ${before})`,
      })
      .toBeGreaterThanOrEqual(PERIODIC_MIN_RUNS);
    await expect(view.byTestId("e2e-manual"), "periodic applies to automatic queries only: the manual one never ran").toHaveText("manual=0");
  });

  test("a handler runs only when its condition holds, and a manual query asks for confirmation", async ({ page, apiUser }) => {
    const dsl = appDsl(
      stackItems([
        input({ id: "i1", name: "input1", testId: "e2e-input" }),
        button({
          id: "b1",
          name: "bCond",
          text: "Cond",
          testId: "e2e-cond-button",
          onEvent: [eventHandler("click", setTempState("state1", "ran"), { condition: "{{input1.value === 'go'}}" })],
        }),
        button({ id: "b2", name: "bConfirm", text: "Confirm", testId: "e2e-confirm-button", onClickQuery: "confq" }),
        text({ id: "t1", name: "tCond", testId: "e2e-cond", text: "cond={{state1.value}}" }),
        text({ id: "t2", name: "tConf", testId: "e2e-conf", text: "conf={{state2.value}}" }),
        text({ id: "t3", name: "tAuto", testId: "e2e-auto", text: "auto={{state3.value}}" }),
      ]),
      {
        tempStates: [
          tempState({ id: "s1", name: "state1", value: "null" }),
          tempState({ id: "s2", name: "state2", value: "0" }),
          tempState({ id: "s3", name: "state3", value: "0" }),
        ],
        queries: [
          jsQuery({
            id: "q1",
            name: "confq",
            script: "state2.setValue(state2.value + 1); return 1",
            confirmationModal: { showConfirmationModal: true, confirmationMessage: CONFIRMATION_MESSAGE },
            notification: QUIET,
          }),
          jsQuery({
            id: "q2",
            name: "autoq",
            script: "state3.setValue(state3.value + 1); return 1",
            trigger: "automatic",
            confirmationModal: { showConfirmationModal: true, confirmationMessage: "Should not be asked" },
            notification: QUIET,
          }),
        ],
      },
    );
    const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-triggers-cond-confirm", dsl });
    await publishApp(page.request, appId);
    const view = new AppViewPage(page);
    const box = view.byTestId("e2e-input").getByRole("textbox");
    const dialog = page.getByRole("dialog");

    await view.open(appId);
    await expect(view.byTestId("e2e-cond"), "the condition's handler has not run").toHaveText("cond=");
    await box.fill("stop");
    await view.buttonByTestId("e2e-cond-button").click();
    await expectTextStays(page, view.byTestId("e2e-cond"), "cond=", "a false condition: the handler does not run", {
      windowMs: DEBOUNCE_SETTLE_MS,
    });
    await box.fill("go");
    await view.buttonByTestId("e2e-cond-button").click();
    await expect(view.byTestId("e2e-cond"), "a true condition: the handler runs").toHaveText("cond=ran");

    await expect(view.byTestId("e2e-auto"), "an automatic query runs on load without asking, whatever its modal fields").toHaveText("auto=1");
    await expect(dialog, "an automatic query shows no dialog").toHaveCount(0);

    await view.buttonByTestId("e2e-confirm-button").click();
    await expect(dialog, "a manual query with the modal asks first").toBeVisible();
    await expect(dialog, "the configured message").toContainText(CONFIRMATION_MESSAGE);
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog, "Cancel closes the dialog").toBeHidden();
    await expectTextStays(page, view.byTestId("e2e-conf"), "conf=0", "Cancel: the query does not run");

    await view.buttonByTestId("e2e-confirm-button").click();
    await expect(dialog, "the second click asks again").toBeVisible();
    await dialog.getByRole("button", { name: "OK", exact: true }).click();
    await expect(view.byTestId("e2e-conf"), "OK runs the query").toHaveText("conf=1");
  });

  test("an onBeforeUnload query runs when the page is left, not on load", async ({ page, apiUser, context }) => {
    const leaving = (trigger: "onBeforeUnload" | "manual") =>
      appDsl(stackItems([text({ id: "t1", name: "tLeft", testId: "e2e-left", text: "left={{localStorage.values.left}}" })]), {
        queries: [
          jsQuery({ id: "q1", name: "leaveq", script: "localStorage.setItem('left', 'yes'); return 1", trigger, notification: QUIET }),
        ],
      });
    const leaver = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-triggers-leave", dsl: leaving("onBeforeUnload") });
    await publishApp(page.request, leaver.appId);
    const control = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-triggers-leave-control", dsl: leaving("manual") });
    await publishApp(page.request, control.appId);
    const view = new AppViewPage(page);

    await view.open(control.appId);
    await expect(view.byTestId("e2e-left"), "the control app is up").toHaveText("left=");
    await page.reload();
    await expect(view.byTestId("e2e-left"), "control: a manual query with the same script writes nothing on reload").toHaveText("left=");
    expect(await rawLocalStorage(page), "control: nothing stored").toBeNull();

    await view.open(leaver.appId);
    await expect(view.byTestId("e2e-left"), "not run on load").toHaveText("left=");
    expect(await rawLocalStorage(page), "nothing stored while the page is open").toBeNull();

    await page.goto("about:blank");
    const reader = await context.newPage();
    await new AppViewPage(reader).open(control.appId);
    await expect(reader.getByTestId("e2e-left"), "navigating away ran the query: another tab reads its value").toHaveText("left=yes");
    expect(await rawLocalStorage(reader), "navigating away stored the value").toBe(LEFT_KEY_VALUE);
    await reader.evaluate(() => window.localStorage.clear());
    expect(await rawLocalStorage(reader), "the key is removed before the next step").toBeNull();
    await reader.close();

    await view.open(leaver.appId);
    await expect(view.byTestId("e2e-left"), "with the key removed the page loads without it (leaving it again re-creates it)").toHaveText("left=");
    await page.reload();
    await expect(view.byTestId("e2e-left"), "a reload leaves the page: the query ran").toHaveText("left=yes");
    expect(await rawLocalStorage(page), "the reload stored the value").toBe(LEFT_KEY_VALUE);
  });
});
