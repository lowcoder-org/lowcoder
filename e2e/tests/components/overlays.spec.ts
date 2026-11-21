import { appDsl, button, component, containerOf, eventHandler, executeComp, recordedHookOf, runScript, stackItems, text } from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";
import { openSeededApp } from "../../src/simple-components/seed";

/**
 * S9 of client/E2E-TESTING-components-p3-simple-scenarios-plan.md: `modal`, `drawer`, `toast` and `tour`. Modal and drawer
 * are DSL `hooks` (not on the grid) opened by a button's `executeComp`; toast runs from a script; a tour is started by
 * `tour1.startTour()`. Probes: probes/s9-overlays.spec.ts, probes/behaviour.spec.ts.
 */
const OPEN_BUTTON_ID = "e2e-open";
const INNER_TEXT_ID = "e2e-inner";
const INNER_TEXT = "inside-overlay";
const CLOSE_TIMEOUT_MS = 5_000;
const TOUR_PANEL = ".ant-tour";
const TOUR_ANCHOR_NAME = "button1";
const TOUR_STEPS = [
  { title: "Welcome", description: "Welcome to lowcoder" },
  { title: "Step 2", description: "This is a tutorial step" },
] as const;
const TOAST_TEXT = "hello-toast";

/** The text a modal or a drawer holds in its own container. */
function innerTextContainer(): ReturnType<typeof containerOf> {
  return containerOf([text({ id: "it", name: "innerText", text: INNER_TEXT, testId: INNER_TEXT_ID })]);
}

test.describe("S9 overlays", () => {
  for (const overlay of [
    { compType: "modal", name: "modal1", openMethod: "openModal" },
    { compType: "drawer", name: "drawer1", openMethod: "openDrawer" },
  ] as const) {
    test(`${overlay.compType} opens from a button and closes on Escape`, async ({ page, apiUser }) => {
      const dsl = appDsl(
        stackItems([
          button({
            id: "b1",
            name: "bOpen",
            text: "Open",
            testId: OPEN_BUTTON_ID,
            onEvent: [eventHandler("click", executeComp(overlay.name, overlay.openMethod))],
          }),
        ]),
        { hooks: [recordedHookOf(overlay.compType, { container: innerTextContainer() }, overlay.name)] },
      );
      const { view } = await openSeededApp(page, page.request, { orgId: apiUser.orgId, name: `e2e-s9-${overlay.compType}`, dsl });
      const open = view.buttonByTestId(OPEN_BUTTON_ID);
      await expect(open, "the button that opens the overlay is shown").toBeVisible();
      await expect(view.byTestId(INNER_TEXT_ID), `the ${overlay.compType}'s text is not on the page while it is closed`).toHaveCount(0);

      await open.click();

      await expect(view.byTestId(INNER_TEXT_ID), `the ${overlay.compType} shows its text once opened`).toHaveText(INNER_TEXT);

      // recorded: modal `maskClosable`, drawer `escapeClosable` true
      await page.keyboard.press("Escape");

      await expect(view.byTestId(INNER_TEXT_ID), `Escape closes the ${overlay.compType}`).toBeHidden({ timeout: CLOSE_TIMEOUT_MS });
    });
  }

  test("toast shows the message of toast.info() called from a script", async ({ page, apiUser }) => {
    const dsl = appDsl(
      stackItems([
        button({
          id: "b1",
          name: "bToast",
          text: "Toast",
          testId: OPEN_BUTTON_ID,
          onEvent: [eventHandler("click", runScript(`toast.info('${TOAST_TEXT}')`))],
        }),
      ]),
    );
    const { view } = await openSeededApp(page, page.request, { orgId: apiUser.orgId, name: "e2e-s9-toast", dsl });
    await expect(page.getByText(TOAST_TEXT), "the toast is not shown before the click").toHaveCount(0);

    await view.buttonByTestId(OPEN_BUTTON_ID).click();

    await expect(page.getByText(TOAST_TEXT), "the toast shows the message").toBeVisible();
  });

  test("tour steps through its two steps with Next and closes with Finish", async ({ page, apiUser }) => {
    const manualSteps = TOUR_STEPS.map((step) => ({ target: TOUR_ANCHOR_NAME, ...step, placement: "", type: "" }));
    const dsl = appDsl(
      stackItems([
        // the steps look their `target` up by component name
        button({ id: "b0", name: TOUR_ANCHOR_NAME, text: "Anchor", testId: "e2e-anchor" }),
        button({
          id: "b1",
          name: "bTour",
          text: "StartTour",
          testId: OPEN_BUTTON_ID,
          onEvent: [eventHandler("click", runScript("tour1.startTour()"))],
        }),
        component("tour", { id: "t1", testId: "e2e-tour", comp: { options: { manual: { manual: manualSteps } } } }),
      ]),
    );
    const { view } = await openSeededApp(page, page.request, { orgId: apiUser.orgId, name: "e2e-s9-tour", dsl });
    const panel = page.locator(TOUR_PANEL);
    await expect(panel, "no tour panel before the tour is started").toHaveCount(0);

    await view.buttonByTestId(OPEN_BUTTON_ID).click();

    await expect(panel.getByText(TOUR_STEPS[0].title, { exact: true }), "step 1 is shown").toBeVisible();
    await expect(panel.getByText(TOUR_STEPS[0].description), "step 1's description is shown").toBeVisible();

    await panel.getByRole("button", { name: "Next" }).click();

    await expect(panel.getByText(TOUR_STEPS[1].title, { exact: true }), "step 2 is shown after Next").toBeVisible();
    await expect(panel.getByText(TOUR_STEPS[0].title, { exact: true }), "step 1 is gone after Next").toHaveCount(0);

    // Escape does not close a tour (probe), Finish does; the mask would intercept every other click while it is open.
    await panel.getByRole("button", { name: "Finish" }).click();

    await expect(panel, "Finish closes the tour").toHaveCount(0);
  });
});
