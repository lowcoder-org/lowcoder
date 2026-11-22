import { createPostgresDatasource } from "../../src/api/client";
import { SEEDED_ITEM_NAMES } from "../../src/constants";
import { appDsl, component, postgresQuery, tempState } from "../../src/dsl/builders";
import { recordedItem } from "../../src/dsl/recorded";
import { expect, test } from "../../src/fixtures";
import { PNG_RED } from "../../src/media";
import { postgresConnection } from "../../src/postgres";
import { openSeededApp } from "../../src/simple-components/seed";

/**
 * S13: `listView` and `grid` with three rows, bound to a
 * temporary state and as a JSON literal, plus the `listView` fed by a PostgreSQL query. Both have no test id: they are
 * found by `data-comp-name`, and the assertions read the content inside, because the wrapper's box is 1600 x 0.
 * Probe: probes/p3g-lists.spec.ts.
 */
type ListType = "listView" | "grid";
const LIST_TYPES: ListType[] = ["listView", "grid"];
const ROWS = [
  { title: "Alpha film", cover: PNG_RED, rate: "9.0", url: "https://example.test/a" },
  { title: "Beta film", cover: PNG_RED, rate: "8.0", url: "https://example.test/b" },
  { title: "Gamma film", cover: PNG_RED, rate: "7.0", url: "https://example.test/c" },
];
const STATE = "state1";
const ROWS_TIMEOUT_MS = 30_000;
const LIST_TEST_TIMEOUT_MS = 90_000;
const FIRST_PAGE = "1";
const QUERY_NAME = "query1";
/** The recorded template's link text reads `currentItem.title`; the query's rows have `name`. */
const QUERY_LINK_TEXT = "{{i+1}}. {{currentItem.name}}";
const ITEMS_SQL = "SELECT id, name FROM items ORDER BY id";

/** The text of the recorded list item template's link (`{{i+1}}. {{currentItem.title}}`), replaced in the query variant. */
function templateLinkItem(container: { items: Record<string, { compType: string; comp: Record<string, unknown> }> }) {
  const link = Object.values(container.items).find((item) => item.compType === "link");
  if (!link) {
    throw new Error("the recorded list template has no link item");
  }
  return link;
}

test.describe("S13 listView and grid", () => {
  for (const compType of LIST_TYPES) {
    for (const mode of ["bound", "literal"] as const) {
      test(`${compType} shows three rows from ${mode === "bound" ? "a temporary state" : "a JSON literal"}`, async ({ page, apiUser }) => {
        test.setTimeout(LIST_TEST_TIMEOUT_MS);
        const name = recordedItem(compType).name;
        const dsl = appDsl(
          [
            component(compType, {
              id: "l1",
              testId: `e2e-${compType}`,
              comp: { noOfRows: mode === "bound" ? `{{${STATE}.value}}` : JSON.stringify(ROWS) },
            }),
          ],
          { tempStates: mode === "bound" ? [tempState({ id: "s1", name: STATE, value: JSON.stringify(ROWS) })] : [] },
        );
        const { view } = await openSeededApp(page, page.request, { orgId: apiUser.orgId, name: `e2e-s13-${compType}-${mode}`, dsl });
        const list = view.byCompName(name);

        // the template shows `<index>. <title>` per row, then the pagination page
        await expect(list, "the rows' texts and the pagination page, in order").toHaveText(
          `1. ${ROWS[0]!.title} 2. ${ROWS[1]!.title} 3. ${ROWS[2]!.title} ${FIRST_PAGE}`,
          { useInnerText: true, timeout: ROWS_TIMEOUT_MS },
        );
        await expect(list.locator("img"), "one cover image per row").toHaveCount(ROWS.length);
      });
    }
  }

  test("listView shows the rows of a PostgreSQL query", async ({ page, apiUser }) => {
    test.setTimeout(LIST_TEST_TIMEOUT_MS);
    const datasourceId = await createPostgresDatasource(page.request, {
      orgId: apiUser.orgId,
      name: "e2e-shop",
      connection: postgresConnection(),
    });
    const listView = component("listView", { id: "l1", testId: "e2e-listView", comp: { noOfRows: `{{${QUERY_NAME}.data}}` } });
    templateLinkItem(listView.item.comp.container as Parameters<typeof templateLinkItem>[0]).comp.text = QUERY_LINK_TEXT;
    const dsl = appDsl([listView], {
      queries: [postgresQuery({ id: "q1", name: QUERY_NAME, datasourceId, sql: ITEMS_SQL, notification: { showSuccess: false } })],
    });
    const { view } = await openSeededApp(page, page.request, { orgId: apiUser.orgId, name: "e2e-s13-listView-postgres", dsl });
    const list = view.byCompName(listView.item.name);

    await expect(list, "one row per item of the sidecar, then the pagination page").toHaveText(
      `1. ${SEEDED_ITEM_NAMES[0]} 2. ${SEEDED_ITEM_NAMES[1]} ${FIRST_PAGE}`,
      { useInnerText: true, timeout: ROWS_TIMEOUT_MS },
    );
    await expect(list.getByText("3. "), "there is no third row").toHaveCount(0);
  });
});
