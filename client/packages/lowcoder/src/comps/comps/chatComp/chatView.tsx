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
    api: props.modelHost,
    stream: props.streaming,
    modelType: props.modelType as any,
    systemPrompt: props.systemPrompt,
    agent: props.agent,
    maxTurns: props.maxInteractions,
  } as any);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Thread />
    </AssistantRuntimeProvider>
  );
});

ChatView.displayName = 'ChatView';