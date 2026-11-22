import { expect } from "@playwright/test";
import type { RawAnswer } from "../api/client";
import type { ApiError } from "../constants";

/**
 * Asserts the HTTP status AND the `code` of a raw answer against an `API_ERRORS` entry (or `{ status: 200, code: API_OK }`
 * for an allowed call). The message names what was called, so a failure says which denial broke. Limit: it compares status
 * and code only; a test that must also show that nothing leaked checks `answer.body` itself.
 */
export function expectAnswer(answer: RawAnswer, expected: ApiError, message: string): void {
  expect({ status: answer.status, code: answer.code }, message).toEqual(expected);
}

/**
 * Asserts that the answer is one of the listed denials (status and code each). For the rows whose desired answer is "A or B"
 * (SEC-C09, C11) whose desired answer is not measurable on any available image: the test asserts "denied, as one of
 * these", never a success. Limit: it does not tell which of the listed answers a fixed server gives.
 */
export function expectDeniedAs(answer: RawAnswer, allowed: readonly ApiError[], message: string): void {
  expect(allowed, message).toContainEqual({ status: answer.status, code: answer.code });
}
