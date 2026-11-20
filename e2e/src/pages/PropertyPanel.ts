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

  /** Replaces the value of a property by typing into its editor. */
  async setValue(label: string, value: string): Promise<void> {
    const field = this.field(label);
    await field.click();
    await field.press("ControlOrMeta+A");
    await this.page.keyboard.type(value);
  }
}
