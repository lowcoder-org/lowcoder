import type { Locator, Page } from "@playwright/test";
import { SETTING_PATHS } from "../constants";

/**
 * The workspace settings at /setting (3.0.0 client). Everything here is measured: a plain member who opens any /setting URL
 * is sent to /apps, a developer reaches the pages, an admin also gets the provider list.
 */
export class SettingPage {
  constructor(private readonly page: Page) {}

  async open(path: string = SETTING_PATHS.HOME): Promise<void> {
    await this.page.goto(path);
  }

  /** An entry of the settings sidebar, visible to everyone who may open the settings (developers and admins). */
  get userAuthenticationEntry(): Locator {
    return this.page.getByText("User Authentication", { exact: true }).first();
  }

  /** The button of the OAuth provider page that only an admin gets (the page reads `GET /api/auth/configs`). */
  get addOauthProviderButton(): Locator {
    return this.page.getByText("Add OAuth Provider");
  }

  async openMembers(): Promise<void> {
    await this.open(SETTING_PATHS.MEMBERS);
  }

  /** The row of the members table that shows the e-mail. */
  memberRow(email: string): Locator {
    return this.page.locator("tr", { hasText: email });
  }

  /** The role select of a member's row (antd select: `.ant-select-disabled` when the client does not let the viewer change it). */
  roleSelectOf(email: string): Locator {
    return this.memberRow(email).locator(".ant-select");
  }

  /** The "Invite Members" button of the group list page (/setting/permission). */
  get inviteMembersButton(): Locator {
    return this.page.getByText("Invite Members", { exact: true });
  }

  /** The invitation link in the open invite dialog: the value of its first input (shape `<origin>/invite/<code>`). */
  async inviteLink(): Promise<string> {
    return this.page.locator(".ant-modal:visible input").first().inputValue();
  }

  /** The operation cell of a member's row on the All Users group page (empty: that group is a synchronised group). */
  operationsOf(email: string): Locator {
    return this.memberRow(email).locator(".operation-cell-div-wrapper");
  }
}
