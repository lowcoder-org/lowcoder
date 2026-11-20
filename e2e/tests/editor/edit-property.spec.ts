import { createApp, getAppDsl } from "../../src/api/client";
import { SAVE_POLL_TIMEOUT_MS, TAGS } from "../../src/constants";
import { expect, test } from "../../src/fixtures";
import { EditorPage } from "../../src/pages/EditorPage";
import { PropertyPanel } from "../../src/pages/PropertyPanel";

const DEFAULT_LABEL = "Form Button";
const NEW_LABEL = "Saved label";

test("a property changed in the editor is shown, saved and still there after a reload", { tag: TAGS.CORE }, async ({
  page,
  apiUser,
}) => {
  const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-property" });
  const editor = new EditorPage(page);
  const properties = new PropertyPanel(page);

  await editor.open(appId);
  await editor.dragFromInsertPanel("Button", DEFAULT_LABEL, { x: 120, y: 40 });
  await editor.canvasButton(DEFAULT_LABEL).click();
  await properties.setValue("Text", NEW_LABEL);

  await expect(editor.canvasButton(NEW_LABEL), "the canvas shows the new label").toBeVisible();
  await expect
    .poll(async () => JSON.stringify((await getAppDsl(page.request, appId)).applicationDSL), {
      timeout: SAVE_POLL_TIMEOUT_MS,
      message: "the saved app holds the new label",
    })
    .toContain(`"text":"${NEW_LABEL}"`);

  await editor.open(appId);
  await expect(editor.canvasButton(NEW_LABEL), "after a reload the editor shows the saved label").toBeVisible();
});
