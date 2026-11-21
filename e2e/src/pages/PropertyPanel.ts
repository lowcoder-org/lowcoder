import { expect, type Locator, type Page } from "@playwright/test";
import { ACTION_POPOVER_SELECT_INDEX, ACTION_REENTRY_PROBE_MS, ACTION_STEP_TIMEOUT_MS, EVENT_HANDLER_LABELS } from "../constants";

/** How much of the error that caused a handler retry is kept in its reason (enough to tell a strict-mode violation from a missing element). */
const RETRY_REASON_MAX_CHARS = 400;

/** The "Properties" tab of the editor's right panel, for the selected component. */
export class PropertyPanel {
  constructor(private readonly page: Page) {}

  /** The code editor (CodeMirror) of the property with this label. */
  field(label: string): Locator {
    return this.page
      .locator("div")
      .filter({ has: this.page.getByText(label, { exact: true }) })
      .locator(".cm-content")
      .first();
  }

  /**
   * Replaces the first code field of the panel (the "Data" field of a table) with an expression. The text is
   * inserted as is, because typing `{{` would make the editor add the closing braces itself. The field can be taller
   * than the screen, so it is clicked near its top.
   */
  async setFirstFieldExpression(expression: string): Promise<void> {
    const field = this.page.locator(".cypress-right-content .cm-content").first();
    await field.click({ position: { x: 20, y: 20 } });
    await field.press("ControlOrMeta+A");
    await this.page.keyboard.insertText(expression);
  }

  /** Renames the selected component: double-click its name in the panel header, type, confirm with Enter. */
  async rename(currentName: string, newName: string): Promise<void> {
    await this.page.locator(".cypress-right-content").getByText(currentName, { exact: true }).dblclick();
    // double-clicking the name opens an input with the whole name selected
    await this.page.keyboard.type(newName);
    await this.page.keyboard.press("Enter");
  }

  /** Replaces the value of a property by typing into its editor. */
  async setValue(label: string, value: string): Promise<void> {
    const field = this.field(label);
    await field.click();
    await field.press("ControlOrMeta+A");
    await this.page.keyboard.type(value);
  }

  /**
   * Adds an event handler to the selected component (Interaction > Event Handlers > Add). The new handler is for the
   * component's first event (a module instance: `event1`) and has the default action "Run a Data Query" with no query.
   */
  async addEventHandler(): Promise<void> {
    await this.page.getByText(EVENT_HANDLER_LABELS.ADD, { exact: true }).first().click();
  }

  /** The action popover of the handler being edited (antd keeps closed popovers in the DOM, so only the visible one). */
  private get actionPopover(): Locator {
    return this.page.locator(".ant-popover:visible").last();
  }

