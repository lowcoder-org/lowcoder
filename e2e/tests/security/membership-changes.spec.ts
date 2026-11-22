import {
  apiRaw,
  createApp,
  createFolder,
  currentUser,
  grantFolderPermission,
  listAppPermissions,
  listFolderPermissions,
  removeAppPermission,
  removeOrgMember,
  switchOrganization,
  updateMemberRole,
  viewAppRaw,
} from "../../src/api/client";
import {
  API_ERRORS,
  API_OK,
  API_PATHS,
  APP_ROLES,
  APP_TYPE_APPLICATION,
  ORG_ROLES,
  appViewPath,
  applicationPath,
  folderPermissionPath,
  folderPermissionsPath,
  orgRolePath,
} from "../../src/constants";
import { expect, test } from "../../src/fixtures";
import { AppViewPage } from "../../src/pages/AppViewPage";
import {
  SEEDED_BUTTON_TEST_ID,
  SEEDED_BUTTON_TEXT,
  grantApp,
  makeAdmin,
  makeDeveloper,
} from "../../src/security/actors";
import { expectAnswer, expectDeniedAs } from "../../src/security/assertions";
import { securityTestDetails } from "../../src/security/quarantine";
import { memberOf, permissionIdOf, roleOf, sceneOf } from "../../src/security/scene";

/**
 * Rights that change while a session is open (R11 to R13) and folder rights (R15): the server must read the
 * membership and the rows on every request, not once at sign-in. A is the `apiUser`, admin of OA.
 */

const ALLOWED = { status: 200, code: API_OK } as const;
const APP_OF_DEVELOPER = "e2e-sec-app-d";
const FOLDER_NAME = "e2e-sec-folder-d";
const RENAMED_FOLDER = "e2e-sec-folder-d-renamed";
const RENAMED_BY_OTHER = "e2e-sec-folder-renamed-by-other-developer";
const FOLDER_OF_ADMIN = "e2e-sec-folder-a";
const APP_IN_FOLDER = "e2e-sec-app-in-folder";

/** The root listing of folders and apps as the user sees it (the folder names show in it). */
async function rootOf(request: Parameters<typeof apiRaw>[0]): Promise<string> {
  const answer = await apiRaw(request, "GET", API_PATHS.FOLDER_ELEMENTS);
  expectAnswer(answer, ALLOWED, "the root listing");
  return answer.body;
}

