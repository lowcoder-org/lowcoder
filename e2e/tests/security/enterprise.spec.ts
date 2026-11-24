import { apiRaw, createApiKey, currentUser, listOrgMembers, signIn } from "../../src/api/client";
import {
  API_ERRORS,
  API_OK,
  API_PATHS,
  AUTHORIZATION_HEADER,
  AUTH_ID_EMAIL,
  AUTH_SOURCE_EMAIL,
  BEARER_PREFIX,
  ORG_ROLES,
  TAGS,
  TEST_PASSWORD,
  orgRemoveMemberPath,
  orgsByUserPath,
} from "../../src/constants";
import { expect, test, uniqueEmail } from "../../src/fixtures";
import { expectAnswer } from "../../src/security/assertions";
import { enterpriseAdmin } from "../../src/security/enterprise";
import { securityTestDetails } from "../../src/security/quarantine";

/**
 * The second stack: the all-in-one image with LOWCODER_WORKSPACE_MODE=ENTERPRISE (`E2E_STACK_PROFILE=enterprise`, see
 * e2e/scripts/run-in-docker.sh). Every test carries `@enterprise`: the default stack never runs them and the enterprise
 * profile runs nothing else.
 *
 * Gate, from the repository root:
 *   E2E_STACK_PROFILE=enterprise e2e/scripts/run-in-docker.sh --repeat-each=10 --workers=4 tests/security/enterprise.spec.ts
 * SEC-E05 is in tests/security/enterprise-takeover.spec.ts, on a stack of its own.
 *
 * Measured on the 3.0.0 image (the container passes LOWCODER_WORKSPACE_MODE and the super-admin variables on): the super
 * admin's own workspace is the enterprise workspace OE, every signed-up user is a plain member of it (`actor.orgId` is
 * OE), a second workspace cannot be created, and removing a member marks the user deleted
 * (`UserServiceImpl.markUserDeletedAndInvalidConnectionsAtEnterpriseMode`: state DELETED, enabled false, connection
 * sources renamed), after which neither the session nor an API key of the user resolves (`SessionUserServiceImpl`).
 *
 * ONE workspace is shared by every test of the run, and by the repeats and workers of a gate run. So a test names only its
 * own users and ids, never counts the members of OE, and never removes, demotes or re-passwords the super admin S. Each test
 * signs up its own users; S makes one of them admin A' (`enterpriseAdmin`). Many admins accumulate in OE over a run.
 */

const API_KEY_NAME = "e2e-sec-enterprise-key";
const ALLOWED = { status: 200, code: API_OK } as const;
const MEMBER_TAG = "user";
const ADMIN_TAG = "admin";
const UNKNOWN_ADDRESS_TAG = "nobody";

/**
 * File-wide (trace/screenshot/video cannot be set in a describe group: Playwright forces a new worker and refuses).
 * SEC-E07a/b reset a password and must keep it out of every artifact; applying this to the whole file costs nothing,
 * since it only removes debugging artifacts and changes no assertion.
 */
test.use({ trace: "off", screenshot: "off", video: "off" });

function bearer(token: string): Record<string, string> {
  return { [AUTHORIZATION_HEADER]: `${BEARER_PREFIX}${token}` };
}

/** The workspace ids of an `orgs by user` answer (`data[].orgId`), `undefined` when the body has another shape. */
function orgIdsOf(json: unknown): string[] | undefined {
  const data = (json as { data?: unknown } | undefined)?.data;
  return Array.isArray(data) ? data.map((entry) => (entry as { orgId: string }).orgId) : undefined;
}

