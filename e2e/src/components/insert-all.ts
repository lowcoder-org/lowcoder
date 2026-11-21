import type { APIRequestContext } from "@playwright/test";
import { getAppDsl } from "../api/client";
import { SAVE_POLL_TIMEOUT_MS } from "../constants";
import { containerOf, text } from "../dsl/builders";
import { recordedHook } from "../dsl/recorded";
import { HOOK_TYPES } from "./insert-catalog";

/** Helpers of S1, the insert-every-tile smoke test (`tests/components/insert-all.spec.ts`). */

/** How often the saved DSL is read while waiting for the editor's autosave. */
export const SAVE_POLL_INTERVAL_MS = 500;

/** The published view must reach network idle within this time (the probe ignored a timeout; S1 fails on it). */
export const VIEW_NETWORK_IDLE_TIMEOUT_MS = 20_000;

/** After the view is ready: how long asynchronous `pageerror` events are observed (the probe's wait). */
export const VIEW_OBSERVATION_MS = 2_500;

/** The readiness text the five hook types get: they have no element of their own, so nothing else shows the view loaded. */
export const READY_TEST_ID = "s1-ready";
export const READY_TEXT = "ready";
const READY_ITEM = { id: "s1Ready", name: "s1Ready" } as const;

/** The test id every grid type is given, so its element can be found (`probe-<type>`, as in the probe). */
export function testIdOf(compType: string): string {
  return `probe-${compType}`;
}

/** The editor did not save the dropped component within `SAVE_POLL_TIMEOUT_MS`: defect D-3, the caller may retry once. */
export class SavedDslTimeoutError extends Error {
  constructor(appId: string, compType: string, timeoutMs: number) {
    super(
      `app ${appId}: the saved DSL did not hold a ${compType} within ${timeoutMs} ms of the drop (the editor's autosave was lost, defect D-3)`,
    );
    this.name = "SavedDslTimeoutError";
  }
}

/** The saved DSL as far as S1 reads it. */
export interface SavedDsl {
  ui: { layout?: Record<string, unknown>; items?: Record<string, { compType: string; name: string; comp?: Record<string, unknown> }> };
  hooks?: { compType: string; name: string }[];
  [key: string]: unknown;
}

function asSavedDsl(dsl: unknown): SavedDsl {
  if (typeof dsl !== "object" || dsl === null || typeof (dsl as SavedDsl).ui !== "object" || (dsl as SavedDsl).ui === null) {
    throw new TypeError(`the saved DSL has no "ui": ${JSON.stringify(dsl)?.slice(0, 200)}`);
  }
  return dsl as SavedDsl;
}

/**
 * Whether the saved DSL holds the component the drop created. A grid type is an item of `ui.items` with that `compType`;
 * a hook type is the hook the editor adds with the recorded name (`modal1`, `toast1`, ...): `toast` is no evidence by type
 * alone, every saved app has the hook `toast` of the base hooks. An app the editor has not saved yet (`{}`) holds nothing.
 */
export function holdsInsertedType(dsl: unknown, compType: string): boolean {
  if (typeof dsl !== "object" || dsl === null) {
    throw new TypeError(`the stored DSL is not an object: ${JSON.stringify(dsl)}`);
  }
  // A freshly created app stores `{}` until the editor's first save: nothing is held yet.
  const saved = dsl as Partial<SavedDsl>;
  if (HOOK_TYPES.has(compType)) {
    const hookName = recordedHook(compType).name;
    return (saved.hooks ?? []).some((hook) => hook.compType === compType && hook.name === hookName);
  }
  return Object.values(saved.ui?.items ?? {}).some((item) => item.compType === compType);
}

/** Waits until the stored draft of `appId` holds the dropped component; throws `SavedDslTimeoutError` otherwise. */
export async function waitForSavedType(
  request: APIRequestContext,
  appId: string,
  compType: string,
  timeoutMs: number = SAVE_POLL_TIMEOUT_MS,
): Promise<SavedDsl> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const { applicationDSL } = await getAppDsl(request, appId);
    if (holdsInsertedType(applicationDSL, compType)) {
      return asSavedDsl(applicationDSL);
    }
    if (Date.now() >= deadline) {
      throw new SavedDslTimeoutError(appId, compType, timeoutMs);
    }
    await new Promise((resolve) => setTimeout(resolve, SAVE_POLL_INTERVAL_MS));
  }
}

/** What `prepareForPublish` returns: the DSL to write and how the view finds the component afterwards. */
export interface PreparedDsl {
  dsl: SavedDsl;
  /** For a grid type: the name of the component (`barChart1`), its element carries `data-comp-name`. */
  compName?: string;
}

/**
 * The saved DSL as S1 writes it back before publishing: a grid type's component gets `dataTestId` (a copy; the input is
 * not changed), a hook type gets the readiness text (`READY_TEXT`, test id `READY_TEST_ID`) on its otherwise empty grid.
 */
export function prepareForPublish(saved: SavedDsl, compType: string): PreparedDsl {
  const dsl = structuredClone(saved);
  if (HOOK_TYPES.has(compType)) {
    const ready = text({ ...READY_ITEM, text: READY_TEXT, testId: READY_TEST_ID });
    const added = containerOf([ready]);
    dsl.ui = {
      ...dsl.ui,
      layout: { ...(dsl.ui.layout ?? {}), ...added.layout },
      items: { ...(dsl.ui.items ?? {}), ...(added.items as NonNullable<SavedDsl["ui"]["items"]>) },
    };
    return { dsl };
  }
  const item = Object.values(dsl.ui.items ?? {}).find((candidate) => candidate.compType === compType);
  if (!item) {
    throw new Error(`the saved DSL has no ${compType} to give a test id: ${JSON.stringify(dsl.ui).slice(0, 300)}`);
  }
  item.comp = { ...(item.comp ?? {}), dataTestId: testIdOf(compType) };
  return { dsl, compName: item.name };
}
