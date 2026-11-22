import {
  apiRaw,
  createApiKey,
  currentUser,
  currentUserId,
  deleteApiKey,
  logout,
  removeOrgMember,
  signIn,
} from "../../src/api/client";
import {
  API_ERRORS,
  API_OK,
  API_KEYS_LIST_PATH,
  API_PATHS,
  APP_ROLES,
  AUTHORIZATION_HEADER,
  BEARER_PREFIX,
  CHANGED_PASSWORD,
  COOKIE_HEADER,
  FORWARDED_FOR_HEADER,
  LOOPBACK_ADDRESS,
  PUBLIC_DEFAULT_API_KEY_SECRET,
  REAL_IP_HEADER,
  SESSION_COOKIE_NAME,
  TAGS,
  TEST_PASSWORD,
  appViewPath,
  orgUpdatePath,
} from "../../src/constants";
import { expect, test } from "../../src/fixtures";
import { SEEDED_BUTTON_TEST_ID, adminOfApiUser, grantApp } from "../../src/security/actors";
import { expectAnswer } from "../../src/security/assertions";
import { securityTestDetails } from "../../src/security/quarantine";
import { memberOf, sceneOf } from "../../src/security/scene";
import { forgeApiKeyToken, forgeUnsignedToken, tokenIsSignedWith, withRandomSignature } from "../../src/security/tokens";

/**
 * Forged and revoked credentials (A01 and A03). The anonymous caller is a browser context that never signed in,
 * so no cookie can mask the header or cookie under test.
 */

const SECURITY_CORE = [TAGS.CORE];
const API_KEY_NAME = "e2e-sec-real-key";
const ALLOWED = { status: 200, code: API_OK } as const;

function bearer(token: string): Record<string, string> {
  return { [AUTHORIZATION_HEADER]: `${BEARER_PREFIX}${token}` };
}

test.describe("security: forged and revoked credentials", () => {
  test("SEC-A01a a token forged with the published default secret is anonymous", securityTestDetails("SEC-A01a", SECURITY_CORE), async ({ page, apiUser, newUserSession }) => {
    const a = await adminOfApiUser(page.request, apiUser);
    const anonymous = (await newUserSession()).page.request;
    // Controls: a key A really created authenticates through the header, and the signer below reproduces its signature,
    // so the forgery fails because the token is not a stored key, not because the header or the signer is broken.
    const realKey = await createApiKey(a.request, API_KEY_NAME);
    expectAnswer(await apiRaw(anonymous, "GET", API_PATHS.USER_MY_ORG, { headers: bearer(realKey.token) }), ALLOWED, "before: A's real key authenticates");
    expect(tokenIsSignedWith(realKey.token, PUBLIC_DEFAULT_API_KEY_SECRET), "the image signs with the published default secret").toBe(true);
    const forged = forgeApiKeyToken(PUBLIC_DEFAULT_API_KEY_SECRET, a.userId, a.email);
    expect(forged, "the forgery is not the real key").not.toBe(realKey.token);
    expect(tokenIsSignedWith(forged, PUBLIC_DEFAULT_API_KEY_SECRET), "and carries a valid signature").toBe(true);

    const answer = await apiRaw(anonymous, "GET", API_PATHS.USER_MY_ORG, { headers: bearer(forged) });

    expectAnswer(answer, API_ERRORS.UNAUTHENTICATED, "the forged token on an authenticated route");
    expect(answer.body, "the entry point sets only the status").toBe("");
    const me = await apiRaw(anonymous, "GET", API_PATHS.CURRENT_USER, { headers: bearer(forged) });
    expect((me.json as { data: { id: string } }).data.id, "the forged token does not make the caller A").not.toBe(a.userId);
    expect(me.body, "and the answer carries nothing of A").not.toContain(a.email);
  });

  test("SEC-A03a a logged-out session cookie is dead", securityTestDetails("SEC-A03a", SECURITY_CORE), async ({ actor, newUserSession }) => {
    const first = await actor("victim");
    const secondSession = await newUserSession();
    await signIn(secondSession.page.request, first.email);
    expect(await currentUserId(secondSession.page.request), "the second context is the same user").toBe(first.userId);
    const cookie = (await first.request.storageState()).cookies.find((entry) => entry.name === SESSION_COOKIE_NAME);
    expect(cookie, "the first context holds a session cookie").toBeDefined();
    const anonymous = (await newUserSession()).page.request;
    const replay = () =>
      apiRaw(anonymous, "GET", API_PATHS.USER_MY_ORG, { headers: { [COOKIE_HEADER]: `${SESSION_COOKIE_NAME}=${cookie?.value}` } });
    expectAnswer(await replay(), ALLOWED, "before: the cookie value works when replayed");

    await logout(first.request);

    expectAnswer(await replay(), API_ERRORS.UNAUTHENTICATED, "after: the replayed cookie of the logged-out session");
    expectAnswer(await apiRaw(secondSession.page.request, "GET", API_PATHS.USER_MY_ORG), ALLOWED, "the user's other session is untouched");
  });
});

