import { apiRaw, createApp, createPostgresDatasource, editAppRaw, listAppPermissions, publishApp, viewAppRaw } from "../../src/api/client";
import { API_ERRORS, API_OK, TAGS, datasourcesByOrgPath } from "../../src/constants";
import { appDsl, button } from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";
import { AppListPage } from "../../src/pages/AppListPage";
import { AppViewPage } from "../../src/pages/AppViewPage";
import { DatasourcePage } from "../../src/pages/DatasourcePage";
import { EditorPage } from "../../src/pages/EditorPage";
import { ShareDialog } from "../../src/pages/ShareDialog";
import { postgresConnection } from "../../src/postgres";
import { joinWorkspace, makeDeveloper } from "../../src/security/actors";
import { lifecycleTestDetails } from "../../src/security/quarantine";

/** Sharing an app in the share dialog of the editor (LC-SH01 to LC-SH05); what each user sees after each change. */

const BUTTON_TEST_ID = "e2e-share-button";
const BUTTON_TEXT = "Shared app";
const APP_NAME = "e2e-share-app";
const DATASOURCE_NAME = "e2e-share-ds";
const DENIED = API_ERRORS.NO_PERMISSION_TO_REQUEST_APP;
const ALLOWED = { status: 200, code: API_OK } as const;

/** An app of the workspace owner with one button, published. */
async function publishedApp(owner: { request: import("@playwright/test").APIRequestContext; orgId: string }): Promise<string> {
  const dsl = appDsl([button({ id: "b1", name: "button1", text: BUTTON_TEXT, testId: BUTTON_TEST_ID })]);
  const { appId } = await createApp(owner.request, { orgId: owner.orgId, name: APP_NAME, dsl });
  await publishApp(owner.request, appId);
  return appId;
}

