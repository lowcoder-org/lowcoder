"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GOOGLE_ROOT_PATH_PREFIXES = void 0;
exports.rewriteGoogleFormsBody = rewriteGoogleFormsBody;
exports.stripSubresourceIntegrity = stripSubresourceIntegrity;
const googleFormsHosts_1 = require("./googleFormsHosts");
/** Root-relative prefixes that belong to Google rather than to Lowcoder. */
exports.GOOGLE_ROOT_PATH_PREFIXES = [
    "forms",
    "_",
    "static",
    "js",
    "xjs",
    "u",
    "images",
    "logos",
    "css",
];
function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const HOST_PATTERN = (0, googleFormsHosts_1.listGoogleFormsHosts)()
    .map((host) => (host.startsWith(".") ? `[a-z0-9-]+${escapeRegex(host)}` : escapeRegex(host)))
    .join("|");
const ROOT_PATH_PATTERN = exports.GOOGLE_ROOT_PATH_PREFIXES.map(escapeRegex).join("|");
const ABSOLUTE_URL_RE = new RegExp(`https?://(?:${HOST_PATTERN})(?:/[^"'\\s<>()\\\\]*)?`, "gi");
const ESCAPED_ABSOLUTE_URL_RE = new RegExp(`https?:\\\\/\\\\/(?:${HOST_PATTERN})(?:\\\\/[^"'\\s<>()]*)?`, "gi");
const PROTOCOL_RELATIVE_URL_RE = new RegExp(`(^|[^:\\w\\\\])//(?:${HOST_PATTERN})(?:/[^"'\\s<>()\\\\]*)?`, "gi");
const ESCAPED_PROTOCOL_RELATIVE_URL_RE = new RegExp(`\\\\/\\\\/(?:${HOST_PATTERN})(?:\\\\/[^"'\\s<>()]*)?`, "gi");
const ATTRIBUTE_ROOT_PATH_RE = new RegExp(`(href|src|action|data-src|poster)=(["'])(/(?:${ROOT_PATH_PATTERN})/[^"']*)\\2`, "gi");
const CSS_ROOT_PATH_RE = new RegExp(`url\\((["']?)(/(?:${ROOT_PATH_PATTERN})/[^"')]+)\\1\\)`, "gi");
const STRING_ROOT_PATH_RE = new RegExp(`(["'])(/(?:${ROOT_PATH_PATTERN})/[^"'\\s\\\\]*)\\1`, "g");
const ESCAPED_STRING_ROOT_PATH_RE = new RegExp(`\\\\/(?:${ROOT_PATH_PATTERN})(?:\\\\/[^"'\\s]*)`, "g");
const INTEGRITY_ATTRIBUTE_RE = /\sintegrity=(["'])[^"']*\1/gi;
function unescapeSlashes(value) {
    return value.replace(/\\\//g, "/");
}
function proxyAbsolute(rawUrl, context) {
    try {
        const parsed = new URL(rawUrl, context.upstreamUrl);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
            return null;
        if (!(0, googleFormsHosts_1.isGoogleFormsHostAllowed)(parsed.hostname))
            return null;
        parsed.protocol = "https:";
        return context.toProxied(parsed.toString());
    }
    catch {
        return null;
    }
}
function proxyRootPath(path, context) {
    return proxyAbsolute(`${context.upstreamUrl.origin}${path}`, context);
}
/** Applies every URL shape rewrite. Safe to run on HTML, CSS, JS and JSON. */
function rewriteGoogleFormsBody(body, context) {
    let output = body.replace(ESCAPED_ABSOLUTE_URL_RE, (match) => {
        return proxyAbsolute(unescapeSlashes(match), context) ?? match;
    });
    output = output.replace(ABSOLUTE_URL_RE, (match) => proxyAbsolute(match, context) ?? match);
    output = output.replace(ESCAPED_PROTOCOL_RELATIVE_URL_RE, (match) => {
        return proxyAbsolute(`https:${unescapeSlashes(match)}`, context) ?? match;
    });
    output = output.replace(PROTOCOL_RELATIVE_URL_RE, (match, prefix) => {
        const url = match.slice(prefix.length);
        const proxied = proxyAbsolute(`https:${url}`, context);
        return proxied ? `${prefix}${proxied}` : match;
    });
    output = output.replace(ATTRIBUTE_ROOT_PATH_RE, (match, attribute, quote, path) => {
        const proxied = proxyRootPath(path, context);
        return proxied ? `${attribute}=${quote}${proxied}${quote}` : match;
    });
    output = output.replace(CSS_ROOT_PATH_RE, (match, quote, path) => {
        const proxied = proxyRootPath(path, context);
        return proxied ? `url(${quote}${proxied}${quote})` : match;
    });
    output = output.replace(STRING_ROOT_PATH_RE, (match, quote, path) => {
        const proxied = proxyRootPath(path, context);
        return proxied ? `${quote}${proxied}${quote}` : match;
    });
    output = output.replace(ESCAPED_STRING_ROOT_PATH_RE, (match) => {
        const proxied = proxyRootPath(unescapeSlashes(match), context);
        return proxied ?? match;
    });
    return output;
}
/**
 * Rewritten scripts no longer match Google's subresource hashes, so the hashes
 * have to go or the browser refuses to execute the proxied modules.
 */
function stripSubresourceIntegrity(html) {
    return html.replace(INTEGRITY_ATTRIBUTE_RE, "");
}
