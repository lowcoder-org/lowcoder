import { COUCHDB, RUN_FLAGS } from "../constants";

/** Where a CouchDB data source connects: the CouchDB sidecar of the run, as the app container reaches it (by the sidecar's network alias, over plain HTTP). */
export interface CouchdbConnection {
  /** `http://<alias>:<port>`, no trailing slash: the plugin appends the operation's path. */
  serverURL: string;
  /** The server admin of the sidecar (throw-away). */
  username: string;
  password: string;
}

/** The sidecar's host variable is not set: the run did not start the CouchDB sidecar. */
export class CouchdbSidecarMissingError extends Error {
  constructor() {
    super(
      `${COUCHDB.HOST_ENV} is not set: the CouchDB sidecar was not started. Run the suite through e2e/scripts/run-in-docker.sh with ${RUN_FLAGS.INCLUDE_NODE_SERVICE_SIDECARS}=1.`,
    );
    this.name = "CouchdbSidecarMissingError";
  }
}

/**
 * The connection to the run's CouchDB sidecar from the environment. Throws `CouchdbSidecarMissingError` when the run script did not set the
 * host variable (it does so only with `E2E_INCLUDE_NODE_SERVICE_SIDECARS=1`), so a test that was selected without its sidecar fails loudly
 * instead of passing vacuously or connecting to a name that happens to resolve elsewhere. Reads only `env`.
 */
export function couchdbConnection(env: NodeJS.ProcessEnv = process.env): CouchdbConnection {
  const host = env[COUCHDB.HOST_ENV];
  if (!host) throw new CouchdbSidecarMissingError();
  return { serverURL: `http://${host}:${COUCHDB.PORT}`, username: COUCHDB.USERNAME, password: COUCHDB.PASSWORD };
}

/** How long a direct call to the sidecar may take before it is abandoned: a local server answers in milliseconds. */
const DIRECT_CALL_TIMEOUT_MS = 10_000;

/** The answer of a direct call: the status line and the body parsed as JSON (or the text when it is not JSON). */
export interface CouchdbDirectAnswer {
  status: number;
  statusText: string;
  body: unknown;
}

/** What a direct call sends besides the method and the path. */
export interface CouchdbDirectOptions {
  /** The JSON body, sent as `application/json`. */
  json?: unknown;
  /** Further request headers (e.g. `If-Match`), sent as given. */
  headers?: Record<string, string>;
  /** The credentials of the Basic `Authorization` header; none are sent when it is `undefined`. */
  credentials?: { username: string; password: string };
}

/**
 * One HTTP call to the sidecar from the TEST process (`path` starts with `/`, e.g. `/_all_dbs` or `/<db>/<doc>?rev=...`). This is what the
 * plugin sends, minus the plugin: it is the control that shows what the server itself answers, next to what the plugin makes of it for the
 * app, and the way a test sets up and removes its own databases. The runner reaches the sidecar by the same alias the app container does.
 */
export async function couchdbDirect(
  connection: Pick<CouchdbConnection, "serverURL">,
  method: string,
  path: string,
  options: CouchdbDirectOptions = {},
): Promise<CouchdbDirectAnswer> {
  const headers: Record<string, string> = { ...options.headers };
  if (options.json !== undefined) headers["Content-Type"] = "application/json";
  if (options.credentials) {
    headers.Authorization = `Basic ${Buffer.from(`${options.credentials.username}:${options.credentials.password}`).toString("base64")}`;
  }
  const response = await fetch(`${connection.serverURL}${path}`, {
    method,
    headers,
    body: options.json === undefined ? undefined : JSON.stringify(options.json),
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

/** `couchdbDirect` with the sidecar's admin, for what a test does to its own databases (creating one, removing it afterwards). */
export async function couchdbAdmin(
  connection: CouchdbConnection,
  method: string,
  path: string,
  options: Pick<CouchdbDirectOptions, "json" | "headers"> = {},
): Promise<CouchdbDirectAnswer> {
  return couchdbDirect(connection, method, path, { ...options, credentials: { username: connection.username, password: connection.password } });
}