// ---------------------------------------------------------------------------------------------------------------
// Further rows (A01 to A05)
// ---------------------------------------------------------------------------------------------------------------

const RENAMED_ORG = "e2e-sec-org-renamed-with-a-member-key";
const RANDOM_COOKIE_VALUE = "e2e-sec-random-session-value";
const API_KEY_DELETE_MEASURED = "3.0.0 answers 200 to DELETE /api/auth/api-key/{id} but the key still lists and authenticates";

test.describe("security: forged and revoked credentials (further rows)", () => {
  test("SEC-A01b an unsigned token and a token with a wrong signature are anonymous", securityTestDetails("SEC-A01b"), async ({ page, apiUser, newUserSession }) => {
    const a = await adminOfApiUser(page.request, apiUser);
    const anonymous = (await newUserSession()).page.request;
    const realKey = await createApiKey(a.request, API_KEY_NAME);
    expectAnswer(await apiRaw(anonymous, "GET", API_PATHS.USER_MY_ORG, { headers: bearer(realKey.token) }), ALLOWED, "before: A's real key authenticates through the header");
    const unsigned = forgeUnsignedToken(a.userId, a.email);
    const wrongSignature = withRandomSignature(forgeApiKeyToken(PUBLIC_DEFAULT_API_KEY_SECRET, a.userId, a.email));
    const tamperedRealKey = withRandomSignature(realKey.token);
    expect(tamperedRealKey, "the tampered real key differs from the real one").not.toBe(realKey.token);

    for (const [label, token] of [["alg none", unsigned], ["a random signature on a forged token", wrongSignature], ["a random signature on A's real key", tamperedRealKey]] as const) {
      const answer = await apiRaw(anonymous, "GET", API_PATHS.USER_MY_ORG, { headers: bearer(token) });
      expectAnswer(answer, API_ERRORS.UNAUTHENTICATED, `the token with ${label}`);
      expect(answer.body, `the answer to ${label} sets only the status`).toBe("");
    }
  });

  test("SEC-A02a a deleted API key stops working", securityTestDetails("SEC-A02a"), async ({ page, apiUser, newUserSession }) => {
    const a = await adminOfApiUser(page.request, apiUser);
    const anonymous = (await newUserSession()).page.request;
    const key = await createApiKey(a.request, API_KEY_NAME);
    const withKey = () => apiRaw(anonymous, "GET", API_PATHS.USER_MY_ORG, { headers: bearer(key.token) });
    expectAnswer(await withKey(), ALLOWED, "before: the key authenticates");
    expect((await apiRaw(a.request, "GET", API_KEYS_LIST_PATH)).body, "before: the key is listed").toContain(key.id);

    await deleteApiKey(a.request, key.id);

    expectAnswer(await withKey(), API_ERRORS.UNAUTHENTICATED, "after: the deleted key");
    expect((await apiRaw(a.request, "GET", API_KEYS_LIST_PATH)).body, "after: the key is no longer listed").not.toContain(key.id);
  });

  test("SEC-A02b a key of a removed member is refused at once", securityTestDetails("SEC-A02b"), async ({ page, apiUser, actor, newUserSession }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const m = await memberOf(a, actor, "member");
    await grantApp(a, seeded.appId, m, APP_ROLES.VIEWER);
    const anonymous = (await newUserSession()).page.request;
    const key = await createApiKey(m.request, API_KEY_NAME);
    expectAnswer(await apiRaw(anonymous, "GET", appViewPath(seeded.appId), { headers: bearer(key.token) }), ALLOWED, "before: M's key views the granted app");

    await removeOrgMember(a.request, a.orgId, m.userId);

    const answer = await apiRaw(anonymous, "GET", appViewPath(seeded.appId), { headers: bearer(key.token) });
    expectAnswer(answer, API_ERRORS.NO_PERMISSION_TO_REQUEST_APP, "after: M's key on the app of the workspace M left");
    expect(answer.body, "no app in the denial").not.toContain(SEEDED_BUTTON_TEST_ID);
  });

  test("SEC-A02c a member's API key carries the member's rights only (characterisation)", securityTestDetails("SEC-A02c"), async ({ page, apiUser, actor, newUserSession }) => {
    const { a } = await sceneOf(page, apiUser);
    const m = await memberOf(a, actor, "member");
    const anonymous = (await newUserSession()).page.request;
    const orgNameBefore = (await currentUser(a.request)).orgAndRoles.find((row) => row.org.id === a.orgId)?.org.name;

    // No role gate on creating one's own key (the profile UI hides the card from non-developers, a client gate only).
    const key = await createApiKey(m.request, API_KEY_NAME);
    const me = await apiRaw(anonymous, "GET", API_PATHS.CURRENT_USER, { headers: bearer(key.token) });
    expect((me.json as { data: { id: string } }).data.id, "before: the key authenticates as M").toBe(m.userId);
    const answer = await apiRaw(anonymous, "PUT", orgUpdatePath(a.orgId), { headers: bearer(key.token), data: { orgName: RENAMED_ORG } });

    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "M's key on an admin route");
    expect((await currentUser(a.request)).orgAndRoles.find((row) => row.org.id === a.orgId)?.org.name, "after: the workspace name is unchanged").toBe(orgNameBefore);
  });

  test("SEC-A03b a made-up session cookie is anonymous", securityTestDetails("SEC-A03b"), async ({ actor, newUserSession }) => {
    const user = await actor("user");
    const cookie = (await user.request.storageState()).cookies.find((entry) => entry.name === SESSION_COOKIE_NAME);
    const anonymous = (await newUserSession()).page.request;
    const withCookie = (value: string) => apiRaw(anonymous, "GET", API_PATHS.USER_MY_ORG, { headers: { [COOKIE_HEADER]: `${SESSION_COOKIE_NAME}=${value}` } });
    expectAnswer(await withCookie(cookie?.value ?? ""), ALLOWED, "before: the real cookie value works when replayed");

    const answer = await withCookie(RANDOM_COOKIE_VALUE);

    expectAnswer(answer, API_ERRORS.UNAUTHENTICATED, "the made-up cookie");
    expect(answer.body, "with no body").toBe("");
  });

  test("SEC-A04 a password change ends the user's other sessions", securityTestDetails("SEC-A04"), async ({ actor, newUserSession }) => {
    const first = await actor("user");
    const secondSession = await newUserSession();
    await signIn(secondSession.page.request, first.email);
    expectAnswer(await apiRaw(secondSession.page.request, "GET", API_PATHS.USER_MY_ORG), ALLOWED, "before: the second session is live");

    const changed = await apiRaw(first.request, "PUT", API_PATHS.USER_PASSWORD, { data: { oldPassword: TEST_PASSWORD, newPassword: CHANGED_PASSWORD } });

    expectAnswer(changed, ALLOWED, "the password change");
    const fresh = await newUserSession();
    await signIn(fresh.page.request, first.email, CHANGED_PASSWORD);
    expect(await currentUserId(fresh.page.request), "setup: the new password works, so the password really changed").toBe(first.userId);
    // Desired: the second session, opened with the old password, is dead. It is not on 3.0.0 or on HEAD (SF-29).
    expectAnswer(await apiRaw(secondSession.page.request, "GET", API_PATHS.USER_MY_ORG), API_ERRORS.UNAUTHENTICATED, "after: the other session");
  });

  test("SEC-A05 forwarding headers do not open the node-service route", securityTestDetails("SEC-A05"), async ({ page, apiUser, actor }) => {
    const { a } = await sceneOf(page, apiUser);
    const m = await memberOf(a, actor, "member");
    const body = { libraryQueryName: "e2e-sec-no-such-query", libraryQueryRecordId: "latest", params: [] };

    const answer = await apiRaw(m.request, "POST", API_PATHS.QUERY_EXECUTE_FROM_NODE, {
      data: body,
      headers: { [FORWARDED_FOR_HEADER]: LOOPBACK_ADDRESS, [REAL_IP_HEADER]: LOOPBACK_ADDRESS },
    });

    // Measured on 3.0.0: the image's nginx overwrites X-Forwarded-For with the peer address, so the loopback gate holds. The
    // call without the headers is denied the same way, which is the control: the headers give nothing.
    expectAnswer(answer, API_ERRORS.NOT_AUTHORIZED, "the forged forwarding headers");
    expectAnswer(await apiRaw(m.request, "POST", API_PATHS.QUERY_EXECUTE_FROM_NODE, { data: body }), API_ERRORS.NOT_AUTHORIZED, "control: the same call without them");
  });
});
