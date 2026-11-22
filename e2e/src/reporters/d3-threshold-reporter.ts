import type { FullResult, Reporter, Suite } from "@playwright/test/reporter";
import { D3_RETRY_ANNOTATION } from "../constants";

/**
 * The run-level D-3 gate: a test that lost an editor
 * save and redid its steps on a fresh app (annotation `D-3 retry`) still passes, so no single test shows a systematic
 * regression of the first save. A run fails when MORE THAN HALF of the tests of a gated spec file that ran carry the
 * annotation (S1: more than 56 of 112; M3: more than 5 of 10 runs).
 *
 * Limits: the count is per file and per run of the reporter; a regression that loses fewer than half of the first saves
 * passes (the annotation counts of the runs show it); a file that did not run is not judged; a test counts once however
 * many annotations it carries. The reporter is registered in playwright.config.ts; a `--reporter=...` argument replaces
 * the config's reporters, so a gate run must not pass one (or must list this file in it too).
 */

/** The spec files the gate applies to, as paths below `e2e/` (matched as a path suffix, so the checkout location is free). */
export const D3_GATED_SPEC_FILES = ["tests/components/insert-all.spec.ts", "tests/modules/module-editor-host.spec.ts"] as const;

/** The share of a file's tests that may carry the annotation: more than this share (one half) fails the run. */
export const D3_ALLOWED_SHARE_DENOMINATOR = 2;

/** What the gate needs of one test: where it is, whether it ran, and its annotation types. */
export interface D3TestRecord {
  file: string;
  ran: boolean;
  annotationTypes: readonly string[];
}

/** The count of one gated file. `allowed` is the largest count that passes: `floor(tests / 2)`. */
export interface D3Verdict {
  file: string;
  tests: number;
  retried: number;
  allowed: number;
  exceeded: boolean;
}

function normalise(file: string): string {
  return file.split("\\").join("/");
}

function isGated(file: string, gated: string): boolean {
  return normalise(file).endsWith(`/${gated}`) || normalise(file) === gated;
}

/**
 * Counts, for every gated file in which at least one test ran, the tests that ran and those with a `D-3 retry`
 * annotation. `exceeded` is true when more than half of the ran tests carry it. Pure: no Playwright objects.
 */
export function d3Verdicts(tests: readonly D3TestRecord[], gatedFiles: readonly string[] = D3_GATED_SPEC_FILES): D3Verdict[] {
  const verdicts: D3Verdict[] = [];
  for (const gated of gatedFiles) {
    const ran = tests.filter((test) => test.ran && isGated(test.file, gated));
    if (ran.length === 0) {
      continue;
    }
    const retried = ran.filter((test) => test.annotationTypes.includes(D3_RETRY_ANNOTATION)).length;
    const allowed = Math.floor(ran.length / D3_ALLOWED_SHARE_DENOMINATOR);
    verdicts.push({ file: gated, tests: ran.length, retried, allowed, exceeded: retried > allowed });
  }
  return verdicts;
}

/** The line the reporter prints for a verdict. */
export function d3Message(verdict: D3Verdict): string {
  const state = verdict.exceeded ? "FAILED" : "within the limit";
  return `D-3 gate ${state}: ${verdict.file}: ${verdict.retried} of ${verdict.tests} tests carry "${D3_RETRY_ANNOTATION}" (more than ${verdict.allowed} fails the run)`;
}

/** Playwright reporter: prints one line per gated file that ran and turns the run into a failure when one exceeds its limit. */
export default class D3ThresholdReporter implements Reporter {
  private suite: Suite | undefined;

  private readonly print: (line: string) => void;

  /**
   * Playwright constructs a reporter with the options of its config entry (none here). A test passes `print` to collect
   * the lines; it defaults to stderr.
   */
  constructor(options: { print?: (line: string) => void } = {}) {
    this.print = options.print ?? ((line) => process.stderr.write(`${line}\n`));
  }

  onBegin(_config: unknown, suite: Suite): void {
    this.suite = suite;
  }

  printsToStdio(): boolean {
    return true;
  }

  async onEnd(): Promise<{ status: FullResult["status"] } | undefined> {
    const records: D3TestRecord[] = (this.suite?.allTests() ?? []).map((test) => ({
      file: test.location.file,
      ran: test.results.some((result) => result.status !== "skipped"),
      annotationTypes: test.annotations.map((annotation) => annotation.type),
    }));
    const verdicts = d3Verdicts(records);
    for (const verdict of verdicts) {
      this.print(d3Message(verdict));
    }
    return verdicts.some((verdict) => verdict.exceeded) ? { status: "failed" } : undefined;
  }
}
