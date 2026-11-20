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
  /** Name of a query to run when the button is clicked (the "Run a Data Query" event handler). */
  onClickQuery?: string;
  x?: number;
  y?: number;
}): DslItem {
  const comp: Record<string, unknown> = { text: params.text, dataTestId: params.testId };
  if (params.onClickQuery !== undefined) {
    comp.onEvent = [
      {
        name: "click",
        handler: {
          compType: "executeQuery",
          comp: { queryName: params.onClickQuery, queryVariables: [] },
          condition: "",
          slowdown: "debounce",
          delay: "",
        },
      },
    ];
  }
  return {
    id: params.id,
    layout: { x: params.x ?? 0, y: params.y ?? 0, ...DEFAULT_BUTTON_SIZE },
    item: { compType: "button", name: params.name, comp },
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
 * A table; `data` is an expression such as `{{query1.data}}` and `columns` are the keys of the rows to show. The
 * editor derives the columns itself when data is bound; a table saved without columns shows "No Columns Are
 * Currently Visible", so the columns are part of the DSL (each one is shown as plain text).
 */
export function table(params: {
  id: string;
  name: string;
  data: string;
  columns: string[];
  testId: string;
  x?: number;
  y?: number;
}): DslItem {
  const columns = params.columns.map((key) => ({
    title: key,
    showTitle: true,
    isCustom: false,
    dataIndex: key,
    render: { compType: "text", comp: { text: "{{currentCell}}" } },
  }));
  return {
    id: params.id,
    layout: { x: params.x ?? 0, y: params.y ?? 0, w: 24, h: 20 },
    item: { compType: "table", name: params.name, comp: { data: params.data, columns, dataTestId: params.testId } },
  };
}

/** How a query is started: when the app loads or when something runs it. */
export type QueryTrigger = "automatic" | "manual";

/** The settings every query carries, as the editor saves them (recorded after creating queries in the editor). */
function queryDefaults(params: { id: string; name: string; trigger: QueryTrigger }): Record<string, unknown> {
  return {
    id: params.id,
    name: params.name,
    order: 1,
    triggerType: params.trigger,
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

/** A query on a PostgreSQL data source. */
export function postgresQuery(params: {
  id: string;
  name: string;
  datasourceId: string;
  sql: string;
  trigger?: QueryTrigger;
}): object {
  return {
    compType: "postgres",
    comp: {
      commandType: "INSERT",
      command: { table: "", changeSet: { compType: "KEY_VALUE_PAIRS", comp: [{ column: "", value: "" }] } },
      mode: "SQL",
      sql: params.sql,
      disablePreparedStatement: false,
    },
    datasourceId: params.datasourceId,
    ...queryDefaults({ ...params, trigger: params.trigger ?? "automatic" }),
  };
}

/** A JavaScript query ("Run JavaScript Code"); its result is `<name>.data`. */
export function jsQuery(params: { id: string; name: string; script: string; trigger?: QueryTrigger }): object {
  return {
    compType: "js",
    comp: { script: params.script },
    datasourceId: "#JS_CODE",
    ...queryDefaults({ ...params, trigger: params.trigger ?? "manual" }),
  };
}

/** A temporary state; `value` is the initial value as a code string, e.g. `"0"`. */
export function tempState(params: { id: string; name: string; value: string }): object {
  return { id: params.id, name: params.name, value: params.value };
}

export interface AppParts {
  queries?: object[];
  tempStates?: object[];
}

/** The DSL of an app that shows the given items, runs the given queries and holds the given temporary states. */
export function appDsl(items: DslItem[], parts: AppParts = {}): object {
  const layout: Record<string, object> = {};
  const components: Record<string, object> = {};
  items.forEach((entry, index) => {
    layout[entry.id] = { i: entry.id, ...entry.layout, pos: index };
    components[entry.id] = entry.item;
  });
  return {
    ui: { layout, items: components },
    ...(parts.queries?.length ? { queries: parts.queries } : {}),
    ...(parts.tempStates?.length ? { tempStates: parts.tempStates } : {}),
  };
}
