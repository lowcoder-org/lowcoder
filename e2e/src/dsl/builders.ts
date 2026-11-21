/**
 * Builders for the application DSL. The shape is the one the editor saves (recorded from a real editor session):
 * `ui.layout` places items on the grid, `ui.items` holds each component by its layout id. Only `ui` is needed for
 * the app to load; the editor adds `refTree`, `hooks`, `settings` and `preload` itself.
 *
 * Conventions every item builder follows: `id` is the layout id (unique in the app), `name` the component name the
 * app's expressions use (`{{<name>.value}}`), `testId` becomes the component's `data-testid` (its "Individual ID"
 * property). Free text properties are expression strings, so `{{ ... }}` binds them to queries and components.
 *
 * Typical use: `appDsl(stackItems([text(...), button(...)]), { queries: [...], tempStates: [...] })`.
 */
import { recordedBaseHooks, recordedHook, recordedItem, type RecordedHook } from "./recorded";

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

/** Where an item sits when the caller gives no position. */
interface Placement {
  x?: number;
  y?: number;
}

const DEFAULT_BUTTON_SIZE = { w: 6, h: 6 } as const;
const DEFAULT_TEXT_SIZE = { w: 12, h: 5 } as const;
const DEFAULT_INPUT_SIZE = { w: 8, h: 6 } as const;
const DEFAULT_TABLE_SIZE = { w: 24, h: 20 } as const;
const DEFAULT_BAR_CHART_SIZE = { w: 12, h: 40 } as const;
const DEFAULT_MODULE_INSTANCE_SIZE = { w: 24, h: 12 } as const;
/** Grid rows left empty between two items by `stackItems`. */
const DEFAULT_STACK_GAP = 1;
/** The size the module editor gives a new module (`containerSize`). */
const DEFAULT_MODULE_CONTAINER_SIZE = { height: 12, width: 24 } as const;

/** Event handler fields the editor saves around every action. */
const DEFAULT_SLOWDOWN = "debounce";
const ACTION_TYPES = {
  EXECUTE_QUERY: "executeQuery",
  SET_TEMP_STATE: "setTempState",
  RUN_SCRIPT: "runScript",
  EXECUTE_COMP: "executeComp",
  TRIGGER_MODULE_EVENT: "triggerModuleEvent",
} as const;
const CLICK_EVENT = "click";
const SET_VALUE_METHOD = "setValue";
const JSON_VALUE_PARAM = "JSONValue";
const STRING_PARAM = "string";
const VALUE_PARAM_NAME = "value";
const JS_DATASOURCE_ID = "#JS_CODE";
const DEFAULT_QUERY_NOTIFICATION = { showSuccess: true, showFail: true, fail: [{}] } as const;

// ---------------------------------------------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------------------------------------------

/** What a handler does, before it is wrapped for an event by `eventHandler`. Build one with the action builders. */
export interface EventAction {
  compType: string;
  comp: Record<string, unknown>;
}

export type HandlerSlowdown = "debounce" | "throttle";

/** The entry of an `onEvent` list: the event's name and its handler. */
export interface EventBinding {
  name: string;
  handler: EventAction & { condition: string; slowdown: HandlerSlowdown; delay: string };
}

export interface HandlerOptions {
  /** Expression that must be truthy for the handler to run ("Only run when"); empty runs always. */
  condition?: string;
  slowdown?: HandlerSlowdown;
  /** Delay in ms as a string; empty for none. */
  delay?: string;
}

function withHandlerFields(action: EventAction, options: HandlerOptions): EventBinding["handler"] {
  return {
    ...action,
    condition: options.condition ?? "",
    slowdown: options.slowdown ?? DEFAULT_SLOWDOWN,
    delay: options.delay ?? "",
  };
}

/** Binds an action to the component or query event `eventName` (`click`, `change`, `success`, `fail`, ...). */
export function eventHandler(eventName: string, action: EventAction, options: HandlerOptions = {}): EventBinding {
  return { name: eventName, handler: withHandlerFields(action, options) };
}

/** "Run a Data Query". */
export function executeQuery(queryName: string): EventAction {
  return { compType: ACTION_TYPES.EXECUTE_QUERY, comp: { queryName, queryVariables: [] } };
}

/** "Set a Temporary State value": `value` is a code string (`"clicked-{{1+1}}"`), not a JSON document. */
export function setTempState(stateName: string, value: string): EventAction {
  return {
    compType: ACTION_TYPES.SET_TEMP_STATE,
    comp: {
      name: stateName,
      methodName: SET_VALUE_METHOD,
      params: [{ compType: JSON_VALUE_PARAM, comp: value, name: VALUE_PARAM_NAME }],
    },
  };
}

