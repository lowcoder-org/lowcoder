// Hybrid Chat Manager
// Coordinates between local (ALASql) and collaborative (Yjs+Pluv.io) providers
// Provides a unified interface for chat components

import { ChatDataProvider, UnsubscribeFunction } from '../providers/ChatDataProvider';
import { ALASqlProvider } from '../providers/ALASqlProvider';
import { YjsPluvProvider } from '../providers/YjsPluvProvider';
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
  ChatErrorCodes,
  CreateRoomRequest,
  JoinRoomRequest,
  RoomMembershipUpdate,
  RoomListFilter
} from '../types/chatDataTypes';

// Global provider cache to share instances across components with same applicationId
const globalProviderCache = new Map<string, ALASqlProvider>();

// Function to get or create shared ALASqlProvider for applicationId
function getSharedALASqlProvider(applicationId: string): ALASqlProvider {
  const cacheKey = `alasql_${applicationId}`;
  
  if (!globalProviderCache.has(cacheKey)) {
    console.log(`[HybridChatManager] 🏗️ Creating new shared ALASqlProvider for applicationId: ${applicationId}`);
    globalProviderCache.set(cacheKey, new ALASqlProvider());
  } else {
    console.log(`[HybridChatManager] ♻️ Reusing existing ALASqlProvider for applicationId: ${applicationId}`);
  }
  
  return globalProviderCache.get(cacheKey)!;
}

// Manager configuration
export interface HybridChatManagerConfig {
  mode: 'local' | 'collaborative' | 'hybrid';
  userId: string;
  userName: string;
  applicationId: string;
  
  // Local provider config
  local?: {
    dbName?: string;
    tableName?: string;
  };
  
  // Collaborative provider config
  collaborative?: {
    serverUrl: string;
    roomId: string;
    authToken?: string;
    autoConnect?: boolean;
  };
  
  // Fallback behavior
  fallbackToLocal?: boolean;
  autoReconnect?: boolean;
  reconnectDelay?: number;
}

// Events emitted by the manager
export type ManagerEventType = 'provider_switched' | 'sync_started' | 'sync_completed' | 'sync_failed' | 'connection_changed';

export interface ManagerEvent {
  type: ManagerEventType;
  provider?: string;
  error?: string;
  timestamp: number;
}

export type ManagerEventCallback = (event: ManagerEvent) => void;

export class HybridChatManager {
  private config: HybridChatManagerConfig;
  private primaryProvider!: ChatDataProvider; // Use definite assignment assertion
  private secondaryProvider?: ChatDataProvider;
  private currentMode: 'local' | 'collaborative' | 'hybrid';
  
  // Event management
  private managerEventCallbacks: ManagerEventCallback[] = [];
  private subscriptions: Map<string, UnsubscribeFunction[]> = new Map();
  
  // Reconnection handling
  private reconnectTimer?: NodeJS.Timeout;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  constructor(config: HybridChatManagerConfig) {
    this.config = config;
    this.currentMode = config.mode === 'collaborative' ? 'collaborative' : 
                      config.mode === 'hybrid' ? 'hybrid' : 'local';
    
    // Initialize providers based on mode
    this.initializeProviders();
    this.setupProviderListeners();
  }
  
  private initializeProviders(): void {
    // Use shared ALASqlProvider for same applicationId to enable cross-component room discovery
    this.primaryProvider = getSharedALASqlProvider(this.config.applicationId);
    
    // Initialize collaborative provider if configured
    if (this.config.mode === 'collaborative' || this.config.mode === 'hybrid') {
      // Initialize YjsPluvProvider for collaborative features
      if (this.config.collaborative) {
        try {
                this.secondaryProvider = new YjsPluvProvider();
      
      // Switch primary provider for collaborative mode
      if (this.config.mode === 'collaborative') {
        [this.primaryProvider, this.secondaryProvider] = [this.secondaryProvider, this.primaryProvider];
        this.currentMode = 'collaborative';
      }
        } catch (error) {
          console.error('[HybridChatManager] ❌ FAILED to initialize collaborative provider:', error);
          
                     if (this.config.fallbackToLocal !== false) {
             console.log('[HybridChatManager] Falling back to local mode');
             this.currentMode = 'local';
           } else {
             throw error;
           }
         }
       }
    }
  }
  
