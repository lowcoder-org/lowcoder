// ChatBoxComponent Module Exports
// Provides clean access to all chat component functionality

// Main component
export { ChatBoxComp } from './chatBoxComp';

// Data layer
export type { ChatDataProvider } from './providers/ChatDataProvider';
export { BaseChatDataProvider } from './providers/ChatDataProvider';
export { ALASqlProvider } from './providers/ALASqlProvider';
export { YjsPluvProvider } from './providers/YjsPluvProvider';
// export type { YjsPluvProviderConfig } from './providers/YjsPluvProvider';

// Management layer
export { HybridChatManager } from './managers/HybridChatManager';
export type { HybridChatManagerConfig } from './managers/HybridChatManager';

// React hooks
export { useChatManager } from './hooks/useChatManager';
export type { UseChatManagerConfig } from './hooks/useChatManager';

// Types and utilities
export * from './types/chatDataTypes'; 