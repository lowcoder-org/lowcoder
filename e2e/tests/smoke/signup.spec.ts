import { TAGS, TEST_PASSWORD, UI_PATHS } from "../../src/constants";
import { expect, test, uniqueEmail } from "../../src/fixtures";
import { AppListPage } from "../../src/pages/AppListPage";
import { AuthPage } from "../../src/pages/AuthPage";

test("sign-up through the UI lands on the empty app list", { tag: TAGS.SMOKE }, async ({ page }, testInfo) => {
  const auth = new AuthPage(page);
  const appList = new AppListPage(page);

  await auth.openRegister();
  await auth.signUp(uniqueEmail("ui", testInfo.workerIndex), TEST_PASSWORD);

  await expect(page, "after sign-up the user is on the app list").toHaveURL(UI_PATHS.APP_LIST);
  await expect(appList.title).toBeVisible();
  await expect(appList.emptyState, "a new workspace has no apps").toBeVisible();
});
