import {
  addGroupMember,
  apiRaw,
  createGroup,
  getApp,
  grantAppPermission,
  listGroupMembers,
  removeGroupMember,
  viewAppRaw,
} from "../../src/api/client";
import {
  API_ERRORS,
  API_OK,
  APP_ROLES,
  ORG_ROLES,
  applicationPath,
  groupAddMemberPath,
  groupRolePath,
  orgRolePath,
} from "../../src/constants";
import { appDsl, button } from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";
import { EditorPage } from "../../src/pages/EditorPage";
import {
  SEEDED_BUTTON_ID,
  SEEDED_BUTTON_NAME,
  SEEDED_BUTTON_TEST_ID,
  makeDeveloper,
  type Actor,
  type ApiUserAsOwner,
} from "../../src/security/actors";
import { expectAnswer } from "../../src/security/assertions";
import { securityTestDetails } from "../../src/security/quarantine";
import { memberOf, roleOf, sceneOf, type Scene } from "../../src/security/scene";

/**
 * Group grants and group administration (R05 and R14). A (the `apiUser`, admin of OA) owns the private app and a
 * custom group `gA`; G, M, D, E join OA as plain members and get exactly the rights a row names. Nothing is shared between tests.
 */

const GROUP_NAME = "e2e-sec-group-a";
const FIRST_EDIT = "Edited by the group (first)";
const SECOND_EDIT = "Edited by the group (second)";
const ALLOWED = { status: 200, code: API_OK } as const;

function dslWithText(text: string): object {
  return appDsl([button({ id: SEEDED_BUTTON_ID, name: SEEDED_BUTTON_NAME, text, testId: SEEDED_BUTTON_TEST_ID })]);
}

/** G is a member of group `gA` which holds `role` on A's app. */
async function groupHolding(
  scene: Scene,
  actor: (tag: string) => Promise<Actor>,
  role: (typeof APP_ROLES)[keyof typeof APP_ROLES],
): Promise<{ g: Actor; groupId: string }> {
  const g = await memberOf(scene.a, actor, "grouped");
  const groupId = await createGroup(scene.a.request, GROUP_NAME);
  await grantAppPermission(scene.a.request, scene.seeded.appId, { role, userIds: [], groupIds: [groupId] });
  return { g, groupId };
}

const memberIdsOf = async (a: ApiUserAsOwner, groupId: string) => (await listGroupMembers(a.request, groupId)).map((member) => member.userId);

test.describe("security: group grants", () => {
  test("SEC-R05a+ a member of a group that holds editor may update the app", securityTestDetails("SEC-R05a+"), async ({ page, apiUser, actor }) => {
    const scene = await sceneOf(page, apiUser);
    const { a, seeded } = scene;
    const { g, groupId } = await groupHolding(scene, actor, APP_ROLES.EDITOR);
    expectAnswer(await apiRaw(g.request, "GET", applicationPath(seeded.appId)), API_ERRORS.NO_PERMISSION_TO_REQUEST_APP, "before: G is not in the group yet");

    await addGroupMember(a.request, groupId, g.userId, ORG_ROLES.MEMBER);
    const answer = await apiRaw(g.request, "PUT", applicationPath(seeded.appId), { data: { editingApplicationDSL: dslWithText(FIRST_EDIT) } });

    expectAnswer(answer, ALLOWED, "the group member's update");
    expect(JSON.stringify((await getApp(a.request, seeded.appId)).dsl), "the edit is stored").toContain(FIRST_EDIT);
  });

  test("SEC-R05b a member removed from the group loses the right at once", securityTestDetails("SEC-R05b"), async ({ page, apiUser, actor }) => {
    const scene = await sceneOf(page, apiUser);
    const { a, seeded } = scene;
    const { g, groupId } = await groupHolding(scene, actor, APP_ROLES.EDITOR);
    await addGroupMember(a.request, groupId, g.userId, ORG_ROLES.MEMBER);
    expectAnswer(
      await apiRaw(g.request, "PUT", applicationPath(seeded.appId), { data: { editingApplicationDSL: dslWithText(FIRST_EDIT) } }),
      ALLOWED,
      "before: the group member updates the app",
    );
    const editor = new EditorPage(g.session.page);
    await editor.open(seeded.appId, { settleGrid: false });
    await expect(editor.readyMarker, "before: G's editor page is open and ready").toHaveCount(1);

    await removeGroupMember(a.request, groupId, g.userId);
    const answer = await apiRaw(g.request, "PUT", applicationPath(seeded.appId), { data: { editingApplicationDSL: dslWithText(SECOND_EDIT) } });

    expectAnswer(answer, API_ERRORS.NO_PERMISSION_TO_REQUEST_APP, "the removed member's update with the same session");
    const stored = JSON.stringify((await getApp(a.request, seeded.appId)).dsl);
    expect(stored, "after: the first edit is still there").toContain(FIRST_EDIT);
    expect(stored, "and the second never arrived").not.toContain(SECOND_EDIT);
    await g.session.page.reload();
    await expect(editor.permissionDeniedMessage, "G's editor page shows the error page after a reload").toBeVisible();
    await expect(editor.canvas, "and no canvas").toHaveCount(0);
  });

  test("SEC-R05c a member of a group that holds viewer only cannot update the app", securityTestDetails("SEC-R05c"), async ({ page, apiUser, actor }) => {
    const scene = await sceneOf(page, apiUser);
    const { a, seeded } = scene;
    const { g, groupId } = await groupHolding(scene, actor, APP_ROLES.VIEWER);
    await addGroupMember(a.request, groupId, g.userId, ORG_ROLES.MEMBER);
    expect(await viewAppRaw(g.request, seeded.appId), "before: the group's viewer right works").toMatchObject({ status: 200, code: API_OK });
    const before = JSON.stringify((await getApp(a.request, seeded.appId)).dsl);

    const answer = await apiRaw(g.request, "PUT", applicationPath(seeded.appId), { data: { editingApplicationDSL: dslWithText(FIRST_EDIT) } });

    expectAnswer(answer, API_ERRORS.NO_PERMISSION_TO_REQUEST_APP, "the viewer group member's update");
    expect(JSON.stringify((await getApp(a.request, seeded.appId)).dsl), "after: the DSL is unchanged").toBe(before);
  });
});

