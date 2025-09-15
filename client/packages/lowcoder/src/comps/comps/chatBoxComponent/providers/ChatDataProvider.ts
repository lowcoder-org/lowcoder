// Core interface for chat data providers
// This abstraction allows us to support both local (ALASql) and collaborative (Yjs) storage

import { 
  UnifiedMessage, 
  UnifiedRoom, 
  UserPresence, 
  TypingState, 
  ConnectionConfig, 
  ConnectionState, 
  ChatEvent, 
  OperationResult,
  ChatDataError,
  CreateRoomRequest,
  JoinRoomRequest,
  RoomMembershipUpdate,
  RoomListFilter
} from '../types/chatDataTypes';

// Callback type for real-time subscriptions
export type ChatEventCallback = (event: ChatEvent) => void;
export type PresenceCallback = (users: UserPresence[]) => void;
export type TypingCallback = (typingUsers: TypingState[]) => void;
export type ConnectionCallback = (state: ConnectionState) => void;

// Subscription cleanup function
export type UnsubscribeFunction = () => void;

// Main data provider interface
export interface ChatDataProvider {
  // Provider identification
  readonly name: string;
  readonly version: string;
  
  // Connection management
  connect(config: ConnectionConfig): Promise<OperationResult<void>>;
  disconnect(): Promise<OperationResult<void>>;
  getConnectionState(): ConnectionState;
  isConnected(): boolean;
  
  // Room/Thread operations
  createRoom(room: Omit<UnifiedRoom, 'id' | 'createdAt' | 'updatedAt'>): Promise<OperationResult<UnifiedRoom>>;
  getRooms(userId?: string): Promise<OperationResult<UnifiedRoom[]>>;
  getRoom(roomId: string): Promise<OperationResult<UnifiedRoom>>;
  getRoomByName(name: string): Promise<OperationResult<UnifiedRoom>>;
  updateRoom(roomId: string, updates: Partial<UnifiedRoom>): Promise<OperationResult<UnifiedRoom>>;
  deleteRoom(roomId: string): Promise<OperationResult<void>>;
  
  // Enhanced room management operations
  createRoomFromRequest(request: CreateRoomRequest, creatorId: string): Promise<OperationResult<UnifiedRoom>>;
  getAvailableRooms(userId: string, filter?: RoomListFilter): Promise<OperationResult<UnifiedRoom[]>>;
  joinRoom(request: JoinRoomRequest): Promise<OperationResult<UnifiedRoom>>;
  leaveRoom(roomId: string, userId: string): Promise<OperationResult<void>>;
  updateRoomMembership(update: RoomMembershipUpdate): Promise<OperationResult<UnifiedRoom>>;
  canUserJoinRoom(roomId: string, userId: string): Promise<OperationResult<boolean>>;
  
  // Message operations
  sendMessage(message: Omit<UnifiedMessage, 'id' | 'timestamp' | 'status'>): Promise<OperationResult<UnifiedMessage>>;
  getMessages(roomId: string, limit?: number, before?: number): Promise<OperationResult<UnifiedMessage[]>>;
  getMessage(messageId: string): Promise<OperationResult<UnifiedMessage>>;
  updateMessage(messageId: string, updates: Partial<UnifiedMessage>): Promise<OperationResult<UnifiedMessage>>;
  deleteMessage(messageId: string): Promise<OperationResult<void>>;
  
  // Real-time subscriptions (for collaborative providers)
  subscribeToRoom(roomId: string, callback: ChatEventCallback): UnsubscribeFunction;
  subscribeToPresence(roomId: string, callback: PresenceCallback): UnsubscribeFunction;
  subscribeToTyping(roomId: string, callback: TypingCallback): UnsubscribeFunction;
  subscribeToConnection(callback: ConnectionCallback): UnsubscribeFunction;
  
  // Presence management
  updatePresence(presence: Partial<UserPresence>): Promise<OperationResult<void>>;
  getPresence(roomId: string): Promise<OperationResult<UserPresence[]>>;
  