  private setupProviderListeners(): void {
    // Monitor primary provider connection
    if (this.primaryProvider.subscribeToConnection) {
      const connectionUnsub = this.primaryProvider.subscribeToConnection((state: ConnectionState) => {
        // Handle connection failures for collaborative provider
        if (this.currentMode === 'collaborative' && state === 'failed' && this.secondaryProvider) {
          this.handleProviderFailure();
        }
        
        this.emitManagerEvent({
          type: 'connection_changed',
          provider: this.primaryProvider.name,
          timestamp: Date.now()
        });
      });
      
      this.addSubscription('connection', connectionUnsub);
    }
  }
  
  private async handleProviderFailure(): Promise<void> {
    if (!this.config.fallbackToLocal || !this.secondaryProvider) {
      return;
    }
    
    try {
      // Switch providers
      [this.primaryProvider, this.secondaryProvider] = [this.secondaryProvider, this.primaryProvider];
      this.currentMode = 'local';
      
      // Emit switch event
      this.emitManagerEvent({
        type: 'provider_switched',
        provider: this.primaryProvider.name,
        timestamp: Date.now()
      });
      
      // Start reconnection attempts for collaborative provider
      this.startReconnectionTimer();
      
    } catch (error) {
      console.error('[HybridChatManager] Failed to switch providers:', error);
      
      this.emitManagerEvent({
        type: 'sync_failed',
        error: error instanceof Error ? error.message : 'Provider switch failed',
        timestamp: Date.now()
      });
    }
  }
  
  private startReconnectionTimer(): void {
    if (this.reconnectTimer || !this.config.autoReconnect) {
      return;
    }
    
    const delay = Math.min(
      this.config.reconnectDelay || 1000 * Math.pow(2, this.reconnectAttempts),
      30000 // Max 30 seconds
    );
    
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = undefined;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        return;
      }
      
      this.reconnectAttempts++;
      
