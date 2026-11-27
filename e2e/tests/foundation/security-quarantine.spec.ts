import { expect, test } from "@playwright/test";
import { RUN_FLAGS, TAGS } from "../../src/constants";
import { grepInvertFor, runFlagsFromEnv } from "../../src/run-selection";
import {
  DEFECT_ANNOTATION_TYPE,
  DEFECT_ID_PATTERN,
  FIXED_ON_BRANCH,
  OPEN_DEFECTS,
  LIFECYCLE_ID_PATTERN,
  SECURITY_ID_PATTERN,
  lifecycleCandidateDetails,
  lifecycleDetailsFor,
  lifecycleTestDetails,
  quarantinedDefect,
  securityCandidateDetails,
  securityDetailsFor,
  securityTestDetails,
} from "../../src/security/quarantine";

/** Sizes of the two maps: no fixed-on-branch scenario (LC-AK04 left it: its UI test no longer reloads during the delete), and no open one
 * (D-30 and D-13 left the maps by the owner's decisions: the join through a workspace's own page and the anonymous e-mail lookup are intended, so SEC-C17c, LC-AU15 and SEC-A10b pin them). D-6, D-7, D-33 (CORS-credentials half), D-34, D-36, D-40, D-48, D-49, D-58 and D-62 left the map: their server fixes
 * closed SEC-C09, SEC-C11, SEC-C19a, SEC-C19b, SEC-C22e, SEC-R15c, SEC-A04, SEC-A11, SEC-A12, SEC-E05, LC-PW08, LC-PW11,
 * LC-IP14, LC-PR13, LC-AU07 and LC-PR14. D-12 and D-39 also left the map: the fix closed SEC-A10a and SEC-A10c. D-35 also left the map:
 * the fix closed SEC-X01b and SEC-X01c. D-10 also left the map: the fix closed SEC-A09c. D-14 also left the map: the
 * fix closed SEC-R07d and SEC-R07e. D-32 also left the map: the fix closed SEC-R01d (SEC-R01e, SEC-R01f+ and
 * SEC-R01g+ are new and were never quarantined). D-31 also left the map: the fix closed SEC-C21. D-42 also left the
 * map, only partly: the fix closed SEC-R17c (SEC-R17g is new and was never quarantined); copies stored in bundle
 * DSLs before the fix remain unfiltered. D-38 also left the map: each id of a batched permission lookup is now
 * decided in its own workspace, so SEC-R09d is no longer quarantined and no longer intermittent. D-8 also left the
 * map: a folder's permission list now requires the caller to be a member of the folder's workspace, so SEC-C10 is no
 * longer quarantined. D-9 and D-37 also left the map: a status change now needs MANAGE_APPLICATIONS and the app slug
 * route now needs EDIT_APPLICATIONS, so SEC-R03b and SEC-C16f are no longer quarantined. D-11 and D-41 also left the
 * map: app, bundle and data source creation now check the developer role of the TARGET workspace, so SEC-R06c and
 * SEC-R17b are no longer quarantined (SEC-R06e is new and was never quarantined). D-59 and D-60 also left the map:
 * the member-leave clean-up now deletes the right data source rows and gained a folder and a bundle step, so
 * LC-DL03 and LC-DL04 are no longer quarantined (LC-DL12 is new and was never quarantined). D-52 also left the map:
 * a system group's rename is now refused with UNSUPPORTED_OPERATION, so LC-GR09 is no longer quarantined. D-54 also
 * left the map: the mail links now carry the public URL without its trailing slashes, so LC-PW12 is no longer
 * quarantined. D-55 also left the map: the invite dialog's success notice now uses the right translation key, so
 * LC-PW15 is no longer quarantined. D-63 also left the map: the profile now fetches the app list it counts, so
 * LC-OT02 is no longer quarantined. */
