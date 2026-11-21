import type { Page } from "@playwright/test";
import { createApp, publishApp, updateApp } from "../../src/api/client";
import { HOOK_TYPES, INSERT_TYPES, searchTextOf, TYPES_WITHOUT_TEST_ID } from "../../src/components/insert-catalog";
import {
  prepareForPublish,
  READY_TEST_ID,
  READY_TEXT,
  SavedDslTimeoutError,
  testIdOf,
  VIEW_NETWORK_IDLE_TIMEOUT_MS,
  VIEW_OBSERVATION_MS,
  waitForSavedType,
  type SavedDsl,
} from "../../src/components/insert-all";
import { D3_RETRY_ANNOTATION, DROP_TARGET, TAGS } from "../../src/constants";
import { expect, test } from "../../src/fixtures";
import { AppViewPage } from "../../src/pages/AppViewPage";
import { EditorPage } from "../../src/pages/EditorPage";

/**
 * S1: every tile of the Components pane (112 types) is dragged onto an empty app, the editor saves it, the app is
 * published and its view loads. Out of the default run (`@insert-all`): `E2E_INCLUDE_INSERT_ALL=1
 * e2e/scripts/run-in-docker.sh --grep @insert-all`. Asserts insertion, save, publish and load, never a component's
 * content (behaviour is S2-S20); the 9 class-C types are included.
 *
 * Defect D-3 (an editor save can be lost even after the readiness marker): a lost save is retried once on a fresh app
 * with the annotation `D-3 retry`; a second lost save fails the test. Playwright's own retries are off here (the
 * config enables one under CI, which would come on top). A run fails when more than half of the file's tests (56 of
 * 112) carry the annotation: no test can see the count, src/reporters/d3-threshold-reporter.ts counts it and fails the run.
 */
test.describe.configure({ retries: 0, timeout: 180_000 });

/** One attempt is the first save plus the retry after a lost one. */
const MAX_SAVE_ATTEMPTS = 2;

interface InsertedApp {
  appId: string;
  saved: SavedDsl;
}

/** Creates an empty app, drops the tile of `compType` in its editor and waits for the saved DSL to hold it (D-3 retry). */
async function insertAndSave(page: Page, orgId: string, compType: string): Promise<InsertedApp> {
  const editor = new EditorPage(page);
  for (let attempt = 1; ; attempt += 1) {
    const { appId } = await createApp(page.request, { orgId, name: `e2e-insert-${compType}-${attempt}` });
    await editor.open(appId);
    await editor.dragFromInsertPanel(compType, searchTextOf(compType), DROP_TARGET);
    try {
      return { appId, saved: await waitForSavedType(page.request, appId, compType) };
    } catch (error) {
      if (!(error instanceof SavedDslTimeoutError) || attempt >= MAX_SAVE_ATTEMPTS) {
        throw error;
      }
      test.info().annotations.push({ type: D3_RETRY_ANNOTATION, description: error.message });
      // The reporters' stdout is what a gate run counts the retries from (the JUnit file is rewritten by the next run).
      console.log(`${D3_RETRY_ANNOTATION}: ${compType}: ${error.message}`);
    }
  }
}

for (const compType of INSERT_TYPES) {
  test(`${compType} inserts, saves, publishes and loads`, { tag: [TAGS.SLOW, TAGS.INSERT_ALL] }, async ({ page, apiUser }) => {
    const { appId, saved } = await insertAndSave(page, apiUser.orgId, compType);
    expect(Object.keys(saved), "the saved DSL has the editor's parts").toContain("ui");

    // Leave the editor before any API write: an editor left open could autosave over the written DSL.
    await page.goto("about:blank");
    const { dsl, compName } = prepareForPublish(saved, compType);
    await updateApp(page.request, appId, { dsl });
    await publishApp(page.request, appId);

    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(String(error)));
    await new AppViewPage(page).open(appId);
    const view = new AppViewPage(page);

    // Network idle first, as the probe did, and before the component's own element is looked at: a component that adds a
    // frame later (`iframe`, `custom`) keeps Playwright's network-idle state from ever firing if it is awaited afterwards.
    await page.waitForLoadState("networkidle", { timeout: VIEW_NETWORK_IDLE_TIMEOUT_MS });
    if (HOOK_TYPES.has(compType)) {
      // The hook types have no element of their own: the readiness text must show before the observation starts.
      await expect(view.byTestId(READY_TEST_ID), `${compType}: the readiness text of the view`).toHaveText(READY_TEXT);
    }
    // Observation period for asynchronous page errors; the plan's measured fixed wait, not an assertion of its own.
    await page.waitForTimeout(VIEW_OBSERVATION_MS);

    if (!HOOK_TYPES.has(compType)) {
      const component = TYPES_WITHOUT_TEST_ID.has(compType) ? view.byCompName(compName!) : view.byTestId(testIdOf(compType));
      // Attached, not visible: some wrappers have a 0 box (S13).
      await expect(component, `${compType}: the component is on the view`).toBeAttached();
    }
    await expect(page.locator("body"), `${compType}: the published view is not a Not Found page`).not.toContainText("Not Found");
    if (HOOK_TYPES.has(compType)) {
      expect(pageErrors, `${compType}: page errors between the load and the end of the observation period`).toEqual([]);
    } else {
      // Not asserted for the grid types: `custom` (a blocked unpkg stylesheet) and `openLayersGeoMap` (blocked map
      // tiles) raise one by design and S1 asserts no content. Kept in the report.
      await test.info().attach("page-errors.txt", { body: pageErrors.join("\n") || "none", contentType: "text/plain" });
    }
  });
}
