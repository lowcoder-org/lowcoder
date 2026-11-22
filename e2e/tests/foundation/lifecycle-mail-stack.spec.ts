import { apiRaw, registerUser } from "../../src/api/client";
import { API_PATHS, MAIL_SUBJECTS, TAGS } from "../../src/constants";
import { expect, test, uniqueEmail } from "../../src/fixtures";
import { isPasswordReset, resetTokenOf } from "../../src/lifecycle/mail";

/**
 * The mail sink on the real stack: the app's SMTP settings point at it, so a mail the server sends is found by recipient.
 * Stack test (it needs the run's app and sink), so `test` comes from the fixtures.
 */

test.describe("mail sink on the stack", { tag: [TAGS.LIFECYCLE] }, () => {
  test("a password-reset request makes the server mail one reset link, whose token the parser extracts", async ({ playwright, baseURL, mailbox }, testInfo) => {
    const request = await playwright.request.newContext({ baseURL });
    try {
      const email = uniqueEmail("mailsink", testInfo.workerIndex);
      await registerUser(request, email);
      const answer = await apiRaw(request, "POST", API_PATHS.USER_LOST_PASSWORD, { data: { userEmail: email } });
      expect(answer.status, "the request is answered").toBe(200);

      const mails = await mailbox.waitForMail(email, MAIL_SUBJECTS.PASSWORD_RESET);

      expect(mails.length, "exactly one reset mail").toBe(1);
      expect(isPasswordReset(mails[0]!)).toBe(true);
      expect(mails[0]!.to).toEqual([email]);
      expect(resetTokenOf(mails[0]!).length > 0, "the mail holds a token").toBe(true);
    } finally {
      await request.dispose();
    }
  });
});
