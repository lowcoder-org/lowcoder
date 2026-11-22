import type { APIRequestContext } from "@playwright/test";
import { apiRaw, createInvitation, currentUser, registerRaw, signInRaw } from "../../src/api/client";
import { API_ERRORS, API_OK, API_PATHS, INVITE_LINK_PATH, TAGS, TEST_PASSWORD, UI_PATHS } from "../../src/constants";
import { expect, test, uniqueEmail } from "../../src/fixtures";
import { LoginPage } from "../../src/pages/LoginPage";
import { expectAnswer } from "../../src/security/assertions";
import { lifecycleTestDetails } from "../../src/security/quarantine";

/**
 * The stack with the e-mail sign-up switched off by the deployment (E2E_STACK_PROFILE=signup-disabled, LC-AU20 to LC-AU24):
 * every fixture that makes a user signs up, so only these tests run there. The code lets the FIRST sign-up through while no
 * workspace has an admin yet (measured: the first sign-up answers 200, every later one 400 / 5003), so every test first makes
 * sure some admin exists; it accepts both answers, so no test depends on the order or on the worker that runs first.
 */

const SIGNUP_DISABLED = [TAGS.SIGNUP_DISABLED];
// LC-AU23 and LC-AU24 use the super admin fixture, so they also carry TAGS.SUPERADMIN (guard of foundation/run-selection.spec.ts); on this profile `grep` selects by @signup-disabled alone, so the tag changes nothing there.
const INVITATION_HEADING_SUFFIX = "invites You to work together";

/** Makes sure the stack has an admin, so that the sign-up exception is used up: the first sign-up passes, a later one is refused. */
async function ensureSomeAdminExists(visitor: APIRequestContext, workerIndex: number): Promise<void> {
  const answer = await registerRaw(visitor, uniqueEmail("firstadmin", workerIndex), TEST_PASSWORD);
  const passed = answer.status === 200 && answer.code === API_OK;
  const refused = answer.status === API_ERRORS.UNSUPPORTED_OPERATION.status && answer.code === API_ERRORS.UNSUPPORTED_OPERATION.code;
  expect(passed || refused, "setup: the first sign-up passes or a sign-up is already refused").toBe(true);
}

test.describe("lifecycle: a stack with sign-up switched off", () => {
  test("LC-AU20 a sign-up is refused through the API", lifecycleTestDetails("LC-AU20", SIGNUP_DISABLED), async ({ newUserSession }, testInfo) => {
    await ensureSomeAdminExists((await newUserSession()).page.request, testInfo.workerIndex);
    const address = uniqueEmail("refused", testInfo.workerIndex);
    const visitor = (await newUserSession()).page.request;

    const answer = await registerRaw(visitor, address, TEST_PASSWORD);

    expectAnswer(answer, API_ERRORS.UNSUPPORTED_OPERATION, "a sign-up");
    expectAnswer(await signInRaw((await newUserSession()).page.request, address, TEST_PASSWORD), API_ERRORS.INVALID_PASSWORD, "the refused address does not exist");
  });

  test("LC-AU21 the sign-up page sends the visitor to the sign-in page", lifecycleTestDetails("LC-AU21", SIGNUP_DISABLED), async ({ newUserSession }, testInfo) => {
    await ensureSomeAdminExists((await newUserSession()).page.request, testInfo.workerIndex);
    const session = await newUserSession();

    await session.page.goto(UI_PATHS.REGISTER);

    await expect(session.page, "the register page redirects").toHaveURL(UI_PATHS.LOGIN);
    await expect(new LoginPage(session.page).emailInput, "to the sign-in form").toBeVisible();
  });

  test("LC-AU22 the sign-in page offers no sign-up", lifecycleTestDetails("LC-AU22", SIGNUP_DISABLED), async ({ newUserSession }, testInfo) => {
    await ensureSomeAdminExists((await newUserSession()).page.request, testInfo.workerIndex);
    const session = await newUserSession();
    const login = new LoginPage(session.page);

    await login.open();

    await expect(login.emailInput, "the sign-in form is loaded").toBeVisible();
    await expect(session.page.getByText("Sign Up", { exact: true }), "and offers no sign-up").toHaveCount(0);
  });

  test("LC-AU23 an invited visitor cannot sign up either (characterisation)", lifecycleTestDetails("LC-AU23", [TAGS.SIGNUP_DISABLED, TAGS.SUPERADMIN]), async ({ newUserSession, superAdmin }, testInfo) => {
    await ensureSomeAdminExists((await newUserSession()).page.request, testInfo.workerIndex);
    const orgId = (await currentUser(superAdmin.request)).orgAndRoles[0]?.org.id;
    expect(orgId, "setup: the super admin, a member of every workspace, sees a workspace").toBeTruthy();
    const code = await createInvitation(superAdmin.request, orgId!);
    const session = await newUserSession();

    await session.page.goto(`${INVITE_LINK_PATH}${code}`);

    await expect(session.page.getByText(INVITATION_HEADING_SUFFIX, { exact: false }), "the invitation page greets the visitor (control)").toBeVisible();
    await expect(new LoginPage(session.page).emailInput, "with the sign-in form").toBeVisible();
    await expect(session.page.getByText("Sign Up", { exact: true }), "but offers no sign-up").toHaveCount(0);
    expectAnswer(await registerRaw((await newUserSession()).page.request, uniqueEmail("invited", testInfo.workerIndex), TEST_PASSWORD, { invitationId: code, orgId: orgId! }), API_ERRORS.UNSUPPORTED_OPERATION, "and the API refuses the invitation-bound sign-up too");
  });

  test("LC-AU24 an admin's create-user call is refused too (characterisation)", lifecycleTestDetails("LC-AU24", [TAGS.SIGNUP_DISABLED, TAGS.SUPERADMIN]), async ({ newUserSession, superAdmin }, testInfo) => {
    await ensureSomeAdminExists((await newUserSession()).page.request, testInfo.workerIndex);
    const orgId = (await currentUser(superAdmin.request)).orgAndRoles[0]?.org.id;
    expect(orgId, "setup: the super admin sees a workspace").toBeTruthy();
    const address = uniqueEmail("created", testInfo.workerIndex);

    const answer = await apiRaw(superAdmin.request, "POST", `${API_PATHS.USERS}/new/${orgId}`, { data: { email: address, password: TEST_PASSWORD } });

    expectAnswer(answer, API_ERRORS.UNSUPPORTED_OPERATION, "the create-user call of an admin");
    expectAnswer(await signInRaw((await newUserSession()).page.request, address, TEST_PASSWORD), API_ERRORS.INVALID_PASSWORD, "no user was created");
  });
});
