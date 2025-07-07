// client/packages/lowcoder/src/comps/comps/chatComp/chatView.tsx
import React, { useMemo } from "react";
import { ChatCompProps } from "./chatCompTypes";
import { CompAction } from "lowcoder-core";
import { ChatApp } from "./components/ChatApp";
import { createChatStorage } from './utils/chatStorageFactory';

import "@assistant-ui/styles/index.css";
import "@assistant-ui/styles/markdown.css";

// Extend the props we receive so we can forward the redux dispatch
interface ChatViewProps extends ChatCompProps {
  dispatch?: (action: CompAction<any>) => void;
}

export const ChatView = React.memo((props: ChatViewProps) => {
  const { 
    chatQuery, 
    currentMessage, 
    dispatch,
    modelType,
    modelHost,
    systemPrompt,
    streaming,
    tableName
  } = props;

  // Create storage instance based on tableName
  const storage = useMemo(() => createChatStorage(tableName || "default"), [tableName]);

  return (
    <ChatApp 
      chatQuery={chatQuery} 
      currentMessage={currentMessage} 
      dispatch={dispatch}
      modelType={modelType}
      modelHost={modelHost}
      systemPrompt={systemPrompt}
      streaming={streaming}
      tableName={tableName}
      storage={storage}
    />
  );
});

ChatView.displayName = 'ChatView';