/** "Run JavaScript". The script is not async: no top-level `await`. */
export function runScript(script: string): EventAction {
  return { compType: ACTION_TYPES.RUN_SCRIPT, comp: { script } };
}

/** A string argument of a component method called by `executeComp`. */
export interface MethodParam {
  name: string;
  value: string;
}

/** "Control a Component": calls `methodName` (`setValue`, `openModal`, `method1` of a module, ...) of a component. */
export function executeComp(compName: string, methodName: string, params: MethodParam[] = []): EventAction {
  return {
    compType: ACTION_TYPES.EXECUTE_COMP,
    comp: {
      name: compName,
      methodName,
      params: params.map((param) => ({ compType: STRING_PARAM, comp: param.value, name: param.name })),
    },
  };
}

/** Inside a module: raises the module's event `eventName` to its host. */
export function triggerModuleEvent(eventName: string): EventAction {
  return { compType: ACTION_TYPES.TRIGGER_MODULE_EVENT, comp: { name: eventName } };
}

// ---------------------------------------------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------------------------------------------

/** The `layout` and `items` objects a container body holds (the app's `ui`, a modal's or a module's `container`). */
export function containerOf(items: DslItem[]): { layout: Record<string, object>; items: Record<string, object> } {
  const layout: Record<string, object> = {};
  const components: Record<string, object> = {};
  items.forEach((entry, index) => {
    layout[entry.id] = { i: entry.id, ...entry.layout, pos: index };
    components[entry.id] = entry.item;
  });
  return { layout, items: components };
}

/**
 * Puts every item into its own rows below the previous one (same x, y accumulated from the heights plus `gap`), so
 * that no seeded item covers another. Components that overlap intercept each other's clicks (p2 2.3). Returns new
 * items; the order of the list is the order on the page.
 */
export function stackItems(items: DslItem[], gap: number = DEFAULT_STACK_GAP): DslItem[] {
  let nextRow = 0;
  return items.map((entry) => {
    const placed = { ...entry, layout: { ...entry.layout, y: nextRow } };
    nextRow += entry.layout.h + gap;
    return placed;
  });
}

// ---------------------------------------------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------------------------------------------

/** A button. `testId` becomes the data-testid of the rendered component (its "Individual ID" property). */
export function button(
  params: {
    id: string;
    name: string;
    text: string;
    testId: string;
    /** Name of a query to run when the button is clicked (the "Run a Data Query" event handler). */
    onClickQuery?: string;
    /** Any event handlers, e.g. `[eventHandler("click", setTempState("state1", "x"))]`; added after `onClickQuery`'s. */
    onEvent?: EventBinding[];
  } & Placement,
): DslItem {
  const comp: Record<string, unknown> = { text: params.text, dataTestId: params.testId };
  const handlers: EventBinding[] = [
    ...(params.onClickQuery === undefined ? [] : [eventHandler(CLICK_EVENT, executeQuery(params.onClickQuery))]),
    ...(params.onEvent ?? []),
  ];
  if (handlers.length > 0) {
    comp.onEvent = handlers;
  }
  return {
    id: params.id,
    layout: { x: params.x ?? 0, y: params.y ?? 0, ...DEFAULT_BUTTON_SIZE },
    item: { compType: "button", name: params.name, comp },
  };
}

/** A text component. Its `text` is an expression string, so `{{ ... }}` binds it to queries and components. */
export function text(params: { id: string; name: string; text: string; testId: string } & Placement): DslItem {
  return {
    id: params.id,
    layout: { x: params.x ?? 0, y: params.y ?? 0, ...DEFAULT_TEXT_SIZE },
    item: { compType: "text", name: params.name, comp: { text: params.text, dataTestId: params.testId } },
  };
}

/** An input, `value` its initial text; its typed text is `{{<name>.value}}`. */
export function input(params: { id: string; name: string; testId: string; value?: string } & Placement): DslItem {
  return {
    id: params.id,
    layout: { x: params.x ?? 0, y: params.y ?? 0, ...DEFAULT_INPUT_SIZE },
    item: { compType: "input", name: params.name, comp: { value: params.value ?? "", dataTestId: params.testId } },
  };
}

