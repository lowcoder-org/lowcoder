import {
  acceptInvitation,
  addAppToBundle,
  addGroupMember,
  apiRaw,
  bundleElementsRaw,
  createApiKey,
  createApp,
  createBundle,
  createFolder,
  createGroup,
  createInvitation,
  createLibraryQuery,
  createPostgresDatasource,
  createSnapshot,
  currentUser,
  currentUserId,
  deleteApiKey,
  deleteBundle,
  editAppRaw,
  executeAppQueryRaw,
  getApp,
  getAppDsl,
  grantAppPermission,
  grantBundlePermission,
  grantDatasourcePermission,
  grantFolderPermission,
  listAppPermissions,
  listAppVersions,
  listBundlePermissions,
  listDatasourcePermissions,
  listFolderPermissions,
  listGroupMembers,
  listGroups,
  listOrgMembers,
  listSnapshots,
  logout,
  moveToFolder,
  publishApp,
  publishBundle,
  recycleBundle,
  setBundlePublicToAll,
  removeAppPermission,
  removeDatasourcePermission,
  removeFolderPermission,
  removeGroupMember,
  removeOrgMember,
  seedOAuthConfig,
  readProfilePhoto,
  signIn,
  switchOrganization,
  updateAppPermission,
  updateDatasourcePermission,
  updateFolderPermission,
  updateGroupMemberRole,
  updateMemberRole,
  uploadProfilePhoto,
  viewAppRaw,
} from "../../src/api/client";
import {
  API_ERRORS,
  API_OK,
  API_PATHS,
  APP_ROLES,
  APP_STATUS,
  APP_TYPE_APPLICATION,
  ORG_ROLES,
  SESSION_COOKIE_NAME,
  TAGS,
  applicationPath,
  bundleRecyclePath,
  bundleViewPath,
  groupMembersPath,
  libraryQueryPath,
  orgMembersPath,
} from "../../src/constants";
import { expect, test } from "../../src/fixtures";
import { PNG_RED } from "../../src/media";
import { postgresConnection } from "../../src/postgres";
import {
  SEEDED_APP_NAME,
  SEEDED_BUTTON_TEST_ID,
  SEEDED_BUTTON_TEXT,
  SEEDED_QUERY_ID,
  adminOfApiUser,
  grantApp,
  joinWorkspace,
  makeAdmin,
  makeDeveloper,
  seedPrivateApp,
} from "../../src/security/actors";
import { memberOf, permissionIdOf, roleOf, sceneOf } from "../../src/security/scene";
import { superAdminCredentials } from "../../src/security/super-admin";

/** Names the tests give what they create; unique per test because every actor has its own workspace. */
const SCENARIO_APP = "e2e-sec-helper-app";
const BUNDLE_NAME = "e2e-sec-helper-bundle";
const FOLDER_NAME = "e2e-sec-helper-folder";
const GROUP_NAME = "e2e-sec-helper-group";
const LIBRARY_QUERY_NAME = "e2e-sec-helper-query";
const API_KEY_NAME = "e2e-sec-helper-key";
const OAUTH_SECRET = "e2e-sec-helper-secret";
/** A GitHub sign-in config is stored with `source` and `authType` GITHUB (measured). */
const OAUTH_SOURCE = "GITHUB";
const BEARER_PREFIX = "Bearer ";
/** The trash of bundles: `GET /api/bundles/recycle/list` (the recycle builder with the segment `list`). */
const RECYCLED_BUNDLES_PATH = bundleRecyclePath("list");

interface ConfigRow {
  source: string;
  clientSecret?: string;
}
interface GroupMemberRow {
  userId: string;
  role: string;
}

