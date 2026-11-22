import { expect, test } from "@playwright/test";
import type { RawAnswer } from "../../src/api/client";
import { API_ERRORS, API_OK } from "../../src/constants";
import { expectAnswer, expectDeniedAs } from "../../src/security/assertions";

/** Stack-free unit tests of src/security/assertions.ts: it must pass on a match and FAIL on a wrong status or code. */

function answer(status: number, code: number | undefined): RawAnswer {
  return { status, code, body: "", json: undefined, headers: {} };
}

test.describe("expectAnswer", () => {
  test("passes when status and code equal the expected entry", () => {
    expectAnswer(answer(403, 5308), API_ERRORS.NO_PERMISSION_TO_REQUEST_APP, "a denial");
    expectAnswer(answer(200, API_OK), { status: 200, code: API_OK }, "an allowed call");
    expectAnswer(answer(401, undefined), API_ERRORS.UNAUTHENTICATED, "an answer without a body");
  });

  test("fails on a wrong code with the same status", () => {
    expect(() => expectAnswer(answer(403, 5304), API_ERRORS.NO_PERMISSION_TO_REQUEST_APP, "wrong code")).toThrow(/wrong code/);
  });

  test("fails on a wrong status with the same code", () => {
    expect(() => expectAnswer(answer(500, 5308), API_ERRORS.NO_PERMISSION_TO_REQUEST_APP, "wrong status")).toThrow(/wrong status/);
  });

  test("fails when a body-less answer was expected but a code came back", () => {
    expect(() => expectAnswer(answer(401, 5001), API_ERRORS.UNAUTHENTICATED, "code where none is expected")).toThrow();
  });
});

test.describe("expectDeniedAs", () => {
  const FOLDER_DENIALS = [API_ERRORS.FOLDER_OPERATE_NO_PERMISSION, API_ERRORS.NOT_AUTHORIZED];

  test("passes on either listed denial", () => {
    expectDeniedAs(answer(500, 6301), FOLDER_DENIALS, "folder denial");
    expectDeniedAs(answer(401, 5001), FOLDER_DENIALS, "plain denial");
  });

  test("fails on a success and on an unlisted denial", () => {
    expect(() => expectDeniedAs(answer(200, API_OK), FOLDER_DENIALS, "a success")).toThrow(/a success/);
    expect(() => expectDeniedAs(answer(403, 5308), FOLDER_DENIALS, "other denial")).toThrow(/other denial/);
  });
});
