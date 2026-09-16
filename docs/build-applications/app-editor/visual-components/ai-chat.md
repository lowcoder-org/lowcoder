# AI Chat

The **AI Chat** component (`chatComp`) provides the user interface and local thread state for assistant-style conversations. It is provider-neutral: the selected Lowcoder query decides whether the assistant uses OpenAI, Anthropic Claude, xAI Grok, Ollama, or another service.

It includes:

- local thread creation, switching, renaming, and deletion
- local conversation history
- a message composer
- optional attachments
- message editing and response regeneration
- a selected Lowcoder query as the assistant backend

## How The Integration Works

Use two queries for a normal provider integration:

```text
AI Chat component
        |
        | runs the selected query with a current conversation snapshot
        v
JavaScript adapter query
        |
        | converts conversationHistory to the provider's request schema
        v
REST query for OpenAI, Claude, Grok, Ollama, or another provider
        |
        | provider-specific response
        v
{ role: "assistant", content: "..." }
```

Select the **JavaScript adapter query**, not the REST query, in the component's **Chat Query** property. The adapter has two jobs:

1. send the relevant conversation history to the REST query
2. convert the provider response to the message shape expected by AI Chat

This separation keeps the component provider-neutral and makes it easy to change providers without changing the component.

## Component Properties

The main properties are:

- **Chat Query** (`chatQuery`) — the adapter query that runs when the user sends or edits a message
- **System Prompt** (`systemPrompt`) — the instruction prepended to the exposed conversation history
- **Placeholder** (`placeholder`) — the composer placeholder text
- **Left Panel Width** (`leftPanelWidth`) — the thread sidebar width; the default is `250px`

The component also supports auto or fixed height and separate styles for its container, sidebar, messages, input, buttons, thread items, and animations.

## Query Inputs

When AI Chat runs its selected query, the following values are available directly inside that query:

```js
prompt.value
message.value
conversationHistory.value
```

- `prompt.value` is the current user's plain text.
- `message.value` is the complete current message object, including its content and any attachments.
- `conversationHistory.value` is a request snapshot containing the system prompt, previous messages, and the current user message. Use this value to build the provider request.

Do not prefix these values with `args`. For example, use `prompt.value`, not `args.prompt.value`.

The component also exposes its reactive history to the rest of the app:

```js
chat1.conversationHistory
```

Replace `chat1` if your component has a different name.

Inside the selected query, prefer `conversationHistory.value`. Unlike the exposed component value, the query argument is constructed synchronously and is guaranteed to include the message currently being processed.

## Conversation History

`conversationHistory` is an array containing the active thread's messages. It begins with a system message whose content comes from the **System Prompt** property:

```js
[
  {
    role: "system",
    content: "You are a helpful assistant.",
    timestamp: 1750000000000
  },
  {
    role: "user",
    content: "Hello",
    timestamp: 1750000001000
  },
  {
    role: "assistant",
    content: "Hi! How can I help?",
    timestamp: 1750000002000
  }
]
```

AI providers normally accept only selected fields. Map the history before sending it instead of passing the raw objects:

```js
const history = conversationHistory.value.map(({ role, content }) => ({
  role,
  content
}));
```

This removes Lowcoder-only fields such as `timestamp` and attachment metadata.

The exposed array also supports the standard state methods:

```js
chat1.setConversationHistory(newArray)
chat1.clearConversationHistory()
chat1.resetConversationHistory()
```

## Required Query Response

The selected query must return the assistant message itself:

```js
return {
  role: "assistant",
  content: "Assistant reply text"
};
```

`content` may also be an array of Assistant UI content parts:

```js
return {
  role: "assistant",
  content: [
    { type: "text", text: "Assistant reply text" }
  ]
};
```

The top-level `role` must be `"assistant"`. The component generates `id` and `createdAt` when they are omitted.

Do not return a provider wrapper such as this:

```js
return {
  message: {
    role: "assistant",
    content: "Assistant reply text"
  }
};
```

The component reads `role` and `content` from the top-level returned object.

## Recommended Setup

The following examples assume:

- the component is named `chat1`
- both queries are set to run manually
- the REST query's **Variables** tab is empty
- the JavaScript adapter is selected in `chat1` under **Chat Query**

Keep API keys in a protected Lowcoder data source or another server-side secret store for production applications. Do not expose keys in public app values or client-side JavaScript.

### OpenAI Responses API

Create a REST query named `openAIResponses`.

Configure it as follows:

- **Method:** `POST`
- **URL:** `https://api.openai.com/v1/responses`
- **Triggered when:** manually
- **Body type:** JSON

Headers:

| Key | Value |
| --- | --- |
| `Authorization` | `Bearer YOUR_OPENAI_API_KEY` |
| `Content-Type` | `application/json` |

JSON body:

```json
{
  "model": "gpt-4.1-mini",
  "instructions": {{ instructions.value }},
  "input": {{ input.value }}
}
```

Create a JavaScript query named `openAIChatAdapter`:

