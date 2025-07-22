// client/packages/lowcoder/src/comps/comps/chatComp/chatCompTypes.ts

// ============================================================================
// CLEAN CHATCOMP TYPES - SIMPLIFIED AND FOCUSED
// ============================================================================

export type ChatCompProps = {
  // Storage
  tableName: string;
  
  // Message Handler
  handlerType: "query" | "n8n";
  chatQuery: string;        // Only used when handlerType === "query"
  modelHost: string;        // Only used when handlerType === "n8n"
  systemPrompt: string;
  streaming: boolean;
  
  // UI
  placeholder: string;
  
  // Exposed Variables
  currentMessage: string;   // Read-only exposed variable
};

// Legacy export for backwards compatibility (if needed)
export type ChatCompLegacyProps = ChatCompProps;
