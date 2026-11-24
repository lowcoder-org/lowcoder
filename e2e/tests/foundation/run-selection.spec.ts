import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import * as ts from "typescript";
import config from "../../playwright.config";
import { RUN_FLAGS, STACK_PROFILE_ENV, STACK_PROFILES, TAGS } from "../../src/constants";
import {
  excludedTags,
  grepFor,
  grepInvertFor,
  runFlagsFromEnv,
  stackProfileFromEnv,
  UnknownStackProfileError,
  type RunFlags,
} from "../../src/run-selection";

/** Titles as Playwright matches `grep` / `grepInvert` against them: the title path followed by the tags. */
const TITLE_PLAIN = "a plain test";
const TITLE_NPM = `a npm test ${TAGS.NPM} ${TAGS.SLOW}`;
const TITLE_QUARANTINE = `a quarantined test ${TAGS.QUARANTINE}`;
const TITLE_INSERT_ALL = `an insert test ${TAGS.INSERT_ALL} ${TAGS.SLOW}`;
const TITLE_BOTH = `an insert test that is also quarantined ${TAGS.INSERT_ALL} ${TAGS.QUARANTINE}`;
const TITLE_SUPERADMIN = `a super admin test ${TAGS.SECURITY} ${TAGS.SUPERADMIN}`;
const TITLE_SUPERADMIN_QUARANTINE = `a super admin test that is also quarantined ${TAGS.SECURITY} ${TAGS.QUARANTINE} ${TAGS.SUPERADMIN}`;
const TITLE_ENTERPRISE = `an enterprise test ${TAGS.SECURITY} ${TAGS.ENTERPRISE}`;
const TITLE_ENTERPRISE_SUPERADMIN = `an enterprise test that uses the super admin ${TAGS.SECURITY} ${TAGS.SUPERADMIN} ${TAGS.ENTERPRISE}`;
const TITLE_SIGNUP_DISABLED = `a sign-up test ${TAGS.LIFECYCLE} ${TAGS.SIGNUP_DISABLED}`;
const TITLE_SIGNUP_DISABLED_QUARANTINE = `a sign-up test that is also quarantined ${TAGS.LIFECYCLE} ${TAGS.QUARANTINE} ${TAGS.SIGNUP_DISABLED}`;
/** A node-service data source test that needs its sidecar (`@node-service` next to `@node-service-sidecar`). */
const TITLE_SIDECAR = `a sidecar test ${TAGS.NODE_SERVICE} ${TAGS.NODE_SERVICE_SIDECAR}`;
/** SEC-E05: quarantined, enterprise and takeover (the real test carries @superadmin too, which no combination reads on the enterprise profile). */
const TITLE_TAKEOVER = `the takeover test ${TAGS.SECURITY} ${TAGS.QUARANTINE} ${TAGS.ENTERPRISE} ${TAGS.ENTERPRISE_TAKEOVER} ${TAGS.SUPERADMIN}`;
const ALL_TITLES = [
  TITLE_PLAIN,
  TITLE_NPM,
  TITLE_QUARANTINE,
  TITLE_INSERT_ALL,
  TITLE_BOTH,
  TITLE_SUPERADMIN,
  TITLE_SUPERADMIN_QUARANTINE,
  TITLE_ENTERPRISE,
  TITLE_ENTERPRISE_SUPERADMIN,
  TITLE_TAKEOVER,
  TITLE_SIGNUP_DISABLED,
  TITLE_SIGNUP_DISABLED_QUARANTINE,
  TITLE_SIDECAR,
];
const DEFAULT_ONLY_TITLES = [TITLE_PLAIN, TITLE_NPM, TITLE_QUARANTINE, TITLE_INSERT_ALL, TITLE_BOTH, TITLE_SUPERADMIN, TITLE_SUPERADMIN_QUARANTINE];

const DEFAULT_STACK = STACK_PROFILES.DEFAULT;
const ENTERPRISE_STACK = STACK_PROFILES.ENTERPRISE;
const SIGNUP_DISABLED_STACK = STACK_PROFILES.SIGNUP_DISABLED;

/** Flags with everything off on the default stack, except what the case names. */
function flagsOf(overrides: Partial<RunFlags> = {}): RunFlags {
  return {
    includeQuarantine: false,
    includeInsertAll: false,
    includeSuperAdmin: false,
    includeNodeServiceSidecars: false,
    includeEnterpriseTakeover: false,
    stackProfile: DEFAULT_STACK,
    ...overrides,
  };
}

interface Combination {
  description: string;
  flags: RunFlags;
  /** The `source` of the expected `grepInvert`, or undefined for "no inversion". */
  expectedSource: string | undefined;
  /** The `source` of the expected `grep`, or undefined for "no selection". */
  expectedGrepSource: string | undefined;
  /** Which of ALL_TITLES the run keeps (the `grep` and the `grepInvert` both applied, as Playwright does). */
  kept: string[];
}

