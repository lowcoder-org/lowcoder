import { createApp, createPostgresDatasource, getAppDsl, publishApp } from "../../src/api/client";
import { SAVE_POLL_TIMEOUT_MS, SEEDED_ITEM_NAMES, TAGS } from "../../src/constants";
import { appDsl, postgresQuery, table } from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";
import { postgresConnection } from "../../src/postgres";
import { AppViewPage } from "../../src/pages/AppViewPage";
import { EditorPage } from "../../src/pages/EditorPage";
import { PropertyPanel } from "../../src/pages/PropertyPanel";

const QUERY_NAME = "query1";
const DATA_EXPRESSION = `{{${QUERY_NAME}.data}}`;
const TABLE_COMP_TYPE = "table";
const TABLE_SEARCH_TEXT = "Table";
const TABLE_TEST_ID = "e2e-items-table";

async function datasourceAndQuery(
  request: Parameters<typeof createPostgresDatasource>[0],
  orgId: string,
): Promise<object> {
  const datasourceId = await createPostgresDatasource(request, { orgId, name: "e2e-shop", connection: postgresConnection() });
  return postgresQuery({ id: "q1", name: QUERY_NAME, datasourceId, sql: "SELECT id, name FROM items ORDER BY id" });
}

test.describe("table fed by a PostgreSQL query", () => {
  test("a table dropped in the editor and bound to a query shows the rows", { tag: [TAGS.CORE, TAGS.SLOW] }, async ({
    page,
    apiUser,
  }) => {
    const query = await datasourceAndQuery(page.request, apiUser.orgId);
    const { appId } = await createApp(page.request, {
      orgId: apiUser.orgId,
      name: "e2e-table-editor",
      dsl: appDsl([], { queries: [query] }),
    });
    const editor = new EditorPage(page);
    const properties = new PropertyPanel(page);

    await editor.open(appId);
    await editor.dragFromInsertPanel(TABLE_COMP_TYPE, TABLE_SEARCH_TEXT, { x: 120, y: 40 });
    await properties.setFirstFieldExpression(DATA_EXPRESSION);

    for (const name of SEEDED_ITEM_NAMES) {
      await expect(page.getByRole("cell", { name, exact: true }), `the table shows the row ${name}`).toBeVisible();
    }
    await expect
      .poll(async () => JSON.stringify((await getAppDsl(page.request, appId)).applicationDSL), {
        timeout: SAVE_POLL_TIMEOUT_MS,
        message: "the saved app binds the table to the query",
      })
      .toContain(DATA_EXPRESSION);
  });

  test("a published table shows the rows its query read", { tag: [TAGS.CORE, TAGS.SLOW] }, async ({ page, apiUser }) => {
    const query = await datasourceAndQuery(page.request, apiUser.orgId);
    const dsl = appDsl([table({ id: "t1", name: "table1", data: DATA_EXPRESSION, columns: ["id", "name"], testId: TABLE_TEST_ID })], {
      queries: [query],
    });
    const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-table-view", dsl });
    await publishApp(page.request, appId);
    const view = new AppViewPage(page);

    await view.open(appId);

    for (const name of SEEDED_ITEM_NAMES) {
      await expect(view.byTestId(TABLE_TEST_ID).getByRole("cell", { name, exact: true }), `row ${name}`).toBeVisible();
    }
  });
});