  /** The select dropdown that is open now; the last one, because a dropdown that is leaving is not yet `-hidden`. */
  private get visibleDropdown(): Locator {
    return this.page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden)").last();
  }

  /**
   * Closes and reopens the popover of the handler for `eventName`: the row of the handler list toggles it (the click
   * that follows an open popover closes it).
   */
  private async reopenHandler(eventName: string): Promise<void> {
    const row = this.page.locator(".cypress-right-content").getByText(eventName, { exact: true });
    if ((await this.page.locator(".ant-popover:visible").count()) > 0) {
      await row.click({ timeout: ACTION_STEP_TIMEOUT_MS });
      await expect(this.page.locator(".ant-popover:visible"), "the handler's popover closed").toHaveCount(0);
    }
    await row.click({ timeout: ACTION_STEP_TIMEOUT_MS });
    await expect(this.actionPopover, "the handler's popover opened again").toBeVisible({ timeout: ACTION_STEP_TIMEOUT_MS });
  }

  /**
   * One attempt of the action setup. Every step stays inside the popover: an unscoped `getByText("state1")` can hit
   * the temporary state in the Data Queries list, and the popover's first `.cm-content` can be the "Run Only When"
   * condition (both typed into the wrong field in earlier runs). The popover's selects are, in order, the action type,
   * the State and the Debounce select. `chooseAction` is false on a re-entry, when the handler already shows the
   * "Set a Temporary State value" action.
   */
  private async fillSetTempStateAction(state: string, value: string, chooseAction: boolean): Promise<void> {
    const popover = this.actionPopover;
    if (chooseAction) {
      // Closed popovers and dropdowns stay in the DOM (antd), so both labels are looked up inside the visible ones only.
      await popover
        .getByText(EVENT_HANDLER_LABELS.DEFAULT_ACTION, { exact: true })
        .click({ timeout: ACTION_STEP_TIMEOUT_MS });
      const actionDropdown = this.visibleDropdown;
      await expect(actionDropdown, "the action select's dropdown opened").toBeVisible({ timeout: ACTION_STEP_TIMEOUT_MS });
      await actionDropdown
        .getByText(EVENT_HANDLER_LABELS.SET_TEMP_STATE_ACTION, { exact: true })
        .click({ timeout: ACTION_STEP_TIMEOUT_MS });
    }
    await popover.getByText(EVENT_HANDLER_LABELS.STATE_FIELD, { exact: true }).waitFor({ timeout: ACTION_STEP_TIMEOUT_MS });
    await popover.locator(".ant-select").nth(ACTION_POPOVER_SELECT_INDEX.STATE).click({ timeout: ACTION_STEP_TIMEOUT_MS });
    // The dropdown of the action type select is still leaving (`ant-slide-up-leave`, not yet `-hidden`) when the State
    // select opens its own: 2 matches (strict mode violation, 8 of 10 first attempts at 4 workers). The last one is the new one.
    const dropdown = this.visibleDropdown;
    await expect(dropdown, "the State select's dropdown opened").toBeVisible({ timeout: ACTION_STEP_TIMEOUT_MS });
    const option = dropdown.getByText(state, { exact: true });
    await expect(option, `the dropdown lists the state ${state}`).toBeVisible({ timeout: ACTION_STEP_TIMEOUT_MS });
    await option.click({ timeout: ACTION_STEP_TIMEOUT_MS });
    const field = popover
      .locator("div")
      .filter({ has: this.page.getByText(EVENT_HANDLER_LABELS.VALUE_FIELD, { exact: true }) })
      .locator(".cm-content")
      .first();
    await field.click({ timeout: ACTION_STEP_TIMEOUT_MS });
    await this.page.keyboard.press("ControlOrMeta+A");
    await this.page.keyboard.type(value);
  }

  /**
   * Makes the handler just added by `addEventHandler` set the temporary state `state` to `value` (a code string): picks
   * the action "Set a Temporary State value", the state in its select, and types the value. The state must be seeded in
   * the app being edited (the select lists only that app's states).
   *
   * Retry: the state select once failed to offer its option and the test went on with an incomplete handler. When one
   * step of the attempt fails (times out), the existing handler (named `eventName`, not a second `Add`) is closed and
   * opened again by its row in the handler list (`<event name>` next to `Incomplete Selection`), the popover is checked
   * for the State row, the action is chosen only if the handler is not already "Set a Temporary State value", and the
   * state and value are entered once more. `onRetry` is called with the reason before the second attempt, so the test
   * can annotate `handler retry`; a second failure throws. `retryAllowed: false` (the caller's budget is spent) makes the
   * first failure throw without a retry and without calling `onRetry`. Verified: the first attempt, and the retry path entered by
   * a state the app does not have (both attempts fail, `tests/foundation/editor-modules.spec.ts`). NOT VERIFIED: that
   * the retry recovers from a transient failure of the first attempt (none occurred in the runs).
   *
   * Waiting for the saved DSL to hold the handler is the caller's job (it needs the app id and the API): poll it after
   * this returns, and poll the value, which is the last thing typed and the last saved. Pressing Escape is no way to close the popover: it also deselects the
   * component and switches the right panel to the Insert tab.
   */
  async setTempStateAction(
    state: string,
    value: string,
    options: { eventName: string; onRetry?: (reason: string) => void; retryAllowed?: boolean },
  ): Promise<void> {
    try {
      await this.fillSetTempStateAction(state, value, true);
    } catch (error) {
      if (options.retryAllowed === false) {
        throw error;
      }
      // Every step is a click or a waiting assertion, so each failure is a timeout (a click's TimeoutError or an
      // expect's "Timed out" error, which has another class); any Error enters the retry, a second one fails the test.
      if (!(error instanceof Error)) {
        throw error;
      }
      options.onRetry?.(error.message.replace(/\s+/g, " ").slice(0, RETRY_REASON_MAX_CHARS));
      await this.reenterTempStateAction(state, value, options.eventName);
    }
  }

  /**
   * The retry path of `setTempStateAction`, public for a caller whose own check (the saved DSL does not hold the
   * handler) failed after `setTempStateAction` returned: closes and reopens the existing handler `eventName`, skips the
   * action choice when the handler already is "Set a Temporary State value", and enters the state and value again.
   * The caller owns the retry budget and the annotation.
   */
  async reenterTempStateAction(state: string, value: string, eventName: string): Promise<void> {
    await this.reopenHandler(eventName);
    // The popover of a handler that already has the action shows the State row; one that is still on the default
    // action does not. (Reading the action select's text did not work: the select showed the text, but not as a
    // match of getByText inside `.ant-select`.)
    const alreadySet = await this.actionPopover
      .getByText(EVENT_HANDLER_LABELS.STATE_FIELD, { exact: true })
      .waitFor({ timeout: ACTION_REENTRY_PROBE_MS })
      .then(
        () => true,
        () => false,
      );
    await this.fillSetTempStateAction(state, value, !alreadySet);
  }
}