const COMBINATIONS: Combination[] = [
  {
    description: "neither flag (the default run)",
    flags: flagsOf(),
    expectedSource: "@quarantine|@insert-all|@superadmin|@node-service-sidecar|@enterprise|@enterprise-takeover|@signup-disabled",
    expectedGrepSource: undefined,
    kept: [TITLE_PLAIN, TITLE_NPM],
  },
  {
    description: "only E2E_INCLUDE_QUARANTINE (the quarantined tests without the 112 S1 tests)",
    flags: flagsOf({ includeQuarantine: true }),
    expectedSource: "@insert-all|@superadmin|@node-service-sidecar|@enterprise|@enterprise-takeover|@signup-disabled",
    expectedGrepSource: undefined,
    kept: [TITLE_PLAIN, TITLE_NPM, TITLE_QUARANTINE],
  },
  {
    description: "only E2E_INCLUDE_INSERT_ALL (S1 without the quarantined tests)",
    flags: flagsOf({ includeInsertAll: true }),
    expectedSource: "@quarantine|@superadmin|@node-service-sidecar|@enterprise|@enterprise-takeover|@signup-disabled",
    expectedGrepSource: undefined,
    kept: [TITLE_PLAIN, TITLE_NPM, TITLE_INSERT_ALL],
  },
  {
    description: "only E2E_INCLUDE_SUPERADMIN (the super admin tests that are not quarantined)",
    flags: flagsOf({ includeSuperAdmin: true }),
    expectedSource: "@quarantine|@insert-all|@node-service-sidecar|@enterprise|@enterprise-takeover|@signup-disabled",
    expectedGrepSource: undefined,
    kept: [TITLE_PLAIN, TITLE_NPM, TITLE_SUPERADMIN],
  },
  {
    description: "E2E_INCLUDE_SUPERADMIN and E2E_INCLUDE_QUARANTINE (all four SEC-R16 tests)",
    flags: flagsOf({ includeQuarantine: true, includeSuperAdmin: true }),
    expectedSource: "@insert-all|@node-service-sidecar|@enterprise|@enterprise-takeover|@signup-disabled",
    expectedGrepSource: undefined,
    kept: [TITLE_PLAIN, TITLE_NPM, TITLE_QUARANTINE, TITLE_SUPERADMIN, TITLE_SUPERADMIN_QUARANTINE],
  },
  {
    description: "all flags on the default stack, the takeover flag included (everything except the enterprise tests)",
    flags: flagsOf({ includeQuarantine: true, includeInsertAll: true, includeSuperAdmin: true, includeEnterpriseTakeover: true }),
    expectedSource: "@node-service-sidecar|@enterprise|@enterprise-takeover|@signup-disabled",
    expectedGrepSource: undefined,
    kept: DEFAULT_ONLY_TITLES,
  },
  {
    description: "the enterprise profile without a flag (only the enterprise tests; SEC-E05 and the quarantined ones out)",
    flags: flagsOf({ stackProfile: ENTERPRISE_STACK }),
    expectedSource: "@quarantine|@enterprise-takeover",
    expectedGrepSource: "@enterprise",
    kept: [TITLE_ENTERPRISE, TITLE_ENTERPRISE_SUPERADMIN],
  },
  {
    description: "the enterprise profile with E2E_INCLUDE_QUARANTINE alone (SEC-E05 stays out: it needs its own flag)",
    flags: flagsOf({ stackProfile: ENTERPRISE_STACK, includeQuarantine: true }),
    expectedSource: "@enterprise-takeover",
    expectedGrepSource: "@enterprise",
    kept: [TITLE_ENTERPRISE, TITLE_ENTERPRISE_SUPERADMIN],
  },
  {
    description: "the enterprise profile with the takeover flag alone (SEC-E05 is quarantined too, so nothing runs)",
    flags: flagsOf({ stackProfile: ENTERPRISE_STACK, includeEnterpriseTakeover: true }),
    expectedSource: "@quarantine",
    expectedGrepSource: "@enterprise-takeover",
    kept: [],
  },
  {
    description: "the enterprise profile with the takeover and quarantine flags (SEC-E05 ALONE, no other enterprise test)",
    flags: flagsOf({ stackProfile: ENTERPRISE_STACK, includeEnterpriseTakeover: true, includeQuarantine: true }),
    expectedSource: undefined,
    expectedGrepSource: "@enterprise-takeover",
    kept: [TITLE_TAKEOVER],
  },
  {
    description: "the enterprise profile with the two flags that do not apply there (they change nothing)",
    flags: flagsOf({ stackProfile: ENTERPRISE_STACK, includeInsertAll: true, includeSuperAdmin: true }),
    expectedSource: "@quarantine|@enterprise-takeover",
    expectedGrepSource: "@enterprise",
    kept: [TITLE_ENTERPRISE, TITLE_ENTERPRISE_SUPERADMIN],
  },
];

/** The titles a run keeps the way Playwright decides: `grep` must match and `grepInvert` must not. */
function keptTitles(flags: RunFlags): string[] {
  const selection = grepFor(flags);
  const inversion = grepInvertFor(flags);
  return ALL_TITLES.filter((title) => (selection === undefined || selection.test(title)) && (inversion === undefined || !inversion.test(title)));
}

/** Every combination of the four flags on one stack. */
function everyFlagCombination(stackProfile: RunFlags["stackProfile"]): RunFlags[] {
  const bools = [false, true];
  return bools.flatMap((includeQuarantine) =>
    bools.flatMap((includeInsertAll) =>
      bools.flatMap((includeSuperAdmin) =>
        bools.map((includeEnterpriseTakeover) => ({ includeQuarantine, includeInsertAll, includeSuperAdmin, includeNodeServiceSidecars: false, includeEnterpriseTakeover, stackProfile })),
      ),
    ),
  );
}