test.describe("security: rights that change while a session is open", () => {
  test("SEC-R11a a member removed from the workspace loses the app with its open session", securityTestDetails("SEC-R11a"), async ({ page, apiUser, actor }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const v = await memberOf(a, actor, "viewer");
    await grantApp(a, seeded.appId, v, APP_ROLES.VIEWER);
    const view = new AppViewPage(v.session.page);
    // The seeded app runs a query on load; a right removed before it ran would make it answer 401 and sign V out (measured race).
    expect(await view.openAndAwaitQuery(seeded.appId), "before: V's page ran the app's query").toBe(200);
    await expect(view.buttonByTestId(SEEDED_BUTTON_TEST_ID), "before: V's open view shows the app").toHaveText(SEEDED_BUTTON_TEXT);
    expect(await viewAppRaw(v.request, seeded.appId), "before: V's session views the app").toMatchObject({ status: 200, code: API_OK });

    await removeOrgMember(a.request, a.orgId, v.userId);

    expectAnswer(await apiRaw(v.request, "GET", appViewPath(seeded.appId)), API_ERRORS.NO_PERMISSION_TO_REQUEST_APP, "V's published view with the old session");
    // Measured on 3.0.0: the list answers 200 with V's own (empty) workspace, the current workspace is reset to it.
    const list = await apiRaw(v.request, "GET", API_PATHS.APPLICATION_LIST);
    expectAnswer(list, ALLOWED, "V's app list with the old session");
    expect(list.body, "does not hold OA's app").not.toContain(seeded.appId);
    expect((await currentUser(v.request)).currentOrgId, "V's current workspace is its own").toBe(v.orgId);
    await view.open(seeded.appId);
    await expect(view.notInWorkspaceMessage, "V's page shows the denial after a reload").toBeVisible();
    await expect(view.buttonByTestId(SEEDED_BUTTON_TEST_ID), "and no app").toHaveCount(0);
  });

  test("SEC-R11b a developer removed from the workspace cannot open the editing view of the app it created", securityTestDetails("SEC-R11b"), async ({ page, apiUser, actor }) => {
    const { a } = await sceneOf(page, apiUser);
    const d = await memberOf(a, actor, "developer");
    await makeDeveloper(a, d);
    const { appId } = await createApp(d.request, { orgId: a.orgId, name: APP_OF_DEVELOPER });
    expectAnswer(await apiRaw(d.request, "GET", applicationPath(appId)), ALLOWED, "before: the creator opens the editing view");

    await removeOrgMember(a.request, a.orgId, d.userId);

    // READ of the app stays allowed by design (commit c377186ad); the editing view is EDIT and must not be.
    expectAnswer(await apiRaw(d.request, "GET", appViewPath(appId)), ALLOWED, "the removed creator's published view (by design)");
    expectAnswer(await apiRaw(d.request, "GET", applicationPath(appId)), API_ERRORS.NO_PERMISSION_TO_REQUEST_APP, "the removed creator's editing view");
  });

  test("SEC-R12 an admin demoted while its session is open loses the admin routes", securityTestDetails("SEC-R12"), async ({ page, apiUser, actor }) => {
    const { a } = await sceneOf(page, apiUser);
    const m = await memberOf(a, actor, "admin");
    const d = await memberOf(a, actor, "developer");
    await makeAdmin(a, m);
    expect(await roleOf(a, m.userId), "before: M is an admin").toBe(ORG_ROLES.ADMIN);
    const changeRoleOfD = (role: string) => apiRaw(m.request, "PUT", orgRolePath(a.orgId), { data: { userId: d.userId, role } });
    expectAnswer(await changeRoleOfD(ORG_ROLES.ADMIN), ALLOWED, "before: the live admin makes D an admin");
    expect(await roleOf(a, d.userId), "D is an admin").toBe(ORG_ROLES.ADMIN);
    await updateMemberRole(a.request, a.orgId, d.userId, ORG_ROLES.MEMBER);
    await updateMemberRole(a.request, a.orgId, m.userId, ORG_ROLES.MEMBER);
    expect(await roleOf(a, d.userId), "after A's reset: D is a member again").toBe(ORG_ROLES.MEMBER);

    const answer = await changeRoleOfD(ORG_ROLES.ADMIN);

    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the demoted admin's repeat with the same session");
    expect(await roleOf(a, d.userId), "after: D is still a member").toBe(ORG_ROLES.MEMBER);
  });

  test("SEC-R13 a viewer whose permission row is removed loses the open app", securityTestDetails("SEC-R13"), async ({ page, apiUser, actor }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const v = await memberOf(a, actor, "viewer");
    await grantApp(a, seeded.appId, v, APP_ROLES.VIEWER);
    const view = new AppViewPage(v.session.page);
    // The seeded app runs a query on load; a right removed before it ran would make it answer 401 and sign V out (measured race).
    expect(await view.openAndAwaitQuery(seeded.appId), "before: V's page ran the app's query").toBe(200);
    await expect(view.buttonByTestId(SEEDED_BUTTON_TEST_ID), "before: V's open view shows the app").toHaveText(SEEDED_BUTTON_TEXT);
    const row = permissionIdOf((await listAppPermissions(a.request, seeded.appId)).userPermissions.find((item) => item.id === v.userId), "V's row");

    await removeAppPermission(a.request, seeded.appId, row);

    expectAnswer(await apiRaw(v.request, "GET", appViewPath(seeded.appId)), API_ERRORS.NO_PERMISSION_TO_REQUEST_APP, "V's published view after the removal");
    await view.open(seeded.appId);
    await expect(view.permissionDeniedMessage, "V's page shows the permission-denied message").toBeVisible();
    await expect(view.buttonByTestId(SEEDED_BUTTON_TEST_ID), "and no app").toHaveCount(0);
  });
});

