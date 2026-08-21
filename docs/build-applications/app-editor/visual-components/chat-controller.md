# Chat Controller

The component **Chat Controller** provides the realtime state layer for chat experiences.

It is designed to work with:

- **Chat Box**
- a custom room-based chat UI built from standard components such as `List View`, `Container`, `Input`, and `Button`

> **Before you start:** this component needs a Hocuspocus server running and reachable from the browser. Without it, `ready` stays `false` and every shared value stays empty.
>
> See [Realtime Collaboration](../../realtime-collaboration.md) for setup, deployment, and troubleshooting.

## What Chat Controller Does

`Chat Controller` manages the realtime collaboration layer of a chat application.

That includes:

- connection state
- current user presence
- active room state
- typing indicators
- online users
- room-scoped shared data
- app-wide shared data
- AI thinking indicators

It does **not** replace your message or room queries.

Instead, it works alongside them:

- your queries persist and load the real room/message data
- `Chat Controller` synchronizes the live collaborative state across connected clients

## Core Idea

All users connected with the same `applicationId` share the same realtime collaboration channel.

Inside that channel, the controller keeps synchronized:

- who is online
- who is typing
- which room each user is currently viewing
- app-level shared data
- room-level shared data
- AI thinking state

This makes it a good fit for:

- live room switching
- presence indicators
- typing indicators
- lightweight notifications like “room changed, reload messages”

## Before You Start: The Realtime Server

The controller talks to a **Hocuspocus** WebSocket server. Without that server running and reachable from the browser, the component loads but never connects: `ready` stays `false` and every shared value stays empty.

In a default Docker install the service is already there. For local development, start it with:

```bash
node client/packages/lowcoder/hocuspocus-server.js
```

and make sure the frontend was built with `REACT_APP_HOCUSPOCUS_URL` pointing at it (it defaults to `ws://localhost:3006`).

Full setup, deployment, and troubleshooting instructions are in [Realtime Collaboration](../../realtime-collaboration.md).

## How It Works Under The Hood

Internally, the controller uses **Hocuspocus** and **Yjs** for synchronization.

In practice, that means:

- presence — online users and typing flags — is shared through Yjs **awareness**, which is ephemeral and vanishes when a client disconnects
- app-wide shared objects are synchronized through a shared Yjs map
- room-scoped shared objects are synchronized through another shared Yjs map

Each app gets its own Yjs document, named `signal_<applicationId>`. Apps with different `applicationId` values never see each other's state.

