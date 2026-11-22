import { registerRaw, signInRaw } from "../../src/api/client";
import { API_ERRORS, API_OK, SESSION_COOKIE_NAME, SET_COOKIE_HEADER, TEST_PASSWORD } from "../../src/constants";
import { expect, test, uniqueEmail } from "../../src/fixtures";

/** Stack tests of the raw account helpers of the lifecycle specs (`registerRaw`, `signInRaw`). */
test.describe("lifecycle account helpers", () => {
  test("registerRaw answers a sign-up, and the second one with the same address is refused without a throw", async ({ newUserSession }, testInfo) => {
    const request = (await newUserSession()).page.request;
    const email = uniqueEmail("rawreg", testInfo.workerIndex);

    const first = await registerRaw(request, email, TEST_PASSWORD);
    const second = await registerRaw((await newUserSession()).page.request, email, TEST_PASSWORD);

    expect({ status: first.status, code: first.code }, "a fresh address").toEqual({ status: 200, code: API_OK });
    expect({ status: second.status, code: second.code }, "the same address again").toEqual(API_ERRORS.USER_LOGIN_ID_EXIST);
  });

  test("signInRaw answers a sign-in with its cookie and a wrong password without a throw and without a cookie", async ({ actor, newUserSession }) => {
    const user = await actor("rawsign");
    const request = (await newUserSession()).page.request;

    const ok = await signInRaw(request, user.email);
    const wrong = await signInRaw((await newUserSession()).page.request, user.email, `${TEST_PASSWORD}-wrong`);

    expect({ status: ok.status, code: ok.code }, "the right password").toEqual({ status: 200, code: API_OK });
    expect((ok.headers[SET_COOKIE_HEADER] ?? "").includes(SESSION_COOKIE_NAME), "sets the session cookie").toBe(true);
    expect(wrong.code, "a wrong password is not an API_OK answer").not.toBe(API_OK);
    expect((wrong.headers[SET_COOKIE_HEADER] ?? "").includes(SESSION_COOKIE_NAME), "and sets no session cookie").toBe(false);
  });
});
