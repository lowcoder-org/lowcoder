import {
  addGroupMember,
  apiRaw,
  createFolder,
  createGroup,
  getApp,
  listGroupMembers,
  listOrgMembers,
  listRecycledApps,
  recycleApp,
} from "../../src/api/client";
import {
  API_ERRORS,
  API_OK,
  API_PATHS,
  APP_ROLES,
  APP_STATUS,
  ORG_ROLES,
  SECOND_VERSION_TAG,
  TAGS,
  appPermissionsPath,
  appRecordsByAppPath,
  appViewPath,
  applicationPath,
  folderMovePath,
  groupRolePath,
  orgRolePath,
  orgUpdatePath,
  publicToAllPath,
  publicToMarketplacePath,
  publishPath,
  recyclePath,
} from "../../src/constants";
import { appDsl, button } from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";
import {
  SEEDED_BUTTON_ID,
  SEEDED_BUTTON_NAME,
  SEEDED_BUTTON_TEST_ID,
  adminOfApiUser,
  grantApp,
  joinWorkspace,
  makeDeveloper,
  seedPrivateApp,
} from "../../src/security/actors";
import { expectAnswer } from "../../src/security/assertions";
import { securityTestDetails } from "../../src/security/quarantine";
import { memberOf, roleOf, sceneOf } from "../../src/security/scene";
import { SettingPage } from "../../src/pages/SettingPage";

/** Self-promotion and mass assignment (A06 and A07): a body may carry fields the server must not copy. */

const SECURITY_CORE = [TAGS.CORE];
const EDITED_BUTTON_TEXT = "Edited by an editor";
const RENAMED_ORG = "e2e-sec-org-renamed-by-promoted-member";
const ALLOWED = { status: 200, code: API_OK } as const;

test.describe("security: self-promotion and mass assignment", () => {
  test("SEC-A06a a member cannot promote itself to admin", securityTestDetails("SEC-A06a", SECURITY_CORE), async ({ page, apiUser, actor }) => {
    const a = await adminOfApiUser(page.request, apiUser);
    const m = await actor("member");
    await joinWorkspace(a, m);
    const roleOfM = async () => (await listOrgMembers(a.request, a.orgId)).find((member) => member.userId === m.userId)?.role;
    expect(await roleOfM(), "before: M is a member").toBe(ORG_ROLES.MEMBER);
    // The client gate (orgUsersPermission.tsx:187-196): the role select is disabled for everyone but an admin, and for an admin's
    // own row. A plain member is sent away from /setting, so the page is read as a developer, who is an org member too.
    const d = await actor("developer");
    await joinWorkspace(a, d);
    await makeDeveloper(a, d);
    const adminSettings = new SettingPage(page);
    await adminSettings.openMembers();
    await expect(adminSettings.memberRow(m.email), "control: the admin's members page lists M").toBeVisible();
    await expect(adminSettings.roleSelectOf(m.email), "control: the admin may change M's role").not.toHaveClass(/ant-select-disabled/);
    const developerSettings = new SettingPage(d.session.page);
    await developerSettings.openMembers();
    await expect(developerSettings.memberRow(m.email), "the developer's members page lists M").toBeVisible();
    for (const email of [a.email, m.email, d.email]) {
      await expect(developerSettings.roleSelectOf(email), `the role select of ${email} is disabled for the developer`).toHaveClass(/ant-select-disabled/);
    }

    const answer = await apiRaw(m.request, "PUT", orgRolePath(a.orgId), { data: { userId: m.userId, role: ORG_ROLES.ADMIN } });

    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the member's self-promotion");
    expect(await roleOfM(), "after: M is still a member").toBe(ORG_ROLES.MEMBER);
    expectAnswer(
      await apiRaw(m.request, "PUT", orgUpdatePath(a.orgId), { data: { orgName: RENAMED_ORG } }),
      API_ERRORS.NOT_AUTHORIZED,
      "and still cannot use an admin route",
    );
  });

  test("SEC-A07b an update cannot move an app to another workspace or change its creator or public flag", securityTestDetails("SEC-A07b", SECURITY_CORE), async ({ page, apiUser, actor, newUserSession }) => {
    const a = await adminOfApiUser(page.request, apiUser);
    const seeded = await seedPrivateApp(a);
    const e = await actor("editor");
    await joinWorkspace(a, e);
    await grantApp(a, seeded.appId, e, APP_ROLES.EDITOR);
    const b = await actor("attacker");
    const anonymous = (await newUserSession()).page.request;
    const before = await getApp(a.request, seeded.appId);
    expect(before.orgId, "before: the app is in OA").toBe(a.orgId);
    expect(before.publicToAll, "before: the app is private").toBe(false);
    const editedDsl = appDsl([button({ id: SEEDED_BUTTON_ID, name: SEEDED_BUTTON_NAME, text: EDITED_BUTTON_TEXT, testId: SEEDED_BUTTON_TEST_ID })]);

    const answer = await apiRaw(e.request, "PUT", applicationPath(seeded.appId), {
      data: { editingApplicationDSL: editedDsl, organizationId: b.orgId, createdBy: b.userId, publicToAll: true },
    });

    expectAnswer(answer, ALLOWED, "the editor's update (an editor may change the DSL)");
    const after = await getApp(a.request, seeded.appId);
    expect(JSON.stringify(after.dsl), "the DSL change was applied: the request was processed").toContain(EDITED_BUTTON_TEXT);
    expect(after.orgId, "the workspace is unchanged").toBe(before.orgId);
    expect(after.createBy, "the creator is unchanged").toBe(before.createBy);
    expect(after.publicToAll, "the app is still private").toBe(false);
    expectAnswer(await apiRaw(b.request, "GET", applicationPath(seeded.appId)), API_ERRORS.NO_PERMISSION_TO_REQUEST_APP, "the named workspace's admin still cannot open it");
    expectAnswer(await apiRaw(anonymous, "GET", appViewPath(seeded.appId)), API_ERRORS.USER_NOT_SIGNED_IN, "an anonymous visitor still cannot view it");
  });
});

