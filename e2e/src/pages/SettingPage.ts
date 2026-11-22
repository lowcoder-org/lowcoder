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

  /** The open invite dialog. */
  get inviteDialog(): Locator {
    return this.page.locator(".ant-modal:visible");
  }

  /**
   * Types an address into the dialog's "Enter emails" tag field and confirms it with Enter, then presses "Send Invitations"
   * (measured on the 3.0.0 client: the field is the dialog's last editable input, an address becomes a tag on Enter).
   */
  async sendInvitationTo(address: string): Promise<void> {
    const field = this.inviteDialog.locator("input:not([readonly])").last();
    await field.fill(address);
    await field.press("Enter");
    await this.inviteDialog.getByRole("button", { name: "Send Invitations" }).click();
  }

  /** The notice the client shows after "Send Invitations". */
  get inviteNotice(): Locator {
    return this.page.locator(".ant-message");
  }

  /** The operation cell of a member's row on the All Users group page (empty: that group is a synchronised group). */
  operationsOf(email: string): Locator {
    return this.memberRow(email).locator(".operation-cell-div-wrapper");
  }

  /** The "Detail" link of a member's row; it is in the operation cell, which an admin sees (`orgUsersPermission.tsx`), and needs a hover. */
  async openDetailOf(email: string): Promise<void> {
    const row = this.memberRow(email);
    await row.hover();
    await row.getByText("Detail", { exact: true }).click();
  }

  /** The member detail popup: avatar, name, e-mail, groups, language and the member's IP address (`UserDetailPopup`). */
  get detailDialog(): Locator {
    return this.page.locator(".ant-modal:visible");
  }
}
