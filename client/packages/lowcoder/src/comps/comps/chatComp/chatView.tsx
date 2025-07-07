// client/packages/lowcoder/src/comps/comps/chatComp/chatView.tsx
import React from "react";
import { ChatCompProps } from "./chatCompTypes";
import { ChatApp } from "./components/ChatApp";

import "@assistant-ui/styles/index.css";
import "@assistant-ui/styles/markdown.css";

export const ChatView = React.memo((props: ChatCompProps) => {
  return <ChatApp {...props} />;
});

ChatView.displayName = 'ChatView';