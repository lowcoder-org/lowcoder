// YjsPluvProvider - Real-time collaborative provider using Yjs + WebSocket
// Implements ChatDataProvider interface for seamless integration

import { ChatDataProvider, BaseChatDataProvider } from './ChatDataProvider';
import { 
  UnifiedMessage, 
  UnifiedRoom, 
  UserPresence, 
  TypingState,
  ConnectionConfig, 
  ConnectionState, 
  ChatEvent, 
  OperationResult,
  CreateRoomRequest,
  JoinRoomRequest,
  RoomMembershipUpdate,
  RoomListFilter
} from '../types/chatDataTypes';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export class YjsPluvProvider extends BaseChatDataProvider implements ChatDataProvider {
  public readonly name = 'YjsPluvProvider';
  public readonly version = '1.0.0';
  
  private ydoc: Y.Doc | null = null;
  private messagesMap: Y.Map<any> | null = null;
  private roomsMap: Y.Map<any> | null = null;
  private presenceMap: Y.Map<any> | null = null;
  private typingMap: Y.Map<any> | null = null;
  private wsProvider: WebsocketProvider | null = null;
  private docId: string | null = null;
  
  // Global document sharing for same browser session
  private static globalDocs = new Map<string, Y.Doc>();
  private static globalWsProviders = new Map<string, WebsocketProvider>();
  private static docRefCounts = new Map<string, number>();
  
  private messagesObserver: ((event: Y.YMapEvent<any>) => void) | null = null;
  private roomsObserver: ((event: Y.YMapEvent<any>) => void) | null = null;
  private typingObserver: ((event: Y.YMapEvent<any>) => void) | null = null;
  
  constructor() {
    super();
  }

  async connect(config: ConnectionConfig): Promise<OperationResult<void>> {
    try {
      this.config = config;
      if (!config.realtime?.roomId) {
        return this.createErrorResult('roomId is required for Yjs connection');
      }
      const docId = config.realtime.roomId;
      this.docId = docId;
      let ydoc = YjsPluvProvider.globalDocs.get(docId);
      let wsProvider = YjsPluvProvider.globalWsProviders.get(docId);
      if (!ydoc) {
        ydoc = new Y.Doc();
        YjsPluvProvider.globalDocs.set(docId, ydoc);
        YjsPluvProvider.docRefCounts.set(docId, 1);
        const wsUrl = config.realtime.serverUrl || 'ws://localhost:3001';
        wsProvider = new WebsocketProvider(wsUrl, docId, ydoc, {
          connect: true,
          params: { room: docId }
        });
        YjsPluvProvider.globalWsProviders.set(docId, wsProvider);
      } else {
        const currentCount = YjsPluvProvider.docRefCounts.get(docId) || 0;
        YjsPluvProvider.docRefCounts.set(docId, currentCount + 1);
      }
      this.ydoc = ydoc;
      this.wsProvider = wsProvider || null;
      this.messagesMap = this.ydoc.getMap('messages');
      this.roomsMap = this.ydoc.getMap('rooms'); 
      this.presenceMap = this.ydoc.getMap('presence');
      this.typingMap = this.ydoc.getMap('typing');
      this.messagesObserver = this.handleMessagesChange.bind(this);
      this.roomsObserver = this.handleRoomsChange.bind(this);
      this.typingObserver = this.handleTypingChange.bind(this);
      this.messagesMap.observe(this.messagesObserver);
      this.roomsMap.observe(this.roomsObserver);
      this.typingMap.observe(this.typingObserver);
      if (this.wsProvider) {
        this.wsProvider.off('status', this.handleWSStatus);
        this.wsProvider.off('sync', this.handleWSSync);
        this.wsProvider.on('status', this.handleWSStatus.bind(this));
        this.wsProvider.on('sync', this.handleWSSync.bind(this));
        const currentStatus = this.wsProvider.wsconnected ? 'connected' : 
                            this.wsProvider.wsconnecting ? 'connecting' : 'disconnected';
        this.setConnectionState(currentStatus as ConnectionState);
        if (this.wsProvider.wsconnected) {
          this.setConnectionState('connected');
        } else if (this.wsProvider.wsconnecting) {
          this.setConnectionState('connecting');
        } else {
          this.setConnectionState('connecting');
        }
      }
      if (this.connectionState !== 'connected') {
        this.setConnectionState('connected');
      }
      return this.createSuccessResult(undefined);
    } catch (error) {
      this.setConnectionState('failed');
      return this.handleError(error, 'connect');
    }
  }

  private handleWSStatus(event: any) {
    if (event.status === 'connected') {
      this.setConnectionState('connected');
    } else if (event.status === 'connecting') {
      this.setConnectionState('connecting');
    } else if (event.status === 'disconnected') {
      this.setConnectionState('connected'); // Keep local operations working
    }
  }

  private handleWSSync(isSynced: boolean) {
    // Optionally keep for debugging sync status
  }

  async disconnect(): Promise<OperationResult<void>> {
    try {
      if (this.ydoc && this.docId) {
        if (this.messagesMap && this.messagesObserver) {
          this.messagesMap.unobserve(this.messagesObserver);
        }
        if (this.roomsMap && this.roomsObserver) {
          this.roomsMap.unobserve(this.roomsObserver);
        }
        if (this.typingMap && this.typingObserver) {
          this.typingMap.unobserve(this.typingObserver);
        }
        const currentCount = YjsPluvProvider.docRefCounts.get(this.docId) || 1;
        if (currentCount <= 1) {
          const wsProvider = YjsPluvProvider.globalWsProviders.get(this.docId);
          if (wsProvider) {
            wsProvider.destroy();
            YjsPluvProvider.globalWsProviders.delete(this.docId);
          }
          YjsPluvProvider.globalDocs.delete(this.docId);
          YjsPluvProvider.docRefCounts.delete(this.docId);
        } else {
          YjsPluvProvider.docRefCounts.set(this.docId, currentCount - 1);
        }
      }
      this.ydoc = null;
      this.messagesMap = null;
      this.roomsMap = null;
      this.presenceMap = null;
      this.typingMap = null;
      this.wsProvider = null;
      this.docId = null;
      this.messagesObserver = null;
      this.roomsObserver = null;
      this.typingObserver = null;
      this.setConnectionState('disconnected');
      return this.createSuccessResult(undefined);
    } catch (error) {
      return this.handleError(error, 'disconnect');
    }
  }

  async healthCheck(): Promise<OperationResult<{ status: string; details?: any }>> {
    try {
      const isHealthy = this.ydoc !== null && this.connectionState === 'connected';
      const status = {
        status: isHealthy ? 'healthy' : 'disconnected',
        details: {
          connectionState: this.connectionState,
          yjsDocConnected: this.ydoc !== null,
          mapsInitialized: this.messagesMap !== null && this.roomsMap !== null,
          wsConnected: this.wsProvider?.wsconnected || false,
          wsConnecting: this.wsProvider?.wsconnecting || false,
          docId: this.docId,
          globalDocsCount: YjsPluvProvider.globalDocs.size,
          globalWsProvidersCount: YjsPluvProvider.globalWsProviders.size
        }
      };
      return this.createSuccessResult(status);
    } catch (error) {
      return this.handleError(error, 'healthCheck');
    }
  }

  // Room operations
  async createRoom(room: Omit<UnifiedRoom, 'id' | 'createdAt' | 'updatedAt'>): Promise<OperationResult<UnifiedRoom>> {
    try {
      await this.ensureConnected();
      // Use room name as deterministic ID for shared rooms
      const roomId = `room_${room.name.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      const newRoom: UnifiedRoom = {
        id: roomId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...room,
      };
      this.roomsMap!.set(newRoom.id, {
        id: newRoom.id,
        name: newRoom.name,
        type: newRoom.type,
        participants: newRoom.participants,
        admins: newRoom.admins,
        isActive: newRoom.isActive,
        createdAt: newRoom.createdAt,
        updatedAt: newRoom.updatedAt,
        lastActivity: newRoom.lastActivity,
      });
      return this.createSuccessResult(newRoom);
    } catch (error) {
      return this.handleError(error, 'createRoom');
    }
  }

  async getRooms(userId?: string): Promise<OperationResult<UnifiedRoom[]>> {
    try {
      await this.ensureConnected();
      const rooms: UnifiedRoom[] = [];
      for (const [roomId, roomData] of this.roomsMap!.entries()) {
        if (!userId || roomData.participants.includes(userId) || roomData.admins.includes(userId)) {
          rooms.push({
            id: roomData.id,
            name: roomData.name,
            type: roomData.type,
            participants: roomData.participants || [],
            admins: roomData.admins || [],
            creator: roomData.creator || 'unknown',
            isActive: roomData.isActive ?? true,
            createdAt: roomData.createdAt,
            updatedAt: roomData.updatedAt,
            lastActivity: roomData.lastActivity || Date.now(),
          });
        }
      }
      return this.createSuccessResult(rooms);
    } catch (error) {
      return this.handleError(error, 'getRooms');
    }
  }

  async getRoom(roomId: string): Promise<OperationResult<UnifiedRoom>> {
    try {
      await this.ensureConnected();
      const roomData = this.roomsMap!.get(roomId);
      if (!roomData) {
        return this.createErrorResult(`Room with id ${roomId} not found`);
      }
      const room: UnifiedRoom = {
        id: roomData.id,
        name: roomData.name,
        type: roomData.type,
        participants: roomData.participants || [],
        admins: roomData.admins || [],
        creator: roomData.creator || 'unknown',
        isActive: roomData.isActive ?? true,
        createdAt: roomData.createdAt,
        updatedAt: roomData.updatedAt,
        lastActivity: roomData.lastActivity || Date.now(),
      };
      return this.createSuccessResult(room);
    } catch (error) {
      return this.handleError(error, 'getRoom');
    }
  }

  async getRoomByName(name: string): Promise<OperationResult<UnifiedRoom>> {
    try {
      await this.ensureConnected();
      for (const [roomId, roomData] of this.roomsMap!.entries()) {
        if (roomData.name === name) {
          const room: UnifiedRoom = {
            id: roomData.id,
            name: roomData.name,
            type: roomData.type,
            participants: roomData.participants || [],
            admins: roomData.admins || [],
            creator: roomData.creator || 'unknown',
            isActive: roomData.isActive ?? true,
            createdAt: roomData.createdAt,
            updatedAt: roomData.updatedAt,
            lastActivity: roomData.lastActivity || Date.now(),
          };
          return this.createSuccessResult(room);
        }
      }
      return this.createErrorResult(`Room with name ${name} not found`);
    } catch (error) {
      return this.handleError(error, 'getRoomByName');
    }
  }

  async updateRoom(roomId: string, updates: Partial<UnifiedRoom>): Promise<OperationResult<UnifiedRoom>> {
    try {
      await this.ensureConnected();
      const roomData = this.roomsMap!.get(roomId);
      if (!roomData) {
        return this.createErrorResult(`Room with id ${roomId} not found`);
      }
      const updatedRoom = { ...roomData, ...updates, updatedAt: Date.now() };
      this.roomsMap!.set(roomId, updatedRoom);
      return this.createSuccessResult(updatedRoom as UnifiedRoom);
    } catch (error) {
      return this.handleError(error, 'updateRoom');
    }
  }

  async deleteRoom(roomId: string): Promise<OperationResult<void>> {
    try {
      await this.ensureConnected();
      this.roomsMap!.delete(roomId);
      return this.createSuccessResult(undefined);
    } catch (error) {
      return this.handleError(error, 'deleteRoom');
    }
  }

  // Enhanced room management operations
  async createRoomFromRequest(request: CreateRoomRequest, creatorId: string): Promise<OperationResult<UnifiedRoom>> {
    try {
      await this.ensureConnected();
      const roomId = this.generateId();
      const now = Date.now();
      
      const newRoom: UnifiedRoom = {
        id: roomId,
        name: request.name,
        type: request.type,
        participants: [creatorId],
        admins: [creatorId],
        creator: creatorId,
        description: request.description,
        maxParticipants: request.maxParticipants,
        isActive: true,
        lastActivity: now,
        createdAt: now,
        updatedAt: now,
      };

      this.roomsMap!.set(roomId, newRoom);
      console.log('[YjsPluvProvider] 🏠 Created room from request:', newRoom);
      return this.createSuccessResult(newRoom);
    } catch (error) {
      return this.handleError(error, 'createRoomFromRequest');
    }
  }

  async getAvailableRooms(userId: string, filter?: RoomListFilter): Promise<OperationResult<UnifiedRoom[]>> {
    try {
      await this.ensureConnected();
      const allRooms = Array.from(this.roomsMap!.values());
      
      let filteredRooms = allRooms.filter(room => {
        if (!room.isActive) return false;
        if (filter?.type && room.type !== filter.type) return false;
        if (filter?.userIsMember && !room.participants.includes(userId)) return false;
        if (filter?.userCanJoin) {
          const canJoin = room.type === 'public' || room.participants.includes(userId);
          if (!canJoin) return false;
        }
        return true;
      });

      return this.createSuccessResult(filteredRooms);
    } catch (error) {
      return this.handleError(error, 'getAvailableRooms');
    }
  }

  async joinRoom(request: JoinRoomRequest): Promise<OperationResult<UnifiedRoom>> {
    try {
      await this.ensureConnected();
      const room = this.roomsMap!.get(request.roomId);
      
      if (!room) {
        return this.createErrorResult(`Room ${request.roomId} not found`, 'ROOM_NOT_FOUND');
      }

      // Check if user can join
      const canJoinResult = await this.canUserJoinRoom(request.roomId, request.userId);
      if (!canJoinResult.success || !canJoinResult.data) {
        return this.createErrorResult('User cannot join this room', 'ACCESS_DENIED');
      }

      // Add user to participants if not already there
      if (!room.participants.includes(request.userId)) {
        room.participants = [...room.participants, request.userId];
        room.updatedAt = Date.now();
        room.lastActivity = Date.now();
        this.roomsMap!.set(request.roomId, room);
        
        console.log(`[YjsPluvProvider] 🚪 User ${request.userName} joined room ${room.name}`);
      }

      return this.createSuccessResult(room);
    } catch (error) {
      return this.handleError(error, 'joinRoom');
    }
  }

  async leaveRoom(roomId: string, userId: string): Promise<OperationResult<void>> {
    try {
      await this.ensureConnected();
      const room = this.roomsMap!.get(roomId);
      
      if (!room) {
        return this.createErrorResult(`Room ${roomId} not found`, 'ROOM_NOT_FOUND');
      }

      // Remove user from participants and admins
      room.participants = room.participants.filter((id: string) => id !== userId);
      room.admins = room.admins.filter((id: string) => id !== userId);
      room.updatedAt = Date.now();
      room.lastActivity = Date.now();
      
      this.roomsMap!.set(roomId, room);
      console.log(`[YjsPluvProvider] 🚪 User ${userId} left room ${room.name}`);
      
      return this.createSuccessResult(undefined);
    } catch (error) {
      return this.handleError(error, 'leaveRoom');
    }
  }

  async updateRoomMembership(update: RoomMembershipUpdate): Promise<OperationResult<UnifiedRoom>> {
    try {
      await this.ensureConnected();
      const room = this.roomsMap!.get(update.roomId);
      
      if (!room) {
        return this.createErrorResult(`Room ${update.roomId} not found`, 'ROOM_NOT_FOUND');
      }

      // Check if actor has permission (must be admin or creator)
      if (!room.admins.includes(update.actorId) && room.creator !== update.actorId) {
        return this.createErrorResult('Insufficient permissions', 'ACCESS_DENIED');
      }

      switch (update.action) {
        case 'join':
          if (!room.participants.includes(update.userId)) {
            room.participants = [...room.participants, update.userId];
          }
          break;
        case 'leave':
        case 'kick':
          room.participants = room.participants.filter((id: string) => id !== update.userId);
          room.admins = room.admins.filter((id: string) => id !== update.userId);
          break;
        case 'promote':
          if (room.participants.includes(update.userId) && !room.admins.includes(update.userId)) {
            room.admins = [...room.admins, update.userId];
          }
          break;
        case 'demote':
          room.admins = room.admins.filter((id: string) => id !== update.userId);
          break;
      }

      room.updatedAt = Date.now();
      room.lastActivity = Date.now();
      this.roomsMap!.set(update.roomId, room);
      
      console.log(`[YjsPluvProvider] 👥 Membership updated - ${update.action} for user ${update.userId} in room ${room.name}`);
      return this.createSuccessResult(room);
    } catch (error) {
      return this.handleError(error, 'updateRoomMembership');
    }
  }

  async canUserJoinRoom(roomId: string, userId: string): Promise<OperationResult<boolean>> {
    try {
      await this.ensureConnected();
      const room = this.roomsMap!.get(roomId);
      
      if (!room || !room.isActive) {
        return this.createSuccessResult(false);
      }

      // Check if already a member
      if (room.participants.includes(userId)) {
        return this.createSuccessResult(true);
      }

      // Check room type permissions
      if (room.type === 'public') {
        // Check max participants limit
        if (room.maxParticipants && room.participants.length >= room.maxParticipants) {
          return this.createSuccessResult(false);
        }
        return this.createSuccessResult(true);
      }

      if (room.type === 'private') {
        // Private rooms require invitation (already handled by admin actions)
        return this.createSuccessResult(false);
      }

      return this.createSuccessResult(false);
    } catch (error) {
      return this.handleError(error, 'canUserJoinRoom');
    }
  }

  // Message operations
  async sendMessage(message: Omit<UnifiedMessage, 'id' | 'timestamp' | 'status'>): Promise<OperationResult<UnifiedMessage>> {
    try {
      await this.ensureConnected();
      const newMessage: UnifiedMessage = {
        id: this.generateId(),
        timestamp: Date.now(),
        status: 'synced',
        ...message,
      };
      const messageData = {
        id: newMessage.id,
        text: newMessage.text,
        authorId: newMessage.authorId,
        authorName: newMessage.authorName,
        roomId: newMessage.roomId,
        timestamp: newMessage.timestamp,
        status: newMessage.status,
        messageType: newMessage.messageType || 'text',
        metadata: newMessage.metadata || {},
        role: newMessage.role || 'user',
      };
      this.messagesMap!.set(newMessage.id, messageData);
      return this.createSuccessResult(newMessage);
    } catch (error) {
      return this.handleError(error, 'sendMessage');
    }
  }

  async getMessages(roomId: string, limit?: number, before?: number): Promise<OperationResult<UnifiedMessage[]>> {
    try {
      await this.ensureConnected();
      const messages: UnifiedMessage[] = [];
      for (const [messageId, messageData] of this.messagesMap!.entries()) {
        if (messageData.roomId === roomId) {
          if (before && messageData.timestamp >= before) {
            continue;
          }
          const message: UnifiedMessage = {
            id: messageData.id,
            text: messageData.text,
            authorId: messageData.authorId,
            authorName: messageData.authorName,
            roomId: messageData.roomId,
            timestamp: messageData.timestamp,
            status: messageData.status || 'synced',
            messageType: messageData.messageType || 'text',
            metadata: messageData.metadata || {},
            role: messageData.role || 'user',
          };
          messages.push(message);
        }
      }
      messages.sort((a, b) => a.timestamp - b.timestamp);
      const limitedMessages = limit ? messages.slice(-limit) : messages;
      return this.createSuccessResult(limitedMessages);
    } catch (error) {
      return this.handleError(error, 'getMessages');
    }
  }

  async getMessage(messageId: string): Promise<OperationResult<UnifiedMessage>> {
    try {
      await this.ensureConnected();
      const messageData = this.messagesMap!.get(messageId);
      if (!messageData) {
        return this.createErrorResult(`Message with id ${messageId} not found`);
      }
      const message: UnifiedMessage = {
        id: messageData.id,
        text: messageData.text,
        authorId: messageData.authorId,
        authorName: messageData.authorName,
        roomId: messageData.roomId,
        timestamp: messageData.timestamp,
        status: messageData.status || 'synced',
        messageType: messageData.messageType || 'text',
        metadata: messageData.metadata || {},
        role: messageData.role || 'user',
      };
      return this.createSuccessResult(message);
    } catch (error) {
      return this.handleError(error, 'getMessage');
    }
  }

  async updateMessage(messageId: string, updates: Partial<UnifiedMessage>): Promise<OperationResult<UnifiedMessage>> {
    try {
      await this.ensureConnected();
      const messageData = this.messagesMap!.get(messageId);
      if (!messageData) {
        return this.createErrorResult(`Message with id ${messageId} not found`);
      }
      const updatedMessage = { ...messageData, ...updates };
      this.messagesMap!.set(messageId, updatedMessage);
      return this.createSuccessResult(updatedMessage as UnifiedMessage);
    } catch (error) {
      return this.handleError(error, 'updateMessage');
    }
  }

  async deleteMessage(messageId: string): Promise<OperationResult<void>> {
    try {
      await this.ensureConnected();
      this.messagesMap!.delete(messageId);
      return this.createSuccessResult(undefined);
    } catch (error) {
      return this.handleError(error, 'deleteMessage');
    }
  }

  // Presence operations
  async updatePresence(presence: Partial<UserPresence>): Promise<OperationResult<void>> {
    try {
      await this.ensureConnected();
      if (!presence.userId) {
        return this.createErrorResult('userId is required for presence update');
      }
      const currentPresence = this.presenceMap!.get(presence.userId) || {};
      const updatedPresence = { ...currentPresence, ...presence };
      this.presenceMap!.set(presence.userId, updatedPresence);
      return this.createSuccessResult(undefined);
    } catch (error) {
      return this.handleError(error, 'updatePresence');
    }
  }

  async getPresence(roomId: string): Promise<OperationResult<UserPresence[]>> {
    try {
      await this.ensureConnected();
      const presenceList: UserPresence[] = [];
      for (const [userId, presence] of this.presenceMap!.entries()) {
        if (presence.currentRoom === roomId) {
          presenceList.push(presence);
        }
      }
      return this.createSuccessResult(presenceList);
    } catch (error) {
      return this.handleError(error, 'getPresence');
    }
  }

  // Typing operations
  async startTyping(roomId: string): Promise<OperationResult<void>> {
    try {
      await this.ensureConnected();
      
      if (!this.config?.userId || !this.config?.userName) {
        return this.handleError(new Error('User ID and name required for typing indicators'), 'startTyping');
      }

      const typingKey = `${roomId}_${this.config.userId}`;
      const typingData: TypingState = {
        userId: this.config.userId,
        userName: this.config.userName,
        roomId: roomId,
        startTime: Date.now()
      };

            console.log('[YjsPluvProvider] 🖊️ STARTING TYPING:', typingData);
      this.typingMap!.set(typingKey, { ...typingData, isTyping: true });

      return this.createSuccessResult(undefined);
    } catch (error) {
      return this.handleError(error, 'startTyping');
    }
  }

  async stopTyping(roomId: string): Promise<OperationResult<void>> {
    try {
      await this.ensureConnected();
      
      if (!this.config?.userId) {
        return this.handleError(new Error('User ID required for typing indicators'), 'stopTyping');
      }

      const typingKey = `${roomId}_${this.config.userId}`;
      console.log('[YjsPluvProvider] 🖊️ STOPPING TYPING:', this.config.userId);
      this.typingMap!.delete(typingKey);
      
      return this.createSuccessResult(undefined);
    } catch (error) {
      return this.handleError(error, 'stopTyping');
    }
  }

  // Utility operations
  async clearRoomData(roomId: string): Promise<OperationResult<void>> {
    try {
      await this.ensureConnected();
      const messagesToDelete = [];
      for (const [messageId, messageData] of this.messagesMap!.entries()) {
        if (messageData.roomId === roomId) {
          messagesToDelete.push(messageId);
        }
      }
      messagesToDelete.forEach(messageId => {
        this.messagesMap!.delete(messageId);
      });
      return this.createSuccessResult(undefined);
    } catch (error) {
      return this.handleError(error, 'clearRoomData');
    }
  }

  async exportData(): Promise<OperationResult<any>> {
    try {
      await this.ensureConnected();
      const exportData: {
        version: string;
        provider: string;
        timestamp: number;
        rooms: { [key: string]: any };
        messages: { [key: string]: any };
        presence: { [key: string]: any };
      } = {
        version: this.version,
        provider: this.name,
        timestamp: Date.now(),
        rooms: {},
        messages: {},
        presence: {}
      };
      for (const [roomId, roomData] of this.roomsMap!.entries()) {
        exportData.rooms[roomId] = roomData;
      }
      for (const [messageId, messageData] of this.messagesMap!.entries()) {
        exportData.messages[messageId] = messageData;
      }
      for (const [userId, presenceData] of this.presenceMap!.entries()) {
        exportData.presence[userId] = presenceData;
      }
      return this.createSuccessResult(exportData);
    } catch (error) {
      return this.handleError(error, 'exportData');
    }
  }

  async importData(data: any): Promise<OperationResult<void>> {
    try {
      await this.ensureConnected();
      if (!data || data.provider !== this.name) {
        return this.createErrorResult('Invalid import data format');
      }
      if (data.rooms) {
        Object.entries(data.rooms).forEach(([roomId, roomData]: [string, any]) => {
          this.roomsMap!.set(roomId, roomData);
        });
      }
      if (data.messages) {
        Object.entries(data.messages).forEach(([messageId, messageData]: [string, any]) => {
          this.messagesMap!.set(messageId, messageData);
        });
      }
      if (data.presence) {
        Object.entries(data.presence).forEach(([userId, presenceData]: [string, any]) => {
          this.presenceMap!.set(userId, presenceData);
        });
      }
      return this.createSuccessResult(undefined);
    } catch (error) {
      return this.handleError(error, 'importData');
    }
  }

  // Event handlers for Yjs changes
  private handleMessagesChange(event: Y.YMapEvent<any>) {
    event.changes.keys.forEach((change, key) => {
      if (change.action === 'add') {
        const messageData = this.messagesMap!.get(key);
        if (messageData) {
          this.notifyRoomSubscribers(messageData.roomId, {
            type: 'message_added',
            roomId: messageData.roomId,
            userId: messageData.authorId,
            data: {
              id: messageData.id,
              text: messageData.text,
              authorId: messageData.authorId,
              authorName: messageData.authorName,
              roomId: messageData.roomId,
              timestamp: messageData.timestamp,
              status: messageData.status || 'synced',
              messageType: messageData.messageType || 'text',
              metadata: messageData.metadata || {},
              role: messageData.role || 'user',
            },
            timestamp: Date.now(),
          });
        }
      } else if (change.action === 'update') {
        const messageData = this.messagesMap!.get(key);
        if (messageData) {
          this.notifyRoomSubscribers(messageData.roomId, {
            type: 'message_updated',
            roomId: messageData.roomId,
            userId: messageData.authorId,
            data: {
              id: messageData.id,
              text: messageData.text,
              authorId: messageData.authorId,
              authorName: messageData.authorName,
              roomId: messageData.roomId,
              timestamp: messageData.timestamp,
              status: messageData.status || 'synced',
              messageType: messageData.messageType || 'text',
              metadata: messageData.metadata || {},
              role: messageData.role || 'user',
            },
            timestamp: Date.now(),
          });
        }
      } else if (change.action === 'delete') {
        this.roomSubscriptions.forEach((callbacks, roomId) => {
          this.notifyRoomSubscribers(roomId, {
            type: 'message_deleted',
            roomId: roomId,
            data: { messageId: key },
            timestamp: Date.now(),
          });
        });
      }
    });
  }

  private handleRoomsChange(event: Y.YMapEvent<any>) {
    event.changes.keys.forEach((change, key) => {
      if (change.action === 'add') {
        const roomData = this.roomsMap!.get(key);
        if (roomData) {
          this.notifyRoomSubscribers(key, {
            type: 'room_updated',
            roomId: key,
            data: roomData,
            timestamp: Date.now(),
          });
        }
      }
    });
  }

  private handleTypingChange(event: Y.YMapEvent<any>) {
    console.log('[YjsPluvProvider] 🖊️ TYPING MAP CHANGED!');
    event.changes.keys.forEach((change, key) => {
      console.log(`[YjsPluvProvider] 🖊️ Typing change - Action: ${change.action}, Key: ${key}`);
      if (change.action === 'add' || change.action === 'update') {
        const typingData = this.typingMap!.get(key);
        if (typingData) {
          console.log('[YjsPluvProvider] 🖊️ TYPING STATE:', typingData);
          const eventType = typingData.isTyping ? 'typing_started' : 'typing_stopped';
          this.notifyRoomSubscribers(typingData.roomId, {
            type: eventType,
            roomId: typingData.roomId,
            userId: typingData.userId,
            data: typingData,
            timestamp: Date.now(),
          });
        }
      } else if (change.action === 'delete') {
        console.log(`[YjsPluvProvider] 🖊️ Typing entry deleted for key: ${key}`);
        // When typing indicator expires, notify subscribers
        const parts = key.split('_');
        if (parts.length >= 2) {
          const roomId = parts[0];
          const userId = parts[1];
          console.log(`[YjsPluvProvider] 🖊️ Notifying typing_stopped for user: ${userId} in room: ${roomId}`);
          this.notifyRoomSubscribers(roomId, {
            type: 'typing_stopped',
            roomId: roomId,
            userId: userId,
            data: { userId, roomId, isTyping: false },
            timestamp: Date.now(),
          });
        }
      }
    });
  }

  private async ensureConnected(): Promise<void> {
    if (!this.ydoc || this.connectionState !== 'connected') {
      throw new Error('YjsPluvProvider is not connected');
    }
  }
} 