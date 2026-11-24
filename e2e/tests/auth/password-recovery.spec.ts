import type { APIRequestContext } from "@playwright/test";
import {
  apiRaw,
  createInvitation,
  currentUser,
  currentUserId,
  removeOrgMember,
  requestPasswordReset,
  resetLostPasswordRaw,
  sendInvitationEmails,
  signInRaw,
} from "../../src/api/client";
import {
  API_ERRORS,
  API_OK,
  API_PATHS,
  CHANGED_PASSWORD,
  INVITE_LINK_PATH,
  MAIL_SUBJECTS,
  PASSWORD_RESET_EMAIL_TEMPLATE_KEY,
  PASSWORD_TOO_WEAK_MESSAGE,
  RESET_TOKEN_MESSAGES,
  SETTING_PATHS,
  TAGS,
  TEST_PASSWORD,
  UI_PATHS,
  orgCommonSettingsPath,
  userProfilePath,
} from "../../src/constants";
import { expect, test, uniqueEmail, type UserSession } from "../../src/fixtures";
import { inviteLinkOf, resetLinkOf, resetTokenOf, textOf, type Mailbox } from "../../src/lifecycle/mail";
import { AuthPage } from "../../src/pages/AuthPage";
import { LoginPage } from "../../src/pages/LoginPage";
import { PasswordRecoveryPage } from "../../src/pages/PasswordRecoveryPage";
import { INVITE_SUCCESS_TEXT, SettingPage } from "../../src/pages/SettingPage";
import { joinWorkspace } from "../../src/security/actors";
import { expectAnswer } from "../../src/security/assertions";
import { lifecycleTestDetails } from "../../src/security/quarantine";

/**
 * Password recovery and invitation mails (LC-PW01 to LC-PW16). The mails come from the run's mail sink. A reset token is a
 * credential: it is compared as a boolean or sent to the server, never given to a matcher or a message, and the trace is off
 * because it would record the pages and requests that carry it. A denial first proves its setup (a mail arrived, a token works).
 * Not covered: the 12-hour expiry (no clock control) and rate limiting (a per-URL limit of the whole server).
 */

test.use({ trace: "off" });

const ALLOWED = { status: 200, code: API_OK } as const;
const OTHER_PASSWORD = "Passw0rd-e2e-other";
const WEAK_PASSWORD = "a";
const MADE_UP_TOKEN = "madeUpTok1";
const TOKEN_REFUSED = API_ERRORS.INVALID_PARAMETER;

/** A request context with no session of the test's browser (the page of a new session, never logged in). */
async function visitor(newUserSession: () => Promise<UserSession>): Promise<APIRequestContext> {
  return (await newUserSession()).page.request;
}

/** Requests a reset mail for an address and returns the `index`-th reset mail's token, once that many mails have arrived. */
async function tokenOfRequest(anon: APIRequestContext, mailbox: Mailbox, address: string, index = 0): Promise<string> {
  expectAnswer(await requestPasswordReset(anon, address), ALLOWED_EMPTY, `a reset request for ${address}`);
  const mails = await mailbox.waitForMail(address, MAIL_SUBJECTS.PASSWORD_RESET, index + 1);
  return resetTokenOf(mails[index]!);
}

/** The anonymous request answers an empty 200: no body, so `code` is undefined. */
const ALLOWED_EMPTY = { status: 200, code: undefined } as const;

/** Whether `address` can sign in with `password`, on a context of its own. */
async function canSignIn(newUserSession: () => Promise<UserSession>, address: string, password: string): Promise<boolean> {
  const answer = await signInRaw(await visitor(newUserSession), address, password);
  return answer.status === ALLOWED.status && answer.code === ALLOWED.code;
}