      try {
        // Try to reconnect the collaborative provider
        if (this.secondaryProvider && this.secondaryProvider.name === 'YjsPluvProvider') {
          const result = await this.secondaryProvider.connect({
            mode: 'collaborative',
            userId: this.config.userId,
            userName: this.config.userName,
            realtime: this.config.collaborative || {
              serverUrl: '',
              roomId: '',
              authToken: undefined
            }
          });
          
          if (result.success) {
            // Switch back to collaborative provider
            [this.primaryProvider, this.secondaryProvider] = [this.secondaryProvider, this.primaryProvider];
            this.currentMode = 'collaborative';
            this.reconnectAttempts = 0;
            
            this.emitManagerEvent({
              type: 'provider_switched',
              provider: this.primaryProvider.name,
              timestamp: Date.now()
            });
          } else {
            this.startReconnectionTimer(); // Try again
          }
        }
              } catch (error) {
          this.startReconnectionTimer(); // Try again
        }
    }, delay);
  }
  
  // Initialization
  async initialize(): Promise<OperationResult<void>> {
    try {
      this.emitManagerEvent({
        type: 'sync_started',
        provider: this.primaryProvider.name,
        timestamp: Date.now()
      });
      
      // Prepare connection config
      const connectionConfig = {
        mode: this.currentMode,
        userId: this.config.userId,
        userName: this.config.userName,
        alasql: {
          dbName: this.config.local?.dbName || `ChatDB_${this.config.userId}`,
          tableName: this.config.local?.tableName
        },
        realtime: this.config.collaborative ? {
          roomId: this.config.collaborative.roomId,
          serverUrl: this.config.collaborative.serverUrl,
          authToken: this.config.collaborative.authToken
        } : undefined
      };
      
      const result = await this.primaryProvider.connect(connectionConfig);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to initialize primary provider');
      }
      
      this.emitManagerEvent({
        type: 'sync_completed',
        provider: this.primaryProvider.name,
        timestamp: Date.now()
      });
      
      return { success: true, data: undefined, timestamp: Date.now() };
    } catch (error) {
      console.error('[HybridChatManager] 💥 Initialization failed:', error);
      
      this.emitManagerEvent({
        type: 'sync_failed',
        error: error instanceof Error ? error.message : 'Initialization failed',
        timestamp: Date.now()
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Initialization failed',
        timestamp: Date.now()
      };
    }
  }
  
  async disconnect(): Promise<OperationResult<void>> {
    try {
      // Clear reconnect timer
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = undefined;
      }
      
      // Disconnect all providers
      await this.primaryProvider.disconnect();
      if (this.secondaryProvider) {
        await this.secondaryProvider.disconnect();
      }
      
      // Clean up subscriptions
      this.subscriptions.forEach(subs => subs.forEach(unsub => unsub()));
      this.subscriptions.clear();
      
      return { success: true, timestamp: Date.now() };
    } catch (error) {
      return this.handleError(error, 'disconnect');
    }
  }
  
  // Provider management
  private getActiveProvider(): ChatDataProvider {
    // Always return primary provider for now
    // TODO: Implement provider switching logic
    return this.primaryProvider;
  }
  
  private addSubscription(key: string, unsubscribe: UnsubscribeFunction): void {
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, []);
    }
    this.subscriptions.get(key)!.push(unsubscribe);
  }
  
  private unsubscribeAll(key: string): void {
    const unsubs = this.subscriptions.get(key);
    if (unsubs) {
      unsubs.forEach(unsub => unsub());
      this.subscriptions.delete(key);
    }
  }
  
  // Room operations (delegated to active provider)
  async createRoom(room: Omit<UnifiedRoom, 'id' | 'createdAt' | 'updatedAt'>): Promise<OperationResult<UnifiedRoom>> {
    return this.getActiveProvider().createRoom(room);
  }
  
  async getRooms(userId?: string): Promise<OperationResult<UnifiedRoom[]>> {
    return this.getActiveProvider().getRooms(userId);
  }
  
  async getRoom(roomId: string): Promise<OperationResult<UnifiedRoom>> {
    return this.getActiveProvider().getRoom(roomId);
  }
  
  async getRoomByName(name: string): Promise<OperationResult<UnifiedRoom>> {
    return this.getActiveProvider().getRoomByName(name);
  }

  async updateRoom(roomId: string, updates: Partial<UnifiedRoom>): Promise<OperationResult<UnifiedRoom>> {
    return this.getActiveProvider().updateRoom(roomId, updates);
  }
  
  async deleteRoom(roomId: string): Promise<OperationResult<void>> {
    return this.getActiveProvider().deleteRoom(roomId);
  }
  
  // Enhanced room management operations (delegated to active provider)
  async createRoomFromRequest(request: CreateRoomRequest, creatorId: string): Promise<OperationResult<UnifiedRoom>> {
    console.log('[HybridChatManager] 🏠 Creating room from request:', request);
    return this.getActiveProvider().createRoomFromRequest(request, creatorId);
  }

  async getAvailableRooms(userId: string, filter?: RoomListFilter): Promise<OperationResult<UnifiedRoom[]>> {
    console.log('[HybridChatManager] 🔍 Getting available rooms for user:', userId, 'filter:', filter);
    return this.getActiveProvider().getAvailableRooms(userId, filter);
  }

  async joinRoom(request: JoinRoomRequest): Promise<OperationResult<UnifiedRoom>> {
    console.log('[HybridChatManager] 🚪 User joining room:', request);
    return this.getActiveProvider().joinRoom(request);
  }

  async leaveRoom(roomId: string, userId: string): Promise<OperationResult<void>> {
    console.log('[HybridChatManager] 🚪 User leaving room:', { roomId, userId });
    return this.getActiveProvider().leaveRoom(roomId, userId);
  }

  async updateRoomMembership(update: RoomMembershipUpdate): Promise<OperationResult<UnifiedRoom>> {
    console.log('[HybridChatManager] 👥 Updating room membership:', update);
    return this.getActiveProvider().updateRoomMembership(update);
  }

  async canUserJoinRoom(roomId: string, userId: string): Promise<OperationResult<boolean>> {
    console.log('[HybridChatManager] 🔐 Checking if user can join room:', { roomId, userId });
    return this.getActiveProvider().canUserJoinRoom(roomId, userId);
  }

  async getRoomParticipants(roomId: string): Promise<OperationResult<Array<{ id: string; name: string }>>> {
    console.log('[HybridChatManager] 👥 Getting room participants:', { roomId });
    
    try {
      // First get the room to access participants
      const roomResult = await this.getRoom(roomId);
      if (!roomResult.success || !roomResult.data) {
        return {
          success: false,
          error: roomResult.error || 'Room not found',
          timestamp: Date.now()
        };
      }

      const room = roomResult.data;
      const participants = room.participants || [];

      // Get participant details by looking at recent messages to extract user names
      const messagesResult = await this.getMessages(roomId, 100); // Get recent messages
      if (!messagesResult.success) {
        // If we can't get messages, return participants with just IDs
        return {
          success: true,
          data: participants.map(id => ({ id, name: id })), // Fallback to ID as name
          timestamp: Date.now()
        };
      }

      // Create a map of userId -> userName from messages
      const userMap = new Map<string, string>();
      messagesResult.data?.forEach(message => {
        if (message.authorId && message.authorName) {
          userMap.set(message.authorId, message.authorName);
        }
      });

      // Build participant list with names
      const participantsWithNames = participants.map(participantId => ({
        id: participantId,
        name: userMap.get(participantId) || participantId // Fallback to ID if name not found
      }));

      return {
        success: true,
        data: participantsWithNames,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('[HybridChatManager] Error getting room participants:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get room participants',
        timestamp: Date.now()
      };
    }
  }
  
  // Message operations (delegated to active provider)
  async sendMessage(message: Omit<UnifiedMessage, 'id' | 'timestamp' | 'status'>): Promise<OperationResult<UnifiedMessage>> {
    const activeProvider = this.getActiveProvider();
    
    try {
      const result = await activeProvider.sendMessage(message);
      return result;
    } catch (error) {
      console.error('[HybridChatManager] Error in sendMessage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message',
        timestamp: Date.now()
      };
    }
  }
  
  async getMessages(roomId: string, limit?: number, before?: number): Promise<OperationResult<UnifiedMessage[]>> {
    return this.getActiveProvider().getMessages(roomId, limit, before);
  }
  
  async getMessage(messageId: string): Promise<OperationResult<UnifiedMessage>> {
    return this.getActiveProvider().getMessage(messageId);
  }
  
  async updateMessage(messageId: string, updates: Partial<UnifiedMessage>): Promise<OperationResult<UnifiedMessage>> {
    return this.getActiveProvider().updateMessage(messageId, updates);
  }
  
  async deleteMessage(messageId: string): Promise<OperationResult<void>> {
    return this.getActiveProvider().deleteMessage(messageId);
  }
  
  // Presence operations (delegated to active provider)
  async updatePresence(presence: Partial<UserPresence>): Promise<OperationResult<void>> {
    return this.getActiveProvider().updatePresence(presence);
  }
  
  async getPresence(roomId: string): Promise<OperationResult<UserPresence[]>> {
    return this.getActiveProvider().getPresence(roomId);
  }
  
  // Typing operations (delegated to active provider)
  async startTyping(roomId: string): Promise<OperationResult<void>> {
    return this.getActiveProvider().startTyping(roomId);
  }
  
  async stopTyping(roomId: string): Promise<OperationResult<void>> {
    return this.getActiveProvider().stopTyping(roomId);
  }
  
  // Subscription management (with cleanup tracking)
  subscribeToRoom(roomId: string, callback: (event: ChatEvent) => void): UnsubscribeFunction {
    const unsubscribe = this.getActiveProvider().subscribeToRoom(roomId, callback);
    
    // Track subscription for cleanup
    if (!this.subscriptions.has(roomId)) {
      this.subscriptions.set(roomId, []);
    }
    this.subscriptions.get(roomId)!.push(unsubscribe);
    
    return () => {
      unsubscribe();
      const subs = this.subscriptions.get(roomId);
      if (subs) {
        const index = subs.indexOf(unsubscribe);
        if (index > -1) {
          subs.splice(index, 1);
        }
        if (subs.length === 0) {
          this.subscriptions.delete(roomId);
        }
      }
    };
  }
  
  subscribeToPresence(roomId: string, callback: (users: UserPresence[]) => void): UnsubscribeFunction {
    return this.getActiveProvider().subscribeToPresence(roomId, callback);
  }
  
  subscribeToTyping(roomId: string, callback: (typingUsers: TypingState[]) => void): UnsubscribeFunction {
    return this.getActiveProvider().subscribeToTyping(roomId, callback);
  }
  
  subscribeToConnection(callback: (state: ConnectionState) => void): UnsubscribeFunction {
    return this.getActiveProvider().subscribeToConnection(callback);
  }
  
  // Manager events
  subscribeToManagerEvents(callback: ManagerEventCallback): UnsubscribeFunction {
    this.managerEventCallbacks.push(callback);
    
    return () => {
      const index = this.managerEventCallbacks.indexOf(callback);
      if (index > -1) {
        this.managerEventCallbacks.splice(index, 1);
      }
    };
  }
  
  private emitManagerEvent(event: ManagerEvent): void {
    this.managerEventCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in manager event callback:', error);
      }
    });
  }
  
  // Utility operations
  async clearRoomData(roomId: string): Promise<OperationResult<void>> {
    return this.getActiveProvider().clearRoomData(roomId);
  }
  
  async exportData(): Promise<OperationResult<any>> {
    return this.getActiveProvider().exportData();
  }
  
  async importData(data: any): Promise<OperationResult<void>> {
    return this.getActiveProvider().importData(data);
  }
  
  async healthCheck(): Promise<OperationResult<{ status: string; details?: any }>> {
    const primaryHealth = await this.getActiveProvider().healthCheck();
    
    return {
      success: true,
      data: {
        status: primaryHealth.data?.status || 'unknown',
        details: {
          mode: this.currentMode,
          provider: this.getActiveProvider().name,
          reconnectAttempts: this.reconnectAttempts,
          primary: primaryHealth.data,
          // TODO: Add secondary provider health when available
        }
      },
      timestamp: Date.now(),
    };
  }
  
  // Getters
  getConnectionState(): ConnectionState {
    return this.getActiveProvider().getConnectionState();
  }
  
  isConnected(): boolean {
    return this.getActiveProvider().isConnected();
  }
  
  getCurrentMode(): 'local' | 'collaborative' | 'hybrid' {
    return this.currentMode;
  }
  
  getConfig(): HybridChatManagerConfig {
    return { ...this.config };
  }
  
  // Future methods for provider switching
  async switchToCollaborativeMode(): Promise<OperationResult<void>> {
    // TODO: Implement when Yjs provider is ready
    return {
      success: false,
      error: 'Collaborative mode not implemented yet',
      timestamp: Date.now(),
    };
  }
  
  async switchToLocalMode(): Promise<OperationResult<void>> {
    if (this.currentMode === 'local') {
      return { success: true, timestamp: Date.now() };
    }
    
    this.currentMode = 'local';
    this.emitManagerEvent({
      type: 'provider_switched',
      provider: 'local',
      timestamp: Date.now()
    });
    
    return { success: true, timestamp: Date.now() };
  }
  
  // Sync operations (for future hybrid mode)
  async syncToCollaborative(): Promise<OperationResult<void>> {
    // TODO: Implement data sync between providers
    return {
      success: false,
      error: 'Sync not implemented yet',
      timestamp: Date.now(),
    };
  }
  
  // Error handling
  private handleError(error: any, operation: string): OperationResult {
    console.error(`HybridChatManager error in ${operation}:`, error);
    
    if (error instanceof ChatDataError) {
      return {
        success: false,
        error: error.message,
        timestamp: Date.now(),
      };
    }
    
    return {
      success: false,
      error: error?.message || `Unknown error in ${operation}`,
      timestamp: Date.now(),
    };
  }
} 