import { expect, test } from "@playwright/test";
import { encodeJwtPart, forgeApiKeyToken, forgeUnsignedToken, signJwtParts, tokenIsSignedWith, withRandomSignature } from "../../src/security/tokens";

/** Stack-free unit tests of src/security/tokens.ts (RFC 7515 appendix A.1 is the oracle of the signer). */

/** RFC 7515 A.1: the HS256 example, with the header and payload exactly as encoded there (they contain CRLF). */
const RFC_HEADER = "eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9";
const RFC_PAYLOAD =
  "eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ";
const RFC_KEY = Buffer.from("AyM1SysPpbyDfgZld3umj1qzKObwVMkoqQ-EstJQLr_T-1qS0gZH75aKtMN3Yj0iPS4hcgUuTwjAzZr1Z9CAow", "base64url");
const RFC_SIGNATURE = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";

const SECRET = "unit-test-secret";
const OTHER_SECRET = "another-unit-test-secret";
const USER_ID = "user-id-1";
const USER_NAME = "user@example.test";

function decodedPart(token: string, index: number): Record<string, unknown> {
  return JSON.parse(Buffer.from(token.split(".")[index] ?? "", "base64url").toString("utf8")) as Record<string, unknown>;
}

test.describe("security tokens", () => {
  test("signJwtParts reproduces the HS256 signature of RFC 7515 appendix A.1", () => {
    expect(signJwtParts(RFC_HEADER, RFC_PAYLOAD, RFC_KEY)).toBe(RFC_SIGNATURE);
  });

  test("signJwtParts depends on the key", () => {
    expect(signJwtParts(RFC_HEADER, RFC_PAYLOAD, SECRET)).not.toBe(signJwtParts(RFC_HEADER, RFC_PAYLOAD, OTHER_SECRET));
  });

  test("encodeJwtPart is the base64url of the JSON text, without padding", () => {
    expect(encodeJwtPart({ alg: "HS256" })).toBe(Buffer.from('{"alg":"HS256"}').toString("base64url"));
    expect(encodeJwtPart({ a: "?>" })).not.toMatch(/[+/=]/);
  });

  test("forgeApiKeyToken builds an HS256 token with the claims of an API key of the user", () => {
    const token = forgeApiKeyToken(SECRET, USER_ID, USER_NAME);

    expect(token.split(".")).toHaveLength(3);
    expect(decodedPart(token, 0)).toEqual({ alg: "HS256" });
    expect(decodedPart(token, 1)).toMatchObject({ sub: USER_ID, userId: USER_ID, createdBy: USER_NAME });
    expect(typeof decodedPart(token, 1).jti, "a random jti, as the server adds one").toBe("string");
    expect(typeof decodedPart(token, 1).iat, "an issue time").toBe("number");
  });

  test("two forgeries for the same user differ (random jti)", () => {
    expect(forgeApiKeyToken(SECRET, USER_ID, USER_NAME)).not.toBe(forgeApiKeyToken(SECRET, USER_ID, USER_NAME));
  });

  test("tokenIsSignedWith tells the signing secret and refuses malformed tokens", () => {
    const token = forgeApiKeyToken(SECRET, USER_ID, USER_NAME);

    expect(tokenIsSignedWith(token, SECRET), "its own secret").toBe(true);
    expect(tokenIsSignedWith(token, OTHER_SECRET), "another secret").toBe(false);
    expect(tokenIsSignedWith(`${token}x`, SECRET), "a tampered signature").toBe(false);
    expect(tokenIsSignedWith("only.two", SECRET), "two parts").toBe(false);
    expect(tokenIsSignedWith("", SECRET), "empty").toBe(false);
  });

  test("forgeUnsignedToken has alg none, the claims of an API key and an empty signature", () => {
    const token = forgeUnsignedToken(USER_ID, USER_NAME);

    expect(token.split("."), "three parts, the last empty").toHaveLength(3);
    expect(token.endsWith("."), "empty signature").toBe(true);
    expect(decodedPart(token, 0)).toEqual({ alg: "none" });
    expect(decodedPart(token, 1)).toMatchObject({ sub: USER_ID, userId: USER_ID, createdBy: USER_NAME });
    expect(tokenIsSignedWith(token, SECRET), "it is not signed").toBe(false);
  });

  test("withRandomSignature keeps header and payload and replaces the signature, differently each time", () => {
    const token = forgeApiKeyToken(SECRET, USER_ID, USER_NAME);

    const first = withRandomSignature(token);
    const second = withRandomSignature(token);

    expect(first.split(".").slice(0, 2), "header and payload kept").toEqual(token.split(".").slice(0, 2));
    expect(first.split(".")[2], "signature replaced").not.toBe(token.split(".")[2]);
    expect(first, "random each time").not.toBe(second);
    expect(tokenIsSignedWith(first, SECRET), "no longer a valid signature").toBe(false);
  });
});
