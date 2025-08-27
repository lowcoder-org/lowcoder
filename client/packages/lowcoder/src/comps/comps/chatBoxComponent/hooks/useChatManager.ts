// React hook for managing chat data through HybridChatManager
// Provides a clean interface for ChatBoxComponent to use our data layer

import { useEffect, useRef, useState, useCallback } from 'react';
import { HybridChatManager, HybridChatManagerConfig, ManagerEvent } from '../managers/HybridChatManager';
import { UnifiedMessage, UnifiedRoom, ConnectionState, ChatEvent, TypingState, CreateRoomRequest, JoinRoomRequest, RoomListFilter } from '../types/chatDataTypes';

// Hook configuration
export interface UseChatManagerConfig {
  userId: string;
  userName: string;
  applicationId: string;
  roomId: string;
  mode?: 'local' | 'collaborative' | 'hybrid';
  autoConnect?: boolean;
  dbName?: string;
}

// Hook return type
export interface UseChatManagerReturn {
  // Connection state
  isConnected: boolean;
  connectionState: ConnectionState;
  isLoading: boolean;
  error: string | null;
  
  // Current room data
  currentRoom: UnifiedRoom | null;
  messages: UnifiedMessage[];
  typingUsers: TypingState[];
  
  // Operations
  sendMessage: (text: string, messageType?: 'text' | 'system') => Promise<boolean>;
  loadMoreMessages: () => Promise<void>;
  refreshMessages: () => Promise<void>;
  
  // Typing indicators
  startTyping: () => Promise<void>;
  stopTyping: () => Promise<void>;
  
  // Room management
  setCurrentRoom: (roomId: string) => Promise<void>;
  createRoom: (name: string, type?: 'private' | 'public' | 'group') => Promise<string | null>;
  
  // Enhanced room management
  createRoomFromRequest: (request: CreateRoomRequest) => Promise<UnifiedRoom | null>;
  getAvailableRooms: (filter?: RoomListFilter) => Promise<UnifiedRoom[]>;
  joinRoom: (roomId: string) => Promise<boolean>;
  leaveRoom: (roomId: string) => Promise<boolean>;
  canUserJoinRoom: (roomId: string) => Promise<boolean>;
  
  // Manager access (for advanced use)
  manager: HybridChatManager | null;
  
  // Cleanup
  disconnect: () => Promise<void>;
}