test.describe("security: folder rights", () => {
  test("SEC-R15a+ a developer creates and renames its folder", securityTestDetails("SEC-R15a+"), async ({ page, apiUser, actor }) => {
    const { a } = await sceneOf(page, apiUser);
    const d = await memberOf(a, actor, "developer");
    await makeDeveloper(a, d);
    const folderId = await createFolder(d.request, FOLDER_NAME);
    expect(await rootOf(d.request), "before: the folder has its name").toContain(FOLDER_NAME);

    const answer = await apiRaw(d.request, "PUT", API_PATHS.FOLDERS, { data: { id: folderId, name: RENAMED_FOLDER } });

    expectAnswer(answer, ALLOWED, "the creator's rename");
    const after = await rootOf(d.request);
    expect(after, "after: the new name").toContain(RENAMED_FOLDER);
    expect(after, "and not the old one").not.toContain(`"${FOLDER_NAME}"`);
  });

  test("SEC-R15b another developer cannot rename the folder", securityTestDetails("SEC-R15b"), async ({ page, apiUser, actor }) => {
    const { a } = await sceneOf(page, apiUser);
    const d = await memberOf(a, actor, "developer");
    const d2 = await memberOf(a, actor, "developer2");
    await makeDeveloper(a, d);
    await makeDeveloper(a, d2);
    const folderId = await createFolder(d.request, FOLDER_NAME);
    expectAnswer(await apiRaw(d2.request, "POST", API_PATHS.FOLDERS, { data: { name: `${FOLDER_NAME}-of-d2` } }), ALLOWED, "before: D2 is a developer (creates its own folder)");
    const before = await rootOf(d.request);

    const answer = await apiRaw(d2.request, "PUT", API_PATHS.FOLDERS, { data: { id: folderId, name: RENAMED_BY_OTHER } });

    expectAnswer(answer, API_ERRORS.FOLDER_OPERATE_NO_PERMISSION, "the other developer's rename");
    expect(await rootOf(d.request), "after: the root is as it was").toBe(before);
  });

  test("SEC-R15c a member who keeps its own workspace current cannot give itself a folder and read the apps created in it", securityTestDetails("SEC-R15c"), async ({ page, apiUser, actor }) => {
    const { a } = await sceneOf(page, apiUser);
    const d = await memberOf(a, actor, "developer");
    const m = await memberOf(a, actor, "member");
    await makeDeveloper(a, d);
    const folderId = await createFolder(d.request, FOLDER_NAME);
    const createInFolder = async (name: string) => {
      const answer = await apiRaw(d.request, "POST", API_PATHS.APPLICATIONS, {
        data: { orgId: a.orgId, name, applicationType: APP_TYPE_APPLICATION, editingApplicationDSL: {}, folderId },
      });
      expectAnswer(answer, ALLOWED, `D creates ${name} in its folder`);
      return (answer.json as { data: { applicationInfoView: { applicationId: string } } }).data.applicationInfoView.applicationId;
    };
    const appBefore = await createInFolder(`${APP_IN_FOLDER}-before`);
    expectAnswer(await apiRaw(m.request, "GET", applicationPath(appBefore)), API_ERRORS.NO_PERMISSION_TO_REQUEST_APP, "before: M cannot open an app in D's folder");
    await switchOrganization(m.request, m.orgId);
    expect((await currentUser(m.request)).currentOrgId, "setup: M's own workspace is current").toBe(m.orgId);

    const grant = await apiRaw(m.request, "POST", folderPermissionsPath(folderId), {
      data: { role: APP_ROLES.OWNER, userIds: [m.userId], groupIds: [] },
    });
    const appAfter = await createInFolder(`${APP_IN_FOLDER}-after`);
    const open = await apiRaw(m.request, "GET", applicationPath(appAfter));

    // Desired: the grant is refused (the folder check reads the CURRENT workspace, SF-2, open on HEAD). The desired code is
    // not observable on any available image, so the two refusals the code can give are accepted for the grant; the real
    // proof is the last assertion: M must not open the app created in the folder afterwards.
    expectDeniedAs(grant, [API_ERRORS.FOLDER_OPERATE_NO_PERMISSION, API_ERRORS.NOT_AUTHORIZED], "M's grant on D's folder");
    expectAnswer(open, API_ERRORS.NO_PERMISSION_TO_REQUEST_APP, "M's editing view of the app created in the folder");
  });

  test("SEC-R15d a developer who is not the creator cannot change or remove a folder row", securityTestDetails("SEC-R15d"), async ({ page, apiUser, actor }) => {
    const { a } = await sceneOf(page, apiUser);
    const d = await memberOf(a, actor, "developer");
    const d2 = await memberOf(a, actor, "developer2");
    const m = await memberOf(a, actor, "member");
    await makeDeveloper(a, d);
    await makeDeveloper(a, d2);
    const folderId = await createFolder(d.request, FOLDER_NAME);
    await grantFolderPermission(a.request, folderId, { role: APP_ROLES.VIEWER, userIds: [m.userId] });
    const rows = async () => (await listFolderPermissions(a.request, folderId)).userPermissions;
    const rowOfM = permissionIdOf((await rows()).find((row) => row.id === m.userId), "M's folder row");
    const before = JSON.stringify(await rows());

    const promoted = await apiRaw(d2.request, "PUT", folderPermissionPath(folderId, rowOfM), { data: { role: APP_ROLES.OWNER } });
    const removed = await apiRaw(d2.request, "DELETE", folderPermissionPath(folderId, rowOfM));

    expectAnswer(promoted, API_ERRORS.FOLDER_OPERATE_NO_PERMISSION, "D2's promotion of M's row");
    expectAnswer(removed, API_ERRORS.FOLDER_OPERATE_NO_PERMISSION, "D2's removal of M's row");
    expect(JSON.stringify(await rows()), "after: the rows are exactly as they were").toBe(before);
  });

  test("SEC-R15e a row id of another folder is refused for the creator's folder", securityTestDetails("SEC-R15e"), async ({ page, apiUser, actor }) => {
    const { a } = await sceneOf(page, apiUser);
    const d = await memberOf(a, actor, "developer");
    const m = await memberOf(a, actor, "member");
    await makeDeveloper(a, d);
    const folderOfD = await createFolder(d.request, FOLDER_NAME);
    const folderOfA = await createFolder(a.request, FOLDER_OF_ADMIN);
    await grantFolderPermission(d.request, folderOfD, { role: APP_ROLES.VIEWER, userIds: [m.userId] });
    await grantFolderPermission(a.request, folderOfA, { role: APP_ROLES.VIEWER, userIds: [m.userId] });
    const rowsOfA = async () => (await listFolderPermissions(a.request, folderOfA)).userPermissions;
    const rowOfMInD = permissionIdOf((await listFolderPermissions(a.request, folderOfD)).userPermissions.find((row) => row.id === m.userId), "M's row on D's folder");
    const rowOfMInA = permissionIdOf((await rowsOfA()).find((row) => row.id === m.userId), "M's row on A's folder");
    expectAnswer(
      await apiRaw(d.request, "PUT", folderPermissionPath(folderOfD, rowOfMInD), { data: { role: APP_ROLES.EDITOR } }),
      ALLOWED,
      "before: D may change a row of its own folder, so the refusal below is about the row id",
    );
    const before = JSON.stringify(await rowsOfA());

    const answer = await apiRaw(d.request, "PUT", folderPermissionPath(folderOfD, rowOfMInA), { data: { role: APP_ROLES.OWNER } });

    expectAnswer(answer, API_ERRORS.ILLEGAL_FOLDER_PERMISSION_ID, "D's change of a row that belongs to A's folder");
    expect(JSON.stringify(await rowsOfA()), "after: the row of A's folder is unchanged").toBe(before);
  });
});
