/**
 * Builders for the application DSL. The shape is the one the editor saves (recorded from a real editor session):
 * `ui.layout` places items on the grid, `ui.items` holds each component by its layout id. Only `ui` is needed for
 * the app to load; the editor adds `refTree`, `hooks`, `settings` and `preload` itself.
 */

export interface GridPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DslItem {
  id: string;
  layout: GridPosition;
  item: { compType: string; name: string; comp: Record<string, unknown> };
}

const DEFAULT_BUTTON_SIZE = { w: 6, h: 6 } as const;

/** A button. `testId` becomes the data-testid of the rendered component (its "Individual ID" property). */
export function button(params: {
  id: string;
  name: string;
  text: string;
  testId: string;
  x?: number;
  y?: number;
}): DslItem {
  return {
    id: params.id,
    layout: { x: params.x ?? 0, y: params.y ?? 0, ...DEFAULT_BUTTON_SIZE },
    item: { compType: "button", name: params.name, comp: { text: params.text, dataTestId: params.testId } },
  };
}

/** A text component. Its `text` is an expression string, so `{{ ... }}` binds it to queries and components. */
export function text(params: { id: string; name: string; text: string; testId: string; x?: number; y?: number }): DslItem {
  return {
    id: params.id,
    layout: { x: params.x ?? 0, y: params.y ?? 0, w: 12, h: 5 },
    item: { compType: "text", name: params.name, comp: { text: params.text, dataTestId: params.testId } },
  };
}

/**
 * A query on a PostgreSQL data source that runs when the app loads. The shape is the one the editor saves
 * (recorded after creating the query in the editor and typing the SQL).
 */
export interface PostgresQuery {
  id: string;
  name: string;
  datasourceId: string;
  sql: string;
}

function queryDsl(query: PostgresQuery): object {
  return {
    compType: "postgres",
    comp: {
      commandType: "INSERT",
      command: { table: "", changeSet: { compType: "KEY_VALUE_PAIRS", comp: [{ column: "", value: "" }] } },
      mode: "SQL",
      sql: query.sql,
      disablePreparedStatement: false,
    },
    id: query.id,
    name: query.name,
    order: 1,
    datasourceId: query.datasourceId,
    triggerType: "automatic",
    onEvent: [],
    notification: { showSuccess: true, showFail: true, fail: [{}] },
    timeout: "",
    confirmationModal: {},
    variables: [],
    periodic: false,
    periodicTime: "",
    cancelPrevious: false,
    depQueryName: "",
    delayTime: "",
  };
}

/** The DSL of an app that shows the given items and runs the given queries. */
export function appDsl(items: DslItem[], queries: PostgresQuery[] = []): object {
  const layout: Record<string, object> = {};
  const components: Record<string, object> = {};
  items.forEach((entry, index) => {
    layout[entry.id] = { i: entry.id, ...entry.layout, pos: index };
    components[entry.id] = entry.item;
  });
  return queries.length === 0
    ? { ui: { layout, items: components } }
    : { ui: { layout, items: components }, queries: queries.map(queryDsl) };
}
