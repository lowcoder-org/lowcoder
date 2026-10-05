#!/usr/bin/env node

/**
 * Hocuspocus (Yjs WebSocket) Server for ChatBox v2
 *
 * Provides real-time shared state via Yjs documents served over WebSocket.
 * Each application room maps to a Yjs document. Presence is handled through
 * Hocuspocus awareness on the client side.
 *
 * Env vars:
 *   PORT               - HTTP/WebSocket port (default 3006)
 *   HOST               - Bind address (default 0.0.0.0)
 *   HOCUSPOCUS_SECRET  - Optional shared secret for token auth
 *
 * Usage: node hocuspocus-server.js
 */

import { Server } from "@hocuspocus/server";

const PORT = parseInt(process.env.PORT || "3006", 10);
const HOST = process.env.HOST || "0.0.0.0";
const SECRET = process.env.HOCUSPOCUS_SECRET || "";

function writeJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json" });
  response.end(JSON.stringify(payload));
}

const server = new Server({
  name: "lowcoder-hocuspocus",
  quiet: true,
  address: HOST,
  port: PORT,

  async onListen() {
    console.log(`[hocuspocus] listening on ws://${HOST}:${PORT}`);
  },

  async onRequest({ request, response }) {
    if (request.url === "/health") {
      writeJson(response, 200, {
        status: "ok",
        host: HOST,
        port: PORT,
        auth: SECRET ? "enabled" : "disabled",
      });
      return;
    }

    if (request.url === "/") {
      writeJson(response, 200, {
        name: "lowcoder-hocuspocus",
        websocket: `ws://${HOST}:${PORT}`,
        health: "/health",
      });
    }
  },

  async onAuthenticate({ token, documentName }) {
    if (!SECRET) {
      return;
    }

    if (token !== SECRET) {
      console.warn(`[hocuspocus] rejected connection for ${documentName}: invalid token`);
      throw new Error("Unauthorized");
    }
  },

  async onConnect({ documentName, socketId }) {
    console.log(`[hocuspocus] connect socket=${socketId} document=${documentName}`);
  },

  async onDisconnect({ documentName, socketId }) {
    console.log(`[hocuspocus] disconnect socket=${socketId} document=${documentName}`);
  },
});

try {
  await server.listen();
} catch (error) {
  console.error("[hocuspocus] failed to start", error);
  process.exit(1);
}
