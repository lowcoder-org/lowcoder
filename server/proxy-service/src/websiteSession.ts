import { Request, Response } from "express";
import { createProxyToken, resolveParticipantId } from "./auth";
import { assertAllowedWebsiteUrl, normalizeWebsiteUrl } from "./websiteAllowlist";
import { buildWebsiteProxiedUrl } from "./websiteUrls";

interface WebsiteSessionRequestBody {
  websiteUrl?: string;
  roomId?: string;
  role?: string;
  editorId?: string;
  guestId?: string;
  collab?: string;
  username?: string;
}

export interface WebsiteSessionData {
  token: string;
  proxiedUrl: string;
  roomId: string;
  role: string;
  editorId: string;
  participantId: string;
  websiteUrl: string;
  collab: string;
  username: string;
  broadcast: {
    roomId: string;
    collab: string;
    websiteUrl: string;
    editorId: string;
    username: string;
  };
}

function normalizeRole(
  role?: string,
  fallback: "driver" | "follower" = "driver"
): "driver" | "follower" {
  return (role ?? fallback).trim().toLowerCase() === "follower" ? "follower" : "driver";
}

function normalizeCollab(rawCollab: string | undefined, role: "driver" | "follower"): string {
  const collab = (rawCollab ?? "").trim();
  if (collab) return collab;
  if (role === "driver") {
    return String(Date.now());
  }
  throw new Error(
    "collab is required for followers. Pass broadcast.collab from the driver's session response."
  );
}

async function mintWebsiteSession(
  req: Request,
  body: WebsiteSessionRequestBody,
  role: "driver" | "follower"
): Promise<WebsiteSessionData> {
  const websiteUrl = normalizeWebsiteUrl(body.websiteUrl);
  assertAllowedWebsiteUrl(new URL(websiteUrl));

  const roomId = (body.roomId ?? "").trim();
  const collab = normalizeCollab(body.collab, role);
  const username = (body.username ?? "").trim();

  if (!roomId) throw new Error("roomId is required");

  const participantId = await resolveParticipantId(req, {
    editorId: body.editorId?.trim() || undefined,
    guestId: body.guestId?.trim() || undefined,
    roomId,
    role,
  });
  const token = createProxyToken(participantId, roomId, role, "website-proxy");
  const proxiedUrl = buildWebsiteProxiedUrl(websiteUrl, {
    roomId,
    role,
    editorId: participantId,
    token,
    collab,
    username,
  });

  return {
    token,
    proxiedUrl,
    roomId,
    role,
    editorId: participantId,
    participantId,
    websiteUrl,
    collab,
    username,
    broadcast: { roomId, collab, websiteUrl, editorId: participantId, username },
  };
}

function sendSessionResponse(res: Response, data: WebsiteSessionData): void {
  res.status(200).json({ code: 1, message: "", data });
}

function sendSessionError(res: Response, error: unknown): void {
  console.error("Website proxy session error", error);
  const message = error instanceof Error ? error.message : "Unauthorized";
  const status =
    message.includes("required") ||
    message.includes("must be") ||
    message.includes("Invalid URL") ||
    message.includes("not allowed") ||
    message.includes("collab")
      ? 400
      : 401;
  res.status(status).json({ code: status, message });
}

export async function createWebsiteProxySession(req: Request, res: Response): Promise<void> {
  try {
    const body = (req.body ?? {}) as WebsiteSessionRequestBody;
    sendSessionResponse(res, await mintWebsiteSession(req, body, normalizeRole(body.role)));
  } catch (error) {
    sendSessionError(res, error);
  }
}

export async function joinWebsiteProxySession(req: Request, res: Response): Promise<void> {
  try {
    const body = (req.body ?? {}) as WebsiteSessionRequestBody;
    sendSessionResponse(
      res,
      await mintWebsiteSession(req, body, normalizeRole(body.role, "follower"))
    );
  } catch (error) {
    sendSessionError(res, error);
  }
}
