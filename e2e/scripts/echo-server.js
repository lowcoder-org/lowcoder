"use strict";

/**
 * HTTP echo sidecar of the end-to-end run (started by scripts/run-in-docker.sh on the run's own Docker network, under the
 * alias e2e-echo). It is the target of the requests that the SERVER makes inside the application container (the npm
 * registry proxy of node-service, the n8n plugin): a test points the app at `http://e2e-echo:<port>/t/<test id>` and then
 * reads back what arrived.
 *
 * - Every request except `/__e2e/*` is recorded as { method, path, headers, body } and answered 200 with `{}` (JSON).
 *   `path` includes the query string. The body is UTF-8 text cut at MAX_BODY_BYTES; at most MAX_RECORDS records are kept
 *   (the oldest are dropped).
 * - GET /__e2e/health answers `ok`.
 * - GET /__e2e/requests?prefix=<p> answers the records whose path starts with <p>, as a JSON array.
 * - POST /__e2e/answers { prefix, status, contentType, body } stores a canned answer: a request (any method) whose path starts with
 *   `prefix` is still recorded and then gets that status, content type and body instead of `{}`. One entry per prefix (the latest wins),
 *   the longest matching prefix answers, at most MAX_RECORDS entries are kept (the oldest are dropped). The control answer is 204; an
 *   invalid entry (prefix not starting with "/", status outside 100-599, a non-string body or content type, body over MAX_BODY_BYTES) is 400.
 *   Every other path keeps the `{}` answer, so the outbound tests are unaffected.
 *   An entry may also carry `barrier: { prefix, count, timeoutMs }` (prefix starting with "/", integer count 2-MAX_BARRIER_COUNT, integer
 *   timeoutMs 1-MAX_BARRIER_TIMEOUT_MS; anything else is 400). The answer is then WITHHELD (the request is recorded on arrival) until `count`
 *   requests answered by entries with that same barrier prefix are waiting at once; then all of them are answered together. If the count is
 *   not reached within timeoutMs of the first waiting request, every waiting request is answered 504 `barrier timeout` instead. So a
 *   test that gets the canned answers has proved that `count` requests were waiting at the echo at the same time; a group that never fills fails loudly.
 *
 * It is also the run's mail sink: a minimal SMTP listener on MAIL_PORT (default 2525) accepts every message the SERVER
 * sends (password reset, invitation) and delivers it nowhere.
 * - One record per message: { from, to: string[], data } with `data` the message bytes as latin1 text (so a consumer decodes
 *   the transfer encoding and charset itself), dot-stuffing undone; the cap of MAX_BODY_BYTES counts the bytes as SENT (before
 *   dot-stuffing is undone), so a cut message with many dot-prefixed lines holds somewhat fewer decoded bytes; at most MAX_RECORDS are kept.
 * - GET /__e2e/mails?to=<address> answers the messages with that recipient (case-insensitive), as a JSON array.
 * - Supported commands: EHLO, HELO, MAIL FROM, RCPT TO, DATA, RSET, NOOP, QUIT; no STARTTLS, no AUTH, no PIPELINING advertised
 *   (a pipelining client is still answered in order). Parsing is stream-safe: command lines and the end of data may be split
 *   over any number of TCP chunks; a message past MAX_BODY_BYTES is drained, not stored, and still answered 250.
 *
 * Limits: the records live in memory and die with the container (nothing is written to disk); the server makes no request of
 * its own and has no dependency; it answers every other request, whatever the method, with the same `{}`, so it cannot
 * tell a test's request from a stray one except by the path prefix.
 */

const http = require("node:http");
const net = require("node:net");

