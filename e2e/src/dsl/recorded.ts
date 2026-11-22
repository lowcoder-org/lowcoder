import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Access to the recorded default DSL of every component of the editor's Components pane: `fixtures/dsl/<compType>.json`
 * holds what the editor saved after the component was dropped on an empty app (recorded on 3.0.0-e2e; re-record
 * when the image changes). The builders merge their overrides onto these recordings so a seeded component has every
 * property the editor itself writes.
 */
export const RECORDED_DSL_DIR = join(__dirname, "..", "..", "fixtures", "dsl");

/** A recording that is missing, unreadable, or lacks the part a builder asks for. The message names the file. */
export class RecordedFixtureError extends Error {
  constructor(compType: string, reason: string) {
    super(`recorded DSL of "${compType}" (${join(RECORDED_DSL_DIR, `${compType}.json`)}): ${reason}`);
    this.name = "RecordedFixtureError";
  }
}

export interface RecordedGridPosition {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  pos: number;
}

export interface RecordedItem {
  compType: string;
  name: string;
  comp: Record<string, unknown>;
  /** The grid position the editor gave the dropped component. */
  layout: RecordedGridPosition;
}

export interface RecordedHook {
  compType: string;
  name: string;
  comp: Record<string, unknown>;
}

export interface RecordedFile {
  ui: {
    layout: Record<string, RecordedGridPosition> | unknown[];
    items?: Record<string, { compType: string; name: string; comp: Record<string, unknown> }>;
  };
  hooks: RecordedHook[];
}

const cache = new Map<string, RecordedFile>();

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Parses the text of a recording and checks the parts the readers rely on: `ui` is an object with a `layout` (an object,
 * or the array of an app without components) and, when present, an `items` object whose entries have a string
 * `compType` and `name` and an object `comp`; `hooks` is an array of entries with a string `compType` and `name`.
 * Anything else is a RecordedFixtureError that names the file, not a TypeError somewhere in a builder.
 */
export function parseRecordedFile(compType: string, text: string): RecordedFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new RecordedFixtureError(compType, error instanceof Error ? error.message : String(error));
  }
  if (!isObject(parsed) || !isObject(parsed.ui)) {
    throw new RecordedFixtureError(compType, "is not an object with a `ui` object");
  }
  const { layout, items } = parsed.ui;
  if (!isObject(layout) && !Array.isArray(layout)) {
    throw new RecordedFixtureError(compType, "has no `ui.layout` object or array");
  }
  if (items !== undefined) {
    if (!isObject(items)) {
      throw new RecordedFixtureError(compType, "has a `ui.items` that is not an object");
    }
    for (const [id, item] of Object.entries(items)) {
      if (!isObject(item) || typeof item.compType !== "string" || typeof item.name !== "string" || !isObject(item.comp)) {
        throw new RecordedFixtureError(compType, `has a \`ui.items\` entry ${id} without a string compType, a string name and a comp object`);
      }
    }
  }
  if (!Array.isArray(parsed.hooks)) {
    throw new RecordedFixtureError(compType, "has no `hooks` array");
  }
  for (const [index, hook] of parsed.hooks.entries()) {
    if (!isObject(hook) || typeof hook.compType !== "string" || typeof hook.name !== "string") {
      throw new RecordedFixtureError(compType, `has a hook ${index} without a string compType and a string name`);
    }
  }
  return parsed as unknown as RecordedFile;
}

function load(compType: string): RecordedFile {
  const cached = cache.get(compType);
  if (cached) {
    return cached;
  }
  let text: string;
  try {
    text = readFileSync(join(RECORDED_DSL_DIR, `${compType}.json`), "utf8");
  } catch (error) {
    throw new RecordedFixtureError(compType, error instanceof Error ? error.message : String(error));
  }
  const parsed = parseRecordedFile(compType, text);
  cache.set(compType, parsed);
  return parsed;
}

/**
 * The first grid item of a parsed recording as a fresh deep copy with its layout entry; throws RecordedFixtureError when
 * there is none, when its layout is missing, or when its `compType` is not `compType` (a misrecorded file would seed
 * the defaults of another component).
 */
