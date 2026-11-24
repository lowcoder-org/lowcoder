import type { Page } from "@playwright/test";
import {
  type RegisteredUser,
  apiRaw,
  createApp,
  createFolder,
  createGroup,
  createLibraryQuery,
  createSnapshot,
  currentUser,
  executeAppQueryRaw,
  getApp,
  grantDatasourcePermission,
  grantFolderPermission,
  listAppNames,
  listAppPermissions,
  listAppVersions,
  listDatasourcePermissions,
  listFolderPermissions,
  listOrgMembers,
  listSnapshots,
  readProfilePhoto,
  removeOrgMember,
  uploadProfilePhoto,
  viewAppRaw,
} from "../../src/api/client";
import {
  API_ERRORS,
  API_OK,
  API_PATHS,
  APP_PAGE,
  APP_ROLES,
  APP_STATUS,
  AUTH_ID_EMAIL,
  AUTH_SOURCE_EMAIL,
  ORG_ROLES,
  POSTGRES,
  PRODUCTS,
  TAGS,
  TEST_PASSWORD,
  UI_PATHS,
  appPermissionPath,
  appPermissionsPath,
  appRecordsByAppPath,
  appSlugPath,
  applicationPath,
  appViewPath,
  datasourcePath,
  datasourcePermissionPath,
  datasourcePermissionsPath,
  datasourceStructurePath,
  folderPermissionPath,
  folderPermissionsPath,
  groupAddMemberPath,
  groupMembersPath,
  groupPotentialMembersPath,
  invitationAcceptPath,
  libraryQueryPath,
  orgCommonSettingsPath,
  orgMembersPath,
  orgPath,
  orgRemoveMemberPath,
  orgRolePath,
  orgSlugPath,
  orgUpdatePath,
  publicToAllPath,
  publishPath,
  recyclePath,
  snapshotPath,
  switchOrgPath,
  userPhotoPath,
  userProfilePath,
} from "../../src/constants";
import { expect, test } from "../../src/fixtures";
import { appDsl, button } from "../../src/dsl/builders";
import { selectProductsQuery } from "../../src/datasource/notes-queries";
import { PNG_RED } from "../../src/media";
import { AppListPage } from "../../src/pages/AppListPage";
import { LoginPage } from "../../src/pages/LoginPage";
import { AppViewPage } from "../../src/pages/AppViewPage";
import { EditorPage } from "../../src/pages/EditorPage";
import { postgresConnection } from "../../src/postgres";
import {
  SEEDED_BUTTON_ID,
  SEEDED_BUTTON_NAME,
  SEEDED_BUTTON_TEST_ID,
  SEEDED_APP_NAME,
  SEEDED_BUTTON_TEXT,
  SEEDED_QUERY_ID,
  adminOfApiUser,
  grantApp,
  joinWorkspace,
  seedPrivateApp,
  type Actor,
  type ApiUserAsOwner,
  type SeededApp,
} from "../../src/security/actors";
import { expectAnswer, expectDeniedAs } from "../../src/security/assertions";
import { permissionIdOf } from "../../src/security/scene";
import { securityTestDetails } from "../../src/security/quarantine";

/**
 * Cross-workspace access: A (the `apiUser`, admin of workspace OA) owns a private app, its datasource and the
 * workspace; B (an actor with its own workspace OB, never invited to OA) is given the victim's ids, as if they had leaked.
 * Every denial asserts status and code, then A reads the resource back with A's own session and finds it unchanged.
 */

/** What B tries to write; none of it may ever show up on A's side. */
const RENAMED_APP = "e2e-sec-renamed-by-outsider";
const RENAMED_DATASOURCE = "e2e-sec-ds-renamed-by-outsider";
const RENAMED_ORG = "e2e-sec-org-renamed-by-outsider";
const EVIL_HOST = "e2e-evil-host.example.test";
const FOREIGN_SETTING_KEY = "e2e-sec-foreign-setting";
const FOREIGN_SETTING_VALUE = "e2e-sec-foreign-value";
const SECURITY_CORE = [TAGS.CORE];
const RENAMED_FOLDER = "e2e-sec-folder-renamed-by-outsider";
const FOLDER_NAME = "e2e-sec-folder";
const GROUP_NAME = "e2e-sec-group";
const LIBRARY_QUERY_NAME = "e2e-sec-library-query";
const OUTSIDER_VERSION_TAG = "9.9.9";
const OUTSIDER_SLUG = "e2e-sec-slug-by-outsider";
const OUTSIDER_PROFILE_NAME = "pwned";
const OUTSIDER_APP_NAME = "e2e-sec-app-of-outsider";
/** Content type of the slug routes, which take `@RequestBody String`. */
const PLAIN_TEXT = { "content-type": "text/plain" };
/** The two denials accepted for the folder rows whose desired code is not measurable on any image (C09, C11). */
const FOLDER_DENIALS = [API_ERRORS.FOLDER_OPERATE_NO_PERMISSION, API_ERRORS.NOT_AUTHORIZED];
/** The answer of an allowed call. */
const OK = { status: 200, code: API_OK } as const;
/** HTTP status of an allowed call, for an assertion that checks only the status, not the envelope code. */
const HTTP_OK = 200;
/** The profile photo A has before the outsider's delete: the 8x8 PNG of src/media.ts, as bytes. */
const PHOTO = { name: "photo.png", mimeType: "image/png", buffer: Buffer.from(PNG_RED.split(",")[1] ?? "", "base64") };

interface Scene {
  /** The victim: admin of OA. */
  a: ApiUserAsOwner;
  /** The attacker: admin of its own workspace OB, no member of OA. */
  b: Actor;
  /** A's private, published app, its datasource and its query. */
  seeded: SeededApp;
}

async function sceneOf(
  page: Page,
  apiUser: RegisteredUser,
  actor: (tag: string) => Promise<Actor>,
): Promise<Scene> {
  const a = await adminOfApiUser(page.request, apiUser);
  const b = await actor("attacker");
  const seeded = await seedPrivateApp(a);
  return { a, b, seeded };
}

/** The datasource as its owner reads it: the snapshot a denied change must leave as it was. */
async function datasourceOf(a: ApiUserAsOwner, datasourceId: string): Promise<string> {
  const answer = await apiRaw(a.request, "GET", datasourcePath(datasourceId));
  expectAnswer(answer, { status: 200, code: API_OK }, "the owner reads its datasource");
  return answer.body;
}

