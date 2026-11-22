import { expect, test } from "../../src/fixtures";
import { addGithubConfigRaw, listAuthConfigs, seedOAuthConfig } from "../../src/api/client";
import {
  API_ERRORS,
  API_OK,
  LAST_PROVIDER_NOTICE,
  OAUTH_AUTH_TYPE,
  OAUTH_DUMMY_CLIENT_ID,
  TEST_PASSWORD,
  UI_PATHS,
  orgLoginPath,
} from "../../src/constants";
import { LoginPage } from "../../src/pages/LoginPage";
import { ProvidersPage } from "../../src/pages/ProvidersPage";
import { expectAnswer } from "../../src/security/assertions";
import { lifecycleTestDetails } from "../../src/security/quarantine";

/**
 * The admin's configuration of the sign-in providers of a workspace (LC-IP01 to LC-IP05, LC-IP07, LC-IP08). No provider
 * endpoint is ever called: a GitHub configuration is only stored, the Generic form is only submitted empty. Every test changes
 * its own workspace's configurations. LC-IP06 (switching e-mail sign-in off) is not built: it ends the sessions of every member
 * that signed in by e-mail, among them the instance super admin's, whom every worker shares (measured, M-29, README O-17).  LC-IP05
 * therefore only reads the page (the notice and the disabled button): sending the removal of the e-mail configuration, even where it is the
 * sole method and the server refuses it (measured: 403 / 5617), would end the super admin's session for the rest of the run if a server stopped refusing.
 */

const GITHUB_LABEL = "GitHub";
const EMAIL_LABEL = "Email";
const GITHUB_SIGN_IN_BUTTON = "Sign in with Github";
const DUMMY_SECRET = "e2e-provider-secret";
const EMAIL_CONFIG_ID = "EMAIL";
const GENERIC_LABEL = "Generic";
/** The list drops a row before the server has stored the deletion (measured: one run saw the row gone and the configuration still listed), so the server state is polled. */
const SERVER_SETTLE_TIMEOUT_MS = 10_000;

