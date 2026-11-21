import { createApp, createPostgresDatasource, getAppDsl, publishApp } from "../../src/api/client";
import { PRODUCTS, SAVE_POLL_TIMEOUT_MS, SEEDED_ITEM_NAMES, TABLE_DEFAULT_PAGE_SIZE, TAGS } from "../../src/constants";
import {
  noteWriteQuery,
  OWNER_FILTER,
  OWNER_STATE_NAME,
  selectNotesQuery,
  selectProductsQuery,
} from "../../src/datasource/notes-queries";
import { appDsl, button, eventHandler, executeQuery, postgresQuery, stackItems, table, tempState, text } from "../../src/dsl/builders";
import { expect, test, uniqueEmail } from "../../src/fixtures";
import { postgresConnection } from "../../src/postgres";
import { AppViewPage } from "../../src/pages/AppViewPage";
import { EditorPage } from "../../src/pages/EditorPage";
import { PropertyPanel } from "../../src/pages/PropertyPanel";
import { TableView } from "../../src/pages/TableView";

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

const PRODUCTS_TABLE = "tableProducts";
const NOTES_TABLE = "tableNotes";
const PRODUCTS_STATE_ID = "e2e-products-state";
const NOTES_CHANGE_ID = "e2e-notes-change";
const NOTES_TEXT_ID = "e2e-notes-text";
const ADD_NOTE_ID = "e2e-add-note";
const EDITED_BODY = "edited";
/** Page 2 of the name-descending order holds product-20 to product-16; its third row is product-18 (p4 D2). */
const SECOND_PAGE = 2;
const THIRD_ROW = 2;
const FILTER_CATEGORY = "tools";

