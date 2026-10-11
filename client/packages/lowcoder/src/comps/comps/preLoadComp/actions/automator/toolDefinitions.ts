// client/packages/lowcoder/src/comps/comps/preLoadComp/actions/automator/toolDefinitions.ts

/**
 * Generates OpenAI-compatible tool (function-calling) definitions from
 * the ACTIONS_CATALOG.
 *
 * Instead of asking the model to emit raw JSON inside its text content
 * (fragile, needs custom parsing), we register a single tool —
 * `execute_automator_actions` — that the model **calls** when it wants
 * to mutate the canvas. The API guarantees `tool_calls[].function.arguments`
 * is valid JSON, so no balanced-brace extraction or fence-stripping needed.
 *
 * When the model needs clarification it simply responds with text (no tool
 * call), which naturally replaces the old `"actions": []` convention.
 *
 * The tool definition is provider-agnostic: OpenAI, Groq, Together, and
 * Ollama all accept the same `tools` shape. Other providers can map this
 * schema in the selected query/backend bridge.
 */

import { ACTIONS_CATALOG } from "./actionsCatalog";

export interface OpenAIToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

function buildActionItemSchema(componentTypes?: string[]): Record<string, unknown> {
  return {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ACTIONS_CATALOG.map((a) => a.action),
        description: "The action to perform on the canvas.",
      },
      component: {
        type: "string",
        ...(componentTypes && componentTypes.length > 0 ? { enum: componentTypes } : {}),
        description:
          "Component type as registered in Lowcoder. Required for place_component and nest_component.",
      },
      component_name: {
        type: "string",
        description: "Unique name for the component on the canvas.",
      },
      query_name: {
        type: "string",
        description: "Name of the bottom-panel data query. Required for delete_query.",
      },
      parent_component_name: {
        type: "string",
        description:
          "Parent container path for nest_component (e.g. 'form1.container.body.0.view').",
      },
      layout: {
        type: "object",
        properties: {
          x: { type: "number", description: "Grid column position (0-based)." },
          y: { type: "number", description: "Grid row position." },
          w: { type: "number", description: "Width in grid columns." },
          h: { type: "number", description: "Height in grid rows." },
        },
        description: "Grid layout position and size.",
      },
      action_parameters: {
        type: "object",
        description:
          "Action-specific parameters (properties, styles, event config, etc.). Shape depends on the action and component type — see AUTOMATOR_COMPONENTS in the system prompt.",
      },
    },
    required: ["action"],
  };
}

/**
 * Build the OpenAI `tools` array to pass alongside `messages` in the
 * chat-completions request. Currently returns a single tool; the array
 * wrapper keeps the door open for future per-action tools if we want
 * tighter per-action schemas.
 */
export function buildToolDefinitions(componentTypes?: string[]): OpenAIToolDefinition[] {
  const actionSummary = ACTIONS_CATALOG.map(
    (a) => `  - ${a.action}: ${a.purpose}`
  ).join("\n");

  return [
    {
      type: "function",
      function: {
        name: "execute_automator_actions",
        description: [
          "Execute one or more Lowcoder Automator actions on the canvas.",
          "Call this tool when you want to place, configure, style, move,",
          "resize, delete, or otherwise modify components or queries in the app.",
          "Do NOT call this tool when you need clarification — just respond",
          "with text instead.",
          "",
          "Available actions:",
          actionSummary,
        ].join("\n"),
        parameters: {
          type: "object",
          properties: {
            explanation: {
              type: "string",
              description:
                "Brief markdown summary of what you are doing and why.",
            },
            actions: {
              type: "array",
              description: "Ordered list of actions to execute on the canvas.",
              items: buildActionItemSchema(componentTypes),
            },
          },
          required: ["explanation", "actions"],
        },
      },
    },
  ];
}

export const TOOL_NAME = "execute_automator_actions";