test.describe("lifecycle: password recovery", () => {
  test("LC-PW01 the forgot page sends one reset mail", lifecycleTestDetails("LC-PW01"), async ({ actor, newUserSession, mailbox }) => {
    const user = await actor("pwforgot");
    const session = await newUserSession();
    const login = new LoginPage(session.page);
    const recovery = new PasswordRecoveryPage(session.page);

    await login.open();
    await login.emailInput.fill(user.email);
    await login.continueButton.click();
    await expect(login.forgotPasswordLink, "the password step offers the forgot page").toBeVisible();
    await login.forgotPasswordLink.click();
    await recovery.submitForgot(user.email);

    await expect(recovery.forgotSuccessMessage, "the page confirms the request").toBeVisible();
    const mails = await mailbox.waitForMail(user.email, MAIL_SUBJECTS.PASSWORD_RESET);
    expect(mails.length, "exactly one reset mail").toBe(1);
    expect(resetTokenOf(mails[0]!).length > 0, "the mail carries a token").toBe(true);
  });

  test("LC-PW02 the reset page sets the new password from the mailed link", lifecycleTestDetails("LC-PW02", [TAGS.CORE]), async ({ actor, newUserSession, mailbox }) => {
    const user = await actor("pwreset");
    const anon = await visitor(newUserSession);
    await tokenOfRequest(anon, mailbox, user.email);
    const link = resetLinkOf((await mailbox.mailsTo(user.email))[0]!);
    const session = await newUserSession();
    const recovery = new PasswordRecoveryPage(session.page);

    await recovery.openLink(link);
    await recovery.submitReset(user.email, CHANGED_PASSWORD);

    await expect(recovery.resetSuccessMessage, "the page confirms the reset").toBeVisible();
    expect(await canSignIn(newUserSession, user.email, CHANGED_PASSWORD), "the new password signs in").toBe(true);
    expectAnswer(await signInRaw(await visitor(newUserSession), user.email, TEST_PASSWORD), API_ERRORS.INVALID_PASSWORD, "the old password");
  });

  test("LC-PW03 a token works once", lifecycleTestDetails("LC-PW03"), async ({ actor, newUserSession, mailbox }) => {
    const user = await actor("pwonce");
    const anon = await visitor(newUserSession);
    const token = await tokenOfRequest(anon, mailbox, user.email);

    expectAnswer(await resetLostPasswordRaw(anon, { address: user.email, token, password: CHANGED_PASSWORD }), ALLOWED, "the first use");
    const second = await resetLostPasswordRaw(anon, { address: user.email, token, password: OTHER_PASSWORD });

    expectAnswer(second, TOKEN_REFUSED, "the second use");
    expect(second.body, "the refusal says there is no live token").toContain(RESET_TOKEN_MESSAGES.EXPIRED);
    expect(await canSignIn(newUserSession, user.email, CHANGED_PASSWORD), "the password of the first use stands").toBe(true);
  });

  test("LC-PW04 a new request makes the earlier token useless", lifecycleTestDetails("LC-PW04"), async ({ actor, newUserSession, mailbox }) => {
    const user = await actor("pwnewer");
    const anon = await visitor(newUserSession);
    const first = await tokenOfRequest(anon, mailbox, user.email, 0);
    const second = await tokenOfRequest(anon, mailbox, user.email, 1);

    const stale = await resetLostPasswordRaw(anon, { address: user.email, token: first, password: OTHER_PASSWORD });
    expectAnswer(stale, TOKEN_REFUSED, "the earlier token");
    expect(stale.body, "it no longer matches the stored one").toContain(RESET_TOKEN_MESSAGES.INVALID);
    expect(await canSignIn(newUserSession, user.email, TEST_PASSWORD), "the stale token changed nothing").toBe(true);

    expectAnswer(await resetLostPasswordRaw(anon, { address: user.email, token: second, password: CHANGED_PASSWORD }), ALLOWED, "the newer token (control)");
  });

  test("LC-PW05 a wrong token is refused", lifecycleTestDetails("LC-PW05"), async ({ actor, newUserSession, mailbox }) => {
    const user = await actor("pwwrong");
    const anon = await visitor(newUserSession);
    const real = await tokenOfRequest(anon, mailbox, user.email);

    const wrong = await resetLostPasswordRaw(anon, { address: user.email, token: MADE_UP_TOKEN, password: OTHER_PASSWORD });

    expectAnswer(wrong, TOKEN_REFUSED, "a made-up token while a real one is live");
    expect(wrong.body).toContain(RESET_TOKEN_MESSAGES.INVALID);
    expect(await canSignIn(newUserSession, user.email, TEST_PASSWORD), "the password is unchanged").toBe(true);
    expectAnswer(await resetLostPasswordRaw(anon, { address: user.email, token: real, password: CHANGED_PASSWORD }), ALLOWED, "the real token still works (control)");
  });

  test("LC-PW06 one user's token does not reset another user", lifecycleTestDetails("LC-PW06"), async ({ actor, newUserSession, mailbox }) => {
    const owner = await actor("pwown");
    const other = await actor("pwother");
    const anon = await visitor(newUserSession);
    const ownerToken = await tokenOfRequest(anon, mailbox, owner.email);
    const otherToken = await tokenOfRequest(anon, mailbox, other.email);

    const crossed = await resetLostPasswordRaw(anon, { address: owner.email, token: otherToken, password: OTHER_PASSWORD });

    expectAnswer(crossed, TOKEN_REFUSED, "the other user's token with the owner's address");
    expect(crossed.body).toContain(RESET_TOKEN_MESSAGES.INVALID);
    expect(await canSignIn(newUserSession, owner.email, TEST_PASSWORD), "the owner's password is unchanged").toBe(true);
    expect(await canSignIn(newUserSession, other.email, TEST_PASSWORD), "the other user's password is unchanged").toBe(true);
    expectAnswer(await resetLostPasswordRaw(anon, { address: owner.email, token: ownerToken, password: CHANGED_PASSWORD }), ALLOWED, "the owner's own token works (control)");
    expectAnswer(await resetLostPasswordRaw(anon, { address: other.email, token: otherToken, password: CHANGED_PASSWORD }), ALLOWED, "the other user's token works for the other user (control)");
  });

  test("LC-PW07 the answer does not tell whether an address has an account (pin)", lifecycleTestDetails("LC-PW07"), async ({ actor, newUserSession, mailbox }, testInfo) => {
    const user = await actor("pwenum");
    const ghost = uniqueEmail("pwghost", testInfo.workerIndex);
    const anon = await visitor(newUserSession);

    const unknown = await requestPasswordReset(anon, ghost);
    const known = await requestPasswordReset(anon, user.email);

    expect({ status: known.status, body: known.body }, "known and unknown addresses are answered alike").toEqual({ status: unknown.status, body: unknown.body });
    expect((await mailbox.waitForMail(user.email, MAIL_SUBJECTS.PASSWORD_RESET)).length, "the known address got its mail (control)").toBe(1);
    expect((await mailbox.mailsTo(ghost)).length, "the unregistered address got none").toBe(0);
  });

  test(
    "LC-PW08 a reset ends the user's other sessions",
    lifecycleTestDetails("LC-PW08"),
    async ({ actor, newUserSession, mailbox }) => {
      const user = await actor("pwsession");
      const second = await visitor(newUserSession);
      expectAnswer(await signInRaw(second, user.email), ALLOWED, "setup: a second session of the user");
      expectAnswer(await apiRaw(second, "GET", API_PATHS.USER_MY_ORG), { status: 200, code: API_OK }, "setup: the second session works");
      const token = await tokenOfRequest(await visitor(newUserSession), mailbox, user.email);

      expectAnswer(await resetLostPasswordRaw(await visitor(newUserSession), { address: user.email, token, password: CHANGED_PASSWORD }), ALLOWED, "the reset");

      expectAnswer(await apiRaw(second, "GET", API_PATHS.USER_MY_ORG), API_ERRORS.UNAUTHENTICATED, "the second session after the reset");
    },
  );

  test("LC-PW09 the reset mail uses the workspace's own template", lifecycleTestDetails("LC-PW09"), async ({ actor, newUserSession, mailbox }, testInfo) => {
    const admin = await actor("pwtemplate");
    const marker = `TEMPLATE-MARK-${testInfo.workerIndex}-${Date.now()}`;
    expectAnswer(
      await apiRaw(admin.request, "PUT", orgCommonSettingsPath(admin.orgId), { data: { key: PASSWORD_RESET_EMAIL_TEMPLATE_KEY, value: `${marker} %s %s` } }),
      ALLOWED,
      "setup: the workspace stores its template",
    );

    await tokenOfRequest(await visitor(newUserSession), mailbox, admin.email);

    const mails = await mailbox.waitForMail(admin.email, MAIL_SUBJECTS.PASSWORD_RESET);
    expect(textOf(mails[0]!).includes(marker), "the mail holds the template's marker").toBe(true);
  });

  test("LC-PW10 an account in no workspace still gets the reset mail", lifecycleTestDetails("LC-PW10"), async ({ actor, newUserSession, mailbox }, testInfo) => {
    const admin = await actor("pwremover");
    const code = await createInvitation(admin.request, admin.orgId);
    const session = await newUserSession();
    const invitedEmail = uniqueEmail("pwnoorg", testInfo.workerIndex);
    await session.page.goto(`/invite/${code}`);
    await session.page.getByText("Sign Up", { exact: true }).last().click();
    await new AuthPage(session.page).signUp(invitedEmail, TEST_PASSWORD);
    await expect(session.page, "setup: the invited visitor signed up").toHaveURL(UI_PATHS.APP_LIST);
    const invited = await currentUser(session.page.request);
    const invitedId = await currentUserId(session.page.request);
    expect(invited.orgAndRoles.map((entry) => entry.org.id), "setup: the only workspace is the inviter's").toEqual([admin.orgId]);
    await removeOrgMember(admin.request, admin.orgId, invitedId);
    const afterRemoval = await apiRaw(session.page.request, "GET", API_PATHS.CURRENT_USER);
    expect({ status: afterRemoval.status, body: afterRemoval.body }, "setup: the removal leaves the account in no workspace (the user read answers an empty 200, measured)").toEqual({ status: 200, body: "" });
    const anon = await visitor(newUserSession);

    expectAnswer(await requestPasswordReset(anon, invitedEmail), ALLOWED_EMPTY, "the reset request of the account in no workspace");
    await tokenOfRequest(anon, mailbox, admin.email); // a mail to another address of this test arrives: the sink and the server work

    expect((await mailbox.mailsTo(invitedEmail)).filter((mail) => mail.subject === MAIL_SUBJECTS.PASSWORD_RESET).length, "the account got its reset mail").toBe(1);
  });

  test("LC-PW11 a reset for an address that is only a user's display name reaches nobody", lifecycleTestDetails("LC-PW11"), async ({ actor, newUserSession, mailbox }, testInfo) => {
    const admin = await actor("pwrenamer");
    const victim = await actor("pwvictim");
    await joinWorkspace(admin, victim);
    const alias = uniqueEmail("pwalias", testInfo.workerIndex);
    expectAnswer(await apiRaw(admin.request, "PUT", userProfilePath(admin.orgId, victim.userId), { data: { name: alias } }), ALLOWED, "setup: the admin renames the member");
    expect((await currentUser(victim.request)).username, "setup: the display name is the alias").toBe(alias);
    const anon = await visitor(newUserSession);

    expectAnswer(await requestPasswordReset(anon, alias), ALLOWED_EMPTY, "the reset request for the alias");
    await tokenOfRequest(anon, mailbox, admin.email); // control: the mail path works

    expect((await mailbox.mailsTo(alias)).length, "no mail went to the alias").toBe(0);
    expect(await canSignIn(newUserSession, victim.email, TEST_PASSWORD), "the victim's password is unchanged").toBe(true);
  });

  test("LC-PW12 the mailed link opens the reset form as mailed", lifecycleTestDetails("LC-PW12"), async ({ actor, newUserSession, mailbox }) => {
    const user = await actor("pwlink");
    await tokenOfRequest(await visitor(newUserSession), mailbox, user.email);
    const link = resetLinkOf((await mailbox.mailsTo(user.email))[0]!);
    const session = await newUserSession();
    const recovery = new PasswordRecoveryPage(session.page);

    await recovery.openLink(link);

    await expect(recovery.passwordInput, "the reset form is shown for the link as mailed").toBeVisible();
  });

  test("LC-PW13 an invitation mail from the dialog lets the addressee in", lifecycleTestDetails("LC-PW13"), async ({ actor, mailbox }) => {
    const admin = await actor("pwinviter");
    const guest = await actor("pwinvitee");
    const settings = new SettingPage(admin.session.page);

    await admin.session.page.goto(SETTING_PATHS.GROUPS);
    await settings.inviteMembersButton.click();
    await settings.sendInvitationTo(guest.email);

    const mails = await mailbox.waitForMail(guest.email, MAIL_SUBJECTS.INVITATION);
    expect(mails.length, "exactly one invitation mail").toBe(1);
    const link = inviteLinkOf(mails[0]!);
    expect(new URL(link).pathname, "one slash before invite/<code> (D-54)").toMatch(new RegExp(`^${INVITE_LINK_PATH}[A-Za-z0-9]+$`));
    await guest.session.page.goto(link);
    await expect(guest.session.page, "the invitation leads to the app list").toHaveURL(UI_PATHS.APP_LIST);
    await expect
      .poll(async () => (await currentUser(guest.request)).orgAndRoles.map((entry) => ({ id: entry.org.id, role: entry.role })), "the guest joined the workspace as a member")
      .toContainEqual({ id: admin.orgId, role: "member" });
  });

  test("LC-PW14 an outsider cannot make the server send invitation mails for another workspace", lifecycleTestDetails("LC-PW14"), async ({ actor, mailbox }, testInfo) => {
    const owner = await actor("pwowner");
    const outsider = await actor("pwoutsider");
    const target = uniqueEmail("pwtarget", testInfo.workerIndex);
    const control = uniqueEmail("pwcontrol", testInfo.workerIndex);

    await sendInvitationEmails(outsider.request, owner.orgId, [target]);
    expectAnswer(await sendInvitationEmails(owner.request, owner.orgId, [control]), ALLOWED, "control: the owner's own invitation mail");

    await mailbox.waitForMail(control, MAIL_SUBJECTS.INVITATION);
    expect((await mailbox.mailsTo(target)).length, "the outsider's request sent no mail").toBe(0);
  });

  test("LC-PW15 the invite dialog confirms in readable text", lifecycleTestDetails("LC-PW15"), async ({ actor, mailbox }, testInfo) => {
    const admin = await actor("pwnotice");
    const invitee = uniqueEmail("pwnoticed", testInfo.workerIndex);
    const settings = new SettingPage(admin.session.page);

    await admin.session.page.goto(SETTING_PATHS.GROUPS);
    await settings.inviteMembersButton.click();
    await settings.sendInvitationTo(invitee);

    await expect(settings.inviteNotice, "the dialog shows a notice").toBeVisible();
    const notice = await settings.inviteNotice.innerText(); // read at once: the notice is transient
    await mailbox.waitForMail(invitee, MAIL_SUBJECTS.INVITATION); // control: the invitation was sent

    expect(notice.trim(), "the notice is the localized success text").toBe(INVITE_SUCCESS_TEXT);
  });

  test("LC-PW16 a reset to a password the client rule refuses is refused and leaves the token usable", lifecycleTestDetails("LC-PW16"), async ({ actor, newUserSession, mailbox }) => {
    const user = await actor("pwweak");
    const anon = await visitor(newUserSession);
    const token = await tokenOfRequest(anon, mailbox, user.email);

    const weak = await resetLostPasswordRaw(anon, { address: user.email, token, password: WEAK_PASSWORD });

    expectAnswer(weak, API_ERRORS.INVALID_PASSWORD, "a reset to a one-character password");
    expect(weak.body, "the refusal names the rule").toContain(PASSWORD_TOO_WEAK_MESSAGE);
    expect(await canSignIn(newUserSession, user.email, TEST_PASSWORD), "the password is unchanged").toBe(true);
    expect(await canSignIn(newUserSession, user.email, WEAK_PASSWORD), "the weak password does not sign in").toBe(false);
    expectAnswer(await resetLostPasswordRaw(anon, { address: user.email, token, password: CHANGED_PASSWORD }), ALLOWED, "the same live token then resets to a password that meets the rule");
    expect(await canSignIn(newUserSession, user.email, CHANGED_PASSWORD), "the new password signs in").toBe(true);
  });
});
