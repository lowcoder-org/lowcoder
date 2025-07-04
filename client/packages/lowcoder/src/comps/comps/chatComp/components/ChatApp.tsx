import { ChatProvider } from "./context/ChatContext";
import { ChatMain } from "./ChatMain";

export function ChatApp() {
  return (
    <ChatProvider>
      <ChatMain />
    </ChatProvider>
  );
}
