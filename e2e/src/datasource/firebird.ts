import { FIREBIRD, RUN_FLAGS } from "../constants";

/** Where a Firebird data source connects: the sidecar of the run, as the app container reaches it (by the sidecar's network alias). */
export interface FirebirdConnection {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

/** The sidecar's host variable is not set: the run did not start the Firebird sidecar. */
export class FirebirdSidecarMissingError extends Error {
  constructor() {
    super(
      `${FIREBIRD.HOST_ENV} is not set: the Firebird sidecar was not started. Run the suite through e2e/scripts/run-in-docker.sh with ${RUN_FLAGS.INCLUDE_NODE_SERVICE_SIDECARS}=1.`,
    );
    this.name = "FirebirdSidecarMissingError";
  }
}

/**
 * The connection to the run's Firebird sidecar from the environment. Throws `FirebirdSidecarMissingError` when the run script did not
 * set the host variable (it does so only with `E2E_INCLUDE_NODE_SERVICE_SIDECARS=1`), so a test that was selected without its sidecar
 * fails loudly instead of passing vacuously or connecting to a name that happens to resolve elsewhere. Reads only `env`.
 */
export function firebirdConnection(env: NodeJS.ProcessEnv = process.env): FirebirdConnection {
  const host = env[FIREBIRD.HOST_ENV];
  if (!host) throw new FirebirdSidecarMissingError();
  return { host, port: FIREBIRD.PORT, database: FIREBIRD.DATABASE, username: FIREBIRD.USERNAME, password: FIREBIRD.PASSWORD };
}

/** A row of `FB_ITEMS` as the plugin answers it (lower-cased keys, `NUMERIC(9,2)` as a number, a NULL as `null`). */
export interface FirebirdItem {
  id: number;
  name: string;
  price: number;
  note: string | null;
}

/** The rows `fixtures/firebird/init.sql` inserts into the read-only table `FB_ITEMS`, in `ID` order. Must equal that file. */
export const FIREBIRD_ITEMS: readonly FirebirdItem[] = [
  { id: 1, name: "alpha", price: 1.5, note: "first" },
  { id: 2, name: "beta", price: 2.25, note: null },
  { id: 3, name: "gamma", price: 10, note: "third" },
];
