import { currentUser } from "../../src/api/client";
import { SETTING_PATHS, UI_PATHS } from "../../src/constants";
import { expect, test } from "../../src/fixtures";
import { ApiKeysCard, MASKED_TOKEN_PATTERN } from "../../src/pages/ApiKeysCard";
import { issuedAtSecond } from "../../src/security/tokens";
import { SettingPage } from "../../src/pages/SettingPage";
import { joinWorkspace } from "../../src/security/actors";
import { WorkspacesPage } from "../../src/pages/WorkspacesPage";
import { ProfileModal } from "../../src/pages/ProfileModal";
import { ProfilePage } from "../../src/pages/ProfilePage";
import { UserMenu } from "../../src/pages/UserMenu";

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
});