test.describe("run selection: grep and grepInvert from the opt-in flags and the stack profile", () => {
  for (const combination of COMBINATIONS) {
    test(`grepInvertFor and grepFor, ${combination.description}`, () => {
      expect(grepInvertFor(combination.flags)?.source, `grepInvert for ${JSON.stringify(combination.flags)}`).toBe(combination.expectedSource);
      expect(grepFor(combination.flags)?.source, `grep for ${JSON.stringify(combination.flags)}`).toBe(combination.expectedGrepSource);
      expect(keptTitles(combination.flags), `titles kept by ${JSON.stringify(combination.flags)}`).toEqual(combination.kept);
    });
  }

  test("a test tagged with both opt-in tags runs only when both flags are set", () => {
    const runsIn = everyFlagCombination(DEFAULT_STACK).filter((flags) => keptTitles(flags).includes(TITLE_BOTH));

    expect(runsIn.map((flags) => [flags.includeQuarantine, flags.includeInsertAll]), "combinations that keep the doubly tagged test").toEqual([
      [true, true],
      [true, true],
      [true, true],
      [true, true],
    ]);
  });

  test("a super admin test that is also quarantined runs only when both of its flags are set", () => {
    const runsIn = everyFlagCombination(DEFAULT_STACK).filter((flags) => keptTitles(flags).includes(TITLE_SUPERADMIN_QUARANTINE));

    expect(runsIn.every((flags) => flags.includeQuarantine && flags.includeSuperAdmin), "a test with both tags needs both flags").toBe(true);
    expect(runsIn.length, "combinations that keep them (insert-all and takeover free to vary)").toBe(4);
  });

  test("an enterprise test never runs on the default stack, whatever the flags", () => {
    for (const flags of everyFlagCombination(DEFAULT_STACK)) {
      const kept = keptTitles(flags).filter((title) => title.includes(TAGS.ENTERPRISE));
      expect(kept, `enterprise tests kept by ${JSON.stringify(flags)}`).toEqual([]);
    }
  });

  test("a run on the enterprise stack keeps only enterprise tests, whatever the flags", () => {
    for (const flags of everyFlagCombination(ENTERPRISE_STACK)) {
      const kept = keptTitles(flags);
      expect(kept.filter((title) => !title.includes(TAGS.ENTERPRISE)), `non-enterprise titles kept by ${JSON.stringify(flags)}`).toEqual([]);
    }
  });

  test("SEC-E05 runs only with its own flag and the quarantine flag, and then runs alone", () => {
    for (const flags of everyFlagCombination(ENTERPRISE_STACK)) {
      const kept = keptTitles(flags);
      const runs = kept.includes(TITLE_TAKEOVER);
      expect(runs, `SEC-E05 under ${JSON.stringify(flags)}`).toBe(flags.includeEnterpriseTakeover && flags.includeQuarantine);
      if (runs) {
        expect(kept, `the other tests of the run under ${JSON.stringify(flags)}`).toEqual([TITLE_TAKEOVER]);
      }
      if (!flags.includeEnterpriseTakeover) {
        expect(kept.includes(TITLE_TAKEOVER), `without its flag under ${JSON.stringify(flags)}`).toBe(false);
      }
    }
    for (const flags of everyFlagCombination(DEFAULT_STACK)) {
      expect(keptTitles(flags).includes(TITLE_TAKEOVER), `on the default stack under ${JSON.stringify(flags)}`).toBe(false);
    }
  });

  test("excludedTags lists each opt-in tag unless its own flag is set, and the enterprise tags on the default stack", () => {
    expect(excludedTags(flagsOf())).toEqual([TAGS.QUARANTINE, TAGS.INSERT_ALL, TAGS.SUPERADMIN, TAGS.NODE_SERVICE_SIDECAR, TAGS.ENTERPRISE, TAGS.ENTERPRISE_TAKEOVER, TAGS.SIGNUP_DISABLED]);
    expect(excludedTags(flagsOf({ includeQuarantine: true }))).toEqual([TAGS.INSERT_ALL, TAGS.SUPERADMIN, TAGS.NODE_SERVICE_SIDECAR, TAGS.ENTERPRISE, TAGS.ENTERPRISE_TAKEOVER, TAGS.SIGNUP_DISABLED]);
    expect(excludedTags(flagsOf({ includeInsertAll: true }))).toEqual([TAGS.QUARANTINE, TAGS.SUPERADMIN, TAGS.NODE_SERVICE_SIDECAR, TAGS.ENTERPRISE, TAGS.ENTERPRISE_TAKEOVER, TAGS.SIGNUP_DISABLED]);
    expect(excludedTags(flagsOf({ includeSuperAdmin: true }))).toEqual([TAGS.QUARANTINE, TAGS.INSERT_ALL, TAGS.NODE_SERVICE_SIDECAR, TAGS.ENTERPRISE, TAGS.ENTERPRISE_TAKEOVER, TAGS.SIGNUP_DISABLED]);
    expect(excludedTags(flagsOf({ includeQuarantine: true, includeInsertAll: true, includeSuperAdmin: true, includeEnterpriseTakeover: true }))).toEqual([
      TAGS.NODE_SERVICE_SIDECAR,
      TAGS.ENTERPRISE,
      TAGS.ENTERPRISE_TAKEOVER,
      TAGS.SIGNUP_DISABLED,
    ]);
    expect(excludedTags(flagsOf({ stackProfile: ENTERPRISE_STACK }))).toEqual([TAGS.QUARANTINE, TAGS.ENTERPRISE_TAKEOVER]);
    expect(excludedTags(flagsOf({ stackProfile: ENTERPRISE_STACK, includeQuarantine: true }))).toEqual([TAGS.ENTERPRISE_TAKEOVER]);
    expect(excludedTags(flagsOf({ stackProfile: ENTERPRISE_STACK, includeEnterpriseTakeover: true }))).toEqual([TAGS.QUARANTINE]);
    expect(excludedTags(flagsOf({ stackProfile: ENTERPRISE_STACK, includeQuarantine: true, includeEnterpriseTakeover: true }))).toEqual([]);
  });

  test("a sign-up-disabled test never runs on another stack, and that stack runs nothing else, whatever the flags", () => {
    for (const stack of [DEFAULT_STACK, ENTERPRISE_STACK]) {
      for (const flags of everyFlagCombination(stack)) {
        expect(keptTitles(flags).filter((title) => title.includes(TAGS.SIGNUP_DISABLED)), `sign-up-disabled titles kept by ${JSON.stringify(flags)}`).toEqual([]);
      }
    }
    for (const flags of everyFlagCombination(SIGNUP_DISABLED_STACK)) {
      const kept = keptTitles(flags);
      expect(kept.filter((title) => !title.includes(TAGS.SIGNUP_DISABLED)), `other titles kept by ${JSON.stringify(flags)}`).toEqual([]);
      expect(kept.includes(TITLE_SIGNUP_DISABLED), `the plain sign-up test under ${JSON.stringify(flags)}`).toBe(true);
      expect(kept.includes(TITLE_SIGNUP_DISABLED_QUARANTINE), `the quarantined one under ${JSON.stringify(flags)}`).toBe(flags.includeQuarantine);
    }
  });

  test("the sign-up-disabled profile: grep is its tag, grepInvert is the quarantine tag unless its flag is set, the other flags change nothing", () => {
    expect(grepFor(flagsOf({ stackProfile: SIGNUP_DISABLED_STACK }))?.source).toBe("@signup-disabled");
    expect(excludedTags(flagsOf({ stackProfile: SIGNUP_DISABLED_STACK }))).toEqual([TAGS.QUARANTINE]);
    expect(excludedTags(flagsOf({ stackProfile: SIGNUP_DISABLED_STACK, includeQuarantine: true }))).toEqual([]);
    expect(excludedTags(flagsOf({ stackProfile: SIGNUP_DISABLED_STACK, includeInsertAll: true, includeSuperAdmin: true, includeEnterpriseTakeover: true }))).toEqual([TAGS.QUARANTINE]);
    expect(runFlagsFromEnv({ [STACK_PROFILE_ENV]: "signup-disabled" }), "the profile named in the environment").toEqual({ ...flagsOf(), stackProfile: SIGNUP_DISABLED_STACK });
  });

  test("runFlagsFromEnv: a flag is on when its variable is set and not empty", () => {
    const off = flagsOf();
    expect(runFlagsFromEnv({}), "nothing set").toEqual(off);
    expect(
      runFlagsFromEnv({
        [RUN_FLAGS.INCLUDE_QUARANTINE]: "",
        [RUN_FLAGS.INCLUDE_INSERT_ALL]: "",
        [RUN_FLAGS.INCLUDE_SUPERADMIN]: "",
        [RUN_FLAGS.INCLUDE_ENTERPRISE_TAKEOVER]: "",
        [RUN_FLAGS.INCLUDE_NODE_SERVICE_SIDECARS]: "",
        [STACK_PROFILE_ENV]: "",
      }),
      "the empty strings run-in-docker.sh passes when the variables are unset",
    ).toEqual(off);
    expect(runFlagsFromEnv({ [RUN_FLAGS.INCLUDE_QUARANTINE]: "1" }), "quarantine only").toEqual({ ...off, includeQuarantine: true });
    expect(runFlagsFromEnv({ [RUN_FLAGS.INCLUDE_INSERT_ALL]: "1" }), "insert-all only").toEqual({ ...off, includeInsertAll: true });
    expect(runFlagsFromEnv({ [RUN_FLAGS.INCLUDE_SUPERADMIN]: "1" }), "super admin only").toEqual({ ...off, includeSuperAdmin: true });
    expect(runFlagsFromEnv({ [RUN_FLAGS.INCLUDE_ENTERPRISE_TAKEOVER]: "1" }), "takeover only").toEqual({ ...off, includeEnterpriseTakeover: true });
    expect(runFlagsFromEnv({ [RUN_FLAGS.INCLUDE_NODE_SERVICE_SIDECARS]: "1" }), "node-service sidecars only").toEqual({ ...off, includeNodeServiceSidecars: true });
    expect(runFlagsFromEnv({ [STACK_PROFILE_ENV]: "enterprise" }), "enterprise profile").toEqual({ ...off, stackProfile: ENTERPRISE_STACK });
    expect(runFlagsFromEnv({ [STACK_PROFILE_ENV]: "default" }), "default profile named").toEqual(off);
  });

  test("stackProfileFromEnv rejects a value that names no stack", () => {
    for (const value of ["Enterprise", "saas", "enterprise ", "1"]) {
      expect(() => stackProfileFromEnv({ [STACK_PROFILE_ENV]: value }), `profile "${value}"`).toThrow(UnknownStackProfileError);
    }
    expect(() => stackProfileFromEnv({ [STACK_PROFILE_ENV]: "saas" })).toThrow(/default or enterprise or signup-disabled/);
  });

  test("playwright.config.ts uses the selection for the environment this run has", () => {
    const flags = runFlagsFromEnv(process.env);

    expect(
      (config.grepInvert as RegExp | undefined)?.source,
      `config grepInvert under ${RUN_FLAGS.INCLUDE_QUARANTINE}=${process.env[RUN_FLAGS.INCLUDE_QUARANTINE] ?? ""} ${RUN_FLAGS.INCLUDE_INSERT_ALL}=${process.env[RUN_FLAGS.INCLUDE_INSERT_ALL] ?? ""} ${RUN_FLAGS.INCLUDE_SUPERADMIN}=${process.env[RUN_FLAGS.INCLUDE_SUPERADMIN] ?? ""} ${RUN_FLAGS.INCLUDE_ENTERPRISE_TAKEOVER}=${process.env[RUN_FLAGS.INCLUDE_ENTERPRISE_TAKEOVER] ?? ""} ${STACK_PROFILE_ENV}=${process.env[STACK_PROFILE_ENV] ?? ""}`,
    ).toBe(grepInvertFor(flags)?.source);
    expect((config.grep as RegExp | undefined)?.source, `config grep under ${STACK_PROFILE_ENV}=${process.env[STACK_PROFILE_ENV] ?? ""}`).toBe(grepFor(flags)?.source);
  });
});