test.describe("security: the ENTERPRISE stack", () => {
  test(
    "SEC-E01 a new user joins the one enterprise workspace of the super admin as a plain member",
    securityTestDetails("SEC-E01", [TAGS.ENTERPRISE, TAGS.SUPERADMIN]),
    async ({ actor, superAdmin }) => {
      const u = await actor(MEMBER_TAG);

      const me = await currentUser(u.request);
      const superAdminMe = await currentUser(superAdmin.request);

      expect(me.orgAndRoles.map((entry) => ({ orgId: entry.org.id, role: entry.role })), "U has exactly one workspace, OE, as a plain member").toEqual([
        { orgId: u.orgId, role: ORG_ROLES.MEMBER },
      ]);
      expect(superAdminMe.orgAndRoles.map((entry) => ({ orgId: entry.org.id, role: entry.role })), "S's only workspace is OE, as super admin").toEqual([
        { orgId: u.orgId, role: ORG_ROLES.SUPER_ADMIN },
      ]);
      expect(superAdminMe.orgAndRoles[0]?.org.name, "OE is the workspace the super admin's start-up job created for it").toContain(superAdmin.email);
      const members = await listOrgMembers(superAdmin.request, u.orgId);
      expect(members.find((member) => member.userId === superAdmin.userId)?.role, "S is super_admin in the member list of OE").toBe(ORG_ROLES.SUPER_ADMIN);
      expect(members.find((member) => member.userId === u.userId)?.role, "U is a member in the member list of OE").toBe(ORG_ROLES.MEMBER);
    },
  );

  test(
    "SEC-E02 a removed user's session stops working at once",
    securityTestDetails("SEC-E02", [TAGS.ENTERPRISE, TAGS.SUPERADMIN]),
    async ({ actor, superAdmin }) => {
      const a = await enterpriseAdmin(superAdmin, actor, ADMIN_TAG);
      const u = await actor(MEMBER_TAG);
      expectAnswer(await apiRaw(u.request, "GET", API_PATHS.USER_MY_ORG), ALLOWED, "before: U's session works");

      expectAnswer(await apiRaw(a.request, "DELETE", orgRemoveMemberPath(a.orgId), { params: { userId: u.userId } }), ALLOWED, "A's removal of U");

      expectAnswer(await apiRaw(u.request, "GET", API_PATHS.USER_MY_ORG), API_ERRORS.UNAUTHENTICATED, "after: U's old session");
      expectAnswer(await apiRaw(a.request, "GET", API_PATHS.USER_MY_ORG), ALLOWED, "control: A's own session still works");
      expect((await listOrgMembers(a.request, a.orgId)).some((member) => member.userId === u.userId), "U is gone from the member list of OE").toBe(false);
    },
  );

  test(
    "SEC-E03 a removed user's API key stops working at once",
    securityTestDetails("SEC-E03", [TAGS.ENTERPRISE, TAGS.SUPERADMIN]),
    async ({ actor, superAdmin, newUserSession }) => {
      const a = await enterpriseAdmin(superAdmin, actor, ADMIN_TAG);
      const u = await actor(MEMBER_TAG);
      const anonymous = (await newUserSession()).page.request;
      const key = await createApiKey(u.request, API_KEY_NAME);
      const adminKey = await createApiKey(a.request, API_KEY_NAME);
      expectAnswer(await apiRaw(anonymous, "GET", API_PATHS.USER_MY_ORG, { headers: bearer(key.token) }), ALLOWED, "before: U's key authenticates");

      expectAnswer(await apiRaw(a.request, "DELETE", orgRemoveMemberPath(a.orgId), { params: { userId: u.userId } }), ALLOWED, "A's removal of U");

      expectAnswer(await apiRaw(anonymous, "GET", API_PATHS.USER_MY_ORG, { headers: bearer(key.token) }), API_ERRORS.UNAUTHENTICATED, "after: U's key");
      expectAnswer(await apiRaw(anonymous, "GET", API_PATHS.USER_MY_ORG, { headers: bearer(adminKey.token) }), ALLOWED, "control: A's own key still authenticates");
    },
  );

  test(
    "SEC-E04 a removed user cannot sign in again with its password",
    securityTestDetails("SEC-E04", [TAGS.ENTERPRISE, TAGS.SUPERADMIN]),
    async ({ actor, superAdmin, newUserSession }) => {
      const a = await enterpriseAdmin(superAdmin, actor, ADMIN_TAG);
      const u = await actor(MEMBER_TAG);
      const beforeRemoval = (await newUserSession()).page.request;
      await signIn(beforeRemoval, u.email);
      expectAnswer(await apiRaw(beforeRemoval, "GET", API_PATHS.USER_MY_ORG), ALLOWED, "before: U's password gives a working session");
      expectAnswer(await apiRaw(a.request, "DELETE", orgRemoveMemberPath(a.orgId), { params: { userId: u.userId } }), ALLOWED, "A's removal of U");
      const afterRemoval = (await newUserSession()).page.request;

      const login = await apiRaw(afterRemoval, "POST", API_PATHS.LOGIN, {
        data: { loginId: u.email, password: TEST_PASSWORD, register: false, source: AUTH_SOURCE_EMAIL, authId: AUTH_ID_EMAIL },
      });

      // The property is "no working session"; the exact refusal is what the 3.0.0 image answers (measured): the deleted user's
      // connection sources are renamed, so the form login finds no account, the answer of a wrong password.
      expectAnswer(login, API_ERRORS.INVALID_PASSWORD, "U's sign-in after the removal");
      expectAnswer(await apiRaw(afterRemoval, "GET", API_PATHS.USER_MY_ORG), API_ERRORS.UNAUTHENTICATED, "after: the context that tried to sign in has no session");
      expectAnswer(await apiRaw(beforeRemoval, "GET", API_PATHS.USER_MY_ORG), API_ERRORS.UNAUTHENTICATED, "after: the session U had before the removal is dead too");
    },
  );

  test(
    "SEC-E06a nobody creates a second workspace, the super admin included",
    securityTestDetails("SEC-E06a", [TAGS.ENTERPRISE, TAGS.SUPERADMIN]),
    async ({ actor, superAdmin }) => {
      const a = await enterpriseAdmin(superAdmin, actor, ADMIN_TAG);
      expectAnswer(await apiRaw(a.request, "GET", API_PATHS.USER_MY_ORG), ALLOWED, "setup: A's session works, so the denial is not an unauthenticated call");
      expectAnswer(await apiRaw(superAdmin.request, "GET", API_PATHS.USER_MY_ORG), ALLOWED, "setup: S's session works");

      const byAdmin = await apiRaw(a.request, "POST", API_PATHS.ORGANIZATIONS, { data: { name: "e2e-sec-second-workspace" } });
      const bySuperAdmin = await apiRaw(superAdmin.request, "POST", API_PATHS.ORGANIZATIONS, { data: { name: "e2e-sec-second-workspace" } });

      expectAnswer(byAdmin, API_ERRORS.UNSUPPORTED_OPERATION, "A's creation of a workspace");
      expectAnswer(bySuperAdmin, API_ERRORS.UNSUPPORTED_OPERATION, "S's creation of a workspace");
      expect((await currentUser(a.request)).orgAndRoles.map((entry) => entry.org.id), "A still has the one workspace").toEqual([a.orgId]);
    },
  );

  test(
    "SEC-E06b the workspace lookup by e-mail address tells nothing about the address (characterisation)",
    securityTestDetails("SEC-E06b", [TAGS.ENTERPRISE]),
    async ({ actor, newUserSession }, testInfo) => {
      const u = await actor(MEMBER_TAG);
      const anonymous = (await newUserSession()).page.request;
      const unknown = uniqueEmail(UNKNOWN_ADDRESS_TAG, testInfo.workerIndex);

      const known = await apiRaw(anonymous, "GET", orgsByUserPath(u.email));
      const unknownAnswer = await apiRaw(anonymous, "GET", orgsByUserPath(unknown));

      expectAnswer(known, ALLOWED, "the lookup of U's address");
      expectAnswer(unknownAnswer, ALLOWED, "the lookup of an address nobody signed up with");
      expect(orgIdsOf(known.json), "the workspaces listed for U's address: OE only").toEqual([u.orgId]);
      expect(orgIdsOf(unknownAnswer.json), "the same list for an unknown address: no account oracle in this mode").toEqual([u.orgId]);
    },
  );
});

