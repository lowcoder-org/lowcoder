import { defineConfig, devices } from "@playwright/test";
import { grepFor, grepInvertFor, runFlagsFromEnv } from "./src/run-selection";

/** Origin of the Lowcoder instance under test. The run script sets it to the app container on the Docker network. */
const BASE_URL = process.env.LOWCODER_BASE_URL;
if (!BASE_URL) {
  throw new Error("LOWCODER_BASE_URL is not set. Run the suite through e2e/scripts/run-in-docker.sh.");
}

const IS_CI = !!process.env.CI;
const TEST_TIMEOUT_MS = 60_000;
const EXPECT_TIMEOUT_MS = 15_000;
/** The insert panel and the canvas fit without scrolling at this size. */
const VIEWPORT = { width: 1600, height: 1000 };
const CI_RETRIES = 1;
/**
 * Parallel workers. Four is what the editor's save race was measured with; with many more the machine is loaded so
 * much that tests become slow and time out.
 */
const DEFAULT_WORKERS = 4;

/**
 * Tests tagged @quarantine (known defects), @insert-all (the 112-test insert smoke test) and @superadmin (the instance
 * super admin tests) run only on request, each with its own variable, E2E_INCLUDE_QUARANTINE, E2E_INCLUDE_INSERT_ALL and
 * E2E_INCLUDE_SUPERADMIN; see src/run-selection.ts.
 */
const RUN_FLAGS_OF_ENV = runFlagsFromEnv(process.env);
const GREP_INVERT = grepInvertFor(RUN_FLAGS_OF_ENV);
/** On the enterprise stack (E2E_STACK_PROFILE=enterprise) only the @enterprise tests run; on the default stack none of them does. */
const GREP = grepFor(RUN_FLAGS_OF_ENV);

export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  fullyParallel: true,
  grep: GREP,
  grepInvert: GREP_INVERT,
  workers: Number(process.env.E2E_WORKERS || DEFAULT_WORKERS),
  forbidOnly: IS_CI,
  retries: IS_CI ? CI_RETRIES : 0,
  timeout: TEST_TIMEOUT_MS,
  expect: { timeout: EXPECT_TIMEOUT_MS },
  reporter: [
    ["list"],
    ["html", { outputFolder: "./playwright-report", open: "never" }],
    ["junit", { outputFile: "./test-results/junit.xml" }],
    // Fails the run when more than half of the tests of S1 or M3 needed a D-3 retry.
    ["./src/reporters/d3-threshold-reporter.ts"],
  ],
  use: {
    baseURL: BASE_URL,
    // With service workers blocked, every request of the page goes through the context route of the network guard.
    serviceWorkers: "block",
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    viewport: VIEWPORT,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: VIEWPORT } }],
});
