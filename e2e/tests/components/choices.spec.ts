import type { Locator, Page } from "@playwright/test";
import { boundText, boundTextTestId, openSeededView, testIdOf } from "../../src/components/scenario";
import { component, stackItems } from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";
import type { AppViewPage } from "../../src/pages/AppViewPage";

/**
 * S3 of client/E2E-TESTING-components-p3-simple-scenarios-plan.md: the choice components. Every component keeps its
 * recorded default (names `select1` ... `transfer1`), gets a test id and a text bound to its own exposed state, and
 * gets one action; after each action every text is compared, so an action that also changed another component fails.
 */
const OPTION_TWO = "Option 2";
const TREE_NODE = "North America";
const TREE_NODE_VALUE = "northAmerica";
const CASCADER_PATH = ["New South Wales", "Sydney", "Sydney Opera House"] as const;
const TRANSFER_ITEM = "Content 1";
const TRANSFER_ITEM_KEY = "1";
/** Position (0-based) of the star the rating test clicks, and the value that star stands for. */
const RATING_STAR_INDEX = 2;
const RATING_STAR_VALUE = 3;
/** The title the left list of a transfer must carry if the component were right: the source list is on the left. */
const TRANSFER_LEFT_TITLE_EXPECTED = "Source Data";
const TRANSFER_LEFT_TITLE_DEFECT = "Target Data";

/** A text per exposed value; `expression` is evaluated by the app. The key is the text's name and the order of the page. */
const BOUND_EXPRESSIONS = {
  select1: "{{select1.value}}",
  multiSelect1: "{{JSON.stringify(multiSelect1.value)}}",
  radio1: "{{radio1.value}}",
  checkbox1: "{{JSON.stringify(checkbox1.value)}}",
  segmentedControl1: "{{segmentedControl1.value}}",
  switch1: "{{switch1.value}}",
  toggleButton1: "{{toggleButton1.value}}",
  rating1: "{{rating1.value}}",
  cascader1: "{{JSON.stringify(cascader1.value)}}",
  tree1: "{{JSON.stringify(tree1.value)}}",
  treeSelect1: "{{JSON.stringify(treeSelect1.value)}}",
  transfer1Selected: "{{JSON.stringify(transfer1.selectedKeys)}}",
  transfer1Target: "{{JSON.stringify(transfer1.targetKeys)}}",
} as const;
type TextName = keyof typeof BOUND_EXPRESSIONS;

const COMPONENT_TYPES = [
  "select",
  "multiSelect",
  "radio",
  "checkbox",
  "segmentedControl",
  "switch",
  "toggleButton",
  "rating",
  "cascader",
  "tree",
  "treeSelect",
  "transfer",
] as const;

/** The texts that show each component's state; transfer exposes two lists of keys. */
const TEXT_NAMES_OF: Record<(typeof COMPONENT_TYPES)[number], TextName[]> = {
  select: ["select1"],
  multiSelect: ["multiSelect1"],
  radio: ["radio1"],
  checkbox: ["checkbox1"],
  segmentedControl: ["segmentedControl1"],
  switch: ["switch1"],
  toggleButton: ["toggleButton1"],
  rating: ["rating1"],
  cascader: ["cascader1"],
  tree: ["tree1"],
  treeSelect: ["treeSelect1"],
  transfer: ["transfer1Selected", "transfer1Target"],
};
const COMPONENT_WIDTH = 12;

/** What every text reads right after load (recorded defaults: `""` values, `multiSelect` and `cascader` preset). */
const INITIAL_TEXTS: Record<TextName, string> = {
  select1: "",
  multiSelect1: '["1","2"]',
  radio1: "",
  checkbox1: "[]",
  segmentedControl1: "",
  switch1: "false",
  toggleButton1: "false",
  rating1: "0",
  cascader1: '["California","San Francisco","The Golden Gate Bridge"]',
  tree1: "[]",
  treeSelect1: "[]",
  transfer1Selected: "[]",
  transfer1Target: "[]",
};

/** The popup of an open antd select-like control: closed popups stay in the DOM, so only the visible one counts. */
function openPopup(page: Page): Locator {
  return page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden)");
}

async function expectTexts(view: AppViewPage, expected: Record<TextName, string>, step: string): Promise<void> {
  for (const name of Object.keys(expected) as TextName[]) {
    await expect(view.byTestId(boundTextTestId(name)), `${step}: text of ${name}`).toHaveText(expected[name]);
  }
}

