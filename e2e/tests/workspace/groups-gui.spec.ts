import { apiRaw, createApp, createGroup, grantAppPermission, listGroupMembers, listGroups, publishApp, viewAppRaw } from "../../src/api/client";
import { API_ERRORS, API_OK, UI_PATHS, groupLeavePath, groupPath, groupUpdatePath } from "../../src/constants";
import { expect, test } from "../../src/fixtures";
import { AppListPage } from "../../src/pages/AppListPage";
import { GroupsPage } from "../../src/pages/GroupsPage";
import { SettingPage } from "../../src/pages/SettingPage";
import { addGroupMember } from "../../src/api/client";
import { joinWorkspace, makeDeveloper } from "../../src/security/actors";
import { expectAnswer } from "../../src/security/assertions";
import { lifecycleTestDetails } from "../../src/security/quarantine";

/** The user groups of a workspace in the UI (LC-GR01 to LC-GR10). */

const TEAM = "e2e-team";
const RENAMED_TEAM = "e2e-team-renamed";
const DEFAULT_GROUP_NAME = "New Group 1";
/** The cleanup of a deleted group's rows is asynchronous (a listener on its own scheduler). */
const CLEANUP_TIMEOUT_MS = 30_000;
const LAST_ADMIN_TEXT = "The Last Administrator Cannot Exit.";
const GROUP_ROLES = { ADMIN: "admin", MEMBER: "member" } as const;

