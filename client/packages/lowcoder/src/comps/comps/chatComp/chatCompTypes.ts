// client/packages/lowcoder/src/comps/comps/chatComp/chatCompTypes.ts

// ============================================================================
//   CHATCOMP TYPES 
// ============================================================================

export type ChatCompProps = {
  // Storage
  tableName: string;
  
  // Message Handler (Query only)
  chatQuery: string;
  systemPrompt: string;
  
  // UI
  placeholder: string;
  
  // Exposed Variables
  currentMessage: string;   // Read-only exposed variable
};

// Legacy export for backwards compatibility (if needed)
export type ChatCompLegacyProps = ChatCompProps;