test.describe("S3 choice components", () => {
  test("one action per component changes its own bound text and no other", async ({ page, apiUser }, testInfo) => {
    const items = stackItems(
      COMPONENT_TYPES.flatMap((type, index) => {
        const textNames = TEXT_NAMES_OF[type];
        return [
          component(type, { id: `c${index}`, testId: testIdOf(`${type}1`), w: COMPONENT_WIDTH }),
          ...textNames.map((name) => boundText({ id: name, name, expression: BOUND_EXPRESSIONS[name] })),
        ];
      }),
    );
    const view = await openSeededView(page, apiUser.orgId, "e2e-s3-choices", items);
    const expected: Record<TextName, string> = { ...INITIAL_TEXTS };
    const within = (name: string): Locator => view.byTestId(testIdOf(name));

    await expectTexts(view, expected, "before any action");

    // select: open, pick Option 2 from the open popup.
    await within("select1").getByRole("combobox").click();
    await openPopup(page).getByText(OPTION_TWO, { exact: true }).click();
    expected.select1 = "2";
    await expectTexts(view, expected, "select");

    // multiSelect: Option 2 is selected by default, so the click removes it.
    await within("multiSelect1").getByRole("combobox").click();
    await openPopup(page).getByText(OPTION_TWO, { exact: true }).click();
    await page.keyboard.press("Escape");
    expected.multiSelect1 = '["1"]';
    await expectTexts(view, expected, "multiSelect");

    // click, not check(): the group is controlled, the checked state follows the app's state a moment after the click.
    await within("radio1").getByRole("radio", { name: OPTION_TWO }).click();
    expected.radio1 = "2";
    await expectTexts(view, expected, "radio");

    await within("checkbox1").getByRole("checkbox", { name: OPTION_TWO }).click();
    expected.checkbox1 = '["2"]';
    await expectTexts(view, expected, "checkbox");

    await within("segmentedControl1").getByText(OPTION_TWO, { exact: true }).click();
    expected.segmentedControl1 = "2";
    await expectTexts(view, expected, "segmentedControl");

    await within("switch1").getByRole("switch").click();
    expected.switch1 = "true";
    await expectTexts(view, expected, "switch");

    const toggle = within("toggleButton1").getByRole("button", { name: "Show" });
    await toggle.click();
    expected.toggleButton1 = "true";
    await expectTexts(view, expected, "toggleButton");
    await expect(within("toggleButton1").getByRole("button", { name: "Hide" }), "toggleButton shows its true text").toBeVisible();

    await within("rating1").locator(".ant-rate-star").nth(RATING_STAR_INDEX).click();
    expected.rating1 = String(RATING_STAR_VALUE);
    await expectTexts(view, expected, "rating");

    // cascader: one click per level; the last level is a leaf, so it selects and closes the menu.
    // The selected path's text covers the search input, so the click goes to that text.
    await within("cascader1").locator(".ant-select-selection-item").click();
    const menus = page.locator(".ant-cascader-dropdown");
    for (const level of CASCADER_PATH) {
      await menus.getByText(level, { exact: true }).click();
    }
    expected.cascader1 = JSON.stringify(CASCADER_PATH);
    await expectTexts(view, expected, "cascader");

    // tree (selectType single): a click on the node's title selects it and sets the tree's value only.
    await within("tree1").getByText(TREE_NODE, { exact: true }).click();
    expected.tree1 = JSON.stringify([TREE_NODE_VALUE]);
    await expectTexts(view, expected, "tree");

    // treeSelect: open it, pick the same node in the popup; sets only the treeSelect's own value.
    await within("treeSelect1").getByRole("combobox").click();
    await openPopup(page).getByText(TREE_NODE, { exact: true }).click();
    expected.treeSelect1 = JSON.stringify([TREE_NODE_VALUE]);
    await expectTexts(view, expected, "treeSelect");

    // transfer, located by position: the view passes its two titles in the order [target, source] (transferComp.tsx:141).
    const lists = within("transfer1").locator(".ant-transfer-list");
    const leftTitle = (await lists.nth(0).locator(".ant-transfer-list-header").innerText()).replace(/\s+/g, " ");
    if (leftTitle.includes(TRANSFER_LEFT_TITLE_DEFECT) && !leftTitle.includes(TRANSFER_LEFT_TITLE_EXPECTED)) {
      testInfo.annotations.push({
        type: "defect",
        description:
          `CD-8 candidate (not yet in the defects report): the left list of transfer is headed "${TRANSFER_LEFT_TITLE_DEFECT}" ` +
          `and holds the source items; the titles are passed as [targetTitle, sourceTitle] (transferComp.tsx:141). Header read: "${leftTitle}"`,
      });
    }
    await lists.nth(0).getByText(TRANSFER_ITEM, { exact: true }).click();
    expected.transfer1Selected = JSON.stringify([TRANSFER_ITEM_KEY]);
    await expectTexts(view, expected, "transfer: select");

    await within("transfer1").locator(".ant-transfer-operation button").nth(0).click();
    expected.transfer1Target = JSON.stringify([TRANSFER_ITEM_KEY]);
    // Whether antd clears the moved key from `selectedKeys` is not asserted (plan: NOT VERIFIED), so only the target is read.
    await expect(view.byTestId(boundTextTestId("transfer1Target")), "transfer: move writes targetKeys").toHaveText(
      expected.transfer1Target,
    );
    for (const name of Object.keys(expected) as TextName[]) {
      if (name === "transfer1Selected" || name === "transfer1Target") {
        continue;
      }
      await expect(view.byTestId(boundTextTestId(name)), `transfer: text of ${name} unchanged`).toHaveText(expected[name]);
    }
  });
});