The server-side transport is implemented in [`hocuspocus-server.js`](https://github.com/lowcoder-org/lowcoder/blob/main/client/packages/lowcoder/hocuspocus-server.js).

> **Warning:** The bundled server holds documents **in memory only**. On a server restart, `sharedState` and `roomData` are lost. Use them for live signalling, and keep anything that must survive a restart in your own database.

## Main Properties

Configure:

- `applicationId`
- `userId`
- `userName`

### `applicationId`

This scopes the shared collaboration space. Users with the same `applicationId` participate in the same realtime channel. Defaults to `lowcoder_app`.

> **Warning:** Leaving the default means every app that also left the default shares one collaboration space on the same server. Set a value that is unique to your app.

### `userId`

This identifies the current user. It must be **unique per person** — two browsers using the same `userId` are indistinguishable to the presence layer. Binding it to the logged-in user is the usual choice:

```js
{{ currentUser.id }}
```

### `userName`

This is the display name used in presence and typing indicators.

```js
{{ currentUser.name }}
```

Both can also be changed at runtime with `setUser(userId, userName)`.

### Identity Is Not Verified

The controller trusts whatever `userId` and `userName` the client sends. Anyone who can open the app can present themselves as any user to the realtime layer. Keep authorization decisions in your queries and backend — never rely on `onlineUsers` as proof of who someone is.

## Exposed State

The controller exposes the following state values.

### Connection State

- `{{ chatController1.ready }}`
- `{{ chatController1.error }}`
- `{{ chatController1.connectionStatus }}`

Use these when you want to:

- show whether the realtime layer is online
- display connection status
- surface authentication or transport errors

`ready` is a boolean — `true` only while the WebSocket is open. `connectionStatus` is the human-readable label `Connecting...`, `Online`, or `Offline`. `error` is `null` while healthy, and carries the failure reason after a failed authentication (which also fires the `error` event).

Gate anything that writes shared state on `ready`, otherwise the write silently does nothing:

```js
{{ chatController1.ready }}
```

### Presence State

- `{{ chatController1.onlineUsers }}`
- `{{ chatController1.typingUsers }}`
- `{{ chatController1.currentRoomId }}`

### AI State

- `{{ chatController1.aiThinkingRooms }}`

### Shared Data State

- `{{ chatController1.sharedState }}`
- `{{ chatController1.roomData }}`

### Identity State

The controller also re-exposes its own identity settings, which is convenient when other components need them without duplicating the bindings:

- `{{ chatController1.userId }}`
- `{{ chatController1.userName }}`
- `{{ chatController1.applicationId }}`

## State Shapes

### `onlineUsers`

`onlineUsers` is an array of currently connected peers. It lists **other** users only — the current user is not included, so add yourself when rendering a presence list.

Shape:

```js
[
  {
    userId: "user_1",
    userName: "Alice",
    currentRoomId: "room_123"
  }
]
```

This is useful for:

- online user sidebars
- room presence counts
- showing whether another user is active in the same room

### `typingUsers`

`typingUsers` is scoped to the current room and excludes the current user.

Shape:

```js
[
  {
    userId: "user_2",
    userName: "Bob",
    roomId: "room_123"
  }
]
```

This is useful for:

- “Bob is typing...”
- “2 people are typing...”

### `currentRoomId`

This is the active room for the current user.

It is typically the room id used by:

- `loadMessages`
- room highlighting
- typing presence
- AI thinking indicators

### `aiThinkingRooms`

This is a map of room ids to thinking state.

Example:

```js
{
  room_123: true,
  room_456: false
}
```

This is useful when you have `llm` rooms or an AI assistant integrated into a room-based chat flow.

### `sharedState`

`sharedState` is app-level shared data.

Example:

```js
{
  activeAnnouncement: "Maintenance at 7 PM",
  featureFlagAiRooms: true
}
```

This is for values that belong to the application as a whole rather than to a single room.

### `roomData`

`roomData` is room-scoped shared data.

Its shape is:

```js
{
  room_123: {
    messagePing: { ts: 1710000000000, authorId: "user_1" },
    lastMessage: { text: "Hello", authorId: "user_1" }
  }
}
```

This is for values that should be scoped to a specific room only.

## Shared State vs Room Data

This is the most important conceptual distinction in the controller.

### Use `sharedState` For App-Level Collaboration

Typical examples:

- app-wide announcement banners
- feature flags
- collaborative state not tied to a room
- global session metadata

Write with:

```js
chatController1.setSharedState(key, value)
```

### Use `roomData` For Room-Level Collaboration

Typical examples:

- `messagePing` telling room clients to reload messages
- room-specific last message preview
- room-scoped draft metadata
- room-specific AI assistant state

Write with:

```js
chatController1.setRoomData(roomId, key, value)
```

## Events

The controller emits:

- `userJoined`
- `userLeft`
- `roomSwitched`
- `connected`
- `disconnected`
- `error`
- `aiThinkingStarted`
- `aiThinkingStopped`
- `sharedStateChanged`
- `roomDataChanged`

These events are the main hooks for reacting to realtime updates.

## Methods

The controller exposes the following methods.

### Presence Methods

`startTyping(roomId?)`

Marks the current user as typing in the given room or the current room.

`stopTyping()`

Clears the typing flag for the current user.

`switchRoom(roomId)`

Updates the active room and moves the current user's presence to that room.

### AI Methods

`setAiThinking(roomId, isThinking)`

Marks whether an AI is currently thinking in the given room, for every connected user.

`isThinking` is read as true only for the boolean `true` or the string `"true"`; anything else counts as false.

### App-Level Shared State Methods

`setSharedState(key, value)`

Sets an app-wide shared value.

`deleteSharedState(key)`

Removes an app-wide shared value.

### Room-Level Shared State Methods

`setRoomData(roomId, key, value)`

Sets a room-scoped shared value.

`deleteRoomData(roomId, key?)`

Removes a single room-scoped key or clears the entire room entry.

### User Method

`setUser(userId, userName)`

Updates the identity used by the controller.

## Typical Patterns

### Typing Indicator Pattern

On input change:

```js
chatController1.startTyping(chatController1.currentRoomId)
```

On blur, send, room switch, or inactivity:

```js
chatController1.stopTyping()
```

### Room Switch Pattern

When a user selects a room:

```js
chatController1.switchRoom(roomId)
```

Then on `roomSwitched`, reload the messages for:

```js
{{ chatController1.currentRoomId }}
```

### Message Reload Pattern

After saving a message, notify the room:

```js
chatController1.setRoomData(
  chatController1.currentRoomId,
  "messagePing",
  {
    roomId: chatController1.currentRoomId,
    ts: Date.now(),
    authorId: chatController1.userId
  }
)
```

Then on `roomDataChanged`, reload messages.

### Room Presence Pattern

To show users currently in the active room:

```js
{{
  (chatController1.onlineUsers || []).filter(
    u => u.currentRoomId === chatController1.currentRoomId
  )
}}
```

### LLM Room Pattern

If you support `llm` rooms, use:

```js
chatController1.setAiThinking(roomId, true)
```

when the AI starts generating, and:

```js
chatController1.setAiThinking(roomId, false)
```

when the AI finishes.

This makes the thinking state visible to everyone in that room.

### LLM Query Execution Pattern

`Chat Controller` does not execute the room's LLM query by itself.

Instead, it supports the realtime pieces around that AI execution:

1. a user sends a message
2. the app saves the user message
3. the app checks whether the current room is an `llm` room
4. the app runs the AI query mapped to that room
5. the app saves the assistant response
6. the controller shares thinking and refresh state with everyone else in the room

In other words:

- your query layer executes the AI logic
- `Chat Controller` keeps the room state synchronized while that happens

Typical sequence:

set AI thinking:

```js
chatController1.setAiThinking(chatController1.currentRoomId, true)
```

run the AI query

save the assistant message

notify the room:

```js
chatController1.setRoomData(
  chatController1.currentRoomId,
  "messagePing",
  {
    roomId: chatController1.currentRoomId,
    ts: Date.now(),
    authorId: "__llm_bot__"
  }
)
```

clear AI thinking:

```js
chatController1.setAiThinking(chatController1.currentRoomId, false)
```

This lets every connected user in that room see:

- that the AI is currently working
- that a new assistant reply has arrived

## Using Chat Controller With Chat Box

Recommended pairing:

- `chatBox1.currentRoomId` -> `{{ chatController1.currentRoomId }}`
- `chatBox1.typingUsers` -> `{{ chatController1.typingUsers }}`
- `chatBox1.onlineUsers` -> `{{ chatController1.onlineUsers }}`
- `chatBox1.isAiThinking` -> `{{ !!chatController1.aiThinkingRooms?.[chatController1.currentRoomId] }}`

Typical event handling:

- `chatBox1 -> roomSwitch` -> `chatController1.switchRoom(chatBox1.pendingRoomId)`
- `chatBox1 -> startTyping` -> `chatController1.startTyping(chatController1.currentRoomId)`
- `chatBox1 -> stopTyping` -> `chatController1.stopTyping()`

For the UI-side details, see [Chat Box](chat-box.md).

## Using Chat Controller With A Custom Chat UI

When building your own room-based chat interface, the controller becomes the realtime backbone.

Typical flow:

1. use a `List View` to display rooms
2. select a room with:

```js
chatController1.switchRoom(currentItem.id)
```

3. load messages filtered by:

```js
{{ chatController1.currentRoomId }}
```

4. show typing users from `chatController1.typingUsers`
5. show online users from `chatController1.onlineUsers`
6. use `roomData` to signal room refreshes or store room-scoped metadata

## Beyond Chat: General Realtime Features

Nothing in `sharedState` and `roomData` is chat-specific. Once a Chat Controller is on the canvas, any component in the app can use it as a live channel between users.

### Live Presence On Any Screen

Show who else has the app open, whether or not you use rooms at all:

```js
{{ (chatController1.onlineUsers || []).map(u => u.userName).join(", ") }}
```

### "Who Is Looking At What"

Presence carries a fixed set of fields, so anything custom belongs in `sharedState` rather than presence. Write the current user's focus on selection:

```js
chatController1.setSharedState("viewing_" + chatController1.userId, {
  userName: chatController1.userName,
  recordId: table1.selectedRow.id,
  ts: Date.now()
})
```

Then read every peer's entry back out of `sharedState`, and clear your own key when the user leaves the screen:

```js
chatController1.deleteSharedState("viewing_" + chatController1.userId)
```

> **Warning:** Unlike presence, `sharedState` is **not** cleaned up when a user disconnects. A key written by someone who then closed the tab stays until something deletes it. Store a timestamp alongside the value and ignore stale entries when you read them.

### Broadcast A Refresh

The cheapest way to keep several users' tables in sync is a ping rather than the data itself:

```js
chatController1.setSharedState("dataPing", { ts: Date.now(), by: chatController1.userId })
```

On `sharedStateChanged`, re-run the query that loads the table. Every connected client reloads from your real data source, so there is one source of truth and the realtime layer only carries the signal.

## Limits To Know About

- **No live cursors, no shared text editing.** The controller synchronizes structured key/value data and presence. It does not share caret positions or merge concurrent edits to a document.
- **Presence fields are fixed** — `userId`, `userName`, `currentRoomId`, `typing`. Custom per-user data goes in `sharedState`.
- **Shared maps are last-write-wins per key.** Two users writing the same key at the same moment do not merge; one value survives. Give each user their own key when they each own a piece of the state.
- **Nothing is persisted.** A server restart empties `sharedState` and `roomData`.
- **Writes before `ready` are dropped** silently.
- **`typingUsers` is filtered to the current room** and excludes the current user; `onlineUsers` spans the whole app and also excludes the current user.

## When To Use Shared Objects

Use the controller's shared objects when you need realtime collaboration data that should not itself be the canonical persisted chat record.

Good use cases:

- ephemeral collaboration metadata
- room refresh signals
- live status indicators
- app-wide flags visible to all connected users

Less suitable use cases:

- full persistent message history
- canonical room records
- long-term audit storage

Those are usually better handled by your own queries and datastore.

## Summary

- **Chat Controller** is the realtime collaboration component — for chat features and for any other live shared state
- it needs a running Hocuspocus server; see [Realtime Collaboration](../../realtime-collaboration.md)
- it scopes collaboration by `applicationId`
- it exposes presence, room state, app-wide shared state, and room-scoped shared state
- use `sharedState` for app-level data
- use `roomData` for room-level data
- pair it with **Chat Box** or with your own custom chat UI
