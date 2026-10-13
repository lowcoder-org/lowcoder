const { createHmac, timingSafeEqual } = require("node:crypto");

const ID_PATTERN = /^[a-zA-Z0-9_-]{1,80}$/;

function configuredOrigin(value) {
  const url = new URL(value);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error("Preview origins must be HTTP(S) origins");
  return url.origin;
}

// No credentials, executable preload, queries or event handlers enter the renderer.
// Expressions can still evaluate the app's static component values in the isolated browser.
function staticDsl(value) {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(staticDsl);
  const result = {};
  for (const [key, item] of Object.entries(value)) {
    if (["queries", "transformers", "dataResponders", "hooks", "events"].includes(key))
      result[key] = [];
    else if (key === "preload")
      result[key] = Object.fromEntries(
        ["css", "globalCSS"]
          .filter((name) => typeof item?.[name] === "string")
          .map((name) => [name, item[name]]),
      );
    else result[key] = staticDsl(item);
  }
  return result;
}

function capturePayload(view) {
  const settings = view.orgCommonSettings || {};
  return {
    applicationInfoView: {
      applicationId: view.applicationInfoView.applicationId,
      applicationType: view.applicationInfoView.applicationType,
      name: view.applicationInfoView.name,
    },
    applicationDSL: staticDsl(view.applicationDSL),
    moduleDSL: staticDsl(view.moduleDSL || {}),
    orgCommonSettings: {
      themeList: settings.themeList || [],
      ...(settings.defaultTheme ? { defaultTheme: settings.defaultTheme } : {}),
    },
  };
}

function allowCaptureRequest(rawUrl, method, resourceType, rendererOrigin) {
  if (method !== "GET") return false;
  const url = new URL(rawUrl);
  if (url.origin !== rendererOrigin || !["http:", "https:"].includes(url.protocol)) return false;
  if (url.pathname === "/marketplace-preview.html") return resourceType === "document";
  if (url.pathname === "/__marketplace_capture_payload__") return resourceType === "fetch";
  if (!["script", "stylesheet", "font", "image", "other"].includes(resourceType)) return false;
  // Official built-in component bundles are served by the existing npm asset proxy.
  // No arbitrary packages, app credentials or application API calls are allowed.
  if (
    resourceType === "script" &&
    /^\/api\/npm\/package\/none\/lowcoder-comps@(?:latest|[0-9][0-9a-zA-Z.+-]*)\/[a-zA-Z0-9_./-]+\.js$/.test(
      url.pathname,
    )
  )
    return !url.pathname.includes("..");
  // Only frontend bundles/assets. Never the API, proxy or node-service query routes.
  return (
    /^\/(?:static\/|assets\/|src\/|node_modules\/|@(?:vite|id|fs|react-refresh)(?:\/|$))/.test(
      url.pathname,
    ) || /^\/[^/]+\.(?:js|css|woff2?|ttf|png|jpe?g|svg|webp|ico)$/.test(url.pathname)
  );
}

