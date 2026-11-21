import { boundText, boundTextTestId, openSeededView, testIdOf } from "../../src/components/scenario";
import { component, stackItems } from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";

/**
 * S5 of client/E2E-TESTING-components-p3-simple-scenarios-plan.md: `slider`, `rangeSlider` and `colorPicker`.
 * Back-to-back key presses on a slider are lost (observation O-11), so every press is followed by an assertion of
 * the bound text before the next press.
 */
const SLIDER_MAX = "10";
const SLIDER_START = "0";
const RANGE_START = 10;
const RANGE_END = 60;
const COMPONENT_WIDTH = 12;
/** The recorded colour (lower case, as stored) and the one the test types (without `#`, as the panel's hex field takes it). */
const RECORDED_COLOR = "#3377ff";
const TYPED_HEX = "00ff00";
/** The picker writes every change as `toHexString().toUpperCase()` (colorPickerComp.tsx:109-110). */
const EXPECTED_COLOR = "#00FF00";

test.describe("S5 sliders and colour picker", () => {
  test("slider and rangeSlider move one step per key press, colorPicker takes a typed colour", async ({
    page,
    apiUser,
  }) => {
    const items = stackItems([
      component("slider", { id: "s", testId: testIdOf("slider1"), w: COMPONENT_WIDTH, comp: { max: SLIDER_MAX, value: SLIDER_START } }),
      boundText({ id: "s", name: "slider", expression: "{{slider1.value}}" }),
      component("rangeSlider", { id: "r", testId: testIdOf("rangeSlider1"), w: COMPONENT_WIDTH }),
      boundText({ id: "rs", name: "rangeStart", expression: "{{rangeSlider1.start}}" }),
      boundText({ id: "re", name: "rangeEnd", expression: "{{rangeSlider1.end}}" }),
      component("colorPicker", { id: "c", testId: testIdOf("colorPicker1"), w: COMPONENT_WIDTH }),
      boundText({ id: "c", name: "color", expression: "{{colorPicker1.value}}" }),
    ]);
    const view = await openSeededView(page, apiUser.orgId, "e2e-s5-sliders", items);
    const text = (name: string) => view.byTestId(boundTextTestId(name));

    await expect(text("slider"), "slider starts at its value").toHaveText(SLIDER_START);
    await expect(text("rangeStart"), "rangeSlider start").toHaveText(String(RANGE_START));
    await expect(text("rangeEnd"), "rangeSlider end").toHaveText(String(RANGE_END));

    const sliderHandle = view.byTestId(testIdOf("slider1")).getByRole("slider");
    await sliderHandle.focus();
    await page.keyboard.press("ArrowRight");
    await expect(text("slider"), "slider after the first ArrowRight").toHaveText("1");
    await page.keyboard.press("ArrowRight");
    await expect(text("slider"), "slider after the second ArrowRight").toHaveText("2");

    const rangeHandles = view.byTestId(testIdOf("rangeSlider1")).getByRole("slider");
    await rangeHandles.nth(0).focus();
    await page.keyboard.press("ArrowRight");
    await expect(text("rangeStart"), "start after the first ArrowRight").toHaveText(String(RANGE_START + 1));
    await page.keyboard.press("ArrowRight");
    await expect(text("rangeStart"), "start after the second ArrowRight").toHaveText(String(RANGE_START + 2));
    await rangeHandles.nth(1).focus();
    await page.keyboard.press("ArrowLeft");
    await expect(text("rangeEnd"), "end after the first ArrowLeft").toHaveText(String(RANGE_END - 1));
    await page.keyboard.press("ArrowLeft");
    await expect(text("rangeEnd"), "end after the second ArrowLeft").toHaveText(String(RANGE_END - 2));
    await expect(text("rangeStart"), "the end handle left start alone").toHaveText(String(RANGE_START + 2));
    await expect(text("slider"), "the range handles left the slider alone").toHaveText("2");

    // colorPicker: open the panel, type the hex value, Enter. The text shows the normalised upper-case colour.
    await expect(text("color"), "colorPicker starts at its recorded value").toHaveText(RECORDED_COLOR);
    await view.byTestId(testIdOf("colorPicker1")).locator(".ant-color-picker-trigger").click();
    const hexInput = page.locator(".ant-color-picker-hex-input input");
    await hexInput.fill(TYPED_HEX);
    await hexInput.press("Enter");
    await expect(text("color"), "colorPicker value after typing a hex colour").toHaveText(EXPECTED_COLOR);
  });
});
