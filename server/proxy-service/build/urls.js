"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROXY_PREFIX = void 0;
exports.buildProxiedUrl = buildProxiedUrl;
exports.buildProxiedUrlFromRequest = buildProxiedUrlFromRequest;
exports.PROXY_PREFIX = "/proxy/typeform";
function buildProxiedUrl(targetUrl, options) {
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
    return `${exports.PROXY_PREFIX}?${params.toString()}`;
}
function buildProxiedUrlFromRequest(targetUrl, req) {
    return buildProxiedUrl(targetUrl, {
        roomId: String(req.query.roomId ?? ""),
        role: String(req.query.role ?? "driver"),
        editorId: String(req.query.editorId ?? ""),
        token: String(req.query.token ?? ""),
        collab: String(req.query.collab ?? ""),
        username: String(req.query.username ?? ""),
    });
}
