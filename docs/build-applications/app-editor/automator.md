# Automator

Lowcoder Automator is an AI-assisted editor feature for creating and changing parts of an app from natural language instructions.

Automator is a subscription feature. When it is enabled for your workspace, it appears in the App Editor and lets you select the Lowcoder query that should handle AI requests.

## Bring Your Own Model

Lowcoder does not require a specific AI model for Automator.

You can use any model or provider of your choice, for example OpenAI-compatible APIs, self-hosted models, private gateways, or other LLM services. The selected Lowcoder query is responsible for sending Automator's request to your model and converting the model response back into the message format Lowcoder expects.

This keeps the model, API key, endpoint, and provider configuration under your control.

For Automator, choose a model that supports tool or function calling. Automator can still show a normal text reply without tool calls, but app changes are applied only when the model returns the Automator tool call.

Examples of possible providers include:

- OpenAI or any OpenAI-compatible API
- xAI Grok through an OpenAI-compatible chat completions endpoint
- Ollama with a local model that supports tools
- Anthropic Claude through a small adapter in the JavaScript bridge query
- your own backend that accepts Lowcoder's `messages` and `tools` and returns the assistant message shape

## How Automator Works

At runtime, Automator builds an AI payload from the current editor state and conversation. It passes this payload to the selected query as:

```js
ai.value
```

The payload contains:

```js
{
  mode: "automator",
  messages: [...],
  tools: [...]
}
```

Inside the selected JavaScript query, read this request directly as `ai.value`, not `args.ai.value`.

The query should send `messages` and `tools` to your model. If the model returns a normal assistant reply, the query returns that text to Automator. If the model calls an Automator tool, the query returns the tool call so Lowcoder can apply the generated actions in the editor.

Automator does not call the model directly. The selected query is the integration layer between Lowcoder and your AI provider.

## Recommended Query Setup

A common setup is to create two queries:

1. an HTTP query that calls your model provider
2. a JavaScript query that acts as the bridge between Automator and the HTTP query

The same pair can serve both Automator and AI Help. Both features call the selected JavaScript query with `ai.value`; `ai.value.mode` identifies the caller as `"automator"` or `"helper"`.

```text
Automator --\
             > shared JavaScript bridge -> provider HTTP query
AI Help ----/
```

The JavaScript bridge is the query you select in the Automator and AI Helper panels. The provider-specific request and response conversion belongs in this bridge, not in either feature.

This pattern is useful because the Automator UI does not need to know which model provider you use. The HTTP query handles the provider call. The JavaScript bridge normalizes the provider response for Lowcoder.

Before you start, prepare:

- a model endpoint
- any required API key or authentication headers
- a model name
- a Lowcoder HTTP query, for example `openAIResponses` or `llmHttp`
- a Lowcoder JavaScript query, for example `unifiedAIQuery`

The OpenAI Responses example below uses `openAIResponses` and `unifiedAIQuery`. Other providers can use the same Lowcoder payload contract with a provider-specific HTTP query and bridge conversion.

## HTTP Query

Create an HTTP query that points to your model provider endpoint. Its URL, authentication, and body are provider-specific; the JavaScript bridge supplies the converted request values when it runs the HTTP query.

### OpenAI Responses API

This is a tested provider example, not a requirement to use OpenAI.

Create a REST query named `openAIResponses`:

- **Triggered when:** manually
- **Method:** `POST`
- **URL:** `https://api.openai.com/v1/responses`
- **Parameters:** none
- **Variables:** empty
- **Body type:** JSON

Headers:

| Key | Value |
|---|---|
| `Authorization` | `Bearer YOUR_OPENAI_API_KEY` |
| `Content-Type` | `application/json` |

Body:

```json
{
  "model": "gpt-4.1-mini",
  "instructions": {{ instructions.value }},
  "input": {{ input.value }},
  "tools": {{ tools.value }},
  "tool_choice": "auto",
  "parallel_tool_calls": false
}
```

The bridge must flatten Lowcoder's `tool.function` objects for the Responses API and convert returned `function_call` items back into Lowcoder `tool-call` message parts. See the [OpenAI Responses API reference](https://developers.openai.com/api/reference/cli/resources/responses/methods/create).

