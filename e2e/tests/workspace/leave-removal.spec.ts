import type { APIRequestContext } from "@playwright/test";
import {
  acceptInvitation,
  addGroupMember,
  apiRaw,
  bundleElementsRaw,
  createApp,
  createBundle,
  createFolder,
  createGroup,
  createInvitation,
  createOrganization,
  currentUser,
  deleteOrganizationRaw,
  editAppRaw,
  grantAppPermission,
  grantBundlePermission,
  grantDatasourcePermission,
  grantFolderPermission,
  leaveOrganization,
  listAppNames,
  listAppPermissions,
  listBundlePermissions,
  listDatasourcePermissions,
  listFolderPermissions,
  listGroupMembers,
  listGroups,
  removeOrgMember,
  signInRaw,
  switchOrganization,
  viewAppRaw,
} from "../../src/api/client";
import {
  API_ERRORS,
  API_OK,
  API_PATHS,
  MEMBERSHIP_CLEANUP_TIMEOUT_MS,
  TEST_PASSWORD,
  groupMembersPath,
  UI_PATHS,
} from "../../src/constants";
import { expect, test, uniqueEmail } from "../../src/fixtures";
import { AuthPage } from "../../src/pages/AuthPage";
import { LoginPage } from "../../src/pages/LoginPage";
import { joinWorkspace, makeDeveloper, seedPrivateApp, type Actor } from "../../src/security/actors";
import { expectAnswer } from "../../src/security/assertions";
import { lifecycleCandidateDetails, lifecycleTestDetails } from "../../src/security/quarantine";

/**
 * What a removal, a leave and a workspace deletion do to a user's data (LC-DL01 to LC-DL15). 3.0.0 has no account deletion
 * in SAAS mode, so there is none to test: a removal deletes the membership only. Every "row gone" check polls (the clean-up
 * is a listener on its own scheduler) and first asserts the row was there. Covered elsewhere: API keys of a removed member
 * (SEC-A02b), the removed member's open session (SEC-R11a), a removed creator's editing view (SEC-R11b), ENTERPRISE
 * deactivation (SEC-E02 to E04). LC-DL13 to LC-DL15 are quarantined candidates for the creator (`createdBy`) shortcut
 * that mechanism 1's cleanup does not revoke (README D-26 and D-60 residuals).
 */

const OK = { status: 200, code: API_OK } as const;
const POLL = { timeout: MEMBERSHIP_CLEANUP_TIMEOUT_MS } as const;
const WORKSPACE_NAME = "dl-doomed-workspace";

async function isInGroup(owner: Actor, groupId: string, userId: string): Promise<boolean> {
  return (await listGroupMembers(owner.request, groupId)).some((row) => row.userId === userId);
}

async function hasAppRow(owner: Actor, appId: string, userId: string): Promise<boolean> {
  return (await listAppPermissions(owner.request, appId)).userPermissions.some((row) => row.id === userId);
}

/** Whether the user is still a member of any group of the owner's workspace (the all-users and developers groups included). */
async function isInAnyGroup(owner: Actor, userId: string): Promise<boolean> {
  for (const group of await listGroups(owner.request)) {
    if (await isInGroup(owner, group.groupId, userId)) {
      return true;
    }
  }
  return false;
}

/**
 * The user rejoins the owner's workspace with a new invitation and makes it its current one. It first waits until the removal's
 * clean-up has taken the user out of every group: an invitation accepted while the listener is still deleting rows answered
 * "Service is busy" (500 / 5000) once in 90 runs (measured).
 */
async function rejoin(owner: Actor, user: Actor): Promise<void> {
  await expect.poll(() => isInAnyGroup(owner, user.userId), { message: "the removal's clean-up finished (the user is in no group)", ...POLL }).toBe(false);
  await acceptInvitation(user.request, await createInvitation(owner.request, owner.orgId));
  await switchOrganization(user.request, owner.orgId);
}

