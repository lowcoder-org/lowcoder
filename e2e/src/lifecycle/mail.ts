import { ECHO_PATHS, INVITE_LINK_PATH, MAIL_SUBJECTS, RESET_PASSWORD_PAGE, RESET_TOKEN_PARAM } from "../constants";

/** One message as the mail sink answers it (scripts/echo-server.js): `data` is the message bytes as latin1 text. */
export interface SinkMail {
  from: string;
  to: string[];
  data: string;
}

/** A leaf of the MIME tree: its content type, and its body decoded from the transfer encoding and the charset. */
export interface MailPart {
  contentType: string;
  text: string;
}

export interface ParsedMail {
  from: string;
  to: string[];
  subject: string;
  /** The decoded text of every text/* leaf, in message order. */
  parts: MailPart[];
}

/** A transfer encoding the parser does not decode (nothing the server sends today uses one). */
export class UnsupportedMailEncodingError extends Error {
  constructor(encoding: string) {
    super(`the mail uses the transfer encoding "${encoding}", which the parser does not decode`);
    this.name = "UnsupportedMailEncodingError";
  }
}

/** A message the parser cannot read: no header/body separator, a multipart without a boundary, a link that is not there. */
export class MalformedMailError extends Error {
  constructor(reason: string) {
    super(`malformed mail: ${reason}`);
    this.name = "MalformedMailError";
  }
}

const HEADER_BODY_SEPARATOR = "\r\n\r\n";
const MULTIPART_PREFIX = "multipart/";
const BASE_64 = "base64";
const QUOTED_PRINTABLE = "quoted-printable";
const IDENTITY_ENCODINGS = ["7bit", "8bit", "binary", ""];
const DEFAULT_CHARSET = "utf-8";
const ENCODED_WORD = /=\?([^?]+)\?([bBqQ])\?([^?]*)\?=/g;
const MAX_MIME_DEPTH = 8;
/** The characters of a URL-encoded token (`URLEncoder` leaves letters, digits and `.-*_`; the rest is `%XX`): a delimiter after the link is not part of it. */
const LINK_TOKEN_CHARS = "[A-Za-z0-9%.*_~-]+";

/** The headers of a block as a lower-case name -> value map (folded lines unfolded, the first of a repeated name wins). */
function parseHeaders(block: string): Map<string, string> {
  const headers = new Map<string, string>();
  for (const line of block.replace(/\r\n[ \t]+/g, " ").split("\r\n")) {
    const colon = line.indexOf(":");
    if (colon > 0) {
      const name = line.slice(0, colon).trim().toLowerCase();
      if (!headers.has(name)) {
        headers.set(name, line.slice(colon + 1).trim());
      }
    }
  }
  return headers;
}

function splitMessage(raw: string): { headers: Map<string, string>; body: string } {
  const at = raw.indexOf(HEADER_BODY_SEPARATOR);
  if (at < 0) {
    throw new MalformedMailError("no blank line between the headers and the body");
  }
  return { headers: parseHeaders(raw.slice(0, at)), body: raw.slice(at + HEADER_BODY_SEPARATOR.length) };
}

/** A part of a multipart: like a message, except that a part with no headers starts with its blank line. */
function splitPart(part: string): { headers: Map<string, string>; body: string } {
  return part.startsWith("\r\n") ? { headers: new Map(), body: part.slice(2) } : splitMessage(part);
}

/** `type; key=value; key="value"` -> the type and the parameters. */
function parseParameterised(value: string): { main: string; parameters: Map<string, string> } {
  const [main = "", ...rest] = value.split(";");
  const parameters = new Map<string, string>();
  for (const item of rest) {
    const equals = item.indexOf("=");
    if (equals > 0) {
      parameters.set(item.slice(0, equals).trim().toLowerCase(), item.slice(equals + 1).trim().replace(/^"(.*)"$/, "$1"));
    }
  }
  return { main: main.trim().toLowerCase(), parameters };
}

function decodeBytes(bytes: Buffer, charset: string): string {
  try {
    return new TextDecoder(charset).decode(bytes);
  } catch {
    throw new MalformedMailError(`unknown charset "${charset}"`);
  }
}

