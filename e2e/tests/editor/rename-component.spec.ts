import { createApp, getAppDsl } from "../../src/api/client";
import {
  BUTTON_COMP_TYPE,
  BUTTON_SEARCH_TEXT,
  DROP_TARGET,
  FIRST_BUTTON_NAME,
  SAVE_POLL_TIMEOUT_MS,
  TAGS,
} from "../../src/constants";
import { expect, test } from "../../src/fixtures";
import { EditorPage } from "../../src/pages/EditorPage";
import { PropertyPanel } from "../../src/pages/PropertyPanel";

const NEW_NAME = "submitButton";

test("a renamed component keeps its new name on the canvas, in the saved app and after a reload", { tag: TAGS.CORE }, async ({
  page,
  apiUser,
}) => {
  const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-rename" });
  const editor = new EditorPage(page);
  const properties = new PropertyPanel(page);

  await editor.open(appId);
  await editor.dragFromInsertPanel(BUTTON_COMP_TYPE, BUTTON_SEARCH_TEXT, DROP_TARGET);
  await expect(editor.canvasItemNamed(FIRST_BUTTON_NAME)).toHaveCount(1);
  await editor.canvasItemNamed(FIRST_BUTTON_NAME).getByRole("button").click();
  await properties.rename(FIRST_BUTTON_NAME, NEW_NAME);

  await expect(editor.canvasItemNamed(NEW_NAME), "the canvas item has the new name").toHaveCount(1);
  await expect(editor.canvasItemNamed(FIRST_BUTTON_NAME), "the old name is gone").toHaveCount(0);
  await expect
    .poll(async () => JSON.stringify((await getAppDsl(page.request, appId)).applicationDSL), {
      timeout: SAVE_POLL_TIMEOUT_MS,
      message: "the saved app holds the new name",
    })
    .toContain(`"name":"${NEW_NAME}"`);

  await editor.open(appId);
  await expect(editor.canvasItemNamed(NEW_NAME), "after a reload the item still has the new name").toHaveCount(1);
});
