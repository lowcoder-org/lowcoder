// client/packages/lowcoder/src/comps/comps/chatComp/components/ChatPanel.tsx

import React, { useMemo } from "react";
import { ChatCore } from "./ChatCore";
import { createChatStorage } from "../utils/storageFactory";
import { N8NHandler } from "../handlers/messageHandlers";
import { ChatPanelProps } from "../types/chatTypes";

import "@assistant-ui/styles/index.css";
import "@assistant-ui/styles/markdown.css";

// ============================================================================
// CHAT PANEL - CLEAN BOTTOM PANEL COMPONENT
// ============================================================================

export function ChatPanel({
  tableName,
  modelHost,
  systemPrompt = "You are a helpful assistant.",
  streaming = true,
  onMessageUpdate
}: ChatPanelProps) {
  
  // Create storage instance
  const storage = useMemo(() => 
    createChatStorage(tableName), 
    [tableName]
  );
  
  // Create N8N message handler
  const messageHandler = useMemo(() => 
    new N8NHandler({
      modelHost,
      systemPrompt,
      streaming
    }), 
    [modelHost, systemPrompt, streaming]
  );

  return (
    <ChatCore
      storage={storage}
      messageHandler={messageHandler}
      onMessageUpdate={onMessageUpdate}
    />
  );
}