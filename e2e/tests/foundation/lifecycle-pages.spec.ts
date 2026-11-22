import { createGroup, currentUser, listGroupMembers, listGroups } from "../../src/api/client";
import { SETTING_PATHS, TEST_PASSWORD, UI_PATHS } from "../../src/constants";
import { expect, test, uniqueEmail } from "../../src/fixtures";
import { ProvidersPage } from "../../src/pages/ProvidersPage";
import { LoginPage } from "../../src/pages/LoginPage";
import { PasswordRecoveryPage } from "../../src/pages/PasswordRecoveryPage";
import { ApiKeysCard, MASKED_TOKEN_PATTERN } from "../../src/pages/ApiKeysCard";
import { issuedAtSecond } from "../../src/security/tokens";
import { ShareDialog } from "../../src/pages/ShareDialog";
import { EditorPage } from "../../src/pages/EditorPage";
import { createApp } from "../../src/api/client";
import { GroupsPage } from "../../src/pages/GroupsPage";
import { SettingPage } from "../../src/pages/SettingPage";
import { joinWorkspace } from "../../src/security/actors";
import { WorkspacesPage } from "../../src/pages/WorkspacesPage";
import { ProfileModal } from "../../src/pages/ProfileModal";
import { ProfilePage } from "../../src/pages/ProfilePage";
import { UserMenu } from "../../src/pages/UserMenu";
import { AppListPage } from "../../src/pages/AppListPage";
import { AuthPage } from "../../src/pages/AuthPage";