/** Every `*.spec.ts` under `dir`, recursively. */
function specFilesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? specFilesUnder(join(dir, entry.name)) : entry.name.endsWith(".spec.ts") ? [join(dir, entry.name)] : [],
  );
}

/** Name of the fixture that signs the instance super admin in, and the names of the two forms that tag a test with it. */
const SUPER_ADMIN_FIXTURE = "superAdmin";
const SUPER_ADMIN_TAG_KEY = "SUPERADMIN";
const SUPER_ADMIN_TAG_TEXT = TAGS.SUPERADMIN;
const TAGS_OBJECT_NAME = "TAGS";
const PLAYWRIGHT_TEST_NAME = "test";
/** Modules whose `test` export is the Playwright test: the fixtures of the suite and Playwright itself. */
const TEST_MODULE_PATTERN = /(^|\/)fixtures$|^@playwright\/test$/;
/** `test.<form>(title, details, body)` forms that define a test. */
const TEST_FORMS = new Set(["only", "skip", "fixme", "fail"]);
/** `test.<hook>(body)` forms: the body runs for every test of the enclosing describe, so its fixtures are theirs. */
const HOOK_FORMS = new Set(["beforeEach", "beforeAll", "afterEach", "afterAll"]);
const DESCRIPTION_LENGTH = 70;