test.describe("security helpers: apiRaw, actor and the raw answers", () => {
  test("apiRaw reads an anonymous call to an authenticated route: 401 and no body", async ({ request }) => {
    const answer = await apiRaw(request, "GET", API_PATHS.USER_MY_ORG);

    expect({ status: answer.status, code: answer.code }).toEqual(API_ERRORS.UNAUTHENTICATED);
    expect(answer.body, "the entry point sets only the status").toBe("");
  });

  test("apiRaw keeps the status and code of a denial and of a success", async ({ actor }) => {
    const owner = await actor("owner");
    const outsider = await actor("outsider");
    const { appId } = await createApp(owner.request, { orgId: owner.orgId, name: SCENARIO_APP });

    const denied = await apiRaw(outsider.request, "GET", applicationPath(appId));
    const allowed = await apiRaw(owner.request, "GET", applicationPath(appId));

    expect({ status: denied.status, code: denied.code }, "an outsider opening the editing view").toEqual(
      API_ERRORS.NO_PERMISSION_TO_REQUEST_APP,
    );
    expect({ status: allowed.status, code: allowed.code }, "the owner").toEqual({ status: 200, code: API_OK });
  });

  test("the session cookie has the name SESSION_COOKIE_NAME and is HttpOnly, SameSite=Lax, not Secure", async ({ actor }) => {
    const user = await actor("cookie");

    const cookies = (await user.request.storageState()).cookies.filter((cookie) => cookie.name === SESSION_COOKIE_NAME);

    expect(cookies, "one session cookie").toHaveLength(1);
    expect(cookies[0]).toMatchObject({ httpOnly: true, sameSite: "Lax", secure: false });
  });

  test("an actor is a distinct user with its own workspace, of which it is the admin", async ({ actor }) => {
    const first = await actor("first");
    const second = await actor("second");

    expect(new Set([first.userId, second.userId, first.email, second.email, first.orgId, second.orgId]).size).toBe(6);
    expect(first.request, "the request context is the session's page.request").toBe(first.session.page.request);
    const members = await listOrgMembers(first.request, first.orgId);
    expect(members.find((member) => member.userId === first.userId)?.role, "admin of its own workspace").toBe(ORG_ROLES.ADMIN);
    const outsiderAnswer = await apiRaw(second.request, "GET", orgMembersPath(first.orgId));
    expect(
      { status: outsiderAnswer.status, code: outsiderAnswer.code },
      "the second actor is no member of the first's workspace: it shares nothing",
    ).toEqual(API_ERRORS.NOT_AUTHORIZED);
  });

  test("two actors have separate sessions: logging one out leaves the other signed in", async ({ actor }) => {
    const first = await actor("first");
    const second = await actor("second");
    expect((await apiRaw(first.request, "GET", API_PATHS.USER_MY_ORG)).status, "signed in before").toBe(200);

    await logout(first.request);

    expect(await apiRaw(first.request, "GET", API_PATHS.USER_MY_ORG), "the logged-out session is dead").toMatchObject(
      API_ERRORS.UNAUTHENTICATED,
    );
    expect((await apiRaw(second.request, "GET", API_PATHS.USER_MY_ORG)).status, "the other session is untouched").toBe(200);
  });
});

test.describe("security helpers: workspace membership", () => {
  test("accepting an invitation already makes the invited workspace the current one (measured on 3.0.0-e2e)", async ({ actor }) => {
    const owner = await actor("owner");
    const guest = await actor("guest");
    expect((await currentUser(guest.request)).currentOrgId, "before: its own workspace").toBe(guest.orgId);

    await acceptInvitation(guest.request, await createInvitation(owner.request, owner.orgId));

    expect((await currentUser(guest.request)).currentOrgId, "after: the owner's workspace").toBe(owner.orgId);
  });

  test("switchOrganization makes the workspace the user's current one and back", async ({ actor }) => {
    const owner = await actor("owner");
    const guest = await actor("guest");
    await acceptInvitation(guest.request, await createInvitation(owner.request, owner.orgId));

    await switchOrganization(guest.request, guest.orgId);
    expect((await currentUser(guest.request)).currentOrgId, "back in its own").toBe(guest.orgId);
    await switchOrganization(guest.request, owner.orgId);

    expect((await currentUser(guest.request)).currentOrgId, "in the owner's again").toBe(owner.orgId);
  });

  test("joinWorkspace turns an outsider into a member of the owner's workspace, current there", async ({ actor }) => {
    const owner = await actor("owner");
    const guest = await actor("guest");
    const before = await apiRaw(guest.request, "GET", orgMembersPath(owner.orgId));
    expect({ status: before.status, code: before.code }, "before: an outsider may not list the members").toEqual(API_ERRORS.NOT_AUTHORIZED);

    await joinWorkspace(owner, guest);

    const members = await listOrgMembers(owner.request, owner.orgId);
    expect(members.find((member) => member.userId === guest.userId)?.role, "a plain member").toBe(ORG_ROLES.MEMBER);
    expect((await currentUser(guest.request)).currentOrgId, "current in the owner's workspace").toBe(owner.orgId);
    expect(guest.orgId, "the actor's own workspace id is unchanged").not.toBe(owner.orgId);
  });

  test("makeDeveloper lets a member create apps in the workspace; before it the server answers NEED_DEV_TO_CREATE_RESOURCE", async ({
    actor,
  }) => {
    const owner = await actor("owner");
    const guest = await actor("guest");
    await joinWorkspace(owner, guest);
    const createAsGuest = () =>
      apiRaw(guest.request, "POST", API_PATHS.APPLICATIONS, {
        data: { orgId: owner.orgId, name: SCENARIO_APP, applicationType: APP_TYPE_APPLICATION, editingApplicationDSL: {} },
      });
    const before = await createAsGuest();
    expect({ status: before.status, code: before.code }, "before: a plain member").toEqual(API_ERRORS.NEED_DEV_TO_CREATE_RESOURCE);

    await makeDeveloper(owner, guest);

    const after = await createAsGuest();
    expect({ status: after.status, code: after.code }, "after: a developer").toEqual({ status: 200, code: API_OK });
  });

  test("makeAdmin and updateMemberRole change the role in the member list", async ({ actor }) => {
    const owner = await actor("owner");
    const guest = await actor("guest");
    await joinWorkspace(owner, guest);
    const roleOfGuest = async () =>
      (await listOrgMembers(owner.request, owner.orgId)).find((member) => member.userId === guest.userId)?.role;
    expect(await roleOfGuest(), "before").toBe(ORG_ROLES.MEMBER);

    await makeAdmin(owner, guest);
    expect(await roleOfGuest(), "after makeAdmin").toBe(ORG_ROLES.ADMIN);
    await updateMemberRole(owner.request, owner.orgId, guest.userId, ORG_ROLES.MEMBER);

    expect(await roleOfGuest(), "after updateMemberRole back to member").toBe(ORG_ROLES.MEMBER);
  });

  test("removeOrgMember takes the user out of the member list", async ({ actor }) => {
    const owner = await actor("owner");
    const guest = await actor("guest");
    await joinWorkspace(owner, guest);
    const isMember = async () => (await listOrgMembers(owner.request, owner.orgId)).some((member) => member.userId === guest.userId);
    expect(await isMember(), "before").toBe(true);

    await removeOrgMember(owner.request, owner.orgId, guest.userId);

    expect(await isMember(), "after").toBe(false);
  });
});

