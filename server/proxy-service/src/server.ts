import express, { Request, Response } from "express";
import cors from "cors";
import fetch, { HeadersInit, Response as FetchResponse } from "node-fetch";
import fs from "node:fs";
import path from "node:path";
import { URL } from "node:url";
import { createServer } from "node:http";
import { createProxySession, joinProxySession } from "./session";
import { getBearerToken, verifyProxyToken } from "./auth";
import { PROXY_PREFIX, buildProxiedUrlFromRequest } from "./urls";
import { registerGoogleFormsProxy } from "./googleProxy";
import { registerWebsiteProxy } from "./websiteProxy";

const PORT = Number(process.env.PROXY_SERVICE_PORT ?? 6070);
const LOWCODER_PUBLIC_URL = (process.env.LOWCODER_PUBLIC_URL ?? "http://localhost:3000").replace(/\/$/, "");
const HOCUSPOCUS_URL = (process.env.LOWCODER_HOCUSPOCUS_URL ?? "ws://localhost:3006").trim();
const HOCUSPOCUS_SECRET = (
  process.env.LOWCODER_HOCUSPOCUS_SECRET ?? process.env.HOCUSPOCUS_SECRET ?? ""
).trim();
const RATE_LIMIT_PER_MINUTE = Number(process.env.LOWCODER_PROXY_RATE_LIMIT ?? 120);
const ALLOWED_TYPEFORM_HOSTS = new Set(
  (process.env.LOWCODER_PROXY_ALLOWED_HOSTS ?? "form.typeform.com,embed.typeform.com,admin.typeform.com")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
);

const SESSION_PATH = `${PROXY_PREFIX}/session`;
const JOIN_SESSION_PATH = `${PROXY_PREFIX}/session/join`;
const BRIDGE_PATH = "/proxy/typeform-bridge.js";
const requestBuckets = new Map<string, { count: number; resetAt: number }>();

const app = express();
app.disable("x-powered-by");
app.use(cors({ credentials: true, origin: true }));

app.get("/", (_req, res) => {
  res.status(200).json({ code: 1, message: "Lowcoder Proxy Service is up and running", success: true });
});

registerGoogleFormsProxy(app);
registerWebsiteProxy(app);

app.get(BRIDGE_PATH, (_req, res) => {
  const bridgePath = path.join(__dirname, "bridge", "typeform-bridge.js");
  if (!fs.existsSync(bridgePath)) {
    res.status(404).type("text/plain").send("Bridge script not found");
    return;
  }
  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(fs.readFileSync(bridgePath, "utf8"));
});

app.post(SESSION_PATH, express.json({ limit: "1mb" }), createProxySession);
app.post(JOIN_SESSION_PATH, express.json({ limit: "1mb" }), joinProxySession);