/** Name and role of the workspace in the current-user answer: what a denied org call must leave as it was. */
async function orgStateOf(a: ApiUserAsOwner): Promise<{ name: string | undefined; role: string | undefined }> {
  const entry = (await currentUser(a.request)).orgAndRoles.find((row) => row.org.id === a.orgId);
  return { name: entry?.org.name, role: entry?.role };
}

test.describe("security: another workspace's resources", () => {
  test("SEC-C01a another workspace's app cannot be opened for editing by id", securityTestDetails("SEC-C01a", SECURITY_CORE), async ({ page, apiUser, actor }) => {
    const { a, b, seeded } = await sceneOf(page, apiUser, actor);
    expectAnswer(await apiRaw(a.request, "GET", applicationPath(seeded.appId)), { status: 200, code: API_OK }, "before: the owner opens the editing view");

    const answer = await apiRaw(b.request, "GET", applicationPath(seeded.appId));

    expectAnswer(answer, API_ERRORS.NO_PERMISSION_TO_REQUEST_APP, "the outsider's editing view");
    expect(answer.body, "the denial carries no DSL").not.toContain(SEEDED_BUTTON_TEST_ID);
    expectAnswer(await apiRaw(a.request, "GET", applicationPath(seeded.appId)), { status: 200, code: API_OK }, "after: the owner still opens it");
  });

  test("SEC-C02a another workspace's app cannot be viewed by id", securityTestDetails("SEC-C02a", SECURITY_CORE), async ({ page, apiUser, actor }) => {
    const { a, b, seeded } = await sceneOf(page, apiUser, actor);
    expect(await viewAppRaw(a.request, seeded.appId), "before: the owner views the published app").toMatchObject({ status: 200, code: API_OK });

    const answer = await apiRaw(b.request, "GET", appViewPath(seeded.appId));

    expectAnswer(answer, API_ERRORS.NO_PERMISSION_TO_REQUEST_APP, "the outsider's published view");
    expect(answer.body, "the denial carries no DSL").not.toContain(SEEDED_BUTTON_TEST_ID);
  });

  test("SEC-C03 another workspace's app cannot be renamed or overwritten", securityTestDetails("SEC-C03", SECURITY_CORE), async ({ page, apiUser, actor }) => {
    const { a, b, seeded } = await sceneOf(page, apiUser, actor);
    const before = await getApp(a.request, seeded.appId);
    expect(before.name, "before: the seeded name").not.toBe(RENAMED_APP);

    const answer = await apiRaw(b.request, "PUT", applicationPath(seeded.appId), {
      data: { name: RENAMED_APP, editingApplicationDSL: {} },
    });

    expectAnswer(answer, API_ERRORS.NO_PERMISSION_TO_REQUEST_APP, "the outsider's update");
    const after = await getApp(a.request, seeded.appId);
    expect(after.name, "after: the name is unchanged").toBe(before.name);
    expect(JSON.stringify(after.dsl), "after: the DSL is unchanged").toBe(JSON.stringify(before.dsl));
  });

  test("SEC-C06 an outsider cannot grant itself a role on another workspace's app", securityTestDetails("SEC-C06", SECURITY_CORE), async ({ page, apiUser, actor }) => {
    const { a, b, seeded } = await sceneOf(page, apiUser, actor);
    const rowsOfB = async () => (await listAppPermissions(a.request, seeded.appId)).userPermissions.filter((row) => row.id === b.userId);
    expect(await rowsOfB(), "before: no row for the outsider").toHaveLength(0);

    const answer = await apiRaw(b.request, "PUT", appPermissionsPath(seeded.appId), {
      data: { role: APP_ROLES.OWNER, userIds: [b.userId], groupIds: [] },
    });

    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the outsider's self-grant");
    expect(await rowsOfB(), "after: still no row for the outsider").toHaveLength(0);
    expectAnswer(await apiRaw(b.request, "GET", applicationPath(seeded.appId)), API_ERRORS.NO_PERMISSION_TO_REQUEST_APP, "the outsider still cannot open the editing view");
  });

  test("SEC-C12a another workspace's datasource and its credentials cannot be read", securityTestDetails("SEC-C12a", SECURITY_CORE), async ({ page, apiUser, actor }) => {
    const { a, b, seeded } = await sceneOf(page, apiUser, actor);
    await datasourceOf(a, seeded.datasourceId);

    const answer = await apiRaw(b.request, "GET", datasourcePath(seeded.datasourceId));

    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the outsider reads the datasource");
    expect(answer.body, "no password in the denial").not.toContain(POSTGRES.PASSWORD);
    expect(answer.body, "no host in the denial").not.toContain(postgresConnection().host);
  });

  test("SEC-C12b another workspace's datasource cannot be changed, deleted or shared", securityTestDetails("SEC-C12b", SECURITY_CORE), async ({ page, apiUser, actor }) => {
    const { a, b, seeded } = await sceneOf(page, apiUser, actor);
    const before = await datasourceOf(a, seeded.datasourceId);

    const changed = await apiRaw(b.request, "PUT", datasourcePath(seeded.datasourceId), {
      data: {
        id: seeded.datasourceId,
        name: RENAMED_DATASOURCE,
        type: "postgres",
        organizationId: a.orgId,
        datasourceConfig: { ...postgresConnection(), host: EVIL_HOST, usingSsl: false, extParams: {} },
      },
    });
    const deleted = await apiRaw(b.request, "DELETE", datasourcePath(seeded.datasourceId));
    const shared = await apiRaw(b.request, "PUT", datasourcePermissionsPath(seeded.datasourceId), {
      data: { role: APP_ROLES.OWNER, userIds: [b.userId], groupIds: [] },
    });

    expectAnswer(changed, API_ERRORS.NOT_AUTHORIZED, "the outsider's update of the datasource");
    expectAnswer(deleted, API_ERRORS.NOT_AUTHORIZED, "the outsider's delete of the datasource");
    expectAnswer(shared, API_ERRORS.NOT_AUTHORIZED, "the outsider's grant on the datasource");
    expect(await datasourceOf(a, seeded.datasourceId), "after: the datasource is exactly as it was").toBe(before);
    expect(before, "the snapshot is not the attacker's change").not.toContain(EVIL_HOST);
  });

  test("SEC-C14a another workspace's app query cannot be run", securityTestDetails("SEC-C14a", SECURITY_CORE), async ({ page, apiUser, actor }) => {
    const { a, b, seeded } = await sceneOf(page, apiUser, actor);
    const params = { applicationId: seeded.appId, queryId: seeded.queryId, viewMode: true };
    const own = await executeAppQueryRaw(a.request, params);
    expectAnswer(own, { status: 200, code: API_OK }, "before: the owner runs its query");
    expect(own.body, "and gets the rows").toContain(PRODUCTS.FIRST_NAME);

    const answer = await executeAppQueryRaw(b.request, params);

    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the outsider runs the query");
    expect(answer.body, "no row in the denial").not.toContain(PRODUCTS.FIRST_NAME);
  });

  test("SEC-C16d another workspace's settings, roles, members and existence cannot be changed", securityTestDetails("SEC-C16d", SECURITY_CORE), async ({ page, apiUser, actor }) => {
    const { a, b } = await sceneOf(page, apiUser, actor);
    const before = await orgStateOf(a);
    const appList = new AppListPage(page);
    await appList.open();
    await expect(appList.appNamed(SEEDED_APP_NAME), "before: A's app list shows its app").toBeVisible();
    expect(before.role, "before: A administers its workspace").toBe(ORG_ROLES.ADMIN);
    const membersBefore = JSON.stringify(await listOrgMembers(a.request, a.orgId));

    const renamed = await apiRaw(b.request, "PUT", orgUpdatePath(a.orgId), { data: { orgName: RENAMED_ORG } });
    const demoted = await apiRaw(b.request, "PUT", orgRolePath(a.orgId), { data: { userId: a.userId, role: ORG_ROLES.MEMBER } });
    const removed = await apiRaw(b.request, "DELETE", orgRemoveMemberPath(a.orgId), { params: { userId: a.userId } });
    const settings = await apiRaw(b.request, "PUT", orgCommonSettingsPath(a.orgId), {
      data: { key: FOREIGN_SETTING_KEY, value: FOREIGN_SETTING_VALUE },
    });
    const deleted = await apiRaw(b.request, "DELETE", orgPath(a.orgId));

    expectAnswer(renamed, API_ERRORS.NOT_AUTHORIZED, "the outsider renames the workspace");
    expectAnswer(demoted, API_ERRORS.NOT_AUTHORIZED, "the outsider demotes the admin");
    expectAnswer(removed, API_ERRORS.NOT_AUTHORIZED, "the outsider removes the admin");
    expectAnswer(settings, API_ERRORS.NOT_AUTHORIZED, "the outsider writes a common setting");
    expectAnswer(deleted, API_ERRORS.NOT_AUTHORIZED, "the outsider deletes the workspace");
    expect(await orgStateOf(a), "after: name and role of A are unchanged").toEqual(before);
    expect(JSON.stringify(await listOrgMembers(a.request, a.orgId)), "after: the member list is unchanged").toBe(membersBefore);
    const settingsAfter = await apiRaw(a.request, "GET", orgCommonSettingsPath(a.orgId));
    expect(settingsAfter.body, "after: the foreign setting was not stored").not.toContain(FOREIGN_SETTING_KEY);
    await appList.open();
    await expect(appList.appNamed(SEEDED_APP_NAME), "after: A's /apps still opens and lists its app").toBeVisible();
  });
});

