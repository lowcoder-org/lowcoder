"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerWebsiteProxy = registerWebsiteProxy;
const express_1 = __importDefault(require("express"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_url_1 = require("node:url");
const auth_1 = require("./auth");
const websiteAllowlist_1 = require("./websiteAllowlist");
const websiteUrls_1 = require("./websiteUrls");
const websiteSession_1 = require("./websiteSession");
const BRIDGE_PATH = "/proxy/website-bridge.js";
const HOCUSPOCUS_URL = (process.env.LOWCODER_HOCUSPOCUS_URL ?? "ws://localhost:3006").trim();
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
const RATE_LIMIT_PER_MINUTE = Number(process.env.LOWCODER_PROXY_RATE_LIMIT ?? 120);
const requestBuckets = new Map();
function registerWebsiteProxy(app) {
    app.get(BRIDGE_PATH, (_req, res) => {
        const bridgePath = node_path_1.default.join(__dirname, "bridge", "website-bridge.js");
        if (!node_fs_1.default.existsSync(bridgePath)) {
            res.status(404).type("text/plain").send("Website bridge script not found");
            return;
        }
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache");
        res.send(node_fs_1.default.readFileSync(bridgePath, "utf8"));
    });
    const router = express_1.default.Router();
    router.post("/session", express_1.default.json({ limit: "1mb" }), websiteSession_1.createWebsiteProxySession);
    router.post("/session/join", express_1.default.json({ limit: "1mb" }), websiteSession_1.joinWebsiteProxySession);
    router.use(express_1.default.raw({ type: "*/*", limit: "25mb" }), async (req, res) => {
        if (req.path === "/session" || req.path === "/session/join") {
            res.status(405).json({
                message: "Use POST on /proxy/website/session or /proxy/website/session/join",
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
            const upstreamResponse = await (0, node_fetch_1.default)(upstreamUrl.toString(), {
                method: req.method,
                redirect: "manual",
                headers: buildForwardHeaders(req, upstreamUrl),
                body: hasBody(req.method) ? req.body : undefined,
            });
            relayHeaders(upstreamResponse, res, req, upstreamUrl);
            const contentType = upstreamResponse.headers.get("content-type") ?? "";
            if (contentType.includes("text/html")) {
                const html = await upstreamResponse.text();
                res
                    .status(upstreamResponse.status)
                    .send(injectBridgeAndRewriteHtml(html, req, upstreamUrl));
                return;
            }
            if (/javascript|json|text\/css/.test(contentType)) {
                const text = await upstreamResponse.text();
                res.status(upstreamResponse.status).send(rewriteBodyUrls(text, req, upstreamUrl));
                return;
            }
            res.status(upstreamResponse.status).send(await upstreamResponse.buffer());
        }
        catch (error) {
            console.error("Website proxy request failed", error);
            const message = error instanceof Error ? error.message : "Website proxy request failed";
            const status = message.includes("not allowed") || message.includes("required") ? 400 : 502;
            res.status(status).json({ message });
        }
    });
    app.use(websiteUrls_1.WEBSITE_PROXY_PREFIX, router);
}
function hasBody(method) {
    return ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
}
function resolveUpstreamUrl(req) {
    const targetParam = req.query.target?.trim();
    if (!targetParam) {
        throw new Error("A website target URL is required");
    }
    const upstream = new node_url_1.URL(targetParam);
    (0, websiteAllowlist_1.assertAllowedWebsiteUrl)(upstream);
    return upstream;
}
function buildForwardHeaders(req, upstreamUrl) {
    const normalized = new Map();
    Object.entries(req.headers).forEach(([key, value]) => {
        if (typeof value !== "string")
            return;
        const lower = key.toLowerCase();
        if (["host", "content-length", "x-forwarded-host", "x-forwarded-proto", "connection"].includes(lower)) {
            return;
        }
        normalized.set(lower, value);
    });
    normalized.set("host", upstreamUrl.host);
    normalized.set("origin", upstreamUrl.origin);
    normalized.set("referer", upstreamUrl.toString());
    return Object.fromEntries(normalized.entries());
}
function relayHeaders(upstreamResponse, res, req, upstreamUrl) {
    const skipHeaders = new Set([
        "x-frame-options",
        "content-security-policy",
        "transfer-encoding",
        "content-length",
        "content-encoding",
    ]);
    upstreamResponse.headers.forEach((value, key) => {
        const lower = key.toLowerCase();
        if (skipHeaders.has(lower))
            return;
        if (lower === "set-cookie") {
            const cookies = rewriteSetCookie(value);
            if (cookies.length > 0)
                res.setHeader("Set-Cookie", cookies);
            return;
        }
        if (lower === "location") {
            res.setHeader(key, rewriteAbsoluteUrl(value, req, upstreamUrl));
            return;
        }
        res.setHeader(key, value);
    });
    res.setHeader("Content-Security-Policy", "frame-ancestors 'self';");
}
function rewriteSetCookie(rawValue) {
    return rawValue
        .split(/,(?=[^;]+=[^;]+)/)
        .map((cookie) => cookie
        .replace(/;\s*Domain=[^;]+/gi, "")
        .replace(/;\s*SameSite=None/gi, "; SameSite=Lax")
        .replace(/;\s*Path=[^;]+/gi, `; Path=${websiteUrls_1.WEBSITE_PROXY_PREFIX}`));
}
function injectBridgeAndRewriteHtml(html, req, upstreamUrl) {
    const rewritten = rewriteBodyUrls(html, req, upstreamUrl);
    const hocuspocusUrl = resolveHocuspocusUrl(req);
    const collab = String(req.query.collab ?? "").trim();
    const attrs = ` data-lowcoder-room-id="${escapeHtml(String(req.query.roomId ?? ""))}"` +
        ` data-lowcoder-role="${escapeHtml(String(req.query.role ?? "driver"))}"` +
        ` data-lowcoder-editor-id="${escapeHtml(String(req.query.editorId ?? "local"))}"` +
        ` data-lowcoder-collab-id="${escapeHtml(collab)}"` +
        ` data-lowcoder-username="${escapeHtml(String(req.query.username ?? ""))}"` +
        ` data-lowcoder-upstream-url="${escapeHtml(upstreamUrl.toString())}"` +
        ` data-lowcoder-hocuspocus-url="${escapeHtml(hocuspocusUrl)}"` +
        (HOCUSPOCUS_SECRET
            ? ` data-lowcoder-hocuspocus-token="${escapeHtml(HOCUSPOCUS_SECRET)}"`
            : "");
    const withRootAttrs = rewritten.replace(/<html(\s|>)/i, `<html${attrs}$1`);
    const hocuspocusConfig = JSON.stringify({
        url: hocuspocusUrl,
        token: HOCUSPOCUS_SECRET || undefined,
    });
    const bridgeTag = `<script>window.__LOWCODER_HOCUSPOCUS__=${hocuspocusConfig};</script>` +
        `<script src="${BRIDGE_PATH}"></script>`;
    return /<\/head>/i.test(withRootAttrs)
        ? withRootAttrs.replace(/<\/head>/i, `${bridgeTag}</head>`)
        : `${bridgeTag}${withRootAttrs}`;
}
function rewriteBodyUrls(body, req, upstreamUrl) {
    const origin = upstreamUrl.origin;
    let output = body.replace(new RegExp(`${escapeRegex(origin)}([^"'\\\\\\s<]*)`, "g"), (_match, suffix) => (0, websiteUrls_1.buildWebsiteProxiedUrlFromRequest)(`${origin}${suffix ?? ""}`, req));
    // Root-relative paths (same origin under the proxy)
    output = output.replace(/(href|src|action)=["'](\/[^"'#?]*(?:\?[^"']*)?(?:#[^"']*)?)["']/gi, (_match, attr, route) => {
        if (route.startsWith("//") || route.startsWith("/proxy/"))
            return _match;
        return `${attr}="${(0, websiteUrls_1.buildWebsiteProxiedUrlFromRequest)(`${origin}${route}`, req)}"`;
    });
    output = output.replace(/url\(["']?(\/[^"')]+)["']?\)/gi, (_match, route) => {
        if (route.startsWith("//") || route.startsWith("/proxy/"))
            return _match;
        return `url("${(0, websiteUrls_1.buildWebsiteProxiedUrlFromRequest)(`${origin}${route}`, req)}")`;
    });
    return output;
}
function rewriteAbsoluteUrl(value, req, upstreamUrl) {
    try {
        const parsed = new node_url_1.URL(value, upstreamUrl);
        if (parsed.origin !== upstreamUrl.origin) {
            return value;
        }
        (0, websiteAllowlist_1.assertAllowedWebsiteUrl)(parsed);
        return (0, websiteUrls_1.buildWebsiteProxiedUrlFromRequest)(parsed.toString(), req);
    }
    catch {
        return value;
    }
}
function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    const token = req.query.token || (0, auth_1.getBearerToken)(req.headers.authorization);
    return (0, auth_1.verifyProxyToken)(token, "website-proxy");
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
