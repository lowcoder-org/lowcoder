import type { Locator, Page } from "@playwright/test";

/** Shown after a submitted forgot form, whatever the address (`forgotPassword.tsx:40-58`; measured text). */
const FORGOT_SUCCESS_TEXT = "Please check your email for reset password link.";
/** Shown after a reset the server accepted; the page does not redirect (`resetPassword.tsx:44-68`; measured text). */
const RESET_SUCCESS_TEXT = "Password Reset Succeeded. Please login again.";
const FORGOT_PATH = "/user/auth/forgot-password";

/**
 * The two pages of the password recovery: the forgot page (/user/auth/forgot-password: one address field) and the reset
 * page a mailed link opens (/user/auth/lost-password?token=: address, password, confirmation). Both have one "Submit" button.
 */
export class PasswordRecoveryPage {
  constructor(private readonly page: Page) {}

  async openForgot(): Promise<void> {
    await this.page.goto(FORGOT_PATH);
  }

  /**
   * Opens a link exactly as given (a mailed reset link, or the same link with its slashes collapsed). The link holds a token, and
   * Playwright's navigation error names the URL, so a failure is rethrown without it.
   */
  async openLink(link: string): Promise<void> {
    try {
      await this.page.goto(link);
    } catch (error) {
      throw new Error(`the page did not open the link (not shown: it holds a reset token); cause: ${error instanceof Error ? error.name : "unknown"}`);
    }
  }

  /** The address field of both pages (empty on both: the pages do not prefill it; measured). */
  get emailInput(): Locator {
    return this.page.getByPlaceholder("Please enter your email");
  }

  get passwordInput(): Locator {
    return this.page.getByPlaceholder("Please Enter Password");
  }

  get confirmInput(): Locator {
    return this.page.getByPlaceholder("Please Confirm Password");
  }

  get submitButton(): Locator {
    return this.page.getByRole("button", { name: "Submit" });
  }

  get forgotSuccessMessage(): Locator {
    return this.page.getByText(FORGOT_SUCCESS_TEXT);
  }

  get resetSuccessMessage(): Locator {
    return this.page.getByText(RESET_SUCCESS_TEXT);
  }

  async submitForgot(address: string): Promise<void> {
    await this.emailInput.fill(address);
    await this.submitButton.click();
  }

  async submitReset(address: string, password: string): Promise<void> {
    await this.emailInput.fill(address);
    await this.passwordInput.fill(password);
    await this.confirmInput.fill(password);
    await this.submitButton.click();
  }
}
