"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGoogleFormsProxy = registerGoogleFormsProxy;
const express_1 = __importDefault(require("express"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_url_1 = require("node:url");
const auth_1 = require("./auth");
const googleCookieJar_1 = require("./googleCookieJar");
const googleFormsHosts_1 = require("./googleFormsHosts");
const googleFormsRewrite_1 = require("./googleFormsRewrite");
const googleUrls_1 = require("./googleUrls");
const googleSession_1 = require("./googleSession");
const BRIDGE_PATH = "/proxy/google-forms-bridge.js";
const HOCUSPOCUS_URL = (process.env.LOWCODER_HOCUSPOCUS_URL ?? "ws://localhost:3006").trim();
const FALLBACK_USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) " +
    "Chrome/125.0.0.0 Safari/537.36";
/** Query params the proxy owns; they must never be forwarded to Google. */
const PROXY_CONTROL_PARAMS = new Set([
    "target",
    "roomId",
    "role",
    "editorId",
    "token",
    "collab",
    "username",
    "debug",
]);
/**
 * Request headers the proxy replaces or that would break the upstream fetch.
 * Conditional headers are dropped so Google never answers 304 — a bodyless
 * response cannot be URL-rewritten.
 */
const DROPPED_REQUEST_HEADERS = new Set([
    "host",
    "connection",
    "keep-alive",
    "content-length",
    "accept-encoding",
    "cookie",
    "referer",
    "origin",
    "if-none-match",
    "if-modified-since",
    "upgrade-insecure-requests",
    "x-forwarded-host",
    "x-forwarded-proto",
    "x-forwarded-for",
]);
/** Response headers that would break framing, caching or body rewriting. */
const SKIPPED_RESPONSE_HEADERS = new Set([
    "x-frame-options",
    "content-security-policy",
    "content-security-policy-report-only",
    "cross-origin-opener-policy",
    "cross-origin-embedder-policy",
    "cross-origin-resource-policy",
    "permissions-policy",
    "strict-transport-security",
    "report-to",
    "reporting-endpoints",
    "transfer-encoding",
    "content-length",
    "content-encoding",
    "connection",
    "keep-alive",
    "set-cookie",
]);
function resolveHocuspocusUrl(req) {
    if (!/localhost|127\.0\.0\.1/.test(HOCUSPOCUS_URL)) {
        return HOCUSPOCUS_URL;
    }
    const forwardedHost = (req.get("x-forwarded-host") || req.get("host") || "localhost")
        .split(",")[0]
        .trim();
    const hostname = forwardedHost.split(":")[0] || "localhost";
    const port = new node_url_1.URL(HOCUSPOCUS_URL.replace(/^ws/, "http")).port || "3006";
    return `ws://${hostname}:${port}`;
}
const HOCUSPOCUS_SECRET = (process.env.LOWCODER_HOCUSPOCUS_SECRET ?? process.env.HOCUSPOCUS_SECRET ?? "").trim();
// A single form page fans out into hundreds of proxied asset and XHR requests,
// so the Google proxy needs a much higher ceiling than the Typeform proxy.
const RATE_LIMIT_PER_MINUTE = Number(process.env.LOWCODER_GOOGLE_PROXY_RATE_LIMIT ??
    Math.max(600, Number(process.env.LOWCODER_PROXY_RATE_LIMIT ?? 0) || 0));
const requestBuckets = new Map();
function registerGoogleFormsProxy(app) {
    app.get(BRIDGE_PATH, (_req, res) => {
        const bridgePath = node_path_1.default.join(__dirname, "bridge", "google-forms-bridge.js");
        if (!node_fs_1.default.existsSync(bridgePath)) {
            res.status(404).type("text/plain").send("Google Forms bridge script not found");
            return;
        }
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache");
        res.send(node_fs_1.default.readFileSync(bridgePath, "utf8"));
    });
    const router = express_1.default.Router();
    router.post("/session", express_1.default.json({ limit: "1mb" }), googleSession_1.createGoogleFormsProxySession);
    router.post("/session/join", express_1.default.json({ limit: "1mb" }), googleSession_1.joinGoogleFormsProxySession);
    router.use(express_1.default.raw({ type: "*/*", limit: "25mb" }), async (req, res) => {
        if (req.path === "/session" || req.path === "/session/join") {
            res.status(405).json({
                message: "Use POST on /proxy/google-forms/session or /proxy/google-forms/session/join",
            });
            return;
        }
        try {
            if (!isAuthorized(req)) {
                res.status(401).json({ message: "Missing or invalid proxy token" });
                return;
            }
            if (!checkRateLimit(req)) {
                res.status(429).json({ message: "Proxy rate limit exceeded" });
                return;
            }
            const upstreamUrl = resolveUpstreamUrl(req);
            const sessionKey = resolveSessionKey(req);
            const upstreamResponse = await (0, node_fetch_1.default)(upstreamUrl.toString(), {
                method: req.method,
                redirect: "manual",
                headers: buildForwardHeaders(req, upstreamUrl, sessionKey),
                body: hasBody(req.method) ? req.body : undefined,
            });
            relayHeaders(upstreamResponse, res, req, upstreamUrl, sessionKey);
            const contentType = upstreamResponse.headers.get("content-type") ?? "";
            if (upstreamResponse.status >= 300 && upstreamResponse.status < 400) {
                res.status(upstreamResponse.status).end();
                return;
            }
            if (contentType.includes("text/html")) {
                const html = await upstreamResponse.text();
                res
                    .status(upstreamResponse.status)
                    .send(injectBridgeAndRewriteHtml(html, req, upstreamUrl));
                return;
            }
            if (isRewritableContentType(contentType)) {
                const text = await upstreamResponse.text();
                res.status(upstreamResponse.status).send(rewriteBodyUrls(text, req, upstreamUrl));
                return;
            }
            res.status(upstreamResponse.status).send(await upstreamResponse.buffer());
        }
        catch (error) {
            console.error("Google Forms proxy request failed", error);
            const message = error instanceof Error ? error.message : "Google Forms proxy failed";
            const status = message.includes("not allowed") || message.includes("required") ? 400 : 502;
            res.status(status).json({ message });
        }
    });
    app.use(googleUrls_1.GOOGLE_FORMS_PROXY_PREFIX, router);
}
function hasBody(method) {
    return ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
}
function isRewritableContentType(contentType) {
    return /(text\/html|text\/css|text\/plain|text\/xml|application\/xml|javascript|ecmascript|json)/i.test(contentType);
}
/**
 * Resolves the Google URL for this request. Normal traffic carries an explicit
 * `target`; requests that Google's own scripts build relative to the proxy path
 * fall back to the docs.google.com equivalent of that path.
 */
function resolveUpstreamUrl(req) {
    const targetParam = (0, googleUrls_1.firstQueryValue)(req.query.target).trim();
    if (targetParam) {
        const upstream = new node_url_1.URL(targetParam);
        (0, googleFormsHosts_1.assertAllowedGoogleFormsUrl)(upstream);
        return upstream;
    }
    const relativePath = req.path && req.path !== "/" ? req.path : "";
    if (!relativePath) {
        throw new Error("A Google Forms target URL is required");
    }
    const upstream = new node_url_1.URL(`https://docs.google.com${relativePath}`);
    Object.entries(req.query).forEach(([key, value]) => {
        if (PROXY_CONTROL_PARAMS.has(key))
            return;
        const first = (0, googleUrls_1.firstQueryValue)(value);
        if (first)
            upstream.searchParams.set(key, first);
    });
    (0, googleFormsHosts_1.assertAllowedGoogleFormsUrl)(upstream);
    return upstream;
}
/** Cookie jars are per participant, keyed by the minted proxy token. */
function resolveSessionKey(req) {
    const token = (0, googleUrls_1.firstQueryValue)(req.query.token).trim() || (0, auth_1.getBearerToken)(req.headers.authorization) || "";
    if (token)
        return `token:${token}`;
    const roomId = (0, googleUrls_1.firstQueryValue)(req.query.roomId).trim();
    const collab = (0, googleUrls_1.firstQueryValue)(req.query.collab).trim();
    const editorId = (0, googleUrls_1.firstQueryValue)(req.query.editorId).trim();
    if (roomId || collab || editorId)
        return `room:${roomId}|${collab}|${editorId}`;
    return `ip:${req.ip ?? "unknown"}`;
}
/**
 * Google validates Referer on its XHR endpoints, and the browser only ever
 * sends the proxied page URL. Unwrap that referer back to its Google target.
 */
function resolveUpstreamReferer(req, upstreamUrl) {
    const referer = req.get("referer");
    if (referer) {
        try {
            const parsed = new node_url_1.URL(referer);
            if (parsed.pathname.startsWith(googleUrls_1.GOOGLE_FORMS_PROXY_PREFIX)) {
                const target = parsed.searchParams.get("target");
                if (target) {
                    const targetUrl = new node_url_1.URL(target);
                    if ((0, googleFormsHosts_1.isGoogleFormsHostAllowed)(targetUrl.hostname))
                        return targetUrl.toString();
                }
            }
        }
        catch {
            // fall through to the upstream default
        }
    }
    return `${upstreamUrl.origin}/`;
}
function buildForwardHeaders(req, upstreamUrl, sessionKey) {
    const normalized = new Map();
    Object.entries(req.headers).forEach(([key, value]) => {
        if (typeof value !== "string")
            return;
        const lower = key.toLowerCase();
        if (DROPPED_REQUEST_HEADERS.has(lower))
            return;
        normalized.set(lower, value);
    });
    normalized.set("host", upstreamUrl.host);
    // Rewriting needs an uncompressed body, and brotli support varies by runtime.
    normalized.set("accept-encoding", "identity");
    normalized.set("referer", resolveUpstreamReferer(req, upstreamUrl));
    if (!normalized.has("user-agent")) {
        normalized.set("user-agent", FALLBACK_USER_AGENT);
    }
    if (req.get("origin") || hasBody(req.method)) {
        normalized.set("origin", upstreamUrl.origin);
        normalized.set("sec-fetch-site", "same-origin");
    }
    const cookieHeader = (0, googleCookieJar_1.buildGoogleCookieHeader)(sessionKey, upstreamUrl);
    if (cookieHeader) {
        normalized.set("cookie", cookieHeader);
    }
    return Object.fromEntries(normalized.entries());
}
function relayHeaders(upstreamResponse, res, req, upstreamUrl, sessionKey) {
    // The proxy is Google's HTTP client, so its cookies stay server-side.
    (0, googleCookieJar_1.storeGoogleCookies)(sessionKey, upstreamUrl, upstreamResponse.headers.raw()["set-cookie"]);
    upstreamResponse.headers.forEach((value, key) => {
        const lower = key.toLowerCase();
        if (SKIPPED_RESPONSE_HEADERS.has(lower))
            return;
        if (lower === "location") {
            res.setHeader(key, rewriteAbsoluteUrl(value, req, upstreamUrl));
            return;
        }
        res.setHeader(key, value);
    });
    res.setHeader("Content-Security-Policy", "frame-ancestors 'self';");
}
function injectBridgeAndRewriteHtml(html, req, upstreamUrl) {
    const rewritten = rewriteBodyUrls((0, googleFormsRewrite_1.stripSubresourceIntegrity)(html), req, upstreamUrl);
    const hocuspocusUrl = resolveHocuspocusUrl(req);
    const collab = (0, googleUrls_1.firstQueryValue)(req.query.collab).trim();
    const attrs = ` data-lowcoder-room-id="${escapeHtml((0, googleUrls_1.firstQueryValue)(req.query.roomId))}"` +
        ` data-lowcoder-role="${escapeHtml((0, googleUrls_1.firstQueryValue)(req.query.role) || "driver")}"` +
        ` data-lowcoder-editor-id="${escapeHtml((0, googleUrls_1.firstQueryValue)(req.query.editorId) || "local")}"` +
        ` data-lowcoder-collab-id="${escapeHtml(collab)}"` +
        ` data-lowcoder-username="${escapeHtml((0, googleUrls_1.firstQueryValue)(req.query.username))}"` +
        ` data-lowcoder-upstream-url="${escapeHtml(upstreamUrl.toString())}"` +
        ` data-lowcoder-hocuspocus-url="${escapeHtml(hocuspocusUrl)}"` +
        (HOCUSPOCUS_SECRET
            ? ` data-lowcoder-hocuspocus-token="${escapeHtml(HOCUSPOCUS_SECRET)}"`
            : "");
    const withRootAttrs = rewritten.replace(/<html(\s|>)/i, `<html${attrs}$1`);
    const hocuspocusConfig = toInlineJson({
        url: hocuspocusUrl,
        token: HOCUSPOCUS_SECRET || undefined,
    });
    const proxyRuntimeConfig = toInlineJson({
        prefix: googleUrls_1.GOOGLE_FORMS_PROXY_PREFIX,
        hosts: (0, googleFormsHosts_1.listGoogleFormsHosts)(),
        rootPaths: googleFormsRewrite_1.GOOGLE_ROOT_PATH_PREFIXES,
        upstreamUrl: upstreamUrl.toString(),
        params: {
            roomId: (0, googleUrls_1.firstQueryValue)(req.query.roomId),
            role: (0, googleUrls_1.firstQueryValue)(req.query.role) || "driver",
            editorId: (0, googleUrls_1.firstQueryValue)(req.query.editorId),
            token: (0, googleUrls_1.firstQueryValue)(req.query.token),
            collab,
            username: (0, googleUrls_1.firstQueryValue)(req.query.username),
        },
    });
    const bridgeTag = `<script>window.__LOWCODER_HOCUSPOCUS__=${hocuspocusConfig};` +
        `window.__LOWCODER_GOOGLE_PROXY__=${proxyRuntimeConfig};</script>` +
        `<script src="${BRIDGE_PATH}"></script>`;
    // The bridge has to run before Google's scripts so it can patch fetch/XHR.
    if (/<head[^>]*>/i.test(withRootAttrs)) {
        return withRootAttrs.replace(/<head[^>]*>/i, (match) => `${match}${bridgeTag}`);
    }
    return /<\/head>/i.test(withRootAttrs)
        ? withRootAttrs.replace(/<\/head>/i, `${bridgeTag}</head>`)
        : `${bridgeTag}${withRootAttrs}`;
}
function rewriteBodyUrls(body, req, upstreamUrl) {
    return (0, googleFormsRewrite_1.rewriteGoogleFormsBody)(body, {
        upstreamUrl,
        toProxied: (absoluteUrl) => (0, googleUrls_1.buildGoogleFormsProxiedUrlFromRequest)(absoluteUrl, req),
    });
}
function rewriteAbsoluteUrl(value, req, upstreamUrl) {
    try {
        const parsed = new node_url_1.URL(value, upstreamUrl);
        (0, googleFormsHosts_1.assertAllowedGoogleFormsUrl)(parsed);
        return (0, googleUrls_1.buildGoogleFormsProxiedUrlFromRequest)(parsed.toString(), req);
    }
    catch {
        return value;
    }
}
function toInlineJson(value) {
    return JSON.stringify(value).replace(/</g, "\\u003c");
}
function escapeHtml(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
function isAuthorized(req) {
    const token = (0, googleUrls_1.firstQueryValue)(req.query.token) || (0, auth_1.getBearerToken)(req.headers.authorization);
    return (0, auth_1.verifyProxyToken)(token, "google-forms-proxy");
}
function checkRateLimit(req) {
    const key = req.ip || "unknown";
    const now = Date.now();
    const existing = requestBuckets.get(key);
    if (!existing || now > existing.resetAt) {
        requestBuckets.set(key, { count: 1, resetAt: now + 60_000 });
        return true;
    }
    existing.count += 1;
    return existing.count <= RATE_LIMIT_PER_MINUTE;
}
