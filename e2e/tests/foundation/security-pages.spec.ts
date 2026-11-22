import { apiRaw } from "../../src/api/client";
import { API_ERRORS, SETTING_PATHS, UI_PATHS, datasourcesByOrgPath } from "../../src/constants";
import { expect, test } from "../../src/fixtures";
import { AppViewPage } from "../../src/pages/AppViewPage";
import { DatasourcePage } from "../../src/pages/DatasourcePage";
import { SettingPage } from "../../src/pages/SettingPage";
import { postgresConnection } from "../../src/postgres";
import { adminOfApiUser, joinWorkspace, makeDeveloper, seedPrivateApp } from "../../src/security/actors";

/** Unit tests of the page objects added for the security UI checks: each is run where it must work, as the owner. */

const DATASOURCE_NAME = "e2e-sec-page-ds";

test.describe("security page objects", () => {
  test("AppViewPage.openAndAwaitQuery returns the status of the app's first query run", async ({ page, apiUser }) => {
    const a = await adminOfApiUser(page.request, apiUser);
    const { appId } = await seedPrivateApp(a);

    expect(await new AppViewPage(page).openAndAwaitQuery(appId)).toBe(200);
  });

  test("DatasourcePage.createPostgres saves a data source as an admin and returns the page's own answer", async ({ page, apiUser }) => {
    const a = await adminOfApiUser(page.request, apiUser);
    const list = () => apiRaw(a.request, "GET", datasourcesByOrgPath(), { params: { orgId: a.orgId } });
    expect((await list()).body, "before: no such data source").not.toContain(DATASOURCE_NAME);
    const datasources = new DatasourcePage(page);
    await datasources.open();
    await expect(datasources.newButton, "the page loads").toBeVisible();

    const answer = await datasources.createPostgres(postgresConnection(), DATASOURCE_NAME);

    expect(answer, "the form's save answer (201 created)").toEqual({ status: 201, code: 1 });
    expect((await list()).body, "after: the data source exists").toContain(DATASOURCE_NAME);
  });

  test("DatasourcePage.createPostgres returns the denial of a plain member (status and code of the server)", async ({ page, apiUser, actor }) => {
    const a = await adminOfApiUser(page.request, apiUser);
    const member = await actor("member");
    await joinWorkspace(a, member);
    const datasources = new DatasourcePage(member.session.page);
    await datasources.open();
    await expect(datasources.newButton).toBeVisible();

    const answer = await datasources.createPostgres(postgresConnection(), DATASOURCE_NAME);

    expect(answer).toEqual(API_ERRORS.NEED_DEV_TO_CREATE_RESOURCE);
  });

  test("SettingPage: an admin and a developer open the settings, a plain member is sent to /apps; members rows and role selects", async ({ page, apiUser, actor }) => {
    const a = await adminOfApiUser(page.request, apiUser);
    const member = await actor("member");
    const developer = await actor("developer");
    await joinWorkspace(a, member);
    await joinWorkspace(a, developer);
    await makeDeveloper(a, developer);

    const admin = new SettingPage(page);
    await admin.open();
    await expect(admin.userAuthenticationEntry, "the admin's sidebar").toBeVisible();
    await admin.open(SETTING_PATHS.OAUTH_PROVIDER);
    await expect(admin.addOauthProviderButton, "the admin's provider page").toBeVisible();
    await admin.openMembers();
    await expect(admin.memberRow(member.email), "the member's row").toBeVisible();
    await expect(admin.roleSelectOf(member.email), "the admin may change a member's role").not.toHaveClass(/ant-select-disabled/);
    await expect(admin.roleSelectOf(a.email), "but not its own").toHaveClass(/ant-select-disabled/);

    const dev = new SettingPage(developer.session.page);
    await dev.open();
    await expect(dev.userAuthenticationEntry, "the developer's sidebar").toBeVisible();

    const plain = new SettingPage(member.session.page);
    await plain.open();
    await expect(member.session.page, "the plain member is sent to the app list").toHaveURL(UI_PATHS.APP_LIST);
    await expect(plain.userAuthenticationEntry).toHaveCount(0);
  });
});
