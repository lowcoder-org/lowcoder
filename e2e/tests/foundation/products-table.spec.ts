import { createApp, createPostgresDatasource, publishApp } from "../../src/api/client";
import { PRODUCTS, TABLE_DEFAULT_PAGE_SIZE } from "../../src/constants";
import {
  appDsl,
  button,
  eventHandler,
  executeQuery,
  postgresQuery,
  stackItems,
  table,
  tempState,
  text,
} from "../../src/dsl/builders";
import { expect, test, uniqueEmail } from "../../src/fixtures";
import { postgresConnection } from "../../src/postgres";
import { AppViewPage } from "../../src/pages/AppViewPage";
import { TableView } from "../../src/pages/TableView";

const PRODUCTS_TABLE = "tableProducts";
const NOTES_TABLE = "tableNotes";
const ITEMS_TABLE = "tableItems";
const ORACLE_ID = "e2e-oracle";
const SELECTION_ID = "e2e-selection";
const NOTES_TEXT_ID = "e2e-notes";
const CHANGE_ID = "e2e-change";
const ADD_BUTTON_ID = "e2e-add";
const SELECT_PRODUCTS = "SELECT id, name, category, price, stock FROM products ORDER BY id";
const ITEMS_PAGE_COUNT = 1;

test.describe("the read-only products fixture and TableView", () => {
  test("25 products, paged by 5, scoped pagination, sort and filter through TableView", async ({ page, apiUser }) => {
    const datasourceId = await createPostgresDatasource(page.request, {
      orgId: apiUser.orgId,
      name: "e2e-shop",
      connection: postgresConnection(),
    });
    const quiet = { showSuccess: false };
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
        table({ id: "t2", name: ITEMS_TABLE, testId: "e2e-items-table", data: "{{selectItems.data}}", columns: ["id", "name"] }),
        text({
          id: "x1",
          name: "tOracle",
          testId: ORACLE_ID,
          text: "rows={{selectProducts.data.length}} stock={{selectProducts.data.slice(0, 5).map(r => r.stock).join(',')}}",
        }),
        text({
          id: "x2",
          name: "tSel",
          testId: SELECTION_ID,
          text: `n={{${PRODUCTS_TABLE}.displayData.length}} page={{${PRODUCTS_TABLE}.pageNo}} sort={{${PRODUCTS_TABLE}.sortColumn}}:{{${PRODUCTS_TABLE}.sortDesc}}`,
        }),
      ]),
      {
        queries: [
          postgresQuery({ id: "q1", name: "selectProducts", datasourceId, sql: SELECT_PRODUCTS, notification: quiet }),
          postgresQuery({
            id: "q2",
            name: "selectItems",
            datasourceId,
            sql: "SELECT id, name FROM items ORDER BY id",
            notification: quiet,
          }),
        ],
      },
    );
    const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-products-table", dsl });
    await publishApp(page.request, appId);
    const view = new AppViewPage(page);
    const products = new TableView(page, PRODUCTS_TABLE);

    await view.open(appId);

    await expect(view.byTestId(ORACLE_ID), "the query read the 25 rows; the first five stock values").toHaveText(
      `rows=${PRODUCTS.ROW_COUNT} stock=${PRODUCTS.FIRST_FIVE_STOCK.join(",")}`,
    );
    await expect(products.rows.first(), "page 1 starts at the first product").toContainText(PRODUCTS.FIRST_NAME);
    await expect(products.rows, `one page shows ${TABLE_DEFAULT_PAGE_SIZE} rows`).toHaveCount(TABLE_DEFAULT_PAGE_SIZE);
    await expect(products.pageItems, "this table's own bar has one item per page").toHaveCount(
      PRODUCTS.ROW_COUNT / TABLE_DEFAULT_PAGE_SIZE,
    );
    await expect(
      page.locator(".ant-pagination-item"),
      "an unscoped locator also counts the second table's bar, which is why TableView scopes",
    ).toHaveCount(PRODUCTS.ROW_COUNT / TABLE_DEFAULT_PAGE_SIZE + ITEMS_PAGE_COUNT);

    await products.goToPage(2);
    await expect(view.byTestId(SELECTION_ID), "page 2").toContainText("page=2");
    await expect(products.rows.first(), "page 2 starts at the sixth product").toContainText("product-06");

    await products.goToPage(1);
    await products.clickHeader("name");
    await expect(view.byTestId(SELECTION_ID), "ascending after one click").toContainText("sort=name:false");
    await products.clickHeader("name");
    await expect(view.byTestId(SELECTION_ID), "descending after two clicks").toContainText("sort=name:true");
    await expect(products.rows.first(), "descending puts the last product first").toContainText(PRODUCTS.LAST_NAME);

    await products.filterColumn("category", "tools");
    await expect(view.byTestId(SELECTION_ID), "only the tools rows remain").toContainText(`n=${PRODUCTS.CATEGORY_COUNTS.tools}`);
    await expect(products.rows.first(), "the first visible row is a tools row").toContainText("tools");
  });

  test("an editable column is edited and saved through TableView on the owner's notes", async ({ page, apiUser }, testInfo) => {
    const owner = uniqueEmail("tableview", testInfo.workerIndex);
    const datasourceId = await createPostgresDatasource(page.request, {
      orgId: apiUser.orgId,
      name: "e2e-shop",
      connection: postgresConnection(),
    });
    const ownerFilter = "owner = {{owner.value}}";
    const reread = [eventHandler("success", executeQuery("selectNotes"))];
    const quiet = { showSuccess: false };
    const dsl = appDsl(
      stackItems([
        button({ id: "b1", name: "bAdd", text: "Add note", testId: ADD_BUTTON_ID, onClickQuery: "addNote" }),
        table({
          id: "t1",
          name: NOTES_TABLE,
          testId: "e2e-notes-table",
          data: "{{selectNotes.data}}",
          columns: ["id", { dataIndex: "body", editable: true }],
          onEvent: [eventHandler("saveChanges", executeQuery("saveNote"))],
        }),
        text({ id: "x1", name: "tNotes", testId: NOTES_TEXT_ID, text: "notes={{selectNotes.data.map(r => r.body).join('|')}}" }),
        text({ id: "x2", name: "tChange", testId: CHANGE_ID, text: `change={{JSON.stringify(${NOTES_TABLE}.changeSet)}}` }),
      ]),
      {
        tempStates: [tempState({ id: "s1", name: "owner", value: JSON.stringify(owner) })],
        queries: [
          postgresQuery({
            id: "q1",
            name: "selectNotes",
            datasourceId,
            sql: `SELECT id, body FROM notes WHERE ${ownerFilter} ORDER BY id`,
            notification: quiet,
          }),
          postgresQuery({
            id: "q2",
            name: "addNote",
            datasourceId,
            sql: `INSERT INTO notes (owner, body) VALUES ({{owner.value}}, 'draft')`,
            trigger: "manual",
            onEvent: reread,
            notification: quiet,
          }),
          postgresQuery({
            id: "q3",
            name: "saveNote",
            datasourceId,
            sql: `UPDATE notes SET body = {{${NOTES_TABLE}.toUpdateRows[0].body}} WHERE ${ownerFilter} AND id = CAST({{${NOTES_TABLE}.toUpdateRows[0].id}} AS integer)`,
            trigger: "manual",
            onEvent: reread,
            notification: quiet,
          }),
        ],
      },
    );
    const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-table-edit", dsl });
    await publishApp(page.request, appId);
    const view = new AppViewPage(page);
    const notes = new TableView(page, NOTES_TABLE);

    await view.open(appId);
    await expect(view.byTestId(NOTES_TEXT_ID), "the owner has no notes yet").toHaveText("notes=");
    await view.buttonByTestId(ADD_BUTTON_ID).click();
    await expect(notes.rows, "the added note is the owner's only row").toHaveCount(1);
    await expect(notes.rows.first(), "its body").toContainText("draft");

    await notes.editCell(0, 1, "edited", { text: view.byTestId(CHANGE_ID), contains: `{"0":{"body":"edited"}}` });
    await notes.saveChanges();

    await expect(view.byTestId(NOTES_TEXT_ID), "the saved body was read back from the database").toHaveText("notes=edited");
    await expect(notes.rows.first(), "the row shows the saved body").toContainText("edited");
  });
});
