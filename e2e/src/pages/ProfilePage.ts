import type { Locator, Page } from "@playwright/test";

const PROFILE_PATH = "/user/profile";
const NAME_PLACEHOLDER = "Please Enter Your Name";
const EMPTY_NAME_TEXT = "Name Cannot Be Empty";
const LANGUAGE_LABEL = "UI Language";

/** The profile page at /user/profile (`UserProfileLayout.tsx`): avatar, name, "About" and the UI language. */
export class ProfilePage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto(PROFILE_PATH);
  }

  /** Saved on blur or Enter; it holds the user's current name (the e-mail address for a new user). */
  get nameInput(): Locator {
    return this.page.getByPlaceholder(NAME_PLACEHOLDER);
  }

  get emptyNameMessage(): Locator {
    return this.page.getByText(EMPTY_NAME_TEXT, { exact: true });
  }

  /** The `input[type=file]` of the avatar upload (antd renders exactly one). */
  get avatarFileInput(): Locator {
    return this.page.locator('input[type="file"]');
  }

  get aboutText(): Locator {
    return this.page.getByText("About", { exact: true });
  }

  get languageLabel(): Locator {
    return this.page.getByText(LANGUAGE_LABEL);
  }

  /** The language select, which lists the languages by their own names (English, Deutsch...). */
  get languageSelect(): Locator {
    return this.page.locator(".ant-select").last();
  }

  async chooseLanguage(name: string): Promise<void> {
    await this.languageSelect.click();
    await this.page.locator(".ant-select-item-option").filter({ hasText: name }).click();
  }

  async setName(name: string): Promise<void> {
    await this.nameInput.fill(name);
    await this.nameInput.press("Enter");
  }

  /**
   * The number on an "Info" card (`UserProfileLayout.tsx`): the `data-target` span after the card's label, which counts up
   * for two seconds, so wait with a web-first assertion on its text.
   */
  infoCount(label: string): Locator {
    return this.page.getByText(label, { exact: true }).locator("xpath=following::span[@data-target][1]");
  }
}
