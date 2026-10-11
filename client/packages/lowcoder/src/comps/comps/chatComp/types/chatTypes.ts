import type { ThreadMessageLike } from "@assistant-ui/react";

export type ChatMessageContent = Exclude<ThreadMessageLike["content"], string>;

export type ChatMessage = Omit<
  ThreadMessageLike,
  "id" | "role" | "content" | "createdAt" | "attachments"
> & {
    id: string;
    role: "user" | "assistant";
    content: ChatMessageContent;
    createdAt: Date;
    attachments?: ThreadMessageLike["attachments"];
  };
  
  export interface ChatThread {
    threadId: string;
    status: "regular" | "archived";
    title: string;
    createdAt: number;
    updatedAt: number;
  }
  
  // ============================================================================
  // STORAGE INTERFACE (abstracted from your existing storage factory)
  // ============================================================================
  
  export interface ChatStorage {
    initialize(): Promise<void>;
    saveThread(thread: ChatThread): Promise<void>;
    getThread(threadId: string): Promise<ChatThread | null>;
    getAllThreads(): Promise<ChatThread[]>;
    deleteThread(threadId: string): Promise<void>;
    saveMessage(message: ChatMessage, threadId: string): Promise<void>;
    saveMessages(messages: ChatMessage[], threadId: string): Promise<void>;
    getMessages(threadId: string): Promise<ChatMessage[]>;
    deleteMessages(threadId: string): Promise<void>;
    clearAllData(): Promise<void>;
    resetDatabase(): Promise<void>;
    cleanup(): Promise<void>;
  }
  
  // ============================================================================
  // MESSAGE HANDLER INTERFACE (new clean abstraction)
  // ============================================================================

  export interface MessageHandler {
    sendMessage(
      message: ChatMessage,
      conversationHistory: ChatMessage[]
    ): Promise<ChatMessage>;
    // Future: sendMessageStream?(message: ChatMessage): AsyncGenerator<ChatMessage>;
  }

  export interface AIAssistantMessageHandler {
    sendMessage(message: ChatMessage, sessionId: string | undefined, conversationHistory: ChatMessage[]): Promise<ChatMessage>;
  }
  
  // ============================================================================
  // CONFIGURATION TYPES (simplified)
  // ============================================================================
  
  export interface QueryHandlerConfig {
    chatQuery: string;
    dispatch: any;
    systemPrompt?: string;
    /**
     * Snapshot accessor for the live editor state. The handler calls this
     * lazily on every send so it always has the *current* canvas state.
     */
    getEditorState?: () => any;
  }
  
// ============================================================================
// COMPONENT PROPS (what each component actually needs)
// ============================================================================

// Main Chat Component Props (with full styling support)
export interface ChatCoreProps {
  messageHandler: MessageHandler;
  placeholder?: string;
  autoHeight?: boolean;
  sidebarWidth?: string;
  onMessageUpdate?: (message: string) => void;
  onConversationUpdate?: (conversationHistory: ChatMessage[]) => void;
  // STANDARD LOWCODER EVENT PATTERN - SINGLE CALLBACK
  onEvent?: (eventName: string) => void;
  // Style controls (only for main component)
  style?: any;
  sidebarStyle?: any;
  messagesStyle?: any;
  inputStyle?: any;
  sendButtonStyle?: any;
  newThreadButtonStyle?: any;
  threadItemStyle?: any;
  animationStyle?: any;
}

// Bottom Panel Props (simplified, no styling controls)
export interface ChatPanelProps {
  tableName: string;
  chatQuery: string;
  onMessageUpdate?: (message: string) => void;
}
