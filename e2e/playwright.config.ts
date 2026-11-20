import { defineConfig, devices } from "@playwright/test";

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

/** Tests tagged @quarantine expose known defects and fail on purpose-built baselines; they run only on request. */
const INCLUDE_QUARANTINE = !!process.env.E2E_INCLUDE_QUARANTINE;

export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  fullyParallel: true,
  grepInvert: INCLUDE_QUARANTINE ? undefined : /@quarantine/,
  workers: Number(process.env.E2E_WORKERS || DEFAULT_WORKERS),
  forbidOnly: IS_CI,
  retries: IS_CI ? CI_RETRIES : 0,
  timeout: TEST_TIMEOUT_MS,
  expect: { timeout: EXPECT_TIMEOUT_MS },
  reporter: [
    ["list"],
    ["html", { outputFolder: "./playwright-report", open: "never" }],
    ["junit", { outputFile: "./test-results/junit.xml" }],
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
