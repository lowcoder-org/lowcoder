import { createApp, listRecycledApps, recycleApp, restoreApp } from "../../src/api/client";
import { TAGS } from "../../src/constants";
import { expect, test } from "../../src/fixtures";
import { AppListPage } from "../../src/pages/AppListPage";

const APP_NAME = "e2e-trash-me";

test("an app moved to the trash leaves the app list and returns when restored", { tag: TAGS.CORE }, async ({
  page,
  apiUser,
}) => {
  const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: APP_NAME });
  const appList = new AppListPage(page);

  await appList.open();
  await expect(appList.appNamed(APP_NAME), "a new app is in the list").toBeVisible();

  await recycleApp(page.request, appId);
  expect((await listRecycledApps(page.request)).map((app) => app.applicationId), "the trash has it").toContain(appId);
  await appList.open();
  await expect(appList.appNamed(APP_NAME), "the UI list no longer shows it").toHaveCount(0);

  await restoreApp(page.request, appId);
  expect((await listRecycledApps(page.request)).map((app) => app.applicationId), "the trash no longer has it").not.toContain(appId);
  await appList.open();
  await expect(appList.appNamed(APP_NAME), "a restored app is back in the list").toBeVisible();
});
