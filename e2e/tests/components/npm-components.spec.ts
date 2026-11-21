import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Locator } from "@playwright/test";
import { createApp, publishApp } from "../../src/api/client";
import { TAGS } from "../../src/constants";
import { appDsl, barChart, button, eventHandler, setTempState, stackItems, tempState, text } from "../../src/dsl/builders";
import { recordedItem } from "../../src/dsl/recorded";
import { expect, test } from "../../src/fixtures";
import { AppViewPage } from "../../src/pages/AppViewPage";

/**
 * Components that are not in the client bundle: the browser loads their code from `/api/npm/package/...` on the app's
 * own origin and the app's node-service fetches it from the npm registry, so the app container needs internet access
 * (the default Docker network of `scripts/run-in-docker.sh` has it). Their code version is the registry's latest, so
 * the tests assert only that they render what they are given, not their exact markup.
 *
 * Each fixture is the default DSL of the component as the editor saved it (recorded 2026-11-20 on 3.0.0-e2e).
 */
const FIXTURE_DIR = join(__dirname, "..", "..", "fixtures", "dsl");
const NPM_RENDER_TIMEOUT_MS = 60_000;

interface NpmComponent {
  type: string;
  /** What the rendered component must contain. */
  draws: "canvas" | "svg" | "text";
  /** Text its default data shows (for `text`, and checked next to canvas/svg when set). */
  text?: string;
  /** Text that must appear exactly once inside the component (the image editor's `Save` button). */
  exactlyOnceText?: string;
  /** Number of canvases the component draws, where it is known (the image editor has two). */
  canvasCount?: number;
}

/** The 17 ECharts charts (S15) draw on a canvas; `barChart`, `lineChart` and `pieChart` were the first three built. */
const CHART_TYPES = [
  "chart",
  "basicChart",
  "barChart",
  "lineChart",
  "pieChart",
  "scatterChart",
  "candleStickChart",
  "funnelChart",
  "gaugeChart",
  "graphChart",
  "heatmapChart",
  "radarChart",
  "sankeyChart",
  "sunburstChart",
  "themeriverChart",
  "treeChart",
  "treemapChart",
] as const;

const COMPONENTS: NpmComponent[] = [
  ...CHART_TYPES.map((type): NpmComponent => ({ type, draws: "canvas" })),
  { type: "mermaid", draws: "svg", text: "Is it working?" },
  { type: "calendar", draws: "svg" },
  { type: "ganttChart", draws: "svg" },
  { type: "bpmnEditor", draws: "svg" },
  { type: "pivotTable", draws: "text" },
  { type: "kanban", draws: "text" },
  { type: "imageEditor", draws: "canvas", canvasCount: 2, exactlyOnceText: "Save" },
];

/** Pinned clock of the calendar heading test: Wednesday 2026-03-18 12:00 UTC. */
const PINNED_NOW = new Date("2026-03-18T12:00:00Z");
/** The calendar's heading for the week of PINNED_NOW (an en dash between the days) and for its month. */
const PINNED_WEEK_HEADING = "16 \u2013 22 Mar 2026";
const PINNED_MONTH_HEADING = "March 2026";
const CALENDAR_TOOLBAR_LABELS = ["Today", "Month", "Week"] as const;

function compNameOf(dsl: { ui: { items: Record<string, { name: string }> } }): string {
  return Object.values(dsl.ui.items)[0]!.name;
}

