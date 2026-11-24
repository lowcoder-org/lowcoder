import { apiRaw, signInRaw } from "../../src/api/client";
import { API_ERRORS, API_OK, API_PATHS, CHANGED_PASSWORD, PASSWORD_TOO_WEAK_MESSAGE, TAGS, TEST_PASSWORD, UI_PATHS, USER_SET_PASSWORD_PARAM } from "../../src/constants";
import { expect, test } from "../../src/fixtures";
import { PASSWORD_RULE_TEXT } from "../../src/pages/AuthPage";
import { ProfileModal } from "../../src/pages/ProfileModal";
import { UserMenu } from "../../src/pages/UserMenu";
import { expectAnswer } from "../../src/security/assertions";
import { lifecycleTestDetails } from "../../src/security/quarantine";

/** A user's password change: the My Profile modal and the routes behind it (LC-PR09 to LC-PR14). */

const ALLOWED = { status: 200, code: API_OK } as const;
const WRONG_OLD_PASSWORD = "Wrong-old-1";
const TOO_SHORT_PASSWORD = "short1";
const WEAK_PASSWORD = "a";

test.describe("lifecycle: password change", () => {
  test("LC-PR09 a password change in the modal works with the old password", lifecycleTestDetails("LC-PR09", [TAGS.CORE]), async ({ actor, newUserSession }) => {
    const user = await actor("pwchange");
    const page = user.session.page;
    await page.goto(UI_PATHS.APP_LIST_PATH);
    await new UserMenu(page).openProfile(user.email);
    const modal = new ProfileModal(page);
    await expect(modal.title).toBeVisible();
    await modal.modifyPasswordButton.click();

    await modal.fillPasswordChange(TEST_PASSWORD, CHANGED_PASSWORD);
    await modal.submitButton.click();

    await expect(modal.passwordFields, "the password form closes").toHaveCount(0);
    await expect(modal.modifyPasswordButton, "and the card is back").toBeVisible();
    expectAnswer(await signInRaw((await newUserSession()).page.request, user.email, CHANGED_PASSWORD), ALLOWED, "the new password signs in");
    expectAnswer(await signInRaw((await newUserSession()).page.request, user.email, TEST_PASSWORD), API_ERRORS.INVALID_PASSWORD, "the old password no longer does");
  });

  test("LC-PR10 a wrong old password is refused in the modal", lifecycleTestDetails("LC-PR10"), async ({ actor, newUserSession }) => {
    const user = await actor("wrongold");
    const page = user.session.page;
    await page.goto(UI_PATHS.APP_LIST_PATH);
    await new UserMenu(page).openProfile(user.email);
    const modal = new ProfileModal(page);
    await modal.modifyPasswordButton.click();

    await modal.fillPasswordChange(WRONG_OLD_PASSWORD, CHANGED_PASSWORD);
    await modal.submitButton.click();

    await expect(modal.passwordMismatchMessage, "the modal refuses the change").toBeVisible();
    expectAnswer(await signInRaw((await newUserSession()).page.request, user.email, TEST_PASSWORD), ALLOWED, "the password is unchanged");
    expectAnswer(await signInRaw((await newUserSession()).page.request, user.email, CHANGED_PASSWORD), API_ERRORS.INVALID_PASSWORD, "the attempted password does not sign in");
  });

  test("LC-PR11 the modal applies the password rule to the new password", lifecycleTestDetails("LC-PR11"), async ({ actor }) => {
    const user = await actor("pwrule");
    const page = user.session.page;
    await page.goto(UI_PATHS.APP_LIST_PATH);
    await new UserMenu(page).openProfile(user.email);
    const modal = new ProfileModal(page);
    await modal.modifyPasswordButton.click();

    await modal.fillPasswordChange(TEST_PASSWORD, TOO_SHORT_PASSWORD);

    await expect(page.getByText(PASSWORD_RULE_TEXT.LENGTH, { exact: true }), "the rule is named").toBeVisible();
    await expect(modal.submitButton, "Submit stays disabled").toBeDisabled();

    await modal.fillPasswordChange(TEST_PASSWORD, CHANGED_PASSWORD);

    await expect(modal.submitButton, "a valid new password enables Submit").toBeEnabled();
  });

  test("LC-PR12 a blank old password is refused through the API", lifecycleTestDetails("LC-PR12"), async ({ actor, newUserSession }) => {
    const user = await actor("blankold");

    const answer = await apiRaw(user.request, "PUT", API_PATHS.USER_PASSWORD, { data: { oldPassword: "", newPassword: CHANGED_PASSWORD } });

    expectAnswer(answer, API_ERRORS.INVALID_PARAMETER, "a change with a blank old password");
    expectAnswer(await signInRaw((await newUserSession()).page.request, user.email, TEST_PASSWORD), ALLOWED, "the password is unchanged");
  });

  test("LC-PR13 a password cannot be replaced without the old one", lifecycleTestDetails("LC-PR13"), async ({ actor, newUserSession }) => {
    const user = await actor("setpw");
    expectAnswer(await signInRaw((await newUserSession()).page.request, user.email, TEST_PASSWORD), ALLOWED, "control: the user has a password");

    const answer = await apiRaw(user.request, "POST", API_PATHS.USER_PASSWORD, { params: { [USER_SET_PASSWORD_PARAM]: CHANGED_PASSWORD } });

    expectAnswer(answer, API_ERRORS.INVALID_PASSWORD, "the route that sets a password refuses a user who already has one");
    expectAnswer(await signInRaw((await newUserSession()).page.request, user.email, TEST_PASSWORD), ALLOWED, "the old password still signs in");
    expectAnswer(await signInRaw((await newUserSession()).page.request, user.email, CHANGED_PASSWORD), API_ERRORS.INVALID_PASSWORD, "the attempted password does not sign in");
  });

  test("LC-PR14 the server refuses a new password the client rule refuses", lifecycleTestDetails("LC-PR14"), async ({ actor, newUserSession }) => {
    const user = await actor("weakpw");
    const second = (await newUserSession()).page.request;
    expectAnswer(await signInRaw(second, user.email, TEST_PASSWORD), ALLOWED, "setup: a second session of the user");

    const answer = await apiRaw(user.request, "PUT", API_PATHS.USER_PASSWORD, { data: { oldPassword: TEST_PASSWORD, newPassword: WEAK_PASSWORD } });

    expectAnswer(answer, API_ERRORS.INVALID_PASSWORD, "a one-character new password is refused");
    expect(answer.body, "the refusal names the rule").toContain(PASSWORD_TOO_WEAK_MESSAGE);
    expectAnswer(await signInRaw((await newUserSession()).page.request, user.email, TEST_PASSWORD), ALLOWED, "the password is unchanged");
    expectAnswer(await signInRaw((await newUserSession()).page.request, user.email, WEAK_PASSWORD), API_ERRORS.INVALID_PASSWORD, "the weak password does not sign in");
    expectAnswer(await apiRaw(second, "GET", API_PATHS.USER_MY_ORG), ALLOWED, "the second session survives: the refused change ended nothing");
    expectAnswer(await apiRaw(user.request, "PUT", API_PATHS.USER_PASSWORD, { data: { oldPassword: TEST_PASSWORD, newPassword: CHANGED_PASSWORD } }), ALLOWED, "control: the route accepts a password that meets the rule");
  });
});
