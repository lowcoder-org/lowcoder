import { expect, test } from "@playwright/test";
import type { Suite } from "@playwright/test/reporter";
import config from "../../playwright.config";
import { D3_RETRY_ANNOTATION } from "../../src/constants";
import D3ThresholdReporter, { d3Message, d3Verdicts, type D3TestRecord } from "../../src/reporters/d3-threshold-reporter";

/** The two gated files and their sizes: S1 has 112 tests, M3 is run 10 times (`--repeat-each=10`). */
const S1_FILE = "/checkout/e2e/tests/components/insert-all.spec.ts";
const M3_FILE = "/checkout/e2e/tests/modules/module-editor-host.spec.ts";
const S1_TESTS = 112;
const S1_LIMIT = 56;
const M3_TESTS = 10;
const M3_LIMIT = 5;
const OTHER_FILE = "/checkout/e2e/tests/components/buttons.spec.ts";

/** `count` tests of `file`, the first `retried` of them with the D-3 annotation. */
function tests(file: string, count: number, retried: number, ran = true): D3TestRecord[] {
  return Array.from({ length: count }, (_, index) => ({
    file,
    ran,
    annotationTypes: index < retried ? [D3_RETRY_ANNOTATION] : [],
  }));
}

test.describe("D-3 threshold counting", () => {
  test("S1 passes at 56 of 112 and fails at 57 of 112", () => {
    const atLimit = d3Verdicts(tests(S1_FILE, S1_TESTS, S1_LIMIT));
    const above = d3Verdicts(tests(S1_FILE, S1_TESTS, S1_LIMIT + 1));

    expect(atLimit).toEqual([{ file: "tests/components/insert-all.spec.ts", tests: S1_TESTS, retried: S1_LIMIT, allowed: S1_LIMIT, exceeded: false }]);
    expect(above[0], "one more than half").toMatchObject({ retried: S1_LIMIT + 1, exceeded: true });
  });

  test("M3 passes at 5 of 10 and fails at 6 of 10", () => {
    expect(d3Verdicts(tests(M3_FILE, M3_TESTS, M3_LIMIT))[0], "5 of 10").toMatchObject({ allowed: M3_LIMIT, exceeded: false });
    expect(d3Verdicts(tests(M3_FILE, M3_TESTS, M3_LIMIT + 1))[0], "6 of 10").toMatchObject({ exceeded: true });
  });

  test("the rule is more than half of the tests that ran: a smaller run of the file has a smaller limit", () => {
    expect(d3Verdicts(tests(M3_FILE, 3, 1))[0], "1 of 3").toMatchObject({ allowed: 1, exceeded: false });
    expect(d3Verdicts(tests(M3_FILE, 3, 2))[0], "2 of 3").toMatchObject({ allowed: 1, exceeded: true });
    expect(d3Verdicts(tests(M3_FILE, 1, 1))[0], "1 of 1: a single test that retried is more than half").toMatchObject({ exceeded: true });
  });

  test("tests that did not run, other files and other annotations are not counted", () => {
    const records = [
      ...tests(S1_FILE, 4, 0),
      ...tests(S1_FILE, 10, 10, false),
      ...tests(OTHER_FILE, 10, 10),
      { file: S1_FILE, ran: true, annotationTypes: ["handler retry", "observation"] },
    ];

    const verdicts = d3Verdicts(records);

    expect(verdicts, "only S1 is gated and judged").toHaveLength(1);
    expect(verdicts[0], "5 tests ran, none with a D-3 annotation").toMatchObject({ tests: 5, retried: 0, exceeded: false });
    expect(d3Verdicts(tests(S1_FILE, 5, 5, false)), "a file in which nothing ran is not judged").toEqual([]);
  });

  test("a test counts once however many D-3 annotations it carries", () => {
    const twice: D3TestRecord = { file: M3_FILE, ran: true, annotationTypes: [D3_RETRY_ANNOTATION, D3_RETRY_ANNOTATION] };

    expect(d3Verdicts([twice, ...tests(M3_FILE, 3, 0)])[0]).toMatchObject({ tests: 4, retried: 1, exceeded: false });
  });

  test("paths are matched as a suffix below e2e/, with either separator, and not by a longer file name", () => {
    expect(d3Verdicts(tests("C:\\work\\e2e\\tests\\modules\\module-editor-host.spec.ts", 2, 0)), "windows path").toHaveLength(1);
    expect(d3Verdicts(tests("/x/tests/modules/not-module-editor-host.spec.ts", 2, 2)), "another file name").toEqual([]);
  });

  test("the message names the file, the counts and the outcome", () => {
    const [verdict] = d3Verdicts(tests(S1_FILE, S1_TESTS, S1_LIMIT + 1));

    expect(d3Message(verdict!)).toBe(
      `D-3 gate FAILED: tests/components/insert-all.spec.ts: 57 of 112 tests carry "D-3 retry" (more than 56 fails the run)`,
    );
    expect(d3Message(d3Verdicts(tests(M3_FILE, M3_TESTS, 0))[0]!)).toContain("within the limit");
  });
});

/** A Suite reduced to what the reporter reads. */
function suiteOf(records: D3TestRecord[]): Suite {
  const allTests = records.map((record) => ({
    location: { file: record.file },
    results: [{ status: record.ran ? "passed" : "skipped" }],
    annotations: record.annotationTypes.map((type) => ({ type })),
  }));
  return { allTests: () => allTests } as unknown as Suite;
}

test.describe("D-3 threshold reporter", () => {
  test("onEnd fails the run above the limit and leaves the status alone at or below it", async () => {
    const printed: string[] = [];
    const over = new D3ThresholdReporter({ print: (line) => printed.push(line) });
    over.onBegin(undefined, suiteOf(tests(M3_FILE, M3_TESTS, M3_LIMIT + 1)));
    expect(await over.onEnd(), "6 of 10").toEqual({ status: "failed" });
    expect(printed, "one line for the judged file").toEqual([expect.stringContaining("D-3 gate FAILED: tests/modules/module-editor-host.spec.ts: 6 of 10")]);

    const within = new D3ThresholdReporter({ print: () => undefined });
    within.onBegin(undefined, suiteOf(tests(M3_FILE, M3_TESTS, M3_LIMIT)));
    expect(await within.onEnd(), "5 of 10").toBeUndefined();

    expect(await new D3ThresholdReporter({ print: () => undefined }).onEnd(), "no suite was given").toBeUndefined();
    expect(() => new D3ThresholdReporter(undefined), "Playwright may pass no options").not.toThrow();
  });

  test("playwright.config.ts registers the reporter next to the list, html and junit reporters", () => {
    const reporters = (config.reporter as unknown as [string, unknown?][]).map(([name]) => name);

    expect(reporters.slice(0, 3), "the existing reporters are kept, in order").toEqual(["list", "html", "junit"]);
    expect(reporters, "the D-3 gate").toContain("./src/reporters/d3-threshold-reporter.ts");
  });
});
