import type { APIRequestContext } from "@playwright/test";
import {
  acceptInvitation,
  addGroupMember,
  createApp,
  createInvitation,
  createPostgresDatasource,
  currentUserId,
  grantAppPermission,
  listGroups,
  publishApp,
  type RegisteredUser,
  switchOrganization,
  updateMemberRole,
} from "../api/client";
import { ORG_ROLES, type AppRole } from "../constants";
import { postgresConnection } from "../postgres";
import { appDsl, button } from "../dsl/builders";
import { selectProductsQuery } from "../datasource/notes-queries";
import type { UserSession } from "../fixtures";

/**
 * A signed-in user of a security test: its own browser context (own cookies) and its own SAAS workspace, of which it
 * is the admin. The `actor` fixture of src/fixtures.ts builds it and closes its context after the test.
 *
 * `orgId` is the actor's OWN workspace and stays so after `joinWorkspace`; the workspace it joined is the owner's.
 */
export interface Actor {
  session: UserSession;
  /** The request context of `session` (its `page.request`): the session cookie is in it. Owned by the fixture. */
  request: APIRequestContext;
  email: string;
  userId: string;
  orgId: string;
}

/**
 * What a helper needs of the user who owns a workspace: its request context and its workspace id. An `Actor` fits, and
 * so does the `apiUser` fixture's user as `{ request: page.request, orgId: apiUser.orgId }`.
 */
export type WorkspaceOwner = Pick<Actor, "request" | "orgId">;

/** What a helper needs of the user it adds to a workspace or grants a right to. */
export type WorkspaceGuest = Pick<Actor, "request" | "userId">;

/**
 * The owner invites, the guest accepts, and the guest makes the owner's workspace its CURRENT one. The explicit switch
 * matters: `OrgDevChecker.checkCurrentOrgDev` and the group and folder routes read the visitor's current workspace
 * (`api/usermanagement/OrgDevChecker.java:38-46`), so a guest whose current workspace is its own would be tested
 * against the wrong one. Whether accepting already switches is measured in tests/foundation/security-helpers.spec.ts.
 */
export async function joinWorkspace(owner: WorkspaceOwner, guest: WorkspaceGuest): Promise<void> {
  const inviteCode = await createInvitation(owner.request, owner.orgId);
  await acceptInvitation(guest.request, inviteCode);
  await switchOrganization(guest.request, owner.orgId);
}

/**
 * Adds the guest to the developer group of the owner's workspace. The guest must already be a member (`joinWorkspace`).
 * The owner's current workspace has to be `owner.orgId` (it is, until the owner switches): the groups listed are those
 * of the owner's current workspace. Throws when that workspace has no developer group.
 */
export async function makeDeveloper(owner: WorkspaceOwner, guest: WorkspaceGuest): Promise<void> {
  const devGroup = (await listGroups(owner.request)).find((group) => group.devGroup);
  if (!devGroup) {
    throw new Error(`the workspace ${owner.orgId} has no developer group in the group list of its owner`);
  }
  await addGroupMember(owner.request, devGroup.groupId, guest.userId, ORG_ROLES.MEMBER);
}

/** Makes the guest an admin of the owner's workspace. */
export async function makeAdmin(owner: WorkspaceOwner, guest: WorkspaceGuest): Promise<void> {
  await updateMemberRole(owner.request, owner.orgId, guest.userId, ORG_ROLES.ADMIN);
}

/** A user grant (not a group grant: use `grantAppPermission` with `groupIds` for that) on the app. */
export async function grantApp(owner: WorkspaceOwner, appId: string, guest: WorkspaceGuest, role: AppRole): Promise<void> {
  await grantAppPermission(owner.request, appId, { role, userIds: [guest.userId] });
}

/** Test id of the button of the app `seedPrivateApp` builds: a view that renders it was allowed to render the app. */
export const SEEDED_BUTTON_TEST_ID = "e2e-sec-a";
/** Visible text of that button. */
export const SEEDED_BUTTON_TEXT = "Private app";
/** DSL item id of the button, id and name of its query (fixed: scenarios address the query by id). */
export const SEEDED_BUTTON_ID = "b1";
export const SEEDED_BUTTON_NAME = "button1";
export const SEEDED_QUERY_ID = "q1";
/** Default name of the seeded app; a test that creates several passes its own. */
export const SEEDED_APP_NAME = "e2e-sec-private";
/** Name of the PostgreSQL data source `seedPrivateApp` creates when it is not handed one. */
export const SEEDED_DATASOURCE_NAME = "e2e-sec-ds";

export interface SeededApp {
  appId: string;
  appGid?: string;
  datasourceId: string;
  queryId: string;
  /** Name of the query in the DSL (`selectProducts`: a read-only query, it runs on opening). */
  queryName: string;
}

/**
 * A private, published app of the owner's workspace: one button (`SEEDED_BUTTON_TEST_ID`) and one read-only PostgreSQL
 * query with the fixed id `SEEDED_QUERY_ID` on a data source of the same workspace. Nothing is shared and the app is not
 * public: only the owner (and the workspace's admins) may open it. The data source is created with the PostgreSQL
 * sidecar's connection unless `datasourceId` names an existing one. It needs the sidecar (`E2E_POSTGRES_HOST`).
 */
export async function seedPrivateApp(
  owner: WorkspaceOwner,
  options: { name?: string; datasourceId?: string } = {},
): Promise<SeededApp> {
  const datasourceId =
    options.datasourceId ??
    (await createPostgresDatasource(owner.request, {
      orgId: owner.orgId,
      name: SEEDED_DATASOURCE_NAME,
      connection: postgresConnection(),
    }));
  const query = selectProductsQuery(datasourceId, SEEDED_QUERY_ID) as { name: string };
  const dsl = appDsl(
    [button({ id: SEEDED_BUTTON_ID, name: SEEDED_BUTTON_NAME, text: SEEDED_BUTTON_TEXT, testId: SEEDED_BUTTON_TEST_ID })],
    { queries: [query] },
  );
  const { appId, appGid } = await createApp(owner.request, { orgId: owner.orgId, name: options.name ?? SEEDED_APP_NAME, dsl });
  await publishApp(owner.request, appId);
  return { appId, appGid, datasourceId, queryId: SEEDED_QUERY_ID, queryName: query.name };
}

/** The `apiUser` fixture's user as a workspace owner: its request context, workspace, user id and e-mail. */
export type ApiUserAsOwner = WorkspaceOwner & WorkspaceGuest & { email: string };

/**
 * Makes the `apiUser` fixture's user (registered in the test's own browser context, admin of its own workspace) usable as
 * the victim or owner of a security scenario: `request` is the `page.request` of that context (pass it), `user` is the
 * fixture's value. Reads the user id once.
 */
export async function adminOfApiUser(request: APIRequestContext, user: RegisteredUser): Promise<ApiUserAsOwner> {
  return { request, orgId: user.orgId, email: user.email, userId: await currentUserId(request) };
}
