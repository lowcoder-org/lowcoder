import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import { randomUUID } from "node:crypto";
import { Request } from "express";

const API_KEY_SECRET = process.env.LOWCODER_API_KEY_SECRET ?? "";
const TOKEN_TTL_MS = 60 * 60 * 1000;
const API_SERVICE_URL = (process.env.LOWCODER_API_SERVICE_URL ?? "http://localhost:8080").replace(/\/$/, "");

export interface ProxyTokenPayload {
  userId: string;
  roomId: string;
  role: string;
  scope: string;
}

export interface ParticipantIdentityOptions {
  editorId?: string;
  guestId?: string;
  roomId?: string;
  role?: string;
}

export function getSigningSecret(): string | null {
  if (!API_KEY_SECRET) return null;
  return Buffer.from(API_KEY_SECRET).toString("base64");
}

export function createProxyToken(
  userId: string,
  roomId: string,
  role: string,
  scope = "typeform-proxy"
): string {
  const secret = getSigningSecret();
  if (!secret) {
    return jwt.sign({ userId, roomId, role, scope }, "dev-proxy-secret", {
      expiresIn: "1h",
    });
  }
  return jwt.sign({ sub: userId, userId, roomId, role, scope }, secret, {
    algorithm: "HS256",
    expiresIn: "1h",
  });
}

export function verifyProxyToken(
  token: string | null | undefined,
  expectedScope?: string
): boolean {
  if (!token) return false;
  const secret = getSigningSecret();
  if (!secret) return true;
  try {
    const payload = jwt.verify(token, secret) as ProxyTokenPayload;
    return !expectedScope || payload.scope === expectedScope;
  } catch {
    return false;
  }
}

export function getBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length);
}

export async function resolveParticipantId(
  req: Request,
  options: ParticipantIdentityOptions = {}
): Promise<string> {
  const editorId = options.editorId?.trim();
  if (editorId) return editorId;

  const guestId = options.guestId?.trim();
  if (guestId) return guestId;

  const cookie = req.headers.cookie;
  if (cookie) {
    const response = await fetch(`${API_SERVICE_URL}/api/users/me`, {
      headers: { cookie },
    });

    if (response.ok) {
      const payload = (await response.json()) as { data?: { id?: string } };
      const userId = payload?.data?.id?.trim();
      if (userId) return userId;
    }
  }

  const roomId = options.roomId?.trim();
  const role = (options.role?.trim() || "driver").trim() || "driver";
  if (roomId) {
    return `guest-${roomId}-${role}`;
  }

  return `guest-${randomUUID()}`;
}

/** @deprecated Use resolveParticipantId */
export async function resolveEditorId(req: Request, fallbackEditorId?: string): Promise<string> {
  return resolveParticipantId(req, { editorId: fallbackEditorId });
}
