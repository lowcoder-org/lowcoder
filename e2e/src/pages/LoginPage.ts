import type { Locator, Page } from "@playwright/test";

const LOGIN_PATH = "/user/auth/login";
/** The heading of the step that lists a user's workspaces when there is more than one (`formLoginSteps.tsx:301-331`). */
const SELECT_WORKSPACE_TEXT = "Select your workspace";
/** Shown after "Continue" with an address no user has (`formLoginSteps.tsx:182-224`; `en.ts` `:4731-4732`). */
const USER_NOT_FOUND_TEXT = "User not found. Please make sure you entered the correct email.";

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

  get userNotFoundMessage(): Locator {
    return this.page.getByText(USER_NOT_FOUND_TEXT);
  }

  /** The link of the password step that leads to the forgot page (`formLoginSteps.tsx:355-362`). */
  get forgotPasswordLink(): Locator {
    return this.page.getByText("Forgot Password?", { exact: true });
  }

  get selectWorkspaceHeading(): Locator {
    return this.page.getByText(SELECT_WORKSPACE_TEXT);
  }

  /** The card of a workspace in the "Select your workspace" step (no test id: the card is a block holding the name). */
  workspaceCard(name: string): Locator {
    return this.page.getByText(name, { exact: true });
  }

  async chooseWorkspace(name: string): Promise<void> {
    await this.workspaceCard(name).click();
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

  /**
   * The sign-in page of a workspace (`/org/<id>/auth/login`) shows e-mail and password together, without the
   * "Continue" step of the general page (measured on the 3.0.0 client).
   */
  async signInOnWorkspacePage(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }
}
