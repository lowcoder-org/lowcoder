"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GOOGLE_FORMS_PROXY_PREFIX = void 0;
exports.buildGoogleFormsProxiedUrl = buildGoogleFormsProxiedUrl;
exports.firstQueryValue = firstQueryValue;
exports.buildGoogleFormsProxiedUrlFromRequest = buildGoogleFormsProxiedUrlFromRequest;
exports.GOOGLE_FORMS_PROXY_PREFIX = "/proxy/google-forms";
function buildGoogleFormsProxiedUrl(targetUrl, options) {
    const params = new URLSearchParams();
    params.set("target", targetUrl);
    if (options.roomId)
        params.set("roomId", options.roomId);
    if (options.role)
        params.set("role", options.role);
    if (options.editorId)
        params.set("editorId", options.editorId);
    if (options.token)
        params.set("token", options.token);
    if (options.collab)
        params.set("collab", options.collab);
    if (options.username)
        params.set("username", options.username);
    return `${exports.GOOGLE_FORMS_PROXY_PREFIX}?${params.toString()}`;
}
/**
 * Express parses repeated query params into arrays, and Google URLs regularly
 * carry their own params, so every control param is read defensively.
 */
function firstQueryValue(value) {
    if (Array.isArray(value)) {
        const first = value.find((entry) => typeof entry === "string");
        return typeof first === "string" ? first : "";
    }
    return typeof value === "string" ? value : "";
}
function buildGoogleFormsProxiedUrlFromRequest(targetUrl, req) {
    return buildGoogleFormsProxiedUrl(targetUrl, {
        roomId: firstQueryValue(req.query.roomId),
        role: firstQueryValue(req.query.role) || "driver",
        editorId: firstQueryValue(req.query.editorId),
        token: firstQueryValue(req.query.token),
        collab: firstQueryValue(req.query.collab),
        username: firstQueryValue(req.query.username),
    });
}
