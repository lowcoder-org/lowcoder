import type { Locator, Page } from "@playwright/test";
import { UI_PATHS } from "../constants";

/** The app list of a workspace at /apps. */
export class AppListPage {
  constructor(private readonly page: Page) {}

  get title(): Locator {
    return this.page.getByText("Your Apps").first();
  }

  /** Opens the list of the current workspace (a reload of it re-reads the apps from the server). */
  async open(): Promise<void> {
    await this.page.goto(UI_PATHS.APP_LIST_PATH);
  }

  /** An app in the list, found by its name. */
  appNamed(name: string): Locator {
    return this.page.getByText(name, { exact: true });
  }

  get emptyState(): Locator {
    return this.page.getByText("You don't have any apps yet");
  }
}
