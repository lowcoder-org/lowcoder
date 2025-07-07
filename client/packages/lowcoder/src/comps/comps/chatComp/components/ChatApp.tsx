import { ChatProvider } from "./context/ChatContext";
import { ChatMain } from "./ChatMain";
import { ChatCompProps } from "../chatCompTypes";
import { useEffect, useState } from "react";

export function ChatApp(props: ChatCompProps) {
  if (!Boolean(props.tableName)) {
    return null; // Don't render until we have a unique DB name
  }
  
  return (
    <ChatProvider>
      <ChatMain {...props} />
    </ChatProvider>
  );
}
