import type { Locator, Page } from "@playwright/test";
import { API_PATHS, APP_PAGE, NOT_IN_WORKSPACE_MESSAGE, UI_PATHS } from "../constants";

/** A published app at /apps/{id}/view. */
export class AppViewPage {
  constructor(private readonly page: Page) {}

  async open(appId: string): Promise<void> {
    await this.page.goto(APP_PAGE.VIEW(appId));
  }

  /**
   * Opens the app and returns the HTTP status of the first `POST /api/query/execute` the page sends. The view renders its
   * components before an automatic query runs, so "the app is on screen" does not mean "its queries are done": a right removed
   * in that gap makes the query answer 401, and the client answers a 401 by signing the user out (a redirect to the sign-in
   * page that interrupts a later navigation, measured). A test that changes the visitor's rights while the page is open waits for
   * this first. The app must have an automatic query, or this waits for the expect timeout.
   */
  async openAndAwaitQuery(appId: string): Promise<number> {
    const answer = this.page.waitForResponse((response) => new URL(response.url()).pathname === API_PATHS.QUERY_EXECUTE);
    await this.open(appId);
    return (await answer).status();
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

  /** The heading a signed-in user of another workspace gets instead of the app (`NOT_IN_WORKSPACE_MESSAGE`). */
  get notInWorkspaceMessage(): Locator {
    return this.page.getByRole("heading", { name: NOT_IN_WORKSPACE_MESSAGE });
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
   * A component addressed by its name (`data-comp-name`): for the 21 component types that have no test id
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