/** B owns an app of its own in OB (B is its owner), the base of the rows that go through B's own resource. */
async function appOfOutsider(b: Actor): Promise<string> {
  return (await createApp(b.request, { orgId: b.orgId, name: OUTSIDER_APP_NAME })).appId;
}

/** A third user of OA (member), who holds the grant a row is about. */
async function memberOfOrg(a: ApiUserAsOwner, actor: (tag: string) => Promise<Actor>, tag: string): Promise<Actor> {
  const member = await actor(tag);
  await joinWorkspace(a, member);
  return member;
}

/** A's root listing of folders and apps (`GET /api/folders/elements`): the folder name shows in it. */
async function rootListingOf(a: ApiUserAsOwner): Promise<string> {
  const answer = await apiRaw(a.request, "GET", API_PATHS.FOLDER_ELEMENTS);
  expectAnswer(answer, OK, "the owner lists its root");
  return answer.body;
}

test.describe("security: another workspace's resources (further rows)", () => {
  test("SEC-C01b another workspace's app cannot be opened for editing by its gid", securityTestDetails("SEC-C01b"), async ({ page, apiUser, actor }) => {
    const { a, b, seeded } = await sceneOf(page, apiUser, actor);
    expect(seeded.appGid, "setup: the create answer carries the app's gid").toBeTruthy();
    const gidPath = applicationPath(seeded.appGid ?? "");
    expectAnswer(await apiRaw(a.request, "GET", gidPath), OK, "before: the owner opens the app by its gid");

    const answer = await apiRaw(b.request, "GET", gidPath);

    expectAnswer(answer, API_ERRORS.NO_PERMISSION_TO_REQUEST_APP, "the outsider's editing view by gid");
    expect(answer.body, "the denial carries no DSL").not.toContain(SEEDED_BUTTON_TEST_ID);
  });

  test("SEC-C01c the editor shows an outsider an error page, not the app", securityTestDetails("SEC-C01c"), async ({ page, apiUser, actor }) => {
    const { b, seeded } = await sceneOf(page, apiUser, actor);
    expectAnswer(await apiRaw(b.request, "GET", applicationPath(seeded.appId)), API_ERRORS.NO_PERMISSION_TO_REQUEST_APP, "the outsider's editing view (API)");
    const bPage = b.session.page;
    const editingAnswer = bPage.waitForResponse(
      (response) => response.request().method() === "GET" && new URL(response.url()).pathname === applicationPath(seeded.appId),
    );

    await bPage.goto(APP_PAGE.EDIT(seeded.appId));

    const response = await editingAnswer;
    expect({ status: response.status(), code: ((await response.json()) as { code: number }).code }, "the page's own call").toEqual(API_ERRORS.NO_PERMISSION_TO_REQUEST_APP);
    const editor = new EditorPage(bPage);
    await expect(editor.notInWorkspaceMessage, "the editor's error page").toBeVisible();
    await expect(editor.canvas, "no canvas").toHaveCount(0);
    await expect(bPage.getByTestId(SEEDED_BUTTON_TEST_ID), "no app content").toHaveCount(0);
  });

  test("SEC-C02b the published view shows an outsider no app", securityTestDetails("SEC-C02b"), async ({ page, apiUser, actor }) => {
    const { b, seeded } = await sceneOf(page, apiUser, actor);
    const ownerView = new AppViewPage(page);
    await ownerView.open(seeded.appId);
    await expect(ownerView.buttonByTestId(SEEDED_BUTTON_TEST_ID), "control: the owner's view renders the app").toHaveText(SEEDED_BUTTON_TEXT);

    const outsiderView = new AppViewPage(b.session.page);
    await outsiderView.open(seeded.appId);

    await expect(outsiderView.notInWorkspaceMessage, "the outsider's denial message").toBeVisible();
    await expect(outsiderView.byTestId(SEEDED_BUTTON_TEST_ID), "no app content").toHaveCount(0);
  });

  test("SEC-C04 another workspace's app cannot be published", securityTestDetails("SEC-C04"), async ({ page, apiUser, actor }) => {
    const { a, b, seeded } = await sceneOf(page, apiUser, actor);
    const before = await listAppVersions(a.request, seeded.appId);
    expect(before, "before: the seeded publication is the only version").toHaveLength(1);

    const answer = await apiRaw(b.request, "POST", publishPath(seeded.appId), {
      data: { commitMessage: "e2e outsider", tag: OUTSIDER_VERSION_TAG },
    });

    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the outsider's publish");
    expect(await listAppVersions(a.request, seeded.appId), "after: still one version").toEqual(before);
  });

  test("SEC-C05 another workspace's app cannot be recycled or deleted", securityTestDetails("SEC-C05"), async ({ page, apiUser, actor }) => {
    const { a, b, seeded } = await sceneOf(page, apiUser, actor);
    const nameBefore = (await getApp(a.request, seeded.appId)).name;
    expect(await listAppNames(a.request), "before: the app is in the list").toContain(nameBefore);

    const recycled = await apiRaw(b.request, "PUT", recyclePath(seeded.appId));
    const deleted = await apiRaw(b.request, "DELETE", applicationPath(seeded.appId));

    expectAnswer(recycled, API_ERRORS.NO_PERMISSION_TO_REQUEST_APP, "the outsider recycles the app");
    expectAnswer(deleted, API_ERRORS.NO_PERMISSION_TO_REQUEST_APP, "the outsider deletes the app");
    expect(await listAppNames(a.request), "after: the app is still in the list").toContain(nameBefore);
    expect((await getApp(a.request, seeded.appId)).applicationStatus, "after: not recycled").toBe(APP_STATUS.NORMAL);
  });

  test("SEC-C07 an outsider cannot make another workspace's app public", securityTestDetails("SEC-C07"), async ({ page, apiUser, actor, newUserSession }) => {
    const { a, b, seeded } = await sceneOf(page, apiUser, actor);
    expect((await getApp(a.request, seeded.appId)).publicToAll, "before: the app is private").toBe(false);

    const answer = await apiRaw(b.request, "PUT", publicToAllPath(seeded.appId), { data: { publicToAll: true } });

    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the outsider's public-to-all");
    expect((await getApp(a.request, seeded.appId)).publicToAll, "after: still private").toBe(false);
    const visitor = await newUserSession();
    await new AppViewPage(visitor.page).openAsDeniedVisitor(seeded.appId);
    await expect(visitor.page.getByTestId(SEEDED_BUTTON_TEST_ID), "the anonymous visitor sees no app").toHaveCount(0);
  });

  test("SEC-C08 another workspace's app permission list cannot be read", securityTestDetails("SEC-C08"), async ({ page, apiUser, actor }) => {
    const { a, b, seeded } = await sceneOf(page, apiUser, actor);
    expect((await listAppPermissions(a.request, seeded.appId)).creatorId, "before: the owner reads the list").toBe(a.userId);

    const answer = await apiRaw(b.request, "GET", appPermissionsPath(seeded.appId));

    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the outsider reads the permission list");
    expect(answer.body, "no creator id in the denial").not.toContain(a.userId);
  });

  test("SEC-C09 another workspace's folder cannot be renamed", securityTestDetails("SEC-C09"), async ({ page, apiUser, actor }) => {
    const { a, b } = await sceneOf(page, apiUser, actor);
    const folderId = await createFolder(a.request, FOLDER_NAME);
    expect(await rootListingOf(a), "before: the folder has its name").toContain(FOLDER_NAME);

    const answer = await apiRaw(b.request, "PUT", API_PATHS.FOLDERS, { data: { id: folderId, name: RENAMED_FOLDER } });

    // Not narrowable on any available image: the 3.0.0 server lets the call through, so the desired code was never observed.
    // The first run against an updated server should replace this list with the one answer it gives.
    expectDeniedAs(answer, FOLDER_DENIALS, "the outsider's folder rename");
    const after = await rootListingOf(a);
    expect(after, "after: the name is unchanged").toContain(FOLDER_NAME);
    expect(after, "after: the outsider's name was not stored").not.toContain(RENAMED_FOLDER);
  });

  test("SEC-C10 another workspace's folder permission list cannot be read", securityTestDetails("SEC-C10"), async ({ page, apiUser, actor }) => {
    const { a, b } = await sceneOf(page, apiUser, actor);
    const folderId = await createFolder(a.request, FOLDER_NAME);
    expect((await listFolderPermissions(a.request, folderId)).creatorId, "before: the owner reads the list").toBe(a.userId);

    const answer = await apiRaw(b.request, "GET", folderPermissionsPath(folderId));

    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the outsider reads the folder's permission list");
    expect(answer.body, "no creator id in the denial").not.toContain(a.userId);
  });

  test("SEC-C11 an outsider cannot grant itself a role on another workspace's folder", securityTestDetails("SEC-C11"), async ({ page, apiUser, actor }) => {
    const { a, b } = await sceneOf(page, apiUser, actor);
    const folderId = await createFolder(a.request, FOLDER_NAME);
    const rowsOfB = async () => (await listFolderPermissions(a.request, folderId)).userPermissions.filter((row) => row.id === b.userId);
    expect(await rowsOfB(), "before: no row for the outsider").toHaveLength(0);

    const answer = await apiRaw(b.request, "POST", folderPermissionsPath(folderId), {
      data: { role: APP_ROLES.OWNER, userIds: [b.userId], groupIds: [] },
    });

    // Not narrowable on any available image: the 3.0.0 server lets the call through, so the desired code was never observed.
    // The first run against an updated server should replace this list with the one answer it gives.
    expectDeniedAs(answer, FOLDER_DENIALS, "the outsider's folder self-grant");
    expect(await rowsOfB(), "after: still no row for the outsider").toHaveLength(0);
  });

  test("SEC-C13 another workspace's datasource structure cannot be read", securityTestDetails("SEC-C13"), async ({ page, apiUser, actor }) => {
    const { a, b, seeded } = await sceneOf(page, apiUser, actor);
    const params = { ignoreCache: true };
    expectAnswer(await apiRaw(a.request, "GET", datasourceStructurePath(seeded.datasourceId), { params }), OK, "before: the owner reads the structure");

    const answer = await apiRaw(b.request, "GET", datasourceStructurePath(seeded.datasourceId), { params });

    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the outsider reads the structure");
    expect(answer.body, "no table name in the denial").not.toContain("products");
  });

  test("SEC-C14b an outsider's own app cannot run a query on another workspace's datasource", securityTestDetails("SEC-C14b"), async ({ page, apiUser, actor }) => {
    const { b, seeded } = await sceneOf(page, apiUser, actor);
    const query = selectProductsQuery(seeded.datasourceId, SEEDED_QUERY_ID);
    const dsl = appDsl([button({ id: SEEDED_BUTTON_ID, name: SEEDED_BUTTON_NAME, text: SEEDED_BUTTON_TEXT, testId: SEEDED_BUTTON_TEST_ID })], { queries: [query] });
    const { appId } = await createApp(b.request, { orgId: b.orgId, name: OUTSIDER_APP_NAME, dsl });

    const answer = await executeAppQueryRaw(b.request, { applicationId: appId, queryId: SEEDED_QUERY_ID, viewMode: false });

    expectAnswer(answer, API_ERRORS.DATASOURCE_AND_APP_ORG_NOT_MATCH, "the outsider runs a query on A's datasource");
    expect(answer.body, "no row in the denial").not.toContain(PRODUCTS.FIRST_NAME);
  });

  test("SEC-C15 another workspace's library query cannot be read", securityTestDetails("SEC-C15"), async ({ page, apiUser, actor }) => {
    const { a, b } = await sceneOf(page, apiUser, actor);
    const libraryQueryId = await createLibraryQuery(a.request, { orgId: a.orgId, name: LIBRARY_QUERY_NAME, query: { sql: "select 1" } });
    const own = await apiRaw(a.request, "GET", libraryQueryPath(libraryQueryId));
    expectAnswer(own, OK, "before: the owner reads its library query");
    expect(own.body, "and gets it").toContain(LIBRARY_QUERY_NAME);

    const answer = await apiRaw(b.request, "GET", libraryQueryPath(libraryQueryId));

    expectAnswer(answer, API_ERRORS.LIBRARY_QUERY_AND_ORG_NOT_MATCH, "the outsider reads the library query");
    expect(answer.body, "no query in the denial").not.toContain(LIBRARY_QUERY_NAME);
  });

  test("SEC-C16a another workspace's member list and settings cannot be read", securityTestDetails("SEC-C16a"), async ({ page, apiUser, actor }) => {
    const { a, b } = await sceneOf(page, apiUser, actor);
    expectAnswer(await apiRaw(a.request, "GET", orgMembersPath(a.orgId)), OK, "before: the owner reads the members");
    expectAnswer(await apiRaw(a.request, "GET", orgCommonSettingsPath(a.orgId)), OK, "before: the owner reads the settings");

    const members = await apiRaw(b.request, "GET", orgMembersPath(a.orgId));
    const settings = await apiRaw(b.request, "GET", orgCommonSettingsPath(a.orgId));

    expectAnswer(members, API_ERRORS.NOT_AUTHORIZED, "the outsider reads the members");
    expectAnswer(settings, API_ERRORS.NOT_AUTHORIZED, "the outsider reads the settings");
    expect(members.body, "no member in the denial").not.toContain(a.userId);
  });

  test("SEC-C16b another workspace's slug cannot be changed", securityTestDetails("SEC-C16b"), async ({ page, apiUser, actor }) => {
    const { a, b } = await sceneOf(page, apiUser, actor);
    expect((await apiRaw(a.request, "GET", orgPath(a.orgId))).body, "before: no such slug").not.toContain(OUTSIDER_SLUG);

    const answer = await apiRaw(b.request, "PUT", orgSlugPath(a.orgId), { data: OUTSIDER_SLUG, headers: PLAIN_TEXT });

    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the outsider's slug change");
    expect((await apiRaw(a.request, "GET", orgPath(a.orgId))).body, "after: the slug was not stored").not.toContain(OUTSIDER_SLUG);
  });

  test("SEC-C16c another workspace's details cannot be read", securityTestDetails("SEC-C16c"), async ({ page, apiUser, actor }) => {
    const { a, b } = await sceneOf(page, apiUser, actor);
    expectAnswer(await apiRaw(a.request, "GET", orgPath(a.orgId)), OK, "before: the owner reads its workspace");

    const answer = await apiRaw(b.request, "GET", orgPath(a.orgId));

    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the outsider reads the workspace");
    expect(answer.body, "no workspace id in the denial").not.toContain(a.orgId);
  });

  test("SEC-C16e an outsider cannot switch into another workspace", securityTestDetails("SEC-C16e"), async ({ page, apiUser, actor }) => {
    const { a, b } = await sceneOf(page, apiUser, actor);
    await createApp(b.request, { orgId: b.orgId, name: OUTSIDER_APP_NAME });
    expect((await currentUser(b.request)).currentOrgId, "before: B's current workspace is its own").toBe(b.orgId);
    const outsiderList = new AppListPage(b.session.page);
    await outsiderList.open();
    await expect(outsiderList.appNamed(OUTSIDER_APP_NAME), "before: B's /apps lists the app of OB").toBeVisible();

    const answer = await apiRaw(b.request, "PUT", switchOrgPath(a.orgId));

    // Measured on the 3.0.0 image: 500 / 5100 (INVALID_ORG_ID). HEAD is expected to answer 401 / 5001 (OrganizationController
    // converts the id, then checks membership: NEW-132). Both are refusals and nothing else is accepted;
    // the first run against an updated server should narrow this to the one code it answers.
    expectDeniedAs(answer, [API_ERRORS.INVALID_ORG_ID, API_ERRORS.NOT_AUTHORIZED], "the outsider's switch");
    expect((await currentUser(b.request)).currentOrgId, "after: B's current workspace is still its own").toBe(b.orgId);
    await outsiderList.open();
    await expect(outsiderList.appNamed(OUTSIDER_APP_NAME), "after: B's /apps still lists the app of OB").toBeVisible();
  });

  test("SEC-C16f another workspace's app slug cannot be changed", securityTestDetails("SEC-C16f"), async ({ page, apiUser, actor }) => {
    const { a, b, seeded } = await sceneOf(page, apiUser, actor);
    expect((await apiRaw(a.request, "GET", applicationPath(seeded.appId))).body, "before: no such slug").not.toContain(OUTSIDER_SLUG);

    const answer = await apiRaw(b.request, "PUT", appSlugPath(seeded.appId), { data: OUTSIDER_SLUG, headers: PLAIN_TEXT });

    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the outsider's app slug change");
    // Limit: no app view carries the slug and the slug write is not reached today (D-37), so this read cannot show a stored slug; the denial above is the proof.
    expect((await apiRaw(a.request, "GET", applicationPath(seeded.appId))).body, "after: the slug was not stored").not.toContain(OUTSIDER_SLUG);
  });

  /** A well-formed object id that names no application; no hyphen, so the lookup tries it as an object id, then as a slug. */
  const UNKNOWN_APP_ID = "000000000000000000000000";
  /** The slug an editor is allowed to set, as the positive control of SEC-C16f. */
  const EDITOR_SLUG = "e2e-sec-slug-by-editor";

  test("SEC-C16g+ the app's editor is not refused by the slug route", securityTestDetails("SEC-C16g+"), async ({ page, apiUser, actor }) => {
    const { a, b, seeded } = await sceneOf(page, apiUser, actor);
    await joinWorkspace(a, b);
    await grantApp(a, seeded.appId, b, APP_ROLES.EDITOR);
    expectAnswer(await apiRaw(b.request, "GET", applicationPath(seeded.appId)), OK, "precondition: B edits the app");

    const answer = await apiRaw(b.request, "PUT", appSlugPath(seeded.appId), { data: EDITOR_SLUG, headers: PLAIN_TEXT });

    // The body is not asserted: it is empty today because the write is not reached (D-37, the slug-exists query
    // completes empty for a fresh slug) and would carry the app once that query is repaired.
    expect(answer.status, "the editor's slug change is not refused").toBe(HTTP_OK);
    expect(answer.code, "not the denial").not.toBe(API_ERRORS.NOT_AUTHORIZED.code);
  });

  test("SEC-C16h the app slug route answers NO_RESOURCE_FOUND for an id that names no app", securityTestDetails("SEC-C16h"), async ({ page, apiUser, actor }) => {
    const { b } = await sceneOf(page, apiUser, actor);

    const answer = await apiRaw(b.request, "PUT", appSlugPath(UNKNOWN_APP_ID), { data: OUTSIDER_SLUG, headers: PLAIN_TEXT });

    expectAnswer(answer, API_ERRORS.NO_RESOURCE_FOUND, "the slug change of an unknown app");
  });

  test("SEC-C17a an outsider cannot create an invitation to another workspace", securityTestDetails("SEC-C17a"), async ({ page, apiUser, actor }) => {
    const { a, b } = await sceneOf(page, apiUser, actor);

    const answer = await apiRaw(b.request, "POST", API_PATHS.INVITATION, { params: { orgId: a.orgId } });

    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the outsider's invitation to OA");
    expect(answer.body, "no invitation code in the denial").not.toContain("inviteCode");
  });

  test("SEC-C17b an invitation of a removed member does not let an outsider in", securityTestDetails("SEC-C17b"), async ({ page, apiUser, actor }) => {
    const { a, b } = await sceneOf(page, apiUser, actor);
    const leaver = await memberOfOrg(a, actor, "leaver");
    const invite = await apiRaw(leaver.request, "POST", API_PATHS.INVITATION, { params: { orgId: a.orgId } });
    expectAnswer(invite, OK, "setup: the member of OA creates an invitation");
    const inviteCode = (invite.json as { data: { inviteCode: string } }).data.inviteCode;
    await removeOrgMember(a.request, a.orgId, leaver.userId);
    expect((await listOrgMembers(a.request, a.orgId)).map((member) => member.userId), "setup: the creator is no longer a member").not.toContain(leaver.userId);

    const answer = await apiRaw(b.request, "GET", invitationAcceptPath(inviteCode));

    expectAnswer(answer, API_ERRORS.INVALID_INVITATION_CODE, "the outsider accepts the removed member's invitation");
    expectAnswer(await apiRaw(b.request, "GET", orgMembersPath(a.orgId)), API_ERRORS.NOT_AUTHORIZED, "B is not a member of OA");
  });

  test("SEC-C17c signing in through another workspace's login does not make an outsider a member", securityTestDetails("SEC-C17c"), async ({ page, apiUser, actor }) => {
    const { a, b } = await sceneOf(page, apiUser, actor);
    expectAnswer(await apiRaw(b.request, "GET", orgMembersPath(a.orgId)), API_ERRORS.NOT_AUTHORIZED, "before: B is no member of OA");

    const login = await apiRaw(b.request, "POST", API_PATHS.LOGIN, {
      params: { orgId: a.orgId },
      data: { loginId: b.email, password: TEST_PASSWORD, register: false, source: AUTH_SOURCE_EMAIL, authId: AUTH_ID_EMAIL },
    });

    // The sign-in itself must succeed (valid credentials), or the denial below would hold for an unrelated failure.
    // Limit: whether B is thereby in OA is exactly what the last assertion decides, so it is not asserted before.
    expectAnswer(login, OK, "B's sign-in through the workspace login of OA");
    expectAnswer(await apiRaw(b.request, "GET", orgMembersPath(a.orgId)), API_ERRORS.NOT_AUTHORIZED, "after: B still reads no member list of OA");
  });

  test("SEC-C17c UI variant: a signed-out outsider who signs in on another workspace's page is not shown that workspace", securityTestDetails("SEC-C17c"), async ({ page, apiUser, actor, newUserSession }) => {
    const { a, b, seeded } = await sceneOf(page, apiUser, actor);
    await createApp(b.request, { orgId: b.orgId, name: OUTSIDER_APP_NAME });
    const outsiderList = new AppListPage(b.session.page);
    await outsiderList.open();
    await expect(outsiderList.appNamed(OUTSIDER_APP_NAME), "before: B's /apps lists the app of OB").toBeVisible();
    await expect(outsiderList.appNamed(SEEDED_APP_NAME), "before: B's /apps does not list OA's app").toHaveCount(0);
    const visitor = await newUserSession();
    await new AppViewPage(visitor.page).openAsDeniedVisitor(seeded.appId);
    const login = new LoginPage(visitor.page);

    await login.signInOnWorkspacePage(b.email, TEST_PASSWORD);

    await expect(visitor.page, "the sign-in on the workspace page succeeded").not.toHaveURL(UI_PATHS.LOGIN);
    await expect(visitor.page, "and left the workspace sign-in").not.toHaveURL(UI_PATHS.LOGIN_IN_ORG);
    const list = new AppListPage(visitor.page);
    await list.open();
    // The list is awaited through B's own OB app first, so the absence below is not read during page load.
    await expect(list.appNamed(OUTSIDER_APP_NAME), "after: B's /apps still lists the app of OB").toBeVisible();
    await expect(list.appNamed(SEEDED_APP_NAME), "after: B's /apps does not list OA's app").toHaveCount(0);
    expect(await listOrgMembers(a.request, a.orgId).then((members) => members.map((member) => member.userId)), "B is no member of OA").not.toContain(b.userId);
  });

  test("SEC-C18a another workspace's group members cannot be listed", securityTestDetails("SEC-C18a"), async ({ page, apiUser, actor }) => {
    const { a, b } = await sceneOf(page, apiUser, actor);
    const groupId = await createGroup(a.request, GROUP_NAME);
    expectAnswer(await apiRaw(a.request, "GET", groupMembersPath(groupId)), OK, "before: the owner lists the members");

    const answer = await apiRaw(b.request, "GET", groupMembersPath(groupId));

    expectAnswer(answer, API_ERRORS.INVALID_GROUP_ID, "the outsider lists the members");
    expect(answer.body, "no member in the denial").not.toContain(a.userId);
  });

  test("SEC-C18b another workspace's group's potential members cannot be listed", securityTestDetails("SEC-C18b"), async ({ page, apiUser, actor }) => {
    const { a, b } = await sceneOf(page, apiUser, actor);
    const groupId = await createGroup(a.request, GROUP_NAME);
    expectAnswer(await apiRaw(a.request, "GET", groupPotentialMembersPath(groupId)), OK, "before: the owner lists the candidates");

    const answer = await apiRaw(b.request, "GET", groupPotentialMembersPath(groupId));

    expectAnswer(answer, API_ERRORS.INVALID_GROUP_ID, "the outsider lists the candidates");
    expect(answer.body, "no member of OA in the denial").not.toContain(a.userId);
  });

  test("SEC-C18c an outsider cannot add itself to another workspace's group", securityTestDetails("SEC-C18c"), async ({ page, apiUser, actor }) => {
    const { a, b } = await sceneOf(page, apiUser, actor);
    const groupId = await createGroup(a.request, GROUP_NAME);
    const membersBefore = (await apiRaw(a.request, "GET", groupMembersPath(groupId))).body;
    expect(membersBefore, "before: B is not in the group").not.toContain(b.userId);

    const answer = await apiRaw(b.request, "POST", groupAddMemberPath(groupId), { data: { userId: b.userId, role: ORG_ROLES.ADMIN } });

    expectAnswer(answer, API_ERRORS.INVALID_GROUP_ID, "the outsider's add to the group");
    expect((await apiRaw(a.request, "GET", groupMembersPath(groupId))).body, "after: the members are unchanged").toBe(membersBefore);
  });

  test("SEC-C19a an outsider cannot rename a user of another workspace", securityTestDetails("SEC-C19a"), async ({ page, apiUser, actor }) => {
    const { a, b } = await sceneOf(page, apiUser, actor);
    const nameBefore = (await currentUser(a.request)).name;
    expect(nameBefore, "before: A has a name that is not the outsider's").not.toBe(OUTSIDER_PROFILE_NAME);

    const answer = await apiRaw(b.request, "PUT", userProfilePath(b.orgId, a.userId), { data: { name: OUTSIDER_PROFILE_NAME } });

    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the outsider's rename of A");
    expect((await currentUser(a.request)).name, "after: A's name is unchanged").toBe(nameBefore);
  });

  test("SEC-C19b an outsider cannot delete the photo of a user of another workspace", securityTestDetails("SEC-C19b"), async ({ page, apiUser, actor }) => {
    const { a, b } = await sceneOf(page, apiUser, actor);
    const withoutPhoto = await readProfilePhoto(a.request);
    await uploadProfilePhoto(a.request, PHOTO);
    const before = await readProfilePhoto(a.request);
    expect(before.bytes.length, "before: A has a photo").toBeGreaterThan(0);
    expect(before.bytes.equals(withoutPhoto.bytes), "before: it is not what A had without one").toBe(false);

    const answer = await apiRaw(b.request, "DELETE", userPhotoPath(b.orgId, a.userId));

    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the outsider's photo delete");
    const after = await readProfilePhoto(a.request);
    expect(after.bytes.equals(before.bytes), "after: A's photo is unchanged").toBe(true);
  });

  test("SEC-C20 another workspace's app versions cannot be listed", securityTestDetails("SEC-C20"), async ({ page, apiUser, actor }) => {
    const { a, b, seeded } = await sceneOf(page, apiUser, actor);
    expect(await listAppVersions(a.request, seeded.appId), "before: the owner lists one version").toHaveLength(1);

    const answer = await apiRaw(b.request, "GET", appRecordsByAppPath(), { params: { applicationId: seeded.appId } });

    expectAnswer(answer, API_ERRORS.APPLICATION_AND_ORG_NOT_MATCH, "the outsider lists the versions");
  });

  test("SEC-C21 another workspace's history snapshot cannot be read through an app of one's own", securityTestDetails("SEC-C21"), async ({ page, apiUser, actor }) => {
    const { a, b, seeded } = await sceneOf(page, apiUser, actor);
    await createSnapshot(a.request, seeded.appId, (await getApp(a.request, seeded.appId)).dsl as object);
    const snapshotId = (await listSnapshots(a.request, seeded.appId))[0]?.snapshotId;
    expect(snapshotId, "setup: A has a snapshot").toBeTruthy();
    const ownRead = await apiRaw(a.request, "GET", snapshotPath(seeded.appId, snapshotId ?? ""));
    expectAnswer(ownRead, OK, "before: the owner reads the snapshot through its own app");
    expect(ownRead.body, "before: the owner's answer carries A's DSL").toContain(SEEDED_BUTTON_TEST_ID);
    const appOfB = await appOfOutsider(b);

    const answer = await apiRaw(b.request, "GET", snapshotPath(appOfB, snapshotId ?? ""));

    // D-31: the snapshot of another app gets the answer of an unknown snapshot id (same status, code and message).
    expectAnswer(answer, API_ERRORS.INVALID_HISTORY_SNAPSHOT, "the outsider reads A's snapshot through B's app");
    expect(answer.body, "A's DSL is not in the answer").not.toContain(SEEDED_BUTTON_TEST_ID);
  });

  test("SEC-C22a an outsider cannot change or remove a grant on another workspace's app", securityTestDetails("SEC-C22a"), async ({ page, apiUser, actor }) => {
    const { a, b, seeded } = await sceneOf(page, apiUser, actor);
    const grantee = await memberOfOrg(a, actor, "grantee");
    await grantApp(a, seeded.appId, grantee, APP_ROLES.VIEWER);
    const rowOf = async () => (await listAppPermissions(a.request, seeded.appId)).userPermissions.find((row) => row.id === grantee.userId);
    const before = await rowOf();
    expect(before?.role, "before: the grantee is a viewer").toBe(APP_ROLES.VIEWER);
    const permissionId = permissionIdOf(before, "the grantee");

    const changed = await apiRaw(b.request, "PUT", appPermissionPath(seeded.appId, permissionId), { data: { role: APP_ROLES.OWNER } });
    const removed = await apiRaw(b.request, "DELETE", appPermissionPath(seeded.appId, permissionId));

    expectAnswer(changed, API_ERRORS.NOT_AUTHORIZED, "the outsider changes the grant");
    expectAnswer(removed, API_ERRORS.NOT_AUTHORIZED, "the outsider removes the grant");
    expect(await rowOf(), "after: the row is unchanged").toEqual(before);
  });

  test("SEC-C22b an outsider cannot reach another app's grant through its own app", securityTestDetails("SEC-C22b"), async ({ page, apiUser, actor }) => {
    const { a, b, seeded } = await sceneOf(page, apiUser, actor);
    const grantee = await memberOfOrg(a, actor, "grantee");
    await grantApp(a, seeded.appId, grantee, APP_ROLES.VIEWER);
    const rowOf = async () => (await listAppPermissions(a.request, seeded.appId)).userPermissions.find((row) => row.id === grantee.userId);
    const before = await rowOf();
    expect(before?.role, "before: the grantee is a viewer").toBe(APP_ROLES.VIEWER);
    const appOfB = await appOfOutsider(b);
    const permissionId = permissionIdOf(before, "the grantee");

    const changed = await apiRaw(b.request, "PUT", appPermissionPath(appOfB, permissionId), { data: { role: APP_ROLES.OWNER } });
    const removed = await apiRaw(b.request, "DELETE", appPermissionPath(appOfB, permissionId));

    expectAnswer(changed, API_ERRORS.ILLEGAL_APPLICATION_PERMISSION_ID, "the outsider changes A's row through B's app");
    expectAnswer(removed, API_ERRORS.ILLEGAL_APPLICATION_PERMISSION_ID, "the outsider removes A's row through B's app");
    expect(await rowOf(), "after: the row is unchanged").toEqual(before);
  });

  test("SEC-C22c an outsider cannot change or remove a grant on another workspace's datasource", securityTestDetails("SEC-C22c"), async ({ page, apiUser, actor }) => {
    const { a, b, seeded } = await sceneOf(page, apiUser, actor);
    const grantee = await memberOfOrg(a, actor, "grantee");
    await grantDatasourcePermission(a.request, seeded.datasourceId, { role: APP_ROLES.VIEWER, userIds: [grantee.userId] });
    const rowOf = async () => (await listDatasourcePermissions(a.request, seeded.datasourceId)).userPermissions.find((row) => row.id === grantee.userId);
    const before = await rowOf();
    expect(before?.role, "before: the grantee is a viewer").toBe(APP_ROLES.VIEWER);
    const permissionId = permissionIdOf(before, "the grantee");

    const changed = await apiRaw(b.request, "PUT", datasourcePermissionPath(permissionId), { data: { role: APP_ROLES.OWNER } });
    const removed = await apiRaw(b.request, "DELETE", datasourcePermissionPath(permissionId));

    expectAnswer(changed, API_ERRORS.NOT_AUTHORIZED, "the outsider changes the datasource grant");
    expectAnswer(removed, API_ERRORS.NOT_AUTHORIZED, "the outsider removes the datasource grant");
    expect(await rowOf(), "after: the row is unchanged").toEqual(before);
  });

  test("SEC-C22d an app's grant row id is not taken for a datasource grant", securityTestDetails("SEC-C22d"), async ({ page, apiUser, actor }) => {
    const { b } = await sceneOf(page, apiUser, actor);
    const appOfB = await appOfOutsider(b);
    const ownRow = (await listAppPermissions(b.request, appOfB)).userPermissions.find((row) => row.id === b.userId);
    expect(ownRow?.role, "before: B owns its app").toBe(APP_ROLES.OWNER);

    const answer = await apiRaw(b.request, "PUT", datasourcePermissionPath(permissionIdOf(ownRow, "B's own app grant")), { data: { role: APP_ROLES.VIEWER } });

    expectAnswer(answer, API_ERRORS.INTERNAL_SERVER_ERROR, "an app grant row used as a datasource grant");
    const after = (await listAppPermissions(b.request, appOfB)).userPermissions.find((row) => row.id === b.userId);
    expect(after, "after: the app grant row is unchanged").toEqual(ownRow);
  });

  test("SEC-C22e an outsider cannot change or remove a grant on another workspace's folder", securityTestDetails("SEC-C22e"), async ({ page, apiUser, actor }) => {
    const { a, b } = await sceneOf(page, apiUser, actor);
    const grantee = await memberOfOrg(a, actor, "grantee");
    const folderId = await createFolder(a.request, FOLDER_NAME);
    await grantFolderPermission(a.request, folderId, { role: APP_ROLES.VIEWER, userIds: [grantee.userId] });
    const rowOf = async () => (await listFolderPermissions(a.request, folderId)).userPermissions.find((row) => row.id === grantee.userId);
    const before = await rowOf();
    expect(before?.role, "before: the grantee is a viewer").toBe(APP_ROLES.VIEWER);
    const permissionId = permissionIdOf(before, "the grantee");

    const changed = await apiRaw(b.request, "PUT", folderPermissionPath(folderId, permissionId), { data: { role: APP_ROLES.OWNER } });
    const removed = await apiRaw(b.request, "DELETE", folderPermissionPath(folderId, permissionId));

    expectAnswer(changed, API_ERRORS.FOLDER_OPERATE_NO_PERMISSION, "the outsider changes the folder grant");
    expectAnswer(removed, API_ERRORS.FOLDER_OPERATE_NO_PERMISSION, "the outsider removes the folder grant");
    expect(await rowOf(), "after: the row is unchanged").toEqual(before);
  });
});
