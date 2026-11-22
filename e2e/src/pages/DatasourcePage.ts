import type { Locator, Page } from "@playwright/test";
import { API_PATHS, DATASOURCE_PAGE_PATH } from "../constants";
import type { PostgresConnection } from "../api/client";

/** What the page's save request answered. */
export interface SaveAnswer {
  status: number;
  code: number | undefined;
}

/** The data source page at /datasource (route mounted for every user, the sidebar entry is hidden from non-developers). */
export class DatasourcePage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto(DATASOURCE_PAGE_PATH);
  }

  get newButton(): Locator {
    return this.page.getByRole("button", { name: "New data source" });
  }

  /**
   * Creates a PostgreSQL data source through the form (New data source > PostgreSQL > fields > Save) and returns the answer of
   * the `POST /api/datasources` the form sends, so a denial is read from the server's answer, not from a toast.
   */
  async createPostgres(connection: PostgresConnection, name: string): Promise<SaveAnswer> {
    await this.newButton.click();
    await this.page.getByText("PostgreSQL", { exact: true }).click();
    await this.page.getByPlaceholder("My PostgreSQL1").fill(name);
    await this.page.getByPlaceholder("myhost.io").fill(connection.host);
    await this.page.getByPlaceholder("test_db").fill(connection.database);
    await this.page.getByPlaceholder("user", { exact: true }).fill(connection.username);
    await this.page.locator('input[type="password"]').fill(connection.password);
    const answer = this.page.waitForResponse(
      (response) => response.request().method() === "POST" && new URL(response.url()).pathname === API_PATHS.DATASOURCES,
    );
    await this.page.getByRole("button", { name: "Save" }).click();
    const response = await answer;
    const body = (await response.json()) as { code?: number };
    return { status: response.status(), code: body.code };
  }

  /** Opens "Access Control" of a data source from its row's menu (the share dialog of the data source). */
  async openAccessControl(name: string): Promise<void> {
    const row = this.page.locator(".ant-table-row").filter({ has: this.page.getByText(name, { exact: true }) });
    await row.locator('svg[tabindex="-1"]').click();
    await this.page.getByText("Access Control", { exact: true }).click();
    await this.page.locator(".ant-modal", { hasText: "Access Control" }).first().waitFor();
  }
}
