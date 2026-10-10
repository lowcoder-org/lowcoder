import { Request } from "express";
import { URL } from "node:url";

// Hocuspocus (Yjs websocket) settings handed to the browser-side bridges
const DEFAULT_HOCUSPOCUS_URL = "ws://localhost:3006";
const DEFAULT_HOCUSPOCUS_PORT = "3006";
const DEFAULT_REQUEST_HOST = "localhost";
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);

export const HOCUSPOCUS_URL = (process.env.LOWCODER_HOCUSPOCUS_URL ?? DEFAULT_HOCUSPOCUS_URL).trim();
export const HOCUSPOCUS_SECRET = (
  process.env.LOWCODER_HOCUSPOCUS_SECRET ?? process.env.HOCUSPOCUS_SECRET ?? ""
).trim();

/**
 * Hocuspocus URL for the browser that sent `req`.
 *
 * A configured URL whose hostname is localhost or 127.0.0.1 would make a remote browser connect to
 * itself, so its host is replaced by the host the browser used to reach the proxy (first
 * X-Forwarded-Host entry, else Host), keeping the configured port. Any other configured URL,
 * including one that cannot be parsed, is returned unchanged.
 *
 * Not covered: the substituted URL is always plain ws:// (a TLS-terminated setup must configure a
 * wss:// URL explicitly), hocuspocus is assumed to run on the same host as the proxy, IPv6
 * literal request hosts ("[::1]:3000") are not parsed and a configured [::1] counts as non-local.
 */
export function resolveHocuspocusUrl(req: Request, configuredUrl: string = HOCUSPOCUS_URL): string {
  const configured = parseWebSocketUrl(configuredUrl);
  if (!configured || !LOCAL_HOSTNAMES.has(configured.hostname)) {
    return configuredUrl;
  }
  const forwardedHost = (req.get("x-forwarded-host") || req.get("host") || DEFAULT_REQUEST_HOST)
    .split(",")[0]
    .trim();
  const hostname = forwardedHost.split(":")[0] || DEFAULT_REQUEST_HOST;
  const port = configured.port || DEFAULT_HOCUSPOCUS_PORT;
  return `ws://${hostname}:${port}`;
}

// ws:// and wss:// parsed as http(s):// so that WHATWG URL yields hostname and port
function parseWebSocketUrl(value: string): URL | null {
  try {
    return new URL(value.replace(/^ws/, "http"));
  } catch {
    return null;
  }
}
