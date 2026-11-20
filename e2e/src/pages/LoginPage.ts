import type { Locator, Page } from "@playwright/test";

const LOGIN_PATH = "/user/auth/login";

/** The sign-in form at /user/auth/login. */
export class LoginPage {
  constructor(private readonly page: Page) {}

  get emailInput(): Locator {
    return this.page.getByPlaceholder("Please enter your email");
  }

  get passwordInput(): Locator {
    return this.page.locator('input[type="password"]').first();
  }

  get signInButton(): Locator {
    return this.page.getByRole("button", { name: "Sign In" });
  }

  /** The notice the app shows after a failed sign-in. */
  get invalidCredentialsMessage(): Locator {
    return this.page.getByText("Invalid email or password.");
  }

  async open(): Promise<void> {
    await this.page.goto(LOGIN_PATH);
  }

  get continueButton(): Locator {
    return this.page.getByRole("button", { name: "Continue" });
  }

  /** The form asks for the e-mail first and for the password on a second step. */
  async signIn(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.continueButton.click();
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }
}
