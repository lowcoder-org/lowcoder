import { createApp, currentUser } from "../../src/api/client";
import { TEST_PASSWORD, UI_PATHS } from "../../src/constants";
import { expect, test } from "../../src/fixtures";
import { AppListPage } from "../../src/pages/AppListPage";
import { LoginPage } from "../../src/pages/LoginPage";
import { ProfilePage } from "../../src/pages/ProfilePage";
import { SettingPage } from "../../src/pages/SettingPage";
import { joinWorkspace, makeDeveloper } from "../../src/security/actors";
import { lifecycleTestDetails } from "../../src/security/quarantine";

/** The remaining user-facing entries around a user: profile counts, navigation by role, member detail, admin sign-in (LC-OT02 to LC-OT05). */

const CREATED_APPS_LABEL = "Your Created Apps";
const APPS_CREATED = 2;
const CREATED_APP_PREFIX = "e2e-ot-app";
/** The popup of a member's "Detail" ends with the member's language (`UserDetailPopup`). */
const DETAIL_LANGUAGE_TEXT = "Language: en";

test.describe("lifecycle: other pages", () => {
  test("LC-OT02 the profile counts the apps the user created", lifecycleTestDetails("LC-OT02"), async ({ actor }) => {
    const user = await actor("otinfo");
    const profile = new ProfilePage(user.session.page);
    await profile.open();
    await expect(profile.nameInput, "the profile has loaded").toHaveValue(user.email);
    await expect(profile.infoCount(CREATED_APPS_LABEL), "before: the user has created no app").toHaveText("0");
    for (let index = 0; index < APPS_CREATED; index++) {
      await createApp(user.request, { orgId: user.orgId, name: `${CREATED_APP_PREFIX}-${index}` });
    }
    await new AppListPage(user.session.page).open();
    await expect(new AppListPage(user.session.page).appNamed(`${CREATED_APP_PREFIX}-0`), "the app list shows the apps").toBeVisible();

    await profile.open();

    await expect(profile.nameInput, "the profile has loaded again").toHaveValue(user.email);
    await expect(profile.infoCount(CREATED_APPS_LABEL), "the card counts the created apps").toHaveText(String(APPS_CREATED));
  });

  test("LC-OT03 a plain member's navigation shows the workspace tab and no settings, a developer's the opposite", lifecycleTestDetails("LC-OT03"), async ({ actor }) => {
    const owner = await actor("otowner");
    const member = await actor("otmember");
    const developer = await actor("otdev");
    await joinWorkspace(owner, member);
    await joinWorkspace(owner, developer);
    await makeDeveloper(owner, developer);
    const memberList = new AppListPage(member.session.page);
    const developerList = new AppListPage(developer.session.page);
    await memberList.open();
    await developerList.open();

    await expect(memberList.nothingShared, "the member's app list has loaded").toBeVisible();
    await expect(memberList.memberHomeTab, "the member gets the workspace tab").toBeVisible();
    await expect(memberList.settingsEntry, "and no settings").toHaveCount(0);
    await expect(developerList.emptyState, "the developer's app list has loaded").toBeVisible();
    await expect(developerList.settingsEntry, "the developer gets the settings").toBeVisible();
    await expect(developerList.memberHomeTab, "and not the member's tab").toHaveCount(0);
  });

  test("LC-OT04 an admin's member detail shows the member", lifecycleTestDetails("LC-OT04"), async ({ actor }) => {
    const admin = await actor("otadmin");
    const member = await actor("otdetail");
    await joinWorkspace(admin, member);
    const settings = new SettingPage(admin.session.page);
    await settings.openMembers();
    await expect(settings.memberRow(member.email), "the member is listed").toBeVisible();
    await expect(settings.detailDialog, "before: no popup is open").toHaveCount(0);

    await settings.openDetailOf(member.email);

    await expect(settings.detailDialog.getByText(member.email).first(), "the popup shows the member's address").toBeVisible();
    await expect(settings.detailDialog.getByText(DETAIL_LANGUAGE_TEXT), "and the member's language").toBeVisible();
  });

  test("LC-OT05 the admin sign-in page signs in any user (characterisation)", lifecycleTestDetails("LC-OT05"), async ({ actor, page }) => {
    const user = await actor("otadminlogin");
    const login = new LoginPage(page);
    await page.goto(UI_PATHS.ADMIN_LOGIN);
    await expect(login.emailInput, "the admin sign-in page is open to a signed-out visitor").toBeVisible();

    await login.signInOnWorkspacePage(user.email, TEST_PASSWORD);

    await expect(page, "a user who is no super admin lands on the app list").toHaveURL(UI_PATHS.APP_LIST);
    expect((await currentUser(page.request)).id, "signed in as that user").toBe(user.userId);
  });
});