test.describe("security helpers: seeding and grants", () => {
  test("seedPrivateApp builds a published private app with the fixed button and query ids", async ({ actor }) => {
    const owner = await actor("owner");
    const outsider = await actor("outsider");

    const seeded = await seedPrivateApp(owner);

    expect(seeded.queryId).toBe(SEEDED_QUERY_ID);
    expect(seeded.appGid, "the create answer carries the gid").toBeTruthy();
    const draft = JSON.stringify((await getAppDsl(owner.request, seeded.appId)).applicationDSL);
    expect(draft, "the draft holds the button").toContain(SEEDED_BUTTON_TEST_ID);
    expect(draft, "and its text").toContain(SEEDED_BUTTON_TEXT);
    expect(draft, "and the query id").toContain(`"id":"${SEEDED_QUERY_ID}"`);
    expect(await viewAppRaw(owner.request, seeded.appId), "published: the owner views it").toMatchObject({ code: API_OK });
    const run = await executeAppQueryRaw(owner.request, { applicationId: seeded.appId, queryId: seeded.queryId, viewMode: true });
    expect(run.status, "the owner runs the query").toBe(200);
    expect(run.body, "and gets the rows of the products table").toContain("product-01");
    expect(await viewAppRaw(outsider.request, seeded.appId), "private: an outsider may not view it").toMatchObject({
      status: API_ERRORS.NO_PERMISSION_TO_REQUEST_APP.status,
      code: API_ERRORS.NO_PERMISSION_TO_REQUEST_APP.code,
    });
    const denied = await executeAppQueryRaw(outsider.request, { applicationId: seeded.appId, queryId: seeded.queryId, viewMode: true });
    expect({ status: denied.status, code: denied.code }, "nor run its query").toEqual(API_ERRORS.NOT_AUTHORIZED);
  });

  test("seedPrivateApp uses the data source it is given instead of creating one", async ({ actor }) => {
    const owner = await actor("owner");
    const datasourceId = await createPostgresDatasource(owner.request, {
      orgId: owner.orgId,
      name: "e2e-sec-helper-ds",
      connection: postgresConnection(),
    });

    const seeded = await seedPrivateApp(owner, { name: `${SEEDED_APP_NAME}-given`, datasourceId });

    expect(seeded.datasourceId).toBe(datasourceId);
    expect(JSON.stringify((await getAppDsl(owner.request, seeded.appId)).applicationDSL), "the query names it").toContain(datasourceId);
  });

  test("grantApp gives a member the role: viewer may view, editor may open the editing view", async ({ actor }) => {
    const owner = await actor("owner");
    const guest = await actor("guest");
    await joinWorkspace(owner, guest);
    const { appId } = await seedPrivateApp(owner);
    expect(await viewAppRaw(guest.request, appId), "before: a member without a grant").toMatchObject({
      code: API_ERRORS.NO_PERMISSION_TO_REQUEST_APP.code,
    });

    await grantApp(owner, appId, guest, APP_ROLES.VIEWER);

    expect(await viewAppRaw(guest.request, appId), "viewer views").toMatchObject({ code: API_OK });
    expect(await editAppRaw(guest.request, appId), "viewer may not edit").toMatchObject({ code: API_ERRORS.NO_PERMISSION_TO_REQUEST_APP.code });
    const viewerRow = (await listAppPermissions(owner.request, appId)).userPermissions.find((row) => row.id === guest.userId);
    expect(viewerRow?.role, "the permission list shows the viewer row").toBe(APP_ROLES.VIEWER);

    await updateAppPermission(owner.request, appId, viewerRow!.permissionId, APP_ROLES.EDITOR);

    expect(await editAppRaw(guest.request, appId), "after updateAppPermission: editor edits").toMatchObject({ code: API_OK });

    await removeAppPermission(owner.request, appId, viewerRow!.permissionId);

    expect(await viewAppRaw(guest.request, appId), "after removeAppPermission: denied again").toMatchObject({
      code: API_ERRORS.NO_PERMISSION_TO_REQUEST_APP.code,
    });
  });

  test("a group grant works through grantAppPermission(groupIds), createGroup, addGroupMember and removeGroupMember", async ({ actor }) => {
    const owner = await actor("owner");
    const guest = await actor("guest");
    await joinWorkspace(owner, guest);
    const { appId } = await seedPrivateApp(owner);
    const groupId = await createGroup(owner.request, GROUP_NAME);
    expect((await listGroups(owner.request)).find((group) => group.groupId === groupId)?.groupName, "listed").toBe(GROUP_NAME);
    await grantAppPermission(owner.request, appId, { role: APP_ROLES.VIEWER, userIds: [], groupIds: [groupId] });
    expect(await viewAppRaw(guest.request, appId), "before: the guest is not in the group").toMatchObject({
      code: API_ERRORS.NO_PERMISSION_TO_REQUEST_APP.code,
    });

    await addGroupMember(owner.request, groupId, guest.userId, ORG_ROLES.MEMBER);

    expect(await viewAppRaw(guest.request, appId), "in the group: views").toMatchObject({ code: API_OK });
    const rowOf = async () => {
      const answer = await apiRaw(owner.request, "GET", groupMembersPath(groupId));
      return ((answer.json as { data: { members: GroupMemberRow[] } }).data.members).find((member) => member.userId === guest.userId);
    };
    expect((await rowOf())?.role, "member role").toBe(ORG_ROLES.MEMBER);
    await updateGroupMemberRole(owner.request, groupId, guest.userId, ORG_ROLES.ADMIN);
    expect((await rowOf())?.role, "after updateGroupMemberRole").toBe(ORG_ROLES.ADMIN);

    await removeGroupMember(owner.request, groupId, guest.userId);

    expect(await viewAppRaw(guest.request, appId), "removed from the group: denied again").toMatchObject({
      code: API_ERRORS.NO_PERMISSION_TO_REQUEST_APP.code,
    });
  });

  test("listGroupMembers lists the members of a group with their role, and a plain member may not list a foreign group", async ({ actor }) => {
    const owner = await actor("owner");
    const guest = await actor("guest");
    await joinWorkspace(owner, guest);
    const groupId = await createGroup(owner.request, GROUP_NAME);
    await addGroupMember(owner.request, groupId, guest.userId, ORG_ROLES.MEMBER);

    const members = await listGroupMembers(owner.request, groupId);

    expect(members.find((member) => member.userId === guest.userId)?.role, "the guest's role").toBe(ORG_ROLES.MEMBER);
    expect(members.map((member) => member.userId), "the creator is a member too").toContain(owner.userId);
  });

  test("listGroups reports the developer group by its flag, and the all-users group", async ({ actor }) => {
    const owner = await actor("owner");

    const groups = await listGroups(owner.request);

    expect(groups.filter((group) => group.devGroup), "exactly one developer group").toHaveLength(1);
    expect(groups.filter((group) => group.allUsersGroup), "exactly one all-users group").toHaveLength(1);
  });

  test("folder helpers: createFolder, moveToFolder and the permission rows", async ({ actor }) => {
    const owner = await actor("owner");
    const guest = await actor("guest");
    await joinWorkspace(owner, guest);
    const folderId = await createFolder(owner.request, FOLDER_NAME);
    const { appId } = await createApp(owner.request, { orgId: owner.orgId, name: SCENARIO_APP });
    const folderHolds = async () =>
      JSON.stringify((await apiRaw(owner.request, "GET", API_PATHS.FOLDER_ELEMENTS, { params: { id: folderId } })).json).includes(appId);
    expect(await folderHolds(), "before the move").toBe(false);

    await moveToFolder(owner.request, appId, folderId);

    expect(await folderHolds(), "after the move").toBe(true);
    await grantFolderPermission(owner.request, folderId, { role: APP_ROLES.VIEWER, userIds: [guest.userId] });
    const row = (await listFolderPermissions(owner.request, folderId)).userPermissions.find((item) => item.id === guest.userId);
    expect(row?.role, "granted").toBe(APP_ROLES.VIEWER);
    await updateFolderPermission(owner.request, folderId, row!.permissionId, APP_ROLES.EDITOR);
    expect(
      (await listFolderPermissions(owner.request, folderId)).userPermissions.find((item) => item.id === guest.userId)?.role,
      "updated",
    ).toBe(APP_ROLES.EDITOR);

    await removeFolderPermission(owner.request, folderId, row!.permissionId);

    expect(
      (await listFolderPermissions(owner.request, folderId)).userPermissions.some((item) => item.id === guest.userId),
      "removed",
    ).toBe(false);
  });

  test("datasource permission helpers: grant, list, update, remove", async ({ actor }) => {
    const owner = await actor("owner");
    const guest = await actor("guest");
    await joinWorkspace(owner, guest);
    const { datasourceId } = await seedPrivateApp(owner);
    const rowOf = async () =>
      (await listDatasourcePermissions(owner.request, datasourceId)).userPermissions.find((item) => item.id === guest.userId);
    expect(await rowOf(), "before").toBeUndefined();

    await grantDatasourcePermission(owner.request, datasourceId, { role: APP_ROLES.VIEWER, userIds: [guest.userId] });
    const row = await rowOf();
    expect(row?.role, "granted").toBe(APP_ROLES.VIEWER);
    await updateDatasourcePermission(owner.request, row!.permissionId, APP_ROLES.OWNER);
    expect((await rowOf())?.role, "updated").toBe(APP_ROLES.OWNER);
    await removeDatasourcePermission(owner.request, row!.permissionId);

    expect(await rowOf(), "removed").toBeUndefined();
  });
});

