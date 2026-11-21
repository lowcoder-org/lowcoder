import type { Locator, Page } from "@playwright/test";
import { APP_PAGE, UI_PATHS } from "../constants";

/** A published app at /apps/{id}/view. */
export class AppViewPage {
  constructor(private readonly page: Page) {}

  async open(appId: string): Promise<void> {
    await this.page.goto(APP_PAGE.VIEW(appId));
  }

  /**
   * Opens the app of which the visitor may not see the published view. The app redirects such a visitor to the
   * sign-in page, which sometimes interrupts the navigation of `goto`; that interruption is the expected outcome.
   */
  async openAsDeniedVisitor(appId: string): Promise<void> {
    try {
      await this.page.goto(APP_PAGE.VIEW(appId));
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("interrupted by another navigation")) {
        throw error;
      }
    }
    await this.page.waitForURL(UI_PATHS.LOGIN_IN_ORG);
  }

  /** The message the app shows a signed-in user who may not view it (it names the app owner). */
  get permissionDeniedMessage(): Locator {
    return this.page.getByText("It appears you don't have the permission to view").first();
  }

  /** The button inside a component addressed by test id. */
  buttonByTestId(testId: string): Locator {
    return this.byTestId(testId).getByRole("button");
  }

  /** A component addressed by the "Individual ID" property it was given in the DSL. */
  byTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * A component addressed by its name (`data-comp-name`): for the 21 component types that have no test id (p2 2.3)
   * and for the instances of a module. The element can be a zero-size wrapper; assert its content, or `toBeAttached`.
   */
  byCompName(name: string): Locator {
    return this.page.locator(`[data-comp-name="${name}"]`);
  }

  /**
   * The scope of one instance of a module, by its name in the host (`module1`). Every instance repeats the module's
   * test ids, so a module's own components must be located inside this scope: an unscoped `getByTestId` matches once
   * per instance and fails in strict mode. A module instance shows `Loading...` right after a page load, so assert
   * its content with a waiting `toHaveText`, never a one-shot read.
   */
  inModule(instanceName: string): Locator {
    return this.byCompName(instanceName);
  }
}
