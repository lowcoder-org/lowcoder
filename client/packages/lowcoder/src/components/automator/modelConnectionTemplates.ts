import { trans } from "i18n";

export type ModelApiFormat = "responses" | "chatCompletions";

export function modelRequestBody(format: ModelApiFormat, model: string) {
  const common = `"model": ${JSON.stringify(model.trim())}, "stream": false, "parallel_tool_calls": false`;
  return format === "responses"
    ? `{ ${common}, "store": false, "instructions": {{ instructions.value }}, "input": {{ input.value }}, "tools": {{ tools.value }} }`
    : `{ ${common}, "messages": {{ messages.value }}, "tools": {{ tools.value }} }`;
}

// The generated script contains no credentials. Authentication stays in the datasource.
export function modelBridgeScript(format: ModelApiFormat, httpQuery: string) {
  if (!/^[A-Za-z_$][\w$]*$/.test(httpQuery)) throw new Error("Invalid query name");
  const request = format === "responses" ? `{
    instructions: { value: a.messages.filter(m => m.role === "system").map(m => m.content).join("\\n") },
    input: { value: a.messages.filter(m => m.role !== "system") },
    tools: { value: (a.tools || []).map(t => ({ type: "function", ...t.function, strict: false })) }
  }` : `{ messages: { value: a.messages }, tools: { value: a.tools || [] } }`;
  const parse = format === "responses" ? `
  for (const item of response.output || []) {
    if (item.type === "message" && item.role === "assistant") {
      for (const part of item.content || []) {
        if (part.type === "output_text" && part.text) content.push({ type: "text", text: part.text });
      }
    }
    if (item.type === "function_call") addCall(item.call_id, item.name, item.arguments);
  }` : `
  const message = response.choices?.[0]?.message;
  if (message?.content) content.push({ type: "text", text: message.content });
  for (const call of message?.tool_calls || []) addCall(call.id, call.function?.name, call.function?.arguments);`;
  return `// Automator supplies ai.value; this query fills the HTTP request and converts the reply.
const a = typeof ai === "undefined" ? undefined : ai.value;
if (!a || !Array.isArray(a.messages)) throw new Error(${JSON.stringify(trans("automator.bridge.runFromAutomator"))});
return ${httpQuery}.run(${request}).then(response => {
  if (!response || response.error) {
    const detail = typeof response?.error === "string" ? response.error : response?.error?.message;
    throw new Error(${JSON.stringify(trans("automator.bridge.requestFailed"))} + (typeof detail === "string" ? " " + detail : ""));
  }
  const content = [];
  function addCall(id, name, raw) {
    if (!name || !(a.tools || []).some(t => t.function.name === name)) throw new Error(${JSON.stringify(trans("automator.bridge.unexpectedTool"))});
    const argsText = raw || "{}";
    let args;
    try { args = JSON.parse(argsText); } catch { throw new Error(${JSON.stringify(trans("automator.bridge.invalidArguments"))}); }
    content.push({ type: "tool-call", toolCallId: id, toolName: name, args, argsText });
  }
${parse}
  if (!content.length) throw new Error(${JSON.stringify(trans("automator.bridge.emptyResponse"))});
  return { role: "assistant", content };
});`;
}

export const connectionTestRequest = {
  mode: "automator",
  messages: [
    { role: "system", content: "This is a connection test. Call check_connection with ok set to true. Do not make any app changes." },
    { role: "user", content: "Verify that tool calling works." },
  ],
  tools: [{
    type: "function",
    function: {
      name: "check_connection", description: "Confirm tool calling without changing the app.",
      parameters: { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"], additionalProperties: false },
    },
  }],
};

export function isConnectionVerified(result: unknown): boolean {
  const message = result as { role?: string; content?: { type?: string; toolName?: string; args?: { ok?: boolean } }[] } | null;
  return message?.role === "assistant" && Array.isArray(message.content) && message.content.some(part =>
    part.type === "tool-call" && part.toolName === "check_connection" && part.args?.ok === true);
}

export function validModelBaseUrl(value: string) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash;
  } catch { return false; }
}
