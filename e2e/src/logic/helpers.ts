import { type Locator, type Page } from "@playwright/test";
import { LOCAL_STORAGE_NAMESPACE, NEGATIVE_EVENT_WINDOW_MS } from "../constants";

/**
 * How long a test observes (`expectTextStays`, `windowMs`) after a click whose handler is debounced and must NOT run (a
 * false `condition`) before it takes "nothing happened" as shown. The probes waited this long (logic-b.spec.ts:
 * 1500 ms) before asserting; the observation now starts at the click and lasts this long. The debounce of the
 * editor's handlers is shorter, but a second click right after the first ran nothing, so the same window also
 * separates two clicks of one button.
 */
export const DEBOUNCE_SETTLE_MS = 1_500;

/** Pause between two reads of `expectTextStays`; the reads are spread over the window, one every interval. */
const STAY_CHECK_INTERVAL_MS = NEGATIVE_EVENT_WINDOW_MS / 10;

/** The whole text of a counter: a label without `=`, one `=`, an integer. `auto=7`; not `auto=`, `auto=7=x`, `=7`. */
const COUNTER_TEXT = /^[^=]+=(-?\d+)$/;

/** A text that was expected to hold for a while changed. The message names the locator's expected and read text. */
export class TextChangedError extends Error {
  constructor(description: string, expected: string, actual: string) {
    super(`${description}: expected the text "${expected}" to stay, read "${actual}"`);
    this.name = "TextChangedError";
  }
}

/**
 * The text of the browser's local-storage entry the apps' `localStorage` component keeps (its whole JSON document),
 * or null while the entry does not exist.
 */
export async function rawLocalStorage(page: Page): Promise<string | null> {
  return page.evaluate((key) => window.localStorage.getItem(key), LOCAL_STORAGE_NAMESPACE);
}

/**
 * Asserts that `locator` keeps `expected` as its text for `windowMs` (default `NEGATIVE_EVENT_WINDOW_MS`), for an action
 * that must deliver nothing. It reads the text right away, then every `STAY_CHECK_INTERVAL_MS`, and once more after the
 * last pause, so a change that lands at the very end of the window is seen. Call it right after the action (the
 * click), so that the window is observed continuously from it: a window that must cover a handler's debounce is passed
 * as `windowMs` (see `DEBOUNCE_SETTLE_MS`) instead of a fixed sleep before the check. It bounds a late effect, it does
 * not exclude one: the window is finite.
 */
export async function expectTextStays(
  page: Page,
  locator: Locator,
  expected: string,
  description: string,
  options: { windowMs?: number } = {},
): Promise<void> {
  const windowMs = options.windowMs ?? NEGATIVE_EVENT_WINDOW_MS;
  const pauses = Math.ceil(windowMs / STAY_CHECK_INTERVAL_MS);
  for (let pause = 0; pause <= pauses; pause += 1) {
    const actual = (await locator.innerText()).trim();
    if (actual !== expected) {
      throw new TextChangedError(description, expected, actual);
    }
    if (pause < pauses) {
      await page.waitForTimeout(STAY_CHECK_INTERVAL_MS);
    }
  }
}

/** A counter text that is not `<label>=<integer>` as a whole. */
export class CounterShapeError extends Error {
  constructor(readonly text: string) {
    super(`the text "${text}" is not of the shape <label>=<integer>`);
    this.name = "CounterShapeError";
  }
}

/** The integer of a counter text such as `auto=7`; the whole text must match `<label>=<integer>` (CounterShapeError otherwise). */
export function parseCounter(text: string): number {
  const match = COUNTER_TEXT.exec(text.trim());
  if (!match) {
    throw new CounterShapeError(text.trim());
  }
  return Number(match[1]);
}

/** The number after the `=` of the text of `locator` (`auto=7`); fails the test when the text has another shape. */
export async function countAfterEquals(locator: Locator): Promise<number> {
  return parseCounter(await locator.innerText());
}
