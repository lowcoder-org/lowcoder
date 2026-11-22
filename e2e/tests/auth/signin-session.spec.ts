import {
  acceptInvitation,
  apiRaw,
  createInvitation,
  currentUser,
  signIn,
  signInRaw,
  switchOrganization,
} from "../../src/api/client";
import {
  API_ERRORS,
  API_OK,
  API_PATHS,
  COOKIE_HEADER,
  SESSION_COOKIE_NAME,
  SET_COOKIE_HEADER,
  TAGS,
  TEST_PASSWORD,
  UI_PATHS,
} from "../../src/constants";
import { expect, test, uniqueEmail } from "../../src/fixtures";
import { AppListPage } from "../../src/pages/AppListPage";
import { LoginPage } from "../../src/pages/LoginPage";
import { UserMenu } from "../../src/pages/UserMenu";
import { expectAnswer } from "../../src/security/assertions";
import { DEFECT_ANNOTATION_TYPE, lifecycleTestDetails } from "../../src/security/quarantine";

/**
 * Sign-in and session of a user (LC-AU09 to LC-AU14): the unknown address, the choice among several workspaces, sign-out
 * in the UI, the cookie's lifetime and the redirects of signed-in and anonymous visitors.
 */

const ALLOWED = { status: 200, code: API_OK } as const;
/** The 3.0.0 default of LOWCODER_COOKIE_MAX_AGE is 24 hours; measured on the image. */
const COOKIE_MAX_AGE_SECONDS = 86_400;
/** `Max-Age` as an exact attribute: followed by the next attribute or the end, so `Max-Age=864000` does not match. */
const COOKIE_MAX_AGE_ATTRIBUTE = new RegExp(`Max-Age=${COOKIE_MAX_AGE_SECONDS}(;|$)`);
const SIGN_IN_ONLY_PAGES = ["/user/auth/login", "/user/auth/register", "/user/auth/forgot-password"] as const;
/** The unknown-address message is an account oracle of the D-13 route (the by-user lookup); the test records it, it does not quarantine. */
const D13_ANNOTATION = { type: DEFECT_ANNOTATION_TYPE, description: "D-13" } as const;

