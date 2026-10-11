"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProxySession = createProxySession;
exports.joinProxySession = joinProxySession;
const auth_1 = require("./auth");
const urls_1 = require("./urls");
function normalizeRole(role, fallback = "driver") {
    const value = (role ?? fallback).trim().toLowerCase();
    return value === "follower" ? "follower" : "driver";
}
async function mintSession(req, body, role) {
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
    const participantId = await (0, auth_1.resolveParticipantId)(req, {
        editorId: body.editorId?.trim() || undefined,
        guestId: body.guestId?.trim() || undefined,
        roomId,
        role,
    });
    const token = (0, auth_1.createProxyToken)(participantId, roomId, role);
    const proxiedUrl = (0, urls_1.buildProxiedUrl)(typeformUrl, {
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
function sendSessionResponse(res, data) {
    res.status(200).json({
        code: 1,
        message: "",
        data,
    });
}
function sendSessionError(res, error) {
    console.error("Proxy session error", error);
    const status = error instanceof Error && error.message.includes("required") ? 400 : 401;
    res.status(status).json({
        code: status,
        message: error instanceof Error ? error.message : "Unauthorized",
    });
}
/** Creates a proxy session. Respects `body.role` (`driver` or `follower`). */
async function createProxySession(req, res) {
    try {
        const body = (req.body ?? {});
        const role = normalizeRole(body.role, "driver");
        const data = await mintSession(req, body, role);
        sendSessionResponse(res, data);
    }
    catch (error) {
        sendSessionError(res, error);
    }
}
/** Join an existing collab room as follower (same as session with role=follower). */
async function joinProxySession(req, res) {
    try {
        const body = (req.body ?? {});
        const role = normalizeRole(body.role, "follower");
        const data = await mintSession(req, body, role);
        sendSessionResponse(res, data);
    }
    catch (error) {
        sendSessionError(res, error);
    }
}