// ---------------------------------------------------------------------------------------------------------------
// Further rows (A06 to A08)
// ---------------------------------------------------------------------------------------------------------------

const GROUP_NAME = "e2e-sec-group-a";
const FOLDER_OF_ADMIN = "e2e-sec-folder-a";
const FOLDER_OF_DEVELOPER = "e2e-sec-folder-d";
const HACKED_NAME = "e2e-sec-renamed-by-viewer";
const HACKED_TEXT = "Hacked by a viewer";

test.describe("security: self-promotion and mass assignment (further rows)", () => {
  test("SEC-A06b an admin cannot make anyone a super_admin", securityTestDetails("SEC-A06b"), async ({ page, apiUser, actor }) => {
    const { a } = await sceneOf(page, apiUser);
    const m = await memberOf(a, actor, "member");
    expect(await roleOf(a, m.userId), "before: M is a member").toBe(ORG_ROLES.MEMBER);
    expect(await roleOf(a, a.userId), "before: A is an admin").toBe(ORG_ROLES.ADMIN);

    const toMember = await apiRaw(a.request, "PUT", orgRolePath(a.orgId), { data: { userId: m.userId, role: ORG_ROLES.SUPER_ADMIN } });
    const toSelf = await apiRaw(a.request, "PUT", orgRolePath(a.orgId), { data: { userId: a.userId, role: ORG_ROLES.SUPER_ADMIN } });

    expectAnswer(toMember, API_ERRORS.UNSUPPORTED_OPERATION, "A's super_admin grant to M");
    expectAnswer(toSelf, API_ERRORS.UNSUPPORTED_OPERATION, "A's super_admin grant to itself");
    expect(await roleOf(a, m.userId), "after: M is still a member").toBe(ORG_ROLES.MEMBER);
    expect(await roleOf(a, a.userId), "after: A is still an admin").toBe(ORG_ROLES.ADMIN);
  });

  test("SEC-A06c a group member cannot make itself a group admin", securityTestDetails("SEC-A06c"), async ({ page, apiUser, actor }) => {
    const { a } = await sceneOf(page, apiUser);
    const m = await memberOf(a, actor, "member");
    const groupId = await createGroup(a.request, GROUP_NAME);
    await addGroupMember(a.request, groupId, m.userId, ORG_ROLES.MEMBER);
    const roleInGroup = async () => (await listGroupMembers(a.request, groupId)).find((member) => member.userId === m.userId)?.role;
    expect(await roleInGroup(), "before: M is a plain group member").toBe(ORG_ROLES.MEMBER);

    const answer = await apiRaw(m.request, "PUT", groupRolePath(groupId), { data: { userId: m.userId, role: ORG_ROLES.ADMIN } });

    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the group member's self-promotion");
    expect(await roleInGroup(), "after: M is still a plain group member").toBe(ORG_ROLES.MEMBER);
  });

  test("SEC-A07a a created folder cannot take the id of another user's folder", securityTestDetails("SEC-A07a"), async ({ page, apiUser, actor }) => {
    const { a } = await sceneOf(page, apiUser);
    const d = await memberOf(a, actor, "developer");
    await makeDeveloper(a, d);
    const folderOfA = await createFolder(a.request, FOLDER_OF_ADMIN);
    // An org admin sees every folder of the workspace (FolderApiServiceImpl.java:269), so D's NEW folder may legitimately be in A's
    // root; what must not change is the row of A's own folder.
    const rowOfFolderOfA = async () => {
      const root = await apiRaw(a.request, "GET", API_PATHS.FOLDER_ELEMENTS);
      expectAnswer(root, ALLOWED, "A lists its root");
      return (root.json as { data: { folderId?: string }[] }).data.find((row) => row.folderId === folderOfA);
    };
    const rowBefore = await rowOfFolderOfA();
    expect(rowBefore, "before: A's root has the row of its folder").toBeDefined();
    expect(JSON.stringify(rowBefore), "and it carries A's name").toContain(FOLDER_OF_ADMIN);

    const answer = await apiRaw(d.request, "POST", API_PATHS.FOLDERS, { data: { id: folderOfA, name: FOLDER_OF_DEVELOPER } });

    expectAnswer(answer, ALLOWED, "D's folder create");
    const created = (answer.json as { data: { folderId: string } }).data.folderId;
    expect(created, "the new folder has a new id").not.toBe(folderOfA);
    const rowAfter = await rowOfFolderOfA();
    expect(rowAfter, "after: A's folder is still listed").toBeDefined();
    expect(JSON.stringify(rowAfter), "and its row (name, creator, permissions) is exactly as before").toBe(JSON.stringify(rowBefore));
    expect(JSON.stringify(rowAfter), "and it was not renamed to D's name").not.toContain(FOLDER_OF_DEVELOPER);
  });
});