const FIXED_ON_BRANCH_COUNT = 0;
const OPEN_DEFECTS_COUNT = 0;
/** Lifecycle ids: no lifecycle id is in a map any more; the listed-id branches are tested through an injected lookup. */
const LC_UNLISTED_ID = "LC-AU01";
const LC_INJECTED_ID = "LC-AK98";
const INJECTED_DEFECTS: Readonly<Record<string, string>> = { [LC_INJECTED_ID]: "D-45" };
const LC_AREAS = ["AU", "PR", "AK", "WM", "GR", "SH", "PW", "DL", "IP", "OT"];
const injected = lifecycleDetailsFor((id) => INJECTED_DEFECTS[id]);
/** A scenario id that is in neither map (a scenario that passes on the image). */
const PASSING_ID = "SEC-C01a";
/** The last id that left `FIXED_ON_BRANCH` (its test passes, so it is in neither map). */
const LEFT_FIXED_LC_ID = "LC-AK04";
/** A scenario that left the quarantine on 3.0.1 (its test passes, so it is in neither map). */
const LEFT_QUARANTINE_ID = "SEC-C13";
/** An id listed by the injected lookup only: both maps are empty, so the listed-id branches are tested through it. */
const SEC_INJECTED_ID = "SEC-A97a";
const SEC_INJECTED_DEFECTS: Readonly<Record<string, string>> = { [SEC_INJECTED_ID]: "D-45" };
const injectedSecurity = securityDetailsFor((id) => SEC_INJECTED_DEFECTS[id]);

/** The title as Playwright matches `grep` / `grepInvert` against: the title followed by the tags of the test. */
function titleWithTags(id: string, tags: string[]): string {
  return `${id} a scenario ${tags.join(" ")}`;
}

