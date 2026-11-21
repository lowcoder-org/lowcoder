import { RUN_FLAGS, TAGS } from "./constants";

/** Which opt-in groups of tests a run includes beyond the default selection. */
export interface RunFlags {
  /** Tests tagged `@quarantine` (they expose known defects and fail on purpose-built baselines). */
  includeQuarantine: boolean;
  /** Tests tagged `@insert-all` (S1, the insert-every-component smoke test: 112 tests, nightly). */
  includeInsertAll: boolean;
}

/** Reads the run flags from the environment: a flag is on when its variable is set and not empty (`=1`). */
export function runFlagsFromEnv(env: Record<string, string | undefined>): RunFlags {
  return {
    includeQuarantine: !!env[RUN_FLAGS.INCLUDE_QUARANTINE],
    includeInsertAll: !!env[RUN_FLAGS.INCLUDE_INSERT_ALL],
  };
}

/** The tags a run leaves out: each opt-in tag unless its own flag is set. The two flags are independent. */
export function excludedTags(flags: RunFlags): string[] {
  return [
    ...(flags.includeQuarantine ? [] : [TAGS.QUARANTINE]),
    ...(flags.includeInsertAll ? [] : [TAGS.INSERT_ALL]),
  ];
}

/**
 * The `grepInvert` of the Playwright config: one alternation of the excluded tags, `undefined` when nothing is left
 * out. The four combinations: neither flag `/@quarantine|@insert-all/` (the default run); quarantine only
 * `/@insert-all/`; insert-all only `/@quarantine/`; both `undefined` (everything). A test tagged with both runs only
 * when both flags are set. Limit: it matches the tags in the test title, so a title that contains the text of an
 * excluded tag is excluded too (no test title does).
 */
export function grepInvertFor(flags: RunFlags): RegExp | undefined {
  const tags = excludedTags(flags);
  return tags.length === 0 ? undefined : new RegExp(tags.join("|"));
}
