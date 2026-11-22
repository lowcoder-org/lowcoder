import { test as base, expect, type APIRequest, type APIRequestContext, type BrowserContext, type Page } from "@playwright/test";
import { ECHO_PATHS, TEST_EMAIL_DOMAIN } from "./constants";
import { currentUserId, registerUser, signIn, type RegisteredUser } from "./api/client";
import type { Actor } from "./security/actors";
import { echoBaseUrl, echoReadPrefix, echoTargetPath, type EchoRecord, type EchoTarget } from "./security/echo";
import { mailboxAt, type Mailbox } from "./lifecycle/mail";
import { superAdminCredentials, withCapacityHint, type SuperAdmin } from "./security/super-admin";

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

/** The signed-in browser state (cookies) of the instance super admin, as `APIRequestContext.storageState()` returns it. */
export type SuperAdminStorageState = Awaited<ReturnType<APIRequestContext["storageState"]>>;

/**
 * Outcome of the worker's one super-admin sign-in: the signed-in state, or the reason there is none (credentials not set,
 * sign-in refused, stack unreachable). Kept instead of thrown, so a spec that never asks for the super admin runs without it.
 */
export type SuperAdminOutcome = { state: SuperAdminStorageState } | { error: Error };

interface WorkerFixtures {
  /**
   * The super admin's sign-in, made once per worker when the worker starts. It is an AUTOMATIC worker fixture on purpose:
   * Playwright traces every request context created while a test runs, so a sign-in made lazily by the first test that needs
   * the super admin would put the login body, with the password, into that test's trace (measured: 1 leak in the trace and
   * the HTML report of a failing test). Made before the first test starts, the request context is in no trace. It opens and
   * disposes its own request context (in a `finally`). The `superAdmin` fixture rethrows a failure, with a message that names
   * the two variables and the run script (`SuperAdminEnvError`) and never a value.
   */
  superAdminState: SuperAdminOutcome;
}

interface Fixtures {
  networkGuard: NetworkGuard;
  /** A user registered through the API and logged in in the test's browser context. */
  apiUser: RegisteredUser;
  /** Opens another browser session, for a second user or an anonymous visitor. Closed after the test. */
  newUserSession: () => Promise<UserSession>;
  /**
   * A user for a security test: `newUserSession` plus a registration (own SAAS workspace, admin of it) and its user id.
   * `tag` names the role in the e-mail (`e2e-<tag>-w<worker>-...`). Its context is closed after the test by
   * `newUserSession`; helpers never create contexts.
   */
  actor: (tag: string) => Promise<Actor>;
  /**
   * The instance super admin (a SUPER_ADMIN member of every workspace, no workspace of its own): a guarded browser context
   * opened from `superAdminState` and closed after the test. ONE account shared by all workers: never switch its
   * workspace, never change its password, change it only inside the test's own workspace.
   */
  superAdmin: SuperAdmin;
  /**
   * The test's own target on the HTTP echo sidecar (`url`, `received()`): where the SERVER's outbound requests are pointed. The
   * request context that reads the records is created on first use, reused, and disposed after the test, pass or fail. It is
   * the runner's own connection to the sidecar on the run's network, an internal host. Limit: a context created while a test
   * runs lands in its trace, so the trace holds the records read (a leaked secret would be in it).
   */
  echo: EchoTarget;
  /**
   * The mails the server sent to the run's mail sink (the echo sidecar), found by recipient. Read with Node's `fetch`, not a
   * request context, so no mail (they hold reset tokens) reaches a trace. Mails live for the whole run: use an address of the test's own.
   */
  mailbox: Mailbox;
}

/**
 * Signs the super admin in once, in a request context of its own that is disposed before this returns. Never throws: the
 * failure is the outcome. The password is read from the environment, used for that request and kept nowhere else.
 */
async function signInSuperAdmin(factory: APIRequest, baseURL: string | undefined): Promise<SuperAdminOutcome> {
  try {
    const credentials = superAdminCredentials(process.env);
    if (!baseURL) {
      throw new Error("baseURL is not set; the super admin's sign-in needs it");
    }
    const request = await factory.newContext({ baseURL });
    try {
      await signIn(request, credentials.username, credentials.password);
      return { state: await request.storageState() };
    } finally {
      await request.dispose();
    }
  } catch (error) {
    return { error: withCapacityHint(error instanceof Error ? error : new Error(String(error))) };
  }
}

let emailCounter = 0;
/** `e2e-<tag>-w<worker>-<time>-<n>@example.test`; unique per call, so tests never share a user. */
export function uniqueEmail(tag: string, workerIndex: number): string {
  emailCounter += 1;
  return `e2e-${tag}-w${workerIndex}-${Date.now()}-${emailCounter}@${TEST_EMAIL_DOMAIN}`;
}

export const test = base.extend<Fixtures, WorkerFixtures>({
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

  actor: async ({ newUserSession }, use, testInfo) => {
    await use(async (tag) => {
      const session = await newUserSession();
      const request = session.page.request;
      const registered = await registerUser(request, uniqueEmail(tag, testInfo.workerIndex));
      return { session, request, email: registered.email, userId: await currentUserId(request), orgId: registered.orgId };
    });
  },

  echo: async ({ playwright }, use, testInfo) => {
    const baseURL = echoBaseUrl(process.env);
    const path = echoTargetPath(testInfo);
    let reader: APIRequestContext | undefined;
    try {
      await use({
        url: `${baseURL}${path}`,
        path,
        received: async () => {
          reader ??= await playwright.request.newContext({ baseURL });
          const response = await reader.get(ECHO_PATHS.REQUESTS, { params: { prefix: echoReadPrefix(path) } });
          if (!response.ok()) {
            throw new Error(`the echo sidecar answered ${response.status()} to the read of its records`);
          }
          return (await response.json()) as EchoRecord[];
        },
        answer: async (subPath, canned) => {
          const response = await fetch(`${baseURL}${ECHO_PATHS.ANSWERS}`, {
            method: "POST",
            body: JSON.stringify({ prefix: `${path}${subPath}`, status: canned.status, contentType: canned.contentType ?? "application/json", body: canned.body }),
          });
          if (response.status !== 204) {
            throw new Error(`the echo sidecar refused the canned answer of ${subPath} with ${response.status}`);
          }
        },
      });
    } finally {
      await reader?.dispose();
    }
  },

  mailbox: async ({}, use) => {
    await use(mailboxAt(echoBaseUrl(process.env)));
  },

  superAdminState: [
    async ({ playwright }, use, workerInfo) => {
      await use(await signInSuperAdmin(playwright.request, workerInfo.project.use.baseURL));
    },
    { scope: "worker", auto: true },
  ],

  superAdmin: async ({ browser, baseURL, superAdminState }, use) => {
    if ("error" in superAdminState) {
      throw superAdminState.error;
    }
    if (!baseURL) {
      throw new Error("baseURL is not set; the super admin's session needs it for the network guard");
    }
    const context = await browser.newContext({ baseURL, serviceWorkers: "block", storageState: superAdminState.state });
    try {
      await installNetworkGuard(context, baseURL);
      const page = await context.newPage();
      const request = page.request;
      await use({
        session: { context, page },
        request,
        email: superAdminCredentials(process.env).username,
        userId: await currentUserId(request),
      });
    } finally {
      await context.close();
    }
  },
});

export { expect };
