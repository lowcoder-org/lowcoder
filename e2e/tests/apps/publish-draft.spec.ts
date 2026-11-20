import { createApp, getAppDsl, publishApp, updateApp } from "../../src/api/client";
import { TAGS } from "../../src/constants";
import { appDsl, button } from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";
import { AppViewPage } from "../../src/pages/AppViewPage";

const TEST_ID = "e2e-version";
const FIRST_TEXT = "Version one";
const SECOND_TEXT = "Version two";

function dslShowing(text: string): object {
  return appDsl([button({ id: "b1", name: "button1", text, testId: TEST_ID })]);
}

test("the published view shows the last published version, not the newer draft", { tag: TAGS.CORE }, async ({
  page,
  apiUser,
}) => {
  const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-draft", dsl: dslShowing(FIRST_TEXT) });
  await publishApp(page.request, appId);
  const view = new AppViewPage(page);

  await view.open(appId);
  await expect(view.byTestId(TEST_ID), "first published version").toContainText(FIRST_TEXT);

  await updateApp(page.request, appId, { dsl: dslShowing(SECOND_TEXT) });
  expect(JSON.stringify((await getAppDsl(page.request, appId)).applicationDSL), "the draft holds the new version").toContain(
    SECOND_TEXT,
  );
  await view.open(appId);
  await expect(view.byTestId(TEST_ID), "the unpublished draft is not shown").toContainText(FIRST_TEXT);

  await publishApp(page.request, appId, "1.0.1");
  await view.open(appId);
  await expect(view.byTestId(TEST_ID), "after republishing the new version is shown").toContainText(SECOND_TEXT);
});
