// client/packages/lowcoder/src/comps/comps/chatComp/components/ChatCore.tsx

import React from "react";
import { ChatProvider } from "./context/ChatContext";
import { ChatCoreMain } from "./ChatCoreMain";
import { ChatCoreProps } from "../types/chatTypes";

// ============================================================================
// CHAT CORE - THE SHARED FOUNDATION
// ============================================================================

export function ChatCore({ storage, messageHandler, onMessageUpdate, onConversationUpdate }: ChatCoreProps) {
  return (
    <ChatProvider storage={storage}>
      <ChatCoreMain 
        messageHandler={messageHandler}
        onMessageUpdate={onMessageUpdate}
        onConversationUpdate={onConversationUpdate}
      />
    </ChatProvider>
  );
}