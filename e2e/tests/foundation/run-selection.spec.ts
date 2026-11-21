import { expect, test } from "@playwright/test";
import config from "../../playwright.config";
import { RUN_FLAGS, TAGS } from "../../src/constants";
import { excludedTags, grepInvertFor, runFlagsFromEnv, type RunFlags } from "../../src/run-selection";

/** Titles as Playwright matches `grep` / `grepInvert` against them: the title path followed by the tags. */
const TITLE_PLAIN = "a plain test";
const TITLE_NPM = `a npm test ${TAGS.NPM} ${TAGS.SLOW}`;
const TITLE_QUARANTINE = `a quarantined test ${TAGS.QUARANTINE}`;
const TITLE_INSERT_ALL = `an insert test ${TAGS.INSERT_ALL} ${TAGS.SLOW}`;
const TITLE_BOTH = `an insert test that is also quarantined ${TAGS.INSERT_ALL} ${TAGS.QUARANTINE}`;
const ALL_TITLES = [TITLE_PLAIN, TITLE_NPM, TITLE_QUARANTINE, TITLE_INSERT_ALL, TITLE_BOTH];

interface Combination {
  description: string;
  flags: RunFlags;
  /** The `source` of the expected regular expression, or undefined for "no inversion". */
  expectedSource: string | undefined;
  /** Which of ALL_TITLES the run keeps. */
  kept: string[];
}

const COMBINATIONS: Combination[] = [
  {
    description: "neither flag (the default run)",
    flags: { includeQuarantine: false, includeInsertAll: false },
    expectedSource: "@quarantine|@insert-all",
    kept: [TITLE_PLAIN, TITLE_NPM],
  },
  {
    description: "only E2E_INCLUDE_QUARANTINE (the quarantined tests without the 112 S1 tests)",
    flags: { includeQuarantine: true, includeInsertAll: false },
    expectedSource: "@insert-all",
    kept: [TITLE_PLAIN, TITLE_NPM, TITLE_QUARANTINE],
  },
  {
    description: "only E2E_INCLUDE_INSERT_ALL (S1 without the quarantined tests)",
    flags: { includeQuarantine: false, includeInsertAll: true },
    expectedSource: "@quarantine",
    kept: [TITLE_PLAIN, TITLE_NPM, TITLE_INSERT_ALL],
  },
  {
    description: "both flags (everything, including a test tagged with both)",
    flags: { includeQuarantine: true, includeInsertAll: true },
    expectedSource: undefined,
    kept: ALL_TITLES,
  },
];

test.describe("run selection: grepInvert from the two opt-in flags", () => {
  for (const combination of COMBINATIONS) {
    test(`grepInvertFor, ${combination.description}`, () => {
      const inversion = grepInvertFor(combination.flags);

      expect(inversion?.source, `regular expression for ${JSON.stringify(combination.flags)}`).toBe(
        combination.expectedSource,
      );
      const kept = ALL_TITLES.filter((title) => inversion === undefined || !inversion.test(title));
      expect(kept, `titles kept by ${JSON.stringify(combination.flags)}`).toEqual(combination.kept);
    });
  }

  test("a test tagged with both opt-in tags runs only when both flags are set", () => {
    const runsIn = COMBINATIONS.filter(({ flags }) => {
      const inversion = grepInvertFor(flags);
      return inversion === undefined || !inversion.test(TITLE_BOTH);
    });

    expect(runsIn.map(({ flags }) => flags), "combinations that keep the doubly tagged test").toEqual([
      { includeQuarantine: true, includeInsertAll: true },
    ]);
  });

  test("excludedTags lists each opt-in tag unless its own flag is set", () => {
    expect(excludedTags({ includeQuarantine: false, includeInsertAll: false })).toEqual([TAGS.QUARANTINE, TAGS.INSERT_ALL]);
    expect(excludedTags({ includeQuarantine: true, includeInsertAll: false })).toEqual([TAGS.INSERT_ALL]);
    expect(excludedTags({ includeQuarantine: false, includeInsertAll: true })).toEqual([TAGS.QUARANTINE]);
    expect(excludedTags({ includeQuarantine: true, includeInsertAll: true })).toEqual([]);
  });

  test("runFlagsFromEnv: a flag is on when its variable is set and not empty", () => {
    expect(runFlagsFromEnv({}), "nothing set").toEqual({ includeQuarantine: false, includeInsertAll: false });
    expect(
      runFlagsFromEnv({ [RUN_FLAGS.INCLUDE_QUARANTINE]: "", [RUN_FLAGS.INCLUDE_INSERT_ALL]: "" }),
      "the empty strings run-in-docker.sh passes when the variables are unset",
    ).toEqual({ includeQuarantine: false, includeInsertAll: false });
    expect(runFlagsFromEnv({ [RUN_FLAGS.INCLUDE_QUARANTINE]: "1" }), "quarantine only").toEqual({
      includeQuarantine: true,
      includeInsertAll: false,
    });
    expect(runFlagsFromEnv({ [RUN_FLAGS.INCLUDE_INSERT_ALL]: "1" }), "insert-all only").toEqual({
      includeQuarantine: false,
      includeInsertAll: true,
    });
  });

  test("playwright.config.ts uses the selection for the environment this run has", () => {
    const expected = grepInvertFor(runFlagsFromEnv(process.env));

    expect(
      (config.grepInvert as RegExp | undefined)?.source,
      `config grepInvert under ${RUN_FLAGS.INCLUDE_QUARANTINE}=${process.env[RUN_FLAGS.INCLUDE_QUARANTINE] ?? ""} ${RUN_FLAGS.INCLUDE_INSERT_ALL}=${process.env[RUN_FLAGS.INCLUDE_INSERT_ALL] ?? ""}`,
    ).toBe(expected?.source);
  });
});
