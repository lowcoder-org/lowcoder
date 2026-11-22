import { createHmac, randomBytes } from "node:crypto";

/** Algorithm of an API-key token (api/authentication/util/JWTUtils.java signs with HS256). */
const JWT_ALGORITHM = "HS256";
/** Bytes of the random `jti` of a forged token, as the server adds one to every token it signs. */
const JTI_BYTES = 12;
/** A token is `header.payload.signature`. */
const JWT_PART_COUNT = 3;

/** One part of a token: the JSON text of the object, base64url without padding. */
export function encodeJwtPart(part: object): string {
  return Buffer.from(JSON.stringify(part)).toString("base64url");
}

/**
 * The HS256 signature (base64url) of `encodedHeader.encodedPayload` under `key`. The key is used as its bytes: the server
 * base64-encodes the configured secret and hands the encoded text to jjwt, which decodes it again
 * (`JWTUtils.setup`, `createToken`), so the HMAC key is the secret's own bytes.
 */
export function signJwtParts(encodedHeader: string, encodedPayload: string, key: string | Buffer): string {
  return createHmac("sha256", key).update(`${encodedHeader}.${encodedPayload}`).digest("base64url");
}

/**
 * A token that carries the claims of an API key of `userId` (`sub`, `userId`, `createdBy`, `iat`, a random `jti`), signed
 * with `secret`. It is NOT one of the user's stored keys: the server accepts a token only when its signature is valid AND
 * a stored key of the user holds it, so this is a forgery whatever the secret (SEC-A01).
 */
export function forgeApiKeyToken(secret: string, userId: string, createdBy: string): string {
  const header = encodeJwtPart({ alg: JWT_ALGORITHM });
  const payload = encodeJwtPart({
    sub: userId,
    userId,
    createdBy,
    iat: Math.floor(Date.now() / 1000),
    jti: randomBytes(JTI_BYTES).toString("hex"),
  });
  return `${header}.${payload}.${signJwtParts(header, payload, secret)}`;
}

/**
 * True when `token` is a three-part token whose signature is the HS256 signature of its own header and payload under
 * `secret`. Tells whether the server of a test run signs with a given secret (a token it issued must verify).
 */
export function tokenIsSignedWith(token: string, secret: string): boolean {
  const parts = token.split(".");
  if (parts.length !== JWT_PART_COUNT) {
    return false;
  }
  const [header, payload, signature] = parts as [string, string, string];
  return signJwtParts(header, payload, secret) === signature;
}

/** Header algorithm of an unsigned token (`alg: none`, SEC-A01b). */
const UNSIGNED_ALGORITHM = "none";
/** Bytes of the random signature that `withRandomSignature` puts on a token. */
const RANDOM_SIGNATURE_BYTES = 32;

/**
 * A token with the claims of `forgeApiKeyToken` and the header `alg: none`, an empty signature part: what an attacker sends
 * hoping the server skips the signature check (SEC-A01b).
 */
export function forgeUnsignedToken(userId: string, createdBy: string): string {
  const header = encodeJwtPart({ alg: UNSIGNED_ALGORITHM });
  const payload = encodeJwtPart({ sub: userId, userId, createdBy, iat: Math.floor(Date.now() / 1000), jti: randomBytes(JTI_BYTES).toString("hex") });
  return `${header}.${payload}.`;
}

/** The same token with its signature part replaced by random bytes (valid header and payload, wrong signature). */
export function withRandomSignature(token: string): string {
  const [header, payload] = token.split(".") as [string, string];
  return `${header}.${payload}.${randomBytes(RANDOM_SIGNATURE_BYTES).toString("base64url")}`;
}
