import type { Locator, Page } from "@playwright/test";
import { SETTING_PATHS } from "../constants";

/** The toast after "Save" of the add modal and of a detail page (measured). */
const SAVED_TEXT = "Saved Successfully";
/** The status cell of an enabled and of a disabled configuration (`list.tsx`; measured). */
const ENABLED_TEXT = "Enable";
const DISABLED_TEXT = "Not Enabled";
/** Shown under the issuer field of the Generic form when it is empty (measured). */
const ISSUER_REQUIRED_TEXT = "Please enter Well-Known / Issuer Endpoint";

/**
 * The "User Authentication" page of the settings (/setting/oauth-provider; admins only): the list of sign-in configurations,
 * the "Add OAuth Provider" modal and the detail page of one configuration with its "Danger Zone" (Disable, Delete).
 */
export class ProvidersPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto(SETTING_PATHS.OAUTH_PROVIDER);
    await this.addButton.waitFor();
  }

  get addButton(): Locator {
    return this.page.getByText("Add OAuth Provider");
  }

  /** The list row of a configuration by its type label ("GitHub", "Email"); several rows of one type give several matches. */
  rows(typeLabel: string): Locator {
    return this.page.locator("tbody tr", { hasText: typeLabel });
  }

  /** The rows of a type whose status is enabled / disabled. */
  enabledRows(typeLabel: string): Locator {
    return this.rows(typeLabel).filter({ hasText: ENABLED_TEXT }).filter({ hasNotText: DISABLED_TEXT });
  }

  disabledRows(typeLabel: string): Locator {
    return this.rows(typeLabel).filter({ hasText: DISABLED_TEXT });
  }

  /** The add modal (the last open `.ant-modal`) and its parts. */
  get modal(): Locator {
    return this.page.locator(".ant-modal:visible");
  }

  async openAddModal(): Promise<void> {
    await this.addButton.click();
    await this.modal.waitFor();
  }

  /** Picks the type in the modal's select by its option label ("GitHub", "Generic"). */
  async chooseType(optionLabel: string): Promise<void> {
    await this.modal.locator(".ant-select").first().click();
    await this.page.locator(".ant-select-item-option", { hasText: optionLabel }).first().click();
  }

  async fillClient(clientId: string, clientSecret: string): Promise<void> {
    await this.modal.getByPlaceholder("Please Enter Client ID").fill(clientId);
    await this.modal.locator('input[type="password"]').fill(clientSecret);
  }

  async saveModal(): Promise<void> {
    await this.modal.getByRole("button", { name: "Save" }).click();
  }

  get savedToast(): Locator {
    return this.page.getByText(SAVED_TEXT);
  }

  get issuerRequiredMessage(): Locator {
    return this.modal.getByText(ISSUER_REQUIRED_TEXT);
  }

  /** Opens the detail page of the first row of a type (a click on the row). */
  async openDetail(row: Locator): Promise<void> {
    await row.first().click();
  }

  /** The "Disable" and "Delete" buttons of the detail page's Danger Zone. */
  get disableButton(): Locator {
    return this.page.getByRole("button", { name: "Disable", exact: true });
  }

  get deleteButton(): Locator {
    return this.page.getByRole("button", { name: "Delete", exact: true });
  }

  /** Confirms the "Tips" dialog of Disable and the dialog of Delete (both have Cancel and OK). */
  async confirm(): Promise<void> {
    await this.modal.getByRole("button", { name: "OK" }).click();
  }

  /** The notice that explains why the last enabled configuration cannot be switched off. */
  noticeText(text: string): Locator {
    return this.page.getByText(text);
  }
}
