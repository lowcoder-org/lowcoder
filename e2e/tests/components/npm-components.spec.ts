import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createApp, publishApp } from "../../src/api/client";
import { TAGS } from "../../src/constants";
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
}

const COMPONENTS: NpmComponent[] = [
  { type: "barChart", draws: "canvas" },
  { type: "lineChart", draws: "canvas" },
  { type: "pieChart", draws: "canvas" },
  { type: "mermaid", draws: "svg", text: "Is it working?" },
  { type: "calendar", draws: "svg" },
  { type: "ganttChart", draws: "svg" },
  { type: "bpmnEditor", draws: "svg" },
  { type: "pivotTable", draws: "text" },
  { type: "kanban", draws: "text" },
];

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
      if (component.draws !== "canvas") {
        // A canvas chart has no text; the others show their default content as text.
        await expect(comp, "it shows its default content").not.toHaveText("", { timeout: NPM_RENDER_TIMEOUT_MS });
      }
      if (component.text) {
        await expect(comp).toContainText(component.text, { timeout: NPM_RENDER_TIMEOUT_MS });
      }
    });
  }
});