/**
 * Any component of the Components pane, from its recorded default (`fixtures/dsl/<type>.json`) with the overrides
 * merged on top: `comp` overrides properties (shallow: a nested object such as `options` is replaced whole), `testId`
 * sets `dataTestId`, `onEvent` the event handlers. `name` defaults to the recorded one (`select1`, `table1`, ...) and
 * `w`/`h` to the recorded size. Throws RecordedFixtureError for the hook types (`modal`, `drawer`, ...): use `hook`.
 */
export function component(
  compType: string,
  params: {
    id: string;
    testId: string;
    name?: string;
    comp?: Record<string, unknown>;
    onEvent?: EventBinding[];
    w?: number;
    h?: number;
  } & Placement,
): DslItem {
  const recorded = recordedItem(compType);
  const comp: Record<string, unknown> = {
    ...recorded.comp,
    dataTestId: params.testId,
    ...(params.onEvent === undefined ? {} : { onEvent: params.onEvent }),
    ...params.comp,
  };
  return {
    id: params.id,
    layout: { x: params.x ?? 0, y: params.y ?? 0, w: params.w ?? recorded.layout.w, h: params.h ?? recorded.layout.h },
    item: { compType, name: params.name ?? recorded.name, comp },
  };
}

/** A column of a `table`. */
export interface TableColumn {
  /** The key of the row objects the column shows. */
  dataIndex: string;
  /** Header text; defaults to `dataIndex`. */
  title?: string;
  sortable?: boolean;
  filterable?: boolean;
  /** Cells can be edited in place; edits collect in `<name>.changeSet` until "Save Changes". */
  editable?: boolean;
}

function recordedColumnOf(column: TableColumn): Record<string, unknown> {
  const recordedColumn = (recordedItem("table").comp.columns as Record<string, unknown>[])[0]!;
  return {
    ...recordedColumn,
    title: column.title ?? column.dataIndex,
    dataIndex: column.dataIndex,
    ...(column.sortable === undefined ? {} : { sortable: column.sortable }),
    ...(column.filterable === undefined ? {} : { filterable: column.filterable }),
    ...(column.editable === undefined ? {} : { editable: column.editable }),
  };
}

/**
 * A table on the recorded table (`fixtures/dsl/table.json`); `data` is an expression such as `{{query1.data}}`.
 * `columns` are either plain keys of the rows to show, each as a minimal text column, or `TableColumn` objects, each
 * built on the recorded column with its sort / filter / edit flags (sorting, filtering and editing were verified only
 * on recorded columns). The editor derives columns itself when data is bound; a table saved without columns shows
 * "No Columns Are Currently Visible", so the columns are part of the DSL. `onEvent` takes the table's events
 * (`saveChanges`, `rowClick`, ...).
 */
export function table(
  params: {
    id: string;
    name: string;
    data: string;
    columns: (string | TableColumn)[];
    testId: string;
    onEvent?: EventBinding[];
  } & Placement,
): DslItem {
  const columns = params.columns.map((column) =>
    typeof column === "string"
      ? {
          title: column,
          showTitle: true,
          isCustom: false,
          dataIndex: column,
          render: { compType: "text", comp: { text: "{{currentCell}}" } },
        }
      : recordedColumnOf(column),
  );
  const comp: Record<string, unknown> = {
    ...recordedItem("table").comp,
    data: params.data,
    columns,
    dataTestId: params.testId,
    ...(params.onEvent === undefined ? {} : { onEvent: params.onEvent }),
  };
  return {
    id: params.id,
    layout: { x: params.x ?? 0, y: params.y ?? 0, ...DEFAULT_TABLE_SIZE },
    item: { compType: "table", name: params.name, comp },
  };
}

/** One series of a bar chart: the row key it plots. */
export interface ChartSeries {
  columnName: string;
  seriesName: string;
}

/**
 * A bar chart on the recorded one (`fixtures/dsl/barChart.json`), loaded from npm at run time (the app container needs
 * internet). `data` is an expression for the rows, `xAxisKey` the row key on the x axis. Defect CD-5: `{{barChart1.data}}`
 * reads empty while bars show, so the component's own `data` is no oracle. That a chart bound to a temporary state
 * receives its rows is measured by the canvas's pixels (tests/components/npm-components.spec.ts, the bound variant);
 * for any other binding assert the same expression in a text and that the canvas rendered.
 */
