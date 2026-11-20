import { API_PATHS, BLOCKED_BY_CLIENT_ERROR, LOWCODER_CLOUD_FLOW_URL, LOWCODER_CLOUD_WS_URL, TAGS, UI_PATHS } from "../../src/constants";
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
      async ({ blockedUrl, allowedPath, blockedSocketUrl }) => {
        const blocked = await fetch(blockedUrl, { mode: "no-cors" }).then(
          () => "reached",
          () => "failed",
        );
        const allowed = await fetch(allowedPath).then((response) => response.status);
        const socket = await new Promise<string>((resolve) => {
          const ws = new WebSocket(blockedSocketUrl);
          ws.onopen = () => resolve("open");
          ws.onclose = () => resolve("closed");
          ws.onerror = () => resolve("error");
        });
        return { blocked, allowed, socket };
      },
      { blockedUrl: LOWCODER_CLOUD_FLOW_URL, allowedPath: API_PATHS.CURRENT_USER, blockedSocketUrl: LOWCODER_CLOUD_WS_URL },
    );

    expect(outcomes.blocked, "request to lowcoder.cloud").toBe("failed");
    expect(outcomes.allowed, "request to the app under test").toBeLessThan(500);
    expect(
      // Chromium appends ".Inspector" to the error text of a request that a Playwright route aborted
      failures.find((failure) => failure.url === LOWCODER_CLOUD_FLOW_URL)?.errorText ?? "",
      "the request failed because the guard aborted it, not because of the network",
    ).toContain(BLOCKED_BY_CLIENT_ERROR);
    expect(outcomes.socket, "WebSocket to lowcoder.cloud").not.toBe("open");
    expect(networkGuard.blockedUrls).toContain(LOWCODER_CLOUD_FLOW_URL);
    expect(
      networkGuard.blockedUrls.some((url) => url.startsWith(LOWCODER_CLOUD_WS_URL)),
      "the guard blocked and recorded the WebSocket",
    ).toBe(true);
  });
});
