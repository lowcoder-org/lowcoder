import { LIBSQL, RUN_FLAGS } from "../constants";

/** Where a Turso data source connects: the libSQL sidecar of the run, as the app container reaches it (by the sidecar's network alias, over plain HTTP so the plugin's `libsql://` rewrite does not apply). */
export interface LibsqlConnection {
  /** `http://<alias>:<port>`, no trailing slash: the plugin appends `/v2/pipeline`. */
  url: string;
  /** A JWT the sidecar accepts for reads and writes. */
  token: string;
}

/** The sidecar's host variable is not set: the run did not start the libSQL sidecar. */
export class LibsqlSidecarMissingError extends Error {
  constructor() {
    super(
      `${LIBSQL.HOST_ENV} is not set: the libSQL sidecar was not started. Run the suite through e2e/scripts/run-in-docker.sh with ${RUN_FLAGS.INCLUDE_NODE_SERVICE_SIDECARS}=1.`,
    );
    this.name = "LibsqlSidecarMissingError";
  }
}

/**
 * The connection to the run's libSQL sidecar from the environment. Throws `LibsqlSidecarMissingError` when the run script did not set the
 * host variable (it does so only with `E2E_INCLUDE_NODE_SERVICE_SIDECARS=1`), so a test that was selected without its sidecar fails loudly
 * instead of passing vacuously or connecting to a name that happens to resolve elsewhere. Reads only `env`.
 */
export function libsqlConnection(env: NodeJS.ProcessEnv = process.env): LibsqlConnection {
  const host = env[LIBSQL.HOST_ENV];
  if (!host) throw new LibsqlSidecarMissingError();
  return { url: `http://${host}:${LIBSQL.PORT}`, token: LIBSQL.READ_WRITE_TOKEN };
}

/** The route of the Hrana-over-HTTP pipeline, the one the Turso plugin posts to. */
export const LIBSQL_PIPELINE_PATH = "/v2/pipeline";

/** How long a direct call to the sidecar may take before it is abandoned: a local server answers in milliseconds. */
const DIRECT_CALL_TIMEOUT_MS = 10_000;

/** The answer of a direct pipeline call: the status line and the body parsed as JSON (or the text when it is not JSON). */
export interface LibsqlDirectAnswer {
  status: number;
  statusText: string;
  body: unknown;
}

/**
 * One `execute` of `sql` (then `close`) posted to the sidecar from the TEST process, with `token` as the bearer token or with no
 * `Authorization` header when `token` is `undefined`. This is what the plugin sends, minus the plugin: it is the control that shows what the
 * server itself answers (a real error with its code, a 401 body), which the plugin's own answer to the app then hides or changes. The
 * runner reaches the sidecar by the same alias the app container does.
 */
export async function libsqlDirect(connection: Pick<LibsqlConnection, "url">, sql: string, token?: string): Promise<LibsqlDirectAnswer> {
  const response = await fetch(`${connection.url}${LIBSQL_PIPELINE_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token === undefined ? {} : { Authorization: `Bearer ${token}` }) },
    body: JSON.stringify({ requests: [{ type: "execute", stmt: { sql } }, { type: "close" }] }),
    signal: AbortSignal.timeout(DIRECT_CALL_TIMEOUT_MS),
  });
  const text = await response.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    // not JSON: the text itself is the body
  }
  return { status: response.status, statusText: response.statusText, body };
}