/** `["test", "describe", "only"]` for `test.describe.only`, `undefined` when the expression is not a chain rooted at an identifier. */
function callChain(expression: ts.Expression): string[] | undefined {
  if (ts.isIdentifier(expression)) return [expression.text];
  if (ts.isPropertyAccessExpression(expression)) {
    const parent = callChain(expression.expression);
    return parent && [...parent, expression.name.text];
  }
  return undefined;
}

/** True when the expression, or any expression inside it, is `TAGS.SUPERADMIN` or the string `"@superadmin"`. Comments are no nodes. */
function mentionsSuperAdminTag(node: ts.Node): boolean {
  if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === TAGS_OBJECT_NAME && node.name.text === SUPER_ADMIN_TAG_KEY) {
    return true;
  }
  if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && node.text === SUPER_ADMIN_TAG_TEXT) {
    return true;
  }
  return ts.forEachChild(node, mentionsSuperAdminTag) ?? false;
}

/**
 * Whether the details argument tags the test. An object literal must carry a `tag` property that mentions the tag (an
 * `annotation` or any other property that mentions it does not count); any other expression, in practice the call
 * `securityTestDetails(id, [TAGS.SUPERADMIN])`, must mention it among its own arguments. A reference through a variable
 * is not followed: it counts as untagged, so the guard fails closed.
 */
function detailsTagWithSuperAdmin(details: ts.Expression): boolean {
  if (ts.isObjectLiteralExpression(details)) {
    return details.properties.some(
      (property) =>
        ts.isPropertyAssignment(property) &&
        (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) &&
        property.name.text === "tag" &&
        mentionsSuperAdminTag(property.initializer),
    );
  }
  return ts.isCallExpression(details) && details.arguments.some(mentionsSuperAdminTag);
}

/** True when the function's first parameter is a destructuring pattern that names the super-admin fixture. */
function destructuresSuperAdmin(fn: ts.ArrowFunction | ts.FunctionExpression): boolean {
  const first = fn.parameters[0]?.name;
  return (
    first !== undefined &&
    ts.isObjectBindingPattern(first) &&
    first.elements.some((element) => (element.propertyName ?? element.name).getText() === SUPER_ADMIN_FIXTURE)
  );
}

/**
 * The local names a spec calls Playwright's `test` by: `test` itself (always, fail closed), every name bound to the `test`
 * export of the suite's fixtures or of `@playwright/test` (`import { test as e2eTest } from ...`), and every variable
 * initialised from one of those names or from its `.extend(...)` (`const t = test.extend({})`), repeated until nothing new appears.
 */
function localTestNames(file: ts.SourceFile): Set<string> {
  const names = new Set<string>([PLAYWRIGHT_TEST_NAME]);
  for (const statement of file.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier) || !TEST_MODULE_PATTERN.test(statement.moduleSpecifier.text)) continue;
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      for (const element of bindings.elements) {
        if ((element.propertyName ?? element.name).text === PLAYWRIGHT_TEST_NAME) names.add(element.name.text);
      }
    }
  }
  let grew = true;
  const collect = (node: ts.Node): void => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && !names.has(node.name.text)) {
      const initializer = ts.isCallExpression(node.initializer) ? node.initializer.expression : node.initializer;
      const chain = ts.isIdentifier(initializer) || ts.isPropertyAccessExpression(initializer) ? callChain(initializer) : undefined;
      const viaExtend = chain !== undefined && chain.length === 2 && chain[1] === "extend" && ts.isCallExpression(node.initializer);
      const plainAlias = chain !== undefined && chain.length === 1 && !ts.isCallExpression(node.initializer);
      if (chain && names.has(chain[0] as string) && (viaExtend || plainAlias)) {
        names.add(node.name.text);
        grew = true;
      }
    }
    ts.forEachChild(node, collect);
  };
  while (grew) {
    grew = false;
    collect(file);
  }
  return names;
}

/**
 * The tests of a spec source that use the `superAdmin` fixture without `TAGS.SUPERADMIN` (D-47: they would run in the
 * default run). Parses the source with the TypeScript compiler, so comments and titles never count. Covers every call
 * rooted at a name of `test` (`localTestNames`: `test`, an aliased import, a `test.extend(...)` variable): `test(...)`, `test.only/skip/fixme/fail(...)`, and the hooks `test.beforeEach/beforeAll/afterEach/afterAll(...)`,
 * at any nesting, in loops too. A tag on an enclosing `test.describe*(title, details, body)` call counts for every test
 * inside. Each result is `line <n>: <first characters of the title>`.
 *
 * Limits: a `test` passed through a function parameter or wrapped in another function is not recognised; a tag reached through a variable is
 * not followed (it counts as untagged); a tag in a conditional expression counts as present; only the first parameter
 * of the callback is read (Playwright demands that fixtures are destructured there).
 */
