import { createApp } from "../../src/api/client";
import { TAGS } from "../../src/constants";
import { expect, test } from "../../src/fixtures";
import { EditorPage } from "../../src/pages/EditorPage";
import { ExtensionsPanel, type ExtensionKind } from "../../src/pages/ExtensionsPanel";

/** A small npm package of Lowcoder components that both lists accept. */
const PACKAGE_NAME = "lowcoder-comp-kanban";
const NPM_TEST_TIMEOUT_MS = 150_000;
const VERSION_PATTERN = /^\d+\.\d+\.\d+/;

// The app container fetches the package from the npm registry, so these tests need its internet access (like the
// components of tests/components/npm-components.spec.ts). They change the organisation's lists, not the app's DSL.
test.describe("Extensions panel object", () => {
  const KINDS: { kind: ExtensionKind; other: ExtensionKind }[] = [
    { kind: "plugin", other: "template" },
    { kind: "template", other: "plugin" },
  ];
  for (const { kind, other } of KINDS) {
    test(`an npm ${kind} becomes a tile, stays after a reload, and leaves the ${other} list empty`, {
      tag: [TAGS.NPM, TAGS.SLOW],
    }, async ({ page, apiUser }) => {
      test.setTimeout(NPM_TEST_TIMEOUT_MS);
      const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: `e2e-extensions-${kind}` });
      const editor = new EditorPage(page);
      const panel = new ExtensionsPanel(page);
      const emptyOther = other === "plugin" ? panel.emptyPlugins : panel.emptyTemplates;

      await editor.open(appId);
      await panel.open();
      await panel.addNpmPackage(kind, PACKAGE_NAME);

      expect(await panel.tileVersion(kind, PACKAGE_NAME), "the version in the tile's test id").toMatch(VERSION_PATTERN);
      await expect(emptyOther, `the ${other} list still shows its empty text`).toBeVisible();

      await editor.open(appId);
      await panel.open();

      await expect(panel.tile(kind, PACKAGE_NAME), "the tile is still there after a reload").toBeVisible();
    });
  }
});