test.describe("lifecycle: sign-in provider configuration", () => {
  test("LC-IP01 an admin adds a GitHub provider in the UI", lifecycleTestDetails("LC-IP01"), async ({ actor }) => {
    const admin = await actor("ipadd");
    const providers = new ProvidersPage(admin.session.page);

    await providers.open();
    await expect(providers.rows(GITHUB_LABEL), "setup: no GitHub configuration yet").toHaveCount(0);
    await providers.openAddModal();
    await providers.chooseType(GITHUB_LABEL);
    await providers.fillClient(OAUTH_DUMMY_CLIENT_ID, DUMMY_SECRET);
    await providers.saveModal();

    await expect(providers.savedToast).toBeVisible();
    await expect(providers.enabledRows(GITHUB_LABEL), "the list shows an enabled GitHub row").toHaveCount(1);
    const configs = await listAuthConfigs(admin.request);
    expect(configs.filter((entry) => entry.authType === OAUTH_AUTH_TYPE && entry.enable).length, "and the server lists one enabled GITHUB configuration").toBe(1);
  });

  test("LC-IP02 the workspace's sign-in page offers the enabled provider", lifecycleTestDetails("LC-IP02"), async ({ actor, newUserSession }) => {
    const admin = await actor("ipoffer");
    await seedOAuthConfig(admin.request, { clientSecret: DUMMY_SECRET });
    const visitor = await newUserSession();

    await visitor.page.goto(orgLoginPath(admin.orgId));

    const login = new LoginPage(visitor.page);
    await expect(login.emailInput, "the e-mail form is shown").toBeVisible();
    await expect(visitor.page.getByText(GITHUB_SIGN_IN_BUTTON), "and the GitHub button (not clicked: it leads to github.com)").toBeVisible();
  });

  test("LC-IP03 a disabled provider is marked in the list and leaves the sign-in page", lifecycleTestDetails("LC-IP03"), async ({ actor, newUserSession }) => {
    const admin = await actor("ipdisable");
    await seedOAuthConfig(admin.request, { clientSecret: DUMMY_SECRET });
    const providers = new ProvidersPage(admin.session.page);
    await providers.open();
    await expect(providers.enabledRows(GITHUB_LABEL), "setup: the GitHub row is enabled").toHaveCount(1);

    await providers.openDetail(providers.rows(GITHUB_LABEL));
    await providers.disableButton.click();
    await providers.confirm();

    await expect(providers.disabledRows(GITHUB_LABEL), "the list marks the row as not enabled").toHaveCount(1);
    expect((await listAuthConfigs(admin.request)).filter((entry) => entry.authType === OAUTH_AUTH_TYPE).map((entry) => entry.enable), "the server agrees").toEqual([false]);
    const visitor = await newUserSession();
    await visitor.page.goto(orgLoginPath(admin.orgId));
    await expect(new LoginPage(visitor.page).emailInput, "the sign-in page is loaded").toBeVisible();
    await expect(visitor.page.getByText(GITHUB_SIGN_IN_BUTTON), "and no longer offers GitHub").toHaveCount(0);
  });

  test("LC-IP04 a deleted provider is gone", lifecycleTestDetails("LC-IP04"), async ({ actor }) => {
    const admin = await actor("ipdelete");
    await seedOAuthConfig(admin.request, { clientSecret: DUMMY_SECRET });
    const providers = new ProvidersPage(admin.session.page);
    await providers.open();
    await expect(providers.rows(GITHUB_LABEL), "setup: the GitHub row exists").toHaveCount(1);

    await providers.openDetail(providers.rows(GITHUB_LABEL));
    await providers.deleteButton.click();
    await providers.confirm();

    await expect(providers.rows(GITHUB_LABEL), "the row is gone").toHaveCount(0);
    await expect
      .poll(async () => (await listAuthConfigs(admin.request)).some((entry) => entry.authType === OAUTH_AUTH_TYPE), { message: "and the server lists no GITHUB configuration", timeout: SERVER_SETTLE_TIMEOUT_MS })
      .toBe(false);
  });

  test("LC-IP05 the last enabled sign-in method cannot be switched off in the UI", lifecycleTestDetails("LC-IP05"), async ({ actor, newUserSession }) => {
    const admin = await actor("iplast");
    expect((await listAuthConfigs(admin.request)).map((entry) => [entry.id, entry.enable]), "setup: e-mail is the only configuration, enabled").toEqual([[EMAIL_CONFIG_ID, true]]);
    const providers = new ProvidersPage(admin.session.page);
    await providers.open();

    await providers.openDetail(providers.rows(EMAIL_LABEL));

    await expect(providers.noticeText(LAST_PROVIDER_NOTICE), "the page explains why").toBeVisible();
    await expect(providers.disableButton, "and its Disable button is disabled").toBeDisabled();
    const visitor = await newUserSession();
    await visitor.page.goto(orgLoginPath(admin.orgId));
    await new LoginPage(visitor.page).signInOnWorkspacePage(admin.email, TEST_PASSWORD);
    await expect(visitor.page, "and e-mail sign-in on the workspace's page still works").toHaveURL(UI_PATHS.APP_LIST);
  });

  test("LC-IP07 a second configuration of the same type is refused", lifecycleTestDetails("LC-IP07"), async ({ actor }) => {
    const admin = await actor("ipdup");
    await seedOAuthConfig(admin.request, { clientSecret: DUMMY_SECRET });
    expect((await listAuthConfigs(admin.request)).filter((entry) => entry.authType === OAUTH_AUTH_TYPE).length, "setup: one GITHUB configuration").toBe(1);

    const answer = await addGithubConfigRaw(admin.request, { clientId: `${OAUTH_DUMMY_CLIENT_ID}-second`, clientSecret: DUMMY_SECRET });

    expectAnswer(answer, API_ERRORS.DUPLICATE_AUTH_CONFIG_ADDITION, "the second GitHub configuration");
    expect((await listAuthConfigs(admin.request)).filter((entry) => entry.authType === OAUTH_AUTH_TYPE).length, "and still one is listed").toBe(1);
  });

  test("LC-IP08 the Generic form requires its issuer endpoint", lifecycleTestDetails("LC-IP08"), async ({ actor }) => {
    const admin = await actor("ipgeneric");
    const providers = new ProvidersPage(admin.session.page);
    const posts: string[] = [];
    admin.session.page.on("request", (request) => {
      if (request.method() === "POST" && request.url().includes("/api/auth/config")) {
        posts.push(request.url());
      }
    });
    await providers.open();
    await providers.openAddModal();
    await providers.chooseType(GENERIC_LABEL);

    await providers.saveModal();

    await expect(providers.issuerRequiredMessage, "the form asks for the issuer endpoint").toBeVisible();
    expect(posts.length, "and sent nothing to the server").toBe(0);
    expect((await listAuthConfigs(admin.request)).map((entry) => entry.id), "no configuration was added").toEqual([EMAIL_CONFIG_ID]);
  });
});
