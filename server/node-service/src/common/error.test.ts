import { badRequest, ServiceError } from "./error";

const DEFAULT_CODE = 500;
const BAD_REQUEST_CODE = 400;
const CUSTOM_CODE = 418;

describe("ServiceError", () => {
  test("defaults to code 500 and keeps the message", () => {
    const err = new ServiceError("m");
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe(DEFAULT_CODE);
    expect(err.message).toBe("m");
  });

  test("takes an explicit code", () => {
    expect(new ServiceError("teapot", CUSTOM_CODE).code).toBe(CUSTOM_CODE);
  });
});

describe("badRequest", () => {
  test("is a ServiceError and an Error with code 400 and the given message", () => {
    const err = badRequest("m");
    expect(err).toBeInstanceOf(ServiceError);
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe(BAD_REQUEST_CODE);
    expect(err.message).toBe("m");
  });
});
