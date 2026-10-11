"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeGoogleCookies = storeGoogleCookies;
exports.buildGoogleCookieHeader = buildGoogleCookieHeader;
const MAX_JARS = 500;
const MAX_COOKIES_PER_JAR = 300;
const JAR_TTL_MS = 12 * 60 * 60 * 1000;
const jars = new Map();
function defaultPath(pathname) {
    if (!pathname.startsWith("/"))
        return "/";
    const lastSlash = pathname.lastIndexOf("/");
    return lastSlash <= 0 ? "/" : pathname.slice(0, lastSlash);
}
function domainMatches(host, cookie) {
    if (cookie.hostOnly)
        return host === cookie.domain;
    return host === cookie.domain || host.endsWith(`.${cookie.domain}`);
}
function pathMatches(pathname, cookiePath) {
    if (cookiePath === "/")
        return true;
    if (pathname === cookiePath)
        return true;
    return pathname.startsWith(cookiePath.endsWith("/") ? cookiePath : `${cookiePath}/`);
}
function parseSetCookie(raw, url) {
    const segments = raw.split(";");
    const [nameValue, ...attributes] = segments;
    const separator = nameValue.indexOf("=");
    if (separator <= 0)
        return null;
    const name = nameValue.slice(0, separator).trim();
    const value = nameValue.slice(separator + 1).trim();
    if (!name)
        return null;
    const host = url.hostname.toLowerCase();
    const cookie = {
        name,
        value,
        domain: host,
        path: defaultPath(url.pathname),
        hostOnly: true,
    };
    for (const attribute of attributes) {
        const index = attribute.indexOf("=");
        const key = (index === -1 ? attribute : attribute.slice(0, index)).trim().toLowerCase();
        const attributeValue = index === -1 ? "" : attribute.slice(index + 1).trim();
        if (key === "domain" && attributeValue) {
            const domain = attributeValue.replace(/^\./, "").toLowerCase();
            // A response may not set cookies for an unrelated domain.
            if (host !== domain && !host.endsWith(`.${domain}`))
                return null;
            cookie.domain = domain;
            cookie.hostOnly = false;
            continue;
        }
        if (key === "path" && attributeValue.startsWith("/")) {
            cookie.path = attributeValue;
            continue;
        }
        if (key === "max-age" && attributeValue) {
            const seconds = Number(attributeValue);
            if (!Number.isNaN(seconds))
                cookie.expiresAt = Date.now() + seconds * 1000;
            continue;
        }
        if (key === "expires" && attributeValue && cookie.expiresAt === undefined) {
            const parsed = Date.parse(attributeValue);
            if (!Number.isNaN(parsed))
                cookie.expiresAt = parsed;
        }
    }
    return cookie;
}
function pruneJars() {
    const now = Date.now();
    for (const [key, jar] of jars) {
        if (now - jar.lastUsed > JAR_TTL_MS)
            jars.delete(key);
    }
    if (jars.size <= MAX_JARS)
        return;
    const oldestFirst = [...jars.entries()].sort((a, b) => a[1].lastUsed - b[1].lastUsed);
    for (const [key] of oldestFirst.slice(0, jars.size - MAX_JARS)) {
        jars.delete(key);
    }
}
function getJar(sessionKey, create) {
    const existing = jars.get(sessionKey);
    if (existing) {
        existing.lastUsed = Date.now();
        return existing;
    }
    if (!create)
        return undefined;
    pruneJars();
    const jar = { cookies: new Map(), lastUsed: Date.now() };
    jars.set(sessionKey, jar);
    return jar;
}
function storeGoogleCookies(sessionKey, url, rawSetCookies) {
    if (!sessionKey || !rawSetCookies?.length)
        return;
    const jar = getJar(sessionKey, true);
    if (!jar)
        return;
    for (const raw of rawSetCookies) {
        const cookie = parseSetCookie(raw, url);
        if (!cookie)
            continue;
        const id = `${cookie.domain}|${cookie.path}|${cookie.name}`;
        const expired = cookie.expiresAt !== undefined && cookie.expiresAt <= Date.now();
        if (expired || cookie.value === "") {
            jar.cookies.delete(id);
            continue;
        }
        jar.cookies.set(id, cookie);
    }
    if (jar.cookies.size > MAX_COOKIES_PER_JAR) {
        const excess = jar.cookies.size - MAX_COOKIES_PER_JAR;
        for (const id of [...jar.cookies.keys()].slice(0, excess)) {
            jar.cookies.delete(id);
        }
    }
}
function buildGoogleCookieHeader(sessionKey, url) {
    if (!sessionKey)
        return "";
    const jar = getJar(sessionKey, false);
    if (!jar)
        return "";
    const now = Date.now();
    const host = url.hostname.toLowerCase();
    const matching = [];
    for (const [id, cookie] of jar.cookies) {
        if (cookie.expiresAt !== undefined && cookie.expiresAt <= now) {
            jar.cookies.delete(id);
            continue;
        }
        if (domainMatches(host, cookie) && pathMatches(url.pathname, cookie.path)) {
            matching.push(cookie);
        }
    }
    return matching
        .sort((a, b) => b.path.length - a.path.length)
        .map((cookie) => `${cookie.name}=${cookie.value}`)
        .join("; ");
}