test.describe("security helpers: credentials and content", () => {
  test("createApiKey gives a token that authenticates as its user; apiRaw carries the header", async ({ actor, request }) => {
    const owner = await actor("owner");
    const { id, token } = await createApiKey(owner.request, API_KEY_NAME);
    const answerWith = (value: string) =>
      apiRaw(request, "GET", API_PATHS.USER_MY_ORG, { headers: { Authorization: `${BEARER_PREFIX}${value}` } });
    expect((await apiRaw(request, "GET", API_PATHS.USER_MY_ORG)).status, "without the key: anonymous").toBe(401);

    expect((await answerWith(token)).status, "with the key").toBe(200);
    expect((await answerWith(`${token}x`)).status, "with a changed token").toBe(401);
    // deleteApiKey is asserted to answer success here; that it also removes the key is the quarantined test below.
    await expect(deleteApiKey(owner.request, id)).resolves.toBeUndefined();
  });

  // D-45 (SF-40): on 3.0.0 `DELETE /api/auth/api-key/{id}` answers success but the key
  // stays in the list and keeps authenticating (measured: still accepted 11 s later). HEAD changed the code
  // (`user.replaceApiKeys`, AuthenticationApiServiceImpl.java:deleteAPIKey), NOT VERIFIED at runtime.
  test("deleteApiKey removes the key (API-key delete candidate)", {
    tag: TAGS.QUARANTINE,
    annotation: { type: "defect", description: "D-45" },
  }, async ({ actor, request }) => {
    const owner = await actor("owner");
    const { id, token } = await createApiKey(owner.request, API_KEY_NAME);
    const answer = () => apiRaw(request, "GET", API_PATHS.USER_MY_ORG, { headers: { Authorization: `${BEARER_PREFIX}${token}` } });
    expect((await answer()).status, "before: the key works").toBe(200);

    await deleteApiKey(owner.request, id);

    expect((await answer()).status, "after: the key is refused").toBe(API_ERRORS.UNAUTHENTICATED.status);
  });

  test("logout ends the session: the same cookie is refused afterwards", async ({ actor }) => {
    const user = await actor("user");
    expect((await apiRaw(user.request, "GET", API_PATHS.USER_MY_ORG)).status, "before").toBe(200);

    await logout(user.request);

    expect((await apiRaw(user.request, "GET", API_PATHS.USER_MY_ORG)).status, "after").toBe(401);
  });

  test("createLibraryQuery stores a query of the workspace that can be read back", async ({ actor }) => {
    const owner = await actor("owner");

    const id = await createLibraryQuery(owner.request, { orgId: owner.orgId, name: LIBRARY_QUERY_NAME, query: { sql: "select 1" } });

    const read = await apiRaw(owner.request, "GET", libraryQueryPath(id));
    expect(read.status).toBe(200);
    expect(read.body, "the stored query").toContain(LIBRARY_QUERY_NAME);
  });

  test("createSnapshot adds one history snapshot that listSnapshots returns", async ({ actor }) => {
    const owner = await actor("owner");
    const { appId } = await createApp(owner.request, { orgId: owner.orgId, name: SCENARIO_APP });
    expect(await listSnapshots(owner.request, appId), "before").toEqual([]);

    await createSnapshot(owner.request, appId, { ui: {} });

    const snapshots = await listSnapshots(owner.request, appId);
    expect(snapshots, "after: one snapshot").toHaveLength(1);
    expect(snapshots[0]?.snapshotId, "with an id").toBeTruthy();
  });

  test("bundle helpers: createBundle, addAppToBundle, bundleElementsRaw, grantBundlePermission, listBundlePermissions, recycleBundle, deleteBundle", async ({
    actor,
  }) => {
    const owner = await actor("owner");
    const guest = await actor("guest");
    await joinWorkspace(owner, guest);
    const { appId } = await createApp(owner.request, { orgId: owner.orgId, name: SCENARIO_APP });
    const bundleId = await createBundle(owner.request, { orgId: owner.orgId, name: BUNDLE_NAME });
    expect((await bundleElementsRaw(owner.request, bundleId)).body, "before: the bundle is empty").not.toContain(appId);

    await addAppToBundle(owner.request, appId, bundleId);

    const elements = await bundleElementsRaw(owner.request, bundleId);
    expect(elements.status).toBe(200);
    expect(elements.body, "after: the app is in the bundle").toContain(appId);
    expect((await apiRaw(guest.request, "GET", bundleViewPath(bundleId))).code, "before the grant: a member without one").not.toBe(API_OK);
    expect(
      (await listBundlePermissions(owner.request, bundleId)).userPermissions.some((item) => item.id === guest.userId),
      "before the grant: no bundle permission row",
    ).toBe(false);
    await grantBundlePermission(owner.request, bundleId, { role: APP_ROLES.VIEWER, userIds: [guest.userId] });
    expect((await apiRaw(guest.request, "GET", bundleViewPath(bundleId))).code, "after the grant: viewer views").toBe(API_OK);
    expect(
      (await listBundlePermissions(owner.request, bundleId)).userPermissions.find((item) => item.id === guest.userId)?.role,
      "after the grant: a bundle permission row listing the role",
    ).toBe(APP_ROLES.VIEWER);
    expect((await apiRaw(owner.request, "GET", RECYCLED_BUNDLES_PATH)).body, "before recycling: not in the trash").not.toContain(bundleId);
    await recycleBundle(owner.request, bundleId);
    expect((await apiRaw(owner.request, "GET", bundleViewPath(bundleId))).code, "recycled: the view is refused").not.toBe(API_OK);
    expect((await apiRaw(owner.request, "GET", RECYCLED_BUNDLES_PATH)).body, "recycled: in the trash").toContain(bundleId);

    await deleteBundle(owner.request, bundleId);

    expect((await apiRaw(owner.request, "GET", RECYCLED_BUNDLES_PATH)).body, "deleted: out of the trash").not.toContain(bundleId);
  });

  test("bundle helpers: publishBundle, setBundlePublicToAll", async ({ actor }) => {
    const owner = await actor("owner");
    const outsider = await actor("outsider");
    // A bundle with no app ever added keeps `editingBundleDSL` null (Bundle.java:39 has no builder default), so publishing
    // it would copy null into `publishedBundleDSL` (BundleServiceImpl.java:90-97) and never satisfy the "after publishing"
    // assertion below. Add one app first, as every other bundle helpers test does, so there is editing DSL to publish.
    const bundleId = await createBundle(owner.request, { orgId: owner.orgId, name: BUNDLE_NAME });
    const { appId } = await createApp(owner.request, { orgId: owner.orgId, name: SCENARIO_APP });
    await addAppToBundle(owner.request, appId, bundleId);
    const view = async () => (await apiRaw(owner.request, "GET", bundleViewPath(bundleId))).json as { data: { publishedBundleDSL?: unknown } };
    expect((await view()).data.publishedBundleDSL, "before publishing: no published DSL yet").toBeFalsy();
    expect((await apiRaw(outsider.request, "GET", bundleViewPath(bundleId))).code, "before: an outsider has no grant").not.toBe(API_OK);

    await publishBundle(owner.request, bundleId);

    expect((await view()).data.publishedBundleDSL, "after publishing: a published DSL exists").toBeTruthy();

    await setBundlePublicToAll(owner.request, bundleId, true);

    expect((await apiRaw(outsider.request, "GET", bundleViewPath(bundleId))).code, "after public-to-all: an outsider views").toBe(API_OK);
  });

  // D-46 (SF-41): the 3.0.0 server recycles a bundle and then answers 500 / 5005.
  test("a bundle recycle answers success (bundle recycle candidate)", {
    tag: TAGS.QUARANTINE,
    annotation: { type: "defect", description: "D-46" },
  }, async ({ actor }) => {
    const owner = await actor("owner");
    const bundleId = await createBundle(owner.request, { orgId: owner.orgId, name: BUNDLE_NAME });

    const answer = await apiRaw(owner.request, "PUT", bundleRecyclePath(bundleId));

    expect({ status: answer.status, code: answer.code }).toEqual({ status: 200, code: API_OK });
  });

  test("seedOAuthConfig stores a GitHub config with the given secret that the admin can list", async ({ actor }) => {
    const owner = await actor("owner");
    const configs = async () => (await apiRaw(owner.request, "GET", API_PATHS.AUTH_CONFIGS)).json as { data: ConfigRow[] };
    expect((await configs()).data.some((config) => config.source === OAUTH_SOURCE), "before").toBe(false);

    await seedOAuthConfig(owner.request, { clientSecret: OAUTH_SECRET });

    expect((await configs()).data.find((config) => config.source === OAUTH_SOURCE)?.clientSecret, "after").toBe(OAUTH_SECRET);
  });

  test("listAppVersions lists the published versions of an app", async ({ actor }) => {
    const owner = await actor("owner");
    const { appId } = await createApp(owner.request, { orgId: owner.orgId, name: SCENARIO_APP });
    expect(await listAppVersions(owner.request, appId), "before: nothing published").toHaveLength(0);

    await publishApp(owner.request, appId);

    const versions = await listAppVersions(owner.request, appId);
    expect(versions, "after: one version").toHaveLength(1);
    expect(typeof versions[0]?.id, "the version carries a non-empty id").toBe("string");
    expect(versions[0]?.id, "the version's id is not empty").not.toBe("");
  });

  test("uploadProfilePhoto stores a photo that readProfilePhoto returns a different one afterwards", async ({ actor }) => {
    const owner = await actor("owner");
    const buffer = Buffer.from(PNG_RED.split(",")[1] ?? "", "base64");
    const before = await readProfilePhoto(owner.request);

    await uploadProfilePhoto(owner.request, { name: "photo.png", mimeType: "image/png", buffer });

    const after = await readProfilePhoto(owner.request);
    expect(after.status).toBe(200);
    expect(after.bytes.length, "after: a photo").toBeGreaterThan(0);
    expect(after.bytes.equals(before.bytes), "after: not the photo of before").toBe(false);
  });

  test("createApp returns the gid of the app next to its id", async ({ actor }) => {
    const owner = await actor("owner");

    const app = await createApp(owner.request, { orgId: owner.orgId, name: SCENARIO_APP });

    expect(app.appGid, "a gid").toBeTruthy();
    expect(app.appGid, "different from the id").not.toBe(app.appId);
  });
});

