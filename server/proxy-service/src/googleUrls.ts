import { Request } from "express";

export const GOOGLE_FORMS_PROXY_PREFIX = "/proxy/google-forms";

export interface GoogleFormsProxyOptions {
  roomId?: string;
  role?: string;
  editorId?: string;
  token?: string;
  collab?: string;
  username?: string;
}

export function buildGoogleFormsProxiedUrl(
  targetUrl: string,
  options: GoogleFormsProxyOptions
): string {
  const params = new URLSearchParams();
  params.set("target", targetUrl);
  if (options.roomId) params.set("roomId", options.roomId);
  if (options.role) params.set("role", options.role);
  if (options.editorId) params.set("editorId", options.editorId);
  if (options.token) params.set("token", options.token);
  if (options.collab) params.set("collab", options.collab);
  if (options.username) params.set("username", options.username);
  return `${GOOGLE_FORMS_PROXY_PREFIX}?${params.toString()}`;
}

export function buildGoogleFormsProxiedUrlFromRequest(
  targetUrl: string,
  req: Request
): string {
  return buildGoogleFormsProxiedUrl(targetUrl, {
    roomId: String(req.query.roomId ?? ""),
    role: String(req.query.role ?? "driver"),
    editorId: String(req.query.editorId ?? ""),
    token: String(req.query.token ?? ""),
    collab: String(req.query.collab ?? ""),
    username: String(req.query.username ?? ""),
  });
}
