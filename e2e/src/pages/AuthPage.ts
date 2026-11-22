import type { Locator, Page } from "@playwright/test";
import { UI_PATHS } from "../constants";

/** The client's password rules as the sign-up form shows them (`authUtils.ts:99-118`; measured text). */
export const PASSWORD_RULE_TEXT = {
  LENGTH: "At Least 8 Characters",
  LETTERS_AND_DIGITS: "Must Contain Letters and Numbers",
  NO_WHITESPACE: "Cannot Contain Whitespace Characters",
} as const;
/** Shown under the confirmation field when it differs from the password (`tacoInput.tsx` `doubleCheck`; measured). */
const INCONSISTENT_PASSWORDS_TEXT = "Two passwords are inconsistent";
/** Shown when the address typed on the sign-up page is registered (`register.tsx:162-183`). */
const EMAIL_EXISTS_TEXT = "Email is already registered";
/** The heading of an invitation's sign-in page follows the inviter's name (`en.ts` `:4709`). */
const INVITATION_HEADING_SUFFIX = "invites You to work together";
/** The sign-up page checks an address on blur with this request (`register.tsx:162-183`). */
const BYUSER_PATH = "/api/organizations/byuser/";

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

  /** The line that names a password rule the typed password breaks. */
  ruleMessage(text: string): Locator {
    return this.page.getByText(text, { exact: true });
  }

  get inconsistentPasswordsMessage(): Locator {
    return this.page.getByText(INCONSISTENT_PASSWORDS_TEXT, { exact: true });
  }

  get emailExistsMessage(): Locator {
    return this.page.getByText(EMAIL_EXISTS_TEXT);
  }

  /** The heading of the invitation page, which names the inviter. */
  invitationHeading(inviterName: string): Locator {
    return this.page.getByText(`${inviterName} ${INVITATION_HEADING_SUFFIX}`, { exact: true });
  }

  /** Types the address and leaves the field; returns once the page's check of the address has been answered. */
  async fillEmailAndBlur(email: string): Promise<void> {
    const checked = this.page.waitForResponse((response) => response.url().includes(BYUSER_PATH));
    await this.emailInput.fill(email);
    await this.emailInput.blur();
    await checked;
  }

  /** Fills the password and its confirmation separately, for the cases where they differ. */
  async fillPasswords(password: string, confirmation: string): Promise<void> {
    await this.passwordInputs.nth(0).fill(password);
    await this.passwordInputs.nth(1).fill(confirmation);
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
