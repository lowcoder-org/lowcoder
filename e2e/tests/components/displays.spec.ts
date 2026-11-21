import type { Locator } from "@playwright/test";
import { openSeededView, testIdOf, withValueAt } from "../../src/components/scenario";
import { button, component, eventHandler, setTempState, stackItems, tempState } from "../../src/dsl/builders";
import { recordedItem } from "../../src/dsl/recorded";
import { PNG_RED } from "../../src/media";
import { TAGS } from "../../src/constants";
import { expect, test } from "../../src/fixtures";

/**
 * S7 of client/E2E-TESTING-components-p3-simple-scenarios-plan.md: the display components. One temporary state,
 * `state1`, holds an object with one field per component; the property under test of each component is bound to its
 * field and every other property keeps the recorded default. A button replaces the state with a second object, and
 * each component's visible output is compared before and after.
 */
const STATE_NAME = "state1";
const SWITCH_BUTTON_TEST_ID = "e2e-switch-state";
const RECORDED_ICON = "/icon:antd/homefilled";
const SECOND_ICON = "/icon:antd/starfilled";
const COMPONENT_WIDTH = 12;

/** The two states of every bound property; `icon` goes from the recorded icon name to another icon name. */
const STATES = {
  one: {
    text: "X-one",
    progress: 60,
    progressCircle: 60,
    divider: "D-one",
    shape: "0_star",
    icon: RECORDED_ICON,
    qrCode: "qr-one",
    timeline: [{ title: "T-one" }],
    avatar: "AB",
    tags: ["a", "b"],
    explorer: { k: "one" },
    editor: { k: "one" },
    table: [{ id: 1, name: "alpha", date: "7/5/2022", department: "Marketing" }],
  },
  two: {
    text: "X-two",
    progress: 80,
    progressCircle: 80,
    divider: "D-two",
    shape: "1_star",
    icon: SECOND_ICON,
    qrCode: "qr-two",
    timeline: [{ title: "T-two" }],
    avatar: "CD",
    tags: ["c"],
    explorer: { k: "two" },
    editor: { k: "two" },
    table: [{ id: 1, name: "beta", date: "7/5/2022", department: "Marketing" }],
  },
} as const;

function field(name: keyof (typeof STATES)["one"]): string {
  return `{{${STATE_NAME}.value.${name}}}`;
}

/** The recorded `multiTags` options switched to map mode over `state1.value.tags`, each tag labelled by its item. */
function multiTagsOptions(): unknown {
  const recorded = recordedItem("multiTags").comp;
  const mapped = withValueAt(recorded, ["options", "optionType"], "map");
  const withData = withValueAt(mapped, ["options", "mapData", "data"], field("tags"));
  return (withValueAt(withData, ["options", "mapData", "mapData", "label"], "{{item}}") as { options: unknown }).options;
}

/** The filled part of a line `progress`: it shows no percentage text, its width is the percentage. */
function progressFill(progress: Locator): Locator {
  return progress.locator(".ant-progress-bg");
}

function widthOf(percent: number): RegExp {
  return new RegExp(`width:\\s*${percent}%`);
}

async function markupOf(locator: Locator): Promise<string> {
  return locator.innerHTML();
}

