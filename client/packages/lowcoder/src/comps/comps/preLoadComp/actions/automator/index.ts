// client/packages/lowcoder/src/comps/comps/preLoadComp/actions/automator/index.ts

export { AUTOMATOR_SYSTEM_PROMPT, composeSystemMessage } from "./systemPrompt";
export {
  ACTIONS_CATALOG,
  SUPPORTED_ACTIONS,
  type AutomatorActionName,
  type ActionCatalogEntry,
} from "./actionsCatalog";
export {
  AUTOMATOR_COMPONENTS,
  AUTOMATOR_COMPONENT_TYPES,
  getAutomatorComponents,
  type AutomatorComponentEntry,
  type AutomatorLayoutPropertyDescriptor,
  type AutomatorStylePropertyMap,
} from "./automatorComponents";
export {
  buildEditorSnapshot,
  type EditorSnapshot,
  type ComponentSnapshot,
  type QuerySnapshot,
} from "./editorSnapshot";
export {
  buildAutomatorPayload,
  type LLMMessage,
  type OrchestratorInput,
  type OrchestratorOutput,
} from "./orchestrator";
export {
  buildToolDefinitions,
  TOOL_NAME,
  type OpenAIToolDefinition,
} from "./toolDefinitions";
