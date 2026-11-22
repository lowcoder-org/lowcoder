import { RUN_FLAGS, STACK_PROFILE_ENV, STACK_PROFILES, TAGS, type StackProfile } from "./constants";

/** Which opt-in groups of tests a run includes beyond the default selection, and which stack the run is made for. */
export interface RunFlags {
  /** Tests tagged `@quarantine` (they expose known defects and fail on purpose-built baselines). */
  includeQuarantine: boolean;
  /** Tests tagged `@insert-all` (S1, the insert-every-component smoke test: 112 tests, nightly). */
  includeInsertAll: boolean;
  /** Tests tagged `@superadmin` (SEC-R16a to SEC-R16d: they break a stack that holds more than ~420 workspaces, D-47). */
  includeSuperAdmin: boolean;
  /**
   * Enterprise profile only: run SEC-E05 (`@enterprise-takeover`) and NOTHING else of the stack, because it replaces the
   * super admin's password. Ignored on the default profile (the test is `@enterprise` as well and never runs there).
   */
  includeEnterpriseTakeover: boolean;
  /**
   * The stack of the run: `default` (SAAS workspace mode), `enterprise` (ENTERPRISE workspace mode, one shared workspace) or
   * `signup-disabled` (the e-mail sign-up switched off by the deployment). The enterprise profile runs the `@enterprise` tests
   * and nothing else, the signup-disabled profile the `@signup-disabled` tests and nothing else; the default profile never
   * runs either.
   */
  stackProfile: StackProfile;
}

/** The profile variable has a value that names no stack; the message lists the valid ones. */
export class UnknownStackProfileError extends Error {
  constructor(value: string) {
    super(`${STACK_PROFILE_ENV}="${value}" names no stack; use ${Object.values(STACK_PROFILES).join(" or ")}`);
    this.name = "UnknownStackProfileError";
  }
}

/** The stack profile of the environment: missing or empty is `default`, a value that is no profile throws. */
export function stackProfileFromEnv(env: Record<string, string | undefined>): StackProfile {
  const value = env[STACK_PROFILE_ENV];
  if (!value) return STACK_PROFILES.DEFAULT;
  const profile = Object.values(STACK_PROFILES).find((candidate) => candidate === value);
  if (profile === undefined) throw new UnknownStackProfileError(value);
  return profile;
}

/** Reads the run flags from the environment: a flag is on when its variable is set and not empty (`=1`). */
export function runFlagsFromEnv(env: Record<string, string | undefined>): RunFlags {
  return {
    includeQuarantine: !!env[RUN_FLAGS.INCLUDE_QUARANTINE],
    includeInsertAll: !!env[RUN_FLAGS.INCLUDE_INSERT_ALL],
    includeSuperAdmin: !!env[RUN_FLAGS.INCLUDE_SUPERADMIN],
    includeEnterpriseTakeover: !!env[RUN_FLAGS.INCLUDE_ENTERPRISE_TAKEOVER],
    stackProfile: stackProfileFromEnv(env),
  };
}

/**
 * The tags a run leaves out. Default profile: each opt-in tag unless its own flag is set (the three flags are
 * independent), and always `@enterprise`, `@enterprise-takeover` and `@signup-disabled`. Signup-disabled profile: `@quarantine` unless its flag is set. Enterprise profile: `@quarantine` unless its flag is set,
 * and `@enterprise-takeover` unless ITS flag is set; the other two flags do not apply there (`@insert-all` tests are outside
 * the `@enterprise` selection anyway, and the super admin of that stack is a member of ONE workspace, so the D-47 capacity
 * limit behind `@superadmin` does not arise: SEC-E01 to E06a use it and carry the tag for the guard of
 * tests/foundation/run-selection.spec.ts).
 */
export function excludedTags(flags: RunFlags): string[] {
  if (flags.stackProfile === STACK_PROFILES.SIGNUP_DISABLED) {
    return flags.includeQuarantine ? [] : [TAGS.QUARANTINE];
  }
  if (flags.stackProfile === STACK_PROFILES.ENTERPRISE) {
    return [
      ...(flags.includeQuarantine ? [] : [TAGS.QUARANTINE]),
      ...(flags.includeEnterpriseTakeover ? [] : [TAGS.ENTERPRISE_TAKEOVER]),
    ];
  }
  return [
    ...(flags.includeQuarantine ? [] : [TAGS.QUARANTINE]),
    ...(flags.includeInsertAll ? [] : [TAGS.INSERT_ALL]),
    ...(flags.includeSuperAdmin ? [] : [TAGS.SUPERADMIN]),
    TAGS.ENTERPRISE,
    TAGS.ENTERPRISE_TAKEOVER,
    TAGS.SIGNUP_DISABLED,
  ];
}

/**
 * The `grepInvert` of the Playwright config: one alternation of the excluded tags, `undefined` when nothing is left
 * out. Default profile, no flag: `/@quarantine|@insert-all|@superadmin|@enterprise|@enterprise-takeover/` (the default run);
 * in between, the alternation of the tags whose flag is not set, the two enterprise tags always last. Enterprise profile:
 * `/@quarantine|@enterprise-takeover/` by default, `/@quarantine/` with the takeover flag only, `/@enterprise-takeover/`
 * with the quarantine flag only. A test tagged with several opt-in tags runs only when all their flags are set (SEC-R16c and
 * SEC-R16d carry @quarantine and @superadmin; SEC-E05 carries @quarantine and @enterprise-takeover). Limit: it matches the
 * tags in the test title, so a title that contains the text of an excluded tag is excluded too (no test title does).
 */
export function grepInvertFor(flags: RunFlags): RegExp | undefined {
  const tags = excludedTags(flags);
  return tags.length === 0 ? undefined : new RegExp(tags.join("|"));
}

/**
 * The `grep` of the Playwright config. Default profile: `undefined`. Signup-disabled profile: `/@signup-disabled/`. Enterprise profile: `/@enterprise/` (only the tests made
 * for that stack, whatever files the run names), or `/@enterprise-takeover/` with the takeover flag, so that run holds SEC-E05
 * alone and never shares its stack with another test. Measured with Playwright 1.64 (`--list` with the config's `grep` and a
 * `--grep` on the command line): a command-line `--grep` does NOT replace the config's `grep`, it narrows it further, so a
 * command-line pattern can only select fewer tests of the profile, never reach a test outside it.
 */
export function grepFor(flags: RunFlags): RegExp | undefined {
  if (flags.stackProfile === STACK_PROFILES.SIGNUP_DISABLED) return new RegExp(TAGS.SIGNUP_DISABLED);
  if (flags.stackProfile !== STACK_PROFILES.ENTERPRISE) return undefined;
  return new RegExp(flags.includeEnterpriseTakeover ? TAGS.ENTERPRISE_TAKEOVER : TAGS.ENTERPRISE);
}