## Provider Starting Points

Many providers can use the same HTTP body when they support the OpenAI chat completions format.

### OpenAI-Compatible APIs

Use this style for OpenAI and other providers that expose a compatible `/chat/completions` endpoint:

```json
{
  "model": "your-model-name",
  "stream": false,
  "parallel_tool_calls": false,
  "messages": {{ messages.value }},
  "tools": {{ tools.value }}
}
```

Use the OpenAI-compatible Chat Completions bridge shown later on this page. It reads the response from:

```js
response.choices?.[0]?.message
```

### Grok

Grok can be used in the same way when you call an OpenAI-compatible xAI chat completions endpoint.

Use your xAI endpoint and API key in the HTTP query, then set the model to the Grok model you want to use:

```json
{
  "model": "grok-...",
  "stream": false,
  "messages": {{ messages.value }},
  "tools": {{ tools.value }}
}
```

If the response follows the OpenAI-compatible shape, no change is needed in the JavaScript bridge.

### Ollama

Ollama can also be used when your Lowcoder instance can reach the Ollama server and the selected local model supports tools.

For a local setup, the HTTP query usually points to an Ollama OpenAI-compatible endpoint such as:

```text
http://localhost:11434/v1/chat/completions
```

Then use a local model name:

```json
{
  "model": "llama3.1",
  "stream": false,
  "messages": {{ messages.value }},
  "tools": {{ tools.value }}
}
```

In hosted or containerized Lowcoder environments, `localhost` means the Lowcoder container or server, not your laptop. Use a reachable network hostname for Ollama in that case.

### Claude

Claude can be used too, but it does not use the exact same request and response shape as OpenAI-compatible APIs. Keep the same Automator payload, but adapt it in the JavaScript bridge.

For Claude, the bridge usually needs to:

- move the system message into Claude's top-level `system` field
- convert OpenAI-style tools into Claude tools
- read Claude `text` and `tool_use` response blocks
- return Lowcoder's assistant message shape

A simplified bridge shape looks like this:

```js
const a = ai.value;
const system = a.messages.find((m) => m.role === "system")?.content || "";
const messages = a.messages.filter((m) => m.role !== "system");
const tools = a.tools.map((tool) => ({
  name: tool.function.name,
  description: tool.function.description,
  input_schema: tool.function.parameters,
}));

return claudeHttp
  .run({ system, messages, tools })
  .then((response) => {
    const blocks = response.content || [];
    const text = blocks
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");
    const toolUse = blocks.find((block) => block.type === "tool_use");

    if (!toolUse) {
      return {
        role: "assistant",
        content: text ? [{ type: "text", text }] : [],
      };
    }

    const argsText = JSON.stringify(toolUse.input || {});

    return {
      role: "assistant",
      content: [
        ...(text ? [{ type: "text", text }] : []),
        {
          type: "tool-call",
          toolCallId: toolUse.id,
          toolName: toolUse.name,
          args: toolUse.input || {},
          argsText,
        },
      ],
    };
  });
```

The exact HTTP query body depends on the Claude API version and the model you select.

## JavaScript Bridge Query

Create a JavaScript query that receives `ai.value`, calls the provider HTTP query, and returns a Lowcoder assistant message. Select the same bridge for Automator and AI Help when they use the same provider.

### OpenAI Responses bridge

Create a JavaScript query named `unifiedAIQuery`:

```js
const request = ai.value;

const systemMessage = request.messages.find(
  (message) => message.role === "system"
);

const input = request.messages
  .filter((message) => message.role !== "system")
  .map((message) => ({
    role: message.role,
    content: message.content
  }));

const tools = request.tools.map((tool) => ({
  type: "function",
  name: tool.function.name,
  description: tool.function.description,
  parameters: tool.function.parameters
}));

return openAIResponses
  .run({
    instructions: systemMessage?.content || "",
    input,
    tools
  })
  .then((response) => {
    const output = response.output || [];
    const assistantText = output
      .filter(
        (item) =>
          item.type === "message" &&
          item.role === "assistant"
      )
      .flatMap((item) => item.content || [])
      .filter((part) => part.type === "output_text")
      .map((part) => part.text)
      .join("\n");

    const content = assistantText
      ? [{ type: "text", text: assistantText }]
      : [];

    output
      .filter((item) => item.type === "function_call")
      .forEach((functionCall) => {
        const argsText = functionCall.arguments || "{}";
        content.push({
          type: "tool-call",
          toolCallId: functionCall.call_id,
          toolName: functionCall.name,
          args: JSON.parse(argsText),
          argsText
        });
      });

    if (content.length === 0) {
      throw new Error("OpenAI returned no text or function call");
    }

    return {
      role: "assistant",
      content
    };
  });
```