test.describe("lifecycle: user groups", () => {
  test("LC-GR01 an admin creates a group from the list", lifecycleTestDetails("LC-GR01"), async ({ actor }) => {
    const admin = await actor("grcreate");
    const groups = new GroupsPage(admin.session.page);
    await groups.open();
    await expect(groups.row("Developers"), "the group list has loaded").toBeVisible();
    const before = (await listGroups(admin.request)).length;

    await groups.createButton.click();

    await expect(groups.row(DEFAULT_GROUP_NAME), "the new group is listed under its default name").toBeVisible();
    const after = await listGroups(admin.request);
    expect(after.length, "the server holds one more group").toBe(before + 1);
    expect(after.some((group) => group.groupName === DEFAULT_GROUP_NAME)).toBe(true);
  });

  test("LC-GR02 an admin renames a group inline and an empty name is refused", lifecycleTestDetails("LC-GR02"), async ({ actor }) => {
    const admin = await actor("grrename");
    const groupId = await createGroup(admin.request, TEAM);
    const groups = new GroupsPage(admin.session.page);
    await groups.open();
    await expect(groups.row(TEAM)).toBeVisible();

    await groups.rename(TEAM, RENAMED_TEAM);

    await expect.poll(async () => (await listGroups(admin.request)).find((group) => group.groupId === groupId)?.groupName, "the server stores the new name").toBe(RENAMED_TEAM);
    await expect(groups.row(RENAMED_TEAM)).toBeVisible();

    await groups.rename(RENAMED_TEAM, " ");

    await expect(groups.emptyNameMessage, "an empty name is refused").toBeVisible();
    expect((await listGroups(admin.request)).find((group) => group.groupId === groupId)?.groupName, "the name is unchanged").toBe(RENAMED_TEAM);
  });

  test("LC-GR03 a deleted group's members lose the app it was granted", lifecycleTestDetails("LC-GR03"), async ({ actor }) => {
    const admin = await actor("grdelete");
    const member = await actor("grdeleted");
    await joinWorkspace(admin, member);
    const { appId } = await createApp(admin.request, { orgId: admin.orgId, name: "e2e-group-app" });
    await publishApp(admin.request, appId);
    const groupId = await createGroup(admin.request, TEAM);
    await addGroupMember(admin.request, groupId, member.userId, "member");
    await grantAppPermission(admin.request, appId, { role: "viewer", userIds: [], groupIds: [groupId] });
    expect((await viewAppRaw(member.request, appId)).code, "before: the group member views the app").toBe(API_OK);
    const groups = new GroupsPage(admin.session.page);
    await groups.open();
    await expect(groups.row(TEAM)).toBeVisible();

    await groups.deleteGroup(TEAM);

    await expect(groups.row(TEAM), "the group leaves the list").toHaveCount(0);
    expect((await listGroups(admin.request)).some((group) => group.groupId === groupId), "and the server").toBe(false);
    await expect
      .poll(async () => viewAppRaw(member.request, appId), { message: "the cleanup withdraws the grant", timeout: CLEANUP_TIMEOUT_MS })
      .toEqual({ status: API_ERRORS.NO_PERMISSION_TO_REQUEST_APP.status, code: API_ERRORS.NO_PERMISSION_TO_REQUEST_APP.code });
  });

  test("LC-GR04 an admin adds a member through Add Members", lifecycleTestDetails("LC-GR04"), async ({ actor }) => {
    const admin = await actor("gradd");
    const member = await actor("graddee");
    await joinWorkspace(admin, member);
    const groupId = await createGroup(admin.request, TEAM);
    const groups = new GroupsPage(admin.session.page);
    await admin.session.page.goto(`/setting/permission/${groupId}`);
    await expect(groups.memberRow(admin.email), "the creator is the group's first member").toBeVisible();
    await expect(groups.memberRow(member.email), "before: the member is not in the group").toHaveCount(0);

    await groups.addMembers([member.email]);

    await expect(groups.memberRow(member.email), "the member is listed").toBeVisible();
    await expect.poll(async () => (await listGroupMembers(admin.request, groupId)).some((row) => row.userId === member.userId), "the server holds the membership").toBe(true);
  });

  test("LC-GR05 a group admin changes a member's group role and its own role select is locked", lifecycleTestDetails("LC-GR05"), async ({ actor }) => {
    const admin = await actor("grrole");
    const member = await actor("grroled");
    await joinWorkspace(admin, member);
    const groupId = await createGroup(admin.request, TEAM);
    await addGroupMember(admin.request, groupId, member.userId, "member");
    const groups = new GroupsPage(admin.session.page);
    await admin.session.page.goto(`/setting/permission/${groupId}`);
    await expect(groups.memberRow(member.email)).toBeVisible();
    await expect(groups.roleSelectOf(admin.email), "the admin's own select is locked").toHaveClass(/ant-select-disabled/);
    expect((await listGroupMembers(admin.request, groupId)).find((row) => row.userId === member.userId)?.role, "before: the member's group role is member").toBe(GROUP_ROLES.MEMBER);

    await groups.chooseRole(member.email, "Admin");

    await expect.poll(async () => (await listGroupMembers(admin.request, groupId)).find((row) => row.userId === member.userId)?.role, "the server stores the new role").toBe(GROUP_ROLES.ADMIN);
  });

  test("LC-GR06 a group admin removes a member from the group", lifecycleTestDetails("LC-GR06"), async ({ actor }) => {
    const admin = await actor("grremove");
    const member = await actor("grremoved");
    await joinWorkspace(admin, member);
    const groupId = await createGroup(admin.request, TEAM);
    await addGroupMember(admin.request, groupId, member.userId, "member");
    const groups = new GroupsPage(admin.session.page);
    await admin.session.page.goto(`/setting/permission/${groupId}`);
    await expect(groups.memberRow(member.email)).toBeVisible();

    await (await groups.operationsOf(member.email)).getByText("Remove from Group", { exact: true }).click();

    await expect(groups.memberRow(member.email), "the row leaves the page").toHaveCount(0);
    expect((await listGroupMembers(admin.request, groupId)).some((row) => row.userId === member.userId), "and the group").toBe(false);
  });

  test("LC-GR07 a developer member exits a group and the only group admin cannot", lifecycleTestDetails("LC-GR07"), async ({ actor }) => {
    const admin = await actor("grexitadmin");
    const member = await actor("grexit");
    await joinWorkspace(admin, member);
    await makeDeveloper(admin, member);
    const groupId = await createGroup(admin.request, TEAM);
    await addGroupMember(admin.request, groupId, member.userId, "member");
    const adminGroups = new GroupsPage(admin.session.page);
    await admin.session.page.goto(`/setting/permission/${groupId}`);
    await expect(adminGroups.memberRow(admin.email)).toBeVisible();
    const adminOperations = await adminGroups.operationsOf(admin.email);
    await expect(adminOperations.getByText("Detail", { exact: true }), "the admin's operations cell is rendered").toBeVisible();
    await expect(adminOperations.getByText("Exit Group", { exact: true }), "the only group admin has no Exit Group").toHaveCount(0);
    await adminOperations.locator("svg").last().hover();
    await expect(admin.session.page.getByText(LAST_ADMIN_TEXT), "a tooltip says why").toBeVisible();
    expectAnswer(await apiRaw(admin.request, "DELETE", groupLeavePath(groupId)), API_ERRORS.CANNOT_LEAVE_GROUP, "the API refuses the only group admin");
    expect((await listGroupMembers(admin.request, groupId)).some((row) => row.userId === admin.userId), "and the admin is still in the group").toBe(true);
    const memberGroups = new GroupsPage(member.session.page);
    await member.session.page.goto(`/setting/permission/${groupId}`);
    await expect(memberGroups.memberRow(member.email), "the developer reaches the group page").toBeVisible();

    await (await memberGroups.operationsOf(member.email)).getByText("Exit Group", { exact: true }).click();

    await expect.poll(async () => (await listGroupMembers(admin.request, groupId)).some((row) => row.userId === member.userId), "the member left the group").toBe(false);
  });

  test("LC-GR08 the built-in groups cannot be renamed or deleted in the UI nor deleted through the API", lifecycleTestDetails("LC-GR08"), async ({ actor }) => {
    const admin = await actor("grbuiltin");
    const groups = new GroupsPage(admin.session.page);
    await groups.open();
    await expect(groups.row("All Members"), "the all-users group is listed").toBeVisible();
    await expect(groups.row("Developers"), "and the developers group").toBeVisible();
    await expect(groups.menuIconOf("All Members"), "no menu for All Members").toHaveCount(0);
    await expect(groups.menuIconOf("Developers"), "no menu for Developers").toHaveCount(0);

    for (const group of (await listGroups(admin.request)).filter((entry) => entry.allUsersGroup || entry.devGroup)) {
      expectAnswer(await apiRaw(admin.request, "DELETE", groupPath(group.groupId)), API_ERRORS.CANNOT_DELETE_SYSTEM_GROUP, `delete of ${group.groupName}`);
    }
    expect((await listGroups(admin.request)).filter((entry) => entry.allUsersGroup || entry.devGroup), "both built-in groups remain").toHaveLength(2);
  });

  test("LC-GR09 a built-in group cannot be renamed through the API", lifecycleTestDetails("LC-GR09"), async ({ actor }) => {
    const admin = await actor("grapirename");

    // D-52: both built-in groups (as LC-GR08 finds them), not only the all-users group.
    const builtInGroups = (await listGroups(admin.request)).filter((entry) => entry.allUsersGroup || entry.devGroup);
    expect(builtInGroups, "setup: both built-in groups are found").toHaveLength(2);
    for (const group of builtInGroups) {
      const answer = await apiRaw(admin.request, "PUT", groupUpdatePath(group.groupId), { data: { groupName: "renamed-built-in" } });

      expectAnswer(answer, API_ERRORS.UNSUPPORTED_OPERATION, `rename of ${group.groupName}`);
      // The shown name is unchanged; this does not prove the stored name is (GroupView.java always shows the system name).
      expect((await listGroups(admin.request)).find((entry) => entry.groupId === group.groupId)?.groupName, `shown name of ${group.groupName}`).toBe(group.groupName);
    }
  });

  test("LC-GR10 adding a member to the developers group in the UI makes them a developer", lifecycleTestDetails("LC-GR10"), async ({ actor }) => {
    const admin = await actor("grdevadmin");
    const member = await actor("grdev");
    await joinWorkspace(admin, member);
    const devGroup = (await listGroups(admin.request)).find((group) => group.devGroup);
    const memberList = new AppListPage(member.session.page);
    const memberSettings = new SettingPage(member.session.page);
    await memberList.open();
    await expect(memberList.title, "the member's app list has loaded").toBeVisible();
    await member.session.page.goto("/setting");
    await expect(member.session.page, "before: a plain member is sent away from the settings").toHaveURL(UI_PATHS.APP_LIST);
    await expect(memberList.title).toBeVisible();
    await expect(memberSettings.userAuthenticationEntry, "and sees no settings entry").toHaveCount(0);
    const groups = new GroupsPage(admin.session.page);
    await admin.session.page.goto(`/setting/permission/${devGroup!.groupId}`);
    await expect(admin.session.page.getByText("Add Members", { exact: true }), "the developers group page has loaded").toBeVisible();

    await groups.addMembers([member.email]);

    await expect.poll(async () => (await listGroupMembers(admin.request, devGroup!.groupId)).some((row) => row.userId === member.userId), "the membership is stored").toBe(true);
    await member.session.page.goto("/setting");
    await expect(memberSettings.userAuthenticationEntry, "after: the settings are open to the new developer").toBeVisible();
  });
});
