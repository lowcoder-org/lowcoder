import { createApp, createPostgresDatasource, getAppDsl, publishApp } from "../../src/api/client";
import { SAVE_POLL_TIMEOUT_MS, SEEDED_ITEM_NAMES, TAGS } from "../../src/constants";
import { appDsl, text } from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";
import { postgresConnection } from "../../src/postgres";
import { AppViewPage } from "../../src/pages/AppViewPage";
import { EditorPage } from "../../src/pages/EditorPage";
import { QueryPanel } from "../../src/pages/QueryPanel";

const DATASOURCE_NAME = "e2e-shop";
const QUERY_NAME = "query1";
const SELECT_ITEMS = "SELECT id, name FROM items ORDER BY id";
const NAMES_TEST_ID = "e2e-item-names";

test.describe("PostgreSQL data source", () => {
  test("a query written in the editor runs and returns the rows", { tag: [TAGS.CORE, TAGS.SLOW] }, async ({
    page,
    apiUser,
  }) => {
    await createPostgresDatasource(page.request, {
      orgId: apiUser.orgId,
      name: DATASOURCE_NAME,
      connection: postgresConnection(),
    });
    const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-query-editor" });
    const editor = new EditorPage(page);
    const queries = new QueryPanel(page);

    await editor.open(appId);
    await queries.createOn(DATASOURCE_NAME);
    await queries.setSql(SELECT_ITEMS);
    // The editor hands the typed SQL to the query a moment after typing, and a run before that fails with
    // "the SQL statement is empty". The saved app holding the SQL shows that the query has it.
    await expect
      .poll(async () => JSON.stringify((await getAppDsl(page.request, appId)).applicationDSL), {
        timeout: SAVE_POLL_TIMEOUT_MS,
        message: "the saved app holds the SQL",
      })
      .toContain(SELECT_ITEMS);
    await queries.run();

    await expect(queries.runSuccessful(QUERY_NAME), "the query ran").toBeVisible();
    for (const name of SEEDED_ITEM_NAMES) {
      await expect(page.getByText(name, { exact: true }), `row ${name} is shown`).toBeVisible();
    }
  });

  test("a published app shows data its query read from the database", { tag: [TAGS.CORE, TAGS.SLOW] }, async ({
    page,
    apiUser,
  }) => {
    const datasourceId = await createPostgresDatasource(page.request, {
      orgId: apiUser.orgId,
      name: DATASOURCE_NAME,
      connection: postgresConnection(),
    });
    const dsl = appDsl(
      [text({ id: "t1", name: "text1", text: `{{${QUERY_NAME}.data.map(row => row.name).join(", ")}}`, testId: NAMES_TEST_ID })],
      [{ id: "q1", name: QUERY_NAME, datasourceId, sql: SELECT_ITEMS }],
    );
    const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-query-view", dsl });
    await publishApp(page.request, appId);
    const view = new AppViewPage(page);

    await view.open(appId);

    await expect(view.byTestId(NAMES_TEST_ID), "the text is bound to the query result").toHaveText(SEEDED_ITEM_NAMES.join(", "));
  });
});
