import { createApp, publishApp } from "../../src/api/client";
import { LOCAL_STORAGE_NAMESPACE, TAGS } from "../../src/constants";
import { appDsl, button, eventHandler, jsQuery, runScript, stackItems, text } from "../../src/dsl/builders";
import { rawLocalStorage } from "../../src/logic/helpers";
import { expect, test } from "../../src/fixtures";
import { AppViewPage } from "../../src/pages/AppViewPage";

const SET_ID = "e2e-ls-set";
const REMOVE_ID = "e2e-ls-remove";
const CLEAR_ID = "e2e-ls-clear";
const RESULT_ID = "e2e-ls-result";
const K1_ID = "e2e-ls-k1";
const LAST_ID = "e2e-ls-last";
const ALL_ID = "e2e-ls-all";
const QUIET = { showSuccess: false } as const;

test.describe("local storage", () => {
  test("a script writes, another app reads, a query result is stored, removeItem and clear remove", {
    tag: TAGS.CORE,
  }, async ({ page, apiUser, context }) => {
    const writer = appDsl(
      stackItems([
        button({ id: "b1", name: "bSet", text: "Set", testId: SET_ID, onEvent: [eventHandler("click", runScript("localStorage.setItem('k1', 'v-' + 7)"))] }),
        button({ id: "b2", name: "bRemove", text: "Remove", testId: REMOVE_ID, onEvent: [eventHandler("click", runScript("localStorage.removeItem('k1')"))] }),
        button({ id: "b3", name: "bClear", text: "Clear", testId: CLEAR_ID, onEvent: [eventHandler("click", runScript("localStorage.clear()"))] }),
        button({ id: "b4", name: "bResult", text: "Result", testId: RESULT_ID, onClickQuery: "resq" }),
        text({ id: "t1", name: "tK1", testId: K1_ID, text: "k1={{localStorage.values.k1}}" }),
        text({ id: "t2", name: "tLast", testId: LAST_ID, text: "last={{localStorage.values.last}}" }),
        text({ id: "t3", name: "tAll", testId: ALL_ID, text: "all={{JSON.stringify(localStorage.values)}}" }),
      ]),
      {
        queries: [
          jsQuery({
            id: "q1",
            name: "resq",
            script: "return 'res-' + 9",
            onEvent: [eventHandler("success", runScript("localStorage.setItem('last', resq.data)"))],
            notification: QUIET,
          }),
        ],
      },
    );
    const reader = appDsl(
      stackItems([
        text({ id: "t1", name: "tK1", testId: K1_ID, text: "k1={{localStorage.values.k1}}" }),
        text({ id: "t2", name: "tLast", testId: LAST_ID, text: "last={{localStorage.values.last}}" }),
      ]),
    );
    const appA = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-ls-writer", dsl: writer });
    await publishApp(page.request, appA.appId);
    const appB = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-ls-reader", dsl: reader });
    await publishApp(page.request, appB.appId);
    const viewA = new AppViewPage(page);

    await viewA.open(appA.appId);
    await expect(viewA.byTestId(K1_ID), "app A is up with nothing stored").toHaveText("k1=");
    expect(await rawLocalStorage(page), `before any write the key ${LOCAL_STORAGE_NAMESPACE} is absent`).toBeNull();

    await viewA.buttonByTestId(SET_ID).click();
    await expect(viewA.byTestId(K1_ID), "a script wrote the value").toHaveText("k1=v-7");
    expect(await rawLocalStorage(page), "the storage content is exactly the one key").toBe('{"k1":"v-7"}');

    const otherTab = await context.newPage();
    await new AppViewPage(otherTab).open(appB.appId);
    await expect(
      otherTab.getByTestId(K1_ID),
      "another app (other app id, same origin) reads it: the namespace is one key per origin",
    ).toHaveText("k1=v-7");
    await otherTab.close();

    await viewA.buttonByTestId(RESULT_ID).click();
    await expect(viewA.byTestId(LAST_ID), "a query's result, stored by its success handler").toHaveText("last=res-9");
    await page.reload();
    await expect(viewA.byTestId(LAST_ID), "the stored query result survives a reload").toHaveText("last=res-9");
    expect(await rawLocalStorage(page), "both keys are stored").toBe('{"k1":"v-7","last":"res-9"}');

    await viewA.buttonByTestId(REMOVE_ID).click();
    await expect(viewA.byTestId(K1_ID), "removeItem removes the key").toHaveText("k1=");
    await expect(viewA.byTestId(LAST_ID), "removeItem keeps the other key").toHaveText("last=res-9");
    expect(await rawLocalStorage(page), "the raw document holds only the other key").toBe('{"last":"res-9"}');

    await viewA.buttonByTestId(SET_ID).click();
    await expect(viewA.byTestId(K1_ID), "k1 written again").toHaveText("k1=v-7");
    await viewA.buttonByTestId(CLEAR_ID).click();
    await expect(viewA.byTestId(K1_ID), "clear removes k1").toHaveText("k1=");
    await expect(viewA.byTestId(LAST_ID), "clear removes last").toHaveText("last=");
    await expect(viewA.byTestId(ALL_ID), "no values are left").toHaveText("all={}");
    expect(await rawLocalStorage(page), "clear removes the storage key itself").toBeNull();
  });
});
