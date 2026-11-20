import { expect, type Locator, type Page } from "@playwright/test";
import { APP_PAGE, GRID_SETTLE_MS, INSERT_PANEL_ATTEMPT_TIMEOUT_MS, INSERT_PANEL_TIMEOUT_MS } from "../constants";

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
    const source = this.page.getByTestId(`insert-comp-${compType}`);
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
}
