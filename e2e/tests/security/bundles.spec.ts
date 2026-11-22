import type { Page } from "@playwright/test";
import {
  type RegisteredUser,
  addAppToBundle,
  apiRaw,
  bundleElementsRaw,
  createApp,
  createBundle,
  currentUser,
  grantBundlePermission,
  recycleBundle,
  switchOrganization,
} from "../../src/api/client";
import {
  API_ERRORS,
  API_OK,
  API_PATHS,
  APP_ROLES,
  BUNDLE_RECYCLE_LIST_PATH,
  TAGS,
  applicationPath,
  bundleAddAppPath,
  bundlePermissionsPath,
  bundlePublishPath,
  bundleRecyclePath,
  bundleReorderPath,
  bundlePath,
  bundleViewPath,
} from "../../src/constants";
import { expect, test } from "../../src/fixtures";
import {
  SEEDED_BUTTON_TEST_ID,
  SEEDED_BUTTON_TEXT,
  adminOfApiUser,
  grantApp,
  makeDeveloper,
  seedPrivateApp,
  type Actor,
  type ApiUserAsOwner,
  type SeededApp,
} from "../../src/security/actors";
import { expectAnswer } from "../../src/security/assertions";
import { securityTestDetails } from "../../src/security/quarantine";
import { memberOf, sceneOf } from "../../src/security/scene";

/**
 * Bundles of another workspace (C23): A (the `apiUser`, admin of OA) owns a bundle `bA` holding its private app;
 * B (own workspace OB, never invited to OA) is given the bundle's id, as if it had leaked. Every denial asserts status
 * and code, then A (or B's own view) reads the bundle back and finds it unchanged. No read-back uses the bundle's
 * permission list: it fails for every caller on the 3.0.0 server.
 */

const BUNDLE_NAME = "e2e-sec-bundle";
const RENAMED_BUNDLE = "e2e-sec-bundle-renamed-by-outsider";
const OUTSIDER_BUNDLE = "e2e-sec-bundle-of-outsider";
const SECOND_APP_NAME = "e2e-sec-second-app";
const OUTSIDER_APP_NAME = "e2e-sec-app-of-outsider";
const OK = { status: 200, code: API_OK } as const;

interface BundleScene {
  a: ApiUserAsOwner;
  b: Actor;
  seeded: SeededApp;
  bundleId: string;
}

/** A with a bundle that holds its private app; B an outsider. */
async function bundleSceneOf(page: Page, apiUser: RegisteredUser, actor: (tag: string) => Promise<Actor>): Promise<BundleScene> {
  const a = await adminOfApiUser(page.request, apiUser);
  const b = await actor("attacker");
  const seeded = await seedPrivateApp(a);
  const bundleId = await createBundle(a.request, { orgId: a.orgId, name: BUNDLE_NAME });
  await addAppToBundle(a.request, seeded.appId, bundleId);
  return { a, b, seeded, bundleId };
}

