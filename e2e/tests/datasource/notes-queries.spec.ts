import { expect, test } from "@playwright/test";
import {
  insertUpdateDeleteQueries,
  noteWriteQuery,
  OWNER_FILTER,
  selectNotesQuery,
  selectProductsQuery,
} from "../../src/datasource/notes-queries";

interface QueryShape {
  name: string;
  triggerType: string;
  comp: { sql: string };
  onEvent: { name: string; handler: { comp: { queryName: string } } }[];
  notification: { showSuccess: boolean };
}

const DATASOURCE_ID = "ds-1";

test.describe("notes query builders", () => {
  test("selectProductsQuery reads the shared table and runs on load", () => {
    const query = selectProductsQuery(DATASOURCE_ID, "q1") as QueryShape;
    expect(query.comp.sql, "reads products").toContain("FROM products");
    expect(query.triggerType, "automatic").toBe("automatic");
    expect(query.comp.sql, "no owner filter: the table is shared and read-only").not.toContain("owner");
  });

  test("selectNotesQuery is scoped to the owner", () => {
    const query = selectNotesQuery(DATASOURCE_ID, "q2") as QueryShape;
    expect(query.comp.sql, "owner filter").toContain(OWNER_FILTER);
  });

  test("a write query is manual, re-reads the notes on success and has no success toast", () => {
    const query = noteWriteQuery({ id: "q3", name: "w", datasourceId: DATASOURCE_ID, sql: "SELECT 1" }) as QueryShape;
    expect(query.triggerType, "manual").toBe("manual");
    expect(query.onEvent.map((entry) => [entry.name, entry.handler.comp.queryName]), "success re-reads").toEqual([
      ["success", "selectNotes"],
    ]);
    expect(query.notification.showSuccess, "quiet").toBe(false);
  });

  test("insert, update and delete write only the owner's rows", () => {
    const [insert, update, remove] = (insertUpdateDeleteQueries(DATASOURCE_ID, ["a", "b", "c"]) as QueryShape[]);
    expect(insert!.comp.sql, "insert sets the owner").toContain("{{owner.value}}");
    // The exact statements, written out: an outer write predicate that is dropped while the owner-filtered subquery stays
    // would still contain OWNER_FILTER once, so the structure is asserted, not just the presence of the filter.
    expect(update!.comp.sql, "update: owner predicate on the write and on its newest-note subquery").toBe(
      "UPDATE notes SET body = {{input1.value}} WHERE owner = {{owner.value}} AND id = (SELECT max(id) FROM notes WHERE owner = {{owner.value}})",
    );
    expect(remove!.comp.sql, "delete: owner predicate on the write and on its newest-note subquery").toBe(
      "DELETE FROM notes WHERE owner = {{owner.value}} AND id = (SELECT max(id) FROM notes WHERE owner = {{owner.value}})",
    );
    for (const [what, sql] of [["update", update!.comp.sql], ["delete", remove!.comp.sql]] as const) {
      expect(sql.split(OWNER_FILTER).length - 1, `${what} carries the owner filter twice (outer write and subquery)`).toBe(2);
    }
    expect([insert!.name, update!.name, remove!.name], "names the D1 buttons run").toEqual(["insertNote", "updateNote", "deleteNote"]);
  });
});