/** Unit tests of the page objects of the lifecycle specs: each is run where it must work, as the owner. */
test.describe("lifecycle page objects", () => {
  test("ProfilePage opens the page, holds the name, saves a new one and lists the languages", async ({ actor }) => {
    const user = await actor("pgprofile");
    const profile = new ProfilePage(user.session.page);

    await profile.open();
    await expect(profile.aboutText).toBeVisible();
    await expect(profile.nameInput).toHaveValue(user.email);
    await expect(profile.languageLabel).toBeVisible();
    await expect(profile.avatarFileInput, "exactly one upload input").toHaveCount(1);
    await profile.setName("Page Object Name");

    await expect.poll(async () => (await currentUser(user.request)).username).toBe("Page Object Name");
  });

  test("UserMenu.openProfile opens the modal, ProfileModal reaches the password fields", async ({ actor }) => {
    const user = await actor("pgmodal");
    const page = user.session.page;
    await page.goto(UI_PATHS.APP_LIST_PATH);

    await new UserMenu(page).openProfile(user.email);
    const modal = new ProfileModal(page);
    await expect(modal.title).toBeVisible();
    await expect(modal.nameInput).toHaveValue(user.email);
    await modal.modifyPasswordButton.click();
    await modal.fillPasswordChange("Old-pass-1", "New-pass-1");

    await expect(modal.passwordFields, "old, new and confirmation").toHaveCount(3);
    await expect(modal.submitButton).toBeEnabled();
  });

  test("ApiKeysCard creates a key, reads its token and deletes it; a listed token is masked", async ({ actor }) => {
    const user = await actor("pgkeys");
    const profile = new ProfilePage(user.session.page);
    const keys = new ApiKeysCard(user.session.page);
    await profile.open();
    await expect(keys.title).toBeVisible();
    await expect(keys.rows, "before: an empty table").toHaveCount(0);

    await keys.create("pg-key", "page object");

    await expect(keys.rowOf("pg-key")).toBeVisible();
    await expect(keys.newKeyAlert).toBeVisible();
    expect((await keys.tokenOf("pg-key")).length, "the new key shows its full token").toBeGreaterThan(MASKED_TOKEN_PATTERN.source.length);
    const issuedAt = issuedAtSecond(await keys.tokenOf("pg-key"));
    await user.session.page.reload();
    expect(MASKED_TOKEN_PATTERN.test(await keys.tokenOf("pg-key")), "a listed token is masked").toBe(true);
    await expect.poll(() => Math.floor(Date.now() / 1000), "wait for the next second").toBeGreaterThan(issuedAt);
    await keys.create("pg-key-second");
    await expect(keys.rowOf("pg-key-second")).toBeVisible();

    await keys.deleteKey("pg-key");

    await expect(keys.rowOf("pg-key"), "deleteKey removes the row of a key that is not the last").toHaveCount(0);
    await expect(keys.rowOf("pg-key-second")).toBeVisible();
  });

  test("WorkspacesPage lists rows, creates through UserMenu and switches", async ({ actor }) => {
    const user = await actor("pgorgs");
    const page = user.session.page;
    const list = new WorkspacesPage(page);
    await page.goto("/apps");

    await new UserMenu(page).createWorkspace(user.email);

    await expect(list.rows, "the user has two workspaces").toHaveCount(2);
    const created = (await currentUser(user.request)).orgAndRoles.find((entry) => entry.org.id !== user.orgId)?.org.name;
    await expect(list.row(created!).getByText("Switch", { exact: true }), "the new workspace offers Switch").toBeVisible();
    await list.switchTo(created!);
    await expect.poll(async () => (await currentUser(user.request)).currentOrgId, "WorkspacesPage.switchTo switches").not.toBe(user.orgId);
    await new UserMenu(page).switchWorkspace(user.email, (await currentUser(user.request)).orgAndRoles.find((entry) => entry.org.id === user.orgId)!.org.name!);
    await expect.poll(async () => (await currentUser(user.request)).currentOrgId, "UserMenu.switchWorkspace switches back").toBe(user.orgId);
  });

  test("SettingPage: the invite dialog link and the operations cell of a row", async ({ actor }) => {
    const admin = await actor("pgsetting");
    const member = await actor("pgsettingm");
    await joinWorkspace(admin, member);
    const settings = new SettingPage(admin.session.page);

    await admin.session.page.goto(SETTING_PATHS.GROUPS);
    await settings.inviteMembersButton.click();
    expect(await settings.inviteLink(), "the dialog's link").toMatch(/\/invite\/[^/]+$/);
    await admin.session.page.keyboard.press("Escape");
    await settings.openMembers();
    await settings.memberRow(member.email).hover();

    await expect(settings.operationsOf(member.email)).toContainText("Remove from Group");
  });

  test("GroupsPage lists, renames, adds a member to and deletes a group", async ({ actor }) => {
    const admin = await actor("pggroups");
    const member = await actor("pggroupm");
    await joinWorkspace(admin, member);
    const groupId = await createGroup(admin.request, "pg-team");
    const groups = new GroupsPage(admin.session.page);
    await groups.open();
    await expect(groups.row("pg-team")).toBeVisible();

    await groups.rename("pg-team", "pg-team-2");
    await expect(groups.row("pg-team-2")).toBeVisible();
    await groups.manage("pg-team-2");
    await expect(groups.memberRow(admin.email)).toBeVisible();
    await groups.addMembers([member.email]);
    await expect.poll(async () => (await listGroupMembers(admin.request, groupId)).length, "the member is added").toBe(2);
    await groups.open();
    await groups.deleteGroup("pg-team-2");

    await expect(groups.row("pg-team-2")).toHaveCount(0);
    expect((await listGroups(admin.request)).some((group) => group.groupId === groupId)).toBe(false);
  });

  test("ShareDialog opens from the editor, lists rows, adds a member, changes the role and reaches the public switch", async ({ actor }) => {
    const owner = await actor("pgshare");
    const member = await actor("pgsharem");
    await joinWorkspace(owner, member);
    const { appId } = await createApp(owner.request, { orgId: owner.orgId, name: "pg-share-app" });
    await new EditorPage(owner.session.page).open(appId);
    const share = new ShareDialog(owner.session.page);
    await expect(share.publishButton).toBeVisible();

    await share.open();
    await expect(share.rowOf(owner.email), "the creator's row").toBeVisible();
    await share.addMember(member.email);
    await expect(share.roleSelectOf(member.email)).toContainText("Viewer");
    await share.chooseRole(member.email, "Editor");
    await expect(share.roleSelectOf(member.email)).toContainText("Editor");
    await share.next();

    await expect(share.publicSwitch).toBeVisible();
    await expect(share.publicSwitch).not.toBeChecked();
  });

  test("LoginPage.forgotPasswordLink and PasswordRecoveryPage reach the forgot page and show its confirmation", async ({ actor, newUserSession }) => {
    const user = await actor("pgforgot");
    const session = await newUserSession();
    const login = new LoginPage(session.page);
    const recovery = new PasswordRecoveryPage(session.page);

    await login.open();
    await login.emailInput.fill(user.email);
    await login.continueButton.click();
    await login.forgotPasswordLink.click();
    await expect(recovery.emailInput, "the forgot page has an empty address field").toHaveValue("");
    await recovery.submitForgot(user.email);

    await expect(recovery.forgotSuccessMessage).toBeVisible();
    await recovery.openForgot();
    await expect(recovery.submitButton, "openForgot opens the forgot page again").toBeVisible();
  });

  test("SettingPage.sendInvitationTo sends from the invite dialog and inviteNotice shows its notice", async ({ actor }, testInfo) => {
    const admin = await actor("pginvite");
    const settings = new SettingPage(admin.session.page);

    await admin.session.page.goto(SETTING_PATHS.GROUPS);
    await settings.inviteMembersButton.click();
    await expect(settings.inviteDialog).toBeVisible();
    await settings.sendInvitationTo(`pginvitee-${testInfo.workerIndex}-${Date.now()}@example.test`);

    await expect(settings.inviteNotice).toBeVisible();
  });

  test("ProvidersPage lists the e-mail row, opens the add modal and offers the five provider types", async ({ actor }) => {
    const admin = await actor("pgproviders");
    const providers = new ProvidersPage(admin.session.page);

    await providers.open();
    await expect(providers.enabledRows("Email"), "e-mail is listed as enabled").toHaveCount(1);
    await expect(providers.disabledRows("Email"), "and not as disabled").toHaveCount(0);
    await providers.openAddModal();
    await admin.session.page.locator(".ant-modal:visible .ant-select").first().click();

    await expect(admin.session.page.locator(".ant-select-item-option"), "GitHub, Google, Ory, KeyCloak and Generic").toHaveText(["GitHub", "Google", "Ory", "KeyCloak", "Generic"]);
  });

  test("ProfilePage.infoCount reads the number of an Info card", async ({ actor }) => {
    const user = await actor("pginfo");
    const profile = new ProfilePage(user.session.page);
    await profile.open();

    await expect(profile.infoCount("Your Created Apps"), "a new user created no app").toHaveText("0");
    await expect(profile.infoCount("Your Created Modules")).toHaveText("0");
  });

  test("SettingPage.openDetailOf opens the member popup that detailDialog finds", async ({ actor }) => {
    const admin = await actor("pgdetailadmin");
    const member = await actor("pgdetailmember");
    await joinWorkspace(admin, member);
    const settings = new SettingPage(admin.session.page);
    await settings.openMembers();
    await expect(settings.detailDialog, "before: no popup").toHaveCount(0);

    await settings.openDetailOf(member.email);

    await expect(settings.detailDialog).toBeVisible();
  });

  test("AppListPage navigation locators tell an admin from a plain member", async ({ actor }) => {
    const owner = await actor("pgnavowner");
    const member = await actor("pgnavmember");
    await joinWorkspace(owner, member);
    const ownerList = new AppListPage(owner.session.page);
    const memberList = new AppListPage(member.session.page);
    await ownerList.open();
    await memberList.open();

    await expect(ownerList.settingsEntry, "an admin has the settings entry").toBeVisible();
    await expect(ownerList.memberHomeTab).toHaveCount(0);
    await expect(memberList.memberHomeTab, "a member has the home tab").toBeVisible();
  });

  test("AppListPage tour locators find the tour of a UI sign-up and tourClose closes it", async ({ page }, testInfo) => {
    const auth = new AuthPage(page);
    const appList = new AppListPage(page);
    await auth.openRegister();
    await auth.signUp(uniqueEmail("pgtour", testInfo.workerIndex), TEST_PASSWORD);

    await expect(appList.tourDialog, "the tour opens after the sign-up").toBeVisible();
    await expect(appList.tourText, "with its text").toBeVisible();
    await appList.tourClose.click();

    await expect(appList.tourDialog, "tourClose closes it").toHaveCount(0);
  });
});