test.describe("security helpers: sign-in, app details and the apiUser as owner", () => {
  test("signIn opens a second, independent session of an existing user", async ({ actor, newUserSession }) => {
    const user = await actor("user");
    const second = await newUserSession();
    expect((await apiRaw(second.page.request, "GET", API_PATHS.USER_MY_ORG)).status, "before: the new context is anonymous").toBe(401);

    await signIn(second.page.request, user.email);

    expect(await currentUserId(second.page.request), "after: the same user").toBe(user.userId);
    await logout(user.request);
    expect((await apiRaw(second.page.request, "GET", API_PATHS.USER_MY_ORG)).status, "the first session's logout leaves the second").toBe(200);
  });

  test("signIn with a wrong password throws and the message does not contain the password", async ({ actor, newUserSession }) => {
    const user = await actor("user");
    const wrongPassword = "Wrong-Passw0rd-e2e";

    const error = await signIn((await newUserSession()).page.request, user.email, wrongPassword).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).not.toContain(wrongPassword);
  });

  test("getApp reads name, workspace, creator, status, public flag and DSL of an app", async ({ actor }) => {
    const owner = await actor("owner");
    const { appId } = await seedPrivateApp(owner, { name: SCENARIO_APP });

    const app = await getApp(owner.request, appId);

    expect(app.name).toBe(SCENARIO_APP);
    expect(app.orgId).toBe(owner.orgId);
    expect(app.createBy, "an id").toBe(owner.userId);
    expect(app.applicationStatus).toBe(APP_STATUS.NORMAL);
    expect(app.publicToAll).toBe(false);
    expect(JSON.stringify(app.dsl)).toContain(SEEDED_BUTTON_TEST_ID);
  });

  test("getApp throws for a user who may not open the editing view", async ({ actor }) => {
    const owner = await actor("owner");
    const outsider = await actor("outsider");
    const { appId } = await seedPrivateApp(owner);

    await expect(getApp(outsider.request, appId)).rejects.toThrow(/5308/);
  });

  test("adminOfApiUser makes the apiUser fixture's user a workspace owner with its user id", async ({ page, apiUser }) => {
    const owner = await adminOfApiUser(page.request, apiUser);

    expect(owner.orgId).toBe(apiUser.orgId);
    expect(owner.email).toBe(apiUser.email);
    expect(owner.userId, "the id of the signed-in user").toBe(await currentUserId(page.request));
    expect((await listOrgMembers(owner.request, owner.orgId)).find((member) => member.userId === owner.userId)?.role).toBe(ORG_ROLES.ADMIN);
  });
});

