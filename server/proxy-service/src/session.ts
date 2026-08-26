import { Request, Response } from "express";
import { createProxyToken, resolveParticipantId } from "./auth";
import { buildProxiedUrl } from "./urls";

interface SessionRequestBody {
  typeformUrl?: string;
  roomId?: string;
  role?: string;
  editorId?: string;
  guestId?: string;
  collab?: string;
  username?: string;
}

export interface SessionData {
  token: string;
  proxiedUrl: string;
  roomId: string;
  role: string;
  editorId: string;
  participantId: string;
  typeformUrl: string;
  collab: string;
  username: string;
  broadcast: {
    roomId: string;
    collab: string;
    typeformUrl: string;
    editorId: string;
    username: string;
  };
}

function normalizeRole(role?: string, fallback: "driver" | "follower" = "driver"): "driver" | "follower" {
  const value = (role ?? fallback).trim().toLowerCase();
  return value === "follower" ? "follower" : "driver";
}

async function mintSession(req: Request, body: SessionRequestBody, role: "driver" | "follower"): Promise<SessionData> {
  const typeformUrl = (body.typeformUrl ?? "").trim();
  const roomId = (body.roomId ?? "").trim();
  const collab = (body.collab ?? "").trim();
  const username = (body.username ?? "").trim();

  if (!typeformUrl) {
    throw new Error("typeformUrl is required");
  }
  if (!roomId) {
    throw new Error("roomId is required");
  }

  const participantId = await resolveParticipantId(req, {
    editorId: body.editorId?.trim() || undefined,
    guestId: body.guestId?.trim() || undefined,
    roomId,
    role,
  });
  const token = createProxyToken(participantId, roomId, role);
  const proxiedUrl = buildProxiedUrl(typeformUrl, {
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
    typeformUrl,
    collab,

    username,
    broadcast: { roomId, collab, typeformUrl, editorId: participantId, username },
  };
}

function sendSessionResponse(res: Response, data: SessionData) {
  res.status(200).json({
    code: 1,
    message: "",
    data,
  });
}

function sendSessionError(res: Response, error: unknown) {
  console.error("Proxy session error", error);
  const status = error instanceof Error && error.message.includes("required") ? 400 : 401;
  res.status(status).json({
    code: status,
    message: error instanceof Error ? error.message : "Unauthorized",
  });
}

/** Creates a proxy session. Respects `body.role` (`driver` or `follower`). */
export async function createProxySession(req: Request, res: Response) {
  try {
    const body = (req.body ?? {}) as SessionRequestBody;
    const role = normalizeRole(body.role, "driver");
    const data = await mintSession(req, body, role);
    sendSessionResponse(res, data);
  } catch (error) {
    sendSessionError(res, error);
  }
}

/** Join an existing collab room as follower (same as session with role=follower). */
export async function joinProxySession(req: Request, res: Response) {
  try {
    const body = (req.body ?? {}) as SessionRequestBody;
    const role = normalizeRole(body.role, "follower");
    const data = await mintSession(req, body, role);
    sendSessionResponse(res, data);
  } catch (error) {
    sendSessionError(res, error);
  }
}
