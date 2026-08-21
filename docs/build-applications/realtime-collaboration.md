# Realtime Collaboration

Lowcoder ships a realtime collaboration layer that lets several people using the **same app** see each other and share live state.

It powers:

* [Chat Box](app-editor/visual-components/chat-box.md) — the room-based chat UI
* [Chat Controller](app-editor/visual-components/chat-controller.md) — the presence and shared-state component
* any custom UI you build yourself out of standard components

This page explains what the layer actually does, what it does **not** do, and how to run it in development and in production.

> **Note:** This is a different feature from [Video Calls in Lowcoder](video-calls-in-lowcoder.md). Video calls use the Agora SDK for audio/video/screen share. Realtime collaboration uses a WebSocket server for presence and shared data. They can be used together in one app, but they are independent.

## What The Layer Provides

Everyone connected to the same collaboration space shares:

| Capability | Where it appears |
| --- | --- |
| Who is online, and what room they are viewing | `chatController1.onlineUsers` |
| Who is typing | `chatController1.typingUsers` |
| Which room the current user is in | `chatController1.currentRoomId` |
| Whether an AI is generating a reply in a room | `chatController1.aiThinkingRooms` |
| App-wide shared key/value data | `chatController1.sharedState` |
| Room-scoped shared key/value data | `chatController1.roomData` |

That is the full set. In particular:

* There are **no live cursors** and no shared-text co-editing. The layer synchronizes structured key/value data and presence, not caret positions or rich-text documents.
* Presence carries a **fixed** set of fields — `userId`, `userName`, `currentRoomId`, `typing`. You cannot add your own presence fields from the property panel.
* It is **not a message store**. Chat messages, rooms, and invites are loaded and saved by your own queries. The realtime layer only tells other clients that something changed.

If you want to share something else live — a selected row, a "user X is viewing record Y" indicator, a shared filter — use `setSharedState` / `setRoomData` instead of presence. See [Chat Controller](app-editor/visual-components/chat-controller.md).

## Architecture

```
Browser A ─┐
Browser B ─┼─ WebSocket ──▶  Hocuspocus server  ──▶  Yjs document per app
Browser C ─┘                 (port 3006)             ("signal_<applicationId>")
```

* The transport is [Hocuspocus](https://tiptap.dev/docs/hocuspocus), a WebSocket server for [Yjs](https://yjs.dev) documents.
* Each `applicationId` on the Chat Controller maps to one Yjs document, named `signal_<applicationId>`. Two apps with different ids never see each other's state.
* Online users and typing flags travel over **Yjs awareness**, which is ephemeral — it disappears the moment a client disconnects.
* `sharedState`, `roomData`, and AI thinking state are stored in **Yjs shared maps** on the document.

The server source lives at [`client/packages/lowcoder/hocuspocus-server.js`](https://github.com/lowcoder-org/lowcoder/blob/main/client/packages/lowcoder/hocuspocus-server.js).

> **Warning:** The bundled server keeps documents **in memory only** — no persistence extension is configured. If the server restarts, everything in `sharedState` and `roomData` is gone. Treat those maps as live signalling, and keep anything you actually need to survive a restart in your own database.

## Running The Server

The server is a small Node process. It needs no database.

### Environment Variables (server side)

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3006` | HTTP / WebSocket port |
| `HOST` | `0.0.0.0` | Bind address |
| `HOCUSPOCUS_SECRET` | _(empty)_ | Shared secret. When empty, **any client may connect.** |

It answers two HTTP routes, which are handy for health checks:

* `GET /health` → `{"status":"ok","auth":"enabled"}`
* `GET /` → service info

### Local Development

From the repository:

```bash
node client/packages/lowcoder/hocuspocus-server.js
```

You should see `[hocuspocus] listening on ws://0.0.0.0:3006`.

### Docker

An image is published as `lowcoderorg/lowcoder-hocuspocus`. The multi-container compose file already includes it:

```yaml
hocuspocus:
  image: lowcoderorg/lowcoder-hocuspocus:latest
  container_name: hocuspocus
  restart: unless-stopped
  environment:
    HOCUSPOCUS_SECRET: "s3cr3t! - CHANGE THIS!"
```

See [`deploy/docker/docker-compose-multi.yaml`](https://github.com/lowcoder-org/lowcoder/blob/main/deploy/docker/docker-compose-multi.yaml).

> **Important:** Change `HOCUSPOCUS_SECRET` before exposing the service. With an empty secret the server accepts every connection and every document name, so anyone who can reach the port can read and write the shared state of any app.

## Pointing The Client At The Server

The frontend reads two build-time variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `REACT_APP_HOCUSPOCUS_URL` | `ws://localhost:3006` | WebSocket URL the browser connects to |
| `REACT_APP_HOCUSPOCUS_SECRET` | _(empty)_ | Token sent on connect; must match the server's `HOCUSPOCUS_SECRET` |

These are baked into the client bundle at build time, so they must be set when the frontend is built or served, not only on the API service.

Behind TLS, use `wss://` and terminate the WebSocket upgrade at your reverse proxy:

```
REACT_APP_HOCUSPOCUS_URL=wss://collab.example.com
```

> **Warning:** `REACT_APP_HOCUSPOCUS_SECRET` ends up in the JavaScript bundle that browsers download. It is a deployment-level gate to keep strangers off the port — not a per-user credential. Do not treat it as an authorization boundary between your own app users.

## Verifying The Setup

1. Place a **Chat Controller** component in an app.
2. Open the app in two browser windows, using two different `userId` values.
3. Check `{{ chatController1.ready }}` — it should be `true`, and `{{ chatController1.connectionStatus }}` should read as online.
4. Check `{{ chatController1.onlineUsers }}` in one window — it should list the other window's user.

If `ready` stays `false`:

* confirm the server is running and `GET /health` responds;
* confirm `REACT_APP_HOCUSPOCUS_URL` is reachable from the **browser**, not just from the server;
* if the server has a secret set, confirm the client was built with the same value — a mismatch fires the controller's `error` event and sets `{{ chatController1.error }}`.

## Where To Go Next

* [Chat Controller](app-editor/visual-components/chat-controller.md) — full reference for presence, shared state, methods, and events
* [Chat Box](app-editor/visual-components/chat-box.md) — the ready-made room chat UI
* [AI Chat](app-editor/visual-components/ai-chat.md) — single-user assistant chat, which needs none of this infrastructure