test.describe("security helpers: scene", () => {
  test("sceneOf seeds the private app of the apiUser, memberOf adds a plain member, roleOf reads the role", async ({ page, apiUser, actor }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    expect(await viewAppRaw(a.request, seeded.appId), "A views the seeded app").toMatchObject({ status: 200, code: API_OK });
    expect(await roleOf(a, a.userId), "A is the admin").toBe(ORG_ROLES.ADMIN);

    const member = await memberOf(a, actor, "member");

    expect(await roleOf(a, member.userId), "the member's role").toBe(ORG_ROLES.MEMBER);
    expect((await currentUser(member.request)).currentOrgId, "OA is the member's current workspace").toBe(a.orgId);
    expect(await viewAppRaw(member.request, seeded.appId), "a member without a grant is denied the app").toMatchObject({
      code: API_ERRORS.NO_PERMISSION_TO_REQUEST_APP.code,
    });
    expect(await roleOf(a, "no-such-user"), "an unknown user has no role").toBeUndefined();
  });

  test("permissionIdOf returns the id of a row and fails the setup for a missing row or id", () => {
    expect(permissionIdOf({ permissionId: "p1" }, "a row")).toBe("p1");
    expect(() => permissionIdOf(undefined, "a missing row"), "no row").toThrow(/setup: a missing row has a permission row id/);
    expect(() => permissionIdOf({ permissionId: "" }, "an empty id"), "an empty id").toThrow(/setup: an empty id has a permission row id/);
  });
});

