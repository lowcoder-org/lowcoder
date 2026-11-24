import { randomUUID } from "node:crypto";
import {
  apiRaw,
  createApp,
  createPostgresDatasource,
  currentUser,
  currentUserId,
  executeAppQueryRaw,
  getApp,
  grantDatasourcePermission,
  listAppNames,
  listAppPermissions,
  listAppVersions,
  listDatasourcePermissions,
  listGroups,
  listOrgMembers,
  listRecycledApps,
  recycleApp,
  seedOAuthConfig,
  setPublicToAll,
  switchOrganization,
  viewAppRaw,
} from "../../src/api/client";
import {
  API_ERRORS,
  API_OK,
  API_PATHS,
  APP_PAGE,
  APP_ROLES,
  APP_STATUS,
  APP_TYPE_APPLICATION,
  ORG_ROLES,
  POSTGRES,
  PRODUCTS,
  SECOND_VERSION_TAG,
  SETTING_PATHS,
  UI_PATHS,
  TAGS,
  appPermissionPath,
  appPermissionsPath,
  appViewPath,
  applicationPath,
  configPath,
  datasourcePath,
  datasourcePermissionPath,
  datasourcePermissionsPath,
  datasourcesByOrgPath,
  orgCommonSettingsPath,
  orgLeavePath,
  orgPath,
  orgRemoveMemberPath,
  orgRolePath,
  orgUpdatePath,
  publicToAllPath,
  publishPath,
  recyclePath,
  restorePath,
} from "../../src/constants";
import { appDsl, button } from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";
import { AppViewPage } from "../../src/pages/AppViewPage";
import { AppListPage } from "../../src/pages/AppListPage";
import { DatasourcePage } from "../../src/pages/DatasourcePage";
import { LoginPage } from "../../src/pages/LoginPage";
import { SettingPage } from "../../src/pages/SettingPage";
import { EditorPage } from "../../src/pages/EditorPage";
import { postgresConnection } from "../../src/postgres";
import { selectProductsQuery } from "../../src/datasource/notes-queries";
import {
  SEEDED_BUTTON_ID,
  SEEDED_BUTTON_NAME,
  SEEDED_BUTTON_TEST_ID,
  SEEDED_BUTTON_TEXT,
  SEEDED_APP_NAME,
  grantApp,
  joinWorkspace,
  makeAdmin,
  makeDeveloper,
  seedPrivateApp,
  type Actor,
  type ApiUserAsOwner,
} from "../../src/security/actors";
import { expectAnswer } from "../../src/security/assertions";
import { memberOf, permissionIdOf, roleOf, sceneOf } from "../../src/security/scene";
import { securityTestDetails } from "../../src/security/quarantine";

/**
 * Roles inside one workspace: A (the `apiUser`, admin of workspace OA) owns a private, published app; the other
 * actors join OA with exactly one extra right each (member M, viewer V, editor E, developer D) or none (anonymous N).
 * Each test builds its own workspace; nothing is shared. The call under test goes through `apiRaw`, then A reads the
 * resource back with its own session.
 */

const SECURITY_CORE = [TAGS.CORE];
/** Names and text the attackers try to write; they must never show up on A's side. */
const RENAMED_APP = "e2e-sec-renamed-by-member";
const HACKED_BUTTON_TEXT = "Hacked by a viewer";
const NEW_APP_BY_MEMBER = "e2e-sec-app-by-member";
const RENAMED_ORG = "e2e-sec-org-renamed-by-member";
const FOREIGN_SETTING_KEY = "e2e-sec-member-setting";
const FOREIGN_GROUP = "e2e-sec-group-by-member";
/** HTTP status of an allowed call. */
const ALLOWED = { status: 200, code: API_OK } as const;
/** `POST /api/datasources` answers 201 (measured); the other creates answer 200. */
const CREATED = { status: 201, code: API_OK } as const;

