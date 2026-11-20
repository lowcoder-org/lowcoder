import { readFileSync } from "node:fs";
import { createApp, listAppNames, listRecycledApps } from "../../src/api/client";
import { TAGS } from "../../src/constants";
import { appDsl, button } from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";
import { AppListPage } from "../../src/pages/AppListPage";

const APP_NAME = "e2e-card-app";
const BUTTON_TEXT = "Exported";
const MENU_EXPORT = "Export to JSON";
const MENU_DUPLICATE = "Duplicate app";
const MENU_RENAME = "Rename app";
const MENU_TRASH = "Move to trash";
const COPY_NAME = "e2e-card-copy";
const RENAMED_NAME = "e2e-card-renamed";

function appWithButton() {
  return appDsl([button({ id: "b1", name: "button1", text: BUTTON_TEXT, testId: "e2e-export-button" })]);
}

test.describe("app card menu and import", () => {
  test("an app exported to JSON holds its DSL and can be imported as a new app", { tag: TAGS.CORE }, async ({
    page,
    apiUser,
  }) => {
    await createApp(page.request, { orgId: apiUser.orgId, name: APP_NAME, dsl: appWithButton() });
    const appList = new AppListPage(page);
    await appList.open();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      appList.chooseFromMenu(APP_NAME, MENU_EXPORT),
    ]);
    const exportedPath = await download.path();
    const exported = JSON.parse(readFileSync(exportedPath, "utf8")) as { applicationDSL: unknown };
    expect(JSON.stringify(exported.applicationDSL), "the export holds the app's DSL").toContain(BUTTON_TEXT);

    const importedName = await appList.importFile(exportedPath);

    // The import takes the exported app's name, so afterwards there are two apps with it.
    expect(importedName).toBe(APP_NAME);
    await expect
      .poll(async () => (await listAppNames(page.request)).filter((name) => name === importedName).length, {
        message: "the server lists the original and the imported app",
      })
      .toBe(2);
  });

  test("an app can be duplicated under a new name from its card menu", { tag: TAGS.CORE }, async ({ page, apiUser }) => {
    await createApp(page.request, { orgId: apiUser.orgId, name: APP_NAME, dsl: appWithButton() });
    const appList = new AppListPage(page);
    await appList.open();

    await appList.chooseFromMenu(APP_NAME, MENU_DUPLICATE);
    await appList.confirmName(COPY_NAME, "OK");

    await expect
      .poll(async () => listAppNames(page.request), { message: "the list holds the app and its copy" })
      .toEqual(expect.arrayContaining([APP_NAME, COPY_NAME]));
    await appList.open();
    await expect(appList.appNamed(COPY_NAME), "the copy is in the list").toBeVisible();
  });

  test("an app can be renamed from its card menu", { tag: TAGS.CORE }, async ({ page, apiUser }) => {
    await createApp(page.request, { orgId: apiUser.orgId, name: APP_NAME, dsl: appWithButton() });
    const appList = new AppListPage(page);
    await appList.open();

    await appList.chooseFromMenu(APP_NAME, MENU_RENAME);
    await appList.confirmName(RENAMED_NAME, "Finish");

    await expect(appList.appNamed(RENAMED_NAME), "the list shows the new name").toBeVisible();
    await expect(appList.appNamed(APP_NAME), "the old name is gone").toHaveCount(0);
    expect(await listAppNames(page.request), "the server has the new name").toEqual([RENAMED_NAME]);
  });

  test("an app moved to the trash from its card menu leaves the list and is in the trash", { tag: TAGS.CORE }, async ({
    page,
    apiUser,
  }) => {
    const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: APP_NAME, dsl: appWithButton() });
    const appList = new AppListPage(page);
    await appList.open();

    await appList.chooseFromMenu(APP_NAME, MENU_TRASH);
    await page.getByRole("button", { name: /^(OK|Confirm|Move to trash|Yes)$/ }).click();

    await expect(appList.appNamed(APP_NAME), "the card is gone from the list").toHaveCount(0);
    await expect
      .poll(async () => (await listRecycledApps(page.request)).map((app) => app.applicationId), {
        message: "the server has the app in the trash",
      })
      .toContain(appId);
  });
});
