// client/packages/lowcoder/src/comps/comps/chatComp/chatCompTypes.ts
import { StringControl, NumberControl } from "comps/controls/codeControl";
import { withDefault } from "comps/generators";
import { BoolControl } from "comps/controls/boolControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import QuerySelectControl from "comps/controls/querySelectControl";

// Model type dropdown options
const ModelTypeOptions = [
  { label: "Direct LLM", value: "direct-llm" },
  { label: "n8n Workflow", value: "n8n" },
] as const;

export const chatChildrenMap = {
  text: withDefault(StringControl, "Chat Component Placeholder"),
  chatQuery: QuerySelectControl,
  modelType: dropdownControl(ModelTypeOptions, "direct-llm"),
  streaming: BoolControl.DEFAULT_TRUE,
  systemPrompt: withDefault(StringControl, "You are a helpful assistant."),
  agent: BoolControl,
  maxInteractions: withDefault(NumberControl, 10),
};

export type ChatCompProps = {
  text: string;
  chatQuery: string;
  modelType: string;
  streaming: boolean;
  systemPrompt: string;
  agent: boolean;
  maxInteractions: number;
};