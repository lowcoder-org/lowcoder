import { createApp, publishApp } from "../../src/api/client";
import { TAGS } from "../../src/constants";
import { appDsl, button, jsQuery, tempState, text } from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";
import { AppViewPage } from "../../src/pages/AppViewPage";

const BUTTON_ID = "e2e-logic-button";
const TEXT_ID = "e2e-logic-text";
const QUERY_NAME = "query1";
const STATE_NAME = "state1";
/** The browser local-storage key under which the app's `localStorage` component keeps its values. */
const APP_LOCAL_STORAGE_KEY = "lowcoder_app_local_storage";

test.describe("queries, temporary states and local storage", () => {
  test("a query that runs on load puts its result into a text", { tag: TAGS.CORE }, async ({ page, apiUser }) => {
    const dsl = appDsl([text({ id: "t1", name: "text1", text: `{{${QUERY_NAME}.data}}`, testId: TEXT_ID })], {
      queries: [jsQuery({ id: "q1", name: QUERY_NAME, script: "return 21 * 2", trigger: "automatic" })],
    });
    const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-js-on-load", dsl });
    await publishApp(page.request, appId);
    const view = new AppViewPage(page);

    await view.open(appId);

    await expect(view.byTestId(TEXT_ID), "the text shows the result of the query").toHaveText("42");
  });

  test("a button click runs a query that updates a temporary state shown in a text", { tag: TAGS.CORE }, async ({
    page,
    apiUser,
  }) => {
    const dsl = appDsl(
      [
        button({ id: "b1", name: "button1", text: "Count", testId: BUTTON_ID, onClickQuery: QUERY_NAME }),
        text({ id: "t1", name: "text1", text: `count: {{${STATE_NAME}.value}}`, testId: TEXT_ID, y: 6 }),
      ],
      {
        queries: [jsQuery({ id: "q1", name: QUERY_NAME, script: `${STATE_NAME}.setValue(${STATE_NAME}.value + 1)` })],
        tempStates: [tempState({ id: "s1", name: STATE_NAME, value: "0" })],
      },
    );
    const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-temp-state", dsl });
    await publishApp(page.request, appId);
    const view = new AppViewPage(page);

    await view.open(appId);
    await expect(view.byTestId(TEXT_ID), "the state starts at its initial value").toHaveText("count: 0");
    await view.buttonByTestId(BUTTON_ID).click();
    await expect(view.byTestId(TEXT_ID), "one click ran the query once").toHaveText("count: 1");
    await view.buttonByTestId(BUTTON_ID).click();
    await expect(view.byTestId(TEXT_ID), "a second click ran it again").toHaveText("count: 2");
  });

  test("a value written to local storage is shown and survives a reload", { tag: TAGS.CORE }, async ({
    page,
    apiUser,
  }) => {
    const key = "e2eGreeting";
    const dsl = appDsl(
      [
        button({ id: "b1", name: "button1", text: "Save", testId: BUTTON_ID, onClickQuery: QUERY_NAME }),
        text({ id: "t1", name: "text1", text: `stored: {{localStorage.values.${key}}}`, testId: TEXT_ID, y: 6 }),
      ],
      { queries: [jsQuery({ id: "q1", name: QUERY_NAME, script: `localStorage.setItem("${key}", "hello")` })] },
    );
    const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-local-storage", dsl });
    await publishApp(page.request, appId);
    const view = new AppViewPage(page);

    await view.open(appId);
    await expect(view.byTestId(TEXT_ID), "nothing is stored yet").not.toContainText("hello");
    await view.buttonByTestId(BUTTON_ID).click();
    await expect(view.byTestId(TEXT_ID), "the text shows the stored value").toHaveText("stored: hello");
    expect(
      await page.evaluate((storeKey) => localStorage.getItem(storeKey), APP_LOCAL_STORAGE_KEY),
      "the value is in the browser's local storage",
    ).toContain(`"${key}":"hello"`);

    await page.reload();
    await expect(view.byTestId(TEXT_ID), "the value is still stored after a reload").toHaveText("stored: hello");
  });
});