const PORT = Number(process.env.ECHO_PORT || 8080);
const MAX_BODY_BYTES = 65536;
const MAX_RECORDS = 10000;
const CONTROL_PREFIX = "/__e2e/";
const HEALTH_PATH = "/__e2e/health";
const REQUESTS_PATH = "/__e2e/requests";
const MAILS_PATH = "/__e2e/mails";
const ANSWERS_PATH = "/__e2e/answers";
const MAX_BARRIER_COUNT = 100;
const MAX_BARRIER_TIMEOUT_MS = 30000;
const STATUS_GATEWAY_TIMEOUT = 504;
const STATUS_NO_CONTENT = 204;
const STATUS_BAD_REQUEST = 400;
const MIN_HTTP_STATUS = 100;
const MAX_HTTP_STATUS = 599;
const STATUS_OK = 200;
const STATUS_NOT_FOUND = 404;
const MAIL_PORT = Number(process.env.MAIL_PORT || 2525);
/** RFC 5321 4.5.3.1.4: a command line is at most 512 bytes including CRLF. */
const MAX_COMMAND_LINE_BYTES = 512;
const CRLF = Buffer.from("\r\n", "latin1");
const DATA_TERMINATOR = Buffer.from("\r\n.\r\n", "latin1");
/** Bytes held back while draining a message, so a terminator split across chunks is still found. */
const TERMINATOR_HOLD_BACK_BYTES = DATA_TERMINATOR.length - 1;

/** @type {{ method: string, path: string, headers: Record<string, string | string[] | undefined>, body: string }[]} */
const records = [];
/** @type {{ from: string, to: string[], data: string }[]} */
const mails = [];
/** @type {Map<string, { status: number, contentType: string, body: string, barrier?: { prefix: string, count: number, timeoutMs: number } }>} canned answers by path prefix, oldest first */
const answers = new Map();
/** @type {Map<string, { waiting: { response: import("node:http").ServerResponse, canned: object }[], timer: NodeJS.Timeout }>} requests held at a barrier, by barrier prefix */
const barrierGroups = new Map();

function send(response, status, contentType, text) {
  response.writeHead(status, { "content-type": contentType });
  response.end(text);
}

function validBarrier(barrier) {
  return (
    barrier !== null &&
    typeof barrier === "object" &&
    typeof barrier.prefix === "string" &&
    barrier.prefix.startsWith("/") &&
    Number.isInteger(barrier.count) &&
    barrier.count >= 2 &&
    barrier.count <= MAX_BARRIER_COUNT &&
    Number.isInteger(barrier.timeoutMs) &&
    barrier.timeoutMs >= 1 &&
    barrier.timeoutMs <= MAX_BARRIER_TIMEOUT_MS
  );
}

/** Holds a request whose canned answer has a barrier; answers the whole group when it is full, or 504 when its timeout runs out first. */
function holdAtBarrier(response, canned) {
  const { prefix, count, timeoutMs } = canned.barrier;
  let group = barrierGroups.get(prefix);
  if (!group) {
    group = { waiting: [], timer: setTimeout(() => releaseBarrier(prefix, false), timeoutMs) };
    barrierGroups.set(prefix, group);
  }
  group.waiting.push({ response, canned });
  if (group.waiting.length >= count) {
    releaseBarrier(prefix, true);
  }
}

function releaseBarrier(prefix, full) {
  const group = barrierGroups.get(prefix);
  if (!group) {
    return;
  }
  clearTimeout(group.timer);
  barrierGroups.delete(prefix);
  for (const { response, canned } of group.waiting) {
    if (response.writableEnded) {
      continue;
    }
    if (full) {
      send(response, canned.status, canned.contentType, canned.body);
    } else {
      send(response, STATUS_GATEWAY_TIMEOUT, "text/plain", "barrier timeout");
    }
  }
}

/** Validates and stores one canned answer; returns whether it was valid. */
function storeAnswer(text) {
  let entry;
  try {
    entry = JSON.parse(text);
  } catch {
    return false;
  }
  const valid =
    entry !== null &&
    typeof entry === "object" &&
    typeof entry.prefix === "string" &&
    entry.prefix.startsWith("/") &&
    Number.isInteger(entry.status) &&
    entry.status >= MIN_HTTP_STATUS &&
    entry.status <= MAX_HTTP_STATUS &&
    typeof entry.contentType === "string" &&
    typeof entry.body === "string" &&
    Buffer.byteLength(entry.body) <= MAX_BODY_BYTES &&
    (entry.barrier === undefined || validBarrier(entry.barrier));
  if (!valid) {
    return false;
  }
  answers.delete(entry.prefix);
  answers.set(entry.prefix, { status: entry.status, contentType: entry.contentType, body: entry.body, barrier: entry.barrier });
  if (answers.size > MAX_RECORDS) {
    answers.delete(answers.keys().next().value);
  }
  return true;
}

