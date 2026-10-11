import fetch from "node-fetch";

const PUBLISHED_VIEWFORM_RE = /\/forms\/d\/e\/[^/]+\/viewform/i;
const DRIVE_FORM_ID_RE = /\/forms\/d\/([^/]+)\/(edit|viewform|preview)/i;

export function isPublishedViewformUrl(url: URL): boolean {
  return PUBLISHED_VIEWFORM_RE.test(url.pathname);
}

export function cleanViewformUrl(rawUrl: string): string {
  const url = new URL(rawUrl.trim());
  if (!url.pathname.startsWith("/forms/")) {
    throw new Error("googleFormUrl must point to a Google Form");
  }
  if (!url.pathname.includes("/viewform")) {
    throw new Error(
      "googleFormUrl must be a published responder URL ending with /viewform. " +
        "Do not use webViewLink or /edit URLs from Google Drive."
    );
  }
  url.pathname = url.pathname.replace(/\/viewform.*/i, "/viewform");
  url.search = "";
  url.hash = "";
  return url.toString();
}

function extractViewformFromHtml(html: string): string | null {
  const patterns = [
    /https:\/\/docs\.google\.com\/forms\/d\/e\/[^"'\\\s]+\/viewform/gi,
    /"publishedFormUrl":"(https:\\\/\\\/docs\.google\.com\\\/forms\\\/d\\\/e\\\/[^"\\]+\\\/viewform)"/i,
    /"responderUri":"(https:\\\/\\\/docs\.google\.com\\\/forms\\\/d\\\/e\\\/[^"\\]+\\\/viewform)"/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (!match?.[0]) continue;
    const candidate = match[0]
      .replace(/^"publishedFormUrl":"|"responderUri":"/, "")
      .replace(/"$/, "")
      .replace(/\\\//g, "/");
    try {
      return cleanViewformUrl(candidate);
    } catch {
      continue;
    }
  }
  return null;
}

async function followToPublishedViewform(startUrl: string): Promise<string | null> {
  let current = startUrl;

  for (let step = 0; step < 12; step += 1) {
    const response = await fetch(current, {
      method: "GET",
      redirect: "manual",
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; LowcoderGoogleFormsProxy/1.0; +https://lowcoder.cloud)",
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return null;
      current = new URL(location, current).toString();
      const parsed = new URL(current);
      if (isPublishedViewformUrl(parsed)) {
        return cleanViewformUrl(current);
      }
      continue;
    }

    if (response.status === 200) {
      const html = await response.text();
      const scraped = extractViewformFromHtml(html);
      if (scraped) return scraped;

      const parsed = new URL(current);
      if (isPublishedViewformUrl(parsed)) {
        return cleanViewformUrl(current);
      }
    }

    return null;
  }

  return null;
}

/**
 * Normalize Drive/webViewLink or draft form URLs to a published responder URL.
 * Collaboration only works on public /viewform pages that stay inside the proxy.
 */
export async function resolveGoogleFormResponderUrl(rawUrl?: string): Promise<string> {
  const value = (rawUrl ?? "").trim();
  if (!value) throw new Error("googleFormUrl is required");

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("googleFormUrl must be a valid URL");
  }

  if (url.protocol !== "https:" || url.hostname !== "docs.google.com") {
    throw new Error("googleFormUrl must be an https://docs.google.com/forms URL");
  }
  if (!url.pathname.startsWith("/forms/")) {
    throw new Error("googleFormUrl must point to a Google Form");
  }

  if (isPublishedViewformUrl(url)) {
    return cleanViewformUrl(url.toString());
  }

  const driveMatch = url.pathname.match(DRIVE_FORM_ID_RE);
  if (driveMatch?.[1] && driveMatch[1] !== "e") {
    const formId = driveMatch[1];
    const candidates = [
      `https://docs.google.com/forms/d/${formId}/viewform`,
      `https://docs.google.com/forms/d/${formId}/preview`,
    ];

    for (const candidate of candidates) {
      const resolved = await followToPublishedViewform(candidate);
      if (resolved) return resolved;
    }
  }

  throw new Error(
    "Could not resolve a published Google Form responder URL. " +
      "Open the form in Google Forms, click Send, copy the public link " +
      "(https://docs.google.com/forms/d/e/.../viewform), and use that instead of webViewLink."
  );
}
