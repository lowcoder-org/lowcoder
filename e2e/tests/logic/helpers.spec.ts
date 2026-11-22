import { expect, test } from "@playwright/test";
import { LOCAL_STORAGE_NAMESPACE } from "../../src/constants";
import { NEGATIVE_EVENT_WINDOW_MS } from "../../src/constants";
import { CountChangedError, CounterShapeError, countAfterEquals, expectCountStays, expectTextStays, parseCounter, rawLocalStorage, TextChangedError } from "../../src/logic/helpers";

/** A page of the app's own origin (so it has local storage), served by a route: no stack needed. */
const HELPER_PAGE_PATH = "/e2e-logic-helpers";
const HELPER_PAGE_HTML = `<p id="t">auto=7</p>`;
/** How long after the call the text changes in the failing case; inside the window `expectTextStays` watches. */
const CHANGE_AFTER_MS = 400;
/**
 * Boundary case: a window of 300 ms (three pauses of 100 ms) and a change 30 ms before its end. The reads before the last
 * pause happen at about 0, 100 and 200 ms, so only the read after the last pause can see it.
 */
const BOUNDARY_WINDOW_MS = 300;
const BOUNDARY_CHANGE_AFTER_MS = 270;
/** A change that lands after the default window but inside a longer one passed as `windowMs`. */
const LONG_WINDOW_MS = NEGATIVE_EVENT_WINDOW_MS + 500;
const LONG_CHANGE_AFTER_MS = NEGATIVE_EVENT_WINDOW_MS + 200;

test.describe("logic helpers", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`**${HELPER_PAGE_PATH}`, (route) => route.fulfill({ contentType: "text/html", body: HELPER_PAGE_HTML }));
    await page.goto(HELPER_PAGE_PATH);
  });

  test("rawLocalStorage is null before a write and the stored text after it", async ({ page }) => {
    expect(await rawLocalStorage(page), "no entry yet").toBeNull();
    await page.evaluate((key) => window.localStorage.setItem(key, '{"k":"v"}'), LOCAL_STORAGE_NAMESPACE);
    expect(await rawLocalStorage(page), "the stored document").toBe('{"k":"v"}');
  });

  test("countAfterEquals reads the integer after the equals sign", async ({ page }) => {
    expect(await countAfterEquals(page.locator("#t"))).toBe(7);
  });

  test("countAfterEquals fails on a text of another shape", async ({ page }) => {
    await page.locator("#t").evaluate((element) => (element.textContent = "no number"));
    await expect(countAfterEquals(page.locator("#t")), "a text without <label>=<integer>").rejects.toThrow(/<label>=<integer>/);
  });

  test("parseCounter accepts the whole shape <label>=<integer> and nothing else", () => {
    expect(parseCounter("auto=7")).toBe(7);
    expect(parseCounter("  auto=0 \n"), "surrounding whitespace is trimmed").toBe(0);
    expect(parseCounter("n=-3"), "a negative integer").toBe(-3);
    expect(parseCounter("two words=12"), "a label may hold spaces").toBe(12);
    const malformed = ["auto=", "auto=7=bad", "auto=7=", "=7", "auto", "", "auto=7.5", "auto=1e3", "auto=0x10", "auto= 7", "auto=7x", "a=b=7"];
    for (const text of malformed) {
      expect(() => parseCounter(text), `"${text}" is not <label>=<integer>`).toThrow(CounterShapeError);
    }
    expect(() => parseCounter("auto=7=bad")).toThrow(/is not of the shape <label>=<integer>/);
  });

  test("countAfterEquals rejects an empty counter and one with an extra delimiter", async ({ page }) => {
    for (const text of ["auto=", "auto=7=bad"]) {
      await page.locator("#t").evaluate((element, value) => (element.textContent = value), text);
      await expect(countAfterEquals(page.locator("#t")), `"${text}"`).rejects.toThrow(CounterShapeError);
    }
  });

  test("expectTextStays sees a change in the last interval of the window (the read after the last pause)", async ({ page }) => {
    await page.evaluate((delay) => {
      setTimeout(() => {
        document.getElementById("t")!.textContent = "auto=8";
      }, delay);
    }, BOUNDARY_CHANGE_AFTER_MS);
    const failure = await expectTextStays(page, page.locator("#t"), "auto=7", "the boundary", { windowMs: BOUNDARY_WINDOW_MS }).catch(
      (error: unknown) => error,
    );
    expect(failure, "a change 30 ms before the end of the window is reported").toBeInstanceOf(TextChangedError);
  });

  test("expectTextStays observes the whole of a longer window passed as windowMs", async ({ page }) => {
    await page.evaluate((delay) => {
      setTimeout(() => {
        document.getElementById("t")!.textContent = "auto=8";
      }, delay);
    }, LONG_CHANGE_AFTER_MS);
    await expectTextStays(page, page.locator("#t"), "auto=7", "a window that ends before the change", { windowMs: NEGATIVE_EVENT_WINDOW_MS - 300 });
    const failure = await expectTextStays(page, page.locator("#t"), "auto=7", "the long window", { windowMs: LONG_WINDOW_MS }).catch(
      (error: unknown) => error,
    );
    expect(failure, "the change after the default window is inside the longer one").toBeInstanceOf(TextChangedError);
  });

  test("expectTextStays passes for a text that does not change", async ({ page }) => {
    await page.locator("#t").evaluate((element) => (element.textContent = "stable"));
    await expectTextStays(page, page.locator("#t"), "stable", "a text that stays");
  });

  test("expectTextStays fails with TextChangedError naming both texts when the text changes inside the window", async ({
    page,
  }) => {
    await page.evaluate((delay) => {
      setTimeout(() => {
        document.getElementById("t")!.textContent = "auto=8";
      }, delay);
    }, CHANGE_AFTER_MS);
    const failure = await expectTextStays(page, page.locator("#t"), "auto=7", "the counter").catch((error: unknown) => error);
    expect(failure, "the change inside the window is reported").toBeInstanceOf(TextChangedError);
    expect((failure as Error).message, "expected and read text").toContain('expected the text "auto=7" to stay, read "auto=8"');
  });

  test("expectCountStays passes for a count that does not change and fails with CountChangedError when an element appears inside the window", async ({ page }) => {
    await expectCountStays(page, page.locator("#late"), 0, "nothing appears");
    await page.evaluate((delay) => {
      setTimeout(() => {
        const element = document.createElement("p");
        element.id = "late";
        document.body.appendChild(element);
      }, delay);
    }, CHANGE_AFTER_MS);

    const failure = await expectCountStays(page, page.locator("#late"), 0, "the late element").catch((error: unknown) => error);

    expect(failure, "an element that appears inside the window is reported").toBeInstanceOf(CountChangedError);
    expect(String(failure), "the message names both counts").toMatch(/expected the count 0 to stay, read 1/);
  });
});
