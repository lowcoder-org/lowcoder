import { currentUser, leaveOrganization, listOrgMembers } from "../../src/api/client";
import { API_ERRORS, API_PATHS, SETTING_PATHS, TAGS, UI_PATHS } from "../../src/constants";
import { expect, test } from "../../src/fixtures";
import { AppListPage } from "../../src/pages/AppListPage";
import { SettingPage } from "../../src/pages/SettingPage";
import { joinWorkspace } from "../../src/security/actors";
import { lifecycleTestDetails } from "../../src/security/quarantine";
import { apiRaw } from "../../src/api/client";

/**
 * The members of a workspace in the UI (LC-WM01, LC-WM03, LC-WM04, LC-WM06, LC-WM12). The 3.0.0 client has no page that shows
 * or changes a member's WORKSPACE role: `/setting/permission/users` is the "All Users" group page (group roles; the page for
 * workspace roles, `orgUsersPermission.tsx`, is not routed), so changing a workspace role is API-only (SEC-R08a+).
 */

const UNKNOWN_INVITATION_CODE = "e2e-unknown-code";
const UNKNOWN_INVITATION_TEXT = "Invitation code not found.";
const INVITE_LINK_PATH = /\/invite\/[^/]+$/;

test.describe("lifecycle: workspace members", () => {
  test("LC-WM01 the All Users page lists every member with its group operations (characterisation)", lifecycleTestDetails("LC-WM01"), async ({ actor }, testInfo) => {
    const admin = await actor("wmadmin");
    const member = await actor("wmmember");
    const settings = new SettingPage(admin.session.page);
    await settings.openMembers();
    await expect(settings.memberRow(admin.email), "the admin's own row is listed").toBeVisible();
    await expect(settings.memberRow(member.email), "before the member joins: no row for it").toHaveCount(0);

    await joinWorkspace(admin, member);
    await settings.openMembers();

    await expect(settings.memberRow(member.email), "the joined member is listed").toBeVisible();
    await expect(settings.memberRow(admin.email)).toBeVisible();
    await settings.memberRow(member.email).hover(); // the row's operations show on hover
    await expect(settings.operationsOf(member.email).getByText("Remove from Group", { exact: true }), "another member's row offers Remove from Group").toBeVisible();
    await settings.memberRow(admin.email).hover();
    await expect(settings.operationsOf(admin.email).getByText("Exit Group", { exact: true }), "the admin's own row offers Exit Group").toBeVisible();
    testInfo.annotations.push({ type: "observation", description: "3.0.0 has no members page with workspace roles; the All Users page shows group roles" });
  });

  test("LC-WM03 Remove from Group on the All Users page takes the member off the page, not out of the workspace (characterisation)", lifecycleTestDetails("LC-WM03"), async ({ actor }, testInfo) => {
    const admin = await actor("wmremover");
    const member = await actor("wmremoved");
    await joinWorkspace(admin, member);
    const settings = new SettingPage(admin.session.page);
    await settings.openMembers();
    await expect(settings.memberRow(member.email)).toBeVisible();

    await settings.memberRow(member.email).hover(); // the row's operations show on hover
    await settings.operationsOf(member.email).getByText("Remove from Group", { exact: true }).click();

    await expect(settings.memberRow(member.email), "the row leaves the All Users page").toHaveCount(0);
    await expect(settings.memberRow(admin.email), "the admin's own row stays").toBeVisible();
    const members = await listOrgMembers(admin.request, admin.orgId);
    expect(members.some((entry) => entry.userId === member.userId), "but the user is still a member of the workspace").toBe(true);
    expect((await currentUser(member.request)).orgAndRoles.map((entry) => entry.org.id), "and still belongs to it").toContain(admin.orgId);
    testInfo.annotations.push({ type: "observation", description: "O-16: the UI offers no way to remove a member from a workspace; Remove from Group on All Users leaves the membership" });
  });

  test("LC-WM04 the invitation link of the invite dialog lets another user in", lifecycleTestDetails("LC-WM04", [TAGS.CORE]), async ({ actor }) => {
    const admin = await actor("wminviter");
    const guest = await actor("wmguest");
    const settings = new SettingPage(admin.session.page);
    await admin.session.page.goto(SETTING_PATHS.GROUPS);
    await settings.inviteMembersButton.click();
    const link = await settings.inviteLink();
    expect(INVITE_LINK_PATH.test(link), "the dialog shows an invitation link").toBe(true);

    await guest.session.page.goto(link);

    await expect(guest.session.page, "the invitation leads to the app list").toHaveURL(UI_PATHS.APP_LIST);
    await expect.poll(async () => (await currentUser(guest.request)).orgAndRoles.map((entry) => ({ id: entry.org.id, role: entry.role })), "the guest belongs to the workspace as a member").toContainEqual({ id: admin.orgId, role: "member" });
  });

  test("LC-WM06 a plain member has no settings page and no way to leave in the UI, the API leave works (characterisation)", lifecycleTestDetails("LC-WM06"), async ({ actor }, testInfo) => {
    const admin = await actor("wmowner");
    const member = await actor("wmleaver");
    await joinWorkspace(admin, member);
    expect((await currentUser(member.request)).orgAndRoles.find((entry) => entry.org.id === admin.orgId)?.role, "setup: the user is a plain member of the workspace").toBe("member");
    const page = member.session.page;
    const appList = new AppListPage(page);

    await page.goto(SETTING_PATHS.MEMBERS);

    await expect(page, "the settings are closed to a plain member: sent to the app list").toHaveURL(UI_PATHS.APP_LIST);
    await expect(appList.title).toBeVisible();
    await leaveOrganization(member.request, admin.orgId);
    expect((await currentUser(member.request)).orgAndRoles.map((entry) => entry.org.id), "the API leave removes the membership").not.toContain(admin.orgId);
    testInfo.annotations.push({ type: "observation", description: "no leave control for plain members" });
  });

  test("LC-WM12 an invitation link with an unknown code returns to the app list with an error", lifecycleTestDetails("LC-WM12"), async ({ actor }) => {
    const user = await actor("wmunknown");
    const before = (await currentUser(user.request)).orgAndRoles.map((entry) => entry.org.id);
    const answer = await apiRaw(user.request, "GET", `${API_PATHS.INVITATION}/${UNKNOWN_INVITATION_CODE}/invite`);
    expect({ status: answer.status, code: answer.code }, "the API refuses the code").toEqual(API_ERRORS.INVALID_INVITATION_CODE);

    await user.session.page.goto(`/invite/${UNKNOWN_INVITATION_CODE}`);

    await expect(user.session.page.getByText(UNKNOWN_INVITATION_TEXT), "the page shows the server's message").toBeVisible();
    await expect(user.session.page, "and ends on the app list").toHaveURL(UI_PATHS.APP_LIST);
    expect((await currentUser(user.request)).orgAndRoles.map((entry) => entry.org.id), "the memberships are unchanged").toEqual(before);
  });
});

