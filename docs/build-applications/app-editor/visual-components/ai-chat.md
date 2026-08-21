# AI Chat

The component **AI Chat** (`chatComp`) is a thread-based AI conversation component.

It provides:

- built-in thread management
- built-in message history
- a message composer
- optional attachments
- message editing and regeneration
- a selected Lowcoder query as the assistant backend

## What AI Chat Does

`AI Chat` is meant for assistant-style conversations rather than room-based team chat.

It already handles:

- creating a new thread
- switching threads
- renaming threads
- archiving threads
- deleting threads
- appending user messages
- appending assistant messages
- regenerating the assistant response when a user edits a previous message

So the component gives you the conversation UI and thread UX.

Your selected query gives it the assistant logic.

## Core Idea

At a high level:

1. the user sends a message
2. the component stores that user message in the active thread
3. the selected query is executed
4. the query returns the assistant response
5. the assistant response is appended to the same thread

That means the component is query-driven.

## Main Properties

The most important properties are:

- `chatQuery`
- `systemPrompt`
- `placeholder`
- `leftPanelWidth`

### `chatQuery`

This is the Lowcoder query the component runs when the user sends or edits a message.

This is the central integration point.

### `systemPrompt`

This is the system instruction for the assistant.

It is also prepended to the exposed `conversationHistory`, so the external logic can receive the same instruction context as the visible chat session.

### `placeholder`

This controls the composer placeholder text.

### `leftPanelWidth`

This controls the width of the thread sidebar. Defaults to `250px`. Any CSS width value works.

### Layout And Style

Under **Layout** you also get the standard auto-height / fixed-height switch.

The style panel is split per region, so each part of the chat can be themed separately:

- **Style** — the outer container
- **Sidebar Style** — the thread list column
- **Messages Style** — the message area
- **Input Style** — the composer
- **Send Button Style**, **New Thread Button Style**, **Thread Item Style**
- **Animation Style**

## Exposed Variables

The component exposes:

- `{{ chat1.currentMessage }}`
- `{{ chat1.conversationHistory }}`
- `{{ chat1.databaseName }}`

### `currentMessage`

This is the latest user message text.

Use it when you need to log or react to the most recent prompt.

### `conversationHistory`

This is the complete conversation history with the system prompt already included.

The shape looks like:

```js
[
  { role: "system", content: "You are a helpful assistant.", timestamp: ... },
  { role: "user", content: "Hello", timestamp: ... },
  { role: "assistant", content: "Hi there", timestamp: ... }
]
```

This is the most useful exposed value when:

- sending full context to an AI API
- logging full transcripts
- saving session snapshots
- reconstructing prompt context externally

Messages that carried attachments also include an `attachments` array with the attachment metadata (and, for images, the base64 content), so a single `conversationHistory` value is enough to rebuild a multimodal request.

Because it is a real array rather than a JSON string, you can use it directly — no `JSON.parse` needed — and it comes with the standard array-state helpers:

```js
chat1.setConversationHistory(newArray)
chat1.clearConversationHistory()
chat1.resetConversationHistory()
```

### `databaseName`

This exposes the name of the browser-local database the component uses for its threads and messages, in the form `ChatDB_<generated-name>`. The same name is shown read-only in the **Database** section of the property panel.

It holds two tables, `threads` and `messages`, which you can read with an AlaSQL query:

```sql
SELECT * FROM ChatDB_chat1234.messages WHERE threadId = 'thread_1'
```

> **Warning:** This storage is the browser's own `localStorage`, not the Lowcoder server. Threads are per-browser and per-device: they are not shared between users, and they do not survive clearing site data. If you need durable or shared transcripts, persist them yourself from the `messageSent` / `messageReceived` events using `conversationHistory`.

## Query Contract

When `AI Chat` runs the selected query, it passes:

```js
args.message.value
args.prompt.value
```

Where:

- `args.message.value` is the full message object
- `args.prompt.value` is the plain user text

Useful values available to the query or surrounding app logic:

```js
{{ args.prompt.value }}
{{ args.message.value }}
{{ chat1.currentMessage }}
{{ chat1.conversationHistory }}
```

## Expected Query Response

The query must return **the assistant message itself** — not a wrapper around it.

The minimum valid response is:

```json
{
  "role": "assistant",
  "content": "Assistant reply text"
}
```

`content` may also be an array of content parts, which is what you need for anything richer than plain text:

```json
{
  "role": "assistant",
  "content": [
    { "type": "text", "text": "Here is what I found." }
  ]
}
```

Rules the component enforces:

* `role` **must** be `"assistant"`. Anything else raises `Query must return an assistant message`.
* `content` is required — a string is converted to a single text part.
* `id` and `createdAt` are optional; the component generates them when they are missing.

