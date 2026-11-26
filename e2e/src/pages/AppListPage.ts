import { readFileSync } from "node:fs";
import { expect, type FileChooser, type Locator, type Page } from "@playwright/test";
import { IMPORT_ATTEMPT_TIMEOUT_MS, IMPORT_TIMEOUT_MS, UI_PATHS } from "../constants";

/** The text of the tour's first step (`homeTutorials.createAppContent`; measured). */
const TOUR_TEXT = "Welcome! Click 'App' and Start to Create Your First Application.";
/** The navigation tab of a plain member (`index.tsx` of ApplicationV2; measured text). */
const MEMBER_HOME_TAB = "Homepage (Org)";

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
    const newButton = this.newButton;
    // The visible "Import" text of the menu item is covered by the Upload of `AppImport` (CreateDropdown.tsx), which takes
    // the click: Playwright refuses a click on the text ("intercepts pointer events") and a click on the menu item's centre
    // does not reach the Upload, so click the Upload wrapper itself. The item holds two `.ant-upload` elements (this div and
    // a span inside it); no role or test id names the Upload.
    const importTrigger = this.page.getByRole("menuitem", { name: "Import" }).locator(".ant-upload-select");
    // The menu animates open, and a click that lands while it moves does not start the upload; try again until the
    // file chooser opens.
    let chooser: FileChooser | undefined;
    await expect(async () => {
      if (!(await importTrigger.isVisible())) {
        await newButton.click({ timeout: IMPORT_ATTEMPT_TIMEOUT_MS });
      }
      [chooser] = await Promise.all([
        this.page.waitForEvent("filechooser", { timeout: IMPORT_ATTEMPT_TIMEOUT_MS }),
        importTrigger.click({ timeout: IMPORT_ATTEMPT_TIMEOUT_MS }),
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

  /**
   * The "New" button of the app list, by its exact name (the sidebar's "News" button would match a substring); the page can
   * hold two "New" buttons (measured on a developer's list, SEC-R07c), so the first one. The client shows it to developers and
   * admins only (`orgDev` gate).
   */
  get newButton(): Locator {
    return this.page.getByRole("button", { name: "New", exact: true }).first();
  }

  get emptyState(): Locator {
    return this.page.getByText("You don't have any apps yet");
  }

  /** The first step of the new-user tour (react-joyride, `HomeTutorialsV2.tsx`): an alert dialog with the "Create App" title. */
  get tourDialog(): Locator {
    return this.page.getByRole("alertdialog");
  }

  get tourText(): Locator {
    return this.page.getByText(TOUR_TEXT, { exact: true });
  }

  /** The close control of the tour tooltip (`aria-label="Close"`); the tour has no footer, so it is the only way to leave it. */
  get tourClose(): Locator {
    return this.tourDialog.getByRole("button", { name: "Close" });
  }

  /** The "Workspace" tab that a plain member gets in the navigation; 3.0.0 labels it "Homepage (Org)" (measured). */
  get memberHomeTab(): Locator {
    return this.page.getByText(MEMBER_HOME_TAB, { exact: true });
  }

  /** The "Settings" entry of the navigation, offered to developers and admins only. */
  get settingsEntry(): Locator {
    return this.page.getByText("Settings", { exact: true });
  }
}
