import {
  apiRaw,
  createInvitation,
  currentUser,
  currentUserId,
  listOrgMembers,
  registerRaw,
  removeOrgMember,
  signIn,
  signInRaw,
} from "../../src/api/client";
import { API_ERRORS, API_OK, API_PATHS, createUserInOrgPath, PASSWORD_TOO_WEAK_MESSAGE, TAGS, TEST_PASSWORD, UI_PATHS } from "../../src/constants";
import { expect, test, uniqueEmail } from "../../src/fixtures";
import { AuthPage, PASSWORD_RULE_TEXT } from "../../src/pages/AuthPage";
import { expectAnswer } from "../../src/security/assertions";
import { joinWorkspace } from "../../src/security/actors";
import { lifecycleTestDetails } from "../../src/security/quarantine";

/**
 * Edge cases of the sign-up (LC-AU01 to LC-AU08, LC-AU15 to LC-AU17): a registered address in any casing, a malformed one,
 * the password rules of the form, the invitation link, the workspace sign-up page and an admin's create-user route. A
 * denial first proves its setup (the account the refusal protects exists and works).
 */

const ALLOWED = { status: 200, code: API_OK } as const;
const WEAK_PASSWORD = "a";
const BAD_PASSWORDS = [
  { label: "seven characters", password: "Passw0r", rule: PASSWORD_RULE_TEXT.LENGTH },
  { label: "letters only", password: "Passwordx", rule: PASSWORD_RULE_TEXT.LETTERS_AND_DIGITS },
  { label: "a space", password: "Pass w0rd1", rule: PASSWORD_RULE_TEXT.NO_WHITESPACE },
] as const;
const MALFORMED_ADDRESS = "not-an-address";
const ORG_REGISTER_PATH = (orgId: string) => `/org/${orgId}/auth/register`;