/** The canned answer of the longest stored prefix of a path (the query string is ignored), or undefined. */
function cannedAnswerFor(path) {
  const pathname = path.split("?")[0];
  let best;
  for (const [prefix, answer] of answers) {
    if (pathname.startsWith(prefix) && (best === undefined || prefix.length > best.prefix.length)) {
      best = { prefix, answer };
    }
  }
  return best?.answer;
}

function handleControl(request, response) {
  const url = new URL(request.url, "http://echo.invalid");
  if (request.method === "POST" && url.pathname === ANSWERS_PATH) {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      if (storeAnswer(Buffer.concat(chunks).toString("utf8"))) {
        response.writeHead(STATUS_NO_CONTENT).end();
      } else {
        send(response, STATUS_BAD_REQUEST, "text/plain", "invalid canned answer");
      }
    });
    return;
  }
  if (request.method === "GET" && url.pathname === HEALTH_PATH) {
    return send(response, STATUS_OK, "text/plain", "ok");
  }
  if (request.method === "GET" && url.pathname === REQUESTS_PATH) {
    const prefix = url.searchParams.get("prefix") ?? "";
    return send(
      response,
      STATUS_OK,
      "application/json",
      JSON.stringify(records.filter((record) => record.path.startsWith(prefix))),
    );
  }
  if (request.method === "GET" && url.pathname === MAILS_PATH) {
    const to = (url.searchParams.get("to") ?? "").toLowerCase();
    return send(
      response,
      STATUS_OK,
      "application/json",
      JSON.stringify(mails.filter((mail) => mail.to.some((recipient) => recipient.toLowerCase() === to))),
    );
  }
  return send(response, STATUS_NOT_FOUND, "text/plain", "unknown control path");
}

function handleRecorded(request, response) {
  const chunks = [];
  let size = 0;
  request.on("data", (chunk) => {
    if (size < MAX_BODY_BYTES) {
      chunks.push(chunk);
      size += chunk.length;
    }
  });
  request.on("end", () => {
    const body = Buffer.concat(chunks).subarray(0, MAX_BODY_BYTES).toString("utf8");
    records.push({ method: request.method, path: request.url, headers: request.headers, body });
    if (records.length > MAX_RECORDS) {
      records.splice(0, records.length - MAX_RECORDS);
    }
    const canned = cannedAnswerFor(request.url);
    if (canned?.barrier) {
      return holdAtBarrier(response, canned);
    }
    if (canned) {
      return send(response, canned.status, canned.contentType, canned.body);
    }
    send(response, STATUS_OK, "application/json", "{}");
  });
}

http
  .createServer((request, response) => {
    if (request.url.startsWith(CONTROL_PREFIX)) {
      return handleControl(request, response);
    }
    return handleRecorded(request, response);
  })
  .listen(PORT, "0.0.0.0", () => console.log(`echo server listening on ${PORT}`));

/** The address of `MAIL FROM:<a@b>` / `RCPT TO:<a@b>` (the text between the angle brackets, or the rest of the line). */
function addressOf(argument) {
  const match = /<([^>]*)>/.exec(argument);
  return (match ? match[1] : argument.replace(/^[^:]*:/, "")).trim();
}

