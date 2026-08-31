"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listGoogleFormsHosts = listGoogleFormsHosts;
exports.isGoogleFormsHostAllowed = isGoogleFormsHostAllowed;
exports.isGoogleFormsPathAllowed = isGoogleFormsPathAllowed;
exports.assertAllowedGoogleFormsUrl = assertAllowedGoogleFormsUrl;
/**
 * Hosts the Google Forms proxy may fetch from.
 *
 * A rendered Google Form pulls markup from docs.google.com but loads its
 * freebird modules, fonts and images from several gstatic/googleusercontent
 * hosts, so all of them have to be proxyable for the page to work inside the
 * Lowcoder iframe. Entries starting with "." match any subdomain.
 */
const DEFAULT_GOOGLE_FORMS_HOSTS = [
    "docs.google.com",
    "drive.google.com",
    "accounts.google.com",
    "apis.google.com",
    "clients6.google.com",
    "www.google.com",
    "www.gstatic.com",
    "ssl.gstatic.com",
    "fonts.googleapis.com",
    "fonts.gstatic.com",
    ".googleusercontent.com",
    ".gstatic.com",
];
/** Paths served by docs.google.com that belong to a form and its assets. */
const GOOGLE_FORMS_PATH_PREFIXES = [
    "/forms/",
    "/_/",
    "/static/",
    "/js/",
    "/xjs/",
    "/u/",
    "/picker",
];
function parseHostList(raw) {
    return (raw ?? "")
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
}
const ALLOWED_HOSTS = Array.from(new Set([
    ...DEFAULT_GOOGLE_FORMS_HOSTS,
    ...parseHostList(process.env.LOWCODER_GOOGLE_FORMS_ALLOWED_HOSTS),
]));
function listGoogleFormsHosts() {
    return [...ALLOWED_HOSTS];
}
function isGoogleFormsHostAllowed(hostname) {
    const host = hostname.toLowerCase();
    return ALLOWED_HOSTS.some((allowed) => allowed.startsWith(".") ? host.endsWith(allowed) : host === allowed);
}
/**
 * docs.google.com is restricted to form/asset paths; the remaining hosts are
 * asset or sign-in origins where any path is fine.
 */
function isGoogleFormsPathAllowed(url) {
    const host = url.hostname.toLowerCase();
    if (host !== "docs.google.com" && host !== "drive.google.com")
        return true;
    return GOOGLE_FORMS_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}
function assertAllowedGoogleFormsUrl(url) {
    if (url.protocol !== "https:" ||
        !isGoogleFormsHostAllowed(url.hostname) ||
        !isGoogleFormsPathAllowed(url)) {
        throw new Error(`Google Forms URL is not allowed: ${url.toString()}`);
    }
}
