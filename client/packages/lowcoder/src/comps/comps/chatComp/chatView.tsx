// client/packages/lowcoder/src/comps/comps/chatComp/chatView.tsx
import React from "react";
import { ChatCompProps } from "./chatCompTypes";
import { CompAction } from "lowcoder-core";
import { ChatApp } from "./components/ChatApp";

import "@assistant-ui/styles/index.css";
import "@assistant-ui/styles/markdown.css";

// Extend the props we receive so we can forward the redux dispatch
interface ChatViewProps extends ChatCompProps {
  dispatch?: (action: CompAction<any>) => void;
}

export const ChatView = React.memo((props: ChatViewProps) => {
  const { chatQuery, currentMessage, dispatch } = props;
  return <ChatApp chatQuery={chatQuery} currentMessage={currentMessage} dispatch={dispatch} />;
});

ChatView.displayName = 'ChatView';