test.describe("S7 display components", () => {
  test("each bound property shows its new value after the state changes", async ({ page, apiUser }) => {
    const items = stackItems([
      button({
        id: "sw",
        name: "bSwitch",
        text: "Switch state",
        testId: SWITCH_BUTTON_TEST_ID,
        // The value is an expression: `{{ <object> }}` evaluates to the object, the spaces keep the braces apart.
        onEvent: [eventHandler("click", setTempState(STATE_NAME, `{{ ${JSON.stringify(STATES.two)} }}`))],
      }),
      component("text", { id: "text", testId: testIdOf("text1"), w: COMPONENT_WIDTH, h: 4, comp: { text: field("text") } }),
      component("progress", { id: "pr", testId: testIdOf("progress1"), w: COMPONENT_WIDTH, comp: { value: field("progress") } }),
      component("progressCircle", { id: "pc", testId: testIdOf("progressCircle1"), w: COMPONENT_WIDTH, h: 12, comp: { value: field("progressCircle") } }),
      component("divider", { id: "dv", testId: testIdOf("divider1"), w: COMPONENT_WIDTH, comp: { title: field("divider") } }),
      component("shape", { id: "sh", testId: testIdOf("shape1"), w: COMPONENT_WIDTH, h: 12, comp: { icon: field("shape") } }),
      component("icon", { id: "ic", testId: testIdOf("icon1"), w: 4, h: 6, comp: { icon: field("icon") } }),
      component("qrCode", { id: "qr", testId: testIdOf("qrCode1"), w: 8, h: 16, comp: { value: field("qrCode") } }),
      component("timeline", { id: "tl", testId: testIdOf("timeline1"), w: COMPONENT_WIDTH, h: 12, comp: { value: field("timeline") } }),
      component("avatar", { id: "av", testId: testIdOf("avatar1"), w: COMPONENT_WIDTH, comp: { title: field("avatar") } }),
      component("multiTags", { id: "mt", testId: testIdOf("multiTags1"), w: COMPONENT_WIDTH, comp: { options: multiTagsOptions() } }),
      component("jsonExplorer", { id: "je", testId: testIdOf("jsonExplorer1"), w: COMPONENT_WIDTH, h: 12, comp: { value: field("explorer") } }),
      component("jsonEditor", { id: "jd", testId: testIdOf("jsonEditor1"), w: COMPONENT_WIDTH, h: 12, comp: { value: field("editor") } }),
      component("tableLite", { id: "tb", testId: testIdOf("tableLite1"), w: 20, h: 16, comp: { data: field("table") } }),
    ]);
    const view = await openSeededView(page, apiUser.orgId, "e2e-s7-displays", items, {
      tempStates: [tempState({ id: "s1", name: STATE_NAME, value: JSON.stringify(STATES.one) })],
    });
    const within = (name: string) => view.byTestId(testIdOf(name));

    // Before.
    await expect(within("text1"), "text before").toHaveText(STATES.one.text);
    await expect(progressFill(within("progress1")), "progress bar before").toHaveAttribute("style", widthOf(STATES.one.progress));
    await expect(within("progressCircle1"), "progressCircle before").toContainText(`${STATES.one.progressCircle}%`);
    await expect(within("divider1"), "divider title before").toHaveText(STATES.one.divider);
    const shapeBefore = await markupOf(within("shape1").locator("svg").first());
    await expect(within("icon1").locator("svg").first(), "icon is an svg for an icon name").toBeVisible();
    const iconBefore = await markupOf(within("icon1").locator("svg").first());
    await expect(within("icon1").locator("img"), "icon is no image for an icon name").toHaveCount(0);
    await expect(within("qrCode1").locator("svg").first(), "qrCode renders an svg").toBeVisible();
    const qrBefore = await markupOf(within("qrCode1").locator("svg").first());
    await expect(within("timeline1"), "timeline item before").toContainText("T-one");
    await expect(within("avatar1"), "avatar title before").toContainText(STATES.one.avatar);
    await expect(within("multiTags1"), "multiTags before").toContainText("a");
    await expect(within("multiTags1"), "multiTags before").toContainText("b");
    await expect(within("jsonExplorer1"), "jsonExplorer before").toContainText("one");
    await expect(within("jsonEditor1"), "jsonEditor before").toContainText('"k": "one"');
    await expect(within("tableLite1"), "tableLite cell before").toContainText("alpha");

    await view.buttonByTestId(SWITCH_BUTTON_TEST_ID).click();

    // After: each component's own output changed, in its own container.
    await expect(within("text1"), "text after").toHaveText(STATES.two.text);
    await expect(progressFill(within("progress1")), "progress bar after").toHaveAttribute("style", widthOf(STATES.two.progress));
    await expect(within("progressCircle1"), "progressCircle after").toContainText(`${STATES.two.progressCircle}%`);
    await expect(within("divider1"), "divider title after").toHaveText(STATES.two.divider);
    await expect
      .poll(() => markupOf(within("shape1").locator("svg").first()), { message: "shape draws a different svg after its icon changed" })
      .not.toBe(shapeBefore);
    await expect
      .poll(() => markupOf(within("icon1").locator("svg").first()), { message: "icon draws a different svg after its name changed" })
      .not.toBe(iconBefore);
    await expect
      .poll(() => markupOf(within("qrCode1").locator("svg").first()), { message: "qrCode draws a different svg after its value changed" })
      .not.toBe(qrBefore);
    await expect(within("timeline1"), "timeline item after").toContainText("T-two");
    await expect(within("avatar1"), "avatar title after").toContainText(STATES.two.avatar);
    await expect(within("multiTags1"), "multiTags after").toHaveText("c");
    await expect(within("jsonExplorer1"), "jsonExplorer after").toContainText("two");
    await expect(within("jsonEditor1"), "jsonEditor after").toContainText('"k": "two"');
    await expect(within("tableLite1"), "tableLite cell after").toContainText("beta");
    await expect(within("tableLite1"), "tableLite cell before is gone").not.toContainText("alpha");
  });

  test("icon: a value that is an image URL is drawn as an image", async ({ page, apiUser }) => {
    const items = stackItems([
      component("icon", { id: "ic", testId: testIdOf("icon1"), w: 4, h: 6, comp: { icon: PNG_RED } }),
    ]);
    const view = await openSeededView(page, apiUser.orgId, "e2e-s7-icon-image", items);

    await expect(view.byTestId(testIdOf("icon1")).locator("img"), "icon draws the data: URI as an image").toHaveAttribute(
      "src",
      PNG_RED,
    );
    await expect(view.byTestId(testIdOf("icon1")).locator("svg"), "no icon svg is drawn for an image URL").toHaveCount(0);
  });

  test(
    "icon: a value that changes from an icon name to an image URL draws the image",
    { tag: [TAGS.QUARANTINE] },
    async ({ page, apiUser }, testInfo) => {
      testInfo.annotations.push({
        type: "defect",
        description:
          "CD-9 candidate (not yet in the defects report): after the value changes from an icon name to an image URL the icon " +
          "keeps drawing the old icon (observed: the home icon stays). Cause, read from the source and not verified by a fix: " +
          "IconControlView keeps the old icon for one render (useIcon sets its state in an effect), caches its view under the " +
          "new value in IconDictionary, and the cached entry then passes the title check (undefined === undefined) in every " +
          "later render (iconControl.tsx IconControlView, lowcoder-design useIcon). A page that starts with the image URL draws it.",
      });
      const items = stackItems([
        button({
          id: "sw",
          name: "bSwitch",
          text: "Switch state",
          testId: SWITCH_BUTTON_TEST_ID,
          onEvent: [eventHandler("click", setTempState(STATE_NAME, PNG_RED))],
        }),
        component("icon", { id: "ic", testId: testIdOf("icon1"), w: 4, h: 6, comp: { icon: `{{${STATE_NAME}.value}}` } }),
      ]);
      const view = await openSeededView(page, apiUser.orgId, "e2e-s7-icon-switch", items, {
        tempStates: [tempState({ id: "s1", name: STATE_NAME, value: JSON.stringify(RECORDED_ICON) })],
      });
      await expect(view.byTestId(testIdOf("icon1")).locator("svg").first(), "the icon name is drawn as an svg").toBeVisible();

      await view.buttonByTestId(SWITCH_BUTTON_TEST_ID).click();

      await expect(view.byTestId(testIdOf("icon1")).locator("img"), "the image URL is drawn as an image").toHaveAttribute(
        "src",
        PNG_RED,
      );
    },
  );
});
