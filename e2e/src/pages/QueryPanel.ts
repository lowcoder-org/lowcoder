import type { Locator, Page } from "@playwright/test";

/** The data query panel at the bottom of the editor. */
export class QueryPanel {
  constructor(private readonly page: Page) {}

  /** Creates a query on the named data source: "New", then the data source in the chooser. */
  async createOn(datasourceName: string): Promise<void> {
    await this.page.getByRole("button", { name: "New" }).first().click();
    await this.page.getByText(datasourceName, { exact: true }).last().click();
  }

  /** Replaces the SQL of the open query. Its editor is the last code editor on the page. */
  async setSql(sql: string): Promise<void> {
    const editor = this.page.locator(".cm-content").last();
    await editor.click();
    await this.page.keyboard.type(sql);
  }

  async run(): Promise<void> {
    await this.page.getByRole("button", { name: "Run" }).click();
  }

  /** The notice that a run finished, with the result rows below it. */
  runSuccessful(queryName: string): Locator {
    return this.page.getByText(`${queryName} Run Successful`);
  }
}
