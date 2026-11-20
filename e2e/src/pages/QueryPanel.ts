import type { Locator, Page } from "@playwright/test";

/** The data query panel at the bottom of the editor. */
export class QueryPanel {
  constructor(private readonly page: Page) {}

  /** Creates a query on the named data source: "New", then the data source in the chooser. */
  async createOn(datasourceName: string): Promise<void> {
    await this.page.getByRole("button", { name: "New" }).first().click();
    await this.page.getByText(datasourceName, { exact: true }).last().click();
  }

  /** Creates a JavaScript query: "New", then "Run JavaScript Code". */
  async createJavaScript(): Promise<void> {
    await this.page.getByRole("button", { name: "New" }).first().click();
    await this.page.getByText("Run JavaScript Code", { exact: true }).click();
  }

  /** Replaces the SQL or script of the open query. Its editor is the last code editor on the page. */
  async setSql(sql: string): Promise<void> {
    await this.setCode(sql);
  }

  async setCode(code: string): Promise<void> {
    const editor = this.page.locator(".cm-content").last();
    await editor.click();
    await editor.press("ControlOrMeta+A");
    await this.page.keyboard.type(code);
  }

  async run(): Promise<void> {
    await this.page.getByRole("button", { name: "Run" }).click();
  }

  /** The notice that a run finished, with the result rows below it. */
  runSuccessful(queryName: string): Locator {
    // the result panel and a message both carry the text for JavaScript queries
    return this.page.getByText(`${queryName} Run Successful`).first();
  }
}
