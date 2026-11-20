import { test as base, expect, type BrowserContext, type Page } from "@playwright/test";
import { TEST_EMAIL_DOMAIN } from "./constants";
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
 * It covers HTTP(S) requests and WebSocket connections of the pages of the context. Service workers are blocked
 * (config and `newUserSession`), so none can bypass the routes. The suite never switches the guard off.
 *
 * Limits: it does not cover requests made by the backend inside the application container, nor requests that do
 * not go through a page of the context.
 */
export async function installNetworkGuard(context: BrowserContext, baseURL: string): Promise<NetworkGuard> {
  const allowed = new URL(baseURL);
  const allowedOrigin = allowed.origin;
  const guard: NetworkGuard = { blockedUrls: [] };
  await context.route(
    (url) => url.origin !== allowedOrigin,
    (route) => {
      guard.blockedUrls.push(route.request().url());
      return route.abort("blockedbyclient");
    },
  );
  // The app's own WebSocket is on its own host (nginx proxies it); any other host is blocked.
  await context.routeWebSocket(
    (url) => url.host !== allowed.host,
    (socket) => {
      guard.blockedUrls.push(socket.url());
      return socket.close();
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
      const context = await browser.newContext({ baseURL, serviceWorkers: "block" });
      await installNetworkGuard(context, baseURL);
      const session = { context, page: await context.newPage() };
      sessions.push(session);
      return session;
    });
    await Promise.all(sessions.map((session) => session.context.close()));
  },
});

export { expect };
