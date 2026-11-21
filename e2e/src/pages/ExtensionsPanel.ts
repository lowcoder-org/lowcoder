import { expect, type Locator, type Page } from "@playwright/test";
import { EXTENSIONS_LABELS, NPM_PACKAGE_TILE_TIMEOUT_MS, NPM_TILE_TEST_ID_PREFIX } from "../constants";

/** The two lists of the panel; each has its own "add npm package" button and its own organisation setting. */
export type ExtensionKind = "plugin" | "template";

const ADD_BUTTON_LABEL: Record<ExtensionKind, string> = {
  plugin: EXTENSIONS_LABELS.ADD_PLUGIN,
  template: EXTENSIONS_LABELS.ADD_TEMPLATE,
};

const LIST_TITLE: Record<ExtensionKind, string> = {
  plugin: EXTENSIONS_LABELS.PLUGIN_LIST_TITLE,
  template: EXTENSIONS_LABELS.TEMPLATE_LIST_TITLE,
};

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * The Extensions section of the editor's Insert tab (Modules, Templates, Plugins), for S16 (plugins) and S19
 * (templates). Both lists are organisation settings (`npmPlugins`, `npmTemplates`), not part of the app's DSL, so
 * adding a package is not an app save (defect D-3 does not apply) and survives a reload. A package is fetched from the
 * npm registry by the app's node-service, so the app container needs internet and gets the registry's latest version;
 * tiles are therefore matched by pattern, never by a fixed version.
 */
export class ExtensionsPanel {
  constructor(private readonly page: Page) {}

  /** Opens Insert > Extensions (also after a reload; the editor must be open and ready). */
  async open(): Promise<void> {
    await this.page.getByRole("tab", { name: EXTENSIONS_LABELS.INSERT_TAB }).click();
    await this.page.getByText(EXTENSIONS_LABELS.PANEL, { exact: true }).click();
  }

  /**
   * Adds an npm package to the plugin or the template list: the kind's "Add npm ..." button, the package name into the
   * dialog's first textbox (it has no placeholder), Enter. Returns when the package's tile is visible; the tile
   * appeared after about 1.2 s in the probes, the wait allows for a slow registry.
   */
  async addNpmPackage(kind: ExtensionKind, packageName: string): Promise<void> {
    await this.page.getByRole("button", { name: ADD_BUTTON_LABEL[kind] }).click();
    await this.page.getByRole("dialog").getByRole("textbox").first().fill(packageName);
    await this.page.keyboard.press("Enter");
    await expect(this.tile(kind, packageName), `the tile of ${packageName} appears after adding it as a ${kind}`).toBeVisible({
      timeout: NPM_PACKAGE_TILE_TIMEOUT_MS,
    });
  }

  /**
   * The tiles of an added package in the list of `kind`: the test id is `insert-comp-remote#npm#<package>@<version>#<type>`,
   * which the version of the registry's latest release fills in, so the id is matched by pattern. Plugins and templates
   * render identical ids, so the lookup is scoped to the element that follows the list's title.
   */
  tile(kind: ExtensionKind, packageName: string): Locator {
    return this.list(kind).getByTestId(new RegExp(`^${escapeRegExp(NPM_TILE_TEST_ID_PREFIX)}${escapeRegExp(packageName)}@[^#]+#`));
  }

  /** The content of one list: the element right after the list's title (`Plugins` / `Templates`). */
  private list(kind: ExtensionKind): Locator {
    return this.page.locator(`xpath=//span[normalize-space(text())="${LIST_TITLE[kind]}"]/following-sibling::*[1]`);
  }

  /** The version in the tile's test id (`0.0.25`). */
  async tileVersion(kind: ExtensionKind, packageName: string): Promise<string> {
    const testId = await this.tile(kind, packageName).first().getAttribute("data-testid");
    const version = testId?.match(/@([^#]+)#/)?.[1];
    if (!version) {
      throw new Error(`the tile of ${packageName} has no version in its test id: ${testId}`);
    }
    return version;
  }

  /** The text the plugin list shows while it is empty. */
  get emptyPlugins(): Locator {
    return this.page.getByText(EXTENSIONS_LABELS.EMPTY_PLUGINS);
  }

  /** The text the template list shows while it is empty. */
  get emptyTemplates(): Locator {
    return this.page.getByText(EXTENSIONS_LABELS.EMPTY_TEMPLATES);
  }
}
