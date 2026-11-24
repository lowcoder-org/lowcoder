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
 * Scenarios whose defect is fixed in the code of this branch but whose test is not (yet) in the default run, scenario id to
 * defect id. Since the reassessment of 2026-11-22 on `lowcoderorg/lowcoder-ce:3.0.1-e2e` every other entry that used to be
 * here has left the map (its test passed on 3.0.1 and runs by default); what is left needs a decision before it can leave:
 * - LC-AK04 (D-45): the API defect is fixed (SEC-A02a passes), but the UI test that deletes the last API key is intermittent
 *   on 3.0.1 (passed 2 of 3 runs, failed 1 of 3; the cause, product or test, is not investigated). It stays quarantined until
 *   it passes repeatedly (`E2E_INCLUDE_QUARANTINE=1 ... --grep @quarantine`), then its id is deleted and this map is empty.
 *
 * Limit: the maps are the single source of the quarantine; a scenario missing from both that fails on the image is NOT
 * quarantined and fails the default run, and a stale entry hides a test that passes.
 */
export const FIXED_ON_BRANCH: Readonly<Record<string, string>> = {
  "LC-AK04": "D-45",
};

/**
 * Scenarios that still fail on this branch's server (open defects, listed in the table "Security findings" of
 * `e2e/README.md`; each still failed on 3.0.1-e2e on 2026-11-22), scenario id to defect id.
 * D-6, D-7, D-35, D-36, D-40 and D-58, D-62 left this map: the server fixes close them (SEC-C09, SEC-C11, SEC-C19a,
 * SEC-C19b, SEC-C22e, SEC-R15c, SEC-A11, SEC-E05 and the lifecycle ids LC-PW11, LC-IP14 all now pass; SEC-E05 needs
 * `E2E_STACK_PROFILE=enterprise`, confirmed separately). D-33's CORS-credentials half also left: `SecurityConfig` now
 * grants credentials only to an origin listed in a non-wildcard `LOWCODER_CORS_DOMAINS` entry, so SEC-A12 passes on the
 * default stack (`*`); D-33's CSRF and `SameSite` half stays open (the row names the residual). D-12 and D-39 left this
 * map: `SecurityConfig` no longer lets anonymous callers reach `POST /api/meta/` or the actuator metrics and Prometheus
 * routes (health stays open); SEC-A10a and SEC-A10c are therefore no longer quarantined (Docker/e2e confirmation
 * pending the combined final run). SEC-X01b, SEC-X01c (D-35) left the same way: the npm registry proxy now needs
 * READ on the path's app id before resolving the workspace or forwarding anything. D-10 left this map the same way:
 * `POST /api/query/execute` in edit mode needs EDIT on the app (for a module run in another app's editor: EDIT on
 * that app and READ on the module, whose published queries run), so SEC-A09c is no longer quarantined. D-49 left the
 * map the same way: `POST /api/users/password` now needs a single conditional MongoDB update that refuses an account
 * which already has a password, so LC-PR13 is no longer quarantined. D-34 left the map the same way: a password
 * change, a lost-password reset and an ENTERPRISE admin reset now end the other sessions of the account (the
 * caller's own survives a change or a self-reset), so SEC-A04 and LC-PW08 are no longer quarantined. D-48 left the map
 * the same way: the server now enforces the client's password rule (sign-up, an admin's create-user route, a password
 * change, a lost-password reset, a provider-only account's first password), so LC-AU07 and LC-PR14 are no longer
 * quarantined. D-14 left this map: an organization's JSON no longer carries its auth configs, so neither the
 * workspace answer nor the profile holds a sign-in client secret, so SEC-R07d is no longer quarantined (SEC-R07e is
 * new and was never quarantined). D-32 left this map: the app record route (live or a named version's DSL) now needs
 * EDIT_APPLICATIONS on the record's own application, so SEC-R01d is no longer quarantined (SEC-R01e, SEC-R01f+ and
 * SEC-R01g+ pin the viewer, editor and workspace-admin answers; Docker/e2e confirmation deferred to the combined
 * final run, NOT VERIFIED yet). D-31 left this map: a history snapshot is now served only through the app it was
 * saved for, so SEC-C21 is no longer quarantined (Docker/e2e confirmation deferred to the combined final run, NOT
 * VERIFIED yet). D-42 left this map only partly: a bundle's element list now carries an app's editing DSL only to a
 * reader who may edit that app, and an app added to or moved into a bundle is stored without its editing DSL, so
 * SEC-R17c is no longer quarantined (Docker/e2e confirmation deferred to the combined final run, NOT VERIFIED yet);
 * copies stored in bundle DSLs before the fix remain unfiltered (the README row names the residual). D-38 left this
 * map: each id of a batched permission lookup is now decided in its own workspace instead of the first id's, so
 * SEC-R09d is no longer quarantined and no longer intermittent (Docker/e2e confirmation deferred to the combined
 * final run, NOT VERIFIED yet). D-8 left this map: a folder's permission list now requires the caller to be a member
 * of the folder's workspace, so SEC-C10 is no longer quarantined (Docker/e2e confirmation deferred to the combined
 * final run, NOT VERIFIED yet). D-9 and D-37 left this map: a status change through the update route now needs
 * MANAGE_APPLICATIONS, and the app slug route now needs EDIT_APPLICATIONS, so SEC-R03b and SEC-C16f are no longer
 * quarantined (Docker/e2e confirmation deferred to the combined final run, NOT VERIFIED yet). D-11 and D-41 left
 * this map: app, bundle and data source creation now check the developer role in the TARGET workspace, not the
 * visitor's current one, so SEC-R06c and SEC-R17b are no longer quarantined (SEC-R06e is new and was never
 * quarantined; Docker/e2e confirmation deferred to the combined final run, NOT VERIFIED yet). D-59 and D-60 left this
 * map: the member-leave clean-up now deletes the data source row by the right resource type and gained a folder and a
 * bundle step, so LC-DL03 and LC-DL04 are no longer quarantined (LC-DL12 is new and was never quarantined; Docker/e2e
 * confirmation deferred to the combined final run, NOT VERIFIED yet); rows left by removals before the fix stay
 * stored, and a creator's `createdBy` access is a separate, unrevoked mechanism (README D-26 and D-60 residuals,
 * LC-DL13 to LC-DL15 candidates). D-52 left this map: `GroupApiServiceImpl.update` now refuses a non-null `groupName`
 * on a system group (any of its three encodings) with UNSUPPORTED_OPERATION and writes nothing, so LC-GR09 is no
 * longer quarantined (Docker/e2e confirmation deferred to the combined final run, NOT VERIFIED yet); groups renamed
 * before the fix keep their stored name, never shown (`Group.getName`). D-54 left this map: the password-reset and
 * invitation mail links now carry the configured public URL without its trailing slashes, so LC-PW12 is no longer
 * quarantined (LC-PW02 and LC-PW13 now open those links as mailed instead of working around the double slash;
 * Docker/e2e confirmation deferred to the combined final run, NOT VERIFIED yet). D-55 left this map: the invite
 * dialog's success notice now uses the key readers of every other notice in the file use (`memberSettings.*`, not
 * `membersSettings.*`), so LC-PW15 is no longer quarantined (Docker/e2e confirmation deferred to the combined final
 * run, NOT VERIFIED yet). D-63 also left this map: the profile now fetches the app list it counts, so LC-OT02 passes
 * (Docker/e2e confirmation deferred to the combined final run, NOT VERIFIED yet). LC-AU15
 * (`tests/auth/signup-edge.spec.ts`) is a lifecycle id.
 */
export const OPEN_DEFECTS: Readonly<Record<string, string>> = {
  "SEC-C17c": "D-30",
  "SEC-R17f": "D-46",
  "SEC-A10b": "D-13",
  "LC-AU15": "D-30",
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
 * The details of a security test that failed on the image under test for a real server behaviour nobody expected and that
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