test.describe("components loaded from npm", () => {
  for (const component of COMPONENTS) {
    test(`${component.type} renders in the published view`, { tag: [TAGS.NPM, TAGS.SLOW] }, async ({ page, apiUser }) => {
      test.setTimeout(NPM_RENDER_TIMEOUT_MS * 2);
      const dsl = JSON.parse(readFileSync(join(FIXTURE_DIR, `${component.type}.json`), "utf8"));
      const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: `e2e-npm-${component.type}`, dsl });
      await publishApp(page.request, appId);

      await new AppViewPage(page).open(appId);

      const comp = page.locator(`[data-comp-name="${compNameOf(dsl)}"]`);
      // The element carrying data-comp-name can be a zero-size wrapper, so check it is attached and look at its content.
      await expect(comp, "the component is on the page").toBeAttached({ timeout: NPM_RENDER_TIMEOUT_MS });
      if (component.draws === "canvas") {
        await expect(comp.locator("canvas").first(), "it draws on a canvas").toBeVisible({ timeout: NPM_RENDER_TIMEOUT_MS });
      } else if (component.draws === "svg") {
        await expect(comp.locator("svg").first(), "it draws an SVG").toBeVisible({ timeout: NPM_RENDER_TIMEOUT_MS });
      }
      if (component.canvasCount !== undefined) {
        await expect(comp.locator("canvas"), "it draws its canvases").toHaveCount(component.canvasCount, {
          timeout: NPM_RENDER_TIMEOUT_MS,
        });
      }
      if (component.exactlyOnceText) {
        await expect(comp.getByText(component.exactlyOnceText, { exact: true }), `"${component.exactlyOnceText}" shows once`).toHaveCount(1);
      }
      if (component.draws !== "canvas") {
        // A canvas chart has no text; the others show their default content as text.
        await expect(comp, "it shows its default content").not.toHaveText("", { timeout: NPM_RENDER_TIMEOUT_MS });
      }
      if (component.text) {
        await expect(comp).toContainText(component.text, { timeout: NPM_RENDER_TIMEOUT_MS });
      }
      await expect(page.locator("body"), "the published view is not a Not Found page").not.toContainText("Not Found");
    });
  }

  test("calendar shows its toolbar and the week and month of a pinned clock", { tag: [TAGS.NPM, TAGS.SLOW] }, async ({ page, apiUser }) => {
    test.setTimeout(NPM_RENDER_TIMEOUT_MS * 3);
    // The calendar's heading follows today's date, so the clock is pinned before any script of the page runs.
    await page.clock.install({ time: PINNED_NOW });
    const dsl = JSON.parse(readFileSync(join(FIXTURE_DIR, "calendar.json"), "utf8"));
    const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-npm-calendar-clock", dsl });
    await publishApp(page.request, appId);

    await new AppViewPage(page).open(appId);

    const comp = page.locator(`[data-comp-name="${compNameOf(dsl)}"]`);
    for (const label of CALENDAR_TOOLBAR_LABELS) {
      await expect(comp.getByText(label, { exact: true }), `the toolbar shows ${label} once`).toHaveCount(1, {
        timeout: NPM_RENDER_TIMEOUT_MS,
      });
    }
    const heading = comp.locator(".fc-toolbar-title");
    await expect(heading, "the heading is the week of the pinned date").toHaveText(PINNED_WEEK_HEADING);
    await comp.getByText("Month", { exact: true }).click();
    await expect(heading, "the heading is the month of the pinned date").toHaveText(PINNED_MONTH_HEADING);
  });

  /**
   * S15's bound variant (p3 S15, p4 D1): the recorded rows sit in a temporary state and the chart's `data` is
   * `{{state1.value}}`. What it measures: the canvas's pixels (a hash of `toDataURL()` once two reads 500 ms apart
   * agree) with the rows, with `[]` after a button set the state, and with the rows again after a second button. If the
   * chart ignored its binding, the pixels would not change; they do, and the rows restore the first drawing exactly.
   * Defect CD-5 is asserted as today's behaviour (not weakened): the component's own `data` reads empty while the
   * drawing follows the state; when CD-5 is fixed the `chart=0` assertion fails and is to be replaced by the row count.
   */
  test("barChart bound to a temporary state: its drawing follows the state's rows", {
    tag: [TAGS.NPM, TAGS.SLOW],
    annotation: { type: "defect", description: "CD-5" },
  }, async ({ page, apiUser }) => {
    test.setTimeout(NPM_RENDER_TIMEOUT_MS * 3);
    const recordedRows = recordedItem("barChart").comp.data as string;
    const items = stackItems([
      barChart({ id: "c1", name: "barChart1", testId: CHART_ID, data: "{{state1.value}}", xAxisKey: BOUND_X_KEY, series: BOUND_SERIES }),
      text({ id: "t1", name: "tState", testId: STATE_TEXT_ID, text: "state={{typeof state1.value}}:{{state1.value.length}}" }),
      text({ id: "t2", name: "tChart", testId: CHART_DATA_TEXT_ID, text: "chart={{barChart1.data.length}}" }),
      button({ id: "b1", name: "bEmpty", text: "Empty", testId: EMPTY_ID, onEvent: [eventHandler("click", setTempState("state1", "[]"))] }),
      button({ id: "b2", name: "bRows", text: "Rows", testId: ROWS_ID, onEvent: [eventHandler("click", setTempState("state1", recordedRows))] }),
    ]);
    const dsl = appDsl(items, { tempStates: [tempState({ id: "s1", name: "state1", value: recordedRows })] });
    const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-npm-barchart-bound", dsl });
    await publishApp(page.request, appId);
    const view = new AppViewPage(page);

    await view.open(appId);
    const canvas = page.locator('[data-comp-name="barChart1"]').locator("canvas").first();
    await expect(canvas, "the bound chart draws on a canvas").toBeVisible({ timeout: NPM_RENDER_TIMEOUT_MS });
    await expect(view.byTestId(STATE_TEXT_ID), "the state holds the recorded rows").toHaveText(`state=object:${RECORDED_ROW_COUNT}`);
    const withRows = await stableFingerprint(canvas);

    await view.buttonByTestId(EMPTY_ID).click();
    await expect(view.byTestId(STATE_TEXT_ID), "the button emptied the state").toHaveText("state=object:0");
    await expect.poll(() => fingerprint(canvas), { message: "the drawing changed when the state was emptied", timeout: NPM_RENDER_TIMEOUT_MS }).not.toBe(withRows);
    const withoutRows = await stableFingerprint(canvas);
    expect(withoutRows, "the empty drawing differs from the one with rows").not.toBe(withRows);

    await view.buttonByTestId(ROWS_ID).click();
    await expect(view.byTestId(STATE_TEXT_ID), "the second button restored the rows").toHaveText(`state=object:${RECORDED_ROW_COUNT}`);
    await expect.poll(() => fingerprint(canvas), { message: "the same rows draw the same chart again", timeout: NPM_RENDER_TIMEOUT_MS }).toBe(withRows);

    // CD-5, today's behaviour: the chart draws the bound rows, yet its own `data` reads empty.
    await expect(view.byTestId(CHART_DATA_TEXT_ID), "CD-5: barChart1.data reads empty while the drawing follows the state").toHaveText("chart=0");
  });
});

