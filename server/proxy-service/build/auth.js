"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSigningSecret = getSigningSecret;
exports.createProxyToken = createProxyToken;
exports.verifyProxyToken = verifyProxyToken;
exports.getBearerToken = getBearerToken;
exports.resolveParticipantId = resolveParticipantId;
exports.resolveEditorId = resolveEditorId;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const node_crypto_1 = require("node:crypto");
const API_KEY_SECRET = process.env.LOWCODER_API_KEY_SECRET ?? "";
const TOKEN_TTL_MS = 60 * 60 * 1000;
const API_SERVICE_URL = (process.env.LOWCODER_API_SERVICE_URL ?? "http://localhost:8080").replace(/\/$/, "");
function getSigningSecret() {
    if (!API_KEY_SECRET)
        return null;
    return Buffer.from(API_KEY_SECRET).toString("base64");
}
function createProxyToken(userId, roomId, role, scope = "typeform-proxy") {
    const secret = getSigningSecret();
    if (!secret) {
        return jsonwebtoken_1.default.sign({ userId, roomId, role, scope }, "dev-proxy-secret", {
            expiresIn: "1h",
        });
    }
    return jsonwebtoken_1.default.sign({ sub: userId, userId, roomId, role, scope }, secret, {
        algorithm: "HS256",
        expiresIn: "1h",
    });
}
function verifyProxyToken(token, expectedScope) {
    if (!token)
        return false;
    const secret = getSigningSecret();
    if (!secret)
        return true;
    try {
        const payload = jsonwebtoken_1.default.verify(token, secret);
        return !expectedScope || payload.scope === expectedScope;
    }
    catch {
        return false;
    }
}
function getBearerToken(authHeader) {
    if (!authHeader || !authHeader.startsWith("Bearer "))
        return null;
    return authHeader.slice("Bearer ".length);
}
async function resolveParticipantId(req, options = {}) {
    const editorId = options.editorId?.trim();
    if (editorId)
        return editorId;
    const guestId = options.guestId?.trim();
    if (guestId)
        return guestId;
    const cookie = req.headers.cookie;
    if (cookie) {
        const response = await (0, node_fetch_1.default)(`${API_SERVICE_URL}/api/users/me`, {
            headers: { cookie },
        });
        if (response.ok) {
            const payload = (await response.json());
            const userId = payload?.data?.id?.trim();
            if (userId)
                return userId;
        }
    }
    const roomId = options.roomId?.trim();
    const role = (options.role?.trim() || "driver").trim() || "driver";
    if (roomId) {
        return `guest-${roomId}-${role}`;
    }
    return `guest-${(0, node_crypto_1.randomUUID)()}`;
}
/** @deprecated Use resolveParticipantId */
async function resolveEditorId(req, fallbackEditorId) {
    return resolveParticipantId(req, { editorId: fallbackEditorId });
}