test.describe("security helpers: super admin", () => {
  test("the superAdmin fixture is the instance super admin: signed in, own guarded context, SUPER_ADMIN member of a new workspace", { tag: [TAGS.SUPERADMIN] }, async ({ page, apiUser, superAdmin }) => {
    const a = await adminOfApiUser(page.request, apiUser);

    expect(superAdmin.email, "the configured user name").toBe(superAdminCredentials(process.env).username);
    expect(superAdmin.session.context, "its own browser context, not the test's").not.toBe(page.context());
    expect("orgId" in superAdmin, "no workspace of its own").toBe(false);
    expect(superAdmin.userId, "the signed-in user's id").toBe(await currentUserId(superAdmin.request));
    expect(superAdmin.userId, "not A").not.toBe(a.userId);
    const cookies = (await superAdmin.request.storageState()).cookies.filter((cookie) => cookie.name === SESSION_COOKIE_NAME);
    expect(cookies, "one session cookie").toHaveLength(1);
    expect(await roleOf(a, superAdmin.userId), "S is a SUPER_ADMIN member of A's new workspace without an invitation").toBe(ORG_ROLES.SUPER_ADMIN);
  });

  test("a failed sign-in of the super admin names the e-mail and carries neither the wrong nor the real password", async ({ request }) => {
    const wrongPassword = "wrong-password-for-the-error-test";
    const { username, password } = superAdminCredentials(process.env);

    let message = "";
    try {
      await signIn(request, username, wrongPassword);
    } catch (error) {
      message = (error as Error).message;
    }

    expect(message, "the sign-in with a wrong password failed and named the e-mail").toContain(`sign in ${username}`);
    // Booleans, not `not.toContain(secret)`: a failing matcher prints its expected value into the report, the JUnit file and the trace.
    expect(message.includes(wrongPassword), "the message carries the wrong password").toBe(false);
    expect(message.includes(password), "the message carries the real password").toBe(false);
  });
});
