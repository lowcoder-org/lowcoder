import { eventHandler, executeQuery, postgresQuery } from "../dsl/builders";

/** `{{owner.value}}` is the temporary state that holds the test's token: every query reads and writes only its rows. */
export const OWNER_STATE_NAME = "owner";
export const OWNER_FILTER = `owner = {{${OWNER_STATE_NAME}.value}}`;
/** The note a write targets: the owner's newest row (ids are shared by all owners, so they are never asserted). */
const NEWEST_OWN_NOTE = `id = (SELECT max(id) FROM notes WHERE ${OWNER_FILTER})`;

export const SELECT_PRODUCTS = "selectProducts";
export const SELECT_NOTES = "selectNotes";
export const SELECT_PRODUCTS_SQL = "SELECT id, name, category, price, stock FROM products ORDER BY id";
const QUIET = { showSuccess: false } as const;
/** What a write query does when it succeeds: it re-reads the owner's notes. */
export const REREAD_NOTES = [eventHandler("success", executeQuery(SELECT_NOTES))];

/** The read-only `products` query shared by D1 and D2 (automatic, no success toast). */
export function selectProductsQuery(datasourceId: string, id: string): object {
  return postgresQuery({ id, name: SELECT_PRODUCTS, datasourceId, sql: SELECT_PRODUCTS_SQL, notification: QUIET });
}

/** `selectNotes`: the owner's rows (automatic). */
export function selectNotesQuery(datasourceId: string, id: string): object {
  return postgresQuery({
    id,
    name: SELECT_NOTES,
    datasourceId,
    sql: `SELECT id, body FROM notes WHERE ${OWNER_FILTER} ORDER BY id`,
    notification: QUIET,
  });
}

/** A manual write query that re-reads the owner's notes when it succeeds. */
export function noteWriteQuery(params: { id: string; name: string; datasourceId: string; sql: string }): object {
  return postgresQuery({ ...params, trigger: "manual", onEvent: REREAD_NOTES, notification: QUIET });
}

/** The three owner-scoped writes of D1; `input1` holds the typed body. */
export function insertUpdateDeleteQueries(datasourceId: string, ids: [string, string, string]): object[] {
  const owner = `{{${OWNER_STATE_NAME}.value}}`;
  return [
    noteWriteQuery({ id: ids[0], name: "insertNote", datasourceId, sql: `INSERT INTO notes (owner, body) VALUES (${owner}, {{input1.value}})` }),
    noteWriteQuery({
      id: ids[1],
      name: "updateNote",
      datasourceId,
      sql: `UPDATE notes SET body = {{input1.value}} WHERE ${OWNER_FILTER} AND ${NEWEST_OWN_NOTE}`,
    }),
    noteWriteQuery({ id: ids[2], name: "deleteNote", datasourceId, sql: `DELETE FROM notes WHERE ${OWNER_FILTER} AND ${NEWEST_OWN_NOTE}` }),
  ];
}