/** One SMTP connection: a state machine over a per-connection buffer, so TCP chunk boundaries never decide anything. */
function handleSmtpConnection(socket) {
  let buffer = Buffer.alloc(0);
  let inData = false;
  let from = "";
  let recipients = [];
  let stored = [];
  let storedBytes = 0;
  /** The virtual leading CRLF is stored too, so the limit leaves room for it (it is stripped before the data is cut to MAX_BODY_BYTES). */
  const STORED_BYTES_LIMIT = MAX_BODY_BYTES + CRLF.length;

  const reply = (text) => socket.write(`${text}\r\n`);
  const resetEnvelope = () => {
    from = "";
    recipients = [];
  };

  /** Keeps the first MAX_BODY_BYTES of the message and drops the rest (the message is still drained). */
  const store = (bytes) => {
    if (storedBytes >= STORED_BYTES_LIMIT) {
      return;
    }
    const room = STORED_BYTES_LIMIT - storedBytes;
    const part = bytes.subarray(0, room);
    stored.push(part);
    storedBytes += part.length;
  };

  const finishMessage = () => {
    // The data started after a virtual CRLF (so a message that opens with the terminator is found): drop it, undo dot-stuffing.
    const data = Buffer.concat(stored).toString("latin1").replace(/\r\n\.\./g, "\r\n.").replace(/^\r\n/, "").slice(0, MAX_BODY_BYTES);
    mails.push({ from, to: recipients, data });
    if (mails.length > MAX_RECORDS) {
      mails.splice(0, mails.length - MAX_RECORDS);
    }
    stored = [];
    storedBytes = 0;
    inData = false;
    resetEnvelope();
    reply("250 message accepted");
  };

  const handleCommand = (line) => {
    const [verb, ...rest] = line.trim().split(" ");
    const argument = rest.join(" ");
    switch (verb.toUpperCase()) {
      case "EHLO":
      case "HELO":
        return reply("250 e2e-mail");
      case "MAIL":
        resetEnvelope();
        from = addressOf(argument);
        return reply("250 ok");
      case "RCPT":
        recipients.push(addressOf(argument));
        return reply("250 ok");
      case "DATA":
        if (recipients.length === 0) {
          return reply("503 need RCPT first");
        }
        inData = true;
        stored = [];
        storedBytes = 0;
        buffer = Buffer.concat([CRLF, buffer]); // the virtual CRLF before the first data line
        return reply("354 end data with <CR><LF>.<CR><LF>");
      case "RSET":
        resetEnvelope();
        return reply("250 ok");
      case "NOOP":
        return reply("250 ok");
      case "QUIT":
        reply("221 bye");
        return socket.end();
      default:
        return reply("502 command not implemented");
    }
  };

  /** Consumes the buffer as far as it holds complete input. */
  const drain = () => {
    for (;;) {
      if (socket.destroyed || socket.writableEnded) {
        return;
      }
      if (inData) {
        const end = buffer.indexOf(DATA_TERMINATOR);
        if (end >= 0) {
          store(buffer.subarray(0, end));
          buffer = buffer.subarray(end + DATA_TERMINATOR.length);
          finishMessage();
          continue;
        }
        const keep = Math.min(TERMINATOR_HOLD_BACK_BYTES, buffer.length);
        store(buffer.subarray(0, buffer.length - keep));
        buffer = buffer.subarray(buffer.length - keep);
        return;
      }
      const lineEnd = buffer.indexOf(CRLF);
      if (lineEnd < 0) {
        if (buffer.length > MAX_COMMAND_LINE_BYTES) {
          reply("500 line too long");
          socket.end();
        }
        return;
      }
      if (lineEnd + CRLF.length > MAX_COMMAND_LINE_BYTES) {
        reply("500 line too long");
        socket.end();
        return;
      }
      const line = buffer.subarray(0, lineEnd).toString("latin1");
      buffer = buffer.subarray(lineEnd + CRLF.length);
      handleCommand(line);
    }
  };

  socket.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    drain();
  });
  socket.on("error", () => socket.destroy());
  reply("220 e2e-mail ready");
}

net.createServer(handleSmtpConnection).listen(MAIL_PORT, "0.0.0.0", () => console.log(`mail sink listening on ${MAIL_PORT}`));
