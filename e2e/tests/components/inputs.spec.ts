import { boundText, boundTextTestId, openSeededView, testIdOf } from "../../src/components/scenario";
import { component, stackItems } from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";

/**
 * S2 of client/E2E-TESTING-components-p3-simple-scenarios-plan.md: the text inputs. Each component has a test id and
 * a text bound to its exposed `value`; the typed value must reach that text.
 */
const INPUT_TYPES = ["input", "password", "textArea", "numberInput", "autocomplete", "mention"] as const;

const TYPED_TEXT = "hello e2e";
const TYPED_NUMBER = "42";
const ROW_WIDTH = 12;
/** What each bound text shows before anything is typed: an empty number input exposes 0 (observed), the rest "". */
const INITIAL_TEXT: Record<(typeof INPUT_TYPES)[number], string> = {
  input: "",
  password: "",
  textArea: "",
  numberInput: "0",
  autocomplete: "",
  mention: "",
};

test.describe("S2 text inputs", () => {
  test("the typed value reaches the bound text of every input component", async ({ page, apiUser }) => {
    const items = stackItems(
      INPUT_TYPES.flatMap((type, index) => {
        const name = `${type}1`;
        return [
          component(type, { id: `c${index}`, testId: testIdOf(name), w: ROW_WIDTH }),
          boundText({ id: `c${index}`, name, expression: `{{${name}.value}}` }),
        ];
      }),
    );
    const view = await openSeededView(page, apiUser.orgId, "e2e-s2-inputs", items);
    for (const type of INPUT_TYPES) {
      const name = `${type}1`;
      await expect(view.byTestId(testIdOf(name)), `${name} is rendered`).toBeVisible();
      await expect(view.byTestId(boundTextTestId(name)), `${name} before typing`).toHaveText(INITIAL_TEXT[type]);
    }

    await view.byTestId(testIdOf("input1")).getByRole("textbox").fill(TYPED_TEXT);
    await expect(view.byTestId(boundTextTestId("input1")), "input value").toHaveText(TYPED_TEXT);

    const passwordField = view.byTestId(testIdOf("password1")).locator("input");
    await expect(passwordField, "the password field hides its text").toHaveAttribute("type", "password");
    await passwordField.fill(TYPED_TEXT);
    await expect(view.byTestId(boundTextTestId("password1")), "password value").toHaveText(TYPED_TEXT);

    await view.byTestId(testIdOf("textArea1")).getByRole("textbox").fill(TYPED_TEXT);
    await expect(view.byTestId(boundTextTestId("textArea1")), "textArea value").toHaveText(TYPED_TEXT);

    // A number input writes `value` when the edit is finished: Enter or blur (numberInputComp.tsx, handleFinish).
    const numberField = view.byTestId(testIdOf("numberInput1")).getByRole("spinbutton");
    await numberField.fill(TYPED_NUMBER);
    await numberField.press("Enter");
    await expect(view.byTestId(boundTextTestId("numberInput1")), "numberInput value").toHaveText(TYPED_NUMBER);

    await view.byTestId(testIdOf("autocomplete1")).getByRole("combobox").fill(TYPED_TEXT);
    await expect(view.byTestId(boundTextTestId("autocomplete1")), "autocomplete value").toHaveText(TYPED_TEXT);

    await view.byTestId(testIdOf("mention1")).getByRole("textbox").fill(TYPED_TEXT);
    await expect(view.byTestId(boundTextTestId("mention1")), "mention value").toHaveText(TYPED_TEXT);
  });
});
