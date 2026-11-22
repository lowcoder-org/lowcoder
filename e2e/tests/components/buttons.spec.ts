import { boundText, boundTextTestId, openSeededView, testIdOf, withValueAt } from "../../src/components/scenario";
import { component, eventHandler, setTempState, stackItems, tempState } from "../../src/dsl/builders";
import { recordedItem } from "../../src/dsl/recorded";
import { expect, test } from "../../src/fixtures";

/**
 * S6: the clickable components. Each carries one handler
 * that sets the temporary state `state1` to the component's own name; the handler sits where the component reads it
 * (root `onEvent`, or the `onEvent` of the option / button / item that is clicked). One action at a time, the state
 * text asserted after each.
 */
const STATE_NAME = "state1";
const STATE_TEXT_NAME = "state";
const COMPONENT_WIDTH = 12;
/**
 * A floatingButton opens its group upward over the cells above its own, which then intercept the clicks; its own
 * column, to the right of every other component, keeps that space free.
 */
const FLOATING_BUTTON_COLUMN = 22;
/** The entry `Option 1` of the floatingButton group: recorded with the badge `1` (`Option 2` has `0`). */
const FLOATING_OPTION_ONE_SELECTOR = '.ant-float-btn:has(sup[title="1"])';
/** The recorded temporary state shape: an unset state renders as empty text. */
const EMPTY_STATE_VALUE = "null";

/** A handler that sets `state1` to `value` when `eventName` fires. */
function setsState(eventName: string, value: string) {
  return eventHandler(eventName, setTempState(STATE_NAME, value));
}

/** The recorded `comp` of `compType` with `handlers` placed at `path`; the result is the `comp` override for the item. */
function compWithHandlerAt(compType: string, path: (string | number)[], handlers: ReturnType<typeof setsState>[]) {
  return withValueAt(recordedItem(compType).comp, path, handlers);
}

/** A stuck action (a covered or never-appearing target) fails with its call log instead of using up the test timeout. */
const ACTION_TIMEOUT_MS = 10_000;
test.use({ actionTimeout: ACTION_TIMEOUT_MS });

test.describe("S6 buttons and menus", () => {
  test("each component's own handler sets the state to its name", async ({ page, apiUser }) => {
    const dropdownComp = compWithHandlerAt("dropdown", ["options", "manual", "manual", 1, "onEvent"], [setsState("click", "dropdown1")]);
    const floatingComp = compWithHandlerAt("floatingButton", ["buttons", "manual", 0, "onEvent"], [setsState("click", "floatingButton1")]);
    // The recorded first item opens an app page on click, which would leave the view: its handler is replaced.
    const navigationComp = compWithHandlerAt("navigation", ["items", "manual", 0, "onEvent"], [setsState("click", "navigation1")]);
    const items = stackItems([
      component("button", { id: "b", testId: testIdOf("button1"), w: COMPONENT_WIDTH, onEvent: [setsState("click", "button1")] }),
      component("link", { id: "l", testId: testIdOf("link1"), w: COMPONENT_WIDTH, onEvent: [setsState("click", "link1")] }),
      component("dropdown", { id: "d", testId: testIdOf("dropdown1"), w: COMPONENT_WIDTH, comp: { options: dropdownComp.options } }),
      component("controlButton", { id: "cb", testId: testIdOf("controlButton1"), onEvent: [setsState("click", "controlButton1")] }),
      component("floatingButton", { id: "f", testId: testIdOf("floatingButton1"), x: FLOATING_BUTTON_COLUMN, comp: { buttons: floatingComp.buttons } }),
      component("navigation", { id: "n", testId: testIdOf("navigation1"), w: 20, comp: { items: navigationComp.items } }),
      component("step", {
        id: "st",
        testId: testIdOf("step1"),
        w: 20,
        // `change` is wired only when `selectable` is true (it defaults to false).
        comp: { selectable: true },
        onEvent: [setsState("change", "step1")],
      }),
      boundText({ id: STATE_TEXT_NAME, name: STATE_TEXT_NAME, expression: `{{${STATE_NAME}.value}}` }),
    ]);
    const view = await openSeededView(page, apiUser.orgId, "e2e-s6-buttons", items, {
      tempStates: [tempState({ id: "s1", name: STATE_NAME, value: EMPTY_STATE_VALUE })],
    });
    const stateText = view.byTestId(boundTextTestId(STATE_TEXT_NAME));
    const within = (name: string) => view.byTestId(testIdOf(name));

    await expect(within("button1"), "the seeded button is rendered").toBeVisible();
    await expect(stateText, "no handler has run").toHaveText("");

    await within("button1").getByRole("button").click();
    await expect(stateText, "button click").toHaveText("button1");

    await within("link1").getByText("Link", { exact: true }).click();
    await expect(stateText, "link click").toHaveText("link1");

    // dropdown (recorded triggerMode hover): hover the trigger, click the second menu item.
    await within("dropdown1").getByRole("button").last().hover();
    await page.getByRole("menuitem", { name: "Option 2" }).click();
    await expect(stateText, "dropdown option 2").toHaveText("dropdown1");

    await within("controlButton1").getByRole("button").click();
    await expect(stateText, "controlButton click").toHaveText("controlButton1");

    // floatingButton (trigger hover): it renders outside its cell, so hover the group's trigger, click `Option 1`.
    await within("floatingButton1").getByRole("button").first().hover();
    // The group's buttons are icon-only (the label is a tooltip): `Option 1` is the one carrying the recorded badge `1`.
    await page.locator(FLOATING_OPTION_ONE_SELECTOR).click();
    await expect(stateText, "floatingButton option 1").toHaveText("floatingButton1");

    await within("navigation1").getByText("Menu Item 1", { exact: true }).click();
    await expect(stateText, "navigation item 1").toHaveText("navigation1");

    // Step 1 is the selected step (it is not clickable), so `change` is tested by selecting Step 2. The label and the
    // sub title share one text node (`Step 2Execution`), so the step is found by its button name.
    await within("step1").getByRole("button", { name: /Step 2/ }).click();
    await expect(stateText, "step 2 selected").toHaveText("step1");
  });
});