function createChromiumCapture(rendererOrigin) {
  let browserPromise;
  async function getBrowser() {
    if (!browserPromise) {
      const { chromium } = require("playwright");
      browserPromise = chromium
        .launch({
          headless: true,
          executablePath: process.env.LOWCODER_PREVIEW_CHROMIUM_PATH || undefined,
          // Sandbox stays enabled. Containers run this service as the lowcoder user.
          chromiumSandbox: true,
          args: ["--force-webrtc-ip-handling-policy=disable_non_proxied_udp"],
        })
        .then((browser) => {
          browser.on("disconnected", () => {
            browserPromise = undefined;
          });
          return browser;
        })
        .catch((error) => {
          browserPromise = undefined;
          throw error;
        });
    }
    return browserPromise;
  }
  return async (payload) => {
    const browser = await getBrowser();
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1,
      serviceWorkers: "block",
      acceptDownloads: false,
      reducedMotion: "reduce",
    });
    const deadline = setTimeout(() => {
      context.close().catch(() => {});
    }, 65000);
    try {
      await context.routeWebSocket("**/*", (socket) => socket.close());
      await context.route("**/*", async (route) => {
        try {
          const request = route.request();
          if (
            !allowCaptureRequest(
              request.url(),
              request.method(),
              request.resourceType(),
              rendererOrigin,
            )
          )
            return await route.abort();
          if (new URL(request.url()).pathname === "/__marketplace_capture_payload__")
            return await route.fulfill({ json: payload });
          // Do not allow an asset redirect to become an unrestricted network request.
          const response = await route.fetch({ maxRedirects: 0, timeout: 15000 });
          if (response.status() >= 300 && response.status() < 400) return await route.abort();
          await route.fulfill({ response });
        } catch {
          // A timed-out asset or closed context must fail this capture, not the service.
          await route.abort().catch(() => {});
        }
      });
      const page = await context.newPage();
      page.on("pageerror", (error) => console.warn("Capture renderer error:", error.message));
      page.on("console", (message) => {
        if (message.text().startsWith("Error during remote component loading"))
          console.warn("Capture component error:", message.text());
      });
      page.on("requestfailed", (request) => {
        if (request.resourceType() === "script")
          console.warn("Capture script unavailable:", new URL(request.url()).pathname);
      });
      context.on("page", (popup) => {
        if (popup !== page) popup.close().catch(() => {});
      });
      await page.goto(`${rendererOrigin}/marketplace-preview.html`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      await page.waitForSelector(
        '[data-marketplace-capture-ready="true"], [data-marketplace-capture-error]',
        { timeout: 30000 },
      );
      if (await page.locator("[data-marketplace-capture-error]").count())
        throw new Error("App layout could not be rendered");
      await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
      await page.evaluate(() =>
        Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 2000))]),
      );
      await page.waitForFunction(
        () => !document.querySelector("#marketplace-canvas .ant-skeleton"),
        null,
        { timeout: 20000 },
      );
      await page.waitForTimeout(1000);
      if (await page.locator("[data-marketplace-capture-error]").count())
        throw new Error("App layout could not be rendered");
      return await page.screenshot({
        type: "jpeg",
        quality: 78,
        animations: "disabled",
        timeout: 5000,
      });
    } finally {
      clearTimeout(deadline);
      await context.close().catch(() => {});
    }
  };
}

// Only the owning API's durable worker may request a render. Browsers never call this.
function createMarketplaceRenderHandler(options = {}) {
  const secret = options.secret ?? process.env.LOWCODER_NODE_SERVICE_SECRET;
  const rendererOrigin = configuredOrigin(
    options.rendererOrigin || process.env.LOWCODER_PREVIEW_FRONTEND_URL || "http://localhost:3000",
  );
  const capture = options.capture || createChromiumCapture(rendererOrigin);
  let active = 0;
  return async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const { timestamp, payload, signature } = req.body || {};
    if (!secret) return res.status(503).json({ status: "not_configured" });
    if (!Number.isSafeInteger(timestamp) || Math.abs(Date.now() - timestamp) > 90000 ||
        typeof payload !== "string" || Buffer.byteLength(payload) > 10 * 1024 * 1024 ||
        typeof signature !== "string" || !/^[a-f0-9]{64}$/.test(signature))
      return res.status(401).json({ status: "unauthorized" });
    const expected = createHmac("sha256", secret).update(`${timestamp}\n${payload}`).digest();
    if (!timingSafeEqual(expected, Buffer.from(signature, "hex")))
      return res.status(401).json({ status: "unauthorized" });
    if (active >= 2) return res.status(429).set("Retry-After", "10").json({ status: "busy" });
    let view;
    try {
      view = JSON.parse(payload);
      if (!ID_PATTERN.test(view.applicationInfoView?.applicationId) ||
          !view.applicationDSL || typeof view.applicationDSL !== "object") throw new Error();
      view = capturePayload(view);
    } catch {
      return res.status(400).json({ status: "invalid_payload" });
    }
    active++;
    try {
      const bytes = await capture(view);
      if (!Buffer.isBuffer(bytes) || bytes.length > 2 * 1024 * 1024 ||
          bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error("Invalid preview image");
      return res.status(200).type("jpeg").send(bytes);
    } catch (error) {
      console.warn("Marketplace render failed:", error.message);
      return res.status(503).json({ status: "unavailable" });
    } finally {
      active--;
    }
  };
}

module.exports = {
  createMarketplaceRenderHandler,
  staticDsl,
  capturePayload,
  allowCaptureRequest,
  configuredOrigin,
};
