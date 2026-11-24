import { apiRaw, currentUser, currentUserId, signInRaw } from "../../src/api/client";
import {
  API_ERRORS,
  API_OK,
  API_PATHS,
  PASSWORD_TOO_WEAK_MESSAGE,
  SESSION_COOKIE_NAME,
  SET_COOKIE_HEADER,
  TEST_PASSWORD,
  UI_PATHS,
  USER_SET_PASSWORD_PARAM,
} from "../../src/constants";
import { expect, test, uniqueEmail } from "../../src/fixtures";
import {
  MOCK_ACCESS_TOKEN,
  MOCK_CLIENT_ID,
  MOCK_CLIENT_SECRET,
  MOCK_CODE,
  MOCK_IDP_PATHS,
  answerToken,
  answerTokenError,
  answerUser,
  providerLogin,
  saveMockProvider,
} from "../../src/lifecycle/mock-idp";
import { UserMenu } from "../../src/pages/UserMenu";
import { expectAnswer } from "../../src/security/assertions";
import { lifecycleTestDetails } from "../../src/security/quarantine";

/**
 * Sign-in through a provider (LC-IP10 to LC-IP17) against a mock Generic OAuth provider on the test's own target of the echo
 * sidecar. The server calls the token and user-info endpoints itself; the browser never visits the provider, so a test makes
 * the call the client makes after the redirect (`POST /api/auth/tp/login`) with a made-up code. Every test configures its own
 * workspace's provider and user, so parallel tests share nothing. The tokens and the secret are fakes of the mock.
 */

const OK = { status: 200, code: API_OK } as const;
const PROVIDER_USER_NAME = "Mock User";
const WEAK_PASSWORD = "a";

function setsSessionCookie(headers: Record<string, string>): boolean {
  return (headers[SET_COOKIE_HEADER] ?? "").includes(SESSION_COOKIE_NAME);
}

