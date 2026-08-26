"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_url_1 = require("node:url");
const node_http_1 = require("node:http");
const session_1 = require("./session");
const auth_1 = require("./auth");
const urls_1 = require("./urls");
const googleProxy_1 = require("./googleProxy");
const websiteProxy_1 = require("./websiteProxy");
const PORT = Number(process.env.PROXY_SERVICE_PORT ?? 6070);
const LOWCODER_PUBLIC_URL = (process.env.LOWCODER_PUBLIC_URL ?? "http://localhost:3000").replace(/\/$/, "");
const HOCUSPOCUS_URL = (process.env.LOWCODER_HOCUSPOCUS_URL ?? "ws://localhost:3006").trim();
const HOCUSPOCUS_SECRET = (process.env.LOWCODER_HOCUSPOCUS_SECRET ?? process.env.HOCUSPOCUS_SECRET ?? "").trim();
const RATE_LIMIT_PER_MINUTE = Number(process.env.LOWCODER_PROXY_RATE_LIMIT ?? 120);
const ALLOWED_TYPEFORM_HOSTS = new Set((process.env.LOWCODER_PROXY_ALLOWED_HOSTS ?? "form.typeform.com,embed.typeform.com,admin.typeform.com")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean));
const SESSION_PATH = `${urls_1.PROXY_PREFIX}/session`;
const JOIN_SESSION_PATH = `${urls_1.PROXY_PREFIX}/session/join`;
const BRIDGE_PATH = "/proxy/typeform-bridge.js";
const requestBuckets = new Map();
const app = (0, express_1.default)();
app.disable("x-powered-by");
app.use((0, cors_1.default)({ credentials: true, origin: true }));
app.get("/", (_req, res) => {
    res.status(200).json({ code: 1, message: "Lowcoder Proxy Service is up and running", success: true });
});
(0, googleProxy_1.registerGoogleFormsProxy)(app);
(0, websiteProxy_1.registerWebsiteProxy)(app);
app.get(BRIDGE_PATH, (_req, res) => {
    const bridgePath = node_path_1.default.join(__dirname, "bridge", "typeform-bridge.js");
    if (!node_fs_1.default.existsSync(bridgePath)) {
        res.status(404).type("text/plain").send("Bridge script not found");
        return;
    }
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.send(node_fs_1.default.readFileSync(bridgePath, "utf8"));
});
app.post(SESSION_PATH, express_1.default.json({ limit: "1mb" }), session_1.createProxySession);
app.post(JOIN_SESSION_PATH, express_1.default.json({ limit: "1mb" }), session_1.joinProxySession);
app.use(urls_1.PROXY_PREFIX, express_1.default.raw({ type: "*/*", limit: "25mb" }), async (req, res) => {
    if (req.path === "/session" || req.path === "/session/join") {
        res.status(405).json({ message: "Use POST on /proxy/typeform/session or /proxy/typeform/session/join" });
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
        relayHeaders(upstreamResponse, res, req);
        const contentType = upstreamResponse.headers.get("content-type") ?? "";
        if (contentType.includes("text/html")) {
            const html = await upstreamResponse.text();
            res.status(upstreamResponse.status).send(injectBridgeAndRewriteHtml(html, req, upstreamUrl));
            return;
        }
        if (contentType.includes("application/json") || contentType.includes("text/javascript")) {
            const text = await upstreamResponse.text();
            res.status(upstreamResponse.status).send(rewriteBodyUrls(text, req, upstreamUrl));
            return;
        }
        const buffer = await upstreamResponse.buffer();
        res.status(upstreamResponse.status).send(buffer);
    }
    catch (error) {
        console.error("Proxy request failed", error);
        res.status(502).json({ message: "Typeform proxy request failed" });
    }
});
const httpServer = (0, node_http_1.createServer)(app);
httpServer.listen(PORT, () => {
    console.log(`Proxy service listening on ${PORT}`);
});
function hasBody(method) {
    return ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
}
function resolveUpstreamUrl(req) {
    const targetParam = req.query.target?.trim();
    if (targetParam) {
        const upstream = new node_url_1.URL(targetParam);
        assertAllowedHost(upstream.hostname);
        return upstream;
    }
    const rawPath = req.originalUrl.replace(urls_1.PROXY_PREFIX, "");
    const [pathname, query = ""] = rawPath.split("?");
    const cleanPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
    const upstream = new node_url_1.URL(`https://form.typeform.com${cleanPath}${query ? `?${query}` : ""}`);
    assertAllowedHost(upstream.hostname);
    return upstream;
}
function assertAllowedHost(hostname) {
    if (!ALLOWED_TYPEFORM_HOSTS.has(hostname)) {
        throw new Error(`Host is not allowed: ${hostname}`);
    }
}
function buildForwardHeaders(req, upstreamUrl) {
    const normalized = new Map();
    Object.entries(req.headers).forEach(([key, value]) => {
        if (typeof value !== "string")
            return;
        const lower = key.toLowerCase();
        if (["host", "content-length", "x-forwarded-host", "x-forwarded-proto", "connection"].includes(lower))
            return;
        normalized.set(lower, value);
    });
    normalized.set("host", upstreamUrl.host);
    normalized.set("origin", `${upstreamUrl.protocol}//${upstreamUrl.host}`);
    return Object.fromEntries(normalized.entries());
}
function relayHeaders(upstreamResponse, res, req) {
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
            res.setHeader(key, rewriteAbsoluteUrl(value, req));
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
        .replace(/;\s*Path=[^;]+/gi, "; Path=/proxy/typeform"));
}
function injectBridgeAndRewriteHtml(html, req, upstreamUrl) {
    const rewritten = rewriteBodyUrls(html, req, upstreamUrl);
    const roomId = String(req.query.roomId ?? "");
    const role = String(req.query.role ?? "driver");
    const editorId = String(req.query.editorId ?? "local");
    const collabId = String(req.query.collab ?? "");
    const username = String(req.query.username ?? "");
    const attrs = ` data-lowcoder-room-id="${escapeHtml(roomId)}"` +
        ` data-lowcoder-role="${escapeHtml(role)}"` +
        ` data-lowcoder-editor-id="${escapeHtml(editorId)}"` +
        ` data-lowcoder-collab-id="${escapeHtml(collabId)}"` +
        ` data-lowcoder-username="${escapeHtml(username)}"` +
        ` data-lowcoder-hocuspocus-url="${escapeHtml(HOCUSPOCUS_URL)}"` +
        (HOCUSPOCUS_SECRET ? ` data-lowcoder-hocuspocus-token="${escapeHtml(HOCUSPOCUS_SECRET)}"` : "");
    const withRootAttrs = rewritten.replace("<html", `<html${attrs}`);
    const hocuspocusConfig = JSON.stringify({
        url: HOCUSPOCUS_URL,
        token: HOCUSPOCUS_SECRET || undefined,
    });
    const bridgeTag = `<script>window.__LOWCODER_HOCUSPOCUS__=${hocuspocusConfig};</script>` +
        `<script src="${BRIDGE_PATH}"></script>`;
    if (withRootAttrs.includes("</head>")) {
        return withRootAttrs.replace("</head>", `${bridgeTag}</head>`);
    }
    return `${bridgeTag}${withRootAttrs}`;
}
function rewriteBodyUrls(body, req, upstreamUrl) {
    const base = upstreamUrl ?? new node_url_1.URL("https://form.typeform.com");
    const origin = base.origin;
    let output = body.replace(new RegExp(`${escapeRegex(origin)}([^"'\\s]*)`, "g"), (_match, suffix) => (0, urls_1.buildProxiedUrlFromRequest)(`${origin}${suffix ?? ""}`, req));
    output = output.replace(/(href|src|action)=["']\/([^"']+)["']/g, (_m, attr, route) => {
        const target = `${base.origin}/${route}`;
        return `${attr}="${(0, urls_1.buildProxiedUrlFromRequest)(target, req)}"`;
    });
    output = output.replace(/url\(["']?\/([^"')]+)["']?\)/g, (_m, route) => {
        const target = `${base.origin}/${route}`;
        return `url("${(0, urls_1.buildProxiedUrlFromRequest)(target, req)}")`;
    });
    return output;
}
function rewriteAbsoluteUrl(value, req) {
    try {
        const parsed = new node_url_1.URL(value);
        if (!ALLOWED_TYPEFORM_HOSTS.has(parsed.hostname))
            return value;
        return (0, urls_1.buildProxiedUrlFromRequest)(parsed.toString(), req);
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
    return (0, auth_1.verifyProxyToken)(token, "typeform-proxy");
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
