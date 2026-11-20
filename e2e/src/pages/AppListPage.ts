import { readFileSync } from "node:fs";
import { expect, type FileChooser, type Locator, type Page } from "@playwright/test";
import { IMPORT_ATTEMPT_TIMEOUT_MS, IMPORT_TIMEOUT_MS, UI_PATHS } from "../constants";

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

  /** The card of an app: the closest block around its name that also holds its "View" button. */
  private card(name: string): Locator {
    return this.appNamed(name).locator("xpath=ancestor::div[.//*[normalize-space(text())='View']][1]");
  }

  /** Opens the three-dots menu of an app's card (its last icon, after the app icon) and picks an entry. */
  async chooseFromMenu(appName: string, entry: string): Promise<void> {
    await this.appNamed(appName).hover();
    await this.card(appName).locator("svg").last().click();
    await this.page.getByText(entry, { exact: true }).click();
  }

  /**
   * Fills the name dialog that "Duplicate app" and "Rename app" open (the field may hold the current name) and
   * confirms it; the button is "OK" for a duplicate and "Finish" for a rename.
   */
  async confirmName(name: string, confirmButton: "OK" | "Finish"): Promise<void> {
    await this.page.locator(".ant-modal input:visible").first().fill(name);
    await this.page.getByRole("button", { name: confirmButton }).click();
  }

  /**
   * Imports an app from a JSON file through "New" > "Import". The app takes the name stored in the file; returns it.
   */
  async importFile(path: string): Promise<string> {
    await this.page.getByRole("button", { name: "New" }).click();
    // The menu animates open, and a click that lands while it moves does not start the upload; try again until the
    // file chooser opens.
    let chooser: FileChooser | undefined;
    await expect(async () => {
      [chooser] = await Promise.all([
        this.page.waitForEvent("filechooser", { timeout: IMPORT_ATTEMPT_TIMEOUT_MS }),
        this.page.getByText("Import", { exact: true }).filter({ visible: true }).click({ timeout: IMPORT_ATTEMPT_TIMEOUT_MS }),
      ]);
    }).toPass({ timeout: IMPORT_TIMEOUT_MS });
    await chooser!.setFiles(path);
    const imported = JSON.parse(readFileSync(path, "utf8")) as { applicationInfo: { name: string } };
    return imported.applicationInfo.name;
  }

  /** What a member sees in a workspace where no app is shared with them. */
  get nothingShared(): Locator {
    return this.page.getByText("Nothing here.");
  }

  /** Opens an invitation link, as the page of a signed-in user does; lands on the app list of the new workspace. */
  async openInvitation(inviteCode: string): Promise<void> {
    await this.page.goto(`/invite/${inviteCode}`);
  }

  get emptyState(): Locator {
    return this.page.getByText("You don't have any apps yet");
  }
}
