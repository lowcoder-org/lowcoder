import { createApp, getAppDsl } from "../../src/api/client";
import { SAVE_POLL_TIMEOUT_MS, TAGS } from "../../src/constants";
import { expect, test } from "../../src/fixtures";
import { EditorPage } from "../../src/pages/EditorPage";

interface SavedLayoutItem {
  w: number;
}

/**
 * Exposes defect D-5 (client/E2E-TESTING-defects-report.md): a component dropped right after the editor reports
 * ready is saved with width 0. Quarantined because it fails on the 3.0.0 baseline; run it with
 * E2E_INCLUDE_QUARANTINE=1. It passes when the editor is fixed.
 */
test("a component dropped right after the editor is ready has a usable width", { tag: TAGS.QUARANTINE }, async ({
  page,
  apiUser,
}) => {
  const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-drop-size" });
  const editor = new EditorPage(page);

  await editor.open(appId, { settleGrid: false });
  await editor.dragFromInsertPanel("button", "Button", { x: 120, y: 40 });
  await expect(editor.canvasItems("button")).toHaveCount(1);

  await expect
    .poll(async () => JSON.stringify((await getAppDsl(page.request, appId)).applicationDSL), {
      timeout: SAVE_POLL_TIMEOUT_MS,
      message: "the saved app contains the button",
    })
    .toContain('"compType":"button"');
  const dsl = (await getAppDsl(page.request, appId)).applicationDSL as { ui: { layout: Record<string, SavedLayoutItem> } };
  const [item] = Object.values(dsl.ui.layout);
  expect(item?.w, "the saved width of the dropped button").toBeGreaterThan(0);
});