test.describe("security quarantine list", () => {
  test("a listed id gets the security and quarantine tags and the defect annotation", () => {
    expect(injectedSecurity.testDetails(SEC_INJECTED_ID), "an id the lookup lists").toEqual({
      tag: [TAGS.SECURITY, TAGS.QUARANTINE],
      annotation: { type: DEFECT_ANNOTATION_TYPE, description: "D-45" },
    });
    expect(securityTestDetails(SEC_INJECTED_ID), "the maps, not the injected lookup, decide in production").toEqual({ tag: [TAGS.SECURITY] });
  });

  test("an unlisted id gets @security only and no annotation", () => {
    const details = securityTestDetails(PASSING_ID);

    expect(details.tag).toEqual([TAGS.SECURITY]);
    expect(details, "no annotation key at all").not.toHaveProperty("annotation");
    expect(securityTestDetails(LEFT_QUARANTINE_ID), "an id that left the quarantine on 3.0.1").toEqual({ tag: [TAGS.SECURITY] });
  });

  test("extra tags are appended after the quarantine tags; the P0 set passes TAGS.CORE", () => {
    expect(securityTestDetails(PASSING_ID, [TAGS.CORE]).tag).toEqual([TAGS.SECURITY, TAGS.CORE]);
    expect(injectedSecurity.testDetails(SEC_INJECTED_ID, [TAGS.CORE]).tag).toEqual([TAGS.SECURITY, TAGS.QUARANTINE, TAGS.CORE]);
  });

  test("an id that is not a scenario id is refused, so a typo cannot leave a test unquarantined", () => {
    for (const bad of ["SEC-C13 ", "sec-c13", "SEC-C1", "SEC-Z01", "C13", "", "SEC-C013"]) {
      expect(() => securityTestDetails(bad), `"${bad}"`).toThrow(/is not a security scenario id/);
    }
  });

  test("every value is a defect id and every key a scenario id", () => {
    for (const [name, map] of [["FIXED_ON_BRANCH", FIXED_ON_BRANCH], ["OPEN_DEFECTS", OPEN_DEFECTS]] as const) {
      for (const [id, defect] of Object.entries(map)) {
        expect(LIFECYCLE_ID_PATTERN.test(id) || SECURITY_ID_PATTERN.test(id), `${name} key ${id} is a scenario id`).toBe(true);
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
    expect(quarantinedDefect(LEFT_FIXED_LC_ID), "an id that left FIXED_ON_BRANCH").toBeUndefined();
    expect(quarantinedDefect("SEC-A10b"), "an id that left OPEN_DEFECTS").toBeUndefined();
    expect(quarantinedDefect(PASSING_ID)).toBeUndefined();
  });

  test("the default run leaves a quarantined security test out and E2E_INCLUDE_QUARANTINE brings it back", () => {
    const quarantined = titleWithTags(SEC_INJECTED_ID, injectedSecurity.testDetails(SEC_INJECTED_ID).tag);
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
    expect(() => injectedSecurity.candidateDetails(SEC_INJECTED_ID, "x"), "a listed id").toThrow(/quarantine map/);
    expect(() => securityCandidateDetails("SEC-A98a", "  "), "no measurement").toThrow(/names what was measured/);
  });

  test("a lifecycle id the maps do not list gets the lifecycle tag only and no annotation", () => {
    const details = lifecycleTestDetails(LC_UNLISTED_ID);

    expect(details.tag).toEqual([TAGS.LIFECYCLE]);
    expect(details, "no annotation key at all").not.toHaveProperty("annotation");
    expect(lifecycleTestDetails(LEFT_FIXED_LC_ID), "the lifecycle id that left FIXED_ON_BRANCH").toEqual({ tag: [TAGS.LIFECYCLE] });
  });

  test("a lifecycle id the lookup lists gets the lifecycle and quarantine tags and the defect annotation", () => {
    expect(injected.testDetails(LC_INJECTED_ID)).toEqual({
      tag: [TAGS.LIFECYCLE, TAGS.QUARANTINE],
      annotation: { type: DEFECT_ANNOTATION_TYPE, description: "D-45" },
    });
    expect(lifecycleTestDetails(LC_INJECTED_ID).tag, "the maps, not the injected lookup, decide in production").toEqual([TAGS.LIFECYCLE]);
  });

  test("LC-AU15 left the maps: it carries the lifecycle tag only and no annotation", () => {
    expect(quarantinedDefect("LC-AU15"), "no defect is listed for it").toBeUndefined();
    expect(lifecycleTestDetails("LC-AU15")).toEqual({ tag: [TAGS.LIFECYCLE] });
  });

  test("lifecycle extra tags are appended after the base and quarantine tags", () => {
    expect(lifecycleTestDetails(LC_UNLISTED_ID, [TAGS.SLOW]).tag).toEqual([TAGS.LIFECYCLE, TAGS.SLOW]);
    expect(injected.testDetails(LC_INJECTED_ID, [TAGS.SLOW]).tag).toEqual([TAGS.LIFECYCLE, TAGS.QUARANTINE, TAGS.SLOW]);
  });

  test("the default run leaves a quarantined lifecycle test out and the include-quarantine flag brings it back", () => {
    const defaultRun = grepInvertFor(runFlagsFromEnv({}));
    const withQuarantine = grepInvertFor(runFlagsFromEnv({ [RUN_FLAGS.INCLUDE_QUARANTINE]: "1" }));
    const quarantined = titleWithTags(LC_INJECTED_ID, injected.testDetails(LC_INJECTED_ID).tag);
    const candidate = titleWithTags("LC-AK98", lifecycleCandidateDetails("LC-AK98", "x").tag);
    const passing = titleWithTags(LC_UNLISTED_ID, lifecycleTestDetails(LC_UNLISTED_ID).tag);

    expect(quarantined, "a listed test is out of the default run").toMatch(defaultRun!);
    expect(candidate, "a candidate is out of the default run").toMatch(defaultRun!);
    expect(passing, "a passing lifecycle test stays in").not.toMatch(defaultRun!);
    expect(quarantined, "in again with the flag").not.toMatch(withQuarantine!);
    expect(candidate, "a candidate in again with the flag").not.toMatch(withQuarantine!);
  });

  test("an id that is not a lifecycle id is refused, and every area is accepted", () => {
    for (const bad of ["LC-ZZ01", "LC-AU1", "LC-AU001", "lc-au01", "LC-AU01 ", "", "SEC-C13"]) {
      expect(() => lifecycleTestDetails(bad), `"${bad}"`).toThrow(/is not a lifecycle scenario id/);
    }
    expect(() => securityTestDetails("LC-AU01"), "a security function refuses an LC id").toThrow(/is not a security scenario id/);
    for (const area of LC_AREAS) {
      expect(() => lifecycleTestDetails(`LC-${area}01`), area).not.toThrow();
    }
    expect(() => lifecycleTestDetails("LC-AU02b+")).not.toThrow();
  });

  test("lifecycleCandidateDetails quarantines with '<id> candidate: <measured>' and refuses misuse", () => {
    expect(lifecycleCandidateDetails("LC-AK98", "key kept after delete")).toEqual({
      tag: [TAGS.LIFECYCLE, TAGS.QUARANTINE],
      annotation: { type: DEFECT_ANNOTATION_TYPE, description: "LC-AK98 candidate: key kept after delete" },
    });
    expect(lifecycleCandidateDetails("LC-AK98", "x", [TAGS.SLOW]).tag, "extra tags last").toEqual([TAGS.LIFECYCLE, TAGS.QUARANTINE, TAGS.SLOW]);
    expect(() => lifecycleCandidateDetails("bad", "x")).toThrow(/is not a lifecycle scenario id/);
    expect(() => injected.candidateDetails(LC_INJECTED_ID, "x"), "a listed id").toThrow(/quarantine map/);
    expect(() => lifecycleCandidateDetails("LC-AK98", "  "), "no measurement").toThrow(/names what was measured/);
  });
});