test.describe("lifecycle: sharing in the app share dialog", () => {
  test("LC-SH01 the owner shares an app with a member as viewer in the dialog", lifecycleTestDetails("LC-SH01", [TAGS.CORE]), async ({ actor }) => {
    const owner = await actor("shareowner");
    const member = await actor("sharemember");
    await joinWorkspace(owner, member);
    const appId = await publishedApp(owner);
    const memberList = new AppListPage(member.session.page);
    await memberList.open();
    await expect(memberList.nothingShared, "before: nothing is shared with the member").toBeVisible();
    expect(await viewAppRaw(member.request, appId), "before: the member may not view the app").toEqual(DENIED);
    await new EditorPage(owner.session.page).open(appId);
    const share = new ShareDialog(owner.session.page);
    await share.open();

    await share.addMember(member.email);

    await expect(share.rowOf(member.email), "the member is listed in the dialog").toBeVisible();
    await expect.poll(async () => (await listAppPermissions(owner.request, appId)).userPermissions.find((row) => row.id === member.userId)?.role, "the server holds a viewer row").toBe("viewer");
    await memberList.open();
    await expect(memberList.appNamed(APP_NAME), "the app is in the member's list").toBeVisible();
    await new AppViewPage(member.session.page).open(appId);
    await expect(new AppViewPage(member.session.page).byTestId(BUTTON_TEST_ID).getByRole("button", { name: BUTTON_TEXT }), "the member sees the app").toBeVisible();
    expect(await editAppRaw(member.request, appId), "a viewer may not edit").toEqual(DENIED);
  });

  test("LC-SH02 changing the role to Editor in the dialog lets the member edit", lifecycleTestDetails("LC-SH02"), async ({ actor }) => {
    const owner = await actor("shareeditor");
    const member = await actor("shareeditormember");
    await joinWorkspace(owner, member);
    const appId = await publishedApp(owner);
    await new EditorPage(owner.session.page).open(appId);
    const share = new ShareDialog(owner.session.page);
    await share.open();
    await share.addMember(member.email);
    await expect(share.rowOf(member.email)).toBeVisible();
    expect(await editAppRaw(member.request, appId), "before: a viewer may not edit").toEqual(DENIED);

    await share.chooseRole(member.email, "Editor");

    await expect.poll(async () => (await listAppPermissions(owner.request, appId)).userPermissions.find((row) => row.id === member.userId)?.role, "the server holds an editor row").toBe("editor");
    expect(await editAppRaw(member.request, appId), "an editor may open the app for editing").toEqual(ALLOWED);
  });

  test("LC-SH03 removing the row in the dialog takes the app away", lifecycleTestDetails("LC-SH03"), async ({ actor }) => {
    const owner = await actor("shareremove");
    const member = await actor("shareremoved");
    await joinWorkspace(owner, member);
    const appId = await publishedApp(owner);
    await new EditorPage(owner.session.page).open(appId);
    const share = new ShareDialog(owner.session.page);
    await share.open();
    await share.addMember(member.email);
    await expect(share.rowOf(member.email)).toBeVisible();
    expect(await viewAppRaw(member.request, appId), "before: the member views the app").toEqual(ALLOWED);

    await share.chooseRole(member.email, "Remove");

    await expect(share.rowOf(member.email), "the row is gone").toHaveCount(0);
    await expect.poll(async () => viewAppRaw(member.request, appId), "the member's view is refused").toEqual(DENIED);
    const memberList = new AppListPage(member.session.page);
    await memberList.open();
    await expect(memberList.title, "the member's app list has loaded").toBeVisible();
    await expect(memberList.appNamed(APP_NAME), "the app card is gone").toHaveCount(0);
  });

  test("LC-SH04 the public switch makes the app viewable by anyone and back", lifecycleTestDetails("LC-SH04"), async ({ actor, newUserSession }) => {
    const owner = await actor("sharepublic");
    const appId = await publishedApp(owner);
    const visitor = await newUserSession();
    const visitorView = new AppViewPage(visitor.page);
    await visitorView.openAsDeniedVisitor(appId);
    await new EditorPage(owner.session.page).open(appId);
    const share = new ShareDialog(owner.session.page);
    await share.open();
    await share.next();
    await expect(share.publicSwitch, "the public switch is shown").toBeVisible();

    await share.publicSwitch.click();

    await expect.poll(async () => (await listAppPermissions(owner.request, appId)).publicToAll, "the app is public").toBe(true);
    await visitorView.open(appId);
    await expect(visitorView.byTestId(BUTTON_TEST_ID).getByRole("button", { name: BUTTON_TEXT }), "an anonymous visitor sees the app").toBeVisible();

    await share.publicSwitch.click();

    await expect.poll(async () => (await listAppPermissions(owner.request, appId)).publicToAll, "the app is private again").toBeFalsy();
    await visitorView.openAsDeniedVisitor(appId);
  });

  test("LC-SH05 an editor who is not the owner gets no Publish button (client gate, characterisation)", lifecycleTestDetails("LC-SH05"), async ({ actor }) => {
    const owner = await actor("sharegate");
    const editor = await actor("sharegateeditor");
    await joinWorkspace(owner, editor);
    const appId = await publishedApp(owner);
    await new EditorPage(owner.session.page).open(appId);
    const share = new ShareDialog(owner.session.page);
    await share.open();
    await share.addMember(editor.email, "Editor");
    await expect.poll(async () => (await listAppPermissions(owner.request, appId)).userPermissions.find((row) => row.id === editor.userId)?.role).toBe("editor");
    const editorPage = new EditorPage(editor.session.page);

    await editorPage.open(appId);

    await expect(editorPage.canvasButton(BUTTON_TEXT), "the editor opens the app").toBeVisible();
    await expect(new ShareDialog(editor.session.page).publishButton, "but gets no Publish button").toHaveCount(0);
  });

  test("LC-SH06 the data source dialog grants and removes Can Use", lifecycleTestDetails("LC-SH06"), async ({ actor }) => {
    const owner = await actor("shareds");
    const developer = await actor("sharedsdev");
    await joinWorkspace(owner, developer);
    await makeDeveloper(owner, developer);
    await createPostgresDatasource(owner.request, { orgId: owner.orgId, name: DATASOURCE_NAME, connection: postgresConnection() });
    const listedFor = async (user: { request: import("@playwright/test").APIRequestContext }): Promise<boolean> => {
      const answer = await apiRaw(user.request, "GET", datasourcesByOrgPath(), { params: { orgId: owner.orgId } });
      expect({ status: answer.status, code: answer.code }, "the data source list answers").toEqual(ALLOWED);
      return answer.body.includes(DATASOURCE_NAME);
    };
    expect(await listedFor(owner), "control: the owner lists the data source").toBe(true);
    expect(await listedFor(developer), "before: the developer does not list it").toBe(false);
    const datasources = new DatasourcePage(owner.session.page);
    await datasources.open();
    await expect(owner.session.page.getByText(DATASOURCE_NAME).first()).toBeVisible();
    await datasources.openAccessControl(DATASOURCE_NAME);
    const share = new ShareDialog(owner.session.page);

    await share.addMember(developer.email, "Can Use");

    await expect(share.rowOf(developer.email), "the developer is listed in the dialog").toBeVisible();
    await expect.poll(() => listedFor(developer), "the developer lists the data source").toBe(true);

    await share.chooseRole(developer.email, "Remove");

    await expect(share.rowOf(developer.email), "the row is gone").toHaveCount(0);
    await expect.poll(() => listedFor(developer), "the data source is gone from the developer's list").toBe(false);
  });
});