export function firstRecordedItem(compType: string, file: RecordedFile): RecordedItem {
  const entry = Object.entries(file.ui.items ?? {})[0];
  if (!entry) {
    throw new RecordedFixtureError(compType, "has no component on the grid (a hook type? use recordedHook)");
  }
  const [id, item] = entry;
  if (item.compType !== compType) {
    throw new RecordedFixtureError(compType, `holds a ${item.compType} as its first component, not a ${compType}`);
  }
  const layout = (file.ui.layout as Record<string, RecordedGridPosition>)[id];
  if (!layout) {
    throw new RecordedFixtureError(compType, `has no layout entry for item ${id}`);
  }
  return structuredClone({ ...item, layout });
}

/**
 * The component the editor placed on the grid when `compType` was dropped, as a fresh deep copy (callers merge into it).
 * Types that live in the DSL `hooks` instead of on the grid (`modal`, `drawer`, `toast`, `chatController`, `meeting`)
 * have no such item: use `recordedHook`.
 */
export function recordedItem(compType: string): RecordedItem {
  return firstRecordedItem(compType, load(compType));
}

/** The hook of type `compType` the editor added when the component was dropped (the last of its type), as a fresh copy. */
export function recordedHook(compType: string): RecordedHook {
  const hook = [...load(compType).hooks].reverse().find((candidate) => candidate.compType === compType);
  if (!hook) {
    throw new RecordedFixtureError(compType, `has no hook of type ${compType}`);
  }
  return structuredClone(hook);
}

/** Type whose recording holds only the hooks every app has (urlParams, dayjs, lodash, utils, message, toast, ...). */
const BASE_HOOKS_SOURCE_TYPE = "button";

/** The hooks every app of the editor carries; written ahead of the hooks a test adds (see `appDsl`). */
export function recordedBaseHooks(): RecordedHook[] {
  return structuredClone(load(BASE_HOOKS_SOURCE_TYPE).hooks);
}

/**
 * Folder of the recordings that are no component of the Components pane (`fixtures/dsl/n8n/`): the n8n data source's create
 * request and the query the editor saved for its "Retrieve all workflows" action. It is a subfolder on purpose: the catalog
 * test (`tests/components/insert-catalog.spec.ts`) and `recorded.spec.ts` read every `*.json` directly in `RECORDED_DSL_DIR`
 * as a component type.
 */
export const RECORDED_N8N_DIR = join(RECORDED_DSL_DIR, "n8n");

/** Recorded n8n query entry (what the editor saved in the app DSL's `queries`), reduced to what a builder keeps: type and `comp` with `actionName` and `action`. Ids, order and data source are set by the builder. */
export interface RecordedN8nQuery {
  compType: string;
  comp: { actionName: string; action: Record<string, string>; headers: unknown[] };
  [key: string]: unknown;
}

/** Recorded body of the `POST /api/datasources` the data source form sends for an n8n data source, reduced to type, name and settings; the workspace, the target and the key are set by `n8nDatasourceBody`. */
export interface RecordedN8nDatasource {
  name: string;
  type: string;
  datasourceConfig: Record<string, unknown>;
}

function loadN8n(file: string): unknown {
  const label = `n8n/${file}`;
  try {
    return JSON.parse(readFileSync(join(RECORDED_N8N_DIR, `${file}.json`), "utf8"));
  } catch (error) {
    throw new RecordedFixtureError(label, error instanceof Error ? error.message : String(error));
  }
}

/** The n8n query the editor saved, as a fresh deep copy; throws RecordedFixtureError when its type or `actionName` is missing. */
export function recordedN8nQuery(): RecordedN8nQuery {
  const parsed = loadN8n("n8nQuery");
  if (!isObject(parsed) || parsed.compType !== "n8n" || !isObject(parsed.comp) || typeof parsed.comp.actionName !== "string" || !isObject(parsed.comp.action)) {
    throw new RecordedFixtureError("n8n/n8nQuery", "is not an n8n query with a string `comp.actionName` and a `comp.action` object");
  }
  return structuredClone(parsed) as unknown as RecordedN8nQuery;
}

/** The n8n data source create body the form sent, as a fresh deep copy; throws RecordedFixtureError when it is not of type n8n or lacks `datasourceConfig`. */
export function recordedN8nDatasource(): RecordedN8nDatasource {
  const parsed = loadN8n("n8nDatasource");
  if (!isObject(parsed) || parsed.type !== "n8n" || typeof parsed.name !== "string" || !isObject(parsed.datasourceConfig)) {
    throw new RecordedFixtureError("n8n/n8nDatasource", "is not an n8n data source body with a string `name` and a `datasourceConfig` object");
  }
  return structuredClone(parsed) as unknown as RecordedN8nDatasource;
}