> **Warning:** Earlier versions of this component read the reply from `result.message`. That is no longer the case. A query still returning `{ "message": { "content": "..." } }` will fail, because the top-level object has no `role`. Return the assistant message at the top level instead.

### Shaping The Response In The Query

Most AI providers do not return this shape directly. Add a JS transformer to your query so the last step produces the assistant message. For an OpenAI-style response:

```js
return {
  role: "assistant",
  content: data.choices[0].message.content
};
```

For an Anthropic-style response:

```js
return {
  role: "assistant",
  content: data.content[0].text
};
```

## Minimal Working Setup

The smallest working setup is:

1. add `chat1` to the canvas
2. select a query in `chat1.chatQuery`
3. optionally set `systemPrompt`
4. make sure the query returns:

```json
{
  "role": "assistant",
  "content": "assistant reply"
}
```

That is enough for the component to function.

## Error Handling

If the selected query throws, or returns something the component cannot read as an assistant message, the component appends a fallback assistant message describing the failure instead of leaving the thread hanging. The thrown message is surfaced there, so a malformed response shape is visible directly in the chat during development.

If no query is selected at all, sending a message fails with `Select a query before sending a message`.

## Typical Query Patterns

### Latest Prompt Only

Use:

```js
{{ args.prompt.value }}
```

This is enough for single-turn or simple assistant behavior.

### Full Message Object

Use:

```js
{{ args.message.value }}
```

This is useful when you want:

- attachments
- message metadata
- richer assistant pipelines

### Full Conversation Context

Use:

```js
{{ chat1.conversationHistory }}
```

This is useful when you want:

- multi-turn context
- memory-like behavior
- transcript-aware prompt building

## Send Flow

When the user sends a message:

1. the component validates that the message is not empty
2. it creates a user message object
3. it stores the user message in the active thread
4. it runs the selected query
5. it reads the returned assistant response
6. it appends the assistant message to the thread

If the handler fails, the component appends a fallback assistant error message.

## Editing And Regeneration

The component supports editing a previous user message.

When that happens:

1. the thread is truncated after the edited point
2. the new edited user message is inserted
3. the selected query is run again
4. the new assistant reply is appended

This gives a regeneration flow similar to modern AI chat tools.

## Built-In Events

The component emits:

- `componentLoad`
- `messageSent`
- `messageReceived`
- `threadCreated`
- `threadUpdated`
- `threadDeleted`

These events are useful for:

- analytics
- logging
- persistence
- workflow triggers
- usage tracking

## Recommended Event Usage

### `componentLoad`

Use this when you want to:

- log component usage
- initialize related state
- preload data used by the selected query

### `messageSent`

Use this when you want to:

- log the latest user prompt
- persist transcript snapshots
- trigger external workflows

Useful values:

```js
{{ chat1.currentMessage }}
{{ chat1.conversationHistory }}
```

### `messageReceived`

Use this when you want to:

- log assistant replies
- persist the updated conversation
- trigger downstream automations after an answer is generated

### `threadCreated`

Use this when you want to:

- create external metadata for a new thread
- sync thread creation to another store

### `threadUpdated`

Use this when you want to:

- react to rename or archive changes
- keep an external thread registry updated

### `threadDeleted`

Use this when you want to:

- remove or archive external thread metadata

## Attachments

The component supports attachments, including images and file metadata.

If attachments are present, they are available through:

```js
{{ args.message.value.attachments }}
```

This lets your query inspect uploaded files and build richer assistant flows.

Typical examples:

- image-aware prompts
- file analysis workflows
- multimodal processing pipelines

## Thread Model

The component is thread-based rather than room-based.

That means:

- it is great for assistant conversations
- it is not intended to replace a multi-user room chat UI like **Chat Box**

Use **AI Chat** when you want:

- one user talking to an assistant
- multi-thread assistant conversations
- prompt/response workflows
- document-aware or tool-aware assistant interfaces

Use **Chat Box** when you want:

- room-based collaboration
- multiple human participants
- invites, presence, and typing in shared rooms

## Internal Storage

The component manages its own thread and message storage internally, so you do not need to build a thread store just to get a working AI chat experience.

If you want to connect it to external systems, the usual extension points are:

- the selected query
- the exposed variables
- the component events

## Recommended Mental Model

Think of **AI Chat** like this:

- the component manages the conversation UI and thread state
- the selected query acts as the assistant brain
- `conversationHistory` is the context bridge
- `messageSent` and `messageReceived` are your workflow hooks

## Summary

- **AI Chat** is a thread-aware assistant conversation component
- the selected query is responsible for generating assistant replies
- the component exposes `currentMessage` and `conversationHistory`
- the query receives `args.message.value` and `args.prompt.value`
- the query must return an assistant message (`{ role: "assistant", content: ... }`)
- attachments and thread events make it suitable for more advanced assistant flows
