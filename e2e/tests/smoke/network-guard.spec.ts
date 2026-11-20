import { API_PATHS, BLOCKED_BY_CLIENT_ERROR, LOWCODER_CLOUD_FLOW_URL, TAGS, UI_PATHS } from "../../src/constants";
import { expect, test } from "../../src/fixtures";

test.describe("network guard", () => {
  test("blocks requests to lowcoder.cloud and lets the app under test through", { tag: TAGS.SMOKE }, async ({
    page,
    networkGuard,
  }) => {
    const failures: { url: string; errorText: string }[] = [];
    page.on("requestfailed", (request) =>
      failures.push({ url: request.url(), errorText: request.failure()?.errorText ?? "" }),
    );
    await page.goto(UI_PATHS.REGISTER);

    const outcomes = await page.evaluate(
      async ({ blockedUrl, allowedPath }) => {
        const blocked = await fetch(blockedUrl, { mode: "no-cors" }).then(
          () => "reached",
          () => "failed",
        );
        const allowed = await fetch(allowedPath).then((response) => response.status);
        return { blocked, allowed };
      },
      { blockedUrl: LOWCODER_CLOUD_FLOW_URL, allowedPath: API_PATHS.CURRENT_USER },
    );

    expect(outcomes.blocked, "request to lowcoder.cloud").toBe("failed");
    expect(outcomes.allowed, "request to the app under test").toBeLessThan(500);
    expect(
      // Chromium appends ".Inspector" to the error text of a request that a Playwright route aborted
      failures.find((failure) => failure.url === LOWCODER_CLOUD_FLOW_URL)?.errorText ?? "",
      "the request failed because the guard aborted it, not because of the network",
    ).toContain(BLOCKED_BY_CLIENT_ERROR);
    expect(networkGuard.blockedUrls).toContain(LOWCODER_CLOUD_FLOW_URL);
  });
});