export function barChart(
  params: {
    id: string;
    name: string;
    testId: string;
    data: string;
    xAxisKey: string;
    series: ChartSeries[];
  } & Placement,
): DslItem {
  const recorded = recordedItem("barChart");
  const comp: Record<string, unknown> = {
    ...recorded.comp,
    dataTestId: params.testId,
    data: params.data,
    xAxisKey: params.xAxisKey,
    series: params.series.map((entry, index) => ({ ...entry, dataIndex: `s${index + 1}` })),
  };
  return {
    id: params.id,
    layout: { x: params.x ?? 0, y: params.y ?? 0, ...DEFAULT_BAR_CHART_SIZE },
    item: { compType: "barChart", name: params.name, comp },
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------------------------------------------

/** How a JavaScript query starts. `automatic` is labelled "Run on page load" in the editor. */
export type JsQueryTrigger = "automatic" | "manual" | "onQueryExecution" | "onTimeout" | "onBeforeUnload";

/**
 * How a PostgreSQL query starts. `onInputChange` re-runs it when an expression it reads changes; it does nothing on a
 * JavaScript query (a dependency change runs only non-JS queries, queryComp.tsx:305), and `onBeforeUnload` exists only
 * for JavaScript queries (JSTriggerTypeOptions, queryComp.tsx:116-121), hence two types, not one.
 */
export type PostgresQueryTrigger = "automatic" | "manual" | "onQueryExecution" | "onTimeout" | "onInputChange";

/** Options both query builders take; every field defaults to what the editor saves for a new query. */
export interface QueryOptions {
  /** `success` and `fail` handlers, e.g. `[eventHandler("success", executeQuery("selectNotes"))]`. */
  onEvent?: EventBinding[];
  /** Which result notifications show; both default to true (the editor's default). */
  notification?: { showSuccess?: boolean; showFail?: boolean };
  /** Delay in ms as a string, for trigger `onTimeout`. */
  delayTime?: string;
  periodic?: boolean;
  /** Period in ms as a string, with `periodic`. */
  periodicTime?: string;
  /** e.g. `{ showConfirmationModal: true, confirmationMessage: "Really run?" }`. */
  confirmationModal?: Record<string, unknown>;
  /** Name of the query this one is chained after (`onQueryExecution`). */
  depQueryName?: string;
}

/** The settings every query carries, as the editor saves them (recorded after creating queries in the editor). */
function queryDefaults(
  params: { id: string; name: string; trigger: JsQueryTrigger | PostgresQueryTrigger } & QueryOptions,
): Record<string, unknown> {
  return {
    id: params.id,
    name: params.name,
    order: 1,
    triggerType: params.trigger,
    onEvent: params.onEvent ?? [],
    notification: { ...DEFAULT_QUERY_NOTIFICATION, ...params.notification },
    timeout: "",
    confirmationModal: params.confirmationModal ?? {},
    variables: [],
    periodic: params.periodic ?? false,
    periodicTime: params.periodicTime ?? "",
    cancelPrevious: false,
    depQueryName: params.depQueryName ?? "",
    delayTime: params.delayTime ?? "",
  };
}

/** A query on a PostgreSQL data source. */
export function postgresQuery(
  params: { id: string; name: string; datasourceId: string; sql: string; trigger?: PostgresQueryTrigger } & QueryOptions,
): object {
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
export function jsQuery(
  params: { id: string; name: string; script: string; trigger?: JsQueryTrigger } & QueryOptions,
): object {
  return {
    compType: "js",
    comp: { script: params.script },
    datasourceId: JS_DATASOURCE_ID,
    ...queryDefaults({ ...params, trigger: params.trigger ?? "manual" }),
  };
}

// ---------------------------------------------------------------------------------------------------------------
// State and logic items
// ---------------------------------------------------------------------------------------------------------------

/**
 * A temporary state; `value` is the initial value as a code string, e.g. `"0"`, `"null"`, `"{}"` or
 * `JSON.stringify(token)` for a string. The editor drops the `id` when it saves; the seeded state stays usable.
 */
export function tempState(params: { id: string; name: string; value: string }): object {
  return { id: params.id, name: params.name, value: params.value };
}

/** A transformer ("Transformer" in the data panel): `script` is a function body, its result is `<name>.value`. */
export function transformer(params: { name: string; script: string }): object {
  return { name: params.name, script: params.script };
}

/** A data responder: runs its handlers on `dataChange` whenever the expression `data` changes. */
export function dataResponder(params: { name: string; data: string; onEvent: EventBinding[]; order?: number }): object {
  return { name: params.name, order: params.order ?? 0, data: params.data, onEvent: params.onEvent };
}

/**
 * An entry of the DSL `hooks`: components that are not on the grid (`modal`, `drawer`, `toast`, ...). `comp` is the
 * complete property object; to start from the recorded defaults use `recordedHookOf`.
 */
export function hook(compType: string, name: string, comp: Record<string, unknown>): RecordedHook {
  return { compType, comp, name };
}

/** A hook on the recorded default of its type (`fixtures/dsl/<type>.json`), `comp` merged over it, e.g. a modal with a body. */
export function recordedHookOf(compType: string, comp: Record<string, unknown> = {}, name?: string): RecordedHook {
  const recorded = recordedHook(compType);
  return hook(compType, name ?? recorded.name, { ...recorded.comp, ...comp });
}

// ---------------------------------------------------------------------------------------------------------------
// Modules
// ---------------------------------------------------------------------------------------------------------------

export interface ModuleInput {
  name: string;
  /** Initial value of the input: a code string. */
  defaultValue?: string;
}

export interface ModuleOutput {
  name: string;
  /** Expression, e.g. `{{input1.value}}`; the host reads it as `{{<instance>.<name>}}`. */
  value: string;
}

export interface ModuleMethod {
  name: string;
  /** What the method does inside the module; the host calls it with `executeComp(<instance>, <name>)`. */
  action: EventAction;
}

/**
 * The DSL of a module (pass it to `createModule`): the inputs the host sets (`{{<input name>.value}}` inside), the
 * outputs it reads, its methods and events (names; raise one with `triggerModuleEvent`), and the components of the
 * module's own page as `items`.
 */
export function moduleApp(params: {
  inputs?: ModuleInput[];
  outputs?: ModuleOutput[];
  methods?: ModuleMethod[];
  events?: string[];
  items?: DslItem[];
  containerSize?: { height: number; width: number };
}): object {
  return {
    ui: {
      compType: "module",
      comp: {
        io: {
          inputs: (params.inputs ?? []).map((entry) => ({
            name: entry.name,
            description: "",
            type: "data",
            defaultValue: { compType: "data", comp: entry.defaultValue ?? "" },
            test: { compType: "data", comp: "" },
          })),
          outputs: params.outputs ?? [],
        },
        methods: (params.methods ?? []).map((method) => ({
          name: method.name,
          action: withHandlerFields(method.action, {}),
        })),
        events: { list: (params.events ?? []).map((name) => ({ name })), enableEventTestMessage: true },
        container: containerOf(params.items ?? []),
        containerSize: params.containerSize ?? DEFAULT_MODULE_CONTAINER_SIZE,
      },
    },
  };
}

/**
 * An instance of a module in a host app. `inputs` maps input names to values (code strings), `events` are handlers
 * for the module's events: `[eventHandler("event1", setTempState("state1", "fired"))]`. Several instances of one
 * module repeat its test ids; scope locators with `AppViewPage.inModule(name)`.
 */
export function moduleInstance(
  params: {
    id: string;
    name: string;
    moduleId: string;
    inputs?: Record<string, string>;
    events?: EventBinding[];
  } & Placement,
): DslItem {
  return {
    id: params.id,
    layout: { x: params.x ?? 0, y: params.y ?? 0, ...DEFAULT_MODULE_INSTANCE_SIZE },
    item: {
      compType: "module",
      name: params.name,
      comp: {
        appId: params.moduleId,
        error: "",
        inputs: params.inputs ?? {},
        events: params.events ?? [],
        autoHeight: "auto",
        scrollbars: false,
        loadModuleInDomWhenHide: true,
      },
    },
  };
}

// ---------------------------------------------------------------------------------------------------------------
// The app
// ---------------------------------------------------------------------------------------------------------------

export interface AppParts {
  queries?: object[];
  tempStates?: object[];
  /** Written as the top-level key `transformers`. */
  transformers?: object[];
  /** Written as the top-level key `dataResponders`. */
  dataResponders?: object[];
  /** Written as the top-level key `hooks`, after the hooks every app has (`recordedBaseHooks`). */
  hooks?: object[];
}

/**
 * The DSL of an app that shows the given items, runs the given queries and holds the given temporary states,
 * transformers, data responders and hooks. Parts left out are not written.
 */
export function appDsl(items: DslItem[], parts: AppParts = {}): object {
  return {
    ui: containerOf(items),
    ...(parts.queries?.length ? { queries: parts.queries } : {}),
    ...(parts.tempStates?.length ? { tempStates: parts.tempStates } : {}),
    ...(parts.transformers?.length ? { transformers: parts.transformers } : {}),
    ...(parts.dataResponders?.length ? { dataResponders: parts.dataResponders } : {}),
    ...(parts.hooks?.length ? { hooks: [...recordedBaseHooks(), ...parts.hooks] } : {}),
  };
}