test.describe("lifecycle: sign-in and session", () => {
  test(
    "LC-AU09 a sign-in with an unknown address tells the visitor that no user exists (characterisation)",
    { ...lifecycleTestDetails("LC-AU09"), annotation: D13_ANNOTATION },
    async ({ newUserSession }, testInfo) => {
      const session = await newUserSession();
      const login = new LoginPage(session.page);
      await login.open();

      await login.emailInput.fill(uniqueEmail("nobody", testInfo.workerIndex));
      await login.continueButton.click();

      await expect(login.userNotFoundMessage, "the page says no such user exists").toBeVisible();
      await expect(login.emailInput, "the visitor stays on the address step").toBeVisible();
    },
  );

  test("LC-AU10 a user of two workspaces chooses the workspace at sign-in", lifecycleTestDetails("LC-AU10"), async ({ actor, newUserSession }) => {
    const host = await actor("host");
    const member = await actor("twoorgs");
    await acceptInvitation(member.request, await createInvitation(host.request, host.orgId));
    await switchOrganization(member.request, member.orgId);
    const mine = await currentUser(member.request);
    expect(mine.currentOrgId, "before: the user's current workspace is its own").toBe(member.orgId);
    const nameOf = (orgId: string) => mine.orgAndRoles.find((entry) => entry.org.id === orgId)?.org.name;
    const hostName = nameOf(host.orgId);
    const ownName = nameOf(member.orgId);
    expect(hostName, "the user belongs to the host's workspace").toBeDefined();
    expect(ownName, "and to its own").toBeDefined();
    expect(hostName, "the two workspaces have different names").not.toBe(ownName);

    const session = await newUserSession();
    const login = new LoginPage(session.page);
    await login.open();
    await login.emailInput.fill(member.email);
    await login.continueButton.click();
    await expect(login.selectWorkspaceHeading, "the workspace step is shown").toBeVisible();
    await expect(login.workspaceCard(ownName!), "the user's own workspace is listed").toBeVisible();
    await expect(login.workspaceCard(hostName!), "and the host's").toBeVisible();
    await login.chooseWorkspace(hostName!);
    await login.passwordInput.fill(TEST_PASSWORD);
    await login.signInButton.click();

    await expect(session.page, "after the sign-in the user is on the app list").toHaveURL(UI_PATHS.APP_LIST);
    expect((await currentUser(session.page.request)).currentOrgId, "the chosen workspace is the current one").toBe(host.orgId);
  });

  test("LC-AU11 signing out in the UI ends the server session and leaves the other browser signed in", lifecycleTestDetails("LC-AU11", [TAGS.CORE]), async ({ actor, newUserSession }) => {
    const first = await actor("signout");
    const second = await newUserSession();
    await signIn(second.page.request, first.email);
    const cookie = (await first.request.storageState()).cookies.find((entry) => entry.name === SESSION_COOKIE_NAME);
    expect(cookie, "the first browser holds a session cookie").toBeDefined();
    const anonymous = (await newUserSession()).page.request;
    const replay = () =>
      apiRaw(anonymous, "GET", API_PATHS.USER_MY_ORG, { headers: { [COOKIE_HEADER]: `${SESSION_COOKIE_NAME}=${cookie?.value}` } });
    expectAnswer(await replay(), ALLOWED, "before: the cookie of the first browser works when replayed");
    const firstList = new AppListPage(first.session.page);
    await firstList.open();
    await expect(firstList.title, "the first browser shows the app list").toBeVisible();

    await new UserMenu(first.session.page).signOut(first.email);
    await expect(first.session.page, "the UI leaves for the sign-in page").toHaveURL(UI_PATHS.LOGIN);
    await expect(new LoginPage(first.session.page).emailInput, "and asks for the address again").toBeVisible();

    expectAnswer(await replay(), API_ERRORS.UNAUTHENTICATED, "after: the replayed cookie of the signed-out session");
    const secondList = new AppListPage(second.page);
    await secondList.open();
    await expect(secondList.title, "the other browser is still signed in").toBeVisible();
  });

  test("LC-AU12 the session cookie lives 24 hours (characterisation)", lifecycleTestDetails("LC-AU12"), async ({ actor, newUserSession }) => {
    const user = await actor("cookie");
    const visitor = (await newUserSession()).page.request;

    const answer = await signInRaw(visitor, user.email);

    expectAnswer(answer, ALLOWED, "the sign-in works");
    const setCookie = answer.headers[SET_COOKIE_HEADER] ?? "";
    expect(setCookie.includes(`${SESSION_COOKIE_NAME}=`), "the answer sets the session cookie").toBe(true);
    expect(COOKIE_MAX_AGE_ATTRIBUTE.test(setCookie), "with a lifetime of exactly 24 hours").toBe(true);
  });

  test("LC-AU13 a signed-in user is sent away from the sign-in, sign-up and forgot-password pages", lifecycleTestDetails("LC-AU13"), async ({ actor }) => {
    const user = await actor("signedin");
    const page = user.session.page;
    const appList = new AppListPage(page);
    await appList.open();
    await expect(appList.title, "control: the user is signed in").toBeVisible();

    for (const path of SIGN_IN_ONLY_PAGES) {
      await page.goto(path);
      await expect(page, `${path} leads to the app list`).toHaveURL(UI_PATHS.APP_LIST);
      await expect(appList.title, `${path}: the app list is shown`).toBeVisible();
    }
  });

  test("LC-AU14 an anonymous visitor of the app list lands on the sign-in page", lifecycleTestDetails("LC-AU14"), async ({ newUserSession }) => {
    const session = await newUserSession();

    await session.page.goto(UI_PATHS.APP_LIST_PATH);

    await expect(session.page).toHaveURL(UI_PATHS.LOGIN);
    await expect(new LoginPage(session.page).emailInput, "the sign-in form is shown").toBeVisible();
  });
});
