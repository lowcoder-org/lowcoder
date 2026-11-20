import { createApp, publishApp } from "../../src/api/client";
import { TAGS } from "../../src/constants";
import { appDsl, button } from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";
import { AppViewPage } from "../../src/pages/AppViewPage";

const BUTTON_TEST_ID = "e2e-hello-button";
const BUTTON_TEXT = "Hello E2E";

test("an app seeded through the API renders in the published view", { tag: TAGS.SMOKE }, async ({
  page,
  apiUser,
}) => {
  const dsl = appDsl([button({ id: "b1", name: "button1", text: BUTTON_TEXT, testId: BUTTON_TEST_ID })]);
  const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-view", dsl });
  await publishApp(page.request, appId);

  const view = new AppViewPage(page);
  await view.open(appId);

  await expect(view.byTestId(BUTTON_TEST_ID).getByRole("button", { name: BUTTON_TEXT })).toBeVisible();
});