function untaggedSuperAdminTests(source: string, fileName = "synthetic.spec.ts"): string[] {
  const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  const untagged: string[] = [];
  const testNames = localTestNames(file);

  const visit = (node: ts.Node, tagged: boolean): void => {
    let childrenTagged = tagged;
    if (ts.isCallExpression(node)) {
      const chain = callChain(node.expression);
      if (chain !== undefined && testNames.has(chain[0] as string)) {
        const form = chain[1];
        const args = [...node.arguments];
        const fn = args.filter((arg): arg is ts.ArrowFunction | ts.FunctionExpression => ts.isArrowFunction(arg) || ts.isFunctionExpression(arg)).at(-1);
        const isDescribe = form === "describe" && chain[chain.length - 1] !== "configure";
        const isTest = chain.length === 1 || (chain.length === 2 && form !== undefined && TEST_FORMS.has(form));
        const isHook = chain.length === 2 && form !== undefined && HOOK_FORMS.has(form);
        const details = isHook ? [] : args.slice(1).filter((arg) => arg !== fn);
        const ownTag = details.some(detailsTagWithSuperAdmin);
        if (isDescribe) {
          childrenTagged = tagged || ownTag;
        } else if ((isTest || isHook) && fn && destructuresSuperAdmin(fn) && !(tagged || ownTag)) {
          const { line } = file.getLineAndCharacterOfPosition(node.getStart(file));
          const title = isHook ? `${chain.join(".")} hook` : (args[0]?.getText(file) ?? "");
          untagged.push(`line ${line + 1}: ${title.replace(/\s+/g, " ").slice(0, DESCRIPTION_LENGTH)}`);
        }
      }
    }
    ts.forEachChild(node, (child) => visit(child, childrenTagged));
  };
  visit(file, false);
  return untagged;
}

/** A tagged and an untagged use of the fixture, written the way the specs write them. */
const SYNTHETIC_TAGGED = `test("SEC-X tagged", securityTestDetails("SEC-X", [TAGS.SUPERADMIN]), async ({ superAdmin, page }) => {});`;
const SYNTHETIC_UNTAGGED = `test("SEC-X untagged", securityTestDetails("SEC-X"), async ({ superAdmin }) => {});`;

test.describe("run selection: the super admin tests are opt-in", () => {
  test("every test that uses the superAdmin fixture carries TAGS.SUPERADMIN", () => {
    const untagged: string[] = [];
    for (const file of specFilesUnder(join(__dirname, ".."))) {
      untagged.push(...untaggedSuperAdminTests(readFileSync(file, "utf8"), file).map((entry) => `${file}: ${entry}`));
    }

    expect(untagged, "tests that use the superAdmin fixture without TAGS.SUPERADMIN (D-47: they would run in the default run)").toEqual([]);
  });

  test("the guard accepts a tag in securityTestDetails, in an object literal and on an enclosing describe", () => {
    expect(untaggedSuperAdminTests(SYNTHETIC_TAGGED), "securityTestDetails with the tag").toEqual([]);
    expect(untaggedSuperAdminTests(`test("a", { tag: [TAGS.SECURITY, TAGS.SUPERADMIN] }, async ({ superAdmin }) => {});`), "tag array in an object").toEqual([]);
    expect(untaggedSuperAdminTests(`test("a", { tag: "@superadmin" }, async ({ superAdmin }) => {});`), "the tag as a string").toEqual([]);
    expect(
      untaggedSuperAdminTests(`test.describe("g", { tag: TAGS.SUPERADMIN }, () => { test("a", async ({ superAdmin }) => {}); });`),
      "tag on the describe",
    ).toEqual([]);
    expect(
      untaggedSuperAdminTests(`test.describe.serial("g", { tag: [TAGS.SUPERADMIN] }, () => { test.describe("h", () => { test.only("a", async ({ page, superAdmin: s }) => {}); }); });`),
      "tag on an outer describe, renamed binding, test.only",
    ).toEqual([]);
  });

  test("the guard reports an untagged test in every form Playwright offers", () => {
    expect(untaggedSuperAdminTests(SYNTHETIC_UNTAGGED), "plain test").toEqual([`line 1: "SEC-X untagged"`]);
    expect(untaggedSuperAdminTests(`test.only("a", async ({ superAdmin }) => {});`), "test.only").toHaveLength(1);
    expect(untaggedSuperAdminTests(`test.skip("a", async ({ superAdmin }) => {});`), "test.skip").toHaveLength(1);
    expect(untaggedSuperAdminTests(`test.fixme("a", async ({ superAdmin }) => {});`), "test.fixme").toHaveLength(1);
    expect(untaggedSuperAdminTests(`test.fail("a", async ({ superAdmin }) => {});`), "test.fail").toHaveLength(1);
    expect(untaggedSuperAdminTests(`test.describe("g", () => { test("a", async function ({ page, superAdmin }) {}); });`), "inside a describe, function expression").toHaveLength(1);
    expect(untaggedSuperAdminTests(`test.describe("g", { tag: TAGS.SECURITY }, () => { test("a", async ({ superAdmin }) => {}); });`), "describe with other tags").toHaveLength(1);
    expect(untaggedSuperAdminTests(`for (const id of ids) { test(id, async ({ superAdmin }) => {}); }`), "generated in a loop").toHaveLength(1);
    expect(untaggedSuperAdminTests(`test.describe("g", () => { test.beforeEach(async ({ superAdmin }) => {}); });`), "a hook that needs the fixture").toHaveLength(1);
  });

  test("the guard follows an aliased import of test and a test.extend variable", () => {
    const importAlias = `import { test as e2eTest } from "../../src/fixtures";\n`;
    expect(untaggedSuperAdminTests(`${importAlias}e2eTest("a", securityTestDetails("SEC-X"), async ({ superAdmin }) => {});`), "aliased test, untagged").toHaveLength(1);
    expect(untaggedSuperAdminTests(`${importAlias}e2eTest("a", securityTestDetails("SEC-X", [TAGS.SUPERADMIN]), async ({ superAdmin }) => {});`), "aliased test, tagged").toEqual([]);
    expect(untaggedSuperAdminTests(`import { test as base } from "@playwright/test";\nbase.only("a", async ({ superAdmin }) => {});`), "alias of Playwright's test, .only").toHaveLength(1);
    expect(untaggedSuperAdminTests(`${importAlias}e2eTest.describe("g", { tag: TAGS.SUPERADMIN }, () => { e2eTest("a", async ({ superAdmin }) => {}); });`), "tagged aliased describe").toEqual([]);
    expect(untaggedSuperAdminTests(`${importAlias}const t = e2eTest.extend({});\nt("a", async ({ superAdmin }) => {});`), "a variable made by extend on the alias").toHaveLength(1);
    expect(untaggedSuperAdminTests(`import { test } from "../../src/fixtures";\nconst again = test;\nagain("a", async ({ superAdmin }) => {});`), "a plain alias variable").toHaveLength(1);
    expect(untaggedSuperAdminTests(`import { other as e2eTest } from "../../src/fixtures";\ne2eTest("a", async ({ superAdmin }) => {});`), "another export under that name is no test").toEqual([]);
  });

  test("the guard ignores the text of a comment, a title and an annotation, and tests without the fixture", () => {
    expect(untaggedSuperAdminTests(`// TAGS.SUPERADMIN\n${SYNTHETIC_UNTAGGED}`), "tag named in a line comment").toHaveLength(1);
    expect(untaggedSuperAdminTests(`/* header: every test carries TAGS.SUPERADMIN */\n${SYNTHETIC_UNTAGGED}`), "tag named in a block comment").toHaveLength(1);
    expect(untaggedSuperAdminTests(`test("uses TAGS.SUPERADMIN @superadmin in its title", async ({ superAdmin }) => {});`), "tag named in the title").toHaveLength(1);
    expect(
      untaggedSuperAdminTests(`test("a", { tag: TAGS.SECURITY, annotation: { type: "x", description: TAGS.SUPERADMIN } }, async ({ superAdmin }) => {});`),
      "tag named in the annotation, not in tag",
    ).toHaveLength(1);
    expect(untaggedSuperAdminTests(`test("a", async ({ page, actor }) => { const superAdmin = 1; });`), "a local named superAdmin is no fixture").toEqual([]);
    expect(untaggedSuperAdminTests(`test("a", async ({ page }) => { test.skip(true, "TAGS.SUPERADMIN"); });`), "test.skip(condition) inside a body").toEqual([]);
    expect(untaggedSuperAdminTests(`test("a", async ({ page }) => {});\ntest(SYNTHETIC, async ({ superAdmin }) => {});`).map((entry) => entry.slice(0, 7)), "the report names the line of the untagged one").toEqual(["line 2:"]);
  });
});

