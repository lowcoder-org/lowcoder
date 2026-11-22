import type { Locator, Page } from "@playwright/test";

/** The wrong-old-password notice of the "Modify Password" card (measured on the 3.0.0 client). */
const PASSWORD_MISMATCH_TEXT = "Sorry, passwords do not match.";

/** The "My Profile" modal of the avatar menu (`profileComponets.tsx`, `passwordCard.tsx`): name, e-mail and password cards. */
export class ProfileModal {
  constructor(private readonly page: Page) {}

  get title(): Locator {
    return this.page.getByText("My Profile", { exact: true });
  }

  /** The name field of the modal (same placeholder as on the profile page; saved on blur or Enter). */
  get nameInput(): Locator {
    return this.page.getByPlaceholder("Please Enter Your Name");
  }

  get modifyPasswordButton(): Locator {
    return this.page.getByText("Modify Password", { exact: true });
  }

  /** The three password fields of "Modify Password": old, new, confirmation (in this order). */
  get passwordFields(): Locator {
    return this.page.locator('input[type="password"]:visible');
  }

  get submitButton(): Locator {
    return this.page.getByRole("button", { name: "Submit" });
  }

  get passwordMismatchMessage(): Locator {
    return this.page.getByText(PASSWORD_MISMATCH_TEXT);
  }

  async fillPasswordChange(oldPassword: string, newPassword: string, confirmation: string = newPassword): Promise<void> {
    await this.passwordFields.nth(0).fill(oldPassword);
    await this.passwordFields.nth(1).fill(newPassword);
    await this.passwordFields.nth(2).fill(confirmation);
  }
}
