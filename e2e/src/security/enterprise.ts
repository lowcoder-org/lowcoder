import { expect } from "@playwright/test";
import { listOrgMembers } from "../api/client";
import { ORG_ROLES } from "../constants";
import { makeAdmin, type Actor } from "./actors";
import type { ActorFactory } from "./scene";
import type { SuperAdmin } from "./super-admin";

/** Role-tag of the e-mail of the workspace admin `enterpriseAdmin` makes. */
export const ENTERPRISE_ADMIN_TAG = "admin";

/**
 * Admin A' of the ONE workspace of the ENTERPRISE stack. A new actor signs up (it joins the enterprise workspace as a
 * plain member, `actor.orgId` is that workspace) and the instance super admin S promotes it through
 * `PUT /api/organizations/{orgId}/role`, the only way to get an admin there: no workspace of its own exists to be admin of.
 * Throws (a failed setup) when the member list does not show A' as `admin` afterwards. S itself is never touched: the
 * workspace is shared by every test of the run, so no test removes, demotes or re-passwords S (SEC-E05 aside, which runs
 * alone). Limit: it reads S's own view of the member list, so it needs S's session, and it says nothing about the other
 * members of the workspace.
 */
export async function enterpriseAdmin(superAdmin: SuperAdmin, actor: ActorFactory, tag: string = ENTERPRISE_ADMIN_TAG): Promise<Actor> {
  const admin = await actor(tag);
  await makeAdmin({ request: superAdmin.request, orgId: admin.orgId }, admin);
  const role = (await listOrgMembers(superAdmin.request, admin.orgId)).find((member) => member.userId === admin.userId)?.role;
  expect(role, "setup: the actor is an admin of the enterprise workspace").toBe(ORG_ROLES.ADMIN);
  return admin;
}
