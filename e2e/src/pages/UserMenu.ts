import type { Page } from "@playwright/test";

/** The user avatar menu in the header of the app list and of the editor. */
export class UserMenu {
  constructor(private readonly page: Page) {}

  /** Opens the menu of the signed-in user (the avatar is titled with the e-mail) and clicks "Log Out". */
  async signOut(email: string): Promise<void> {
    await this.page.getByTitle(email).first().click();
    await this.page.getByText("Log Out", { exact: true }).click();
  }

  /** Opens the "My Profile" modal: the avatar menu's header, which shows the user's name, opens it (measured). */
  async openProfile(name: string): Promise<void> {
    await this.page.getByTitle(name).first().click();
    await this.page.locator(".ant-dropdown:visible").getByText(name, { exact: true }).first().click();
  }
}
