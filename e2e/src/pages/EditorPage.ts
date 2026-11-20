import { expect, type Locator, type Page } from "@playwright/test";
import { APP_PAGE, EDITOR_SETTLE_MS, INSERT_PANEL_ATTEMPT_TIMEOUT_MS, INSERT_PANEL_TIMEOUT_MS } from "../constants";

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

  /**
   * A button on the canvas, by its label. The `.lowcoder-button` wrapper itself has no box and cannot be
   * clicked, so tests act on the button inside the canvas.
   */
  canvasButton(label: string): Locator {
    return this.canvas.getByRole("button", { name: label });
  }

  async open(appId: string): Promise<void> {
    await this.page.goto(APP_PAGE.EDIT(appId), { waitUntil: "networkidle" });
    // The left panel lists the built-in data variables once the editor has built the app's component tree.
    await expect(this.page.getByText("currentUser", { exact: true })).toBeVisible();
    // See EDITOR_SETTLE_MS: an edit made before the editor took its save baseline is lost.
    await this.page.waitForTimeout(EDITOR_SETTLE_MS);
  }

  /**
   * Drags a component from the insert panel onto the canvas.
   * @param searchText what to type into the panel search (matches the English component name)
   * @param tileLabel the label of the tile to drag, as the panel shows it
   */
  async dragFromInsertPanel(
    searchText: string,
    tileLabel: string,
    target: { x: number; y: number },
  ): Promise<void> {
    // The right panel tabs are <p> elements, not ARIA tabs.
    await this.page.getByText("Insert", { exact: true }).click();
    const tile = this.page.getByText(tileLabel, { exact: true }).first();
    // The draggable element is the sibling that precedes the label.
    const source = tile.locator('xpath=preceding-sibling::div[@draggable="true"]');
    await expect(this.canvas).toBeVisible();
    // The panel re-renders while the editor finishes loading (late under load) and clears the search box, so
    // the tile can vanish between finding it and dragging it. An attempt that cannot drag drops nothing, so
    // the whole attempt (search, find, drag) is retried; an attempt that drags ends the retries.
    await expect(async () => {
      await this.page.getByRole("textbox", { name: "Search Components or Modules" }).fill(searchText);
      await expect(tile).toBeVisible({ timeout: INSERT_PANEL_ATTEMPT_TIMEOUT_MS });
      await source.dragTo(this.canvas, { targetPosition: target, timeout: INSERT_PANEL_ATTEMPT_TIMEOUT_MS });
    }).toPass({ timeout: INSERT_PANEL_TIMEOUT_MS });
  }
}
