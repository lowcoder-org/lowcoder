import { apiRaw, listOrgMembers } from "../../src/api/client";
import { API_ERRORS, API_OK, API_PATHS, ORG_ROLES, TAGS } from "../../src/constants";
import { expect, test } from "../../src/fixtures";
import { expectAnswer } from "../../src/security/assertions";
import { enterpriseAdmin } from "../../src/security/enterprise";
import { securityTestDetails } from "../../src/security/quarantine";

/**
 * SEC-E05 alone, on the ENTERPRISE stack, on a stack of its own:
 *   E2E_INCLUDE_QUARANTINE=1 E2E_INCLUDE_ENTERPRISE_TAKEOVER=1 E2E_STACK_PROFILE=enterprise e2e/scripts/run-in-docker.sh
 *
 * Why alone: the 3.0.0 server (and this branch's) lets an admin of the enterprise workspace reset the password of any member,
 * the instance super admin included (D-40), and this test is the attack. On a server with the defect it replaces the super
 * admin's password, so every later super-admin sign-in on that stack fails: the other enterprise tests, a second run. The
 * isolation is enforced by the run selection, not by this comment: the test carries `@enterprise-takeover`, which every run
 * leaves out unless E2E_INCLUDE_ENTERPRISE_TAKEOVER is set (enterprise profile only, and with E2E_INCLUDE_QUARANTINE because the
 * test is quarantined); a run with the flag selects THIS test only and no other enterprise test (src/run-selection.ts). The
 * sessions a worker signed in before the reset stay valid (a worker signs the super admin in once, at its start), only a later
 * sign-in fails.
 *
 * Leak-free by construction: on a server with the defect the reset answer carries a NEW password (of the super admin in the
 * attack, of the plain member in the control). The file therefore turns trace, screenshot and video off (the config keeps a
 * trace of every failing test, and a trace holds every response body), and no assertion receives the answer's body: only status
 * and code, or a boolean. Proven by a run on the 3.0.0 image whose test-results and report were searched for both values
 * (count 0), with the same search finding them when the trace is on (README, "ENTERPRISE stack").
 *
 * Limit: the test cannot prove that the super admin's password is unchanged after a refusal, because a super-admin sign-in from
 * a test would put the password into the trace (e2e/AGENTS.md section 8); it asserts the answer and, on the control, that the
 * route works.
 */

/** No artifact of this file may keep a response body: see the header. */
test.use({ trace: "off", screenshot: "off", video: "off" });

const ALLOWED = { status: 200, code: API_OK } as const;
const ADMIN_TAG = "admin";
const MEMBER_TAG = "member";

test.describe("security: ENTERPRISE stack, password reset", () => {
  test(
    "SEC-E05 a workspace admin cannot reset the instance super admin's password",
    securityTestDetails("SEC-E05", [TAGS.ENTERPRISE, TAGS.ENTERPRISE_TAKEOVER, TAGS.SUPERADMIN]),
    async ({ actor, superAdmin }) => {
      const a = await enterpriseAdmin(superAdmin, actor, ADMIN_TAG);
      const m = await actor(MEMBER_TAG);
      const members = await listOrgMembers(a.request, a.orgId);
      expect(members.find((member) => member.userId === superAdmin.userId)?.role, "setup: S is a super_admin member of A's workspace, a valid target").toBe(ORG_ROLES.SUPER_ADMIN);
      // Control: the route works in this mode for a plain member (so the refusal below is about S, not about the route, the mode or A's rights).
      const control = await apiRaw(a.request, "POST", API_PATHS.USER_RESET_PASSWORD, { data: { userId: m.userId } });
      expectAnswer(control, ALLOWED, "control: A's reset of a plain member's password");
      const issued = (control.json as { data?: unknown } | undefined)?.data;
      expect(typeof issued === "string" && issued.length > 0, "control: the reset answer carries a new password (its value is never printed)").toBe(true);

      const answer = await apiRaw(a.request, "POST", API_PATHS.USER_RESET_PASSWORD, { data: { userId: superAdmin.userId } });

      // D-40 (SF-35): the server answers 200 and a new password for S; the desired answer is a refusal.
      expectAnswer(answer, API_ERRORS.UNSUPPORTED_OPERATION, "A's reset of the instance super admin's password");
    },
  );
});
