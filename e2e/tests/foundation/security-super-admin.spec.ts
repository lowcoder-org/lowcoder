import { expect, test } from "@playwright/test";
import { SUPER_ADMIN_ENV } from "../../src/constants";
import { SUPER_ADMIN_CAPACITY_HINT, SuperAdminEnvError, superAdminCredentials, withCapacityHint } from "../../src/security/super-admin";

/**
 * Stack-free unit tests of `superAdminCredentials` (src/security/super-admin.ts). The values below are made up for the
 * test; the real password never appears in a test.
 */
const MADE_UP_USERNAME = "someone@example.test";
const MADE_UP_PASSWORD = "made-up-value-for-the-unit-test";

test.describe("superAdminCredentials", () => {
  test("returns both values from the two named variables", () => {
    const credentials = superAdminCredentials({ [SUPER_ADMIN_ENV.USERNAME]: MADE_UP_USERNAME, [SUPER_ADMIN_ENV.PASSWORD]: MADE_UP_PASSWORD });

    expect(credentials).toEqual({ username: MADE_UP_USERNAME, password: MADE_UP_PASSWORD });
  });

  test("the variable names are the ones the run script sets", () => {
    expect(SUPER_ADMIN_ENV).toEqual({ USERNAME: "E2E_SUPERUSER_USERNAME", PASSWORD: "E2E_SUPERUSER_PASSWORD" });
  });

  for (const [label, env] of [
    ["nothing is set", {}],
    ["only the username is set", { [SUPER_ADMIN_ENV.USERNAME]: MADE_UP_USERNAME }],
    ["only the password is set", { [SUPER_ADMIN_ENV.PASSWORD]: MADE_UP_PASSWORD }],
    ["both are empty", { [SUPER_ADMIN_ENV.USERNAME]: "", [SUPER_ADMIN_ENV.PASSWORD]: "" }],
  ] as const) {
    test(`throws a SuperAdminEnvError naming both variables and the script when ${label}`, () => {
      let thrown: unknown;
      try {
        superAdminCredentials(env);
      } catch (error) {
        thrown = error;
      }

      expect(thrown, "an error").toBeInstanceOf(SuperAdminEnvError);
      const message = (thrown as Error).message;
      expect(message).toContain("E2E_SUPERUSER_USERNAME");
      expect(message).toContain("E2E_SUPERUSER_PASSWORD");
      expect(message).toContain("e2e/scripts/run-in-docker.sh");
      expect(message, "the message never carries a value").not.toContain(MADE_UP_PASSWORD);
    });
  }
});

test.describe("withCapacityHint", () => {
  test("adds the capacity hint to a sign-in failure and keeps the name and the message", () => {
    const failure = new Error("sign in x@example.test failed: HTTP 504");
    failure.name = "LowcoderApiError";

    const hinted = withCapacityHint(failure);

    expect(hinted.name).toBe("LowcoderApiError");
    expect(hinted.message).toContain("sign in x@example.test failed: HTTP 504");
    expect(hinted.message).toContain(SUPER_ADMIN_CAPACITY_HINT);
  });

  test("returns a SuperAdminEnvError unchanged", () => {
    const missing = new SuperAdminEnvError();

    expect(withCapacityHint(missing)).toBe(missing);
  });
});
