// client/packages/lowcoder/src/comps/comps/chatComp/chatView.tsx
import React from "react";
import { ChatCompProps } from "./chatCompTypes";
import { Thread } from "./components/assistant-ui/thread";

// Import assistant-ui components and proper runtime
import { 
  AssistantRuntimeProvider,
} from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import "@assistant-ui/styles/index.css";
import "@assistant-ui/styles/markdown.css";

export const ChatView = React.memo((props: ChatCompProps) => {
  // Create proper runtime using useChatRuntime
  const runtime = useChatRuntime({
    api: "/api/chat", // We'll create this endpoint later
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Thread />
    </AssistantRuntimeProvider>
  );
});

ChatView.displayName = 'ChatView';