import {
  acceptInvitation,
  createApp,
  createInvitation,
  currentUserId,
  editAppRaw,
  grantAppPermission,
  publishApp,
  registerUser,
  viewAppRaw,
} from "../../src/api/client";
import { API_CODE_APP_PERMISSION_DENIED, API_OK, TAGS, UI_PATHS } from "../../src/constants";
import { appDsl, button } from "../../src/dsl/builders";
import { expect, test, uniqueEmail } from "../../src/fixtures";
import { AppListPage } from "../../src/pages/AppListPage";
import { AppViewPage } from "../../src/pages/AppViewPage";

const TEST_ID = "e2e-shared-button";
const BUTTON_TEXT = "Shared app";

test("an invited member sees an app only when it is shared with them, and cannot edit it", { tag: TAGS.CORE }, async ({
  page,
  apiUser,
  newUserSession,
}, testInfo) => {
  const dsl = appDsl([button({ id: "b1", name: "button1", text: BUTTON_TEXT, testId: TEST_ID })]);
  const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-shared", dsl });
  await publishApp(page.request, appId);

  const memberSession = await newUserSession();
  const memberRequest = memberSession.context.request;
  await registerUser(memberRequest, uniqueEmail("member", testInfo.workerIndex));
  await acceptInvitation(memberRequest, await createInvitation(page.request, apiUser.orgId));
  const memberView = new AppViewPage(memberSession.page);

  expect(await viewAppRaw(memberRequest, appId), "a member without a grant may not view the app").toMatchObject({
    code: API_CODE_APP_PERMISSION_DENIED,
  });
  await memberView.open(appId);
  await expect(memberView.permissionDeniedMessage, "the app tells them they may not view it").toBeVisible();
  await expect(memberView.byTestId(TEST_ID), "the app is not rendered for them").toHaveCount(0);

  await grantAppPermission(page.request, appId, { role: "viewer", userIds: [await currentUserId(memberRequest)] });

  expect(await viewAppRaw(memberRequest, appId), "a viewer may view the app").toMatchObject({ code: API_OK });
  await memberView.open(appId);
  await expect(memberView.byTestId(TEST_ID).getByRole("button", { name: BUTTON_TEXT })).toBeVisible();
  expect(await editAppRaw(memberRequest, appId), "a viewer may not open the app for editing").toMatchObject({
    code: API_CODE_APP_PERMISSION_DENIED,
  });
});

test("a member who opens the invitation link lands in the workspace and sees an app once it is shared", { tag: TAGS.CORE }, async ({
  page,
  apiUser,
  newUserSession,
}, testInfo) => {
  const appName = "e2e-shared-listed";
  const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: appName });
  await publishApp(page.request, appId);
  const inviteCode = await createInvitation(page.request, apiUser.orgId);
  const member = await newUserSession();
  await registerUser(member.context.request, uniqueEmail("link", testInfo.workerIndex));
  const memberList = new AppListPage(member.page);

  await memberList.openInvitation(inviteCode);
  await expect(member.page, "the invitation leads to the app list").toHaveURL(UI_PATHS.APP_LIST);
  await expect(memberList.nothingShared, "nothing is shared with the new member yet").toBeVisible();
  await expect(memberList.appNamed(appName)).toHaveCount(0);

  await grantAppPermission(page.request, appId, { role: "viewer", userIds: [await currentUserId(member.context.request)] });
  await member.page.reload();

  await expect(memberList.appNamed(appName), "the shared app is in the member's list").toBeVisible();
});
