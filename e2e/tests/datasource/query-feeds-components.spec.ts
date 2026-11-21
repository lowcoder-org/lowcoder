import { createApp, createPostgresDatasource, publishApp } from "../../src/api/client";
import { PRODUCTS, TAGS } from "../../src/constants";
import {
  insertUpdateDeleteQueries,
  OWNER_STATE_NAME,
  selectNotesQuery,
  selectProductsQuery,
} from "../../src/datasource/notes-queries";
import { appDsl, barChart, button, input, stackItems, table, tempState, text } from "../../src/dsl/builders";
import { expect, test, uniqueEmail } from "../../src/fixtures";
import { postgresConnection } from "../../src/postgres";
import { AppViewPage } from "../../src/pages/AppViewPage";
import { TableView } from "../../src/pages/TableView";

const PRODUCTS_TABLE = "tableProducts";
const CHART_NAME = "barChart1";
const INPUT_ID = "e2e-note-input";
const NOTES_ID = "e2e-notes";
const ORACLE_ID = "e2e-oracle";
const OWNER_ID = "e2e-owner";
const NOTE_BODIES = { INSERTED: "first", UPDATED: "changed" } as const;
/** The chart's code comes from npm through the app's node-service: the first render can take a minute. */
const CHART_RENDER_TIMEOUT_MS = 60_000;

test.describe("a PostgreSQL query feeds components", () => {
  test("a query feeds a text and a table, owner-scoped writes re-read it, a chart renders", {
    tag: [TAGS.CORE, TAGS.SLOW, TAGS.NPM],
  }, async ({ page, apiUser }, testInfo) => {
    test.setTimeout(CHART_RENDER_TIMEOUT_MS * 2);
    const owner = uniqueEmail("notes", testInfo.workerIndex);
    const datasourceId = await createPostgresDatasource(page.request, {
      orgId: apiUser.orgId,
      name: "e2e-shop",
      connection: postgresConnection(),
    });
    const dsl = appDsl(
      stackItems([
        input({ id: "i1", name: "input1", testId: INPUT_ID }),
        button({ id: "b1", name: "bInsert", text: "Insert", testId: "e2e-insert", onClickQuery: "insertNote" }),
        button({ id: "b2", name: "bUpdate", text: "Update", testId: "e2e-update", onClickQuery: "updateNote" }),
        button({ id: "b3", name: "bDelete", text: "Delete", testId: "e2e-delete", onClickQuery: "deleteNote" }),
        text({ id: "x1", name: "tOwner", testId: OWNER_ID, text: `owner={{${OWNER_STATE_NAME}.value}}` }),
        text({ id: "x2", name: "tNotes", testId: NOTES_ID, text: "notes={{selectNotes.data.map(r => r.body).join('|')}}" }),
        text({
          id: "x3",
          name: "tOracle",
          testId: ORACLE_ID,
          text: "rows={{selectProducts.data.length}} stock={{selectProducts.data.slice(0, 5).map(r => r.stock).join(',')}}",
        }),
        table({
          id: "t1",
          name: PRODUCTS_TABLE,
          testId: "e2e-products-table",
          data: "{{selectProducts.data}}",
          columns: [...PRODUCTS.COLUMNS],
        }),
        barChart({
          id: "c1",
          name: CHART_NAME,
          testId: "e2e-chart",
          data: "{{selectProducts.data.slice(0, 5)}}",
          xAxisKey: "name",
          series: [{ columnName: "stock", seriesName: "stock" }],
        }),
      ]),
      {
        tempStates: [tempState({ id: "s1", name: OWNER_STATE_NAME, value: JSON.stringify(owner) })],
        queries: [
          selectProductsQuery(datasourceId, "q1"),
          selectNotesQuery(datasourceId, "q2"),
          ...insertUpdateDeleteQueries(datasourceId, ["q3", "q4", "q5"]),
        ],
      },
    );
    const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-query-feeds", dsl });
    await publishApp(page.request, appId);
    const view = new AppViewPage(page);
    const box = view.byTestId(INPUT_ID).getByRole("textbox");
    const products = new TableView(page, PRODUCTS_TABLE);

    await view.open(appId);

    // The owner text can read "Loading..." right after load, so every read waits.
    await expect(view.byTestId(OWNER_ID), "the test's token is the owner every query filters by").toHaveText(`owner=${owner}`);
    await expect(view.byTestId(NOTES_ID), "the owner has no notes yet").toHaveText("notes=");
    await expect(
      view.byTestId(ORACLE_ID),
      "the query's data reached a binding: its 25 rows and the first five stock values (the chart's own expression)",
    ).toHaveText(`rows=${PRODUCTS.ROW_COUNT} stock=${PRODUCTS.FIRST_FIVE_STOCK.join(",")}`);
    await expect(products.rows.first(), "the table's first page starts at the first product").toContainText(PRODUCTS.FIRST_NAME);

    await box.fill(NOTE_BODIES.INSERTED);
    await view.buttonByTestId("e2e-insert").click();
    await expect(view.byTestId(NOTES_ID), "Insert wrote the note and the success handler re-read it").toHaveText(
      `notes=${NOTE_BODIES.INSERTED}`,
    );

    await box.fill(NOTE_BODIES.UPDATED);
    await view.buttonByTestId("e2e-update").click();
    await expect(view.byTestId(NOTES_ID), "Update changed the owner's newest note").toHaveText(`notes=${NOTE_BODIES.UPDATED}`);

    await view.buttonByTestId("e2e-delete").click();
    await expect(view.byTestId(NOTES_ID), "Delete removed it").toHaveText("notes=");

    // Renders only: the chart's own data binding has no oracle (defect CD-5, p4 section 3).
    await expect(
      view.byCompName(CHART_NAME).locator("canvas"),
      "the bar chart rendered a canvas (it does not prove that the chart received the data)",
    ).toBeVisible({ timeout: CHART_RENDER_TIMEOUT_MS });
  });
});
