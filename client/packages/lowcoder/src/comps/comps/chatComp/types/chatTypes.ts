import { CompleteAttachment } from "@assistant-ui/react";

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    text: string;
    timestamp: number;
    attachments?: CompleteAttachment[];
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
    sendMessage(message: ChatMessage, sessionId?: string): Promise<MessageResponse>;
    // Future: sendMessageStream?(message: ChatMessage): AsyncGenerator<MessageResponse>;
  }
  
  export interface MessageResponse {
    content: string;
    metadata?: any;
    actions?: any[];
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
