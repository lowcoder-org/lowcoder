import { ChatProvider } from "./context/ChatContext";
import { ChatMain } from "./ChatMain";
import { CompAction } from "lowcoder-core";
import { createChatStorage } from "../utils/chatStorageFactory";

interface ChatAppProps {
  chatQuery: string;
  currentMessage: string;
  dispatch?: (action: CompAction<any>) => void;
  modelType: string;
  modelHost?: string;
  systemPrompt?: string;
  streaming?: boolean;
  tableName: string;
  storage: ReturnType<typeof createChatStorage>;
}

export function ChatApp({ 
  chatQuery, 
  currentMessage, 
  dispatch, 
  modelType, 
  modelHost, 
  systemPrompt, 
  streaming,
  tableName,
  storage 
}: ChatAppProps) {
  return (
    <ChatProvider storage={storage}>
      <ChatMain 
        chatQuery={chatQuery} 
        currentMessage={currentMessage} 
        dispatch={dispatch}
        modelType={modelType}
        modelHost={modelHost}
        systemPrompt={systemPrompt}
        streaming={streaming}
        tableName={tableName}
      />
    </ChatProvider>
  );
}