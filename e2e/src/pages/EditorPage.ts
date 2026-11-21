import { expect, type Locator, type Page } from "@playwright/test";
import {
  APP_PAGE,
  EXTENSIONS_LABELS,
  GRID_SETTLE_MS,
  INSERT_PANEL_ATTEMPT_TIMEOUT_MS,
  INSERT_PANEL_TIMEOUT_MS,
  MODULE_INSTANCE_TIMEOUT_MS,
  MODULE_TILE_TEST_ID,
} from "../constants";

/** The app editor at /apps/{id}/edit. */
export class EditorPage {
  constructor(private readonly page: Page) {}

  /** The grid the components are dropped on. */
  get canvas(): Locator {
    return this.page.locator(".react-grid-layout").first();
  }

  /** The canvas items of a component type; Lowcoder adds the class `lowcoder-<compType>` to each. */
  canvasItems(compType: string): Locator {
    return this.page.locator(`.lowcoder-${compType}`);
  }

  /** A canvas item by the name of its component (`data-comp-name`), e.g. `button1`. */
  canvasItemNamed(name: string): Locator {
    return this.page.locator(`[data-comp-name="${name}"]`);
  }

  /**
   * A button on the canvas, by its label. The `.lowcoder-button` wrapper itself has no box and cannot be
   * clicked, so tests act on the button inside the canvas.
   */
  canvasButton(label: string): Locator {
    return this.canvas.getByRole("button", { name: label });
  }

  /** Drags a button already on the canvas to a position on the canvas (relative to the canvas). */
  async moveButton(label: string, to: { x: number; y: number }): Promise<void> {
    await this.canvasButton(label).dragTo(this.canvas, { sourcePosition: { x: 20, y: 10 }, targetPosition: to });
  }

  /**
   * Widens the selected canvas item by dragging its right resize handle (the handle at the right edge of the
   * item; the item has one on each side).
   */
  async widenSelected(byPixels: number): Promise<void> {
    const handle = this.page.locator(".react-resizable-handle:not(.react-resizable-handle-n)").first();
    const box = await handle.boundingBox();
    if (!box) {
      throw new Error("the selected item has no resize handle on the canvas");
    }
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(startX + byPixels / 2, startY, { steps: 5 });
    await this.page.mouse.move(startX + byPixels, startY, { steps: 5 });
    await this.page.mouse.up();
  }

  /**
   * Opens the editor and waits until edits are saved. The editor marks itself with `data-editor-ready` once its
   * save baseline exists; an edit made before that is lost. Then waits GRID_SETTLE_MS so that a dropped component
   * gets a usable size (defect D-5); `settleGrid: false` skips that wait, for the test that exposes the defect.
   */
  async open(appId: string, options: { settleGrid?: boolean } = {}): Promise<void> {
    await this.page.goto(APP_PAGE.EDIT(appId), { waitUntil: "networkidle" });
    await this.page.locator('[data-editor-ready="true"]').waitFor({ state: "attached" });
    if (options.settleGrid ?? true) {
      await this.page.waitForTimeout(GRID_SETTLE_MS);
    }
  }

  /**
   * Drags a component from the insert panel onto the canvas.
   * @param compType the component type; its tile has the test id `insert-comp-<compType>`
   * @param searchText what to type into the panel search so the tile is in the filtered list
   */
  async dragFromInsertPanel(compType: string, searchText: string, target: { x: number; y: number }): Promise<void> {
    await this.page.getByRole("tab", { name: "Insert" }).click();
    // A component can be listed in more than one category of the panel (`text` is, three times): take the first tile.
    const source = this.page.getByTestId(`insert-comp-${compType}`).first();
    await expect(this.canvas).toBeVisible();
    // The panel re-renders while the editor finishes loading and clears the search box, so the tile can vanish
    // between finding it and dragging it. An attempt that cannot drag drops nothing, so the whole attempt
    // (search, find, drag) is retried; an attempt that drags ends the retries.
    await expect(async () => {
      await this.page.getByRole("textbox", { name: "Search Components or Modules" }).fill(searchText);
      await expect(source).toBeVisible({ timeout: INSERT_PANEL_ATTEMPT_TIMEOUT_MS });
      await source.dragTo(this.canvas, { targetPosition: target, timeout: INSERT_PANEL_ATTEMPT_TIMEOUT_MS });
    }).toPass({ timeout: INSERT_PANEL_TIMEOUT_MS });
  }

  /**
   * Selects a component through the "Active Components" list on the left (the tree item named like the component),
   * then waits until the right panel shows that name. Clicking the component on the canvas does not work for module
   * instances: `canvasItemNamed` and `canvasItems("module")` both timed out on a click. Pressing Escape first is not
   * needed (it switches the right panel to the Insert tab).
   */
  async selectInComponentList(name: string): Promise<void> {
    await this.page.getByRole("treeitem", { name }).click();
    await expect(
      this.page.locator(".cypress-right-content").getByText(name, { exact: true }),
      `the right panel shows ${name}`,
    ).toBeVisible();
  }

  /**
   * Drags the module named `name` from Insert > Extensions onto the canvas, and waits until the editor shows one more
   * module instance. Every module tile has the test id `insert-comp-module` and shows the module's name, so the tile is
   * picked by that name and must be unique. The Insert tab and the Extensions section are opened on every call
   * (a second drag needs the panel opened again). The new instance is selected and named `module<n>`. Verified with two
   * drags in one editor session (`tests/foundation/editor-modules.spec.ts`, 3 of 3 repeats).
   */
  async dragModule(name: string, target: { x: number; y: number }): Promise<void> {
    const instancesBefore = await this.canvasItems("module").count();
    await this.page.getByRole("tab", { name: EXTENSIONS_LABELS.INSERT_TAB }).click();
    await this.page.getByText(EXTENSIONS_LABELS.PANEL, { exact: true }).click();
    const tile = this.page.getByTestId(MODULE_TILE_TEST_ID).filter({ has: this.page.getByText(name, { exact: true }) });
    await expect(tile, `exactly one module tile is named ${name}`).toHaveCount(1);
    await tile.dragTo(this.canvas, { targetPosition: target, timeout: MODULE_INSTANCE_TIMEOUT_MS });
    await expect(this.canvasItems("module"), `the canvas has one more module instance after dropping ${name}`).toHaveCount(
      instancesBefore + 1,
      { timeout: MODULE_INSTANCE_TIMEOUT_MS },
    );
  }
}
