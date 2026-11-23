#!/usr/bin/env node

/**
 * Hocuspocus (Yjs WebSocket) Server for ChatBox v2
 *
 * Provides real-time shared state via Yjs documents served over WebSocket.
 * Each application room maps to a Yjs document. Presence is handled through
 * Hocuspocus awareness on the client side.
 *
 * Env vars:
 *   PORT                - HTTP/WebSocket port (default 3006)
 *   HOST                - Bind address (default 0.0.0.0)
 *   HOCUSPOCUS_SECRET   - Optional shared secret for token auth, checked before room authorization
 *   API_SERVICE_URL      - Base URL of the api-service, used to authorize signal_* rooms (default http://localhost:8080)
 *   LOWCODER_API_SERVICE_URL - Same as API_SERVICE_URL, read if API_SERVICE_URL is unset
 *
 * A room named signal_<appId>[:<sub>] is authorized by re-checking the connecting
 * browser's own cookie against GET <API_SERVICE_URL>/api/applications/<appId>/view -- the same READ rule the app
 * editor/viewer itself uses (a public app is open to anonymous visitors, a private app only to a reader). Rooms
 * named typeform_*, googleform_*, website_* (the proxy-service bridges) keep today's behaviour: only the shared
 * secret, if one is configured, gates them (left open deliberately for now). Any other room name is refused.
 *
 * Usage: node hocuspocus-server.js
 */

import { Server } from "@hocuspocus/server";
import { pathToFileURL } from "node:url";

const PORT = parseInt(process.env.PORT || "3006", 10);
const HOST = process.env.HOST || "0.0.0.0";
const SECRET = process.env.HOCUSPOCUS_SECRET || "";
const API_SERVICE_URL = process.env.API_SERVICE_URL || process.env.LOWCODER_API_SERVICE_URL || "http://localhost:8080";
const FETCH_TIMEOUT_MS = 5000;

/** A signal_<appId> room's own id, matching SlugUtils.validate exactly -- no numeric length cap. */
const APP_ID_PATTERN = /^[A-Za-z0-9_-]*$/;
const BRIDGE_PREFIXES = ["typeform_", "googleform_", "website_"];
const SIGNAL_PREFIX = "signal_";

function writeJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json" });
  response.end(JSON.stringify(payload));
}

/**
 * The `Cookie` header of the upgrade request, whatever shape `requestHeaders` has. Different `@hocuspocus/server`
 * versions expose it differently: a plain Node `IncomingHttpHeaders` object (property access), confirmed against
 * the locally installed 3.4.4; or, NOT VERIFIED locally, a Fetch-API-style `Headers` instance (a `.get` method) in
 * the deployed 4.3.0. Support both rather than assume one.
 */
export function cookieOf(requestHeaders) {
  if (!requestHeaders) {
    return undefined;
  }
  if (typeof requestHeaders.get === "function") {
    return requestHeaders.get("cookie") ?? requestHeaders.get("Cookie") ?? undefined;
  }
  return requestHeaders.cookie ?? requestHeaders["Cookie"] ?? undefined;
}

/**
 * Authorizes a Hocuspocus room by name. `fetchImpl` and `apiServiceUrl` are injectable for tests;
 * production calls pass the real `fetch` and `API_SERVICE_URL`.
 */
export async function authorizeDocument({ documentName, cookie, fetchImpl = fetch, apiServiceUrl = API_SERVICE_URL }) {
  if (typeof documentName !== "string") {
    throw new Error("Unauthorized");
  }

  if (BRIDGE_PREFIXES.some((prefix) => documentName.startsWith(prefix))) {
    return;
  }

  if (!documentName.startsWith(SIGNAL_PREFIX)) {
    throw new Error("Unauthorized");
  }

  const afterPrefix = documentName.slice(SIGNAL_PREFIX.length);
  const colonIndex = afterPrefix.indexOf(":");
  const appId = colonIndex === -1 ? afterPrefix : afterPrefix.slice(0, colonIndex);

  if (!APP_ID_PATTERN.test(appId)) {
    throw new Error("Unauthorized");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetchImpl(`${apiServiceUrl}/api/applications/${appId}/view`, {
      method: "GET",
      headers: cookie ? { Cookie: cookie } : {},
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error("Unauthorized");
    }
    const body = await response.json();
    if (body?.success !== true) {
      throw new Error("Unauthorized");
    }
  } catch {
    throw new Error("Unauthorized");
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * The secret check (when `SECRET` is set) runs first, before any room authorization -- a wrong token must refuse
 * without ever calling `authorizeDocument` (and so without any fetch). Exported, not only the inline Server hook,
 * so the gate order itself is directly testable.
 */
export async function onAuthenticate({ token, documentName, requestHeaders }, secret = SECRET, authorize = authorizeDocument) {
  if (secret && token !== secret) {
    console.warn(`[hocuspocus] rejected connection for ${documentName}: invalid token`);
    throw new Error("Unauthorized");
  }

  try {
    await authorize({ documentName, cookie: cookieOf(requestHeaders) });
  } catch (error) {
    console.warn(`[hocuspocus] rejected connection for ${documentName}: ${error?.message || "Unauthorized"}`);
    throw error;
  }
}

const server = new Server({
  name: "lowcoder-hocuspocus",
  quiet: true,
  address: HOST,
  port: PORT,

  async onListen() {
    console.log(`[hocuspocus] listening on ws://${HOST}:${PORT}`);
  },

  // Hocuspocus writes its own default response after this hook resolves.
  // Rejecting with a falsy value marks the request as handled and stops that
  // default response; returning normally would write headers twice and crash.
  async onRequest({ request, response }) {
    if (request.url === "/health") {
      writeJson(response, 200, {
        status: "ok",
        host: HOST,
        port: PORT,
        auth: SECRET ? "enabled" : "disabled",
        rooms: "app-read-check",
      });
      throw null;
    }

    if (request.url === "/") {
      writeJson(response, 200, {
        name: "lowcoder-hocuspocus",
        websocket: `ws://${HOST}:${PORT}`,
        health: "/health",
      });
      throw null;
    }
  },

  onAuthenticate,

  async onConnect({ documentName, socketId }) {
    console.log(`[hocuspocus] connect socket=${socketId} document=${documentName}`);
  },

  async onDisconnect({ documentName, socketId }) {
    console.log(`[hocuspocus] disconnect socket=${socketId} document=${documentName}`);
  },
});

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await server.listen();
  } catch (error) {
    console.error("[hocuspocus] failed to start", error);
    process.exit(1);
  }
}
