import { createApp, getAppDsl } from "../../src/api/client";
import { BUTTON_COMP_TYPE, BUTTON_SEARCH_TEXT, DROP_TARGET, SAVE_POLL_TIMEOUT_MS } from "../../src/constants";
import { expect, test } from "../../src/fixtures";
import { EditorPage } from "../../src/pages/EditorPage";

interface SavedLayoutItem {
  w: number;
}

/**
 * Regression test of defect D-5: on the 3.0.0 baseline a component dropped right after the editor reports ready was saved
 * with width 0, because the root canvas's measured width is stored a moment after the editor is ready. The page is opened
 * with `settleGrid: false`, which is what makes this a test of that race.
 */
test("a component dropped right after the editor is ready has a usable width", async ({
  page,
  apiUser,
}) => {
  const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-drop-size" });
  const editor = new EditorPage(page);

  await editor.open(appId, { settleGrid: false });
  await editor.dragFromInsertPanel(BUTTON_COMP_TYPE, BUTTON_SEARCH_TEXT, DROP_TARGET);
  await expect(editor.canvasItems(BUTTON_COMP_TYPE)).toHaveCount(1);

  await expect
    .poll(async () => JSON.stringify((await getAppDsl(page.request, appId)).applicationDSL), {
      timeout: SAVE_POLL_TIMEOUT_MS,
      message: "the saved app contains the button",
    })
    .toContain(`"compType":"${BUTTON_COMP_TYPE}"`);
  const dsl = (await getAppDsl(page.request, appId)).applicationDSL as { ui: { layout: Record<string, SavedLayoutItem> } };
  const [item] = Object.values(dsl.ui.layout);
  expect(item?.w, "the saved width of the dropped button").toBeGreaterThan(0);
});
