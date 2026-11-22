import { randomBytes } from "node:crypto";
import { ECHO_ENV, ECHO_TARGET_PREFIX } from "../constants";

/** One request the echo sidecar received (scripts/echo-server.js): `path` includes the query string, `body` is UTF-8 text. */
export interface EchoRecord {
  method: string;
  path: string;
  headers: Record<string, string | string[] | undefined>;
  body: string;
}

/** The parts of Playwright's `TestInfo` the target path is made of (a structural type, so unit specs need no test). */
export interface EchoTargetInfo {
  workerIndex: number;
  repeatEachIndex: number;
  retry: number;
}

/** Bytes of randomness in a target id: the path of two tests never collides, a retry or a repeat never reads old records. */
const TARGET_NONCE_BYTES = 6;

/**
 * The path of a test's own echo target: `/t/<worker>-<repeat>-<retry>-<random>`, no trailing slash. The server of the app
 * appends the request path to it (`<registry url>/<package>`). Stack-free: the sidecar's records live for the whole run, so
 * the id must be new for every test, retry and repeat; the random part guarantees that, the numbers are for a human reading
 * a record.
 */
export function echoTargetPath(info: EchoTargetInfo): string {
  const nonce = randomBytes(TARGET_NONCE_BYTES).toString("hex");
  return `${ECHO_TARGET_PREFIX}${info.workerIndex}-${info.repeatEachIndex}-${info.retry}-${nonce}`;
}

/**
 * The prefix to read a target's records with: the target path plus a slash, so the id `1-0-0-ab` is not a prefix of another
 * target's `1-0-0-abcd`. A request to exactly the target path (no trailing part) is not matched; the app always sends a path below it.
 */
export function echoReadPrefix(targetPath: string): string {
  return `${targetPath}/`;
}

/** The base URL of the echo sidecar from the environment, without a trailing slash; throws when the run script did not set it. */
export function echoBaseUrl(env: NodeJS.ProcessEnv): string {
  const value = env[ECHO_ENV];
  if (!value) {
    throw new Error(`${ECHO_ENV} is not set. Run the suite through e2e/scripts/run-in-docker.sh (it starts the echo sidecar).`);
  }
  return value.replace(/\/+$/, "");
}

function percentDecoded(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

/**
 * Whether any header value, the path (as sent and percent-decoded) or the body of a record contains `needle`. Returns a boolean
 * so that an assertion on it never prints the needle (a session cookie value must not reach a failure message). Limit: it
 * finds the needle as text; a value that the sender encoded another way (base64, split) is not found.
 */
export function recordsContain(records: readonly EchoRecord[], needle: string): boolean {
  return records.some((record) => {
    const headers = Object.values(record.headers).flatMap((value) => (Array.isArray(value) ? value : [value ?? ""]));
    return [record.path, percentDecoded(record.path), record.body, ...headers].some((text) => text.includes(needle));
  });
}

/** The echo target of one test (the `echo` fixture of src/fixtures.ts). */
export interface EchoTarget {
  /** `<E2E_ECHO_URL>/t/<id>`: what a test hands to the app as a registry URL or a `serverURL`. */
  url: string;
  /** The path part of `url`. */
  path: string;
  /** The records that arrived below this target's path, oldest first. Reads the sidecar; opens its request context on first use. */
  received: () => Promise<EchoRecord[]>;
  /**
   * Makes the sidecar answer requests below `<path><subPath>` with a canned answer (status, content type, body) instead of `{}`; the
   * requests are still recorded. The latest answer of a sub-path replaces the earlier one. Reads with Node's `fetch`, not a request
   * context (a canned answer may hold a token).
   */
  answer: (subPath: string, canned: CannedAnswer) => Promise<void>;
}

/** What the echo sidecar answers to a request below a target's sub-path (`POST /__e2e/answers`). */
export interface CannedAnswer {
  status: number;
  body: string;
  contentType?: string;
}