test.describe("security: group administration", () => {
  test("SEC-R14a+ a group admin may add members to its group", securityTestDetails("SEC-R14a+"), async ({ page, apiUser, actor }) => {
    const { a } = await sceneOf(page, apiUser);
    const m = await memberOf(a, actor, "group-admin");
    const d = await memberOf(a, actor, "developer");
    const groupId = await createGroup(a.request, GROUP_NAME);
    await addGroupMember(a.request, groupId, m.userId, ORG_ROLES.ADMIN);
    expect(await memberIdsOf(a, groupId), "before: D is not in the group").not.toContain(d.userId);

    const answer = await apiRaw(m.request, "POST", groupAddMemberPath(groupId), { data: { userId: d.userId, role: ORG_ROLES.MEMBER } });

    expectAnswer(answer, ALLOWED, "the group admin's add");
    expect(await memberIdsOf(a, groupId), "after: D is in the group").toContain(d.userId);
  });

  test("SEC-R14b a group member who is not a group admin cannot add members", securityTestDetails("SEC-R14b"), async ({ page, apiUser, actor }) => {
    const { a } = await sceneOf(page, apiUser);
    const d = await memberOf(a, actor, "developer");
    const e = await memberOf(a, actor, "editor");
    await makeDeveloper(a, d);
    const groupId = await createGroup(a.request, GROUP_NAME);
    await addGroupMember(a.request, groupId, d.userId, ORG_ROLES.MEMBER);
    const before = await memberIdsOf(a, groupId);
    expect(before, "before: D is a member").toContain(d.userId);
    expect(before, "and E is not").not.toContain(e.userId);

    const answer = await apiRaw(d.request, "POST", groupAddMemberPath(groupId), { data: { userId: e.userId, role: ORG_ROLES.MEMBER } });

    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the plain group member's add");
    expect(await memberIdsOf(a, groupId), "after: the members are exactly as before").toEqual(before);
  });

  test("SEC-R14c a group super_admin role is a group manager only (characterisation)", securityTestDetails("SEC-R14c"), async ({ page, apiUser, actor }) => {
    const { a } = await sceneOf(page, apiUser);
    const m = await memberOf(a, actor, "group-admin");
    const d = await memberOf(a, actor, "developer");
    const e = await memberOf(a, actor, "editor");
    const groupId = await createGroup(a.request, GROUP_NAME);
    await addGroupMember(a.request, groupId, m.userId, ORG_ROLES.ADMIN);
    await addGroupMember(a.request, groupId, d.userId, ORG_ROLES.MEMBER);
    const roleInGroup = async () => (await listGroupMembers(a.request, groupId)).find((member) => member.userId === d.userId)?.role;
    expect(await roleInGroup(), "before: D is a plain group member").toBe(ORG_ROLES.MEMBER);

    // A role the client never offers (constants/orgConstants.ts:10): any MemberRole is accepted by the group role route.
    const changed = await apiRaw(m.request, "PUT", groupRolePath(groupId), { data: { userId: d.userId, role: ORG_ROLES.SUPER_ADMIN } });
    expectAnswer(changed, ALLOWED, "the group admin's role change to super_admin");
    expect(await roleInGroup(), "D holds super_admin in the group").toBe(ORG_ROLES.SUPER_ADMIN);

    const promoted = await apiRaw(d.request, "PUT", orgRolePath(a.orgId), { data: { userId: d.userId, role: ORG_ROLES.ADMIN } });
    const added = await apiRaw(d.request, "POST", groupAddMemberPath(groupId), { data: { userId: e.userId, role: ORG_ROLES.MEMBER } });

    expectAnswer(promoted, API_ERRORS.NOT_AUTHORIZED, "D's workspace self-promotion: the group role is no workspace role");
    expect(await roleOf(a, d.userId), "D is still a plain workspace member").toBe(ORG_ROLES.MEMBER);
    expectAnswer(added, ALLOWED, "D's group add: a group super_admin manages the group");
    expect(await memberIdsOf(a, groupId), "E is in the group").toContain(e.userId);
  });
});