/** Fields of an app row that a viewer's write attempt would change, as the owner reads them (`undefined` when the app is gone). */
async function appStateOf(a: Awaited<ReturnType<typeof sceneOf>>["a"], appId: string): Promise<string> {
  const normal = await apiRaw(a.request, "GET", `${API_PATHS.APPLICATION_LIST}`, { params: { applicationType: 1 } });
  const trash = await apiRaw(a.request, "GET", API_PATHS.APPLICATION_RECYCLE_LIST);
  const rows = [...((normal.json as { data: Record<string, unknown>[] }).data), ...((trash.json as { data: Record<string, unknown>[] }).data)];
  const row = rows.find((item) => item.applicationId === appId);
  const picked = row && {
    name: row.name,
    applicationStatus: row.applicationStatus,
    publicToAll: row.publicToAll,
    publicToMarketplace: row.publicToMarketplace,
    folderId: row.folderId,
    publishedVersion: row.publishedVersion,
  };
  // A recycled app answers 400 / 5003 to the owner's permission and version lists (measured), so those are recorded as answers.
  const permissions = await apiRaw(a.request, "GET", appPermissionsPath(appId));
  const versions = await apiRaw(a.request, "GET", appRecordsByAppPath(), { params: { applicationId: appId } });
  return JSON.stringify({
    picked,
    permissions: permissions.status === 200 ? (permissions.json as { data: { userPermissions: unknown } }).data.userPermissions : [permissions.status, permissions.code],
    versions: versions.status === 200 ? (versions.json as { data: { tag: string }[] }).data.map((version) => version.tag) : [versions.status, versions.code],
  });
}

/**
 * The write routes of an app and the answer a VIEWER gets, measured on the 3.0.0 image: the routes that read the
 * editing view first answer 403 / 5308, the others 401 / 5001. Each is one test with a before-state the attack would change.
 */