This single bridge handles both tool names because they arrive through `request.tools`: Automator supplies `execute_automator_actions`, while AI Help supplies `apply_ai_helper_result`.

### OpenAI-compatible Chat Completions bridge

For OpenAI-compatible Chat Completions providers, including compatible Grok and Ollama endpoints, use a bridge that preserves the nested tool definitions and reads `choices[0].message`:

```js
const a = ai.value;

return llmHttp
  .run({
    messages: a.messages,
    tools: a.tools,
  })
  .then((response) => {
    const msg = response.choices?.[0]?.message || {};
    const content = msg.content || "";
    const toolCall = msg.tool_calls?.[0];

    if (!toolCall) {
      return {
        role: "assistant",
        content: content ? [{ type: "text", text: content }] : [],
      };
    }

    const argsText = toolCall.function?.arguments || "{}";
    const args = JSON.parse(argsText);

    return {
      role: "assistant",
      content: [
        ...(content ? [{ type: "text", text: content }] : []),
        {
          type: "tool-call",
          toolCallId: toolCall.id,
          toolName: toolCall.function.name,
          args,
          argsText,
        },
      ],
    };
  });
```

Both bridge examples keep Automator independent from a specific provider. If your provider returns a different response shape, update only the JavaScript bridge.

<figure><img src="../../.gitbook/assets/automator-ai-help-jsquery.png" alt=""><figcaption><p>JavaScript bridge query that forwards Automator payloads to the HTTP query and normalizes the response.</p></figcaption></figure>

## Select the Query

In the App Editor:

1. open the Automator panel
2. choose the JavaScript bridge query, such as `unifiedAIQuery`, in the query selector
3. send an instruction, such as creating components, adjusting layout, or modifying supported properties

Automator and AI Help use the same saved AI-query preference. Selecting the shared bridge in either panel makes it the default when the other panel is opened.

Automator will run the selected query and apply supported tool calls returned by the model.

<figure><img src="../../.gitbook/assets/automator-query-selection.png" alt=""><figcaption><p>Select the JavaScript bridge query in the Automator panel.</p></figcaption></figure>

## Example Instructions

After selecting the bridge query, you can ask Automator for app-editor changes such as:

- "Create a customer form with name, email, company, and submit button."
- "Add a table for orders and place it below the filters."
- "Change the selected button text to Save changes."
- "Create a simple dashboard layout with a chart and two summary cards."

The model can only apply actions that are available in the tools passed by Lowcoder. If a request is outside the supported action set, the assistant should explain what it can do instead.

<figure><img src="../../.gitbook/assets/automator-app-build.png" alt=""><figcaption><p>Automator can apply generated tool calls to build or update the app canvas.</p></figcaption></figure>

## Response Contract

The selected query must return an assistant message:

```js
{
  role: "assistant",
  content: [
    { type: "text", text: "Done." }
  ]
}
```

When the model calls an Automator tool, include the tool call part:

```js
{
  role: "assistant",
  content: [
    {
      type: "tool-call",
      toolCallId: "call_123",
      toolName: "execute_automator_actions",
      args: {
        explanation: "No canvas changes are required.",
        actions: []
      },
      argsText: "{\"explanation\":\"No canvas changes are required.\",\"actions\":[]}"
    }
  ]
}
```

The exact tool arguments are generated from the `tools` definition passed to your model.

## Notes

- Automator is available only when the related subscription feature is enabled.
- You can use any model that can accept the provided messages and tools, or any backend that can translate them.
- Keep provider API keys in datasource or query configuration, not directly in app-visible code.
- If Automator replies with text but does not change the app, check whether the model returned a tool call.
- If the query fails, test the HTTP query first, then test the JavaScript bridge query.
