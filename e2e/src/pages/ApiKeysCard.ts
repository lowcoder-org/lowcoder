import type { Locator, Page } from "@playwright/test";

const CREATE_BUTTON_NAME = "Create API Key";
const KEY_INFO_TEXT = "Make sure to copy your new API key now. You won't be able to see it again.";
const NAME_REQUIRED_TEXT = "Please enter Name";
const API_KEYS_TITLE = "API Keys";
/** Columns of the key table: name, description, token, menu (`UserApiKeysCard.tsx` columns). */
const TOKEN_COLUMN = 2;
/** A listed token is masked: its first 6 characters, 13 stars, its last 6 (`AuthenticationApiServiceImpl.java`). */
export const MASKED_TOKEN_PATTERN = /^.{6}\*{13}.{6}$/;

/** The "API Keys" card of the profile page (`UserApiKeysCard.tsx`, `CreateApiKeyModal.tsx`); on the page of `ProfilePage`. */
export class ApiKeysCard {
  constructor(private readonly page: Page) {}

  get title(): Locator {
    return this.page.getByText(API_KEYS_TITLE, { exact: true });
  }

  get createButton(): Locator {
    return this.page.getByRole("button", { name: CREATE_BUTTON_NAME });
  }

  /** The alert that tells the user the new key is shown once. */
  get newKeyAlert(): Locator {
    return this.page.getByText(KEY_INFO_TEXT);
  }

  get nameRequiredMessage(): Locator {
    return this.page.getByText(NAME_REQUIRED_TEXT);
  }

  /** The rows of the key table. */
  get rows(): Locator {
    return this.page.locator(".ant-table-row");
  }

  /** The row of the key with exactly this name (a name that is the start of another key's name matches one row only). */
  rowOf(name: string): Locator {
    return this.rows.filter({ has: this.page.getByText(name, { exact: true }) });
  }

  /** The text of the token cell of a key's row: the full token for the key just created, the masked one for any other. */
  async tokenOf(name: string): Promise<string> {
    return (await this.rowOf(name).locator("td").nth(TOKEN_COLUMN).innerText()).trim();
  }

  /** Opens the create form, fills it and saves; an empty `name` leaves the field empty (the form refuses it). */
  async create(name: string, description = ""): Promise<void> {
    await this.createButton.click();
    const modal = this.page.locator(".ant-modal");
    await modal.locator("#basic_name").fill(name);
    await modal.locator("#basic_description").fill(description);
    await modal.getByRole("button", { name: "Save" }).click();
  }

  /** Deletes the key through the row's menu and the confirmation dialog. */
  async deleteKey(name: string): Promise<void> {
    await this.rowOf(name).locator("svg").last().click();
    await this.page.locator(".ant-popover:visible, .ant-dropdown:visible").getByText("Delete", { exact: true }).click();
    await this.page.locator(".ant-modal").getByRole("button", { name: "Delete" }).click();
  }
}
