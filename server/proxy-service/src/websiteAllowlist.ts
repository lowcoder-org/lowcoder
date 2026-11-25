import { isIP } from "node:net";

const ALLOWED_WEBSITE_HOSTS = new Set(
  (process.env.LOWCODER_WEBSITE_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
);

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata",
]);

function isPrivateOrReservedIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast / reserved
    return false;
  }
  if (version === 6) {
    const normalized = ip.toLowerCase();
    if (normalized === "::1" || normalized === "::") return true;
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // ULA
    if (normalized.startsWith("fe80")) return true; // link-local
    if (normalized.startsWith("ff")) return true; // multicast
    // IPv4-mapped IPv6
    if (normalized.startsWith("::ffff:")) {
      const mapped = normalized.slice("::ffff:".length);
      if (isIP(mapped) === 4) return isPrivateOrReservedIp(mapped);
      const embedded = ipv4FromHexGroups(mapped);
      if (embedded) return isPrivateOrReservedIp(embedded);
    }
    return false;
  }
  return true;
}

// WHATWG URL serializes an IPv4-mapped IPv6 literal with hex groups ("::ffff:7f00:1"): turn the
// two groups back into dotted IPv4, or return null when the text is not two hex groups.
function ipv4FromHexGroups(groups: string): string | null {
  const match = /^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(groups);
  if (!match) return null;
  const high = parseInt(match[1], 16);
  const low = parseInt(match[2], 16);
  return [high >> 8, high & 0xff, low >> 8, low & 0xff].join(".");
}

export function normalizeWebsiteUrl(raw?: string): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) {
    throw new Error("websiteUrl is required");
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(`Invalid URL: ${trimmed}`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Website URL must be http(s): ${trimmed}`);
  }
  return parsed.toString();
}

export function assertAllowedWebsiteUrl(url: URL): void {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`Website URL is not allowed: ${url.toString()}`);
  }

  const hostname = url.hostname.toLowerCase();
  if (!hostname) {
    throw new Error(`Website URL is not allowed: ${url.toString()}`);
  }

  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith(".localhost")) {
    throw new Error(`Website URL is not allowed: ${url.toString()}`);
  }

  // URL.hostname keeps the brackets of an IPv6 literal ("[::1]"), which isIP() does not accept
  const bareHost = hostname.startsWith("[") && hostname.endsWith("]") ? hostname.slice(1, -1) : hostname;
  if (isIP(bareHost) && isPrivateOrReservedIp(bareHost)) {
    throw new Error(`Website URL is not allowed: ${url.toString()}`);
  }

  if (ALLOWED_WEBSITE_HOSTS.size > 0 && !ALLOWED_WEBSITE_HOSTS.has(hostname)) {
    throw new Error(`Website URL is not allowed: ${url.toString()}`);
  }
}

export function isWebsiteHostAllowed(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (ALLOWED_WEBSITE_HOSTS.size === 0) return true;
  return ALLOWED_WEBSITE_HOSTS.has(lower);
}
