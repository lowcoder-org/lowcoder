import type { Locator, Page } from "@playwright/test";

/** The "Properties" tab of the editor's right panel, for the selected component. */
export class PropertyPanel {
  constructor(private readonly page: Page) {}

  /** The code editor (CodeMirror) of the property with this label. */
  field(label: string): Locator {
    return this.page
      .locator("div")
      .filter({ has: this.page.getByText(label, { exact: true }) })
      .locator(".cm-content")
      .first();
  }

  /**
   * Replaces the first code field of the panel (the "Data" field of a table) with an expression. The text is
   * inserted as is, because typing `{{` would make the editor add the closing braces itself. The field can be taller
   * than the screen, so it is clicked near its top.
   */
  async setFirstFieldExpression(expression: string): Promise<void> {
    const field = this.page.locator(".cypress-right-content .cm-content").first();
    await field.click({ position: { x: 20, y: 20 } });
    await field.press("ControlOrMeta+A");
    await this.page.keyboard.insertText(expression);
  }

  /** Renames the selected component: double-click its name in the panel header, type, confirm with Enter. */
  async rename(currentName: string, newName: string): Promise<void> {
    await this.page.locator(".cypress-right-content").getByText(currentName, { exact: true }).dblclick();
    // double-clicking the name opens an input with the whole name selected
    await this.page.keyboard.type(newName);
    await this.page.keyboard.press("Enter");
  }

  /** Replaces the value of a property by typing into its editor. */
  async setValue(label: string, value: string): Promise<void> {
    const field = this.field(label);
    await field.click();
    await field.press("ControlOrMeta+A");
    await this.page.keyboard.type(value);
  }
}
