import { requestPasswordReset, resetLostPasswordRaw, sendInvitationEmails, signIn } from "../../src/api/client";
import { API_ERRORS, API_OK, MAIL_SUBJECTS, CHANGED_PASSWORD } from "../../src/constants";
import { expect, test, uniqueEmail } from "../../src/fixtures";
import { resetTokenOf } from "../../src/lifecycle/mail";

/**
 * Stack tests of the recovery helpers of the lifecycle specs. Its own file: the test submits a live reset token through a
 * request context, which a trace would record, and `trace` can only be switched off for a whole file.
 */
test.use({ trace: "off" });

test.describe("lifecycle recovery helpers", () => {
  test("requestPasswordReset mails a token, resetLostPasswordRaw uses it once, sendInvitationEmails mails an invitation", async ({ actor, newUserSession, mailbox }, testInfo) => {
    const user = await actor("rawrecover");
    const anon = (await newUserSession()).page.request;

    const requested = await requestPasswordReset(anon, user.email);
    const token = resetTokenOf((await mailbox.waitForMail(user.email, MAIL_SUBJECTS.PASSWORD_RESET))[0]!);
    const first = await resetLostPasswordRaw(anon, { address: user.email, token, password: CHANGED_PASSWORD });
    const second = await resetLostPasswordRaw(anon, { address: user.email, token, password: CHANGED_PASSWORD });
    // D-34: a successful reset ends every other session of the user, so `user.request`'s own sign-in from `actor()` is
    // gone; sign it back in with the new password before using it, as a real user would.
    await signIn(user.request, user.email, CHANGED_PASSWORD);
    const invitee = uniqueEmail("rawinvitee", testInfo.workerIndex);
    const sent = await sendInvitationEmails(user.request, user.orgId, [invitee]);

    expect({ status: requested.status, body: requested.body }, "the request is answered empty").toEqual({ status: 200, body: "" });
    expect({ status: first.status, code: first.code }, "the first use").toEqual({ status: 200, code: API_OK });
    expect({ status: second.status, code: second.code }, "the second use, raw and without a throw").toEqual(API_ERRORS.INVALID_PARAMETER);
    expect({ status: sent.status, code: sent.code }, "the invitation mail request").toEqual({ status: 200, code: API_OK });
    expect((await mailbox.waitForMail(invitee, MAIL_SUBJECTS.INVITATION)).length, "the invitation mail arrived").toBe(1);
  });
});
