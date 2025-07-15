// client/packages/lowcoder/src/comps/comps/chatComp/types/chatTypes.ts

// ============================================================================
// CORE MESSAGE AND THREAD TYPES (cleaned up from your existing types)
// ============================================================================

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    text: string;
    timestamp: number;
  }
  
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
    sendMessage(message: string): Promise<MessageResponse>;
    // Future: sendMessageStream?(message: string): AsyncGenerator<MessageResponse>;
  }
  
  export interface MessageResponse {
    content: string;
    metadata?: any;
  }
  
  // ============================================================================
  // CONFIGURATION TYPES (simplified)
  // ============================================================================
  
  export interface N8NHandlerConfig {
    modelHost: string;
    systemPrompt?: string;
    streaming?: boolean;
  }
  
  export interface QueryHandlerConfig {
    chatQuery: string;
    dispatch: any;
    streaming?: boolean;
    systemPrompt?: string;
  }
  
  // ============================================================================
  // COMPONENT PROPS (what each component actually needs)
  // ============================================================================
  
  export interface ChatCoreProps {
    storage: ChatStorage;
    messageHandler: MessageHandler;
    placeholder?: string;
    onMessageUpdate?: (message: string) => void;
    onConversationUpdate?: (conversationHistory: ChatMessage[]) => void;
    // STANDARD LOWCODER EVENT PATTERN - SINGLE CALLBACK
    onEvent?: (eventName: string) => void;
  }
  
  export interface ChatPanelProps {
    tableName: string;
    modelHost: string;
    systemPrompt?: string;
    streaming?: boolean;
    onMessageUpdate?: (message: string) => void;
  }