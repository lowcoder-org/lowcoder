import { createApp, getAppDsl } from "../../src/api/client";
import {
  BUTTON_COMP_TYPE,
  BUTTON_SEARCH_TEXT,
  DROP_TARGET,
  SAVE_POLL_TIMEOUT_MS,
  TAGS,
} from "../../src/constants";
import { expect, test } from "../../src/fixtures";
import { EditorPage } from "../../src/pages/EditorPage";

const BUTTON_LABEL = "Form Button";
const MOVE_TARGET = { x: 600, y: 300 };
const WIDEN_BY_PIXELS = 200;

interface SavedItemLayout {
  x: number;
  y: number;
  w: number;
}

async function savedLayout(request: Parameters<typeof getAppDsl>[0], appId: string): Promise<SavedItemLayout | undefined> {
  const dsl = (await getAppDsl(request, appId)).applicationDSL as { ui?: { layout: Record<string, SavedItemLayout> } };
  return dsl.ui ? Object.values(dsl.ui.layout)[0] : undefined;
}

test.describe("arranging a component on the canvas", () => {
  test("a dragged component keeps its new position in the saved app", { tag: TAGS.CORE }, async ({ page, apiUser }) => {
    const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-move" });
    const editor = new EditorPage(page);
    await editor.open(appId);
    await editor.dragFromInsertPanel(BUTTON_COMP_TYPE, BUTTON_SEARCH_TEXT, DROP_TARGET);
    await expect.poll(() => savedLayout(page.request, appId), { timeout: SAVE_POLL_TIMEOUT_MS }).toBeDefined();
    const before = (await savedLayout(page.request, appId))!;

    await editor.moveButton(BUTTON_LABEL, MOVE_TARGET);

    await expect
      .poll(async () => (await savedLayout(page.request, appId))?.x, {
        timeout: SAVE_POLL_TIMEOUT_MS,
        message: "the saved position is to the right of the first one",
      })
      .toBeGreaterThan(before.x);
    expect((await savedLayout(page.request, appId))!.y, "and below it").toBeGreaterThan(before.y);
  });

  test("a component widened with its resize handle keeps the new width in the saved app", { tag: TAGS.CORE }, async ({
    page,
    apiUser,
  }) => {
    const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-resize" });
    const editor = new EditorPage(page);
    await editor.open(appId);
    await editor.dragFromInsertPanel(BUTTON_COMP_TYPE, BUTTON_SEARCH_TEXT, DROP_TARGET);
    await expect.poll(() => savedLayout(page.request, appId), { timeout: SAVE_POLL_TIMEOUT_MS }).toBeDefined();
    const before = (await savedLayout(page.request, appId))!;
    await editor.canvasButton(BUTTON_LABEL).click();

    await editor.widenSelected(WIDEN_BY_PIXELS);

    await expect
      .poll(async () => (await savedLayout(page.request, appId))?.w, {
        timeout: SAVE_POLL_TIMEOUT_MS,
        message: "the saved width is larger than the first one",
      })
      .toBeGreaterThan(before.w);
  });
});
