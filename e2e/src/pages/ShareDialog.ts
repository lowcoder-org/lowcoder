import type { Locator, Page } from "@playwright/test";

/** The roles of the app share dialog's role select; "Remove" deletes the row (`Permission.tsx`, `PermissionList.tsx`). */
export type ShareRole = "Viewer" | "Editor" | "Owner" | "Remove";

/** The roles of the data source dialog ("Access Control"); "Remove" deletes the row (`DatasourcePermissionDialog.tsx`). */
export type DatasourceRole = "Can Use" | "Can Manage" | "Remove";

/**
 * The share dialog of an app (`AppPermissionDialog.tsx`: "Manage permissions", "Add members", then "Versions") or of a data
 * source (`DatasourcePermissionDialog.tsx`: "Access Control", "Add members"): both list the members as `li` rows with a role
 * select and add them in the same way.
 */
export class ShareDialog {
  constructor(private readonly page: Page) {}

  /** The open dialog (the editor has other, closed modals before it in the DOM: the last one is the dialog). */
  get dialog(): Locator {
    return this.page.locator(".ant-modal").last();
  }

  /** Opens the dialog from the "Publish" button of the editor header; returns once the member list is shown. */
  async open(): Promise<void> {
    await this.page.getByRole("button", { name: "Publish" }).first().click();
    await this.page.locator(".ant-modal", { hasText: "Manage permissions" }).first().waitFor();
  }

  /** The editor header's "Publish" button; it is shown to the app's owner and to workspace admins only. */
  get publishButton(): Locator {
    return this.page.getByRole("button", { name: "Publish" });
  }

  /** The line (`li`) of a member (e-mail) or group ("[Group] name") of the member list, found by the `title` of its name. */
  rowOf(name: string): Locator {
    return this.dialog.locator("li", { has: this.page.locator(`div[title="${name}"]`) });
  }

  /** The role select of a member's row (the creator and the workspace admins have a fixed "Owner" instead). */
  roleSelectOf(name: string): Locator {
    return this.rowOf(name).locator(".ant-select").first();
  }

  /** Picks a role for a member (or "Remove") in the role select of its row. */
  async chooseRole(name: string, role: ShareRole | DatasourceRole): Promise<void> {
    await this.roleSelectOf(name).click();
    await this.page.locator(".ant-select-dropdown:visible .ant-select-item-option").filter({ hasText: new RegExp(`^${role}$`) }).click();
  }

  /** "Add members": searches by (part of) the name, picks the first hit, sets the role and finishes. */
  async addMember(search: string, role?: Exclude<ShareRole | DatasourceRole, "Remove">): Promise<void> {
    await this.dialog.getByText("Add members", { exact: true }).click();
    await this.dialog.locator("input").first().fill(search);
    await this.page.locator(".ant-select-dropdown:visible .ant-select-item-option").first().click();
    if (role) {
      await this.dialog.locator(".ant-select-borderless").first().click();
      await this.page.locator(".ant-select-dropdown:visible .ant-select-item-option").filter({ hasText: new RegExp(`^${role}$`) }).click();
    }
    await this.dialog.getByRole("button", { name: "Finish" }).click();
  }

  /** Goes to the second step ("Versions"), which holds the public switch. */
  async next(): Promise<void> {
    await this.dialog.getByRole("button", { name: "Next" }).click();
  }

  /** The switch "Make the app public. Anyone can view." of the second step: the second checkbox (the first is the fixed "All shared members can view"). */
  get publicSwitch(): Locator {
    return this.dialog.locator("input[type=checkbox]").nth(1);
  }
}
