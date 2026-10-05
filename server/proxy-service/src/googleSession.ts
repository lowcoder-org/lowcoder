import { Request, Response } from "express";
import { createProxyToken, resolveParticipantId } from "./auth";
import { resolveGoogleFormResponderUrl } from "./googleFormUrls";
import { buildGoogleFormsProxiedUrl } from "./googleUrls";

interface GoogleFormsSessionRequestBody {
  googleFormUrl?: string;
  roomId?: string;
  role?: string;
  editorId?: string;
  guestId?: string;
  collab?: string;
  username?: string;
}

export interface GoogleFormsSessionData {
  token: string;
  proxiedUrl: string;
  roomId: string;
  role: string;
  editorId: string;
  participantId: string;
  googleFormUrl: string;
  collab: string;
  username: string;
  broadcast: {
    roomId: string;
    collab: string;
    googleFormUrl: string;
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

async function mintGoogleFormsSession(
  req: Request,
  body: GoogleFormsSessionRequestBody,
  role: "driver" | "follower"
): Promise<GoogleFormsSessionData> {
  const googleFormUrl = await resolveGoogleFormResponderUrl(body.googleFormUrl);
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
  const token = createProxyToken(participantId, roomId, role, "google-forms-proxy");
  const proxiedUrl = buildGoogleFormsProxiedUrl(googleFormUrl, {
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
    googleFormUrl,
    collab,
    username,
    broadcast: { roomId, collab, googleFormUrl, editorId: participantId, username },
  };
}

function sendSessionResponse(res: Response, data: GoogleFormsSessionData): void {
  res.status(200).json({ code: 1, message: "", data });
}

function sendSessionError(res: Response, error: unknown): void {
  console.error("Google Forms proxy session error", error);
  const message = error instanceof Error ? error.message : "Unauthorized";
  const status =
    message.includes("required") ||
    message.includes("must be") ||
    message.includes("Invalid URL") ||
    message.includes("Could not resolve") ||
    message.includes("webViewLink") ||
    message.includes("collab")
      ? 400
      : 401;
  res.status(status).json({ code: status, message });
}

export async function createGoogleFormsProxySession(req: Request, res: Response): Promise<void> {
  try {
    const body = (req.body ?? {}) as GoogleFormsSessionRequestBody;
    sendSessionResponse(res, await mintGoogleFormsSession(req, body, normalizeRole(body.role)));
  } catch (error) {
    sendSessionError(res, error);
  }
}

export async function joinGoogleFormsProxySession(req: Request, res: Response): Promise<void> {
  try {
    const body = (req.body ?? {}) as GoogleFormsSessionRequestBody;
    sendSessionResponse(
      res,
      await mintGoogleFormsSession(req, body, normalizeRole(body.role, "follower"))
    );
  } catch (error) {
    sendSessionError(res, error);
  }
}
