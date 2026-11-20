import { test as base, expect, type BrowserContext, type Page } from "@playwright/test";
import { BLOCKED_BY_CLIENT_ERROR, TEST_EMAIL_DOMAIN } from "./constants";
import { registerUser, type RegisteredUser } from "./api/client";

export interface NetworkGuard {
  /** URLs of the requests the guard blocked in this context. */
  blockedUrls: string[];
}

/**
 * Blocks every request of the browser context to an origin other than the app under test. The Lowcoder
 * client calls api-service.lowcoder.cloud (subscriptions, with the user's e-mail, workspace and host) and loads
 * HubSpot; no test may reach them. Every context a test uses has to get this guard: the `context` of the test
 * gets it from the automatic `networkGuard` fixture, further contexts come from `newUserSession`.
 *
 * Limits: it covers HTTP(S) requests of the pages of the context. It does not cover requests made by the
 * backend inside the application container, and not WebSocket connections (context routes do not see them).
 * Service workers are blocked in the config, so none can bypass the route. The suite never switches the guard off.
 */
export async function installNetworkGuard(context: BrowserContext, baseURL: string): Promise<NetworkGuard> {
  const allowedOrigin = new URL(baseURL).origin;
  const guard: NetworkGuard = { blockedUrls: [] };
  await context.route(
    (url) => url.origin !== allowedOrigin,
    (route) => {
      guard.blockedUrls.push(route.request().url());
      return route.abort("blockedbyclient");
    },
  );
  return guard;
}

/** A second, independent browser session (own cookies), guarded like the test's own. */
export interface UserSession {
  context: BrowserContext;
  page: Page;
}

interface Fixtures {
  networkGuard: NetworkGuard;
  /** A user registered through the API and logged in in the test's browser context. */
  apiUser: RegisteredUser;
  /** Opens another browser session, for a second user or an anonymous visitor. Closed after the test. */
  newUserSession: () => Promise<UserSession>;
}

let emailCounter = 0;
/** `e2e-<tag>-w<worker>-<time>-<n>@example.test`; unique per call, so tests never share a user. */
export function uniqueEmail(tag: string, workerIndex: number): string {
  emailCounter += 1;
  return `e2e-${tag}-w${workerIndex}-${Date.now()}-${emailCounter}@${TEST_EMAIL_DOMAIN}`;
}

export const test = base.extend<Fixtures>({
  networkGuard: [
    async ({ context, baseURL }, use, testInfo) => {
      if (!baseURL) {
        throw new Error("baseURL is not set; the network guard needs it to know the allowed origin");
      }
      const guard = await installNetworkGuard(context, baseURL);
      await use(guard);
      if (guard.blockedUrls.length > 0) {
        await testInfo.attach("blocked-requests.txt", {
          body: [...new Set(guard.blockedUrls)].join("\n"),
          contentType: "text/plain",
        });
      }
    },
    { auto: true },
  ],

  apiUser: async ({ page }, use, testInfo) => {
    await use(await registerUser(page.request, uniqueEmail("api", testInfo.workerIndex)));
  },

  newUserSession: async ({ browser, baseURL }, use) => {
    if (!baseURL) {
      throw new Error("baseURL is not set; a user session needs it for the network guard");
    }
    const sessions: UserSession[] = [];
    await use(async () => {
      const context = await browser.newContext({ baseURL });
      await installNetworkGuard(context, baseURL);
      const session = { context, page: await context.newPage() };
      sessions.push(session);
      return session;
    });
    await Promise.all(sessions.map((session) => session.context.close()));
  },
});

export { expect, BLOCKED_BY_CLIENT_ERROR };
