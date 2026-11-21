import { createApp } from "../../src/api/client";
import { TAGS } from "../../src/constants";
import { expect, test } from "../../src/fixtures";
import { EditorPage } from "../../src/pages/EditorPage";
import { ExtensionsPanel, type ExtensionKind } from "../../src/pages/ExtensionsPanel";

/**
 * S16 (Extensions > Plugins) and S19 (Extensions > Templates): an editor workflow on the Extensions panel. An npm package
 * is added to the organisation's plugin or template list (organisation settings, not the app's DSL, so defect D-3 does
 * not apply), its tile appears, and it is still listed after a reload. The app container fetches the package from the npm
 * registry (it needs internet) and gets the registry's latest release, so the version is matched by pattern.
 */
const PACKAGE_NAME = "lowcoder-comp-kanban";
const PACKAGE_COMPONENT_TITLE = "Kanban Component";
const VERSION_PATTERN = /^\d+\.\d+\.\d+/;
const NPM_TEST_TIMEOUT_MS = 150_000;

interface ExtensionScenario {
  scenario: string;
  kind: ExtensionKind;
  /** The kind whose list must stay untouched: the two lists are independent. */
  other: ExtensionKind;
}

const SCENARIOS: ExtensionScenario[] = [
  { scenario: "S16 plugins", kind: "plugin", other: "template" },
  { scenario: "S19 templates", kind: "template", other: "plugin" },
];

test.describe("Extensions panel: npm packages", () => {
  for (const { scenario, kind, other } of SCENARIOS) {
    test(`${scenario}: an npm ${kind} is listed with its version and stays after a reload`, { tag: [TAGS.NPM] }, async ({ page, apiUser }) => {
      test.setTimeout(NPM_TEST_TIMEOUT_MS);
      const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: `e2e-${kind}-tile` });
      const editor = new EditorPage(page);
      const panel = new ExtensionsPanel(page);
      const emptyOther = other === "plugin" ? panel.emptyPlugins : panel.emptyTemplates;
      const emptyOwn = kind === "plugin" ? panel.emptyPlugins : panel.emptyTemplates;

      await editor.open(appId);
      await panel.open();
      await expect(emptyOwn, `the ${kind} list is empty before the package is added`).toBeVisible();
      await panel.addNpmPackage(kind, PACKAGE_NAME);

      const version = await panel.tileVersion(kind, PACKAGE_NAME);
      expect(version, "the version in the tile's test id").toMatch(VERSION_PATTERN);
      await expect(
        page.getByText(`${PACKAGE_COMPONENT_TITLE} v${version}`, { exact: true }),
        "the tile names the component and the version of its test id",
      ).toBeVisible();
      await expect(emptyOwn, `the ${kind} list no longer shows its empty text`).toBeHidden();
      await expect(emptyOther, `the ${other} list still shows its empty text`).toBeVisible();

      await editor.open(appId);
      await panel.open();

      await expect(panel.tile(kind, PACKAGE_NAME), "the tile is still listed after a reload").toBeVisible();
      await expect(emptyOther, `the ${other} list is still empty after a reload`).toBeVisible();
    });
  }

  test("the same package in both lists: each list's tile lookup finds only its own tile", { tag: [TAGS.NPM] }, async ({ page, apiUser }) => {
    test.setTimeout(NPM_TEST_TIMEOUT_MS);
    const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-both-lists-tile" });
    const editor = new EditorPage(page);
    const panel = new ExtensionsPanel(page);

    await editor.open(appId);
    await panel.open();
    await panel.addNpmPackage("plugin", PACKAGE_NAME);
    await expect(panel.emptyTemplates, "the template list is still empty after the plugin was added").toBeVisible();
    // The plugin tile must not satisfy the template wait: addNpmPackage returns only on the template's own tile.
    await panel.addNpmPackage("template", PACKAGE_NAME);

    for (const kind of ["plugin", "template"] as const) {
      await expect(panel.tile(kind, PACKAGE_NAME), `the ${kind} list holds exactly one tile of the package`).toHaveCount(1);
    }
  });
});
