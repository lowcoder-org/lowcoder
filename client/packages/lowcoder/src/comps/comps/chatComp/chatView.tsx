// client/packages/lowcoder/src/comps/comps/chatComp/chatView.tsx
import React from "react";
import { ChatCompProps } from "./chatCompTypes";

export const ChatView = React.memo((props: ChatCompProps) => {
  return (
    <div style={{ 
      height: '100%', 
      border: '1px solid #ccc', 
      padding: '16px',
      borderRadius: '4px'
    }}>
      {props.text}
    </div>
  );
});

ChatView.displayName = 'ChatView';