/** Every combination of the five flags of the default stack. */
function everyFlagCombinationWithSidecars(): RunFlags[] {
  return everyFlagCombination(DEFAULT_STACK).flatMap((flags) => [false, true].map((includeNodeServiceSidecars) => ({ ...flags, includeNodeServiceSidecars })));
}

test.describe("run selection: the node-service sidecar tests are opt-in", () => {
  test("the default selection leaves out the sidecar tag and keeps the plain node-service tests", () => {
    expect(excludedTags(flagsOf()), "excluded by default").toContain(TAGS.NODE_SERVICE_SIDECAR);
    expect(excludedTags(flagsOf()), "@node-service itself is a selection tag, never excluded").not.toContain(TAGS.NODE_SERVICE);
    expect(keptTitles(flagsOf()), "the default run keeps no sidecar test").not.toContain(TITLE_SIDECAR);
    const plainNodeServiceTitle = `a plain node-service test ${TAGS.NODE_SERVICE}`;
    expect(grepInvertFor(flagsOf())?.test(plainNodeServiceTitle), "a test with only @node-service is not excluded").toBe(false);
    expect(grepInvertFor(flagsOf())?.test(TITLE_SIDECAR), "the sidecar title is excluded by the inversion").toBe(true);
  });

  test("the flag includes the sidecar tests, and only the flag does", () => {
    expect(excludedTags(flagsOf({ includeNodeServiceSidecars: true })), "excluded with the flag").not.toContain(TAGS.NODE_SERVICE_SIDECAR);
    expect(keptTitles(flagsOf({ includeNodeServiceSidecars: true })), "the flag keeps the sidecar test").toContain(TITLE_SIDECAR);
    for (const flags of everyFlagCombinationWithSidecars()) {
      expect(keptTitles(flags).includes(TITLE_SIDECAR), `the sidecar test under ${JSON.stringify(flags)}`).toBe(flags.includeNodeServiceSidecars);
    }
  });

  test("the flag changes nothing else on the default stack, and the other stacks never run a sidecar test", () => {
    for (const flags of everyFlagCombination(DEFAULT_STACK)) {
      const without = keptTitles({ ...flags, includeNodeServiceSidecars: false });
      const withFlag = keptTitles({ ...flags, includeNodeServiceSidecars: true });
      expect(withFlag, `titles kept with the flag, under ${JSON.stringify(flags)}`).toEqual([...without, TITLE_SIDECAR].sort((a, b) => ALL_TITLES.indexOf(a) - ALL_TITLES.indexOf(b)));
    }
    for (const stack of [ENTERPRISE_STACK, SIGNUP_DISABLED_STACK]) {
      for (const flags of everyFlagCombination(stack)) {
        expect(keptTitles({ ...flags, includeNodeServiceSidecars: true }), `the sidecar test on ${stack} under ${JSON.stringify(flags)}`).not.toContain(TITLE_SIDECAR);
      }
    }
  });
});

