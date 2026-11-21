import type { Locator, Page } from "@playwright/test";
import { boundText, boundTextTestId, openSeededView, testIdOf } from "../../src/components/scenario";
import { component, stackItems } from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";
import { expectTextStays } from "../../src/logic/helpers";

/**
 * S4 of client/E2E-TESTING-components-p3-simple-scenarios-plan.md: `date`, `dateRange`, `time`, `timeRange` typed
 * with the keyboard (recipe measured by the S4 probe: click the input, type, Enter). Every date and time is fixed in
 * the test, so nothing depends on the clock.
 */
const DATE_TEXT = "2026-01-15";
const DATE_END_TEXT = "2026-01-20";
const TIME_TEXT = "10:20:30";
const TIME_END_TEXT = "11:30:00";
const INVALID_DATE_TEXT = "not-a-date";
const COMPONENT_WIDTH = 12;

const TEXTS = {
  date: "{{date1.value}}",
  dateRangeStart: "{{dateRange1.start}}",
  dateRangeEnd: "{{dateRange1.end}}",
  time: "{{time1.value}}",
  timeRangeStart: "{{timeRange1.start}}",
  timeRangeEnd: "{{timeRange1.end}}",
} as const;

/**
 * Click the input, wait until it has the focus, fill it in one input event, then Enter. The key-by-key recipe of the S4
 * probe (`keyboard.type`) lost the start of a timeRange in 1 of 10 gate runs, and in 6 of 10 under load; one `fill` does
 * not depend on the timing of single key events.
 */
async function fillAndConfirm(page: Page, input: Locator, value: string): Promise<void> {
  await input.click();
  await expect(input, "the picker input has the focus before filling").toBeFocused();
  await input.fill(value);
  await page.keyboard.press("Enter");
}

test.describe("S4 date and time components", () => {
  test("typed dates and times reach the bound texts, an invalid date is refused", async ({ page, apiUser }) => {
    const items = stackItems([
      component("date", { id: "d", testId: testIdOf("date1"), w: COMPONENT_WIDTH }),
      boundText({ id: "date", name: "date", expression: TEXTS.date }),
      component("dateRange", { id: "dr", testId: testIdOf("dateRange1"), w: COMPONENT_WIDTH }),
      boundText({ id: "drs", name: "dateRangeStart", expression: TEXTS.dateRangeStart }),
      boundText({ id: "dre", name: "dateRangeEnd", expression: TEXTS.dateRangeEnd }),
      component("time", { id: "t", testId: testIdOf("time1"), w: COMPONENT_WIDTH }),
      boundText({ id: "time", name: "time", expression: TEXTS.time }),
      component("timeRange", { id: "tr", testId: testIdOf("timeRange1"), w: COMPONENT_WIDTH }),
      boundText({ id: "trs", name: "timeRangeStart", expression: TEXTS.timeRangeStart }),
      boundText({ id: "tre", name: "timeRangeEnd", expression: TEXTS.timeRangeEnd }),
    ]);
    const view = await openSeededView(page, apiUser.orgId, "e2e-s4-date-time", items);
    const text = (name: string) => view.byTestId(boundTextTestId(name));
    const inputsOf = (name: string) => view.byTestId(testIdOf(name)).locator("input");

    await expect(view.byTestId(testIdOf("date1")), "date is rendered").toBeVisible();
    for (const name of Object.keys(TEXTS)) {
      await expect(text(name), `${name} starts empty`).toHaveText("");
    }

    const dateInput = inputsOf("date1");
    await fillAndConfirm(page, dateInput, DATE_TEXT);
    await expect(text("date"), "date value, format YYYY-MM-DD").toHaveText(DATE_TEXT);
    await expect(dateInput, "a valid date is not flagged invalid (the control of the invalid-date signal below)").not.toHaveAttribute("aria-invalid", "true");

    const rangeInputs = inputsOf("dateRange1");
    await fillAndConfirm(page, rangeInputs.nth(0), DATE_TEXT);
    await expect(text("dateRangeStart"), "dateRange start").toHaveText(DATE_TEXT);
    await fillAndConfirm(page, rangeInputs.nth(1), DATE_END_TEXT);
    await expect(text("dateRangeEnd"), "dateRange end").toHaveText(DATE_END_TEXT);
    await expect(text("dateRangeStart"), "dateRange start is kept").toHaveText(DATE_TEXT);

    const timeInput = inputsOf("time1");
    await fillAndConfirm(page, timeInput, TIME_TEXT);
    await expect(text("time"), "time value, format HH:mm:ss").toHaveText(TIME_TEXT);

    const timeRangeInputs = inputsOf("timeRange1");
    await fillAndConfirm(page, timeRangeInputs.nth(0), TIME_TEXT);
    await expect(text("timeRangeStart"), "timeRange start").toHaveText(TIME_TEXT);
    // Enter on the start input moves the focus to the end input (measured), so the end time is entered without a click.
    await expect(timeRangeInputs.nth(1), "Enter moved the focus to the end input").toBeFocused();
    await timeRangeInputs.nth(1).fill(TIME_END_TEXT);
    await page.keyboard.press("Enter");
    await expect(text("timeRangeEnd"), "timeRange end").toHaveText(TIME_END_TEXT);
    await expect(text("timeRangeStart"), "timeRange start is kept").toHaveText(TIME_TEXT);

    // Failing case: text that is no date is not accepted. The picker marks its input `aria-invalid` (the rejection
    // signal; a valid date, above, did not), keeps the typed text, and the bound text keeps its value for the whole
    // negative window, so the check fails if Enter or Escape delivered the invalid text to the component.
    await dateInput.click();
    await dateInput.fill(INVALID_DATE_TEXT);
    await expect(dateInput, "the invalid text was typed into the picker").toHaveValue(INVALID_DATE_TEXT);
    await page.keyboard.press("Enter");
    await page.keyboard.press("Escape");
    await expect(dateInput, "the picker flags the invalid text").toHaveAttribute("aria-invalid", "true");
    await expectTextStays(page, text("date"), DATE_TEXT, "an invalid date leaves the bound value unchanged");
  });
});
