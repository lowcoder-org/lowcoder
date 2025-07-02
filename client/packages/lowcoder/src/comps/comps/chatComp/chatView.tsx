// client/packages/lowcoder/src/comps/comps/chatComp/chatView.tsx
import React from "react";
import { ChatCompProps } from "./chatCompTypes";
import { Thread } from "./components/assistant-ui/thread";

import "@assistant-ui/styles/index.css";
import "@assistant-ui/styles/markdown.css";


import { MyRuntimeProvider } from "./components/context/MyRuntimeProvider";



export const ChatView = React.memo((props: ChatCompProps) => {
  return (
    <MyRuntimeProvider>
      <Thread />
    </MyRuntimeProvider>
  );
});

ChatView.displayName = 'ChatView';