```js
const history = conversationHistory.value;

const system = history.find(({ role }) => role === "system");
const input = history
  .filter(({ role }) => role !== "system")
  .map(({ role, content, attachments = [] }) => {
    const images = attachments
      .flatMap((attachment) => attachment.content || [])
      .filter((part) => part.type === "image" && part.image)
      .map((part) => ({
        type: "input_image",
        image_url: part.image,
        detail: "auto"
      }));

    return {
      role,
      content: images.length
        ? [
            ...(content
              ? [{ type: "input_text", text: content }]
              : []),
            ...images
          ]
        : content
    };
  });

return openAIResponses
  .run({
    instructions: system?.content || "",
    input
  })
  .then((response) => {
    const content = (response.output || [])
      .filter((item) => item.type === "message" && item.role === "assistant")
      .flatMap((item) => item.content || [])
      .filter((part) => part.type === "output_text")
      .map((part) => part.text)
      .join("\n");

    if (!content) {
      throw new Error("OpenAI returned no assistant text");
    }

    return { role: "assistant", content };
  });
```

Select `openAIChatAdapter` in **Chat Query**.

The Responses API accepts conversation input through `input` and separate system/developer guidance through `instructions`. Its response contains an `output` array, so the adapter extracts `output_text` rather than assuming the first output item always contains the final text. See the [OpenAI Responses API reference](https://developers.openai.com/api/reference/resources/responses/methods/create).

### Anthropic Claude Messages API

Create a REST query named `claudeMessages`.

Configure it as follows:

- **Method:** `POST`
- **URL:** `https://api.anthropic.com/v1/messages`
- **Triggered when:** manually
- **Body type:** JSON

Headers:

| Key | Value |
| --- | --- |
| `x-api-key` | `YOUR_ANTHROPIC_API_KEY` |
| `anthropic-version` | `2023-06-01` |
| `Content-Type` | `application/json` |

JSON body:

```json
{
  "model": "YOUR_CLAUDE_MODEL",
  "max_tokens": 1024,
  "system": {{ system.value }},
  "messages": {{ messages.value }}
}
```

Replace `YOUR_CLAUDE_MODEL` with a model available to your Anthropic account.

Create a JavaScript query named `claudeChatAdapter`:

```js
const history = conversationHistory.value.map(({ role, content }) => ({
  role,
  content
}));

const system = history.find(({ role }) => role === "system");
const messages = history.filter(({ role }) => role !== "system");

return claudeMessages
  .run({
    system: system?.content || "",
    messages
  })
  .then((response) => {
    const content = (response.content || [])
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    if (!content) {
      throw new Error("Claude returned no assistant text");
    }

    return { role: "assistant", content };
  });
```

Select `claudeChatAdapter` in **Chat Query**.

Anthropic's Messages API receives prior user and assistant turns in `messages`; the system instruction is supplied separately. Text replies are returned as blocks in `response.content`. See the [Claude Messages API reference](https://platform.claude.com/docs/en/api/http/messages/create).

### xAI Grok Responses API

Create a REST query named `grokResponses`.

Configure it as follows:

- **Method:** `POST`
- **URL:** `https://api.x.ai/v1/responses`
- **Triggered when:** manually
- **Body type:** JSON

Headers:

| Key | Value |
| --- | --- |
| `Authorization` | `Bearer YOUR_XAI_API_KEY` |
| `Content-Type` | `application/json` |

JSON body:

```json
{
  "model": "YOUR_GROK_MODEL",
  "input": {{ input.value }}
}
```

Replace `YOUR_GROK_MODEL` with a model available to your xAI account.

Create a JavaScript query named `grokChatAdapter`:

```js
const input = conversationHistory.value.map(({ role, content }) => ({
  role,
  content
}));

return grokResponses
  .run({ input })
  .then((response) => {
    const content = (response.output || [])
      .filter((item) => item.type === "message" && item.role === "assistant")
      .flatMap((item) => item.content || [])
      .filter((part) => part.type === "output_text")
      .map((part) => part.text)
      .join("\n");

    if (!content) {
      throw new Error("Grok returned no assistant text");
    }

    return { role: "assistant", content };
  });
```

Select `grokChatAdapter` in **Chat Query**.

xAI recommends its Responses API for new integrations. It accepts the conversation in `input` and returns assistant text in `output_text` content blocks. See the [xAI text generation guide](https://docs.x.ai/developers/model-capabilities/text/generate-text).

### Ollama OpenAI-Compatible API

First, make sure Ollama is running and the model has been pulled. Then create a REST query named `ollamaChat`.

Configure it as follows:

- **Method:** `POST`
- **URL:** `http://localhost:11434/v1/chat/completions`
- **Triggered when:** manually
- **Body type:** JSON

Header:

| Key | Value |
| --- | --- |
| `Content-Type` | `application/json` |

JSON body:

```json
{
  "model": "llama3.2",
  "messages": {{ messages.value }},
  "stream": false
}
```

Create a JavaScript query named `ollamaChatAdapter`:

```js
const messages = conversationHistory.value.map(({ role, content }) => ({
  role,
  content
}));

return ollamaChat
  .run({ messages })
  .then((response) => {
    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Ollama returned no assistant text");
    }

    return { role: "assistant", content };
  });
```

Select `ollamaChatAdapter` in **Chat Query**.

Ollama provides an OpenAI-compatible `/v1/chat/completions` endpoint. Replace `llama3.2` with a model installed on your Ollama server. See the [Ollama OpenAI compatibility guide](https://docs.ollama.com/api/openai-compatibility).

> **Network note:** `localhost` is resolved from where the Lowcoder REST query executes. If Lowcoder runs in Docker or on another server, `localhost` is not your laptop's Ollama process. Use a hostname or network address reachable from the Lowcoder backend, such as a Docker service name when both services share a Docker network.

## Why The JavaScript Adapter Is Needed

Each provider returns a different response shape:

| Provider | Assistant text location |
| --- | --- |
| OpenAI Responses | `response.output[*].content[*].text` for `output_text` parts |
| Claude Messages | `response.content[*].text` for text blocks |
| xAI Responses | `response.output[*].content[*].text` for `output_text` parts |
| Ollama Chat Completions | `response.choices[0].message.content` |

AI Chat always expects the same result:

```js
{
  role: "assistant",
  content: "..."
}
```

The adapter isolates those provider differences.

## `currentMessage`

The component exposes:

```js
chat1.currentMessage
```

This value is updated after the selected query succeeds. Use `prompt.value` inside the selected query for the message currently being processed. Use `currentMessage` in post-response app logic and events.

## Attachments

The composer accepts files up to 10 MB. The current message's attachments are available inside the selected query through:

```js
message.value.attachments
```

Attachments are not automatically converted to an AI provider's multimodal request schema. The OpenAI example above demonstrates how to convert image attachments; other providers require their corresponding content-part format.

- Images are represented in the current message with browser-generated base64 data URLs.
- Other files use browser-local `blob:` URLs, which a server-side REST query cannot fetch directly.
- In `conversationHistory`, image content is retained, while non-image file content is not retained as provider-ready data.

For multimodal or file analysis, add provider-specific conversion or upload logic to the adapter/backend. Do not pass Lowcoder attachment objects directly to a provider API.

## Send And Edit Flow

When the user sends a message, AI Chat:

1. validates and stores the user message in the active thread
2. runs the selected query with `prompt.value` and `message.value`
3. validates the returned assistant message
4. stores the assistant reply in the same thread

When the user edits an earlier message, the component truncates the later messages, inserts the edited message, reruns the selected query, and stores the newly generated reply.

## Events

The component emits:

- `componentLoad` when the component initializes
- `messageSent` after the selected query succeeds for a new or edited user message
- `messageReceived` when an assistant message is stored, including the component's generic error reply
- `threadCreated` when a thread is created from the thread list
- `threadUpdated` when an initial title is generated or a thread is renamed
- `threadDeleted` when a thread is deleted

Because `messageSent` occurs after a successful query, it is not an immediate before-request hook.

## Errors And Debugging

If the selected query fails or returns an invalid message, the chat displays a generic assistant error:

```text
Sorry, I encountered an error. Please try again.
```

The original provider or adapter error is not displayed in the chat bubble. Inspect the failed REST/JavaScript query result and the browser console while developing.

Common causes are:

- the REST query, rather than the adapter, was selected in **Chat Query**
- the adapter did not return a top-level `role: "assistant"`
- the REST body used `args.prompt.value` or `args.message.value`
- provider history included Lowcoder-only fields such as `timestamp`
- an API key, model ID, URL, or required header is incorrect
- Ollama is not reachable from the Lowcoder backend

The current component waits for the selected query to finish and then appends the complete reply. Token-by-token streaming into the chat is not currently implemented.

## Local Storage

Threads and messages are stored in an AlaSQL database backed by the browser's `localStorage`. The exposed database name has this form:

```js
chat1.databaseName // ChatDB_<generated-name>
```

The database contains `threads` and `messages` tables. It can be queried with AlaSQL, for example:

```sql
SELECT * FROM ChatDB_chat1234.messages WHERE threadId = 'thread-123'
```

This storage is local to the browser and device. It is not shared between users, and clearing site data removes it. If transcripts must be durable or shared, persist them to an external database using component events and `conversationHistory`.

## AI Chat Versus Chat Box

Use **AI Chat** for:

- one user conversing with an assistant
- multiple local assistant threads
- prompt/response workflows
- provider-backed AI interfaces

Use **Chat Box** for room-based collaboration between multiple human participants.

## Summary

- AI Chat is provider-neutral.
- Select a JavaScript adapter as **Chat Query**.
- Read the current query input from `prompt.value` or `message.value`.
- Map the guaranteed `conversationHistory.value` query snapshot to the provider's schema.
- Make the adapter return `{ role: "assistant", content: "..." }`.
- Add provider-specific handling before sending attachments.
- Persist transcripts externally if browser-local storage is not sufficient.
