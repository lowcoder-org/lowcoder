import { expect, test } from "@playwright/test";
import { RUN_FLAGS, TAGS } from "../../src/constants";
import { grepInvertFor, runFlagsFromEnv } from "../../src/run-selection";
import {
  DEFECT_ANNOTATION_TYPE,
  DEFECT_ID_PATTERN,
  FIXED_ON_BRANCH,
  OPEN_DEFECTS,
  SECURITY_ID_PATTERN,
  quarantinedDefect,
  securityCandidateDetails,
  securityTestDetails,
} from "../../src/security/quarantine";

/** Sizes of the two maps: 20 fixed-on-branch scenarios, and 25 open ones plus SEC-E05, X01b, X01c. */
const FIXED_ON_BRANCH_COUNT = 21;
const OPEN_DEFECTS_COUNT = 28;
/** A scenario id that is in neither map (a scenario that passes on the image). */
const PASSING_ID = "SEC-C01a";
const FIXED_ID = "SEC-C13";
const OPEN_ID = "SEC-C09";

/** The title as Playwright matches `grep` / `grepInvert` against: the title followed by the tags of the test. */
function titleWithTags(id: string, tags: string[]): string {
  return `${id} a scenario ${tags.join(" ")}`;
}

test.describe("security quarantine list", () => {
  test("a listed id gets the security and quarantine tags and the defect annotation", () => {
    expect(securityTestDetails(FIXED_ID), "a fixed-on-branch id").toEqual({
      tag: [TAGS.SECURITY, TAGS.QUARANTINE],
      annotation: { type: DEFECT_ANNOTATION_TYPE, description: FIXED_ON_BRANCH[FIXED_ID] },
    });
    expect(securityTestDetails(OPEN_ID), "an open-defect id").toEqual({
      tag: [TAGS.SECURITY, TAGS.QUARANTINE],
      annotation: { type: DEFECT_ANNOTATION_TYPE, description: OPEN_DEFECTS[OPEN_ID] },
    });
  });

  test("an unlisted id gets @security only and no annotation", () => {
    const details = securityTestDetails(PASSING_ID);

    expect(details.tag).toEqual([TAGS.SECURITY]);
    expect(details, "no annotation key at all").not.toHaveProperty("annotation");
  });

  test("extra tags are appended after the quarantine tags; the P0 set passes TAGS.CORE", () => {
    expect(securityTestDetails(PASSING_ID, [TAGS.CORE]).tag).toEqual([TAGS.SECURITY, TAGS.CORE]);
    expect(securityTestDetails(FIXED_ID, [TAGS.CORE]).tag).toEqual([TAGS.SECURITY, TAGS.QUARANTINE, TAGS.CORE]);
  });

  test("an id that is not a scenario id is refused, so a typo cannot leave a test unquarantined", () => {
    for (const bad of ["SEC-C13 ", "sec-c13", "SEC-C1", "SEC-Z01", "C13", "", "SEC-C013"]) {
      expect(() => securityTestDetails(bad), `"${bad}"`).toThrow(/is not a security scenario id/);
    }
  });

  test("every value is a defect id and every key a scenario id", () => {
    for (const [name, map] of [["FIXED_ON_BRANCH", FIXED_ON_BRANCH], ["OPEN_DEFECTS", OPEN_DEFECTS]] as const) {
      for (const [id, defect] of Object.entries(map)) {
        expect(id, `${name} key`).toMatch(SECURITY_ID_PATTERN);
        expect(defect, `${name} value of ${id}`).toMatch(DEFECT_ID_PATTERN);
      }
    }
  });

  test("no id is in both maps, and the maps have the expected sizes", () => {
    const both = Object.keys(FIXED_ON_BRANCH).filter((id) => id in OPEN_DEFECTS);

    expect(both, "ids in both maps").toEqual([]);
    expect(Object.keys(FIXED_ON_BRANCH)).toHaveLength(FIXED_ON_BRANCH_COUNT);
    expect(Object.keys(OPEN_DEFECTS)).toHaveLength(OPEN_DEFECTS_COUNT);
  });

  test("quarantinedDefect names the defect of a listed id and nothing for an unlisted one", () => {
    expect(quarantinedDefect(FIXED_ID)).toBe(FIXED_ON_BRANCH[FIXED_ID]);
    expect(quarantinedDefect(OPEN_ID)).toBe(OPEN_DEFECTS[OPEN_ID]);
    expect(quarantinedDefect(PASSING_ID)).toBeUndefined();
  });

  test("the default run leaves a quarantined security test out and E2E_INCLUDE_QUARANTINE brings it back", () => {
    const quarantined = titleWithTags(FIXED_ID, securityTestDetails(FIXED_ID).tag);
    const passing = titleWithTags(PASSING_ID, securityTestDetails(PASSING_ID).tag);
    const defaultRun = grepInvertFor(runFlagsFromEnv({}));
    const withQuarantine = grepInvertFor(runFlagsFromEnv({ [RUN_FLAGS.INCLUDE_QUARANTINE]: "1" }));

    expect(quarantined, "excluded from the default run").toMatch(defaultRun!);
    expect(passing, "a passing security test stays in the default run").not.toMatch(defaultRun!);
    expect(quarantined, "in again with the flag").not.toMatch(withQuarantine!);
  });

  test("securityCandidateDetails quarantines with a '<id> candidate' annotation and refuses misuse", () => {
    expect(securityCandidateDetails("SEC-A98a", "key kept after delete")).toEqual({
      tag: [TAGS.SECURITY, TAGS.QUARANTINE],
      annotation: { type: DEFECT_ANNOTATION_TYPE, description: "SEC-A98a candidate: key kept after delete" },
    });
    expect(securityCandidateDetails("SEC-A98a", "x", [TAGS.CORE]).tag, "extra tags last").toEqual([TAGS.SECURITY, TAGS.QUARANTINE, TAGS.CORE]);
    expect(() => securityCandidateDetails("SEC-A02", "x"), "pattern needs two digits").not.toThrow();
    expect(() => securityCandidateDetails("bad", "x")).toThrow(/is not a security scenario id/);
    expect(() => securityCandidateDetails(FIXED_ID, "x"), "an id of a map").toThrow(/quarantine map/);
    expect(() => securityCandidateDetails("SEC-A98a", "  "), "no measurement").toThrow(/names what was measured/);
  });
});