  // Typing indicators
  startTyping(roomId: string): Promise<OperationResult<void>>;
  stopTyping(roomId: string): Promise<OperationResult<void>>;
  
  // Utility operations
  clearRoomData(roomId: string): Promise<OperationResult<void>>;
  exportData(): Promise<OperationResult<any>>;
  importData(data: any): Promise<OperationResult<void>>;
  
  // Health check
  healthCheck(): Promise<OperationResult<{ status: string; details?: any }>>;
}

// Base abstract class with common functionality
export abstract class BaseChatDataProvider implements ChatDataProvider {
  public abstract readonly name: string;
  public abstract readonly version: string;
  
  protected connectionState: ConnectionState = 'disconnected';
  protected config?: ConnectionConfig;
  protected roomSubscriptions: Map<string, ChatEventCallback[]> = new Map();
  protected presenceSubscriptions: Map<string, PresenceCallback[]> = new Map();
  protected typingSubscriptions: Map<string, TypingCallback[]> = new Map();
  protected connectionSubscriptions: ConnectionCallback[] = [];
  
  // Connection state management
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }
  
  isConnected(): boolean {
    return this.connectionState === 'connected';
  }
  
  protected setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.notifyConnectionSubscribers(state);
    }
  }
  
  // Event subscription management
  subscribeToRoom(roomId: string, callback: ChatEventCallback): UnsubscribeFunction {
    if (!this.roomSubscriptions.has(roomId)) {
      this.roomSubscriptions.set(roomId, []);
    }
    this.roomSubscriptions.get(roomId)!.push(callback);
    
    return () => {
      const callbacks = this.roomSubscriptions.get(roomId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
        if (callbacks.length === 0) {
          this.roomSubscriptions.delete(roomId);
        }
      }
    };
  }
  
  subscribeToPresence(roomId: string, callback: PresenceCallback): UnsubscribeFunction {
    if (!this.presenceSubscriptions.has(roomId)) {
      this.presenceSubscriptions.set(roomId, []);
    }
    this.presenceSubscriptions.get(roomId)!.push(callback);
    
    return () => {
      const callbacks = this.presenceSubscriptions.get(roomId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
        if (callbacks.length === 0) {
          this.presenceSubscriptions.delete(roomId);
        }
      }
    };
  }
  
  subscribeToTyping(roomId: string, callback: TypingCallback): UnsubscribeFunction {
    if (!this.typingSubscriptions.has(roomId)) {
      this.typingSubscriptions.set(roomId, []);
    }
    this.typingSubscriptions.get(roomId)!.push(callback);
    
    return () => {
      const callbacks = this.typingSubscriptions.get(roomId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
        if (callbacks.length === 0) {
          this.typingSubscriptions.delete(roomId);
        }
      }
    };
  }
  
  subscribeToConnection(callback: ConnectionCallback): UnsubscribeFunction {
    this.connectionSubscriptions.push(callback);
    
    return () => {
      const index = this.connectionSubscriptions.indexOf(callback);
      if (index > -1) {
        this.connectionSubscriptions.splice(index, 1);
      }
    };
  }
  
  // Notify subscribers
  protected notifyRoomSubscribers(roomId: string, event: ChatEvent): void {
    const callbacks = this.roomSubscriptions.get(roomId);
    
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`Error in chat event callback:`, error);
        }
      });
    } else {
      console.warn(`No subscribers found for room: ${roomId}`);
    }
  }
  
  protected notifyPresenceSubscribers(roomId: string, users: UserPresence[]): void {
    const callbacks = this.presenceSubscriptions.get(roomId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(users);
        } catch (error) {
          console.error('Error in presence callback:', error);
        }
      });
    }
  }
  
  protected notifyTypingSubscribers(roomId: string, typingUsers: TypingState[]): void {
    const callbacks = this.typingSubscriptions.get(roomId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(typingUsers);
        } catch (error) {
          console.error('Error in typing callback:', error);
        }
      });
    }
  }
  
  protected notifyConnectionSubscribers(state: ConnectionState): void {
    this.connectionSubscriptions.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Error in connection callback:', error);
      }
    });
  }
  
  // Utility methods
  protected generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  protected createSuccessResult<T>(data?: T): OperationResult<T> {
    return {
      success: true,
      data,
      timestamp: Date.now(),
    };
  }
  
  protected createErrorResult(error: string, details?: any): OperationResult {
    return {
      success: false,
      error,
      timestamp: Date.now(),
    };
  }
  
  protected handleError(error: any, operation: string): OperationResult {
    console.error(`${this.name} provider error in ${operation}:`, error);
    
    if (error instanceof ChatDataError) {
      return this.createErrorResult(error.message, error.details);
    }
    
    return this.createErrorResult(
      error?.message || `Unknown error in ${operation}`,
      error
    );
  }
  
  // Abstract methods that must be implemented by concrete providers
  public abstract connect(config: ConnectionConfig): Promise<OperationResult<void>>;
  public abstract disconnect(): Promise<OperationResult<void>>;
  public abstract createRoom(room: Omit<UnifiedRoom, 'id' | 'createdAt' | 'updatedAt'>): Promise<OperationResult<UnifiedRoom>>;
  public abstract getRooms(userId?: string): Promise<OperationResult<UnifiedRoom[]>>;
  public abstract getRoom(roomId: string): Promise<OperationResult<UnifiedRoom>>;
  public abstract getRoomByName(name: string): Promise<OperationResult<UnifiedRoom>>;
  public abstract updateRoom(roomId: string, updates: Partial<UnifiedRoom>): Promise<OperationResult<UnifiedRoom>>;
  public abstract deleteRoom(roomId: string): Promise<OperationResult<void>>;
  public abstract createRoomFromRequest(request: CreateRoomRequest, creatorId: string): Promise<OperationResult<UnifiedRoom>>;
  public abstract getAvailableRooms(userId: string, filter?: RoomListFilter): Promise<OperationResult<UnifiedRoom[]>>;
  public abstract joinRoom(request: JoinRoomRequest): Promise<OperationResult<UnifiedRoom>>;
  public abstract leaveRoom(roomId: string, userId: string): Promise<OperationResult<void>>;
  public abstract updateRoomMembership(update: RoomMembershipUpdate): Promise<OperationResult<UnifiedRoom>>;
  public abstract canUserJoinRoom(roomId: string, userId: string): Promise<OperationResult<boolean>>;
  public abstract sendMessage(message: Omit<UnifiedMessage, 'id' | 'timestamp' | 'status'>): Promise<OperationResult<UnifiedMessage>>;
  public abstract getMessages(roomId: string, limit?: number, before?: number): Promise<OperationResult<UnifiedMessage[]>>;
  public abstract getMessage(messageId: string): Promise<OperationResult<UnifiedMessage>>;
  public abstract updateMessage(messageId: string, updates: Partial<UnifiedMessage>): Promise<OperationResult<UnifiedMessage>>;
  public abstract deleteMessage(messageId: string): Promise<OperationResult<void>>;
  public abstract updatePresence(presence: Partial<UserPresence>): Promise<OperationResult<void>>;
  public abstract getPresence(roomId: string): Promise<OperationResult<UserPresence[]>>;
  public abstract startTyping(roomId: string): Promise<OperationResult<void>>;
  public abstract stopTyping(roomId: string): Promise<OperationResult<void>>;
  public abstract clearRoomData(roomId: string): Promise<OperationResult<void>>;
  public abstract exportData(): Promise<OperationResult<any>>;
  public abstract importData(data: any): Promise<OperationResult<void>>;
  public abstract healthCheck(): Promise<OperationResult<{ status: string; details?: any }>>;
} 