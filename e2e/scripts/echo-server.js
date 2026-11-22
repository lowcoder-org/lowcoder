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
 *
 * Limits: the records live in memory and die with the container (nothing is written to disk); the server makes no request of
 * its own and has no dependency; it answers every other request, whatever the method, with the same `{}`, so it cannot
 * tell a test's request from a stray one except by the path prefix.
 */

const http = require("node:http");

const PORT = Number(process.env.ECHO_PORT || 8080);
const MAX_BODY_BYTES = 65536;
const MAX_RECORDS = 10000;
const CONTROL_PREFIX = "/__e2e/";
const HEALTH_PATH = "/__e2e/health";
const REQUESTS_PATH = "/__e2e/requests";
const STATUS_OK = 200;
const STATUS_NOT_FOUND = 404;

/** @type {{ method: string, path: string, headers: Record<string, string | string[] | undefined>, body: string }[]} */
const records = [];

function send(response, status, contentType, text) {
  response.writeHead(status, { "content-type": contentType });
  response.end(text);
}

function handleControl(request, response) {
  const url = new URL(request.url, "http://echo.invalid");
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
