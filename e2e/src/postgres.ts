import { POSTGRES } from "./constants";
import type { PostgresConnection } from "./api/client";

/** Connection to the PostgreSQL sidecar, as the application container reaches it (by container name). */
export function postgresConnection(): PostgresConnection {
  const host = process.env[POSTGRES.HOST_ENV];
  if (!host) {
    throw new Error(`${POSTGRES.HOST_ENV} is not set. Run the suite through e2e/scripts/run-in-docker.sh.`);
  }
  return {
    host,
    port: POSTGRES.PORT,
    database: POSTGRES.DATABASE,
    username: POSTGRES.USERNAME,
    password: POSTGRES.PASSWORD,
  };
}
