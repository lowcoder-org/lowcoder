import { registerUser } from "../../src/api/client";
import { TAGS, TEST_PASSWORD, UI_PATHS } from "../../src/constants";
import { expect, test, uniqueEmail } from "../../src/fixtures";
import { AppListPage } from "../../src/pages/AppListPage";
import { LoginPage } from "../../src/pages/LoginPage";
import { UserMenu } from "../../src/pages/UserMenu";

test.describe("authentication", () => {
  test("a registered user signs in and signs out", { tag: TAGS.CORE }, async ({ page, context }, testInfo) => {
    const email = uniqueEmail("login", testInfo.workerIndex);
    await registerUser(page.request, email);
    await context.clearCookies(); // registering logged the page in; start signed out
    const login = new LoginPage(page);
    const appList = new AppListPage(page);
    const userMenu = new UserMenu(page);

    await login.open();
    await login.signIn(email, TEST_PASSWORD);
    await expect(page, "after signing in the user is on the app list").toHaveURL(UI_PATHS.APP_LIST);
    await expect(appList.title).toBeVisible();

    await userMenu.signOut(email);
    await expect(page, "after signing out the user is on the sign-in page").toHaveURL(UI_PATHS.LOGIN);
    await expect(login.emailInput, "the sign-in form asks for the e-mail again").toBeVisible();
  });

  test("a wrong password is rejected and keeps the user on the sign-in page", { tag: TAGS.CORE }, async ({
    page,
    context,
  }, testInfo) => {
    const email = uniqueEmail("wrongpw", testInfo.workerIndex);
    await registerUser(page.request, email);
    await context.clearCookies();
    const login = new LoginPage(page);

    await login.open();
    await login.signIn(email, `${TEST_PASSWORD}-wrong`);

    await expect(login.invalidCredentialsMessage, "the user is told the credentials are wrong").toBeVisible();
    await expect(page).toHaveURL(UI_PATHS.LOGIN);
  });
});