app.use(PROXY_PREFIX, express.raw({ type: "*/*", limit: "25mb" }), async (req, res) => {
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
    const upstreamResponse = await fetch(upstreamUrl.toString(), {
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
  } catch (error) {
    console.error("Proxy request failed", error);
    res.status(502).json({ message: "Typeform proxy request failed" });
  }
});

const httpServer = createServer(app);

httpServer.listen(PORT, () => {
  console.log(`Proxy service listening on ${PORT}`);
});

function hasBody(method: string): boolean {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
}

function resolveUpstreamUrl(req: Request): URL {
  const targetParam = (req.query.target as string | undefined)?.trim();
  if (targetParam) {
    const upstream = new URL(targetParam);
    assertAllowedHost(upstream.hostname);
    return upstream;
  }

  const rawPath = req.originalUrl.replace(PROXY_PREFIX, "");
  const [pathname, query = ""] = rawPath.split("?");
  const cleanPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const upstream = new URL(`https://form.typeform.com${cleanPath}${query ? `?${query}` : ""}`);
  assertAllowedHost(upstream.hostname);
  return upstream;
}

function assertAllowedHost(hostname: string) {
  if (!ALLOWED_TYPEFORM_HOSTS.has(hostname)) {
    throw new Error(`Host is not allowed: ${hostname}`);
  }
}

function buildForwardHeaders(req: Request, upstreamUrl: URL): HeadersInit {
  const normalized = new Map<string, string>();
  Object.entries(req.headers).forEach(([key, value]) => {
    if (typeof value !== "string") return;
    const lower = key.toLowerCase();
    if (["host", "content-length", "x-forwarded-host", "x-forwarded-proto", "connection"].includes(lower)) return;
    normalized.set(lower, value);
  });
  normalized.set("host", upstreamUrl.host);
  normalized.set("origin", `${upstreamUrl.protocol}//${upstreamUrl.host}`);
  return Object.fromEntries(normalized.entries());
}

function relayHeaders(upstreamResponse: FetchResponse, res: Response, req: Request) {
  const skipHeaders = new Set([
    "x-frame-options",
    "content-security-policy",
    "transfer-encoding",
    "content-length",
    "content-encoding",
  ]);

  upstreamResponse.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (skipHeaders.has(lower)) return;
    if (lower === "set-cookie") {
      const cookies = rewriteSetCookie(value);
      if (cookies.length > 0) res.setHeader("Set-Cookie", cookies);
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

function rewriteSetCookie(rawValue: string): string[] {
  return rawValue
    .split(/,(?=[^;]+=[^;]+)/)
    .map((cookie) =>
      cookie
        .replace(/;\s*Domain=[^;]+/gi, "")
        .replace(/;\s*SameSite=None/gi, "; SameSite=Lax")
        .replace(/;\s*Path=[^;]+/gi, "; Path=/proxy/typeform")
    );
}

function injectBridgeAndRewriteHtml(html: string, req: Request, upstreamUrl: URL): string {
  const rewritten = rewriteBodyUrls(html, req, upstreamUrl);
  const roomId = String(req.query.roomId ?? "");
  const role = String(req.query.role ?? "driver");
  const editorId = String(req.query.editorId ?? "local");
  const collabId = String(req.query.collab ?? "");
  const username = String(req.query.username ?? "");
  const attrs =
    ` data-lowcoder-room-id="${escapeHtml(roomId)}"` +
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
  const bridgeTag =
    `<script>window.__LOWCODER_HOCUSPOCUS__=${hocuspocusConfig};</script>` +
    `<script src="${BRIDGE_PATH}"></script>`;
  if (withRootAttrs.includes("</head>")) {
    return withRootAttrs.replace("</head>", `${bridgeTag}</head>`);
  }
  return `${bridgeTag}${withRootAttrs}`;
}

function rewriteBodyUrls(body: string, req: Request, upstreamUrl?: URL): string {
  const base = upstreamUrl ?? new URL("https://form.typeform.com");
  const origin = base.origin;

  let output = body.replace(
    new RegExp(`${escapeRegex(origin)}([^"'\\s]*)`, "g"),
    (_match, suffix: string) => buildProxiedUrlFromRequest(`${origin}${suffix ?? ""}`, req)
  );

  output = output.replace(/(href|src|action)=["']\/([^"']+)["']/g, (_m, attr, route) => {
    const target = `${base.origin}/${route}`;
    return `${attr}="${buildProxiedUrlFromRequest(target, req)}"`;
  });
  output = output.replace(/url\(["']?\/([^"')]+)["']?\)/g, (_m, route) => {
    const target = `${base.origin}/${route}`;
    return `url("${buildProxiedUrlFromRequest(target, req)}")`;
  });
  return output;
}

function rewriteAbsoluteUrl(value: string, req: Request): string {
  try {
    const parsed = new URL(value);
    if (!ALLOWED_TYPEFORM_HOSTS.has(parsed.hostname)) return value;
    return buildProxiedUrlFromRequest(parsed.toString(), req);
  } catch {
    return value;
  }
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isAuthorized(req: Request): boolean {
  const token = (req.query.token as string | undefined) || getBearerToken(req.headers.authorization);
  return verifyProxyToken(token, "typeform-proxy");
}

function checkRateLimit(req: Request): boolean {
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
