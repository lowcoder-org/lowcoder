"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGoogleFormsProxySession = createGoogleFormsProxySession;
exports.joinGoogleFormsProxySession = joinGoogleFormsProxySession;
const auth_1 = require("./auth");
const googleFormUrls_1 = require("./googleFormUrls");
const googleUrls_1 = require("./googleUrls");
function normalizeRole(role, fallback = "driver") {
    return (role ?? fallback).trim().toLowerCase() === "follower" ? "follower" : "driver";
}
function normalizeCollab(rawCollab, role) {
    const collab = (rawCollab ?? "").trim();
    if (collab)
        return collab;
    if (role === "driver") {
        return String(Date.now());
    }
    throw new Error("collab is required for followers. Pass broadcast.collab from the driver's session response.");
}
async function mintGoogleFormsSession(req, body, role) {
    const googleFormUrl = await (0, googleFormUrls_1.resolveGoogleFormResponderUrl)(body.googleFormUrl);
    const roomId = (body.roomId ?? "").trim();
    const collab = normalizeCollab(body.collab, role);
    const username = (body.username ?? "").trim();
    if (!roomId)
        throw new Error("roomId is required");
    const participantId = await (0, auth_1.resolveParticipantId)(req, {
        editorId: body.editorId?.trim() || undefined,
        guestId: body.guestId?.trim() || undefined,
        roomId,
        role,
    });
    const token = (0, auth_1.createProxyToken)(participantId, roomId, role, "google-forms-proxy");
    const proxiedUrl = (0, googleUrls_1.buildGoogleFormsProxiedUrl)(googleFormUrl, {
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
function sendSessionResponse(res, data) {
    res.status(200).json({ code: 1, message: "", data });
}
function sendSessionError(res, error) {
    console.error("Google Forms proxy session error", error);
    const message = error instanceof Error ? error.message : "Unauthorized";
    const status = message.includes("required") ||
        message.includes("must be") ||
        message.includes("Invalid URL") ||
        message.includes("Could not resolve") ||
        message.includes("webViewLink") ||
        message.includes("collab")
        ? 400
        : 401;
    res.status(status).json({ code: status, message });
}
async function createGoogleFormsProxySession(req, res) {
    try {
        const body = (req.body ?? {});
        sendSessionResponse(res, await mintGoogleFormsSession(req, body, normalizeRole(body.role)));
    }
    catch (error) {
        sendSessionError(res, error);
    }
}
async function joinGoogleFormsProxySession(req, res) {
    try {
        const body = (req.body ?? {});
        sendSessionResponse(res, await mintGoogleFormsSession(req, body, normalizeRole(body.role, "follower")));
    }
    catch (error) {
        sendSessionError(res, error);
    }
}