const VIEWER_WRITES = [
  { id: "SEC-A08a", what: "update the app", expected: API_ERRORS.NO_PERMISSION_TO_REQUEST_APP },
  { id: "SEC-A08b", what: "publish the app", expected: API_ERRORS.NOT_AUTHORIZED },
  { id: "SEC-A08c", what: "make the app public", expected: API_ERRORS.NOT_AUTHORIZED },
  { id: "SEC-A08d", what: "publish the app to the marketplace", expected: API_ERRORS.NOT_AUTHORIZED },
  { id: "SEC-A08e", what: "recycle the app", expected: API_ERRORS.NO_PERMISSION_TO_REQUEST_APP },
  { id: "SEC-A08f", what: "delete the recycled app", expected: API_ERRORS.NO_PERMISSION_TO_REQUEST_APP },
  { id: "SEC-A08g", what: "grant itself the owner role", expected: API_ERRORS.NOT_AUTHORIZED },
  { id: "SEC-A08h", what: "move the app into a folder", expected: API_ERRORS.NO_PERMISSION_TO_REQUEST_APP },
] as const;

test.describe("security: a viewer's write routes", () => {
  for (const route of VIEWER_WRITES) {
    test(`${route.id} a viewer cannot ${route.what}`, securityTestDetails(route.id), async ({ page, apiUser, actor }) => {
      const { a, seeded } = await sceneOf(page, apiUser);
      const v = await memberOf(a, actor, "viewer");
      await grantApp(a, seeded.appId, v, APP_ROLES.VIEWER);
      const appId = seeded.appId;
      const folderId = await createFolder(a.request, FOLDER_OF_ADMIN);
      expectAnswer(await apiRaw(v.request, "GET", appViewPath(appId)), ALLOWED, "before: V holds the viewer right");
      if (route.id === "SEC-A08f") {
        // Recycled first: on a normal app the delete would fail the state check, which proves nothing about the role.
        await recycleApp(a.request, appId);
        expect((await listRecycledApps(a.request)).find((app) => app.applicationId === appId)?.applicationStatus, "setup: the app is in the trash").toBe(APP_STATUS.RECYCLED);
      }
      const attacks = {
        "SEC-A08a": () => apiRaw(v.request, "PUT", applicationPath(appId), { data: { name: HACKED_NAME, editingApplicationDSL: appDsl([button({ id: SEEDED_BUTTON_ID, name: SEEDED_BUTTON_NAME, text: HACKED_TEXT, testId: SEEDED_BUTTON_TEST_ID })]) } }),
        "SEC-A08b": () => apiRaw(v.request, "POST", publishPath(appId), { data: { commitMessage: "e2e viewer", tag: SECOND_VERSION_TAG } }),
        "SEC-A08c": () => apiRaw(v.request, "PUT", publicToAllPath(appId), { data: { publicToAll: true } }),
        "SEC-A08d": () => apiRaw(v.request, "PUT", publicToMarketplacePath(appId), { data: { publicToMarketplace: true } }),
        "SEC-A08e": () => apiRaw(v.request, "PUT", recyclePath(appId)),
        "SEC-A08f": () => apiRaw(v.request, "DELETE", applicationPath(appId)),
        "SEC-A08g": () => apiRaw(v.request, "PUT", appPermissionsPath(appId), { data: { role: APP_ROLES.OWNER, userIds: [v.userId], groupIds: [] } }),
        "SEC-A08h": () => apiRaw(v.request, "PUT", folderMovePath(appId), { params: { targetFolderId: folderId } }),
      } as const;
      const before = await appStateOf(a, appId);
      const dslBefore = route.id === "SEC-A08f" ? undefined : JSON.stringify((await getApp(a.request, appId)).dsl);

      const answer = await attacks[route.id]();

      expectAnswer(answer, route.expected, `the viewer's attempt to ${route.what}`);
      expect(await appStateOf(a, appId), "after: name, status, flags, folder, versions and permission rows are as they were").toBe(before);
      if (dslBefore !== undefined) {
        const after = await getApp(a.request, appId);
        expect(JSON.stringify(after.dsl), "after: the DSL is as it was").toBe(dslBefore);
        expect(after.name, "and the name is not the viewer's").not.toBe(HACKED_NAME);
      }
    });
  }
});