test.describe("tables fed by queries: read-only products and owner-scoped notes", () => {
  test("sort, page, select and filter the products; add, edit and save a note", { tag: [TAGS.CORE, TAGS.SLOW] }, async ({
    page,
    apiUser,
  }, testInfo) => {
    const owner = uniqueEmail("tables", testInfo.workerIndex);
    const datasourceId = await createPostgresDatasource(page.request, {
      orgId: apiUser.orgId,
      name: "e2e-shop",
      connection: postgresConnection(),
    });
    const saveNote = noteWriteQuery({
      id: "q3",
      name: "saveNote",
      datasourceId,
      sql: `UPDATE notes SET body = {{${NOTES_TABLE}.toUpdateRows[0].body}} WHERE ${OWNER_FILTER} AND id = CAST({{${NOTES_TABLE}.toUpdateRows[0].id}} AS integer)`,
    });
    const addNote = noteWriteQuery({
      id: "q4",
      name: "addNote",
      datasourceId,
      sql: `INSERT INTO notes (owner, body) VALUES ({{${OWNER_STATE_NAME}.value}}, 'draft')`,
    });
    const dsl = appDsl(
      stackItems([
        table({
          id: "t1",
          name: PRODUCTS_TABLE,
          testId: "e2e-products-table",
          data: "{{selectProducts.data}}",
          columns: [
            { dataIndex: "id" },
            { dataIndex: "name", sortable: true },
            { dataIndex: "category", filterable: true },
            { dataIndex: "price" },
            { dataIndex: "stock" },
          ],
        }),
        text({
          id: "x1",
          name: "tProductsState",
          testId: PRODUCTS_STATE_ID,
          text: `sel={{${PRODUCTS_TABLE}.selectedRow.name}} page={{${PRODUCTS_TABLE}.pageNo}} n={{${PRODUCTS_TABLE}.displayData.length}} sort={{${PRODUCTS_TABLE}.sortColumn}}:{{${PRODUCTS_TABLE}.sortDesc}}`,
        }),
        button({ id: "b1", name: "bAdd", text: "Add note", testId: ADD_NOTE_ID, onClickQuery: "addNote" }),
        table({
          id: "t2",
          name: NOTES_TABLE,
          testId: "e2e-notes-table",
          data: "{{selectNotes.data}}",
          columns: ["id", { dataIndex: "body", editable: true }],
          onEvent: [eventHandler("saveChanges", executeQuery("saveNote"))],
        }),
        text({
          id: "x2",
          name: "tNotes",
          testId: NOTES_TEXT_ID,
          text: "notes={{selectNotes.data.map(r => r.body).join('|')}}",
        }),
        text({
          id: "x3",
          name: "tChange",
          testId: NOTES_CHANGE_ID,
          text: `change={{JSON.stringify(${NOTES_TABLE}.changeSet)}}`,
        }),
      ]),
      {
        tempStates: [tempState({ id: "s1", name: OWNER_STATE_NAME, value: JSON.stringify(owner) })],
        queries: [selectProductsQuery(datasourceId, "q1"), selectNotesQuery(datasourceId, "q2"), saveNote, addNote],
      },
    );
    const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-tables-d2", dsl });
    await publishApp(page.request, appId);
    const view = new AppViewPage(page);
    const products = new TableView(page, PRODUCTS_TABLE);
    const notes = new TableView(page, NOTES_TABLE);
    const state = view.byTestId(PRODUCTS_STATE_ID);

    await view.open(appId);
    await expect(products.rows.first(), "initial: the first row").toContainText(PRODUCTS.FIRST_NAME);
    await expect(state, "initial: single selection selects the first row").toHaveText(
      `sel=${PRODUCTS.FIRST_NAME} page=1 n=${PRODUCTS.ROW_COUNT} sort=:false`,
    );
    await expect(products.rows, `a page shows ${TABLE_DEFAULT_PAGE_SIZE} rows`).toHaveCount(TABLE_DEFAULT_PAGE_SIZE);
    await expect(products.pageItems, "its own bar has one item per page").toHaveCount(PRODUCTS.ROW_COUNT / TABLE_DEFAULT_PAGE_SIZE);

    await products.clickHeader("name");
    await expect(state, "sort: ascending after one click").toContainText("sort=name:false");
    await products.clickHeader("name");
    await expect(state, "sort: descending after two clicks").toContainText("sort=name:true");
    await expect(products.rows.first(), "sort: the last product first").toContainText(PRODUCTS.LAST_NAME);

    await products.goToPage(SECOND_PAGE);
    await expect(state, "page: the table's own bar went to page 2").toContainText(`page=${SECOND_PAGE}`);
    await expect(products.rows.first(), "page: page 2 of the descending order starts at product-20").toContainText("product-20");

    await products.rows.nth(THIRD_ROW).click();
    await expect(state, "select: the third row of page 2").toContainText("sel=product-18");

    await products.goToPage(1);
    await products.filterColumn("category", FILTER_CATEGORY);
    await expect(state, "filter: the tools rows remain; selection and sort persist").toHaveText(
      `sel=product-18 page=1 n=${PRODUCTS.CATEGORY_COUNTS.tools} sort=name:true`,
    );
    await expect(products.rows.first(), "filter: the first visible row is a tools row").toContainText(FILTER_CATEGORY);

    await expect(view.byTestId(NOTES_TEXT_ID), "the owner has no notes").toHaveText("notes=");
    await view.buttonByTestId(ADD_NOTE_ID).click();
    await expect(notes.rows, "add note: one row, by count, not by id (ids are shared by all owners)").toHaveCount(1);
    await expect(notes.rows.first(), "add note: its body").toContainText("draft");

    await notes.editCell(0, 1, EDITED_BODY, {
      text: view.byTestId(NOTES_CHANGE_ID),
      contains: `{"0":{"body":"${EDITED_BODY}"}}`,
    });
    await expect(notes.saveChangesButton, "Save Changes appears with a pending change").toBeVisible();
    await notes.saveChanges();

    await expect(view.byTestId(NOTES_CHANGE_ID), "save: the table cleared its change set").toHaveText("change={}");
    await expect(view.byTestId(NOTES_TEXT_ID), "save: the re-read shows the saved body (the proof of the write)").toHaveText(`notes=${EDITED_BODY}`);
    await expect(notes.rows.first(), "save: the row shows it").toContainText(EDITED_BODY);
  });
});
