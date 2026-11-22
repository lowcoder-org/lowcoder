import { TAGS } from "../constants";

/**
 * Pattern of a security scenario id: `SEC-C<nn>` cross-workspace, `SEC-R<nn>` roles, `SEC-A<nn>`
 * abuse, `SEC-E<nn>` ENTERPRISE stack, `SEC-X<nn>` outbound requests, an optional letter for one test of a group and
 * an optional `+` for a positive control (`SEC-R02d+`). A test title starts with its id followed by a space.
 */
export const SECURITY_ID_PATTERN = /^SEC-[CRAEX]\d{2}[a-z]?\+?$/;

/**
 * Pattern of a lifecycle scenario id `LC-<area><nn>`: `AU` sign-up, sign-in, session; `PR` profile and password; `AK` API
 * keys; `WM` workspace members and workspaces; `GR` groups; `SH` sharing; `PW` password recovery and invitation mail; `DL`
 * leave, removal, deletion; `IP` identity providers; `OT` other. An optional letter marks one test of a group and an
 * optional `+` a positive control. A phase that needs a new area adds it here.
 */
export const LIFECYCLE_ID_PATTERN = /^LC-(?:AU|PR|AK|WM|GR|SH|PW|DL|IP|OT)\d{2}[a-z]?\+?$/;

/** The defect-list entry that a quarantine entry names (`D-n`, see the table "Security findings" in `e2e/README.md`). */
export const DEFECT_ID_PATTERN = /^D-\d+$/;

/** Annotation type of a test that asserts the desired behaviour and fails today (`e2e/AGENTS.md` section 7). */
export const DEFECT_ANNOTATION_TYPE = "defect";

/**
 * Scenarios that fail on the 3.0.0 image but are fixed on this branch's server (fixed-on-branch defects),
 * scenario id to defect id. They leave quarantine, without a rewrite of any spec, by deleting their id from this map
 * once a run against an updated server passes them (`E2E_INCLUDE_QUARANTINE=1 ... --grep @quarantine`).
 *
 * Limit: the map is the single source of the quarantine; a scenario missing here that fails on the image is NOT
 * quarantined and fails the default run, and a stale entry hides a test that passes.
 */
export const FIXED_ON_BRANCH: Readonly<Record<string, string>> = {
  "SEC-C13": "D-29",
  "SEC-C15": "D-17",
  "SEC-C16b": "D-28",
  "SEC-C16c": "D-28",
  "SEC-C17a": "D-18",
  "SEC-C17b": "D-18",
  "SEC-C18b": "D-22",
  "SEC-C20": "D-21",
  "SEC-C23a": "D-43",
  "SEC-C23c": "D-44",
  "SEC-R08c": "D-16",
  "SEC-R08d": "D-24",
  "SEC-R09c": "D-20",
  "SEC-R11b": "D-26",
  "SEC-R16c": "D-23",
  "SEC-R16d": "D-24",
  "SEC-A02a": "D-45",
  "LC-AK04": "D-45",
  "LC-AK08": "D-51",
  "SEC-A06b": "D-23",
  "SEC-A07a": "D-19",
  "SEC-A09a": "D-25",
  "SEC-X02b": "D-27",
};

/**
 * Scenarios that fail on this branch's server too (open defects, listed in the table "Security findings" of
 * `e2e/README.md`), scenario id to defect id. SEC-E05 (ENTERPRISE stack, `tests/security/enterprise-takeover.spec.ts`)
 * and SEC-X01b, SEC-X01c (npm registry proxy, `tests/security/outbound.spec.ts`) are built. LC-AU07, LC-AU15 (`tests/auth/signup-edge.spec.ts`), LC-PR06 (`tests/account/profile.spec.ts`), LC-PR13 and LC-PR14 (`tests/account/password.spec.ts`) are lifecycle ids.
 */
export const OPEN_DEFECTS: Readonly<Record<string, string>> = {
  "SEC-C09": "D-7",
  "SEC-C10": "D-8",
  "SEC-C11": "D-7",
  "SEC-C16f": "D-37",
  "SEC-C17c": "D-30",
  "SEC-C19a": "D-6",
  "SEC-C19b": "D-6",
  "SEC-C21": "D-31",
  "SEC-C22e": "D-7",
  "SEC-R01d": "D-32",
  "SEC-R03b": "D-9",
  "SEC-R06c": "D-11",
  "SEC-R07d": "D-14",
  "SEC-R09d": "D-38",
  "SEC-R15c": "D-7",
  "SEC-R17b": "D-41",
  "SEC-R17c": "D-42",
  "SEC-R17f": "D-46",
  "SEC-A04": "D-34",
  "SEC-A09c": "D-10",
  "SEC-A10a": "D-12",
  "SEC-A10b": "D-13",
  "SEC-A10c": "D-39",
  "SEC-A11": "D-36",
  "SEC-A12": "D-33",
  "SEC-E05": "D-40",
  "SEC-X01b": "D-35",
  "SEC-X01c": "D-35",
  "LC-AU07": "D-48",
  "LC-AU15": "D-30",
  "LC-PR06": "D-50",
  "LC-PR13": "D-49",
  "LC-PR14": "D-48",
};

/** What a security test passes to `test(title, details, body)`: the `tag` and, for a quarantined test, the annotation. */
export interface SecurityTestDetails {
  tag: string[];
  annotation?: { type: string; description: string };
}

