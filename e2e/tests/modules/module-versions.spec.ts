import { createApp, createModule, FIRST_VERSION_TAG, LowcoderApiError, publishApp, updateApp } from "../../src/api/client";
import { SECOND_VERSION_TAG } from "../../src/constants";
import { appDsl, moduleInstance } from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";
import { expectTextStays } from "../../src/logic/helpers";
import { MODULE_SCENARIO as M, MOUNTED_HOST_OBSERVATION_MS, scenarioModuleDsl } from "../../src/modules/moduleScenario";
import { AppViewPage } from "../../src/pages/AppViewPage";
import { EditorPage } from "../../src/pages/EditorPage";

const INPUT = "alpha";
const PUBLISHED_TEXT = `in=${INPUT}`;
const DRAFT_TEXT = `DRAFT=${INPUT}`;
const DRAFT_TEMPLATE = `DRAFT={{${M.INPUT}.value}}`;
const NEVER_PUBLISHED_DRAFT_TEXT = `DRAFT2=${INPUT}`;
const NEVER_PUBLISHED_DRAFT_TEMPLATE = `DRAFT2={{${M.INPUT}.value}}`;
const LOADING_TEXT = "Loading...";

function hostDsl(moduleId: string): object {
  return appDsl([moduleInstance({ id: "m1", name: M.FIRST_INSTANCE, moduleId, inputs: { [M.INPUT]: INPUT } })]);
}

// A module instance shows "Loading..." right after a page load: every read waits for the text with `toHaveText`.
async function expectModuleText(view: AppViewPage, expected: string, message: string): Promise<void> {
  await expect(view.inModule(M.FIRST_INSTANCE).getByTestId(M.INNER_TEXT_ID), message).toHaveText(expected);
}

// M2 (p6 section 3): which version of a module a host shows.
test.describe("which module version a host shows", () => {
  test("a host shows the latest published version, not a newer draft; a new tag reaches it after a reload", async ({ page, apiUser }, testInfo) => {
    const { appId: moduleId } = await createModule(page.request, { orgId: apiUser.orgId, name: "e2e-m2-module", dsl: scenarioModuleDsl() });
    await publishApp(page.request, moduleId);
    const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-m2-host", dsl: hostDsl(moduleId) });
    await publishApp(page.request, appId);
    const view = new AppViewPage(page);
    const editor = new EditorPage(page);

    await view.open(appId);
    await expectModuleText(view, PUBLISHED_TEXT, "the host shows the published module");

    // The draft changes by API and is not republished.
    await updateApp(page.request, moduleId, { dsl: scenarioModuleDsl(DRAFT_TEMPLATE) });
    await view.open(appId);
    await expectModuleText(view, PUBLISHED_TEXT, "a newer draft does not reach the published host");
    await editor.open(appId);
    await expectModuleText(view, PUBLISHED_TEXT, "the host's editor shows the published module too");

    // Publishing an existing tag fails. Only the failure is asserted: the measured HTTP 500 / code 5000 is not a
    // tag-specific error and may change (defects report O-12).
    const duplicate = await publishApp(page.request, moduleId, FIRST_VERSION_TAG).then(
      () => undefined,
      (error: unknown) => error,
    );
    expect(duplicate, "publishing an existing tag fails with the API error type").toBeInstanceOf(LowcoderApiError);
    testInfo.annotations.push({ type: "observation", description: `O-12 duplicate publish answer: ${(duplicate as Error).message}` });
    await view.open(appId);
    await expectModuleText(view, PUBLISHED_TEXT, "the failed publish changed nothing");

    // A mounted host does not pick up a republished module by itself (defects report O-13).
    await publishApp(page.request, moduleId, SECOND_VERSION_TAG);
    await expectTextStays(
      page,
      view.inModule(M.FIRST_INSTANCE).getByTestId(M.INNER_TEXT_ID),
      PUBLISHED_TEXT,
      "an open host keeps the old version: it never reloads a module while the module id is unchanged (O-13)",
      { windowMs: MOUNTED_HOST_OBSERVATION_MS },
    );

    // After a reload the host shows the new version; the host itself was not republished.
    await page.reload();
    await expect(view.inModule(M.FIRST_INSTANCE).getByTestId(M.INNER_TEXT_ID), "reloaded host view").not.toHaveText(LOADING_TEXT);
    await expectModuleText(view, DRAFT_TEXT, "after a reload the host shows the module published as 2.0.0");
    await editor.open(appId);
    await expectModuleText(view, DRAFT_TEXT, "the reopened editor shows it too");
  });

  test("a host shows the draft of a module that was never published, and follows it", async ({ page, apiUser }) => {
    const { appId: moduleId } = await createModule(page.request, { orgId: apiUser.orgId, name: "e2e-m2-unpublished", dsl: scenarioModuleDsl() });
    const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-m2-unpublished-host", dsl: hostDsl(moduleId) });
    await publishApp(page.request, appId);
    const view = new AppViewPage(page);
    const editor = new EditorPage(page);

    await view.open(appId);
    await expectModuleText(view, PUBLISHED_TEXT, "the published host shows the unpublished module's draft");
    await editor.open(appId);
    await expectModuleText(view, PUBLISHED_TEXT, "the host's editor shows it too");

    await updateApp(page.request, moduleId, { dsl: scenarioModuleDsl(NEVER_PUBLISHED_DRAFT_TEMPLATE) });
    await view.open(appId);
    await expectModuleText(view, NEVER_PUBLISHED_DRAFT_TEXT, "until a first publish the host follows the module's draft");
  });
});
