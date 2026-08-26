import { Request } from "express";

export const WEBSITE_PROXY_PREFIX = "/proxy/website";

export interface WebsiteProxyOptions {
  roomId?: string;
  role?: string;
  editorId?: string;
  token?: string;
  collab?: string;
  username?: string;
}

export function buildWebsiteProxiedUrl(
  targetUrl: string,
  options: WebsiteProxyOptions
): string {
  const params = new URLSearchParams();
  params.set("target", targetUrl);
  if (options.roomId) params.set("roomId", options.roomId);
  if (options.role) params.set("role", options.role);
  if (options.editorId) params.set("editorId", options.editorId);
  if (options.token) params.set("token", options.token);
  if (options.collab) params.set("collab", options.collab);
  if (options.username) params.set("username", options.username);
  return `${WEBSITE_PROXY_PREFIX}?${params.toString()}`;
}

export function buildWebsiteProxiedUrlFromRequest(
  targetUrl: string,
  req: Request
): string {
  return buildWebsiteProxiedUrl(targetUrl, {
    roomId: String(req.query.roomId ?? ""),
    role: String(req.query.role ?? "driver"),
    editorId: String(req.query.editorId ?? ""),
    token: String(req.query.token ?? ""),
    collab: String(req.query.collab ?? ""),
    username: String(req.query.username ?? ""),
  });
}