test.describe("lifecycle: sign-in through a provider (mock)", () => {
  test("LC-IP10 a first provider sign-in creates the user and signs it in", lifecycleTestDetails("LC-IP10"), async ({ actor, newUserSession, echo, baseURL }, testInfo) => {
    const admin = await actor("idpadmin");
    const address = uniqueEmail("idpuser", testInfo.workerIndex);
    await answerToken(echo);
    await answerUser(echo, { sub: `sub-${address}`, email: address, name: PROVIDER_USER_NAME });
    const provider = await saveMockProvider(admin.request, echo, { enableRegister: true });
    const visitor = await newUserSession();

    const answer = await providerLogin(visitor.page.request, { provider, orgId: admin.orgId, baseURL: baseURL! });

    expectAnswer(answer, OK, "the provider sign-in");
    expect(setsSessionCookie(answer.headers), "it opens a session").toBe(true);
    const me = await currentUser(visitor.page.request);
    expect(me.username, "the user carries the provider's display name").toBe(PROVIDER_USER_NAME);
    expect((me.connections ?? []).some((connection) => connection.source === "GENERIC" && connection.email === address), "and a provider connection that holds the provider's e-mail address").toBe(true);
    expect(me.orgAndRoles.map((entry) => entry.org.id), "and belongs to the workspace of the provider").toContain(admin.orgId);
    const records = await echo.received();
    const tokenCalls = records.filter((record) => record.path.startsWith(`${echo.path}${MOCK_IDP_PATHS.TOKEN}`));
    const userCalls = records.filter((record) => record.path.startsWith(`${echo.path}${MOCK_IDP_PATHS.USER_INFO}`));
    expect(tokenCalls.length, "one call to the token endpoint").toBe(1);
    expect(tokenCalls[0]!.method, "a form post").toBe("POST");
    expect(tokenCalls[0]!.body.includes(`client_id=${MOCK_CLIENT_ID}`), "carrying the client id").toBe(true);
    expect(tokenCalls[0]!.body.includes(`client_secret=${MOCK_CLIENT_SECRET}`), "and the client secret").toBe(true);
    expect(tokenCalls[0]!.body.includes(`code=${MOCK_CODE}`), "and the code").toBe(true);
    expect(userCalls.length, "one call to the user-info endpoint").toBe(1);
    expect(userCalls[0]!.headers.authorization === `Bearer ${MOCK_ACCESS_TOKEN}`, "with the access token as the bearer").toBe(true);
  });

  test("LC-IP11 the same provider user signs in again as the same account", lifecycleTestDetails("LC-IP11"), async ({ actor, newUserSession, echo, baseURL }, testInfo) => {
    const admin = await actor("idpadmin");
    const address = uniqueEmail("idpagain", testInfo.workerIndex);
    await answerToken(echo);
    await answerUser(echo, { sub: `sub-${address}`, email: address, name: PROVIDER_USER_NAME });
    const provider = await saveMockProvider(admin.request, echo, { enableRegister: true });
    const first = await newUserSession();
    const second = await newUserSession();

    expectAnswer(await providerLogin(first.page.request, { provider, orgId: admin.orgId, baseURL: baseURL! }), OK, "the first sign-in");
    expectAnswer(await providerLogin(second.page.request, { provider, orgId: admin.orgId, baseURL: baseURL! }), OK, "the second sign-in");

    expect(await currentUserId(second.page.request), "both sign-ins are the same account").toBe(await currentUserId(first.page.request));
  });

  test("LC-IP12 registration off refuses an unknown provider user", lifecycleTestDetails("LC-IP12"), async ({ actor, newUserSession, echo, baseURL }, testInfo) => {
    const admin = await actor("idpadmin");
    await answerToken(echo);
    const known = uniqueEmail("idpknown", testInfo.workerIndex);
    await answerUser(echo, { sub: `sub-${known}`, email: known, name: PROVIDER_USER_NAME });
    const open = await saveMockProvider(admin.request, echo, { enableRegister: true });
    const control = await newUserSession();
    expectAnswer(await providerLogin(control.page.request, { provider: open, orgId: admin.orgId, baseURL: baseURL! }), OK, "control: with registration on the user signs in");
    const closed = await saveMockProvider(admin.request, echo, { enableRegister: false, id: open.authId });
    const stranger = uniqueEmail("idpstranger", testInfo.workerIndex);
    await answerUser(echo, { sub: `sub-${stranger}`, email: stranger, name: "Stranger" });
    const visitor = await newUserSession();

    const answer = await providerLogin(visitor.page.request, { provider: closed, orgId: admin.orgId, baseURL: baseURL! });

    expectAnswer(answer, API_ERRORS.USER_NOT_EXIST, "an unknown provider user with registration off");
    expect(setsSessionCookie(answer.headers), "no session was opened").toBe(false);
  });

  test("LC-IP13 an error answer of the token endpoint fails the sign-in", lifecycleTestDetails("LC-IP13"), async ({ actor, newUserSession, echo, baseURL }, testInfo) => {
    const admin = await actor("idpadmin");
    const address = uniqueEmail("idperror", testInfo.workerIndex);
    await answerUser(echo, { sub: `sub-${address}`, email: address, name: PROVIDER_USER_NAME });
    await answerToken(echo);
    const provider = await saveMockProvider(admin.request, echo, { enableRegister: true });
    await answerTokenError(echo);
    const visitor = await newUserSession();

    const answer = await providerLogin(visitor.page.request, { provider, orgId: admin.orgId, baseURL: baseURL! });

    expectAnswer(answer, API_ERRORS.OIDC_INFORMATION_FAILED, "a sign-in whose token endpoint answers invalid_grant");
    expect(setsSessionCookie(answer.headers), "no session was opened").toBe(false);
    await answerToken(echo);
    const retry = await newUserSession();
    expectAnswer(await providerLogin(retry.page.request, { provider, orgId: admin.orgId, baseURL: baseURL! }), OK, "control: with a valid token answer the same sign-in works");
  });

  test("LC-IP14 a provider user whose address belongs to a form user does not sign in as that user", lifecycleTestDetails("LC-IP14"), async ({ actor, newUserSession, echo, baseURL }, testInfo) => {
    const admin = await actor("idpadmin");
    const formUser = await actor("idpform");
    await answerToken(echo);
    const stranger = uniqueEmail("idpstranger", testInfo.workerIndex);
    await answerUser(echo, { sub: `sub-${stranger}`, email: stranger, name: "Stranger" });
    const provider = await saveMockProvider(admin.request, echo, { enableRegister: true });
    expectAnswer(await providerLogin((await newUserSession()).page.request, { provider, orgId: admin.orgId, baseURL: baseURL! }), OK, "control: a provider user with an address nobody has signs in");
    expectAnswer(await signInRaw((await newUserSession()).page.request, formUser.email, TEST_PASSWORD), OK, "setup: the form user exists and signs in with its own password");
    await answerUser(echo, { sub: `sub-${formUser.email}`, email: formUser.email, name: "Impostor" });
    const visitor = await newUserSession();

    const answer = await providerLogin(visitor.page.request, { provider, orgId: admin.orgId, baseURL: baseURL! });

    if (answer.status === OK.status) {
      const reached = await currentUser(visitor.page.request);
      const listsOwnWorkspace = reached.orgAndRoles.some((entry) => entry.org.id === formUser.orgId);
      expect(await currentUserId(visitor.page.request), `the session is not the form user's account (it ${listsOwnWorkspace ? "lists" : "does not list"} the form user's own workspace)`).not.toBe(formUser.userId);
    }
  });

  test("LC-IP15 a provider user binds an e-mail in the profile and can then sign in with it", lifecycleTestDetails("LC-IP15"), async ({ actor, newUserSession, echo, baseURL }, testInfo) => {
    const admin = await actor("idpadmin");
    const claimed = uniqueEmail("idpclaimed", testInfo.workerIndex);
    const bound = uniqueEmail("idpbound", testInfo.workerIndex);
    await answerToken(echo);
    await answerUser(echo, { sub: `sub-${claimed}`, email: claimed, name: "Mock Binder" });
    const provider = await saveMockProvider(admin.request, echo, { enableRegister: true });
    const session = await newUserSession();
    expectAnswer(await providerLogin(session.page.request, { provider, orgId: admin.orgId, baseURL: baseURL! }), OK, "setup: the provider sign-in");
    const userId = await currentUserId(session.page.request);
    const page = session.page;
    await page.goto(UI_PATHS.APP_LIST_PATH);

    await new UserMenu(page).openProfile("Mock Binder");
    const dialog = page.locator(".ant-modal:visible");
    await dialog.getByRole("button", { name: "To Bind" }).click();
    await dialog.getByPlaceholder("Please Enter Your Email").fill(bound);
    const bindCall = page.waitForResponse((response) => response.url().includes(API_PATHS.AUTH_EMAIL_BIND));
    await dialog.getByRole("button", { name: "Submit" }).click();

    expect((await bindCall).status(), "the bind call is answered").toBe(200);
    await expect(page.locator(".ant-modal:visible").getByText("Is Binding"), "the card shows the address as bound").toBeVisible();
    expectAnswer(await apiRaw(session.page.request, "POST", API_PATHS.USER_PASSWORD, { params: { [USER_SET_PASSWORD_PARAM]: TEST_PASSWORD } }), OK, "setup: the user sets a password (the e-mail has none yet)");
    const emailSession = await newUserSession();
    expectAnswer(await signInRaw(emailSession.page.request, bound, TEST_PASSWORD), OK, "the bound address signs in");
    expect(await currentUserId(emailSession.page.request), "as the same account").toBe(userId);
  });

  test("LC-IP17 a provider-only user cannot set a first password the client rule refuses", lifecycleTestDetails("LC-IP17"), async ({ actor, newUserSession, echo, baseURL }, testInfo) => {
    const admin = await actor("idpadmin");
    const address = uniqueEmail("idpweak", testInfo.workerIndex);
    await answerToken(echo);
    await answerUser(echo, { sub: `sub-${address}`, email: address, name: "Mock Weak" });
    const provider = await saveMockProvider(admin.request, echo, { enableRegister: true });
    const session = await newUserSession();
    expectAnswer(await providerLogin(session.page.request, { provider, orgId: admin.orgId, baseURL: baseURL! }), OK, "setup: the provider sign-in creates a user without a password");

    const weak = await apiRaw(session.page.request, "POST", API_PATHS.USER_PASSWORD, { params: { [USER_SET_PASSWORD_PARAM]: WEAK_PASSWORD } });

    expectAnswer(weak, API_ERRORS.INVALID_PASSWORD, "a one-character first password is refused");
    expect(weak.body, "the refusal names the rule").toContain(PASSWORD_TOO_WEAK_MESSAGE);
    expectAnswer(await apiRaw(session.page.request, "POST", API_PATHS.USER_PASSWORD, { params: { [USER_SET_PASSWORD_PARAM]: TEST_PASSWORD } }), OK, "TEST_PASSWORD is then set: the refused password stored nothing (an account with a password is refused, D-49)");
  });
});