test.describe("lifecycle: sign-up edge cases", () => {
  test("LC-AU01 a second sign-up with a registered address is refused", lifecycleTestDetails("LC-AU01"), async ({ actor, newUserSession }) => {
    const owner = await actor("dup");
    const visitor = (await newUserSession()).page.request;

    expectAnswer(await registerRaw(visitor, owner.email, TEST_PASSWORD), API_ERRORS.USER_LOGIN_ID_EXIST, "a sign-up with a registered address");

    expectAnswer(await apiRaw(visitor, "GET", API_PATHS.USER_MY_ORG), API_ERRORS.UNAUTHENTICATED, "the refused sign-up opened no session");
    const check = (await newUserSession()).page.request;
    await signIn(check, owner.email);
    expect(await currentUserId(check), "the account is unchanged: the same user signs in").toBe(owner.userId);
  });

  test("LC-AU02 the sign-up page sends a known address to the sign-in page", lifecycleTestDetails("LC-AU02"), async ({ actor, newUserSession }, testInfo) => {
    const owner = await actor("known");
    const session = await newUserSession();
    const auth = new AuthPage(session.page);
    await auth.openRegister();

    await auth.fillEmailAndBlur(uniqueEmail("fresh", testInfo.workerIndex));
    await expect(auth.signUpButton, "positive control: a fresh address stays on the sign-up page").toBeVisible();
    await expect(auth.emailExistsMessage, "no notice for a fresh address").toHaveCount(0);
    await expect(session.page).toHaveURL(UI_PATHS.REGISTER);

    await auth.fillEmailAndBlur(owner.email);

    await expect(auth.emailExistsMessage, "the page names the address as registered").toBeVisible();
    await expect(session.page, "and moves to the sign-in page").toHaveURL(UI_PATHS.LOGIN);
  });

  test("LC-AU03 a sign-up with the same address in another casing is refused", lifecycleTestDetails("LC-AU03"), async ({ actor, newUserSession }) => {
    const owner = await actor("case");
    const visitor = (await newUserSession()).page.request;

    expectAnswer(
      await registerRaw(visitor, owner.email.toUpperCase(), TEST_PASSWORD),
      API_ERRORS.USER_LOGIN_ID_EXIST,
      "a sign-up with the registered address in upper case",
    );
    expectAnswer(await apiRaw(visitor, "GET", API_PATHS.USER_MY_ORG), API_ERRORS.UNAUTHENTICATED, "no session was opened");
  });

  test("LC-AU04 a sign-in with the address in another casing reaches the same account (characterisation)", lifecycleTestDetails("LC-AU04"), async ({ actor, newUserSession }) => {
    const owner = await actor("signcase");
    const visitor = (await newUserSession()).page.request;

    const answer = await signInRaw(visitor, owner.email.toUpperCase());

    expectAnswer(answer, ALLOWED, "measured on 3.0.0: the sign-in ignores the casing of the address");
    expect(await currentUserId(visitor), "the upper-case sign-in is the same user").toBe(owner.userId);
  });

  test("LC-AU05 a sign-up with a malformed address is refused", lifecycleTestDetails("LC-AU05"), async ({ newUserSession }) => {
    const visitor = (await newUserSession()).page.request;

    expectAnswer(await registerRaw(visitor, MALFORMED_ADDRESS, TEST_PASSWORD), API_ERRORS.INVALID_EMAIL_FORMAT, "a sign-up with a malformed address");
    expectAnswer(await apiRaw(visitor, "GET", API_PATHS.USER_MY_ORG), API_ERRORS.UNAUTHENTICATED, "no session was opened");
  });

  test("LC-AU06 the sign-up form shows each password rule and keeps Sign Up disabled", lifecycleTestDetails("LC-AU06"), async ({ newUserSession }, testInfo) => {
    const session = await newUserSession();
    const auth = new AuthPage(session.page);
    await auth.openRegister();
    await auth.fillEmailAndBlur(uniqueEmail("rules", testInfo.workerIndex));

    for (const bad of BAD_PASSWORDS) {
      await auth.fillPasswords(bad.password, bad.password);
      await expect(auth.ruleMessage(bad.rule), `${bad.label}: the rule is named`).toBeVisible();
      await expect(auth.signUpButton, `${bad.label}: Sign Up stays disabled`).toBeDisabled();
    }

    await auth.fillPasswords(TEST_PASSWORD, TEST_PASSWORD);

    await expect(auth.signUpButton, "a password that meets the rules enables Sign Up").toBeEnabled();
    for (const bad of BAD_PASSWORDS) {
      await expect(auth.ruleMessage(bad.rule), `${bad.label}: the rule line is gone`).toHaveCount(0);
    }
  });

  test(
    "LC-AU07 the server refuses a password the client rule refuses",
    lifecycleTestDetails("LC-AU07"),
    async ({ newUserSession }, testInfo) => {
      const visitor = (await newUserSession()).page.request;
      const weakAddress = uniqueEmail("weak", testInfo.workerIndex);

      const answer = await registerRaw(visitor, weakAddress, WEAK_PASSWORD);

      expectAnswer(answer, API_ERRORS.INVALID_PASSWORD, "the server refuses a one-character password");
      expect(answer.body, "the refusal names the rule").toContain(PASSWORD_TOO_WEAK_MESSAGE);
      expectAnswer(await apiRaw(visitor, "GET", API_PATHS.USER_MY_ORG), API_ERRORS.UNAUTHENTICATED, "no session was opened");
      expectAnswer(await registerRaw((await newUserSession()).page.request, weakAddress, TEST_PASSWORD), ALLOWED, "no account was created: the address still signs up");
    },
  );

  test("LC-AU17 an admin cannot create a user with a password the client rule refuses", lifecycleTestDetails("LC-AU17"), async ({ actor, newUserSession }, testInfo) => {
    const admin = await actor("creator");
    const weakAddress = uniqueEmail("created-weak", testInfo.workerIndex);
    const strongAddress = uniqueEmail("created-ok", testInfo.workerIndex);

    const answer = await apiRaw(admin.request, "POST", createUserInOrgPath(admin.orgId), { data: { email: weakAddress, password: WEAK_PASSWORD } });

    expectAnswer(answer, API_ERRORS.INVALID_PASSWORD, "the admin route refuses a one-character password");
    expect(answer.body, "the refusal names the rule").toContain(PASSWORD_TOO_WEAK_MESSAGE);
    expectAnswer(await registerRaw((await newUserSession()).page.request, weakAddress, TEST_PASSWORD), ALLOWED, "no account was created: the address still signs up");
    expectAnswer(await apiRaw(admin.request, "POST", createUserInOrgPath(admin.orgId), { data: { email: strongAddress, password: TEST_PASSWORD } }), ALLOWED, "control: the route creates a user with a password that meets the rule");
    expectAnswer(await signInRaw((await newUserSession()).page.request, strongAddress, TEST_PASSWORD), ALLOWED, "control: the created user signs in");
  });

  test("LC-AU08 an invited visitor signs up through the invitation link and joins only that workspace", lifecycleTestDetails("LC-AU08", [TAGS.CORE]), async ({ actor, newUserSession }, testInfo) => {
    const inviter = await actor("inviter");
    const code = await createInvitation(inviter.request, inviter.orgId);
    const session = await newUserSession();
    const auth = new AuthPage(session.page);

    await session.page.goto(`/invite/${code}`);
    await expect(session.page, "a signed-out visitor is sent to the workspace's sign-in page").toHaveURL(new RegExp(`/org/${inviter.orgId}/auth/login`));
    const inviterName = (await currentUser(inviter.request)).username;
    expect(inviterName, "the inviter has a user name").toBeTruthy();
    await expect(auth.invitationHeading(inviterName!), "the page names the inviter").toBeVisible();

    await session.page.getByText("Sign Up", { exact: true }).last().click();
    await auth.signUp(uniqueEmail("invited", testInfo.workerIndex), TEST_PASSWORD);

    await expect(session.page, "after the sign-up the user is on the app list").toHaveURL(UI_PATHS.APP_LIST);
    const me = await currentUser(session.page.request);
    expect(
      me.orgAndRoles.map((entry) => ({ orgId: entry.org.id, role: entry.role })),
      "the user belongs to the inviting workspace only, as a member",
    ).toEqual([{ orgId: inviter.orgId, role: "member" }]);
  });

  test("LC-AU18a a sign-up through an invitation answers success and joins only the invited workspace", lifecycleTestDetails("LC-AU18a"), async ({ actor, newUserSession }, testInfo) => {
    const inviter = await actor("invsignup");
    const code = await createInvitation(inviter.request, inviter.orgId);
    const control = await registerRaw((await newUserSession()).page.request, uniqueEmail("invcontrol", testInfo.workerIndex), TEST_PASSWORD, { invitationId: code });
    expectAnswer(control, ALLOWED, "control: a sign-up with the invitation alone (no workspace named)");
    const address = uniqueEmail("invsubject", testInfo.workerIndex);

    const answer = await registerRaw((await newUserSession()).page.request, address, TEST_PASSWORD, { invitationId: code, orgId: inviter.orgId });

    expectAnswer(answer, ALLOWED, "the sign-up the invitation page sends (the invitation and the workspace it names)");
    const check = (await newUserSession()).page.request;
    expectAnswer(await signInRaw(check, address), ALLOWED, "the new account signs in");
    expect(
      (await currentUser(check)).orgAndRoles.map((entry) => ({ orgId: entry.org.id, role: entry.role })),
      "it belongs to the inviting workspace only, as a member",
    ).toEqual([{ orgId: inviter.orgId, role: "member" }]);
  });

  test("LC-AU18b a sign-in of an existing account through an invitation answers success and joins the invited workspace", lifecycleTestDetails("LC-AU18b"), async ({ actor, newUserSession }) => {
    const inviter = await actor("invsignin");
    const guest = await actor("invguest");
    const code = await createInvitation(inviter.request, inviter.orgId);
    const control = await signInRaw((await newUserSession()).page.request, guest.email, TEST_PASSWORD, { invitationId: code });
    expectAnswer(control, ALLOWED, "control: a sign-in with the invitation alone (no workspace named)");
    const second = await createInvitation(inviter.request, inviter.orgId);
    const other = await actor("invguest2");

    const answer = await signInRaw((await newUserSession()).page.request, other.email, TEST_PASSWORD, { invitationId: second, orgId: inviter.orgId });

    expectAnswer(answer, ALLOWED, "the sign-in the invitation page sends (the invitation and the workspace it names)");
    const check = (await newUserSession()).page.request;
    await signIn(check, other.email);
    expect((await currentUser(check)).orgAndRoles.map((entry) => entry.org.id), "the account belongs to both workspaces").toEqual(expect.arrayContaining([other.orgId, inviter.orgId]));
  });

  test("LC-AU18c an invitation of a removed member does not let a visitor in through the sign-up", lifecycleTestDetails("LC-AU18c"), async ({ actor, newUserSession }, testInfo) => {
    const inviter = await actor("invowner");
    const leaver = await actor("invleaver");
    await joinWorkspace(inviter, leaver);
    const code = await createInvitation(leaver.request, inviter.orgId);
    expectAnswer(await registerRaw((await newUserSession()).page.request, uniqueEmail("invbefore", testInfo.workerIndex), TEST_PASSWORD, { invitationId: code }), ALLOWED, "control: while its creator is a member, the invitation admits");
    await removeOrgMember(inviter.request, inviter.orgId, leaver.userId);
    const membersBefore = (await listOrgMembers(inviter.request, inviter.orgId)).map((member) => member.userId);
    expect(membersBefore, "setup: the invitation's creator is no longer a member").not.toContain(leaver.userId);
    const address = uniqueEmail("invlate", testInfo.workerIndex);

    const answer = await registerRaw((await newUserSession()).page.request, address, TEST_PASSWORD, { invitationId: code, orgId: inviter.orgId });

    expectAnswer(answer, API_ERRORS.INVALID_INVITATION_CODE, "the sign-up with the invitation of a removed member");
    // The refused visitor has an account but belongs to no workspace (its current user is empty), so membership is read from the inviter's side.
    const membersAfter = (await listOrgMembers(inviter.request, inviter.orgId)).map((member) => member.userId);
    expect(membersAfter.filter((id) => !membersBefore.includes(id)), "no one joined the workspace through the refused sign-up").toEqual([]);
  });

  // By design (owner decision, D-30): anyone who knows a workspace's id joins it by signing up on that workspace's own page.
  test(
    "LC-AU15 a sign-up on a workspace's sign-up page makes the visitor a plain member of that workspace only (pin)",
    lifecycleTestDetails("LC-AU15"),
    async ({ actor, newUserSession }, testInfo) => {
      const owner = await actor("orgowner");
      const session = await newUserSession();
      const auth = new AuthPage(session.page);
      await session.page.goto(ORG_REGISTER_PATH(owner.orgId));
      await expect(auth.signUpButton, "the workspace's sign-up page renders").toBeVisible();
      const memberIdsBefore = (await listOrgMembers(owner.request, owner.orgId)).map((member) => member.userId);

      await auth.signUp(uniqueEmail("walkin", testInfo.workerIndex), TEST_PASSWORD);
      await expect(session.page, "the sign-up worked").toHaveURL(UI_PATHS.APP_LIST);

      const visitorId = await currentUserId(session.page.request);
      const memberIdsAfter = (await listOrgMembers(owner.request, owner.orgId)).map((member) => member.userId);
      expect(memberIdsBefore, "before: the visitor is not a member of the workspace").not.toContain(visitorId);
      // The member list may also hold the instance super admin, so the check is a difference, not an equality.
      expect(memberIdsAfter.filter((id) => !memberIdsBefore.includes(id)), "the visitor is the one member added").toEqual([visitorId]);
      const me = await currentUser(session.page.request);
      expect(
        me.orgAndRoles.map((entry) => ({ orgId: entry.org.id, role: entry.role })),
        "the visitor belongs to that workspace only, as a plain member",
      ).toEqual([{ orgId: owner.orgId, role: "member" }]);
      expect(me.currentOrgId, "and it is the visitor's current workspace").toBe(owner.orgId);
    },
  );

  test("LC-AU16 the sign-up form refuses a confirmation that differs from the password", lifecycleTestDetails("LC-AU16"), async ({ newUserSession }, testInfo) => {
    const session = await newUserSession();
    const auth = new AuthPage(session.page);
    await auth.openRegister();
    await auth.fillEmailAndBlur(uniqueEmail("confirm", testInfo.workerIndex));

    await auth.fillPasswords(TEST_PASSWORD, `${TEST_PASSWORD}x`);

    await expect(auth.inconsistentPasswordsMessage, "the form names the difference").toBeVisible();
    await expect(auth.signUpButton, "Sign Up stays disabled").toBeDisabled();

    await auth.fillPasswords(TEST_PASSWORD, TEST_PASSWORD);

    await expect(auth.signUpButton, "equal passwords enable Sign Up").toBeEnabled();
    await expect(auth.inconsistentPasswordsMessage, "the notice is gone").toHaveCount(0);
  });
});