/** The defect id the quarantine lists name for the scenario id, or `undefined` when it is in neither map. */
export function quarantinedDefect(id: string): string | undefined {
  return FIXED_ON_BRANCH[id] ?? OPEN_DEFECTS[id];
}

/**
 * The details of a security test. Every security test passes `securityTestDetails("<id>")`.
 * - id in `FIXED_ON_BRANCH` or `OPEN_DEFECTS`: tags `@security` and `@quarantine` (out of the default run, in with
 *   `E2E_INCLUDE_QUARANTINE`, see src/run-selection.ts) and annotation `{ type: "defect", description: "D-n" }`.
 * - any other id: tag `@security` only, no annotation.
 * `extraTags` are appended after them (the P0 set passes `[TAGS.CORE]`).
 * Throws on an id that is not a scenario id, so a typo cannot silently leave a test out of its quarantine entry.
 */
export function securityTestDetails(id: string, extraTags: readonly string[] = []): SecurityTestDetails {
  if (!SECURITY_ID_PATTERN.test(id)) {
    throw new Error(`"${id}" is not a security scenario id (pattern ${SECURITY_ID_PATTERN})`);
  }
  const defect = quarantinedDefect(id);
  if (defect === undefined) {
    return { tag: [TAGS.SECURITY, ...extraTags] };
  }
  return {
    tag: [TAGS.SECURITY, TAGS.QUARANTINE, ...extraTags],
    annotation: { type: DEFECT_ANNOTATION_TYPE, description: defect },
  };
}

/**
 * The details of a security test that failed on the 3.0.0 image for a real server behaviour nobody expected and that
 * no defect-list entry names yet (`e2e/AGENTS.md` section 7: "<id> candidate"). Quarantined like a listed id, the annotation
 * description names the scenario and what was measured. A candidate leaves this form by getting a D id in
 * `FIXED_ON_BRANCH` or `OPEN_DEFECTS` and `securityTestDetails`. Throws on an id that is not a scenario id or that is already
 * in a map (use `securityTestDetails` then), and on an empty measurement.
 */
export function securityCandidateDetails(id: string, measured: string, extraTags: readonly string[] = []): SecurityTestDetails {
  if (!SECURITY_ID_PATTERN.test(id)) {
    throw new Error(`"${id}" is not a security scenario id (pattern ${SECURITY_ID_PATTERN})`);
  }
  if (quarantinedDefect(id) !== undefined) {
    throw new Error(`${id} is in a quarantine map; use securityTestDetails`);
  }
  if (measured.trim() === "") {
    throw new Error(`${id}: a candidate names what was measured`);
  }
  return {
    tag: [TAGS.SECURITY, TAGS.QUARANTINE, ...extraTags],
    annotation: { type: DEFECT_ANNOTATION_TYPE, description: `${id} candidate: ${measured}` },
  };
}

/** The two detail functions of the lifecycle tests, bound to one scenario-id-to-defect lookup. */
export interface LifecycleDetails {
  testDetails(id: string, extraTags?: readonly string[]): SecurityTestDetails;
  candidateDetails(id: string, measured: string, extraTags?: readonly string[]): SecurityTestDetails;
}

/**
 * The detail functions of the lifecycle tests (`LC-` ids, base tag `@lifecycle`), with the contract of
 * `securityTestDetails` and `securityCandidateDetails`. `defectOf` is the lookup from scenario id to defect id; the default
 * is `quarantinedDefect`, so the two maps stay the single source of the quarantine.
 *
 * Limits: an LC test that fails on the image and is in neither map fails the default run; a stale entry hides a passing
 * test (as for the security ids). A lookup passed by a caller is not checked against the maps: it exists for the unit test
 * only, production code uses `lifecycleTestDetails` and `lifecycleCandidateDetails`.
 */
export function lifecycleDetailsFor(defectOf: (id: string) => string | undefined = quarantinedDefect): LifecycleDetails {
  const refuseBadId = (id: string): void => {
    if (!LIFECYCLE_ID_PATTERN.test(id)) {
      throw new Error(`"${id}" is not a lifecycle scenario id (pattern ${LIFECYCLE_ID_PATTERN})`);
    }
  };
  return {
    testDetails(id, extraTags = []) {
      refuseBadId(id);
      const defect = defectOf(id);
      if (defect === undefined) {
        return { tag: [TAGS.LIFECYCLE, ...extraTags] };
      }
      return {
        tag: [TAGS.LIFECYCLE, TAGS.QUARANTINE, ...extraTags],
        annotation: { type: DEFECT_ANNOTATION_TYPE, description: defect },
      };
    },
    candidateDetails(id, measured, extraTags = []) {
      refuseBadId(id);
      if (defectOf(id) !== undefined) {
        throw new Error(`${id} is in a quarantine map; use lifecycleTestDetails`);
      }
      if (measured.trim() === "") {
        throw new Error(`${id}: a candidate names what was measured`);
      }
      return {
        tag: [TAGS.LIFECYCLE, TAGS.QUARANTINE, ...extraTags],
        annotation: { type: DEFECT_ANNOTATION_TYPE, description: `${id} candidate: ${measured}` },
      };
    },
  };
}

const lifecycleDetails = lifecycleDetailsFor();

/** The details of a lifecycle test: `test(title, lifecycleTestDetails("LC-AU01"), body)`. */
export const lifecycleTestDetails = lifecycleDetails.testDetails;

/** The details of a lifecycle test that failed on the image for a behaviour no defect-list entry names yet ("<id> candidate"). */
export const lifecycleCandidateDetails = lifecycleDetails.candidateDetails;