test.describe("security: another workspace's bundles", () => {
  test("SEC-C23a another workspace's bundle elements cannot be listed", securityTestDetails("SEC-C23a"), async ({ page, apiUser, actor }) => {
    const { a, b, seeded, bundleId } = await bundleSceneOf(page, apiUser, actor);
    const own = await bundleElementsRaw(a.request, bundleId);
    expectAnswer(own, OK, "before: the owner lists its bundle");
    expect(own.body, "and the app is in it").toContain(seeded.appId);

    const answer = await bundleElementsRaw(b.request, bundleId);

    expectAnswer(answer, API_ERRORS.NO_PERMISSION_TO_REQUEST_APP, "the outsider lists the bundle's elements");
    expect(answer.body, "no app DSL in the denial").not.toContain(SEEDED_BUTTON_TEST_ID);
  });

  test("SEC-C23b another workspace's bundle cannot be viewed", securityTestDetails("SEC-C23b"), async ({ page, apiUser, actor }) => {
    const { a, b, bundleId } = await bundleSceneOf(page, apiUser, actor);
    const own = await apiRaw(a.request, "GET", bundleViewPath(bundleId));
    expectAnswer(own, OK, "before: the owner views its bundle");
    expect(own.body, "and gets its name").toContain(BUNDLE_NAME);

    const answer = await apiRaw(b.request, "GET", bundleViewPath(bundleId));

    expectAnswer(answer, API_ERRORS.NO_PERMISSION_TO_REQUEST_APP, "the outsider views the bundle");
    expect(answer.body, "no bundle name in the denial").not.toContain(BUNDLE_NAME);
  });

  test("SEC-C23c an outsider cannot add its own app to another workspace's bundle", securityTestDetails("SEC-C23c"), async ({ page, apiUser, actor }) => {
    const { a, b, bundleId } = await bundleSceneOf(page, apiUser, actor);
    const { appId: appOfB } = await createApp(b.request, { orgId: b.orgId, name: OUTSIDER_APP_NAME });
    expect((await bundleElementsRaw(a.request, bundleId)).body, "before: the outsider's app is not in the bundle").not.toContain(appOfB);

    const answer = await apiRaw(b.request, "PUT", bundleAddAppPath(appOfB), { params: { toBundleId: bundleId } });

    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the outsider adds its app to A's bundle");
    expect((await bundleElementsRaw(a.request, bundleId)).body, "after: the bundle is unchanged").not.toContain(appOfB);
  });

  test("SEC-C23d another workspace's bundle cannot be recycled, shared, reordered or published", securityTestDetails("SEC-C23d"), async ({ page, apiUser, actor }) => {
    const { a, b, seeded, bundleId } = await bundleSceneOf(page, apiUser, actor);
    const { appId: secondApp } = await createApp(a.request, { orgId: a.orgId, name: SECOND_APP_NAME });
    await addAppToBundle(a.request, secondApp, bundleId);
    const elementsBefore = (await bundleElementsRaw(a.request, bundleId)).body;
    const viewBefore = await apiRaw(a.request, "GET", bundleViewPath(bundleId));
    expectAnswer(viewBefore, OK, "before: A views its bundle");
    expectAnswer(await apiRaw(b.request, "GET", bundleViewPath(bundleId)), API_ERRORS.NO_PERMISSION_TO_REQUEST_APP, "before: B cannot view it");
    const [first, second] = [seeded.appId, secondApp].sort((x, y) => elementsBefore.indexOf(x) - elementsBefore.indexOf(y));
    expect(elementsBefore.indexOf(second as string), "before: both apps are elements, in a known order").toBeGreaterThan(elementsBefore.indexOf(first as string));
    expect(elementsBefore.indexOf(first as string), "before: the first element is in the listing").toBeGreaterThan(-1);

    const recycled = await apiRaw(b.request, "PUT", bundleRecyclePath(bundleId));
    const shared = await apiRaw(b.request, "POST", bundlePermissionsPath(bundleId), {
      data: { role: APP_ROLES.OWNER, userIds: [b.userId], groupIds: [] },
    });
    // the reverse of the real order: a real transition if the call were accepted
    const reordered = await apiRaw(b.request, "PUT", bundleReorderPath(bundleId), { params: { elementIds: `${second},${first}` } });
    const published = await apiRaw(b.request, "POST", bundlePublishPath(bundleId));

    expectAnswer(recycled, API_ERRORS.NOT_AUTHORIZED, "the outsider recycles the bundle");
    expectAnswer(shared, API_ERRORS.NOT_AUTHORIZED, "the outsider grants itself a role on the bundle");
    expectAnswer(reordered, API_ERRORS.NOT_AUTHORIZED, "the outsider reorders the bundle");
    expectAnswer(published, API_ERRORS.NOT_AUTHORIZED, "the outsider publishes the bundle");
    expectAnswer(await apiRaw(b.request, "GET", bundleViewPath(bundleId)), API_ERRORS.NO_PERMISSION_TO_REQUEST_APP, "after: the grant gave B nothing");
    const viewAfter = await apiRaw(a.request, "GET", bundleViewPath(bundleId));
    expectAnswer(viewAfter, OK, "after: A still views the bundle, so it is not recycled");
    expect(viewAfter.body, "after: the bundle, publication state included, is exactly as it was").toBe(viewBefore.body);
    expect((await bundleElementsRaw(a.request, bundleId)).body, "after: the elements and their order are unchanged").toBe(elementsBefore);
  });

  test("SEC-C23e another workspace's bundle cannot be renamed", securityTestDetails("SEC-C23e"), async ({ page, apiUser, actor }) => {
    const { a, b, bundleId } = await bundleSceneOf(page, apiUser, actor);
    const before = await apiRaw(a.request, "GET", bundleViewPath(bundleId));
    expect(before.body, "before: the bundle has its name").toContain(BUNDLE_NAME);

    const answer = await apiRaw(b.request, "PUT", API_PATHS.BUNDLES, { data: { id: bundleId, name: RENAMED_BUNDLE } });

    expectAnswer(answer, API_ERRORS.BUNDLE_OPERATE_NO_PERMISSION, "the outsider renames the bundle");
    const after = await apiRaw(a.request, "GET", bundleViewPath(bundleId));
    expect(after.body, "after: the bundle is exactly as it was").toBe(before.body);
    expect(after.body, "the outsider's name was not stored").not.toContain(RENAMED_BUNDLE);
  });

  test("SEC-C23f an outsider cannot create a bundle in another workspace", securityTestDetails("SEC-C23f"), async ({ page, apiUser, actor }) => {
    const { a, b } = await bundleSceneOf(page, apiUser, actor);

    const answer = await apiRaw(b.request, "POST", API_PATHS.BUNDLES, { data: { orgId: a.orgId, name: OUTSIDER_BUNDLE } });

    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the outsider creates a bundle in OA");
    const bundlesOfA = await apiRaw(a.request, "GET", API_PATHS.BUNDLE_LIST);
    expectAnswer(bundlesOfA, OK, "A lists its bundles");
    expect(bundlesOfA.body, "after: no bundle of the outsider in OA").not.toContain(OUTSIDER_BUNDLE);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// Roles inside one workspace (R17): D (developer) owns the bundle, M and E2 hold what a row names.
// ---------------------------------------------------------------------------------------------------------------

const APP_OF_DEVELOPER = "e2e-sec-app-d";
const BUNDLE_OF_MEMBER = "e2e-sec-bundle-by-member";

/** D, a developer of OA, with its bundle `bD` that holds its app. */
async function developerBundle(page: Page, apiUser: RegisteredUser, actor: (tag: string) => Promise<Actor>) {
  const scene = await sceneOf(page, apiUser);
  const d = await memberOf(scene.a, actor, "developer");
  await makeDeveloper(scene.a, d);
  const bundleId = await createBundle(d.request, { orgId: scene.a.orgId, name: BUNDLE_NAME });
  const { appId } = await createApp(d.request, { orgId: scene.a.orgId, name: APP_OF_DEVELOPER });
  await addAppToBundle(d.request, appId, bundleId);
  return { ...scene, d, bundleId, appId };
}

/** Whether the bundle is in the trash, as its creator lists it. */
async function inTrash(request: Actor["request"], bundleId: string): Promise<boolean> {
  return (await apiRaw(request, "GET", BUNDLE_RECYCLE_LIST_PATH)).body.includes(bundleId);
}

test.describe("security: bundles inside one workspace", () => {
  test("SEC-R17a+ a developer creates a bundle, adds its app and shares it as viewer", securityTestDetails("SEC-R17a+"), async ({ page, apiUser, actor }) => {
    const { a, d, bundleId, appId } = await developerBundle(page, apiUser, actor);
    const m = await memberOf(a, actor, "member");
    expectAnswer(await apiRaw(m.request, "GET", bundleViewPath(bundleId)), API_ERRORS.NO_PERMISSION_TO_REQUEST_APP, "before: M cannot view the bundle");
    expect((await bundleElementsRaw(d.request, bundleId)).body, "D's bundle holds its app").toContain(appId);

    await grantBundlePermission(d.request, bundleId, { role: APP_ROLES.VIEWER, userIds: [m.userId] });

    const view = await apiRaw(m.request, "GET", bundleViewPath(bundleId));
    expectAnswer(view, OK, "after: M views the bundle");
    expect(view.body, "and sees its name").toContain(BUNDLE_NAME);
  });

  test("SEC-R17b a member whose own workspace is current cannot create a bundle in another workspace", securityTestDetails("SEC-R17b"), async ({ page, apiUser, actor }) => {
    const { a } = await sceneOf(page, apiUser);
    const m = await memberOf(a, actor, "member");
    await switchOrganization(m.request, m.orgId);
    expect((await currentUser(m.request)).currentOrgId, "setup: M's own workspace is current").toBe(m.orgId);

    const answer = await apiRaw(m.request, "POST", API_PATHS.BUNDLES, { data: { orgId: a.orgId, name: BUNDLE_OF_MEMBER } });

    // Desired: the refusal of a plain member (R06a). The dev check reads the CURRENT workspace, where M is admin (SF-36, open on HEAD).
    expectAnswer(answer, API_ERRORS.NEED_DEV_TO_CREATE_RESOURCE, "the member's bundle create with its own workspace current");
    expect((await apiRaw(a.request, "GET", API_PATHS.BUNDLE_LIST)).body, "after: no bundle of M in OA").not.toContain(BUNDLE_OF_MEMBER);
  });

  test("SEC-R17c a bundle viewer without a grant on the app does not get the app's editing DSL", securityTestDetails("SEC-R17c"), async ({ page, apiUser, actor }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const m = await memberOf(a, actor, "member");
    const bundleId = await createBundle(a.request, { orgId: a.orgId, name: BUNDLE_NAME });
    await addAppToBundle(a.request, seeded.appId, bundleId);
    await grantBundlePermission(a.request, bundleId, { role: APP_ROLES.VIEWER, userIds: [m.userId] });
    expectAnswer(await apiRaw(m.request, "GET", bundleViewPath(bundleId)), OK, "before: M may view the bundle");
    expectAnswer(await apiRaw(m.request, "GET", applicationPath(seeded.appId)), API_ERRORS.NO_PERMISSION_TO_REQUEST_APP, "before: M has no right on the app itself");
    const own = await bundleElementsRaw(a.request, bundleId);
    expect(own.body, "before: A's elements carry the app's DSL (so the check below can see it)").toContain(SEEDED_BUTTON_TEXT);

    const answer = await bundleElementsRaw(m.request, bundleId);

    // Desired: the viewer lists the elements (200) but gets no editing DSL of an app it may not open (SF-37, open on HEAD: the
    // elements are whole Application objects). The status is asserted so that a 4xx, 5xx or empty body cannot satisfy the absences.
    expectAnswer(answer, OK, "M's elements answer");
    expect(answer.body, "M's elements answer carries no DSL of the app").not.toContain(SEEDED_BUTTON_TEXT);
    expect(answer.body, "and no test id of its button").not.toContain(SEEDED_BUTTON_TEST_ID);
  });

  test("SEC-R17d a bundle viewer can neither recycle nor delete the bundle", securityTestDetails("SEC-R17d"), async ({ page, apiUser, actor }) => {
    const { a, d, bundleId } = await developerBundle(page, apiUser, actor);
    const m = await memberOf(a, actor, "member");
    await grantBundlePermission(d.request, bundleId, { role: APP_ROLES.VIEWER, userIds: [m.userId] });
    expectAnswer(await apiRaw(m.request, "GET", bundleViewPath(bundleId)), OK, "before: M holds the viewer right");
    expect(await inTrash(d.request, bundleId), "before: the bundle is not in the trash").toBe(false);

    const recycled = await apiRaw(m.request, "PUT", bundleRecyclePath(bundleId));

    expectAnswer(recycled, API_ERRORS.NOT_AUTHORIZED, "the viewer's recycle");
    expect(await inTrash(d.request, bundleId), "after: still not in the trash").toBe(false);
    expectAnswer(await apiRaw(d.request, "GET", bundleViewPath(bundleId)), OK, "and D still views it as a normal bundle");
    // The creator recycles (the 3.0.0 server answers 500 / 5005 after doing it: `recycleBundle` tolerates exactly that), so
    // the delete below passes the state check and the role decides.
    await recycleBundle(d.request, bundleId);
    expect(await inTrash(d.request, bundleId), "setup: the bundle is in the trash").toBe(true);

    const deleted = await apiRaw(m.request, "DELETE", bundlePath(bundleId));

    expectAnswer(deleted, API_ERRORS.NOT_AUTHORIZED, "the viewer's delete of the recycled bundle");
    expect(await inTrash(d.request, bundleId), "after: the bundle is still in the trash").toBe(true);
  });

  test("SEC-R17f a bundle's creator can recycle it", securityTestDetails("SEC-R17f"), async ({ page, apiUser, actor }) => {
    const { d, bundleId } = await developerBundle(page, apiUser, actor);
    expect(await inTrash(d.request, bundleId), "before: the bundle is not in the trash").toBe(false);

    const answer = await apiRaw(d.request, "PUT", bundleRecyclePath(bundleId));

    // Desired: success. The 3.0.0 server sets the status and then answers 500 / 5005 (SF-41); the read-back below holds on it too.
    expectAnswer(answer, OK, "the creator's recycle");
    expect(await inTrash(d.request, bundleId), "after: the bundle is in the trash").toBe(true);
  });

  test("SEC-R17e a bundle editor cannot grant the owner role", securityTestDetails("SEC-R17e"), async ({ page, apiUser, actor }) => {
    const { a, d, bundleId } = await developerBundle(page, apiUser, actor);
    const e2 = await memberOf(a, actor, "editor2");
    const m = await memberOf(a, actor, "member");
    await grantBundlePermission(d.request, bundleId, { role: APP_ROLES.EDITOR, userIds: [e2.userId] });
    expectAnswer(await apiRaw(e2.request, "GET", bundleViewPath(bundleId)), OK, "before: E2 holds the editor right");
    expectAnswer(await apiRaw(m.request, "PUT", bundleRecyclePath(bundleId)), API_ERRORS.NOT_AUTHORIZED, "before: M cannot recycle the bundle");

    const answer = await apiRaw(e2.request, "POST", bundlePermissionsPath(bundleId), {
      data: { role: APP_ROLES.OWNER, userIds: [m.userId], groupIds: [] },
    });

    // The permission list of a bundle fails for every caller on 3.0.0, so the read-back is behavioural:
    // had M become the owner, its recycle would now be allowed.
    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the editor's grant of owner");
    expectAnswer(await apiRaw(m.request, "PUT", bundleRecyclePath(bundleId)), API_ERRORS.NOT_AUTHORIZED, "after: M's recycle is still denied, so M is not an owner");
    expect(await inTrash(d.request, bundleId), "and the bundle is not in the trash").toBe(false);
  });
});
