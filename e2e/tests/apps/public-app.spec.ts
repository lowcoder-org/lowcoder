import { createApp, publishApp, setPublicToAll } from "../../src/api/client";
import { TAGS } from "../../src/constants";
import { appDsl, button } from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";
import { AppViewPage } from "../../src/pages/AppViewPage";

const TEST_ID = "e2e-public-button";
const BUTTON_TEXT = "Open to all";

test("a public app renders for a visitor who is not signed in, a private one does not", { tag: TAGS.CORE }, async ({
  page,
  apiUser,
  newUserSession,
}) => {
  const dsl = appDsl([button({ id: "b1", name: "button1", text: BUTTON_TEXT, testId: TEST_ID })]);
  const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-public", dsl });
  await publishApp(page.request, appId);
  const visitor = await newUserSession();
  const visitorView = new AppViewPage(visitor.page);

  await visitorView.openAsDeniedVisitor(appId);
  await expect(visitorView.byTestId(TEST_ID), "a private app is not shown to a visitor").toHaveCount(0);

  await setPublicToAll(page.request, appId, true);
  await visitorView.open(appId);
  await expect(visitorView.byTestId(TEST_ID).getByRole("button", { name: BUTTON_TEXT }), "a public app is shown").toBeVisible();

  await setPublicToAll(page.request, appId, false);
  await visitorView.openAsDeniedVisitor(appId);
  await expect(visitorView.byTestId(TEST_ID), "making it private hides it again").toHaveCount(0);
});
