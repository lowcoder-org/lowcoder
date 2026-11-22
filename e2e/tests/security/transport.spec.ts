import { apiRaw } from "../../src/api/client";
import {
  API_OK,
  API_PATHS,
  AUTH_ID_EMAIL,
  AUTH_SOURCE_EMAIL,
  CORS_ALLOW_CREDENTIALS_HEADER,
  CORS_ALLOW_ORIGIN_HEADER,
  COOKIE_HTTP_ONLY,
  COOKIE_SAME_SITE_LAX,
  COOKIE_SECURE,
  FOREIGN_ORIGIN,
  ORIGIN_HEADER,
  SESSION_COOKIE_NAME,
  SET_COOKIE_HEADER,
  TEST_PASSWORD,
  applicationPath,
} from "../../src/constants";
import { expect, test, uniqueEmail } from "../../src/fixtures";
import { SEEDED_BUTTON_TEST_ID } from "../../src/security/actors";
import { expectAnswer } from "../../src/security/assertions";
import { securityTestDetails } from "../../src/security/quarantine";
import { sceneOf } from "../../src/security/scene";

/** Headers the server sets (A12 and A13): what a browser would act on. */

const ALLOWED = { status: 200, code: API_OK } as const;

test.describe("security: CORS and the session cookie", () => {
  test("SEC-A12 a foreign origin is not allowed to read credentialed answers", securityTestDetails("SEC-A12"), async ({ page, apiUser }) => {
    const { a, seeded } = await sceneOf(page, apiUser);
    const routes = [applicationPath(seeded.appId), API_PATHS.CURRENT_USER];
    // Control: the CORS headers depend on the Origin header, so reading them here is reading the server's policy.
    const withoutOrigin = await apiRaw(a.request, "GET", API_PATHS.CURRENT_USER);
    expectAnswer(withoutOrigin, ALLOWED, "before: the request without an Origin works");
    expect(withoutOrigin.headers[CORS_ALLOW_ORIGIN_HEADER], "and carries no allow-origin header").toBeUndefined();

    for (const route of routes) {
      const answer = await apiRaw(a.request, "GET", route, { headers: { [ORIGIN_HEADER]: FOREIGN_ORIGIN } });

      expectAnswer(answer, ALLOWED, `the answer to the foreign origin on ${route}`);
      expect(answer.body, `${route} is A's data (the answer is a real one)`).toMatch(new RegExp(`${a.email.replace(/[.+]/g, "\\$&")}|${SEEDED_BUTTON_TEST_ID}`));
      const allowsOrigin = answer.headers[CORS_ALLOW_ORIGIN_HEADER] === FOREIGN_ORIGIN;
      const allowsCredentials = answer.headers[CORS_ALLOW_CREDENTIALS_HEADER] === "true";
      // Limit: headers only. It proves the server's policy, not a browser exploit (a second origin is forbidden by the guard).
      expect(allowsOrigin && allowsCredentials, `${route}: the foreign origin is allowed together with credentials`).toBe(false);
    }
  });

  test("SEC-A13 the session cookie is HttpOnly and SameSite=Lax, and not Secure on the plain-http stack (pin)", securityTestDetails("SEC-A13"), async ({ newUserSession }, testInfo) => {
    const request = (await newUserSession()).page.request;

    const answer = await apiRaw(request, "POST", API_PATHS.LOGIN, {
      data: { loginId: uniqueEmail("cookie", testInfo.workerIndex), password: TEST_PASSWORD, register: true, source: AUTH_SOURCE_EMAIL, authId: AUTH_ID_EMAIL },
    });

    expectAnswer(answer, ALLOWED, "the registration");
    const cookies = (answer.headers[SET_COOKIE_HEADER] ?? "").split("\n").filter((line) => line.startsWith(`${SESSION_COOKIE_NAME}=`));
    expect(cookies, "exactly one Set-Cookie for the session, by its name").toHaveLength(1);
    // Measured: the server spells the attribute `HTTPOnly`; attribute names are case-insensitive, so they are compared in lower case.
    const attributes = (cookies[0] ?? "").split(";").map((part) => part.trim().toLowerCase());
    expect(attributes, "HttpOnly").toContain(COOKIE_HTTP_ONLY.toLowerCase());
    expect(attributes, "SameSite=Lax").toContain(COOKIE_SAME_SITE_LAX.toLowerCase());
    // Plain http stack: a Secure cookie would never be sent back by the browser. The pin documents what the deployment sets.
    expect(attributes, "no Secure on the plain-http stack").not.toContain(COOKIE_SECURE.toLowerCase());
  });
});