/** The name of the helper whose use makes a spec need the Firebird sidecar, and the tag every test of such a spec must wear. */
const SIDECAR_HELPER = "firebirdConnection";
const SIDECAR_TAG_KEY = "NODE_SERVICE_SIDECAR";

/** True when the expression, or any expression inside it, is `TAGS.NODE_SERVICE_SIDECAR` or the string `"@node-service-sidecar"`. Comments are no nodes. */
function mentionsSidecarTag(node: ts.Node): boolean {
  if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === TAGS_OBJECT_NAME && node.name.text === SIDECAR_TAG_KEY) return true;
  if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && node.text === TAGS.NODE_SERVICE_SIDECAR) return true;
  return ts.forEachChild(node, mentionsSidecarTag) ?? false;
}

/** Whether a details argument tags the test: an object literal with a `tag` property that mentions the tag (a variable is not followed: it counts as untagged). */
function detailsTagWithSidecar(details: ts.Expression): boolean {
  return (
    ts.isObjectLiteralExpression(details) &&
    details.properties.some(
      (property) => ts.isPropertyAssignment(property) && (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) && property.name.text === "tag" && mentionsSidecarTag(property.initializer),
    )
  );
}

/**
 * The tests of a spec source that does not wear `TAGS.NODE_SERVICE_SIDECAR`, when the source uses `firebirdConnection` (a spec that needs the
 * sidecar: untagged, its tests would run in the default run, where the sidecar is not started). A source that does not use the helper
 * reports nothing. A tag on an enclosing `test.describe*(title, details, body)` counts for every test inside. Each result is `line <n>`.
 * Limits: the same as `untaggedSuperAdminTests` (a `test` passed through a parameter is not recognised, a tag through a variable is not followed).
 */
function untaggedSidecarTests(source: string, fileName = "synthetic.spec.ts"): string[] {
  const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  if (!source.includes(`${SIDECAR_HELPER}(`)) return [];
  const untagged: string[] = [];
  const testNames = localTestNames(file);
  const visit = (node: ts.Node, tagged: boolean): void => {
    let childrenTagged = tagged;
    if (ts.isCallExpression(node)) {
      const chain = callChain(node.expression);
      if (chain !== undefined && testNames.has(chain[0] as string)) {
        const form = chain[1];
        const args = [...node.arguments];
        const fn = args.filter((arg): arg is ts.ArrowFunction | ts.FunctionExpression => ts.isArrowFunction(arg) || ts.isFunctionExpression(arg)).at(-1);
        const isDescribe = form === "describe" && chain[chain.length - 1] !== "configure";
        const isTest = chain.length === 1 || (chain.length === 2 && form !== undefined && TEST_FORMS.has(form));
        const ownTag = args.slice(1).filter((arg) => arg !== fn).some(detailsTagWithSidecar);
        if (isDescribe) {
          childrenTagged = tagged || ownTag;
        } else if (isTest && fn && !(tagged || ownTag)) {
          untagged.push(`line ${file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1}`);
        }
      }
    }
    ts.forEachChild(node, (child) => visit(child, childrenTagged));
  };
  visit(file, false);
  return untagged;
}

test.describe("run selection: every test that needs the Firebird sidecar carries the opt-in tag", () => {
  test("every spec that uses firebirdConnection tags all its tests with TAGS.NODE_SERVICE_SIDECAR, and the Firebird spec does use it", () => {
    const untagged: string[] = [];
    const users: string[] = [];
    for (const file of specFilesUnder(join(__dirname, ".."))) {
      const source = readFileSync(file, "utf8");
      if (file.includes(`${join("tests", "foundation")}`)) continue;
      if (source.includes(`${SIDECAR_HELPER}(`)) users.push(file);
      untagged.push(...untaggedSidecarTests(source, file).map((entry) => `${file}: ${entry}`));
    }

    expect(users.map((file) => file.split("tests/")[1]), "the specs that use the helper (a positive control that the guard looks at the Firebird spec)").toEqual(["datasource/plugin-firebird.spec.ts"]);
    expect(untagged, "tests of a Firebird spec without TAGS.NODE_SERVICE_SIDECAR (they would run, and fail, in the default run)").toEqual([]);
  });

  test("the guard accepts a describe tag and a test tag, and reports an untagged test, a tag in a comment or a title, and a tag through a variable", () => {
    const use = `const c = ${SIDECAR_HELPER}();\n`;
    expect(untaggedSidecarTests(`${use}test.describe("g", { tag: [TAGS.NODE_SERVICE, TAGS.NODE_SERVICE_SIDECAR] }, () => { test("a", async () => {}); });`), "describe tag").toEqual([]);
    expect(untaggedSidecarTests(`${use}test("a", { tag: TAGS.NODE_SERVICE_SIDECAR }, async () => {});`), "test tag").toEqual([]);
    expect(untaggedSidecarTests(`${use}test("a", async () => {});`), "untagged").toEqual(["line 2"]);
    expect(untaggedSidecarTests(`${use}test.describe("g", { tag: [TAGS.NODE_SERVICE] }, () => { test("a", async () => {}); });`), "only the selection tag").toEqual(["line 2"]);
    expect(untaggedSidecarTests(`${use}// TAGS.NODE_SERVICE_SIDECAR\ntest("uses @node-service-sidecar in its title", async () => {});`), "comment and title").toEqual(["line 3"]);
    expect(untaggedSidecarTests(`${use}const D = { tag: [TAGS.NODE_SERVICE_SIDECAR] };\ntest("a", D, async () => {});`), "a variable is not followed").toEqual(["line 3"]);
    expect(untaggedSidecarTests(`test("a", async () => {});`), "a spec that does not use the helper is not asked").toEqual([]);
  });
});
