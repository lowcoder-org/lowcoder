import { expect, type Locator, type Page } from "@playwright/test";
import { SETTING_PATHS } from "../constants";

/** Shown when the name typed into the delete dialog is not the workspace's (`orgList.tsx`; `en.ts` `:3878-3885`). */
const WRONG_NAME_TEXT = "Workspace Name is Incorrect";

/** One attempt of `switchTo` waits this long for the click to take effect; all attempts together at most `SWITCH_TIMEOUT_MS`. */
const SWITCH_ATTEMPT_TIMEOUT_MS = 3_000;
const SWITCH_TIMEOUT_MS = 20_000;

/** The workspace list at /setting/organization: rows with "Switch" (not the current one), "Edit" and a delete menu. */
export class WorkspacesPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto(SETTING_PATHS.WORKSPACES);
  }

  get rows(): Locator {
    return this.page.locator(".ant-table-row");
  }

  /** The row of the workspace with exactly this name. */
  row(name: string): Locator {
    return this.rows.filter({ has: this.page.getByText(name, { exact: true }) });
  }

  async edit(name: string): Promise<void> {
    await this.row(name).getByText("Edit", { exact: true }).click();
  }

  /**
   * Clicks "Switch" on the row and waits until the row stops offering it (it is the current workspace then). A click made right
   * after a workspace was created can be lost (the page reloads once more), so the click is repeated until it took effect.
   */
  async switchTo(name: string): Promise<void> {
    const button = this.row(name).getByText("Switch", { exact: true });
    await expect(async () => {
      if (await button.isVisible()) {
        await button.click();
      }
      await expect(button, `${name} is the current workspace`).toHaveCount(0, { timeout: SWITCH_ATTEMPT_TIMEOUT_MS });
    }).toPass({ timeout: SWITCH_TIMEOUT_MS });
  }

  /** The menu icon of a row (offered only to an admin of more than one workspace; `PopoverIcon tabIndex={-1}`); it holds the delete entry. */
  menuIconOf(name: string): Locator {
    return this.row(name).locator('svg[tabindex="-1"]');
  }

  /** Opens the delete dialog of a workspace through its row menu. */
  async openDelete(name: string): Promise<void> {
    await this.menuIconOf(name).click();
    await this.page.locator(".ant-popover:visible, .ant-dropdown:visible").getByText("Delete", { exact: true }).click();
  }

  /** The delete dialog asks for the workspace name; types it and confirms. */
  async confirmDelete(typedName: string): Promise<void> {
    const modal = this.page.locator(".ant-modal:visible");
    await modal.locator("input").fill(typedName);
    await modal.getByRole("button", { name: "Delete" }).click();
  }

  get wrongNameMessage(): Locator {
    return this.page.getByText(WRONG_NAME_TEXT);
  }

  /** The name field of a workspace's own page (`/setting/organization/<id>`), saved on blur or Enter. */
  get nameInput(): Locator {
    return this.page.locator("input.ant-input").first();
  }
}
