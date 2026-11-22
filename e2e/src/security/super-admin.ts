import { SUPER_ADMIN_ENV } from "../constants";
import type { Actor } from "./actors";

/** The script that sets the super-admin variables; named in the error so a direct `playwright test` run says what to do. */
const RUNNER_SCRIPT = "e2e/scripts/run-in-docker.sh";

/** The super-admin variables are not (both) set: the suite was not started through the run script. */
export class SuperAdminEnvError extends Error {
  constructor() {
    super(
      `the super-admin actor needs ${SUPER_ADMIN_ENV.USERNAME} and ${SUPER_ADMIN_ENV.PASSWORD}; ` +
        `run the suite through ${RUNNER_SCRIPT}, which sets both for each run`,
    );
    this.name = "SuperAdminEnvError";
  }
}

export interface SuperAdminCredentials {
  username: string;
  password: string;
}

/**
 * Reads the super admin's credentials from the environment. Throws `SuperAdminEnvError` when either variable is missing
 * or empty; the message names the two variables and the script, never a value. Creates no request context (the lifecycle
 * rule of the security helpers: contexts belong to fixtures). Limit: it does not check that the pair is accepted by the stack.
 */
export function superAdminCredentials(env: Readonly<Record<string, string | undefined>>): SuperAdminCredentials {
  const username = env[SUPER_ADMIN_ENV.USERNAME];
  const password = env[SUPER_ADMIN_ENV.PASSWORD];
  if (!username || !password) {
    throw new SuperAdminEnvError();
  }
  return { username, password };
}

/**
 * The instance super admin as a test actor: a SUPER_ADMIN member of every workspace (`AddSuperAdminUserImpl`,
 * `OrganizationServiceImpl`), so it has no workspace of its own to name and no `orgId`. One account shared by all
 * workers: a test never switches its workspace and never changes its password).
 */
export type SuperAdmin = Omit<Actor, "orgId">;

/**
 * Appended to a failed or timed-out super-admin sign-in. Measured on the 3.0.0 image (PostgreSQL and Mongo stack of the run
 * script): the super admin is a member of EVERY workspace, and once the stack holds more than about 420 workspaces (400 answered
 * in about 100 ms, 450 timed out after 120 s) every request of that user hangs until the gateway answers 504, whatever the age
 * of its session. Each test creates one to three workspaces, so a long run exhausts it. Not covered by the suite; it is
 * reported as a candidate defect of the server.
 */
export const SUPER_ADMIN_CAPACITY_HINT =
  "the instance super admin hangs once the stack holds more than about 420 workspaces (measured); run the super-admin scenarios on a fresh stack, with fewer tests per run";

/** The error of a failed super-admin sign-in with the capacity hint added; a `SuperAdminEnvError` is returned unchanged. */
export function withCapacityHint(error: Error): Error {
  if (error instanceof SuperAdminEnvError) {
    return error;
  }
  const hinted = new Error(`${error.message}; ${SUPER_ADMIN_CAPACITY_HINT}`);
  hinted.name = error.name;
  return hinted;
}
