import { appDsl, component, eventHandler, setTempState, stackItems, tempState, text } from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";
import { openSeededApp } from "../../src/simple-components/seed";

/**
 * S14: `timer`. It runs on wall time, so the test asserts
 * that the display changes while it runs, holds after Pause, and that the `pause` event sets a state; it asserts no digits.
 * Not asserted (defect CD-3): the `start` and `resume` events and the
 * exposed `timerState` / `elapsedTime`, which do not follow the running timer. Probe: probes/s14b-timer.spec.ts.
 */
const TIMER_ID = "e2e-timer";
const STATE_ID = "e2e-state";
const PAUSED_READ_GAP_MS = 700;
const PAUSE_EVENT_STATE = "pause";

test.describe("S14 timer", () => {
  test("the display runs after Start, stands still after Pause, and the pause event sets the state", async ({ page, apiUser }) => {
    const dsl = appDsl(
      stackItems([
        component("timer", {
          id: "t1",
          testId: TIMER_ID,
          onEvent: [eventHandler("pause", setTempState("state1", PAUSE_EVENT_STATE))],
        }),
        text({ id: "x1", name: "tState", testId: STATE_ID, text: "s1={{state1.value}}" }),
      ]),
      { tempStates: [tempState({ id: "s1", name: "state1", value: "null" })] },
    );
    const { view } = await openSeededApp(page, page.request, { orgId: apiUser.orgId, name: "e2e-s14-timer", dsl });
    const timer = view.byTestId(TIMER_ID);
    /** The display is the first line of the component's text (the buttons follow). */
    const display = async (): Promise<string> => ((await timer.innerText()).split("\n")[0] ?? "").trim();

    await timer.getByRole("button", { name: "Start" }).click();
    const firstRead = await display();
    await expect.poll(display, { message: "the display changes while the timer runs" }).not.toBe(firstRead);

    await timer.getByRole("button", { name: "Pause" }).click();
    await expect(timer.getByRole("button", { name: "Resume" }), "the Pause button became Resume").toBeVisible();
    const pausedRead = await display();
    await page.waitForTimeout(PAUSED_READ_GAP_MS);
    expect(await display(), "the display holds between two reads after Pause").toBe(pausedRead);

    await expect(view.byTestId(STATE_ID), "the pause event ran its handler").toHaveText(`s1=${PAUSE_EVENT_STATE}`);
  });
});