export function useChatManager(config: UseChatManagerConfig): UseChatManagerReturn {
  // State management
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRoom, setCurrentRoom] = useState<UnifiedRoom | null>(null);
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingState[]>([]);
  
  // Manager reference
  const managerRef = useRef<HybridChatManager | null>(null);
  const unsubscribeRefs = useRef<(() => void)[]>([]);
  
  // Initialize manager
  const initializeManager = useCallback(async () => {
    if (managerRef.current) {
      return; // Already initialized
    }
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`[ChatManager] 🏗️ Initializing chat manager for user ${config.userId} in application ${config.applicationId}`);
      
      const managerConfig: HybridChatManagerConfig = {
        mode: config.mode || 'collaborative', // Default to collaborative
        userId: config.userId,
        userName: config.userName,
        applicationId: config.applicationId,
        local: {
          // Use applicationId for database scoping so all components within the same
          // Lowcoder application share the same ALASql database. This enables
          // cross-component room discovery while maintaining application isolation.
          dbName: config.dbName || `ChatDB_App_${config.applicationId}`,
        },
        // 🧪 TEST: Add collaborative config to enable YjsPluvProvider for testing
        // This enables testing of the Yjs document structure (Step 1)
        collaborative: {
          serverUrl: 'ws://localhost:3001', // Placeholder - not used in Step 1
          roomId: config.roomId,
          authToken: undefined,
          autoConnect: true,
        },
        autoReconnect: true,
        reconnectDelay: 2000,
      };
      
      const manager = new HybridChatManager(managerConfig);
      managerRef.current = manager;
      
      // Set up connection state listener
      const connectionUnsub = manager.subscribeToConnection((state) => {
        setConnectionState(state);
        setIsConnected(state === 'connected');
        
        if (state === 'failed') {
          setError('Connection failed');
        } else if (state === 'connected') {
          setError(null);
        }
      });
      unsubscribeRefs.current.push(connectionUnsub);
      
      // Set up manager event listener
      const managerUnsub = manager.subscribeToManagerEvents((event: ManagerEvent) => {
        if (event.type === 'sync_failed') {
          setError(event.error || 'Sync failed');
        }
      });
      unsubscribeRefs.current.push(managerUnsub);
      
      // Initialize the manager
      const result = await manager.initialize();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to initialize chat manager');
      }
      
      // Set up initial room
      await setupCurrentRoom(manager, config.roomId);
      
    } catch (err) {
      console.error('[ChatManager] Failed to initialize chat manager:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [config.userId, config.userName, config.applicationId, config.mode, config.dbName]);
  
  // Setup current room and message subscription
  const setupCurrentRoom = useCallback(async (manager: HybridChatManager, roomIdentifier: string) => {
    try {
      console.log(`[ChatManager] 🏠 Setting up room: "${roomIdentifier}" for user: ${config.userId}`);
      console.log(`[ChatManager] 🏠 Application scope: ${config.applicationId}`);
      
      // Try to get existing room by name first
      console.log(`[ChatManager] 🔍 Searching for room by name: "${roomIdentifier}"`);
      let roomResult = await manager.getRoomByName(roomIdentifier);
      console.log(`[ChatManager] 🔍 getRoomByName result:`, roomResult);

      if (!roomResult.success) {
        // Fallback to searching by ID for backward compatibility
        console.log(`[ChatManager] 🔍 Room not found by name, trying by ID: "${roomIdentifier}"`);
        roomResult = await manager.getRoom(roomIdentifier);
        console.log(`[ChatManager] 🔍 getRoom result:`, roomResult);
      }
      
      if (!roomResult.success) {
        // Create room if it doesn't exist
        console.log(`[ChatManager] 🏗️ Creating new room: "${roomIdentifier}" as public`);
        const createResult = await manager.createRoom({
           name: roomIdentifier, // Use the identifier as the name
           type: 'public', // Make initial rooms public so they can be discovered
           participants: [config.userId],
           admins: [config.userId],
           creator: config.userId,
           isActive: true,
           lastActivity: Date.now()
        });
        
        if (!createResult.success) {
          throw new Error(createResult.error || 'Failed to create room');
        }
        
        console.log(`[ChatManager] ✅ Created room:`, createResult.data);
        roomResult = createResult;
      } else {
        // Room exists - check if user is a participant, if not, join them
        const room = roomResult.data!;
        console.log(`[ChatManager] 🏠 Found existing room:`, room);
        
        const isUserParticipant = room.participants?.some((p: any) => {
          const participantId = typeof p === 'string' ? p : p.id;
          return participantId === config.userId;
        });
        
        console.log(`[ChatManager] 👤 User ${config.userId} is ${isUserParticipant ? 'already' : 'NOT'} a participant`);
        
        if (!isUserParticipant) {
          console.log(`[ChatManager] 🚪 User not in room "${roomIdentifier}", attempting to join...`);
          try {
            await manager.joinRoom({
              roomId: room.id,
              userId: config.userId,
              userName: config.userName
            });
            // Refresh room data after joining
            roomResult = await manager.getRoom(room.id);
            console.log(`[ChatManager] ✅ Successfully joined room, updated data:`, roomResult.data);
          } catch (joinError) {
            console.warn(`[ChatManager] ⚠️ Failed to auto-join room "${roomIdentifier}":`, joinError);
            // Continue anyway - user might still be able to use the room
          }
        }
      }
      
      setCurrentRoom(roomResult.data!);
      
      // Subscribe to room events
      const roomUnsub = manager.subscribeToRoom(roomResult.data!.id, (event: ChatEvent) => {
        if (event.type === 'message_added') {
          setMessages(prev => {
            const newMessages = [...prev, event.data as UnifiedMessage];
            return newMessages;
          });
        } else if (event.type === 'message_updated') {
          setMessages(prev => prev.map(msg => 
            msg.id === event.data.id ? { ...msg, ...event.data } : msg
          ));
        } else if (event.type === 'message_deleted') {
          setMessages(prev => prev.filter(msg => msg.id !== event.data.messageId));
        } else if (event.type === 'typing_started') {
          console.log('[ChatManager] 🖊️ User started typing:', event.data);
          setTypingUsers(prev => {
            const existing = prev.find(user => user.userId === event.data.userId);
            if (existing) return prev; // Already typing
            return [...prev, event.data];
          });
        } else if (event.type === 'typing_stopped') {
          console.log('[ChatManager] 🖊️ User stopped typing:', event.data);
          setTypingUsers(prev => prev.filter(user => user.userId !== event.data.userId));
        }
      });
      unsubscribeRefs.current.push(roomUnsub);
      
      // Load initial messages
      await loadMessages(manager, roomResult.data!.id);
      
    } catch (err) {
      console.error('[ChatManager] Error in setupCurrentRoom:', err);
      setError(err instanceof Error ? err.message : 'Failed to setup room');
    }
  }, [config.userId]); // Remove loadMessages from dependencies to avoid circular dependency
  
  // Load messages for current room
  const loadMessages = useCallback(async (manager: HybridChatManager, roomId: string, before?: number) => {
    try {
      const result = await manager.getMessages(roomId, 50, before);
      
      if (result.success) {
        if (before) {
          // Prepend older messages
          setMessages(prev => [...result.data!, ...prev]);
        } else {
          // Set initial messages
          setMessages(result.data!);
        }
      } else {
        console.error('Failed to load messages:', result.error);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  }, []);
  
  // Send message
  const sendMessage = useCallback(async (text: string, messageType: 'text' | 'system' = 'text'): Promise<boolean> => {
    const manager = managerRef.current;
    
    if (!manager || !currentRoom) {
      setError('Chat not connected');
      return false;
    }
    
    if (!text.trim()) {
      return false;
    }
    
    try {
      const messageObj = {
        text: text.trim(),
        authorId: config.userId,
        authorName: config.userName,
        roomId: currentRoom.id,
        messageType,
      };
      
      const result = await manager.sendMessage(messageObj);
      
      if (!result.success) {
        setError(result.error || 'Failed to send message');
        return false;
      }
      
      // Message will be added via subscription
      return true;
    } catch (err) {
      console.error('[ChatManager] Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      return false;
    }
  }, [config.userId, config.userName, currentRoom]);
  
  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    const manager = managerRef.current;
    if (!manager || !currentRoom || messages.length === 0) {
      return;
    }
    
    const oldestMessage = messages[0];
    await loadMessages(manager, currentRoom.id, oldestMessage.timestamp);
  }, [currentRoom, messages, loadMessages]);
  
  // Refresh messages
  const refreshMessages = useCallback(async () => {
    const manager = managerRef.current;
    if (!manager || !currentRoom) {
      return;
    }
    
    await loadMessages(manager, currentRoom.id);
  }, [currentRoom, loadMessages]);
  
  // Set current room
  const setCurrentRoomById = useCallback(async (roomId: string) => {
    const manager = managerRef.current;
    if (!manager) {
      return;
    }
    
    // Clean up existing room subscription
    unsubscribeRefs.current.forEach(unsub => unsub());
    unsubscribeRefs.current = [];
    
    await setupCurrentRoom(manager, roomId);
  }, [setupCurrentRoom]);
  
  // Create new room
  const createRoom = useCallback(async (name: string, type: 'private' | 'public' | 'group' = 'private'): Promise<string | null> => {
    const manager = managerRef.current;
    if (!manager) {
      return null;
    }
    
    try {
                          const result = await manager.createRoom({
        name,
        type,
        participants: [config.userId],
        admins: [config.userId],
        creator: config.userId,
        isActive: true,
        lastActivity: Date.now(),
      });
      
      if (result.success) {
        return result.data!.id;
      } else {
        setError(result.error || 'Failed to create room');
        return null;
      }
    } catch (err) {
      console.error('Error creating room:', err);
      setError(err instanceof Error ? err.message : 'Failed to create room');
      return null;
    }
  }, [config.userId]);
  
  // Disconnect
  const disconnect = useCallback(async () => {
    const manager = managerRef.current;
    if (!manager) {
      return;
    }
    
    // Clean up subscriptions
    unsubscribeRefs.current.forEach(unsub => unsub());
    unsubscribeRefs.current = [];
    
    // Disconnect manager
    await manager.disconnect();
    managerRef.current = null;
    
    // Reset state
    setIsConnected(false);
    setConnectionState('disconnected');
    setCurrentRoom(null);
    setMessages([]);
    setTypingUsers([]);
    setError(null);
  }, []);
  
  // Typing indicator functions
  const startTyping = useCallback(async () => {
    const manager = managerRef.current;
    if (!manager || !currentRoom) return;
    
    try {
      await manager.startTyping(currentRoom.id);
    } catch (error) {
      console.error('[ChatManager] Failed to start typing:', error);
    }
  }, [currentRoom]);
  
  const stopTyping = useCallback(async () => {
    const manager = managerRef.current;
    if (!manager || !currentRoom) return;
    
    try {
      await manager.stopTyping(currentRoom.id);
    } catch (error) {
      console.error('[ChatManager] Failed to stop typing:', error);
    }
  }, [currentRoom]);
  
  // Auto-connect on mount
  useEffect(() => {
    if (config.autoConnect !== false) {
      initializeManager();
    }
    
    return () => {
      // Cleanup on unmount
      disconnect();
    };
  }, [config.autoConnect, initializeManager]);
  
  // Update room when roomId changes
  useEffect(() => {
    if (managerRef.current && isConnected && config.roomId) {
      setCurrentRoomById(config.roomId);
    }
  }, [config.roomId, isConnected, setCurrentRoomById]);

  // ------------------------------------------------------------
  // Cross-component message propagation (same browser tab)
  // ------------------------------------------------------------
  // Each ALASqlProvider instance fires a CustomEvent on `window` when it inserts
  // a new message. Listen for that here so that *other* ChatBox components that
  // use a different provider instance (e.g. because they have a different
  // userId) immediately receive the update without refreshing.
  useEffect(() => {
    const handler = (e: any) => {
      const { roomId, message } = (e as CustomEvent).detail || {};
      if (!roomId || !message) return;
      // Only handle messages for the current room that were not sent by *this* user
      if (roomId === currentRoom?.id && message.authorId !== config.userId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev; // de-dupe
          return [...prev, message];
        });
      }
    };
    window.addEventListener("alasql-chat-message-added", handler as EventListener);
    return () => window.removeEventListener("alasql-chat-message-added", handler as EventListener);
  }, [currentRoom?.id, config.userId]);
  
  // Enhanced room management functions
  const createRoomFromRequest = useCallback(async (request: CreateRoomRequest): Promise<UnifiedRoom | null> => {
    const manager = managerRef.current;
    if (!manager) return null;
    
    try {
      const result = await manager.createRoomFromRequest(request, config.userId);
      if (result.success) {
        console.log('[useChatManager] 🏠 Created room from request:', result.data);
        return result.data!;
      }
      setError(result.error || 'Failed to create room');
      return null;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create room');
      return null;
    }
  }, [config.userId]);

  const getAvailableRooms = useCallback(async (filter?: RoomListFilter): Promise<UnifiedRoom[]> => {
    const manager = managerRef.current;
    if (!manager) return [];
    
    try {
      const result = await manager.getAvailableRooms(config.userId, filter);
      if (result.success) {
        return result.data!;
      }
      setError(result.error || 'Failed to get available rooms');
      return [];
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to get available rooms');
      return [];
    }
  }, [config.userId]);

  const joinRoom = useCallback(async (roomId: string): Promise<boolean> => {
    const manager = managerRef.current;
    if (!manager) return false;
    
    try {
      const result = await manager.joinRoom({
        roomId,
        userId: config.userId,
        userName: config.userName
      });
      if (result.success) {
        console.log('[useChatManager] 🚪 Joined room:', result.data!.name);
        // Switch to the joined room
        await setCurrentRoomById(roomId);
        return true;
      }
      setError(result.error || 'Failed to join room');
      return false;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to join room');
      return false;
    }
  }, [config.userId, config.userName, setCurrentRoomById]);

  const leaveRoom = useCallback(async (roomId: string): Promise<boolean> => {
    const manager = managerRef.current;
    if (!manager) return false;
    
    try {
      const result = await manager.leaveRoom(roomId, config.userId);
      if (result.success) {
        console.log('[useChatManager] 🚪 Left room:', roomId);
        // If we left the current room, switch to a default room
        if (currentRoom?.id === roomId) {
          await setCurrentRoomById(config.roomId); // Fall back to default room
        }
        return true;
      }
      setError(result.error || 'Failed to leave room');
      return false;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to leave room');
      return false;
    }
  }, [config.userId, config.roomId, currentRoom?.id, setCurrentRoomById]);

  const canUserJoinRoom = useCallback(async (roomId: string): Promise<boolean> => {
    const manager = managerRef.current;
    if (!manager) return false;
    
    try {
      const result = await manager.canUserJoinRoom(roomId, config.userId);
      return result.success ? result.data! : false;
    } catch (error) {
      return false;
    }
  }, [config.userId]);
  
  return {
    // Connection state
    isConnected,
    connectionState,
    isLoading,
    error,
    
    // Current room data
    currentRoom,
    messages,
    typingUsers,
    
    // Operations
    sendMessage,
    loadMoreMessages,
    refreshMessages,
    startTyping,
    stopTyping,
    
    // Room management
    setCurrentRoom: setCurrentRoomById,
    createRoom,
    
    // Enhanced room management
    createRoomFromRequest,
    getAvailableRooms,
    joinRoom,
    leaveRoom,
    canUserJoinRoom,
    
    // Manager access
    manager: managerRef.current,
    
    // Cleanup
    disconnect,
  };
} 