test.describe("security: roles inside one workspace", () => {
  test("SEC-R01b a member without a grant cannot change an app", securityTestDetails("SEC-R01b", SECURITY_CORE), async ({ page, apiUser, actor }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const m = await memberOf(a, actor, "member");
    expect(await roleOf(a, m.userId), "before: M is a member of OA, so the denial is not an outsider's").toBe(ORG_ROLES.MEMBER);
    const before = await getApp(a.request, seeded.appId);

    const answer = await apiRaw(m.request, "PUT", applicationPath(seeded.appId), { data: { name: RENAMED_APP } });

    expectAnswer(answer, API_ERRORS.NO_PERMISSION_TO_REQUEST_APP, "the member's rename");
    const after = await getApp(a.request, seeded.appId);
    expect(after.name, "after: the name is unchanged").toBe(before.name);
    expect(JSON.stringify(after.dsl), "after: the DSL is unchanged").toBe(JSON.stringify(before.dsl));
  });

  test("SEC-R02a a viewer who opens the edit URL gets no editor", securityTestDetails("SEC-R02a", SECURITY_CORE), async ({ page, apiUser, actor }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const v = await memberOf(a, actor, "viewer");
    await grantApp(a, seeded.appId, v, APP_ROLES.VIEWER);
    // Control: the locators below do find an editor when the user may open it (the owner's).
    const ownerEditor = new EditorPage(page);
    await ownerEditor.open(seeded.appId, { settleGrid: false });
    await expect(ownerEditor.readyMarker, "control: the owner's editor is ready").toHaveCount(1);
    await expect(ownerEditor.canvas, "control: the owner's editor has a canvas").toHaveCount(1);
    await expect(ownerEditor.permissionDeniedMessage, "control: the owner sees no denial").toHaveCount(0);
    const viewerPage = v.session.page;
    await new AppViewPage(viewerPage).open(seeded.appId);
    await expect(
      new AppViewPage(viewerPage).buttonByTestId(SEEDED_BUTTON_TEST_ID),
      "before: the viewer's published view shows the app",
    ).toHaveText(SEEDED_BUTTON_TEXT);

    const editingAnswer = viewerPage.waitForResponse(
      (response) => response.request().method() === "GET" && new URL(response.url()).pathname === applicationPath(seeded.appId),
    );
    await viewerPage.goto(APP_PAGE.EDIT(seeded.appId));
    const response = await editingAnswer;

    expect({ status: response.status(), code: ((await response.json()) as { code: number }).code }, "the page's own call").toEqual(
      API_ERRORS.NO_PERMISSION_TO_REQUEST_APP,
    );
    const viewerEditor = new EditorPage(viewerPage);
    await expect(viewerEditor.permissionDeniedMessage, "the editor's error page").toBeVisible();
    await expect(viewerEditor.canvas, "no canvas").toHaveCount(0);
    await expect(viewerEditor.readyMarker, "the editor never became ready").toHaveCount(0);
    await expect(viewerPage.getByTestId(SEEDED_BUTTON_TEST_ID), "no app content").toHaveCount(0);
  });

  test("SEC-R02b a viewer's autosave-shaped update is refused", securityTestDetails("SEC-R02b", SECURITY_CORE), async ({ page, apiUser, actor }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const v = await memberOf(a, actor, "viewer");
    await grantApp(a, seeded.appId, v, APP_ROLES.VIEWER);
    expect(await viewAppRaw(v.request, seeded.appId), "before: V holds the viewer right").toMatchObject(ALLOWED);
    const before = await getApp(a.request, seeded.appId);
    const hackedDsl = appDsl([button({ id: SEEDED_BUTTON_ID, name: SEEDED_BUTTON_NAME, text: HACKED_BUTTON_TEXT, testId: SEEDED_BUTTON_TEST_ID })]);
    expect(JSON.stringify(hackedDsl), "the forged DSL differs from the seeded one").not.toBe(JSON.stringify(before.dsl));

    const answer = await apiRaw(v.request, "PUT", applicationPath(seeded.appId), {
      data: { name: before.name, editingApplicationDSL: hackedDsl },
    });

    expectAnswer(answer, API_ERRORS.NO_PERMISSION_TO_REQUEST_APP, "the viewer's update");
    const after = await getApp(a.request, seeded.appId);
    expect(JSON.stringify(after.dsl), "after: the DSL is unchanged").toBe(JSON.stringify(before.dsl));
    expect(JSON.stringify(after.dsl), "and has no trace of the forged text").not.toContain(HACKED_BUTTON_TEXT);
  });

  test("SEC-R02c a viewer cannot promote itself through the permission API", securityTestDetails("SEC-R02c", SECURITY_CORE), async ({ page, apiUser, actor }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const v = await memberOf(a, actor, "viewer");
    await grantApp(a, seeded.appId, v, APP_ROLES.VIEWER);
    const roleOfV = async () => (await listAppPermissions(a.request, seeded.appId)).userPermissions.find((row) => row.id === v.userId)?.role;
    expect(await roleOfV(), "before: V is a viewer").toBe(APP_ROLES.VIEWER);

    const answer = await apiRaw(v.request, "PUT", appPermissionsPath(seeded.appId), {
      data: { role: APP_ROLES.EDITOR, userIds: [v.userId], groupIds: [] },
    });

    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the viewer's self-promotion");
    expect(await roleOfV(), "after: V is still a viewer").toBe(APP_ROLES.VIEWER);
    expectAnswer(await apiRaw(v.request, "GET", applicationPath(seeded.appId)), API_ERRORS.NO_PERMISSION_TO_REQUEST_APP, "and still cannot open the editing view");
  });

  test("SEC-R03d an editor cannot recycle an app", securityTestDetails("SEC-R03d", SECURITY_CORE), async ({ page, apiUser, actor }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const e = await memberOf(a, actor, "editor");
    await grantApp(a, seeded.appId, e, APP_ROLES.EDITOR);
    expectAnswer(await apiRaw(e.request, "GET", applicationPath(seeded.appId)), ALLOWED, "before: E holds the editor right (opens the editing view)");
    const before = await getApp(a.request, seeded.appId);
    expect(before.applicationStatus, "before: the app is normal").toBe(APP_STATUS.NORMAL);

    const answer = await apiRaw(e.request, "PUT", recyclePath(seeded.appId));

    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the editor's recycle");
    expect((await getApp(a.request, seeded.appId)).applicationStatus, "after: the app is still normal").toBe(APP_STATUS.NORMAL);
    expect(await listAppNames(a.request), "and still listed").toContain(before.name);
  });

  test("SEC-R03e an editor can neither delete nor restore a recycled app", securityTestDetails("SEC-R03e", SECURITY_CORE), async ({ page, apiUser, actor }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const e = await memberOf(a, actor, "editor");
    await grantApp(a, seeded.appId, e, APP_ROLES.EDITOR);
    await recycleApp(a.request, seeded.appId);
    const trash = async () => (await listRecycledApps(a.request)).find((app) => app.applicationId === seeded.appId)?.applicationStatus;
    expect(await trash(), "before: the app is in the trash, so the state check passes and the role decides").toBe(APP_STATUS.RECYCLED);

    const deleted = await apiRaw(e.request, "DELETE", applicationPath(seeded.appId));
    const restored = await apiRaw(e.request, "PUT", restorePath(seeded.appId));

    expectAnswer(deleted, API_ERRORS.NOT_AUTHORIZED, "the editor's delete of a recycled app");
    expectAnswer(restored, API_ERRORS.NOT_AUTHORIZED, "the editor's restore of a recycled app");
    expect(await trash(), "after: the app is still in the trash").toBe(APP_STATUS.RECYCLED);
  });

  test("SEC-R06a a plain member cannot create apps", securityTestDetails("SEC-R06a", SECURITY_CORE), async ({ page, apiUser, actor }) => {
    const { a } = await sceneOf(page, apiUser);
    const m = await memberOf(a, actor, "member");
    const createAsMember = () =>
      apiRaw(m.request, "POST", API_PATHS.APPLICATIONS, {
        data: { orgId: a.orgId, name: NEW_APP_BY_MEMBER, applicationType: APP_TYPE_APPLICATION, editingApplicationDSL: {} },
      });
    expect(await listAppNames(a.request), "before: no such app").not.toContain(NEW_APP_BY_MEMBER);

    const denied = await createAsMember();

    expectAnswer(denied, API_ERRORS.NEED_DEV_TO_CREATE_RESOURCE, "the member's create");
    expect(await listAppNames(a.request), "after: nothing was created").not.toContain(NEW_APP_BY_MEMBER);
    // The same request succeeds once M is a developer: the denial came from the role, not from a broken request.
    await makeDeveloper(a, m);
    expectAnswer(await createAsMember(), ALLOWED, "control: the same create as a developer");
    expect(await listAppNames(a.request), "control: now the app exists").toContain(NEW_APP_BY_MEMBER);
  });

  test("SEC-R07a members and developers cannot administer the workspace", securityTestDetails("SEC-R07a", SECURITY_CORE), async ({ page, apiUser, actor }) => {
    const { a } = await sceneOf(page, apiUser);
    const m = await memberOf(a, actor, "member");
    const d = await memberOf(a, actor, "developer");
    await makeDeveloper(a, d);
    expectAnswer(
      await apiRaw(d.request, "POST", API_PATHS.APPLICATIONS, {
        data: { orgId: a.orgId, name: NEW_APP_BY_MEMBER, applicationType: APP_TYPE_APPLICATION, editingApplicationDSL: {} },
      }),
      ALLOWED,
      "control: D really is a developer (creates an app)",
    );
    const membersBefore = JSON.stringify(await listOrgMembers(a.request, a.orgId));
    const groupNamesBefore = (await listGroups(a.request)).map((group) => group.groupName);
    expect(groupNamesBefore, "before: no foreign group").not.toContain(FOREIGN_GROUP);

    for (const [label, actorUnderTest] of [["member", m], ["developer", d]] as const) {
      const renamed = await apiRaw(actorUnderTest.request, "PUT", orgUpdatePath(a.orgId), { data: { orgName: RENAMED_ORG } });
      const promoted = await apiRaw(actorUnderTest.request, "PUT", orgRolePath(a.orgId), {
        data: { userId: actorUnderTest.userId, role: ORG_ROLES.ADMIN },
      });
      const removed = await apiRaw(actorUnderTest.request, "DELETE", orgRemoveMemberPath(a.orgId), { params: { userId: a.userId } });
      const settings = await apiRaw(actorUnderTest.request, "PUT", orgCommonSettingsPath(a.orgId), {
        data: { key: FOREIGN_SETTING_KEY, value: label },
      });
      const group = await apiRaw(actorUnderTest.request, "POST", API_PATHS.GROUPS, { data: { name: FOREIGN_GROUP } });

      expectAnswer(renamed, API_ERRORS.NOT_AUTHORIZED, `the ${label}'s rename of the workspace`);
      expectAnswer(promoted, API_ERRORS.NOT_AUTHORIZED, `the ${label}'s self-promotion to admin`);
      expectAnswer(removed, API_ERRORS.NOT_AUTHORIZED, `the ${label}'s removal of the admin`);
      expectAnswer(settings, API_ERRORS.NOT_AUTHORIZED, `the ${label}'s common-settings write`);
      expectAnswer(group, API_ERRORS.NOT_AUTHORIZED, `the ${label}'s group creation`);
    }

    expect(JSON.stringify(await listOrgMembers(a.request, a.orgId)), "after: roles and members are unchanged").toBe(membersBefore);
    // The client gate (pages/setting/index.tsx:12-14): a plain member opening /setting is sent to the app list. The URL change is the
    // positive signal, the list the page it lands on.
    const memberPage = m.session.page;
    await new SettingPage(memberPage).open();
    await expect(memberPage, "M opening /setting is sent to /apps").toHaveURL(UI_PATHS.APP_LIST);
    await expect(new AppListPage(memberPage).nothingShared, "and sees its app list").toBeVisible();
    await expect(new SettingPage(memberPage).userAuthenticationEntry, "no settings sidebar").toHaveCount(0);
    expect(await roleOf(a, m.userId), "M is still a member").toBe(ORG_ROLES.MEMBER);
    expect(await roleOf(a, d.userId), "D is still a member").toBe(ORG_ROLES.MEMBER);
    expect((await listGroups(a.request)).map((group) => group.groupName), "after: no group was created").not.toContain(FOREIGN_GROUP);
    expect((await apiRaw(a.request, "GET", orgCommonSettingsPath(a.orgId))).body, "and no setting was stored").not.toContain(FOREIGN_SETTING_KEY);
  });

  test("SEC-R10b an anonymous visitor cannot view a private app", securityTestDetails("SEC-R10b", SECURITY_CORE), async ({ page, apiUser, newUserSession }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const visitor = await newUserSession();
    const anonymous = visitor.page.request;
    expectAnswer(await apiRaw(a.request, "GET", appViewPath(seeded.appId)), ALLOWED, "before: the owner views the published app");

    const answer = await apiRaw(anonymous, "GET", appViewPath(seeded.appId));

    expectAnswer(answer, API_ERRORS.USER_NOT_SIGNED_IN, "the anonymous published view");
    expect(answer.body, "the denial carries no DSL").not.toContain(SEEDED_BUTTON_TEST_ID);
    await new AppViewPage(visitor.page).openAsDeniedVisitor(seeded.appId);
    await expect(visitor.page, "the browser visitor lands on the sign-in page of the app's workspace").toHaveURL(UI_PATHS.LOGIN_IN_ORG);
    await expect(new LoginPage(visitor.page).emailInput, "which asks for an e-mail").toBeVisible();
    await expect(visitor.page.getByTestId(SEEDED_BUTTON_TEST_ID), "and shows no app").toHaveCount(0);
  });

  test("SEC-R10c an anonymous visitor cannot run a private app's queries", securityTestDetails("SEC-R10c", SECURITY_CORE), async ({ page, apiUser, newUserSession }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const anonymous = (await newUserSession()).page.request;
    const params = { applicationId: seeded.appId, queryId: seeded.queryId, viewMode: true };
    const own = await executeAppQueryRaw(a.request, params);
    expectAnswer(own, ALLOWED, "before: the owner runs the query");
    expect(own.body, "and gets the rows").toContain(PRODUCTS.FIRST_NAME);

    const answer = await executeAppQueryRaw(anonymous, params);

    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the anonymous query run");
    expect(answer.body, "no row in the denial").not.toContain(PRODUCTS.FIRST_NAME);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// Further rows (R01 to R10): the rest of the roles inside one workspace
// ---------------------------------------------------------------------------------------------------------------

/** The `applicationRecordId` that names the live (current) record (domain/application/model/ApplicationCombineId.java). */
const LIVE_RECORD_ID = "latest";
const OWN_DATASOURCE = "e2e-sec-ds-of-editor";
const QUERY_OF_EDITOR = "q-e";
const EDITED_BUTTON_TEXT = "Edited by an editor";
const SECOND_APP = "e2e-sec-second-app";
const FOREIGN_DATASOURCE = "e2e-sec-ds-by-member";
const FOREIGN_FOLDER = "e2e-sec-folder-by-member";
const FOREIGN_LIBRARY_QUERY = "e2e-sec-library-query-by-member";
const APP_OF_MEMBER = "e2e-sec-app-m";
const APP_OF_DEVELOPER = "e2e-sec-app-d";
const RENAMED_BY_ADMIN = "e2e-sec-app-d-renamed-by-admin";
const QUERY_ON_FOREIGN_DATASOURCE = "q-m";
const API_KEY_NAME = "e2e-sec-member-key";
const OAUTH_SECRET_PREFIX = "e2e-sec-oauth-secret-";
const SERVER_CONFIG_VALUE = "e2e-sec-config-value";
/** The anonymous user the server answers `GET /api/users/me` with (measured: `anonymous: true`, no id, no workspaces). */
const ANONYMOUS_USER = { anonymous: true, id: null, orgAndRoles: null } as const;

/** Reads the live or a named record of an app's DSL (`GET /api/application-records`), one spec only (D-32 rows). */
function readRecord(request: Actor["request"], appId: string, recordId: string) {
  return apiRaw(request, "GET", API_PATHS.APPLICATION_RECORDS, { params: { applicationId: appId, applicationRecordId: recordId } });
}

/** The DSL of the seeded app with a different button text and, optionally, queries: what an edit sends. */
function editedDsl(text: string, queries: object[] = []): object {
  return appDsl([button({ id: SEEDED_BUTTON_ID, name: SEEDED_BUTTON_NAME, text, testId: SEEDED_BUTTON_TEST_ID })], { queries });
}

/** The three creates (app, folder, library query) and the data source create that need the developer role, as raw answers. */
async function createAsActor(actorUnderTest: Actor, orgId: string, suffix: string) {
  return {
    app: await apiRaw(actorUnderTest.request, "POST", API_PATHS.APPLICATIONS, {
      data: { orgId, name: `${NEW_APP_BY_MEMBER}-${suffix}`, applicationType: APP_TYPE_APPLICATION, editingApplicationDSL: {} },
    }),
    datasource: await apiRaw(actorUnderTest.request, "POST", API_PATHS.DATASOURCES, {
      data: {
        name: `${FOREIGN_DATASOURCE}-${suffix}`,
        type: "postgres",
        organizationId: orgId,
        datasourceConfig: { ...postgresConnection(), usingSsl: false, extParams: {} },
      },
    }),
    folder: await apiRaw(actorUnderTest.request, "POST", API_PATHS.FOLDERS, { data: { name: `${FOREIGN_FOLDER}-${suffix}` } }),
    libraryQuery: await apiRaw(actorUnderTest.request, "POST", API_PATHS.LIBRARY_QUERIES, {
      data: { organizationId: orgId, name: `${FOREIGN_LIBRARY_QUERY}-${suffix}`, libraryQueryDSL: { sql: "select 1" } },
    }),
  };
}

test.describe("security: roles inside one workspace (further rows)", () => {
  test("SEC-R01a a member without a grant does not see the app in its list", securityTestDetails("SEC-R01a"), async ({ page, apiUser, actor }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const m = await memberOf(a, actor, "member");
    expect(await listAppNames(a.request), "before: the owner's list has the app").toContain(SEEDED_APP_NAME);

    const answer = await apiRaw(m.request, "GET", API_PATHS.APPLICATION_LIST, { params: { applicationType: APP_TYPE_APPLICATION } });

    expectAnswer(answer, ALLOWED, "the member's app list");
    expect(answer.body, "the app is absent by id").not.toContain(seeded.appId);
    expect(answer.body, "and by name").not.toContain(SEEDED_APP_NAME);
    const list = new AppListPage(m.session.page);
    await list.open();
    await expect(list.nothingShared, "the member's /apps says nothing is shared").toBeVisible();
    await expect(list.appNamed(SEEDED_APP_NAME), "no card of the app").toHaveCount(0);
    await expect(list.newButton, "and the member has no New button (the gate exists in the client, R06a holds the server side)").toHaveCount(0);
  });

  test("SEC-R01c a member without a grant cannot run the app's query", securityTestDetails("SEC-R01c"), async ({ page, apiUser, actor }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const m = await memberOf(a, actor, "member");
    const params = { applicationId: seeded.appId, queryId: seeded.queryId, viewMode: true };
    const own = await executeAppQueryRaw(a.request, params);
    expectAnswer(own, ALLOWED, "before: the owner runs the query");
    expect(own.body, "and gets the rows").toContain(PRODUCTS.FIRST_NAME);

    const answer = await executeAppQueryRaw(m.request, params);

    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the member's query run");
    expect(answer.body, "no row in the denial").not.toContain(PRODUCTS.FIRST_NAME);
  });

  test("SEC-R01d a member without a grant cannot read the live record of the app", securityTestDetails("SEC-R01d"), async ({ page, apiUser, actor }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const m = await memberOf(a, actor, "member");
    const own = await readRecord(a.request, seeded.appId, LIVE_RECORD_ID);
    expectAnswer(own, ALLOWED, "before: the owner reads the live record");
    expect(own.body, "and it holds the app's DSL").toContain(SEEDED_BUTTON_TEST_ID);

    const answer = await readRecord(m.request, seeded.appId, LIVE_RECORD_ID);

    // D-32: the route needs EDIT on the app since the fix.
    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the member's read of the live record");
    expect(answer.body, "no DSL in the answer").not.toContain(SEEDED_BUTTON_TEST_ID);
  });

  test("SEC-R01e a viewer opens the published app but cannot read its live or a named record", securityTestDetails("SEC-R01e"), async ({ page, apiUser, actor }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const v = await memberOf(a, actor, "viewer");
    await grantApp(a, seeded.appId, v, APP_ROLES.VIEWER);
    const versionId = (await listAppVersions(a.request, seeded.appId))[0]?.id;
    expect(versionId, "setup: the seeded app has a published version").toBeTruthy();

    const ownLive = await readRecord(a.request, seeded.appId, LIVE_RECORD_ID);
    expectAnswer(ownLive, ALLOWED, "before: the owner reads the live record");
    expect(ownLive.body, "and it holds the app's DSL").toContain(SEEDED_BUTTON_TEST_ID);
    const ownNamed = await readRecord(a.request, seeded.appId, versionId as string);
    expectAnswer(ownNamed, ALLOWED, "before: the owner reads the named record");
    expect(ownNamed.body, "and it holds the app's DSL").toContain(SEEDED_BUTTON_TEST_ID);

    const viewAnswer = await apiRaw(v.request, "GET", appViewPath(seeded.appId));
    expectAnswer(viewAnswer, ALLOWED, "the viewer's published view (the legitimate view, unaffected by D-32)");
    expect(viewAnswer.body, "and it holds the app's DSL").toContain(SEEDED_BUTTON_TEST_ID);
    await new AppViewPage(v.session.page).open(seeded.appId);
    await expect(
      new AppViewPage(v.session.page).buttonByTestId(SEEDED_BUTTON_TEST_ID),
      "the viewer's published view shows the app",
    ).toHaveText(SEEDED_BUTTON_TEXT);

    const liveAnswer = await readRecord(v.request, seeded.appId, LIVE_RECORD_ID);
    expectAnswer(liveAnswer, API_ERRORS.NOT_AUTHORIZED, "the viewer's read of the live record");
    expect(liveAnswer.body, "no DSL in the live-record denial").not.toContain(SEEDED_BUTTON_TEST_ID);
    const namedAnswer = await readRecord(v.request, seeded.appId, versionId as string);
    expectAnswer(namedAnswer, API_ERRORS.NOT_AUTHORIZED, "the viewer's read of the named record");
    expect(namedAnswer.body, "no DSL in the named-record denial").not.toContain(SEEDED_BUTTON_TEST_ID);

    const afterView = await apiRaw(v.request, "GET", appViewPath(seeded.appId));
    expectAnswer(afterView, ALLOWED, "after: the viewer's published view still works");
  });

  test("SEC-R01f+ an editor reads the live and a named record", securityTestDetails("SEC-R01f+"), async ({ page, apiUser, actor }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const e = await memberOf(a, actor, "editor");
    await grantApp(a, seeded.appId, e, APP_ROLES.EDITOR);
    const versionId = (await listAppVersions(a.request, seeded.appId))[0]?.id;
    expect(versionId, "setup: the seeded app has a published version").toBeTruthy();
    expectAnswer(await apiRaw(e.request, "GET", applicationPath(seeded.appId)), ALLOWED, "before: E holds the editor right");

    const liveAnswer = await readRecord(e.request, seeded.appId, LIVE_RECORD_ID);
    expectAnswer(liveAnswer, ALLOWED, "the editor's read of the live record");
    expect(liveAnswer.body, "and it holds the app's DSL").toContain(SEEDED_BUTTON_TEST_ID);
    const namedAnswer = await readRecord(e.request, seeded.appId, versionId as string);
    expectAnswer(namedAnswer, ALLOWED, "the editor's read of the named record");
    expect(namedAnswer.body, "and it holds the app's DSL").toContain(SEEDED_BUTTON_TEST_ID);
  });

  test("SEC-R01g+ a workspace admin without an app grant reads the live and a named record", securityTestDetails("SEC-R01g+"), async ({ page, apiUser, actor }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const admin = await memberOf(a, actor, "admin");
    await makeAdmin(a, admin);
    const versionId = (await listAppVersions(a.request, seeded.appId))[0]?.id;
    expect(versionId, "setup: the seeded app has a published version").toBeTruthy();
    expect(await roleOf(a, admin.userId), "before: the guest is an admin of the workspace").toBe(ORG_ROLES.ADMIN);
    // Whether the permission list shows an admin implicitly is NOT VERIFIED here (deferred to the combined final e2e run);
    // if it does, this assertion needs dropping.
    const appPermissionRow = (await listAppPermissions(a.request, seeded.appId)).userPermissions.find((row) => row.id === admin.userId);
    expect(appPermissionRow, "before: the admin has no explicit permission row on the app (the access is implicit OWNER)").toBeUndefined();

    const liveAnswer = await readRecord(admin.request, seeded.appId, LIVE_RECORD_ID);
    expectAnswer(liveAnswer, ALLOWED, "the workspace admin's read of the live record (implicit OWNER)");
    expect(liveAnswer.body, "and it holds the app's DSL").toContain(SEEDED_BUTTON_TEST_ID);
    const namedAnswer = await readRecord(admin.request, seeded.appId, versionId as string);
    expectAnswer(namedAnswer, ALLOWED, "the workspace admin's read of the named record (implicit OWNER)");
    expect(namedAnswer.body, "and it holds the app's DSL").toContain(SEEDED_BUTTON_TEST_ID);
  });

  test("SEC-R02d+ a viewer may list who has access to the app", securityTestDetails("SEC-R02d+"), async ({ page, apiUser, actor }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const v = await memberOf(a, actor, "viewer");
    await grantApp(a, seeded.appId, v, APP_ROLES.VIEWER);

    const answer = await apiRaw(v.request, "GET", appPermissionsPath(seeded.appId));

    // Characterisation: READ suffices to list the permissions (ApplicationApiServiceImpl.java:485-495).
    expectAnswer(answer, ALLOWED, "the viewer's permission list");
    const view = answer.json as { data: { creatorId: string; userPermissions: { id: string; role: string }[] } };
    expect(view.data.creatorId, "it names the creator").toBe(a.userId);
    expect(view.data.userPermissions.find((row) => row.id === v.userId)?.role, "and the viewer's own row").toBe(APP_ROLES.VIEWER);
  });

  test("SEC-R02e a viewer cannot change its own row and an editor cannot remove another's", securityTestDetails("SEC-R02e"), async ({ page, apiUser, actor }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const v = await memberOf(a, actor, "viewer");
    const e = await memberOf(a, actor, "editor");
    await grantApp(a, seeded.appId, v, APP_ROLES.VIEWER);
    await grantApp(a, seeded.appId, e, APP_ROLES.EDITOR);
    const rows = async () => (await listAppPermissions(a.request, seeded.appId)).userPermissions;
    const rowOfV = permissionIdOf((await rows()).find((row) => row.id === v.userId), "V's own row");
    expectAnswer(await apiRaw(e.request, "GET", applicationPath(seeded.appId)), ALLOWED, "before: E holds the editor right");
    const before = JSON.stringify(await rows());

    const promoted = await apiRaw(v.request, "PUT", appPermissionPath(seeded.appId, rowOfV), { data: { role: APP_ROLES.OWNER } });
    const removed = await apiRaw(e.request, "DELETE", appPermissionPath(seeded.appId, rowOfV));

    expectAnswer(promoted, API_ERRORS.NOT_AUTHORIZED, "the viewer's update of its own row");
    expectAnswer(removed, API_ERRORS.NOT_AUTHORIZED, "the editor's removal of the viewer's row");
    expect(JSON.stringify(await rows()), "after: the rows are exactly as they were").toBe(before);
    expect((await rows()).find((row) => row.id === v.userId)?.role, "V is still a viewer").toBe(APP_ROLES.VIEWER);
  });

  test("SEC-R03a+ an editor may update, publish and make the app public", securityTestDetails("SEC-R03a+"), async ({ page, apiUser, actor }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const e = await memberOf(a, actor, "editor");
    const v = await memberOf(a, actor, "viewer");
    await grantApp(a, seeded.appId, e, APP_ROLES.EDITOR);
    await grantApp(a, seeded.appId, v, APP_ROLES.VIEWER);
    const viewOfV = async () => (await apiRaw(v.request, "GET", appViewPath(seeded.appId))).body;
    const before = await viewOfV();
    expect(before, "before: V sees the first published version").toContain(SEEDED_BUTTON_TEXT);
    expect(before, "and not the edit").not.toContain(EDITED_BUTTON_TEXT);
    const name = (await getApp(a.request, seeded.appId)).name;

    const updated = await apiRaw(e.request, "PUT", applicationPath(seeded.appId), { data: { name, editingApplicationDSL: editedDsl(EDITED_BUTTON_TEXT) } });
    const published = await apiRaw(e.request, "POST", publishPath(seeded.appId), { data: { commitMessage: "e2e editor", tag: SECOND_VERSION_TAG } });
    const publicAnswer = await apiRaw(e.request, "PUT", publicToAllPath(seeded.appId), { data: { publicToAll: true } });

    expectAnswer(updated, ALLOWED, "the editor's update");
    expectAnswer(published, ALLOWED, "the editor's publish");
    expectAnswer(publicAnswer, ALLOWED, "the editor's public-to-all");
    expect(await viewOfV(), "after: V sees the new published version").toContain(EDITED_BUTTON_TEXT);
    expect((await getApp(a.request, seeded.appId)).publicToAll, "and the app is public").toBe(true);
  });

  test("SEC-R03b an editor cannot recycle an app through the status update", securityTestDetails("SEC-R03b"), async ({ page, apiUser, actor }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const e = await memberOf(a, actor, "editor");
    await grantApp(a, seeded.appId, e, APP_ROLES.EDITOR);
    const before = await getApp(a.request, seeded.appId);
    expect(before.applicationStatus, "before: the app is normal").toBe(APP_STATUS.NORMAL);

    const answer = await apiRaw(e.request, "PUT", applicationPath(seeded.appId), {
      params: { updateStatus: true },
      data: { applicationStatus: APP_STATUS.RECYCLED },
    });

    // The status needs MANAGE like recycle (401 / 5001, R03d); the editor right is not enough (D-9).
    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the editor's status update");
    expect((await getApp(a.request, seeded.appId)).applicationStatus, "after: the app is still normal").toBe(APP_STATUS.NORMAL);
    expect(await listAppNames(a.request), "and still listed").toContain(before.name);
  });

  test("SEC-R03f+ an owner of the app may change its status through the update route", securityTestDetails("SEC-R03f+"), async ({ page, apiUser, actor }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const o = await memberOf(a, actor, "app-owner");
    await grantApp(a, seeded.appId, o, APP_ROLES.OWNER);
    const before = await getApp(a.request, seeded.appId);
    expect(before.applicationStatus, "before: the app is normal").toBe(APP_STATUS.NORMAL);

    const answer = await apiRaw(o.request, "PUT", applicationPath(seeded.appId), {
      params: { updateStatus: true },
      data: { applicationStatus: APP_STATUS.RECYCLED },
    });

    expectAnswer(answer, ALLOWED, "the owner's status update");
    const recycled = await listRecycledApps(a.request);
    expect(recycled.find((app) => app.applicationId === seeded.appId)?.applicationStatus, "after: the app is in the trash, recycled").toBe(APP_STATUS.RECYCLED);
  });

  test("SEC-R03c an editor cannot grant the owner role", securityTestDetails("SEC-R03c"), async ({ page, apiUser, actor }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const e = await memberOf(a, actor, "editor");
    const m = await memberOf(a, actor, "member");
    await grantApp(a, seeded.appId, e, APP_ROLES.EDITOR);
    const rowsOfM = async () => (await listAppPermissions(a.request, seeded.appId)).userPermissions.filter((row) => row.id === m.userId);
    expectAnswer(await apiRaw(e.request, "GET", applicationPath(seeded.appId)), ALLOWED, "before: E holds the editor right");
    expect(await rowsOfM(), "before: no row for M").toHaveLength(0);

    const answer = await apiRaw(e.request, "PUT", appPermissionsPath(seeded.appId), {
      data: { role: APP_ROLES.OWNER, userIds: [m.userId], groupIds: [] },
    });

    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the editor's grant");
    expect(await rowsOfM(), "after: still no row for M").toHaveLength(0);
    expectAnswer(await apiRaw(m.request, "GET", applicationPath(seeded.appId)), API_ERRORS.NO_PERMISSION_TO_REQUEST_APP, "and M still cannot open the editing view");
  });

  test("SEC-R04a+ a developer manages the app it created", securityTestDetails("SEC-R04a+"), async ({ page, apiUser, actor }) => {
    const { a } = await sceneOf(page, apiUser);
    const d = await memberOf(a, actor, "developer");
    await makeDeveloper(a, d);
    const m = await memberOf(a, actor, "member");
    const { appId } = await createApp(d.request, { orgId: a.orgId, name: APP_OF_DEVELOPER });
    expect(await listAppNames(m.request), "before: M does not see the app").not.toContain(APP_OF_DEVELOPER);

    expectAnswer(await apiRaw(d.request, "PUT", recyclePath(appId)), ALLOWED, "D recycles its app");
    expect((await listRecycledApps(a.request)).find((app) => app.applicationId === appId)?.applicationStatus, "in the trash").toBe(APP_STATUS.RECYCLED);
    expectAnswer(await apiRaw(d.request, "PUT", restorePath(appId)), ALLOWED, "D restores it");
    expect((await getApp(a.request, appId)).applicationStatus, "restored").toBe(APP_STATUS.NORMAL);
    expectAnswer(
      await apiRaw(d.request, "PUT", appPermissionsPath(appId), { data: { role: APP_ROLES.VIEWER, userIds: [m.userId], groupIds: [] } }),
      ALLOWED,
      "D grants viewer to M",
    );

    expect(await listAppNames(m.request), "after: M sees the app").toContain(APP_OF_DEVELOPER);
    const list = new AppListPage(m.session.page);
    await list.open();
    await expect(list.appNamed(APP_OF_DEVELOPER), "in M's /apps").toBeVisible();
  });

  test("SEC-R04b+ an admin who is not the creator edits and recycles a developer's app", securityTestDetails("SEC-R04b+"), async ({ page, apiUser, actor }) => {
    const { a } = await sceneOf(page, apiUser);
    const d = await memberOf(a, actor, "developer");
    await makeDeveloper(a, d);
    const { appId } = await createApp(d.request, { orgId: a.orgId, name: APP_OF_DEVELOPER });
    expect((await getApp(d.request, appId)).createBy, "setup: D, not A, created the app").toBe(d.userId);

    const renamed = await apiRaw(a.request, "PUT", applicationPath(appId), { data: { name: RENAMED_BY_ADMIN } });
    expectAnswer(renamed, ALLOWED, "A's edit");
    expect((await getApp(d.request, appId)).name, "the rename is stored").toBe(RENAMED_BY_ADMIN);
    expectAnswer(await apiRaw(a.request, "PUT", recyclePath(appId)), ALLOWED, "A's recycle");
    expect((await listRecycledApps(a.request)).find((app) => app.applicationId === appId)?.applicationStatus, "in the trash").toBe(APP_STATUS.RECYCLED);
  });

  test("SEC-R06b a plain member cannot create a data source, folder or library query", securityTestDetails("SEC-R06b"), async ({ page, apiUser, actor }) => {
    const { a } = await sceneOf(page, apiUser);
    const m = await memberOf(a, actor, "member");
    const datasourcesBefore = (await apiRaw(a.request, "GET", datasourcesByOrgPath(), { params: { orgId: a.orgId } })).body;
    const rootBefore = (await apiRaw(a.request, "GET", API_PATHS.FOLDER_ELEMENTS)).body;

    const created = await createAsActor(m, a.orgId, "denied");

    expectAnswer(created.datasource, API_ERRORS.NEED_DEV_TO_CREATE_RESOURCE, "the member's data source create");
    expectAnswer(created.folder, API_ERRORS.NEED_DEV_TO_CREATE_RESOURCE, "the member's folder create");
    expectAnswer(created.libraryQuery, API_ERRORS.NEED_DEV_TO_CREATE_RESOURCE, "the member's library query create");
    expectAnswer(created.app, API_ERRORS.NEED_DEV_TO_CREATE_RESOURCE, "and the app create, for the record");
    // The route is mounted for a plain member although the sidebar hides it: the page loads and its form gets the
    // same denial from the server.
    const page_ = new DatasourcePage(m.session.page);
    await page_.open();
    await expect(page_.newButton, "the member's /datasource page loads").toBeVisible();
    expect(await page_.createPostgres(postgresConnection(), `${FOREIGN_DATASOURCE}-ui`), "the form's save answer").toEqual(API_ERRORS.NEED_DEV_TO_CREATE_RESOURCE);
    const datasourcesAfter = (await apiRaw(a.request, "GET", datasourcesByOrgPath(), { params: { orgId: a.orgId } })).body;
    expect(datasourcesAfter, "after: the data sources are as they were").toBe(datasourcesBefore);
    expect(datasourcesAfter, "and no foreign one").not.toContain(FOREIGN_DATASOURCE);
    expect(datasourcesAfter, "and none from the form").not.toContain(`${FOREIGN_DATASOURCE}-ui`);
    expect((await apiRaw(a.request, "GET", API_PATHS.FOLDER_ELEMENTS)).body, "after: the root is as it was").toBe(rootBefore);
  });

  test("SEC-R06c a member whose own workspace is current cannot create in another workspace", securityTestDetails("SEC-R06c"), async ({ page, apiUser, actor }) => {
    const { a } = await sceneOf(page, apiUser);
    const m = await memberOf(a, actor, "member");
    await switchOrganization(m.request, m.orgId);
    expect((await currentUser(m.request)).currentOrgId, "setup: M's own workspace is current").toBe(m.orgId);

    const answer = await apiRaw(m.request, "POST", API_PATHS.APPLICATIONS, {
      data: { orgId: a.orgId, name: NEW_APP_BY_MEMBER, applicationType: APP_TYPE_APPLICATION, editingApplicationDSL: {} },
    });

    // The same refusal as R06a; the dev check now reads the TARGET workspace, where M is only a plain member (D-11).
    expectAnswer(answer, API_ERRORS.NEED_DEV_TO_CREATE_RESOURCE, "the member's create with its own workspace current");
    expect(await listAppNames(a.request), "after: nothing was created in OA").not.toContain(NEW_APP_BY_MEMBER);
  });

  test("SEC-R06e a member whose own workspace is current cannot create a data source in another workspace", securityTestDetails("SEC-R06e"), async ({ page, apiUser, actor }) => {
    const { a } = await sceneOf(page, apiUser);
    const m = await memberOf(a, actor, "member");
    await switchOrganization(m.request, m.orgId);
    expect((await currentUser(m.request)).currentOrgId, "setup: M's own workspace is current").toBe(m.orgId);
    const datasourcesBefore = (await apiRaw(a.request, "GET", datasourcesByOrgPath(), { params: { orgId: a.orgId } })).body;

    const answer = await apiRaw(m.request, "POST", API_PATHS.DATASOURCES, {
      data: {
        name: `${FOREIGN_DATASOURCE}-r06e`,
        type: "postgres",
        organizationId: a.orgId,
        datasourceConfig: { ...postgresConnection(), usingSsl: false, extParams: {} },
      },
    });

    // The same refusal as R06b; the dev check now reads the TARGET workspace, where M is only a plain member (D-11, D-41).
    expectAnswer(answer, API_ERRORS.NEED_DEV_TO_CREATE_RESOURCE, "the member's data source create with its own workspace current");
    const datasourcesAfter = (await apiRaw(a.request, "GET", datasourcesByOrgPath(), { params: { orgId: a.orgId } })).body;
    expect(datasourcesAfter, "after: the data sources are as they were").toBe(datasourcesBefore);
    expect(datasourcesAfter, "and no foreign one").not.toContain(`${FOREIGN_DATASOURCE}-r06e`);
  });

  test("SEC-R06d+ a developer can create apps, data sources, folders and library queries", securityTestDetails("SEC-R06d+"), async ({ page, apiUser, actor }) => {
    const { a } = await sceneOf(page, apiUser);
    const d = await memberOf(a, actor, "developer");
    await makeDeveloper(a, d);

    const created = await createAsActor(d, a.orgId, "allowed");

    expectAnswer(created.app, ALLOWED, "the developer's app create");
    expectAnswer(created.datasource, CREATED, "the developer's data source create");
    expectAnswer(created.folder, ALLOWED, "the developer's folder create");
    expectAnswer(created.libraryQuery, ALLOWED, "the developer's library query create");
    expect(await listAppNames(a.request), "the app exists").toContain(`${NEW_APP_BY_MEMBER}-allowed`);
    const list = new AppListPage(d.session.page);
    await list.open();
    await expect(list.newButton, "the developer's /apps shows New").toBeVisible();
  });

  test("SEC-R07b+ any member may invite (characterisation)", securityTestDetails("SEC-R07b+"), async ({ page, apiUser, actor }) => {
    const { a } = await sceneOf(page, apiUser);
    const m = await memberOf(a, actor, "member");

    const answer = await apiRaw(m.request, "POST", API_PATHS.INVITATION, { params: { orgId: a.orgId } });

    // Documented in commit 2ae399ef2: a member of the workspace may create an invitation link; 3.0.0 does the same.
    expectAnswer(answer, ALLOWED, "the member's invitation");
    expect((answer.json as { data: { inviteCode: string } }).data.inviteCode, "it carries a code").toBeTruthy();
  });

  test("SEC-R07c a developer cannot read the sign-in provider configuration", securityTestDetails("SEC-R07c"), async ({ page, apiUser, actor }) => {
    const { a } = await sceneOf(page, apiUser);
    const d = await memberOf(a, actor, "developer");
    await makeDeveloper(a, d);
    await seedOAuthConfig(a.request, { clientSecret: `${OAUTH_SECRET_PREFIX}c` });
    const own = await apiRaw(a.request, "GET", API_PATHS.AUTH_CONFIGS);
    expectAnswer(own, ALLOWED, "before: the admin reads the configs");
    expect(own.body, "and they hold the secret").toContain(`${OAUTH_SECRET_PREFIX}c`);

    const adminSettings = new SettingPage(page);
    await adminSettings.open(SETTING_PATHS.OAUTH_PROVIDER);
    await expect(adminSettings.addOauthProviderButton, "control: the admin's provider page offers adding a provider").toBeVisible();

    const answer = await apiRaw(d.request, "GET", API_PATHS.AUTH_CONFIGS);

    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the developer's config read");
    expect(answer.body, "no secret in the denial").not.toContain(OAUTH_SECRET_PREFIX);
    // Measured on 3.0.0 (a sign-out was expected): the developer who opens the provider URL lands on the app list, its session
    // stays alive, and no provider page content is shown.
    const developerPage = d.session.page;
    await new SettingPage(developerPage).open(SETTING_PATHS.OAUTH_PROVIDER);
    await expect(developerPage, "the developer is sent to the app list").toHaveURL(UI_PATHS.APP_LIST);
    await expect(new AppListPage(developerPage).newButton, "which is the developer's own list").toBeVisible();
    await expect(new SettingPage(developerPage).addOauthProviderButton, "no provider page").toHaveCount(0);
    expect(await currentUserId(d.request), "the developer's session is still alive").toBe(d.userId);
  });

  test("SEC-R07d a member's organisation read carries no sign-in secret", securityTestDetails("SEC-R07d"), async ({ page, apiUser, actor }) => {
    const { a } = await sceneOf(page, apiUser);
    const m = await memberOf(a, actor, "member");
    const secret = `${OAUTH_SECRET_PREFIX}${randomUUID()}`;
    await seedOAuthConfig(a.request, { clientSecret: secret });
    expect((await apiRaw(a.request, "GET", API_PATHS.AUTH_CONFIGS)).body, "before: the admin's config list holds the secret").toContain(secret);

    const answer = await apiRaw(m.request, "GET", orgPath(a.orgId));

    expectAnswer(answer, ALLOWED, "the member's organisation read (the read itself works)");
    expect(answer.body, "the secret is nowhere in the body").not.toContain(secret);
  });

  test("SEC-R07e a member's profile carries no sign-in secret", securityTestDetails("SEC-R07e"), async ({ page, apiUser, actor }) => {
    const { a } = await sceneOf(page, apiUser);
    const m = await memberOf(a, actor, "member");
    const secret = `${OAUTH_SECRET_PREFIX}${randomUUID()}`;
    await seedOAuthConfig(a.request, { clientSecret: secret });
    expect((await apiRaw(a.request, "GET", API_PATHS.AUTH_CONFIGS)).body, "before: the admin's config list holds the secret").toContain(secret);

    const answer = await apiRaw(m.request, "GET", API_PATHS.CURRENT_USER);

    expectAnswer(answer, ALLOWED, "the member's profile read (the read itself works)");
    const orgIds = (answer.json as { data: { orgAndRoles: { org: { id: string } }[] } }).data.orgAndRoles.map((entry) => entry.org.id);
    expect(orgIds, "the profile lists the admin's workspace, so the secret's absence is not a missing workspace").toContain(a.orgId);
    expect(answer.body, "the secret is nowhere in the body").not.toContain(secret);
  });

  test("SEC-R08a+ an admin changes a member's role and removes a member", securityTestDetails("SEC-R08a+"), async ({ page, apiUser, actor }) => {
    const { a } = await sceneOf(page, apiUser);
    const m = await memberOf(a, actor, "member");
    const d = await memberOf(a, actor, "developer");
    expect(await roleOf(a, m.userId), "before: M is a member").toBe(ORG_ROLES.MEMBER);

    expectAnswer(await apiRaw(a.request, "PUT", orgRolePath(a.orgId), { data: { userId: m.userId, role: ORG_ROLES.ADMIN } }), ALLOWED, "A makes M admin");
    expect(await roleOf(a, m.userId), "M is admin").toBe(ORG_ROLES.ADMIN);
    expectAnswer(await apiRaw(a.request, "PUT", orgRolePath(a.orgId), { data: { userId: m.userId, role: ORG_ROLES.MEMBER } }), ALLOWED, "and back");
    expect(await roleOf(a, m.userId), "M is a member again").toBe(ORG_ROLES.MEMBER);
    expectAnswer(await apiRaw(a.request, "DELETE", orgRemoveMemberPath(a.orgId), { params: { userId: d.userId } }), ALLOWED, "A removes D");
    expect(await roleOf(a, d.userId), "D is no member").toBeUndefined();
  });

  test("SEC-R08b the only admin cannot leave the workspace", securityTestDetails("SEC-R08b"), async ({ page, apiUser }) => {
    const { a } = await sceneOf(page, apiUser);
    const admins = (await listOrgMembers(a.request, a.orgId)).filter((member) => member.role === ORG_ROLES.ADMIN);
    expect(admins.map((admin) => admin.userId), "before: A is the only admin").toEqual([a.userId]);

    const answer = await apiRaw(a.request, "DELETE", orgLeavePath(a.orgId));

    expectAnswer(answer, API_ERRORS.LAST_ADMIN_CANNOT_LEAVE_ORG, "the only admin's leave");
    expect(await roleOf(a, a.userId), "after: A is still an admin").toBe(ORG_ROLES.ADMIN);
  });

  test("SEC-R08c an org admin cannot write a server configuration key", securityTestDetails("SEC-R08c"), async ({ page, apiUser }) => {
    const { a } = await sceneOf(page, apiUser);
    const key = `e2e-sec-r08c-${randomUUID()}`;
    const valueOf = async () => ((await apiRaw(a.request, "GET", configPath(key))).json as { data: { value: unknown } }).data.value;
    expect(await valueOf(), "before: the key has no value").toBeNull();

    const answer = await apiRaw(a.request, "POST", configPath(key), { data: { value: SERVER_CONFIG_VALUE } });

    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the admin's config write");
    expect(await valueOf(), "after: the key still has no value").toBeNull();
  });

  test("SEC-R08d the only admin cannot be removed from the workspace", securityTestDetails("SEC-R08d"), async ({ page, apiUser }) => {
    const { a } = await sceneOf(page, apiUser);
    expect(await roleOf(a, a.userId), "before: A is an admin").toBe(ORG_ROLES.ADMIN);

    const answer = await apiRaw(a.request, "DELETE", orgRemoveMemberPath(a.orgId), { params: { userId: a.userId } });

    expectAnswer(answer, API_ERRORS.LAST_ADMIN_CANNOT_LEAVE_ORG, "the removal of the only admin");
    expect(await roleOf(a, a.userId), "after: A is still an admin").toBe(ORG_ROLES.ADMIN);
    const settings = new SettingPage(page);
    await settings.open();
    await expect(settings.userAuthenticationEntry, "and A's /setting still opens").toBeVisible();
  });

  test("SEC-R10a an anonymous visitor gets no data from the session routes", securityTestDetails("SEC-R10a"), async ({ page, apiUser, newUserSession }) => {
    const { a } = await sceneOf(page, apiUser);
    const anonymous = (await newUserSession()).page.request;
    expect((await listAppNames(a.request)).length, "before: A's list has an app").toBeGreaterThan(0);

    const myOrg = await apiRaw(anonymous, "GET", API_PATHS.USER_MY_ORG);
    const list = await apiRaw(anonymous, "GET", API_PATHS.APPLICATION_LIST);
    const me = await apiRaw(anonymous, "GET", API_PATHS.CURRENT_USER);

    expectAnswer(myOrg, API_ERRORS.UNAUTHENTICATED, "the anonymous workspace list");
    expect(myOrg.body, "with no body").toBe("");
    // Measured on 3.0.0: the anonymous pattern lets /applications/list reach the handler, which finds no workspace.
    expectAnswer(list, API_ERRORS.UNABLE_TO_FIND_VALID_ORG, "the anonymous app list");
    expect(list.body, "no app in it").not.toContain(SEEDED_APP_NAME);
    expectAnswer(me, ALLOWED, "the anonymous profile");
    expect((me.json as { data: Record<string, unknown> }).data, "is the anonymous user").toMatchObject(ANONYMOUS_USER);
  });

  test("SEC-R10d+ an anonymous visitor can run the query of a public app", securityTestDetails("SEC-R10d+"), async ({ page, apiUser, newUserSession }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const anonymous = (await newUserSession()).page.request;
    const params = { applicationId: seeded.appId, queryId: seeded.queryId, viewMode: true };
    expectAnswer(await executeAppQueryRaw(anonymous, params), API_ERRORS.NOT_AUTHORIZED, "before: the app is private, the run is denied");

    await setPublicToAll(a.request, seeded.appId, true);

    const answer = await executeAppQueryRaw(anonymous, params);
    expectAnswer(answer, ALLOWED, "after: the anonymous run of the public app's query");
    expect(answer.body, "with the rows").toContain(PRODUCTS.FIRST_NAME);
  });
});

/** An app of A with a query on A's data source, handed to `member` as editor: the base of the data source rows (R09). */
async function appWithEditor(a: ApiUserAsOwner, member: Actor): Promise<string> {
  const { appId } = await createApp(a.request, { orgId: a.orgId, name: APP_OF_MEMBER, dsl: editedDsl(SEEDED_BUTTON_TEXT) });
  await grantApp(a, appId, member, APP_ROLES.EDITOR);
  return appId;
}

test.describe("security: data source use inside one workspace", () => {
  test("SEC-R09a an editor cannot save a query on a data source it may not use", securityTestDetails("SEC-R09a"), async ({ page, apiUser, actor }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const m = await memberOf(a, actor, "member");
    const appId = await appWithEditor(a, m);
    const query = selectProductsQuery(seeded.datasourceId, QUERY_ON_FOREIGN_DATASOURCE);
    const harmless = await apiRaw(m.request, "PUT", applicationPath(appId), { data: { editingApplicationDSL: editedDsl(EDITED_BUTTON_TEXT) } });
    expectAnswer(harmless, ALLOWED, "before: the same editor saves the app without the query, so the right to edit is there");

    const answer = await apiRaw(m.request, "PUT", applicationPath(appId), {
      data: { editingApplicationDSL: editedDsl(EDITED_BUTTON_TEXT, [query]) },
    });

    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the editor's save with a query on the data source");
    const stored = JSON.stringify((await getApp(a.request, appId)).dsl);
    expect(stored, "after: the query is not stored").not.toContain(QUERY_ON_FOREIGN_DATASOURCE);
    expect(stored, "and the data source id is not in the DSL").not.toContain(seeded.datasourceId);
  });

  test("SEC-R09b a viewer of the data source may save and run the query but not read the data source", securityTestDetails("SEC-R09b"), async ({ page, apiUser, actor }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const m = await memberOf(a, actor, "member");
    const appId = await appWithEditor(a, m);
    const dsl = editedDsl(EDITED_BUTTON_TEXT, [selectProductsQuery(seeded.datasourceId, QUERY_ON_FOREIGN_DATASOURCE)]);
    const save = () => apiRaw(m.request, "PUT", applicationPath(appId), { data: { editingApplicationDSL: dsl } });
    expectAnswer(await save(), API_ERRORS.NOT_AUTHORIZED, "before: without USE the save is denied");
    await grantDatasourcePermission(a.request, seeded.datasourceId, { role: APP_ROLES.VIEWER, userIds: [m.userId] });

    const saved = await save();
    const run = await executeAppQueryRaw(m.request, { applicationId: appId, queryId: QUERY_ON_FOREIGN_DATASOURCE, viewMode: false });
    const read = await apiRaw(m.request, "GET", datasourcePath(seeded.datasourceId));

    expectAnswer(saved, ALLOWED, "the save with USE");
    expect(JSON.stringify((await getApp(a.request, appId)).dsl), "the query is stored").toContain(QUERY_ON_FOREIGN_DATASOURCE);
    expectAnswer(run, ALLOWED, "the run with USE");
    expect(run.body, "with the rows").toContain(PRODUCTS.FIRST_NAME);
    expectAnswer(read, API_ERRORS.NOT_AUTHORIZED, "the data source read (MANAGE)");
    expect(read.body, "no password in the denial").not.toContain(POSTGRES.PASSWORD);
  });

  test("SEC-R09c a query that names the data source by its gid needs the same right", securityTestDetails("SEC-R09c"), async ({ page, apiUser, actor }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const m = await memberOf(a, actor, "member");
    const appId = await appWithEditor(a, m);
    const gid = ((await apiRaw(a.request, "GET", datasourcePath(seeded.datasourceId))).json as { data: { gid?: string } }).data.gid;
    expect(gid, "setup: the data source has a gid").toBeTruthy();
    expectAnswer(
      await apiRaw(m.request, "PUT", applicationPath(appId), {
        data: { editingApplicationDSL: editedDsl(EDITED_BUTTON_TEXT, [selectProductsQuery(seeded.datasourceId, QUERY_ON_FOREIGN_DATASOURCE)]) },
      }),
      API_ERRORS.NOT_AUTHORIZED,
      "before: by id the save is denied",
    );

    const answer = await apiRaw(m.request, "PUT", applicationPath(appId), {
      data: { editingApplicationDSL: editedDsl(EDITED_BUTTON_TEXT, [selectProductsQuery(gid ?? "", QUERY_ON_FOREIGN_DATASOURCE)]) },
    });

    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the save with the gid");
    expect(JSON.stringify((await getApp(a.request, appId)).dsl), "after: the query is not stored").not.toContain(QUERY_ON_FOREIGN_DATASOURCE);
  });

  test("SEC-R09d the right check covers every data source of a saved app, not only the first", securityTestDetails("SEC-R09d"), async ({ page, apiUser, actor }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const e = await actor("editor");
    // E's own workspace is its current one until it joins OA, so E creates its own data source first.
    const ownDatasource = await createPostgresDatasource(e.request, { orgId: e.orgId, name: OWN_DATASOURCE, connection: postgresConnection() });
    await joinWorkspace(a, e);
    await grantApp(a, seeded.appId, e, APP_ROLES.EDITOR);
    const queries = [selectProductsQuery(ownDatasource, QUERY_OF_EDITOR), selectProductsQuery(seeded.datasourceId, QUERY_ON_FOREIGN_DATASOURCE)];

    const answer = await apiRaw(e.request, "PUT", applicationPath(seeded.appId), {
      data: { editingApplicationDSL: editedDsl(EDITED_BUTTON_TEXT, queries) },
    });

    // D-38: each data source is decided in its own workspace, so E's admin role in its own workspace grants no use of A's data source.
    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the editor's save with a query on a data source it may not use");
    expect(JSON.stringify((await getApp(a.request, seeded.appId)).dsl), "after: the query is not stored").not.toContain(QUERY_ON_FOREIGN_DATASOURCE);
  });

  test("SEC-R09e a viewer of the data source cannot change or remove permission rows", securityTestDetails("SEC-R09e"), async ({ page, apiUser, actor }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const m = await memberOf(a, actor, "member");
    await grantDatasourcePermission(a.request, seeded.datasourceId, { role: APP_ROLES.VIEWER, userIds: [m.userId] });
    const rows = async () => (await listDatasourcePermissions(a.request, seeded.datasourceId)).userPermissions;
    const rowOfM = permissionIdOf((await rows()).find((row) => row.id === m.userId), "M's row");
    const rowOfA = permissionIdOf((await rows()).find((row) => row.id === a.userId), "A's owner row");
    expectAnswer(await executeAppQueryRaw(m.request, { applicationId: seeded.appId, queryId: seeded.queryId, viewMode: true }), API_ERRORS.NOT_AUTHORIZED, "before: M holds USE on the data source only, no right on the app");
    const before = JSON.stringify(await rows());

    const promoted = await apiRaw(m.request, "PUT", datasourcePermissionPath(rowOfM), { data: { role: APP_ROLES.OWNER } });
    const removed = await apiRaw(m.request, "DELETE", datasourcePermissionPath(rowOfA));

    expectAnswer(promoted, API_ERRORS.NOT_AUTHORIZED, "the viewer's promotion of its own row");
    expectAnswer(removed, API_ERRORS.NOT_AUTHORIZED, "the viewer's removal of the owner's row");
    expect(JSON.stringify(await rows()), "after: the rows are exactly as they were").toBe(before);
  });

  test("SEC-R09f a role the client never sends is refused for a data source grant (characterisation)", securityTestDetails("SEC-R09f"), async ({ page, apiUser, actor }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const m = await memberOf(a, actor, "member");
    const roleOfM = async () => (await listDatasourcePermissions(a.request, seeded.datasourceId)).userPermissions.find((row) => row.id === m.userId)?.role;
    expectAnswer(
      await apiRaw(a.request, "PUT", datasourcePermissionsPath(seeded.datasourceId), { data: { role: APP_ROLES.VIEWER, userIds: [m.userId], groupIds: [] } }),
      ALLOWED,
      "before: the owner may grant viewer",
    );
    expect(await roleOfM(), "M is a viewer").toBe(APP_ROLES.VIEWER);

    const answer = await apiRaw(a.request, "PUT", datasourcePermissionsPath(seeded.datasourceId), {
      data: { role: APP_ROLES.EDITOR, userIds: [m.userId], groupIds: [] },
    });

    expectAnswer(answer, API_ERRORS.INTERNAL_SERVER_ERROR, "the owner's grant of editor (`checkRole` admits viewer and owner only)");
    expect(await roleOfM(), "after: M is still a viewer").toBe(APP_ROLES.VIEWER);
  });
});

/**
 * The instance super admin S (R16): a SUPER_ADMIN member of every workspace, shared by all workers.
 * S never switches its workspace and is changed only inside the test's own workspace OA (R16c, R16d); config keys carry a
 * random suffix (they are deployment-wide). Every test lists `superAdmin` first, so a run without the credentials fails with
 * the error that names the variables before any other fixture talks to the stack.
 */
const SUPER_ADMIN_CONFIG_VALUE = "e2e-sec-r16b-value";

test.describe("security: the instance super admin", () => {
  test("SEC-R16a the instance super admin opens the editing view of a private app without an invitation", securityTestDetails("SEC-R16a", [TAGS.SUPERADMIN]), async ({ superAdmin, page, apiUser, actor }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const m = await memberOf(a, actor, "member");
    expect(await roleOf(a, superAdmin.userId), "before: S is a SUPER_ADMIN member of OA, never invited by A").toBe(ORG_ROLES.SUPER_ADMIN);
    expectAnswer(await apiRaw(m.request, "GET", applicationPath(seeded.appId)), API_ERRORS.NO_PERMISSION_TO_REQUEST_APP, "control: a plain member of OA is denied the same call");

    const answer = await apiRaw(superAdmin.request, "GET", applicationPath(seeded.appId));

    expectAnswer(answer, ALLOWED, "S's editing view of A's private app");
    expect(JSON.stringify(answer.json), "the answer carries A's draft (the button of the seeded app)").toContain(SEEDED_BUTTON_TEST_ID);
  });

  test("SEC-R16b the instance super admin can write and read back a server configuration key", securityTestDetails("SEC-R16b", [TAGS.SUPERADMIN]), async ({ superAdmin, page, apiUser, actor }) => {
    // Identity control: on the 3.0.0 image any signed-in user can write a config key, so the write alone proves nothing. The session
    // under test must be the one that is a SUPER_ADMIN member of this workspace, while a plain member of it is not.
    const { a } = await sceneOf(page, apiUser);
    const m = await memberOf(a, actor, "member");
    expect(await currentUserId(superAdmin.request), "the request context is signed in as the super admin").toBe(superAdmin.userId);
    expect(await roleOf(a, superAdmin.userId), "S is a SUPER_ADMIN member of A's workspace").toBe(ORG_ROLES.SUPER_ADMIN);
    expect(await roleOf(a, m.userId), "control: a plain member is not a SUPER_ADMIN").toBe(ORG_ROLES.MEMBER);
    const key = `e2e-sec-r16b-${randomUUID()}`;
    const valueOf = async () => ((await apiRaw(superAdmin.request, "GET", configPath(key))).json as { data: { value: unknown } }).data.value;
    expect(await valueOf(), "before: the key has no value").toBeNull();

    const answer = await apiRaw(superAdmin.request, "POST", configPath(key), { data: { value: SUPER_ADMIN_CONFIG_VALUE } });

    expectAnswer(answer, ALLOWED, "S's config write");
    expect(await valueOf(), "after: the value is read back").toBe(SUPER_ADMIN_CONFIG_VALUE);
  });

  test("SEC-R16c a workspace admin cannot demote the instance super admin", securityTestDetails("SEC-R16c", [TAGS.SUPERADMIN]), async ({ superAdmin, page, apiUser }) => {
    const { a } = await sceneOf(page, apiUser);
    expect(await roleOf(a, superAdmin.userId), "before: S is a SUPER_ADMIN member of OA").toBe(ORG_ROLES.SUPER_ADMIN);

    const answer = await apiRaw(a.request, "PUT", orgRolePath(a.orgId), { data: { userId: superAdmin.userId, role: ORG_ROLES.MEMBER } });

    // D-23 (SF-18): the 3.0.0 server accepts the change; the branch refuses it with UNSUPPORTED_OPERATION.
    expectAnswer(answer, API_ERRORS.UNSUPPORTED_OPERATION, "A's demotion of S to member");
    expect(await roleOf(a, superAdmin.userId), "after: S is still a SUPER_ADMIN member of OA").toBe(ORG_ROLES.SUPER_ADMIN);
  });

  test("SEC-R16d a workspace admin cannot remove the instance super admin", securityTestDetails("SEC-R16d", [TAGS.SUPERADMIN]), async ({ superAdmin, page, apiUser }) => {
    const { a } = await sceneOf(page, apiUser);
    expect(await roleOf(a, superAdmin.userId), "before: S is a SUPER_ADMIN member of OA").toBe(ORG_ROLES.SUPER_ADMIN);

    const answer = await apiRaw(a.request, "DELETE", orgRemoveMemberPath(a.orgId), { params: { userId: superAdmin.userId } });

    // D-24 (SF-19): the 3.0.0 server removes S from OA; the branch refuses with UNSUPPORTED_OPERATION.
    expectAnswer(answer, API_ERRORS.UNSUPPORTED_OPERATION, "A's removal of S from OA");
    expect(await roleOf(a, superAdmin.userId), "after: S is still a SUPER_ADMIN member of OA").toBe(ORG_ROLES.SUPER_ADMIN);
  });
});