/** SEC-E07a, SEC-E07b: an admin password reset and the sessions of the reset user (D-34). The reset answer carries a new
 * password, so no artifact of these tests keeps a response body and no assertion receives one. */
test.describe("security: the ENTERPRISE stack, sessions after a password reset", () => {
  test(
    "SEC-E07a an admin's reset of a member's password ends the member's sessions",
    securityTestDetails("SEC-E07a", [TAGS.ENTERPRISE, TAGS.SUPERADMIN]),
    async ({ actor, superAdmin }) => {
      const a = await enterpriseAdmin(superAdmin, actor, ADMIN_TAG);
      const u = await actor(MEMBER_TAG);
      expectAnswer(await apiRaw(u.request, "GET", API_PATHS.USER_MY_ORG), ALLOWED, "before: U's session works");

      const reset = await apiRaw(a.request, "POST", API_PATHS.USER_RESET_PASSWORD, { data: { userId: u.userId } });

      expectAnswer(reset, ALLOWED, "A's reset of U's password");
      expectAnswer(await apiRaw(u.request, "GET", API_PATHS.USER_MY_ORG), API_ERRORS.UNAUTHENTICATED, "after: U's session from before the reset");
      expectAnswer(await apiRaw(a.request, "GET", API_PATHS.USER_MY_ORG), ALLOWED, "control: a reset of someone else leaves A's own session alone");
    },
  );

  test(
    "SEC-E07b an admin who resets its own password keeps the session that asked and loses its other one",
    securityTestDetails("SEC-E07b", [TAGS.ENTERPRISE, TAGS.SUPERADMIN]),
    async ({ actor, superAdmin, newUserSession }) => {
      const a = await enterpriseAdmin(superAdmin, actor, ADMIN_TAG);
      const other = (await newUserSession()).page.request;
      await signIn(other, a.email);
      expectAnswer(await apiRaw(other, "GET", API_PATHS.USER_MY_ORG), ALLOWED, "before: A's second session works");

      const reset = await apiRaw(a.request, "POST", API_PATHS.USER_RESET_PASSWORD, { data: { userId: a.userId } });

      expectAnswer(reset, ALLOWED, "A's reset of its own password");
      expectAnswer(await apiRaw(a.request, "GET", API_PATHS.USER_MY_ORG), ALLOWED, "after: the session that asked for the reset still works");
      expectAnswer(await apiRaw(other, "GET", API_PATHS.USER_MY_ORG), API_ERRORS.UNAUTHENTICATED, "after: A's other session");
    },
  );
});