/** Number of rows in the recorded `data` of `barChart.json` (Jan to Jun). */
const RECORDED_ROW_COUNT = 6;
const CHART_ID = "e2e-bound-chart";
const STATE_TEXT_ID = "e2e-bound-state";
const CHART_DATA_TEXT_ID = "e2e-bound-chart-data";
const EMPTY_ID = "e2e-bound-empty";
const ROWS_ID = "e2e-bound-rows";
const BOUND_X_KEY = "month";
const BOUND_SERIES = [
  { columnName: "sales", seriesName: "Sales" },
  { columnName: "target", seriesName: "Target" },
];

/** A short hash of the canvas's pixels (its data URL), so that a failure message stays readable. */
async function fingerprint(canvas: Locator): Promise<string> {
  const dataUrl = await canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL());
  return createHash("sha256").update(dataUrl).digest("hex").slice(0, FINGERPRINT_CHARS);
}

const FINGERPRINT_CHARS = 16;
const FINGERPRINT_POLL_MS = 500;

/** The fingerprint of a canvas once two reads `FINGERPRINT_POLL_MS` apart agree (the chart animates when its data changes). */
async function stableFingerprint(canvas: Locator): Promise<string> {
  let previous = "";
  let current = "";
  await expect
    .poll(
      async () => {
        current = await fingerprint(canvas);
        const agrees = current === previous;
        previous = current;
        return agrees;
      },
      { intervals: [FINGERPRINT_POLL_MS], timeout: NPM_RENDER_TIMEOUT_MS, message: "the chart's drawing settles" },
    )
    .toBe(true);
  return current;
}