function quotedPrintableBytes(text: string): Buffer {
  const joined = text.replace(/=\r\n/g, "");
  const bytes: number[] = [];
  for (let index = 0; index < joined.length; index += 1) {
    const hex = joined.slice(index + 1, index + 3);
    if (joined[index] === "=" && /^[0-9A-Fa-f]{2}$/.test(hex)) {
      bytes.push(parseInt(hex, 16));
      index += 2;
    } else {
      bytes.push(joined.charCodeAt(index) & 0xff);
    }
  }
  return Buffer.from(bytes);
}

/** The body of a leaf as text: transfer encoding undone, then the charset. */
function decodeBody(body: string, encoding: string, charset: string): string {
  const name = encoding.toLowerCase();
  if (name === BASE_64) {
    return decodeBytes(Buffer.from(body.replace(/\s+/g, ""), "base64"), charset);
  }
  if (name === QUOTED_PRINTABLE) {
    return decodeBytes(quotedPrintableBytes(body), charset);
  }
  if (IDENTITY_ENCODINGS.includes(name)) {
    return decodeBytes(Buffer.from(body, "latin1"), charset);
  }
  throw new UnsupportedMailEncodingError(encoding);
}

/** RFC 2047 encoded words of a header value ("=?utf-8?B?...?=" and "=?utf-8?Q?...?="). */
function decodeHeaderWords(value: string): string {
  return value.replace(ENCODED_WORD, (_match, charset: string, kind: string, payload: string) =>
    kind.toUpperCase() === "B"
      ? decodeBytes(Buffer.from(payload, "base64"), charset)
      : decodeBytes(quotedPrintableBytes(payload.replace(/_/g, " ")), charset),
  );
}

function walk(headers: Map<string, string>, body: string, depth: number, out: MailPart[]): void {
  if (depth > MAX_MIME_DEPTH) {
    throw new MalformedMailError(`more than ${MAX_MIME_DEPTH} levels of multipart`);
  }
  const type = parseParameterised(headers.get("content-type") ?? "text/plain");
  if (type.main.startsWith(MULTIPART_PREFIX)) {
    const boundary = type.parameters.get("boundary");
    if (!boundary) {
      throw new MalformedMailError("a multipart without a boundary");
    }
    // A delimiter is `--boundary` at the start of a line (RFC 2046 5.1.1), optionally closed by `--`; the same text inside a part is content.
    const escaped = boundary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const delimiters = [...body.matchAll(new RegExp(`(?:^|\r\n)--${escaped}(--)?[ \t]*(?=\r\n|$)`, "g"))];
    for (let index = 0; index < delimiters.length; index += 1) {
      const delimiter = delimiters[index]!;
      if (delimiter[1] !== undefined) {
        break; // the closing delimiter
      }
      const start = delimiter.index + delimiter[0].length;
      const end = delimiters[index + 1]?.index ?? body.length;
      const child = splitPart(body.slice(start, end).replace(/^\r\n/, ""));
      walk(child.headers, child.body, depth + 1, out);
    }
    return;
  }
  if (type.main.startsWith("text/")) {
    const charset = type.parameters.get("charset") ?? DEFAULT_CHARSET;
    out.push({ contentType: type.main, text: decodeBody(body, headers.get("content-transfer-encoding") ?? "", charset) });
  }
}

/** Parses a message of the sink: the main headers, and the decoded text of every text/* leaf of its MIME tree. */
export function parseMail(mail: SinkMail): ParsedMail {
  const { headers, body } = splitMessage(mail.data);
  const parts: MailPart[] = [];
  walk(headers, body, 0, parts);
  return { from: mail.from, to: mail.to, subject: decodeHeaderWords(headers.get("subject") ?? ""), parts };
}

/** All text parts joined, one per line. */
export function textOf(mail: ParsedMail): string {
  return mail.parts.map((part) => part.text).join("\n");
}

/**
 * The reset token of a password-reset mail: the value of the `token` parameter of its link, percent-decoded. The link's host is
 * the server's configured public URL, so only the path (RESET_PASSWORD_PAGE, whatever slashes precede it) is matched.
 * Throws MalformedMailError when the mail holds no such link (the message names neither the token nor the mail).
 */
export function resetTokenOf(mail: ParsedMail): string {
  const match = new RegExp(`${RESET_PASSWORD_PAGE.replace(/\//g, "\\/")}\\?${RESET_TOKEN_PARAM}=(${LINK_TOKEN_CHARS})`).exec(textOf(mail));
  const encoded = match?.[1];
  if (encoded === undefined) {
    throw new MalformedMailError(`no ${RESET_PASSWORD_PAGE} link with a ${RESET_TOKEN_PARAM}`);
  }
  try {
    return decodeURIComponent(encoded);
  } catch {
    throw new MalformedMailError("the token of the reset link is not valid percent-encoding");
  }
}

