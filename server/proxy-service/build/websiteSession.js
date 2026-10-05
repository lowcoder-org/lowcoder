"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebsiteProxySession = createWebsiteProxySession;
exports.joinWebsiteProxySession = joinWebsiteProxySession;
const auth_1 = require("./auth");
const websiteAllowlist_1 = require("./websiteAllowlist");
const websiteUrls_1 = require("./websiteUrls");
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
async function mintWebsiteSession(req, body, role) {
    const websiteUrl = (0, websiteAllowlist_1.normalizeWebsiteUrl)(body.websiteUrl);
    (0, websiteAllowlist_1.assertAllowedWebsiteUrl)(new URL(websiteUrl));
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
    const token = (0, auth_1.createProxyToken)(participantId, roomId, role, "website-proxy");
    const proxiedUrl = (0, websiteUrls_1.buildWebsiteProxiedUrl)(websiteUrl, {
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
function sendSessionResponse(res, data) {
    res.status(200).json({ code: 1, message: "", data });
}
function sendSessionError(res, error) {
    console.error("Website proxy session error", error);
    const message = error instanceof Error ? error.message : "Unauthorized";
    const status = message.includes("required") ||
        message.includes("must be") ||
        message.includes("Invalid URL") ||
        message.includes("not allowed") ||
        message.includes("collab")
        ? 400
        : 401;
    res.status(status).json({ code: status, message });
}
async function createWebsiteProxySession(req, res) {
    try {
        const body = (req.body ?? {});
        sendSessionResponse(res, await mintWebsiteSession(req, body, normalizeRole(body.role)));
    }
    catch (error) {
        sendSessionError(res, error);
    }
}
async function joinWebsiteProxySession(req, res) {
    try {
        const body = (req.body ?? {});
        sendSessionResponse(res, await mintWebsiteSession(req, body, normalizeRole(body.role, "follower")));
    }
    catch (error) {
        sendSessionError(res, error);
    }
}
