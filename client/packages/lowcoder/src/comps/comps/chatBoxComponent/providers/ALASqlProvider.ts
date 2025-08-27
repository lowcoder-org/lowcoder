// ALASql provider implementation
// Wraps existing ALASql functionality to work with our unified interface

import alasql from "alasql";
import { BaseChatDataProvider } from './ChatDataProvider';
import { 
  UnifiedMessage, 
  UnifiedRoom, 
  UserPresence, 
  ConnectionConfig, 
  OperationResult,
  DataTransformUtils,
  ChatDataError,
  ChatErrorCodes,
  CreateRoomRequest,
  JoinRoomRequest,
  RoomMembershipUpdate,
  RoomListFilter
} from '../types/chatDataTypes';

interface ALASqlMessage {
  id: string;
  threadId: string;
  role: string;
  text: string;
  timestamp: number;
}

interface ALASqlThread {
  threadId: string;
  status: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export class ALASqlProvider extends BaseChatDataProvider {
  public readonly name = 'ALASqlProvider';
  public readonly version = '1.0.0';
  
  private initialized = false;
  private dbName = 'ChatDB';
  private threadsTable = 'threads';
  private messagesTable = 'messages';
  private presenceTable = 'presence';
  
  constructor() {
    super();
  }

  async connect(config: ConnectionConfig): Promise<OperationResult<void>> {
    try {
      this.setConnectionState('connecting');
      this.config = config;
      if (config.alasql?.dbName) {
        this.dbName = config.alasql.dbName;
      }
      alasql.options.autocommit = true;
      await this.initializeDatabase();
      this.initialized = true;
      this.setConnectionState('connected');
      return this.createSuccessResult();
    } catch (error) {
      this.setConnectionState('failed');
      return this.handleError(error, 'connect');
    }
  }

  async disconnect(): Promise<OperationResult<void>> {
    try {
      this.setConnectionState('disconnected');
      this.initialized = false;
      return this.createSuccessResult();
    } catch (error) {
      return this.handleError(error, 'disconnect');
    }
  }

  private async initializeDatabase(): Promise<void> {
    try {
      await alasql.promise(`CREATE LOCALSTORAGE DATABASE IF NOT EXISTS ${this.dbName}`);
      await alasql.promise(`ATTACH LOCALSTORAGE DATABASE ${this.dbName}`);
      await alasql.promise(`USE ${this.dbName}`);
      await alasql.promise(`
        CREATE TABLE IF NOT EXISTS ${this.threadsTable} (
          threadId STRING PRIMARY KEY,
          status STRING,
          title STRING,
          createdAt NUMBER,
          updatedAt NUMBER
        )
      `);
      await alasql.promise(`
        CREATE TABLE IF NOT EXISTS ${this.messagesTable} (
          id STRING PRIMARY KEY,
          threadId STRING,
          role STRING,
          text STRING,
          timestamp NUMBER
        )
      `);
      await alasql.promise(`
        CREATE TABLE IF NOT EXISTS ${this.presenceTable} (
          userId STRING PRIMARY KEY,
          userName STRING,
          status STRING,
          lastSeen NUMBER,
          currentRoom STRING
        )
      `);
    } catch (error) {
      throw new ChatDataError(
        'Failed to initialize ALASql database',
        ChatErrorCodes.STORAGE_ERROR,
        error
      );
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      throw new ChatDataError(
        'Provider not initialized. Call connect() first.',
        ChatErrorCodes.CONNECTION_FAILED
      );
    }
  }

  async createRoom(room: Omit<UnifiedRoom, 'id' | 'createdAt' | 'updatedAt'>): Promise<OperationResult<UnifiedRoom>> {
    try {
      await this.ensureInitialized();
      const now = Date.now();
      const roomId = `room_${room.name.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      const newRoom: UnifiedRoom = {
        id: roomId,
        createdAt: now,
        updatedAt: now,
        ...room,
      };
      const alaSqlThread: ALASqlThread = DataTransformUtils.toLegacyThread(newRoom);
      await alasql.promise(`
        INSERT INTO ${this.threadsTable} VALUES (?, ?, ?, ?, ?)
      `, [alaSqlThread.threadId, alaSqlThread.status, alaSqlThread.title, alaSqlThread.createdAt, alaSqlThread.updatedAt]);
      return this.createSuccessResult(newRoom);
    } catch (error) {
      return this.handleError(error, 'createRoom');
    }
  }

  async getRooms(userId?: string): Promise<OperationResult<UnifiedRoom[]>> {
    try {
      await this.ensureInitialized();
      const result = await alasql.promise(`
        SELECT * FROM ${this.threadsTable} ORDER BY updatedAt DESC
      `) as ALASqlThread[];
      const rooms = (Array.isArray(result) ? result : []).map(thread => 
        DataTransformUtils.fromLegacyThread(thread)
      );
      return this.createSuccessResult(rooms);
    } catch (error) {
      return this.handleError(error, 'getRooms');
    }
  }

  async getRoom(roomId: string): Promise<OperationResult<UnifiedRoom>> {
    try {
      await this.ensureInitialized();
      const result = await alasql.promise(`
        SELECT * FROM ${this.threadsTable} WHERE threadId = ?
      `, [roomId]) as ALASqlThread[];
      if (!result || result.length === 0) {
        throw new ChatDataError(
          `Room with id ${roomId} not found`,
          ChatErrorCodes.ROOM_NOT_FOUND
        );
      }
      const room = DataTransformUtils.fromLegacyThread(result[0]);
      return this.createSuccessResult(room);
    } catch (error) {
      return this.handleError(error, 'getRoom');
    }
  }

  async getRoomByName(name: string): Promise<OperationResult<UnifiedRoom>> {
    try {
      await this.ensureInitialized();
      let result = await alasql.promise(`
        SELECT * FROM ${this.threadsTable} WHERE title = ?
      `, [name]) as ALASqlThread[];
      if (!result || result.length === 0) {
        result = await alasql.promise(`
          SELECT * FROM ${this.threadsTable} WHERE title = ?
        `, [`Chat Room ${name}`]) as ALASqlThread[];
      }
      if (!result || result.length === 0) {
        result = await alasql.promise(`
          SELECT * FROM ${this.threadsTable} WHERE title LIKE ?
        `, [`%${name}%`]) as ALASqlThread[];
      }
      if (!result || result.length === 0) {
        throw new ChatDataError(
          `Room with name ${name} not found`,
          ChatErrorCodes.ROOM_NOT_FOUND
        );
      }
      const room = DataTransformUtils.fromLegacyThread(result[0]);
      return this.createSuccessResult(room);
    } catch (error) {
      return this.handleError(error, 'getRoomByName');
    }
  }

  async updateRoom(roomId: string, updates: Partial<UnifiedRoom>): Promise<OperationResult<UnifiedRoom>> {
    try {
      await this.ensureInitialized();
      const existingResult = await this.getRoom(roomId);
      if (!existingResult.success) {
        return existingResult;
      }
      const updatedRoom: UnifiedRoom = {
        ...existingResult.data!,
        ...updates,
        updatedAt: Date.now(),
      };
      const alaSqlThread = DataTransformUtils.toLegacyThread(updatedRoom);
      await alasql.promise(`
        UPDATE ${this.threadsTable} 
        SET status = ?, title = ?, updatedAt = ?
        WHERE threadId = ?
      `, [alaSqlThread.status, alaSqlThread.title, alaSqlThread.updatedAt, roomId]);
      return this.createSuccessResult(updatedRoom);
    } catch (error) {
      return this.handleError(error, 'updateRoom');
    }
  }

  async deleteRoom(roomId: string): Promise<OperationResult<void>> {
    try {
      await this.ensureInitialized();
      await alasql.promise(`DELETE FROM ${this.messagesTable} WHERE threadId = ?`, [roomId]);
      await alasql.promise(`DELETE FROM ${this.threadsTable} WHERE threadId = ?`, [roomId]);
      return this.createSuccessResult();
    } catch (error) {
      return this.handleError(error, 'deleteRoom');
    }
  }

  // Enhanced room management operations
  async createRoomFromRequest(request: CreateRoomRequest, creatorId: string): Promise<OperationResult<UnifiedRoom>> {
    try {
      await this.ensureInitialized();
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

      // Convert to ALASql format and save
      const legacyThread = DataTransformUtils.toLegacyThread(newRoom);
      await alasql.promise(`
        INSERT INTO ${this.threadsTable} VALUES (?, ?, ?, ?, ?)
      `, [legacyThread.threadId, legacyThread.status, legacyThread.title, legacyThread.createdAt, legacyThread.updatedAt]);

      console.log('[ALASqlProvider] 🏠 Created room from request:', newRoom);
      return this.createSuccessResult(newRoom);
    } catch (error) {
      return this.handleError(error, 'createRoomFromRequest');
    }
  }

  async getAvailableRooms(userId: string, filter?: RoomListFilter): Promise<OperationResult<UnifiedRoom[]>> {
    try {
      await this.ensureInitialized();
      // For ALASql (local storage), all rooms are "available" to the user
      // since there's no real multi-user separation
      let query = `SELECT * FROM ${this.threadsTable}`;
      const conditions: string[] = [];
      const params: any[] = [];

      if (filter?.type) {
        // Note: ALASql threads don't have type, so we'll default to private
        conditions.push('status = ?');
        params.push('regular');
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY updatedAt DESC';

      const threads = await alasql.promise(query, params) as ALASqlThread[];
      const rooms = threads.map(thread => DataTransformUtils.fromLegacyThread(thread));
      
      return this.createSuccessResult(rooms);
    } catch (error) {
      return this.handleError(error, 'getAvailableRooms');
    }
  }

  async joinRoom(request: JoinRoomRequest): Promise<OperationResult<UnifiedRoom>> {
    try {
      // For ALASql (local), joining is just getting the room
      // since there's no real multi-user management
      const roomResult = await this.getRoom(request.roomId);
      if (!roomResult.success) {
        return roomResult;
      }

      console.log(`[ALASqlProvider] 🚪 User ${request.userName} "joined" room ${roomResult.data!.name} (local only)`);
      return roomResult;
    } catch (error) {
      return this.handleError(error, 'joinRoom');
    }
  }

  async leaveRoom(roomId: string, userId: string): Promise<OperationResult<void>> {
    try {
      // For ALASql (local), leaving is a no-op since there's no real membership
      console.log(`[ALASqlProvider] 🚪 User ${userId} "left" room ${roomId} (local only)`);
      return this.createSuccessResult();
    } catch (error) {
      return this.handleError(error, 'leaveRoom');
    }
  }

  async updateRoomMembership(update: RoomMembershipUpdate): Promise<OperationResult<UnifiedRoom>> {
    try {
      // For ALASql (local), membership updates are no-ops
      // Just return the room as-is
      const roomResult = await this.getRoom(update.roomId);
      if (!roomResult.success) {
        return roomResult;
      }

      console.log(`[ALASqlProvider] 👥 Membership update "${update.action}" for user ${update.userId} (local only - no effect)`);
      return roomResult;
    } catch (error) {
      return this.handleError(error, 'updateRoomMembership');
    }
  }

  async canUserJoinRoom(roomId: string, userId: string): Promise<OperationResult<boolean>> {
    try {
      // For ALASql (local), users can always "join" any room that exists
      const roomResult = await this.getRoom(roomId);
      return this.createSuccessResult(roomResult.success);
    } catch (error) {
      return this.handleError(error, 'canUserJoinRoom');
    }
  }

  async sendMessage(message: Omit<UnifiedMessage, 'id' | 'timestamp' | 'status'>): Promise<OperationResult<UnifiedMessage>> {
    try {
      await this.ensureInitialized();
      const newMessage: UnifiedMessage = {
        id: this.generateId(),
        timestamp: Date.now(),
        status: 'synced',
        ...message,
      };
      const alaSqlMessage = DataTransformUtils.toLegacyMessage(newMessage);
      alaSqlMessage.threadId = newMessage.roomId;
      await alasql.promise(`
        INSERT INTO ${this.messagesTable} VALUES (?, ?, ?, ?, ?)
      `, [alaSqlMessage.id, alaSqlMessage.threadId, alaSqlMessage.role, alaSqlMessage.text, alaSqlMessage.timestamp]);
      this.notifyRoomSubscribers(message.roomId, {
        type: 'message_added',
        roomId: message.roomId,
        userId: message.authorId,
        data: newMessage,
        timestamp: Date.now(),
      });
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        try {
          window.dispatchEvent(
            new CustomEvent('alasql-chat-message-added', {
              detail: { roomId: message.roomId, message: newMessage },
            }),
          );
        } catch (e) {
          /* Ignore if CustomEvent is not supported */
        }
      }
      return this.createSuccessResult(newMessage);
    } catch (error) {
      return this.handleError(error, 'sendMessage');
    }
  }

  async getMessages(roomId: string, limit = 50, before?: number): Promise<OperationResult<UnifiedMessage[]>> {
    try {
      await this.ensureInitialized();
      let query = `
        SELECT * FROM ${this.messagesTable} 
        WHERE threadId = ?
      `;
      const params: any[] = [roomId];
      if (before) {
        query += ` AND timestamp < ?`;
        params.push(before);
      }
      query += ` ORDER BY timestamp DESC LIMIT ?`;
      params.push(limit);
      const result = await alasql.promise(query, params) as ALASqlMessage[];
      const messages = (Array.isArray(result) ? result : []).map(alaSqlMsg => 
        DataTransformUtils.fromLegacyMessage(
          alaSqlMsg, 
          roomId, 
          alaSqlMsg.role === 'assistant' ? 'assistant' : this.config?.userId || 'unknown',
          alaSqlMsg.role === 'assistant' ? 'Assistant' : this.config?.userName || 'User'
        )
      ).reverse();
      return this.createSuccessResult(messages);
    } catch (error) {
      return this.handleError(error, 'getMessages');
    }
  }

  async getMessage(messageId: string): Promise<OperationResult<UnifiedMessage>> {
    try {
      await this.ensureInitialized();
      const result = await alasql.promise(`
        SELECT * FROM ${this.messagesTable} WHERE id = ?
      `, [messageId]) as ALASqlMessage[];
      if (!result || result.length === 0) {
        throw new ChatDataError(
          `Message with id ${messageId} not found`,
          ChatErrorCodes.MESSAGE_NOT_FOUND
        );
      }
      const alaSqlMsg = result[0];
      const message = DataTransformUtils.fromLegacyMessage(
        alaSqlMsg,
        alaSqlMsg.threadId,
        alaSqlMsg.role === 'assistant' ? 'assistant' : this.config?.userId || 'unknown',
        alaSqlMsg.role === 'assistant' ? 'Assistant' : this.config?.userName || 'User'
      );
      return this.createSuccessResult(message);
    } catch (error) {
      return this.handleError(error, 'getMessage');
    }
  }

  async updateMessage(messageId: string, updates: Partial<UnifiedMessage>): Promise<OperationResult<UnifiedMessage>> {
    try {
      await this.ensureInitialized();
      const existingResult = await this.getMessage(messageId);
      if (!existingResult.success) {
        return existingResult;
      }
      const updatedMessage: UnifiedMessage = {
        ...existingResult.data!,
        ...updates,
      };
      const alaSqlMessage = DataTransformUtils.toLegacyMessage(updatedMessage);
      await alasql.promise(`
        UPDATE ${this.messagesTable} 
        SET text = ?, timestamp = ?
        WHERE id = ?
      `, [alaSqlMessage.text, alaSqlMessage.timestamp, messageId]);
      this.notifyRoomSubscribers(updatedMessage.roomId, {
        type: 'message_updated',
        roomId: updatedMessage.roomId,
        userId: updatedMessage.authorId,
        data: updatedMessage,
        timestamp: Date.now(),
      });
      return this.createSuccessResult(updatedMessage);
    } catch (error) {
      return this.handleError(error, 'updateMessage');
    }
  }

  async deleteMessage(messageId: string): Promise<OperationResult<void>> {
    try {
      await this.ensureInitialized();
      const messageResult = await this.getMessage(messageId);
      await alasql.promise(`DELETE FROM ${this.messagesTable} WHERE id = ?`, [messageId]);
      if (messageResult.success) {
        this.notifyRoomSubscribers(messageResult.data!.roomId, {
          type: 'message_deleted',
          roomId: messageResult.data!.roomId,
          userId: messageResult.data!.authorId,
          data: { messageId },
          timestamp: Date.now(),
        });
      }
      return this.createSuccessResult();
    } catch (error) {
      return this.handleError(error, 'deleteMessage');
    }
  }

  async updatePresence(presence: Partial<UserPresence>): Promise<OperationResult<void>> {
    try {
      await this.ensureInitialized();
      if (!presence.userId) {
        throw new ChatDataError('UserId is required for presence update', ChatErrorCodes.VALIDATION_ERROR);
      }
      const now = Date.now();
      await alasql.promise(`
        INSERT OR REPLACE INTO ${this.presenceTable} VALUES (?, ?, ?, ?, ?)
      `, [
        presence.userId,
        presence.userName || 'Unknown',
        presence.status || 'online',
        presence.lastSeen || now,
        presence.currentRoom || null
      ]);
      return this.createSuccessResult();
    } catch (error) {
      return this.handleError(error, 'updatePresence');
    }
  }

  async getPresence(roomId: string): Promise<OperationResult<UserPresence[]>> {
    try {
      await this.ensureInitialized();
      const result = await alasql.promise(`
        SELECT * FROM ${this.presenceTable} WHERE currentRoom = ?
      `, [roomId]) as any[];
      const presence = (Array.isArray(result) ? result : []).map(row => ({
        userId: row.userId,
        userName: row.userName,
        status: row.status,
        lastSeen: row.lastSeen,
        currentRoom: row.currentRoom,
      }));
      return this.createSuccessResult(presence);
    } catch (error) {
      return this.handleError(error, 'getPresence');
    }
  }

  async startTyping(roomId: string): Promise<OperationResult<void>> {
    return this.createSuccessResult();
  }

  async stopTyping(roomId: string): Promise<OperationResult<void>> {
    return this.createSuccessResult();
  }

  async clearRoomData(roomId: string): Promise<OperationResult<void>> {
    try {
      await this.ensureInitialized();
      await alasql.promise(`DELETE FROM ${this.messagesTable} WHERE threadId = ?`, [roomId]);
      return this.createSuccessResult();
    } catch (error) {
      return this.handleError(error, 'clearRoomData');
    }
  }

  async exportData(): Promise<OperationResult<any>> {
    try {
      await this.ensureInitialized();
      const threads = await alasql.promise(`SELECT * FROM ${this.threadsTable}`) as ALASqlThread[];
      const messages = await alasql.promise(`SELECT * FROM ${this.messagesTable}`) as ALASqlMessage[];
      return this.createSuccessResult({
        threads: Array.isArray(threads) ? threads : [],
        messages: Array.isArray(messages) ? messages : [],
        exportedAt: Date.now(),
        provider: this.name,
        version: this.version,
      });
    } catch (error) {
      return this.handleError(error, 'exportData');
    }
  }

  async importData(data: any): Promise<OperationResult<void>> {
    try {
      await this.ensureInitialized();
      if (!data.threads || !data.messages) {
        throw new ChatDataError('Invalid import data format', ChatErrorCodes.VALIDATION_ERROR);
      }
      await alasql.promise(`DELETE FROM ${this.messagesTable}`);
      await alasql.promise(`DELETE FROM ${this.threadsTable}`);
      for (const thread of data.threads) {
        await alasql.promise(`
          INSERT INTO ${this.threadsTable} VALUES (?, ?, ?, ?, ?)
        `, [thread.threadId, thread.status, thread.title, thread.createdAt, thread.updatedAt]);
      }
      for (const message of data.messages) {
        await alasql.promise(`
          INSERT INTO ${this.messagesTable} VALUES (?, ?, ?, ?, ?)
        `, [message.id, message.threadId, message.role, message.text, message.timestamp]);
      }
      return this.createSuccessResult();
    } catch (error) {
      return this.handleError(error, 'importData');
    }
  }

  async healthCheck(): Promise<OperationResult<{ status: string; details?: any }>> {
    try {
      if (!this.initialized) {
        return this.createSuccessResult({
          status: 'disconnected',
          details: { message: 'Provider not initialized' }
        });
      }
      await alasql.promise(`SELECT COUNT(*) as count FROM ${this.threadsTable}`);
      return this.createSuccessResult({
        status: 'healthy',
        details: {
          dbName: this.dbName,
          tablesCount: 3,
          initialized: this.initialized,
        }
      });
    } catch (error) {
      return this.createSuccessResult({
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : String(error) }
      });
    }
  }
} 