/**
 * The reset link of a password-reset mail exactly as mailed (the path starts with whatever slashes the server's public URL
 * leaves). It holds the token: use it to open a page, never put it into a matcher or a message.
 */
export function resetLinkOf(mail: ParsedMail): string {
  const match = new RegExp(`https?:\\/\\/[^\\s<"']*${RESET_PASSWORD_PAGE.replace(/\//g, "\\/")}\\?${RESET_TOKEN_PARAM}=${LINK_TOKEN_CHARS}`).exec(textOf(mail));
  if (!match) {
    throw new MalformedMailError(`no ${RESET_PASSWORD_PAGE} link with a ${RESET_TOKEN_PARAM}`);
  }
  return match[0];
}

/** A link with the repeated slashes of its path collapsed (`http://h//user/x` -> `http://h/user/x`): what a browser needs when the public URL ends in a slash. */
export function withSingleSlashes(link: string): string {
  const url = new URL(link);
  url.pathname = url.pathname.replace(/\/{2,}/g, "/");
  return url.toString();
}

/** The invitation code of an invitation mail: the text after `/invite/` in its link. */
export function inviteCodeOf(mail: ParsedMail): string {
  const match = new RegExp(`${INVITE_LINK_PATH.replace(/\//g, "\\/")}([A-Za-z0-9]+)`).exec(textOf(mail));
  const code = match?.[1];
  if (code === undefined) {
    throw new MalformedMailError(`no ${INVITE_LINK_PATH} link with a code`);
  }
  return code;
}

/** Whether a parsed mail is a password-reset mail / an invitation (by subject). */
export function isPasswordReset(mail: ParsedMail): boolean {
  return mail.subject === MAIL_SUBJECTS.PASSWORD_RESET;
}

export function isInvitation(mail: ParsedMail): boolean {
  return mail.subject === MAIL_SUBJECTS.INVITATION;
}

/** How long `waitForMail` polls, and how often (the server sends a mail within the request, so a short wait covers a slow stack). */
const MAIL_WAIT_TIMEOUT_MS = 10_000;
const MAIL_POLL_INTERVAL_MS = 200;

export class MailTimeoutError extends Error {
  constructor(subject: string, waitedMs: number) {
    super(`no mail with the subject "${subject}" arrived within ${waitedMs} ms`);
    this.name = "MailTimeoutError";
  }
}

/** Reads the mails the server sent to the sink. */
export interface Mailbox {
  /** Every mail sent to `address` so far (case-insensitive), oldest first, parsed. */
  mailsTo: (address: string) => Promise<ParsedMail[]>;
  /** The mails with `subject` sent to `address`, once at least `count` (default 1) of them are there; throws MailTimeoutError. */
  waitForMail: (address: string, subject: string, count?: number) => Promise<ParsedMail[]>;
}

/**
 * A mailbox over the sink at `echoBaseUrl`. It reads with Node's own `fetch`, NOT a Playwright request context: a context
 * created while a test runs lands in the trace, and the mails hold reset tokens.
 */
export function mailboxAt(echoBaseUrl: string): Mailbox {
  const mailsTo = async (address: string): Promise<ParsedMail[]> => {
    const response = await fetch(`${echoBaseUrl}${ECHO_PATHS.MAILS}?to=${encodeURIComponent(address)}`);
    if (!response.ok) {
      throw new Error(`the mail sink answered ${response.status} to the read of the mails of ${address}`);
    }
    return ((await response.json()) as SinkMail[]).map(parseMail);
  };
  const waitForMail = async (address: string, subject: string, count = 1): Promise<ParsedMail[]> => {
    const deadline = Date.now() + MAIL_WAIT_TIMEOUT_MS;
    for (;;) {
      const found = (await mailsTo(address)).filter((mail) => mail.subject === subject);
      if (found.length >= count) {
        return found;
      }
      if (Date.now() > deadline) {
        throw new MailTimeoutError(subject, MAIL_WAIT_TIMEOUT_MS);
      }
      await new Promise((resolve) => setTimeout(resolve, MAIL_POLL_INTERVAL_MS));
    }
  };
  return { mailsTo, waitForMail };
}
