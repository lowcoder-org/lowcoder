import { ChatProvider } from "./context/ChatContext";
import { ChatMain } from "./ChatMain";
import { CompAction } from "lowcoder-core";

interface ChatAppProps {
  chatQuery: string;
  currentMessage: string;
  dispatch?: (action: CompAction<any>) => void;
}

export function ChatApp({ chatQuery, currentMessage, dispatch }: ChatAppProps) {
  return (
    <ChatProvider>
      <ChatMain chatQuery={chatQuery} currentMessage={currentMessage} dispatch={dispatch} />
    </ChatProvider>
  );
}
