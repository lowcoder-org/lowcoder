import type { Locator, Page } from "@playwright/test";
import { UI_PATHS } from "../constants";

/** The sign-up form at /user/auth/register. */
export class AuthPage {
  constructor(private readonly page: Page) {}

  get emailInput(): Locator {
    return this.page.getByPlaceholder("Please enter your email");
  }

  get passwordInputs(): Locator {
    return this.page.locator('input[type="password"]');
  }

  get signUpButton(): Locator {
    return this.page.getByRole("button", { name: "Sign Up" });
  }

  async openRegister(): Promise<void> {
    await this.page.goto(UI_PATHS.REGISTER);
  }

  /** Fills and submits the sign-up form; the terms checkbox is checked by default. */
  async signUp(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInputs.nth(0).fill(password);
    await this.passwordInputs.nth(1).fill(password);
    await this.signUpButton.click();
  }
}
