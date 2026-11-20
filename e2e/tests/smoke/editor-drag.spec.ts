import { writeFileSync } from "node:fs";
import { createApp, getAppDsl } from "../../src/api/client";
import { BUTTON_COMP_TYPE, BUTTON_SEARCH_TEXT, DROP_TARGET, FIRST_BUTTON_NAME, SAVE_POLL_TIMEOUT_MS, TAGS } from "../../src/constants";
import { expect, test } from "../../src/fixtures";
import { EditorPage } from "../../src/pages/EditorPage";

test("a component dragged from the insert panel is on the canvas and saved", { tag: TAGS.SMOKE }, async ({
  page,
  apiUser,
}, testInfo) => {
  const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-drag" });
  const editor = new EditorPage(page);

  await editor.open(appId);
  await expect(editor.canvasItems(BUTTON_COMP_TYPE)).toHaveCount(0);
  await editor.dragFromInsertPanel(BUTTON_COMP_TYPE, BUTTON_SEARCH_TEXT, DROP_TARGET);
  await expect(editor.canvasItems(BUTTON_COMP_TYPE), "the button is on the canvas").toHaveCount(1);
  await expect(editor.canvasItemNamed(FIRST_BUTTON_NAME), "it got the first free button name").toHaveCount(1);

  // The editor autosaves; assert on what is stored, not only on what is shown.
  await expect
    .poll(async () => JSON.stringify(await getAppDsl(page.request, appId)), {
      timeout: SAVE_POLL_TIMEOUT_MS,
      message: "the saved app contains the button",
    })
    .toContain(`"compType":"${BUTTON_COMP_TYPE}"`);

  const saved = await getAppDsl(page.request, appId);
  const file = testInfo.outputPath("app-dsl.json");
  writeFileSync(file, JSON.stringify(saved, null, 2));
  await testInfo.attach("app-dsl.json", { path: file });
});
