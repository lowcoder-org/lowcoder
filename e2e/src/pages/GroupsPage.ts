import type { Locator, Page } from "@playwright/test";
import { SETTING_PATHS } from "../constants";

/** Shown when a rename is confirmed with an empty name (`permissionList.tsx`, `home.nameCheckMessage`). */
const EMPTY_NAME_TEXT = "The name cannot be empty";

/** The group list at /setting/permission and the page of one group at /setting/permission/<groupId> (3.0.0 client). */
export class GroupsPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto(SETTING_PATHS.GROUPS);
  }

  get createButton(): Locator {
    return this.page.getByText("Create Group", { exact: true });
  }

  /** The rows of the group list (the built-in "All Members" and "Developers" first). */
  get rows(): Locator {
    return this.page.locator(".ant-table-row");
  }

  /** The row of the group with exactly this name. */
  row(name: string): Locator {
    return this.rows.filter({ has: this.page.getByText(name, { exact: true }) });
  }

  /** The menu icon of a row (`PopoverIcon tabIndex={-1}`): absent for the built-in groups, which have no rename or delete. */
  menuIconOf(name: string): Locator {
    return this.row(name).locator('svg[tabindex="-1"]');
  }

  private get menuEntries(): Locator {
    return this.page.locator(".ant-popover:visible, .ant-dropdown:visible");
  }

  /** Renames a group inline: the name becomes a text field, Enter saves. An empty name is refused by the page. */
  async rename(name: string, newName: string): Promise<void> {
    await this.menuIconOf(name).click();
    await this.menuEntries.getByText("Rename", { exact: true }).click();
    const field = this.page.locator(".ant-typography-edit-content textarea").first();
    await field.fill(newName);
    await field.press("Enter");
  }

  get emptyNameMessage(): Locator {
    return this.page.getByText(EMPTY_NAME_TEXT);
  }

  /** Deletes a group through its menu and the confirmation dialog. */
  async deleteGroup(name: string): Promise<void> {
    await this.menuIconOf(name).click();
    await this.menuEntries.getByText("Delete", { exact: true }).click();
    await this.page.locator(".ant-modal:visible").getByRole("button", { name: "Delete" }).click();
  }

  /** Opens the page of a group through its "Manage" button. */
  async manage(name: string): Promise<void> {
    await this.row(name).getByText("Manage", { exact: true }).click();
  }

  /** On a group's page: opens "Add Members", picks the candidates by e-mail and finishes. */
  async addMembers(emails: string[]): Promise<void> {
    await this.page.getByText("Add Members", { exact: true }).click();
    const dialog = this.page.locator(".ant-modal:visible");
    for (const email of emails) {
      await dialog.locator("tr", { hasText: email }).locator("input[type=checkbox]").check();
    }
    await dialog.getByRole("button", { name: "Finish" }).click();
    await dialog.waitFor({ state: "hidden" });
  }

  /** The row of a member on a group's page. */
  memberRow(email: string): Locator {
    return this.page.locator("tr", { hasText: email });
  }

  /** The group role select of a member's row (disabled for the viewer's own row and for a viewer who is no group admin). */
  roleSelectOf(email: string): Locator {
    return this.memberRow(email).locator(".ant-select");
  }

  /** Picks a group role ("Admin" or "Member") for a member. */
  async chooseRole(email: string, role: "Admin" | "Member"): Promise<void> {
    await this.roleSelectOf(email).click();
    await this.page.locator(".ant-select-dropdown:visible .ant-select-item-option").filter({ hasText: new RegExp(`^${role}`) }).click();
  }

  /** The operations of a member's row; they show on hover (the cell is hidden otherwise). */
  async operationsOf(email: string): Promise<Locator> {
    await this.memberRow(email).hover();
    return this.memberRow(email).locator(".operation-cell-div-wrapper");
  }
}