test.describe("lifecycle: leaving, removal and deletion", () => {
  test("LC-DL01 a removed member is taken out of the workspace's groups", lifecycleTestDetails("LC-DL01"), async ({ actor }) => {
    const admin = await actor("dlowner");
    const member = await actor("dlmember");
    await joinWorkspace(admin, member);
    const groupId = await createGroup(admin.request, "dl-group");
    await addGroupMember(admin.request, groupId, member.userId, "member");
    expect(await isInGroup(admin, groupId, member.userId), "setup: the member is in the group").toBe(true);

    await removeOrgMember(admin.request, admin.orgId, member.userId);

    await expect.poll(() => isInGroup(admin, groupId, member.userId), { message: "the group no longer lists the member", ...POLL }).toBe(false);
  });

  test("LC-DL02 a removed member's app grants are deleted and do not come back on rejoin", lifecycleTestDetails("LC-DL02"), async ({ actor }) => {
    const admin = await actor("dlowner");
    const member = await actor("dlmember");
    await joinWorkspace(admin, member);
    const app = await seedPrivateApp(admin);
    await grantAppPermission(admin.request, app.appId, { role: "viewer", userIds: [member.userId] });
    expect(await hasAppRow(admin, app.appId, member.userId), "setup: the member holds a viewer row").toBe(true);
    expect(await viewAppRaw(member.request, app.appId), "setup: the member views the app").toEqual(OK);

    await removeOrgMember(admin.request, admin.orgId, member.userId);
    await expect.poll(() => hasAppRow(admin, app.appId, member.userId), { message: "the row is deleted", ...POLL }).toBe(false);
    await rejoin(admin, member);

    const view = await viewAppRaw(member.request, app.appId);
    expect({ status: view.status, code: view.code }, "after the rejoin the app is not viewable again").toEqual(API_ERRORS.NO_PERMISSION_TO_REQUEST_APP);
  });

  test("LC-DL03 a removed developer's data source grant is deleted", lifecycleTestDetails("LC-DL03"), async ({ actor }) => {
    const admin = await actor("dlowner");
    const developer = await actor("dldeveloper");
    await joinWorkspace(admin, developer);
    await makeDeveloper(admin, developer);
    const app = await seedPrivateApp(admin);
    await grantDatasourcePermission(admin.request, app.datasourceId, { role: "viewer", userIds: [developer.userId] });
    const hasRow = async (): Promise<boolean> => (await listDatasourcePermissions(admin.request, app.datasourceId)).userPermissions.some((row) => row.id === developer.userId);
    expect(await hasRow(), "setup: the developer holds a data source row").toBe(true);
    expect(await isInGroupOfDeveloper(admin, developer), "setup: the developer is in the developers group").toBe(true);

    await removeOrgMember(admin.request, admin.orgId, developer.userId);
    await expect.poll(() => isInGroupOfDeveloper(admin, developer), { message: "control: the clean-up ran (the developer left the developers group)", ...POLL }).toBe(false);

    await expect.poll(hasRow, { message: "the data source row is deleted", ...POLL }).toBe(false);
  });

  test("LC-DL04 a removed member's folder grant does not survive a rejoin", lifecycleTestDetails("LC-DL04"), async ({ actor }) => {
    const admin = await actor("dlowner");
    const member = await actor("dlmember");
    await joinWorkspace(admin, member);
    const folderId = await createFolder(admin.request, "dl-folder");
    await grantFolderPermission(admin.request, folderId, { role: "viewer", userIds: [member.userId] });
    const hasRow = async (): Promise<boolean> => (await listFolderPermissions(admin.request, folderId)).userPermissions.some((row) => row.id === member.userId);
    expect(await hasRow(), "setup: the member holds a folder row").toBe(true);
    const groupId = await createGroup(admin.request, "dl-folder-group");
    await addGroupMember(admin.request, groupId, member.userId, "member");

    await removeOrgMember(admin.request, admin.orgId, member.userId);
    await expect.poll(() => isInGroup(admin, groupId, member.userId), { message: "control: the clean-up ran (the member left its group)", ...POLL }).toBe(false);
    await rejoin(admin, member);

    await expect.poll(hasRow, { message: "the rejoined member holds no folder row", ...POLL }).toBe(false);
  });

  test("LC-DL05 an app created by a removed developer stays with the workspace", lifecycleTestDetails("LC-DL05"), async ({ actor }) => {
    const admin = await actor("dlowner");
    const developer = await actor("dldeveloper");
    await joinWorkspace(admin, developer);
    await makeDeveloper(admin, developer);
    const name = `dl-dev-app-${Date.now()}`;
    const { appId } = await createApp(developer.request, { orgId: admin.orgId, name });
    expect(await hasAppRow(admin, appId, developer.userId), "setup: the developer owns the app").toBe(true);

    await removeOrgMember(admin.request, admin.orgId, developer.userId);
    await expect.poll(() => hasAppRow(admin, appId, developer.userId), { message: "the creator's owner row is deleted", ...POLL }).toBe(false);

    expect(await editAppRaw(admin.request, appId), "the admin still opens the app for editing").toEqual(OK);
    expect(await listAppNames(admin.request), "and it is in the workspace's app list").toContain(name);
  });

  test("LC-DL06 a removed user keeps its account and its own workspace (SAAS, characterisation)", lifecycleTestDetails("LC-DL06"), async ({ actor, newUserSession }, testInfo) => {
    const admin = await actor("dlowner");
    const member = await actor("dlmember");
    await joinWorkspace(admin, member);

    await removeOrgMember(admin.request, admin.orgId, member.userId);

    const visitor = (await newUserSession()).page.request;
    expectAnswer(await signInRaw(visitor, member.email, TEST_PASSWORD), OK, "the removed user still signs in");
    const orgs = (await currentUser(visitor)).orgAndRoles.map((entry) => ({ id: entry.org.id, role: entry.role }));
    expect(orgs, "it keeps its own workspace as admin").toContainEqual({ id: member.orgId, role: "admin" });
    expect(orgs.map((entry) => entry.id), "and no longer belongs to the workspace it was removed from").not.toContain(admin.orgId);
    testInfo.annotations.push({ type: "observation", description: "no account deletion in SAAS mode: a removal deletes the membership only" });
  });

  test("LC-DL07 leaving cleans the same data as a removal", lifecycleTestDetails("LC-DL07"), async ({ actor }) => {
    const admin = await actor("dlowner");
    const developer = await actor("dlleaver");
    await joinWorkspace(admin, developer);
    await makeDeveloper(admin, developer);
    const app = await seedPrivateApp(admin);
    const groupId = await createGroup(admin.request, "dl-leave-group");
    await addGroupMember(admin.request, groupId, developer.userId, "member");
    await grantAppPermission(admin.request, app.appId, { role: "viewer", userIds: [developer.userId] });
    expect(await isInGroup(admin, groupId, developer.userId), "setup: the developer is in the group").toBe(true);
    expect(await hasAppRow(admin, app.appId, developer.userId), "setup: the developer holds an app row").toBe(true);

    await leaveOrganization(developer.request, admin.orgId);

    await expect.poll(() => isInGroup(admin, groupId, developer.userId), { message: "the group no longer lists the developer", ...POLL }).toBe(false);
    await expect.poll(() => hasAppRow(admin, app.appId, developer.userId), { message: "the app row is deleted", ...POLL }).toBe(false);
  });

  test("LC-DL08 a user in no workspace is told its address is unknown (characterisation)", lifecycleTestDetails("LC-DL08"), async ({ actor, newUserSession }, testInfo) => {
    const admin = await actor("dlowner");
    const invited = await newUserSession();
    const address = uniqueEmail("dlnoorg", testInfo.workerIndex);
    await invited.page.goto(`/invite/${await createInvitation(admin.request, admin.orgId)}`);
    await invited.page.getByText("Sign Up", { exact: true }).last().click();
    await new AuthPage(invited.page).signUp(address, TEST_PASSWORD);
    await expect(invited.page, "setup: the invited visitor signed up").toHaveURL(UI_PATHS.APP_LIST);
    const invitedId = (await (await invited.page.request.get(API_PATHS.CURRENT_USER)).json() as { data: { id: string } }).data.id;
    await removeOrgMember(admin.request, admin.orgId, invitedId);

    const visitor = await newUserSession();
    const login = new LoginPage(visitor.page);
    await login.open();
    await login.emailInput.fill(address);
    await login.continueButton.click();

    await expect(login.userNotFoundMessage, "the sign-in page says the address is unknown").toBeVisible();
    await expect(visitor.page, "and stays on the sign-in page").toHaveURL(/\/user\/auth\/login/);
    testInfo.annotations.push({ type: "observation", description: "an account that belongs to no workspace gets 'User not found' on the sign-in page" });
  });

  test("LC-DL09 deleting a workspace removes it for its members and its groups can no longer be read", lifecycleTestDetails("LC-DL09"), async ({ actor }) => {
    const admin = await actor("dlowner");
    const member = await actor("dlmember");
    const doomed = await createOrganization(admin.request, WORKSPACE_NAME);
    await acceptInvitation(member.request, await createInvitation(admin.request, doomed));
    await switchOrganization(admin.request, doomed);
    const groupId = await createGroup(admin.request, "dl-doomed-group");
    await addGroupMember(admin.request, groupId, member.userId, "member");
    const belongs = async (request: APIRequestContext): Promise<boolean> => (await currentUser(request)).orgAndRoles.some((entry) => entry.org.id === doomed);
    expect(await belongs(member.request), "setup: the member belongs to the workspace").toBe(true);

    expectAnswer(await deleteOrganizationRaw(admin.request, doomed), OK, "the deletion");

    await expect.poll(() => belongs(member.request), { message: "the member no longer belongs to it", ...POLL }).toBe(false);
    await expect.poll(() => belongs(admin.request), { message: "nor does the admin", ...POLL }).toBe(false);
    await expect
      .poll(async () => (await apiRaw(admin.request, "GET", groupMembersPath(groupId))).code, { message: "the group of the deleted workspace can no longer be read", ...POLL })
      .toBe(API_ERRORS.INVALID_GROUP_ID.code);
  });

  test("LC-DL10 the apps of a deleted workspace can no longer be opened by anyone (characterisation)", lifecycleTestDetails("LC-DL10"), async ({ actor }, testInfo) => {
    const admin = await actor("dlowner");
    const member = await actor("dlmember");
    const doomed = await createOrganization(admin.request, WORKSPACE_NAME);
    await acceptInvitation(member.request, await createInvitation(admin.request, doomed));
    await switchOrganization(admin.request, doomed);
    const { appId } = await createApp(admin.request, { orgId: doomed, name: "dl-doomed-app" });
    await grantAppPermission(admin.request, appId, { role: "viewer", userIds: [member.userId] });
    expect(await viewAppRaw(admin.request, appId), "setup: the admin views the app").toEqual(OK);
    expect(await viewAppRaw(member.request, appId), "setup: the granted member views the app").toEqual(OK);
    expectAnswer(await deleteOrganizationRaw(admin.request, doomed), OK, "the deletion");
    await expect.poll(async () => (await currentUser(member.request)).orgAndRoles.some((entry) => entry.org.id === doomed), { message: "the clean-up ran", ...POLL }).toBe(false);

    const adminView = await viewAppRaw(admin.request, appId);
    const adminEdit = await editAppRaw(admin.request, appId);
    const memberView = await viewAppRaw(member.request, appId);
    const memberEdit = await editAppRaw(member.request, appId);

    expect({ status: adminView.status, code: adminView.code }, "the admin's view").toEqual(API_ERRORS.UNABLE_TO_FIND_VALID_ORG);
    expect({ status: adminEdit.status, code: adminEdit.code }, "the admin's editing view").toEqual(API_ERRORS.UNABLE_TO_FIND_VALID_ORG);
    expect({ status: memberView.status, code: memberView.code }, "the former member's view").toEqual(API_ERRORS.UNABLE_TO_FIND_VALID_ORG);
    expect({ status: memberEdit.status, code: memberEdit.code }, "the former member's editing view").toEqual(API_ERRORS.NO_PERMISSION_TO_REQUEST_APP);
    testInfo.annotations.push({ type: "observation", description: "the apps of a deleted workspace are not deleted (nothing removes them) but no call opens them" });
  });

  test("LC-DL11 an invitation of a deleted workspace admits nobody", lifecycleTestDetails("LC-DL11"), async ({ actor }) => {
    const admin = await actor("dlowner");
    const outsider = await actor("dloutsider");
    const doomed = await createOrganization(admin.request, WORKSPACE_NAME);
    const control = await actor("dlcontrol");
    const usedBefore = await createInvitation(admin.request, doomed);
    const code = await createInvitation(admin.request, doomed);
    await acceptInvitation(control.request, usedBefore);
    expect((await currentUser(control.request)).orgAndRoles.map((entry) => entry.org.id), "setup: an invitation of the workspace admits before the deletion").toContain(doomed);
    expectAnswer(await deleteOrganizationRaw(admin.request, doomed), OK, "the deletion");

    const answer = await apiRaw(outsider.request, "GET", `${API_PATHS.INVITATION}/${code}/invite`);

    expectAnswer(answer, API_ERRORS.UNABLE_TO_FIND_VALID_ORG, "the invitation of the deleted workspace");
    expect((await currentUser(outsider.request)).orgAndRoles.map((entry) => entry.org.id), "the outsider did not join").not.toContain(doomed);
  });

  test("LC-DL12 a removed member's bundle grant does not survive a rejoin", lifecycleTestDetails("LC-DL12"), async ({ actor }) => {
    const admin = await actor("dlowner");
    const member = await actor("dlmember");
    await joinWorkspace(admin, member);
    const bundleId = await createBundle(admin.request, { orgId: admin.orgId, name: "dl-bundle" });
    await grantBundlePermission(admin.request, bundleId, { role: "viewer", userIds: [member.userId] });
    const hasRow = async (): Promise<boolean> => (await listBundlePermissions(admin.request, bundleId)).userPermissions.some((row) => row.id === member.userId);
    expect(await hasRow(), "setup: the member holds a bundle row").toBe(true);
    expect((await bundleElementsRaw(member.request, bundleId)).status, "setup: the member reads the bundle's elements").toBe(200);
    const groupId = await createGroup(admin.request, "dl-bundle-group");
    await addGroupMember(admin.request, groupId, member.userId, "member");

    await removeOrgMember(admin.request, admin.orgId, member.userId);
    await expect.poll(() => isInGroup(admin, groupId, member.userId), { message: "control: the clean-up ran (the member left its group)", ...POLL }).toBe(false);
    await rejoin(admin, member);

    await expect.poll(hasRow, { message: "the rejoined member holds no bundle row", ...POLL }).toBe(false);
    const elements = await bundleElementsRaw(member.request, bundleId);
    expect({ status: elements.status, code: elements.code }, "the rejoined member's bundle elements read").toEqual(API_ERRORS.NO_PERMISSION_TO_REQUEST_APP);
  });

  test("LC-DL13 an app created by a removed developer is not readable by it, neither while removed nor after a rejoin (creator-shortcut candidate)", lifecycleCandidateDetails(
    "LC-DL13",
    "the removed creator's published view answers 200 (SEC-R11b, membership-changes.spec.ts:95, the creator-shortcut VIEWER row)",
  ), async ({ actor }) => {
    const admin = await actor("dlowner");
    const developer = await actor("dldeveloper");
    await joinWorkspace(admin, developer);
    await makeDeveloper(admin, developer);
    const name = `dl-dev-app-lc13-${Date.now()}`;
    const { appId } = await createApp(developer.request, { orgId: admin.orgId, name });
    expect(await hasAppRow(admin, appId, developer.userId), "setup: the developer owns the app").toBe(true);
    expect(await viewAppRaw(developer.request, appId), "setup: the creator views the app").toEqual(OK);

    await removeOrgMember(admin.request, admin.orgId, developer.userId);
    await expect.poll(() => hasAppRow(admin, appId, developer.userId), { message: "control: the creator's owner row is deleted", ...POLL }).toBe(false);

    const removedView = await viewAppRaw(developer.request, appId);
    expect({ status: removedView.status, code: removedView.code }, "the removed creator's view (desired: denied like any other removed member, SEC-R11a)").toEqual(API_ERRORS.NO_PERMISSION_TO_REQUEST_APP);
    await rejoin(admin, developer);
    const rejoinedView = await viewAppRaw(developer.request, appId);
    expect({ status: rejoinedView.status, code: rejoinedView.code }, "the rejoined creator's view (desired: denied like a rejoined member, LC-DL02)").toEqual(API_ERRORS.NO_PERMISSION_TO_REQUEST_APP);
  });

  test("LC-DL14 a folder created by a removed developer is not manageable by it after a rejoin (creator-shortcut candidate)", lifecycleCandidateDetails(
    "LC-DL14",
    "the rejoined creator's rename answers 200 again (checkManagePermissionInCurrentOrg matches createdBy against the current org member once more)",
  ), async ({ actor }) => {
    const admin = await actor("dlowner");
    const developer = await actor("dldeveloper");
    await joinWorkspace(admin, developer);
    await makeDeveloper(admin, developer);
    const originalName = "dl-folder-lc14";
    const folderId = await createFolder(developer.request, originalName);
    const probeName = "dl-folder-lc14-probe-9f3c";
    const renameAs = (actor: Actor, name: string) => apiRaw(actor.request, "PUT", API_PATHS.FOLDERS, { data: { id: folderId, name } });
    const rootListing = async (): Promise<string> => (await apiRaw(admin.request, "GET", API_PATHS.FOLDER_ELEMENTS)).body;
    expectAnswer(await renameAs(developer, probeName), OK, "setup: the creator renames its own folder");
    expectAnswer(await renameAs(developer, originalName), OK, "setup: rename back to the original name, so the control below has something to detect");
    expect(await rootListing(), "setup: the root listing holds the original name").toContain(originalName);
    const groupId = await createGroup(admin.request, "dl-folder-lc14-group");
    await addGroupMember(admin.request, groupId, developer.userId, "member");

    await removeOrgMember(admin.request, admin.orgId, developer.userId);
    await expect.poll(() => isInGroup(admin, groupId, developer.userId), { message: "control: the clean-up ran (the creator left its group)", ...POLL }).toBe(false);
    await rejoin(admin, developer);

    const rejoinedRename = await renameAs(developer, probeName);
    expect({ status: rejoinedRename.status, code: rejoinedRename.code }, "the rejoined creator's rename (desired: refused, like any other non-creator developer, SEC-R15b)").toEqual(API_ERRORS.FOLDER_OPERATE_NO_PERMISSION);
    const after = await rootListing();
    expect(after, "the admin's folder listing still shows the old name").toContain(originalName);
    expect(after, "and not the rejoined creator's attempted rename").not.toContain(probeName);
  });

  test("LC-DL15 a bundle created by a removed developer is not readable by it, neither while removed nor after a rejoin (creator-shortcut candidate)", lifecycleCandidateDetails(
    "LC-DL15",
    "the removed/rejoined creator's bundleElementsRaw answers 200 through the creator-shortcut VIEWER row, same mechanism as LC-DL13's app case and SEC-R11b; expected to deny with NO_PERMISSION_TO_REQUEST_APP by the same code path LC-DL12 measures for a non-creator bundle grant (SEC-C23a, tests/security/bundles.spec.ts:86), not yet run against the fixed image, deferred to the combined final run",
  ), async ({ actor }) => {
    const admin = await actor("dlowner");
    const developer = await actor("dldeveloper");
    await joinWorkspace(admin, developer);
    await makeDeveloper(admin, developer);
    const bundleId = await createBundle(developer.request, { orgId: admin.orgId, name: `dl-dev-bundle-lc15-${Date.now()}` });
    const hasRow = async (): Promise<boolean> => (await listBundlePermissions(admin.request, bundleId)).userPermissions.some((row) => row.id === developer.userId);
    expect(await hasRow(), "setup: the developer owns the bundle").toBe(true);
    expect((await bundleElementsRaw(developer.request, bundleId)).status, "setup: the creator reads the bundle's elements").toBe(200);

    await removeOrgMember(admin.request, admin.orgId, developer.userId);
    await expect.poll(hasRow, { message: "control: the creator's owner row is deleted", ...POLL }).toBe(false);

    const removedElements = await bundleElementsRaw(developer.request, bundleId);
    expect({ status: removedElements.status, code: removedElements.code }, "the removed creator's bundle elements (desired: denied)").toEqual(API_ERRORS.NO_PERMISSION_TO_REQUEST_APP);
    await rejoin(admin, developer);
    const rejoinedElements = await bundleElementsRaw(developer.request, bundleId);
    expect({ status: rejoinedElements.status, code: rejoinedElements.code }, "the rejoined creator's bundle elements (desired: denied)").toEqual(API_ERRORS.NO_PERMISSION_TO_REQUEST_APP);
  });
});

/** Whether the developer is still in the developers group of the workspace its (former) admin owns. */
async function isInGroupOfDeveloper(admin: Actor, developer: Actor): Promise<boolean> {
  const devGroup = (await listGroups(admin.request)).find((group) => group.devGroup);
  if (!devGroup) {
    throw new Error(`the workspace ${admin.orgId} has no developer group`);
  }
  return isInGroup(admin, devGroup.groupId, developer.userId);
}
