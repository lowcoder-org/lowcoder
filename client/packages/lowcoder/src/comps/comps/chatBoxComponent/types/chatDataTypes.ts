// Core data types for unified chat system
// Compatible with existing ALASql structure while extensible for real-time collaboration

export type MessageStatus = 'sending' | 'sent' | 'failed' | 'synced';
export type MessageType = 'text' | 'file' | 'system' | 'action';
export type RoomType = 'private' | 'public' | 'group';
export type UserStatus = 'online' | 'away' | 'busy' | 'offline';

// Unified message format - backward compatible with existing MyMessage
export interface UnifiedMessage {
  // Core fields (existing ALASql compatibility)
  id: string;
  text: string;
  timestamp: number;
  
  // Author information for multi-user support
  authorId: string;
  authorName: string;
  
  // Room/thread association
  roomId: string;
  
  // Message status and type
  status: MessageStatus;
  messageType: MessageType;
  
  // Real-time collaboration metadata (optional for future use)
  yjsId?: string;           // Yjs document reference
  version?: number;         // Version for conflict resolution
  localId?: string;         // Local optimistic ID
  
  // Extensibility
  metadata?: Record<string, any>;
  
  // Legacy compatibility (for existing ChatComp)
  role?: "user" | "assistant";  // Maps to authorId types
}

// Unified room format - compatible with existing thread structure
export interface UnifiedRoom {
  // Core identification
  id: string;
  name: string;
  type: RoomType;
  
  // Participants management
  participants: string[];   // User IDs
  admins: string[];        // Admin user IDs
  creator: string;         // User ID who created the room
  
  // Room settings
  description?: string;    // Optional room description
  maxParticipants?: number; // Optional participant limit
  
  // State and metadata
  isActive: boolean;
  lastActivity: number;
  createdAt: number;
  updatedAt: number;
  
  // Real-time collaboration (optional)
  yjsDocId?: string;       // Yjs document ID for this room
  
  // Legacy compatibility
  status?: "regular" | "archived";  // For existing thread system
  title?: string;          // Alias for name
  threadId?: string;       // Alias for id
}

// User presence for real-time features
export interface UserPresence {
  userId: string;
  userName: string;
  avatar?: string;
  status: UserStatus;
  lastSeen: number;
  currentRoom?: string;
  typingIn?: string;      // Room ID where user is typing
}

// Typing indicator state
export interface TypingState {
  userId: string;
  userName: string;
  roomId: string;
  startTime: number;
}

// Room management interfaces
export interface CreateRoomRequest {
  name: string;
  type: RoomType;
  description?: string;
  maxParticipants?: number;
  isPrivate?: boolean;
}

export interface JoinRoomRequest {
  roomId: string;
  userId: string;
  userName: string;
}

export interface RoomMembershipUpdate {
  roomId: string;
  userId: string;
  action: 'join' | 'leave' | 'promote' | 'demote' | 'kick';
  actorId: string; // Who performed the action
}

export interface RoomListFilter {
  type?: RoomType;
  isActive?: boolean;
  userCanJoin?: boolean;
  userIsMember?: boolean;
}

// Connection state for real-time providers
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed';

// Chat events for real-time subscriptions
export type ChatEventType = 'message_added' | 'message_updated' | 'message_deleted' | 
                           'room_updated' | 'user_joined' | 'user_left' | 
                           'typing_started' | 'typing_stopped' | 'presence_updated';

export interface ChatEvent {
  type: ChatEventType;
  roomId: string;
  userId?: string;
  data: any;
  timestamp: number;
}

// Configuration types
export interface ConnectionConfig {
  mode: 'local' | 'collaborative' | 'hybrid';
  userId: string;
  userName: string;
  
  // Local storage config
  alasql?: {
    dbName: string;
    tableName?: string;
  };
  
  // Real-time collaboration config (for future use)
  realtime?: {
    serverUrl: string;
    roomId: string;
    authToken?: string;
  };
}

// Provider operation results
export interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

// DataTransformUtils - Handles conversion between different data formats
export class DataTransformUtils {
  // ALASql transformations (existing)
  static toALASqlMessage(message: UnifiedMessage): any {
    return {
      id: message.id,
      role: 'user', // Map authorId to role for backward compatibility
      text: message.text,
      timestamp: message.timestamp,
      threadId: message.roomId, // Map roomId to threadId for ALASql compatibility
      authorId: message.authorId,
      authorName: message.authorName,
      status: message.status || 'sent',
      metadata: JSON.stringify(message.metadata || {})
    };
  }

  static fromALASqlMessage(data: any): UnifiedMessage {
    return {
      id: data.id,
      text: data.text,
      authorId: data.authorId || data.userId || 'unknown',
      authorName: data.authorName || data.userName || 'Unknown User',
      roomId: data.threadId || data.roomId,
      timestamp: data.timestamp,
      status: data.status || 'sent',
      messageType: 'text',
      metadata: data.metadata ? JSON.parse(data.metadata) : {}
    };
  }

  static toALASqlRoom(room: UnifiedRoom): any {
    return {
      id: room.id,
      name: room.name,
      type: room.type,
      participants: JSON.stringify(room.participants),
      admins: JSON.stringify(room.admins || []),
      isActive: room.isActive,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      lastActivity: room.lastActivity
    };
  }

  static fromALASqlRoom(data: any): UnifiedRoom {
    return {
      id: data.id,
      name: data.name,
      type: data.type || 'private',
      participants: data.participants ? JSON.parse(data.participants) : [],
      admins: data.admins ? JSON.parse(data.admins) : [],
      creator: data.creator || 'unknown',
      isActive: data.isActive !== false,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      lastActivity: data.lastActivity || data.updatedAt
    };
  }

  // Yjs transformations (new)
  static toYjsMessage(message: UnifiedMessage): any {
    return {
      id: message.id,
      text: message.text,
      authorId: message.authorId,
      authorName: message.authorName,
      roomId: message.roomId,
      timestamp: message.timestamp,
      status: message.status || 'sent',
      messageType: message.messageType,
      metadata: message.metadata || {}
    };
  }

  static fromYjsMessage(data: any): UnifiedMessage {
    return {
      id: data.id,
      text: data.text,
      authorId: data.authorId,
      authorName: data.authorName,
      roomId: data.roomId,
      timestamp: data.timestamp,
      status: data.status || 'sent',
      messageType: data.messageType || 'text',
      metadata: data.metadata || {}
    };
  }

  static toYjsRoom(room: UnifiedRoom): any {
    return {
      id: room.id,
      name: room.name,
      type: room.type,
      participants: room.participants,
      admins: room.admins || [],
      isActive: room.isActive,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      lastActivity: room.lastActivity
    };
  }

  static fromYjsRoom(data: any): UnifiedRoom {
    return {
      id: data.id,
      name: data.name,
      type: data.type || 'private',
      participants: data.participants || [],
      admins: data.admins || [],
      creator: data.creator || 'unknown',
      isActive: data.isActive !== false,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      lastActivity: data.lastActivity || data.updatedAt
    };
  }

  static toYjsPresence(presence: UserPresence): any {
    return {
      userId: presence.userId,
      userName: presence.userName,
      status: presence.status || 'online',
      lastSeen: presence.lastSeen || Date.now(),
      currentRoom: presence.currentRoom,
      typingIn: presence.typingIn
    };
  }

  static fromYjsPresence(data: any): UserPresence {
    return {
      userId: data.userId,
      userName: data.userName,
      status: data.status || 'online',
      lastSeen: data.lastSeen || Date.now(),
      currentRoom: data.currentRoom,
      typingIn: data.typingIn
    };
  }

  // Pluv.io transformations (new)
  static toPluvPresence(presence: UserPresence): any {
    return {
      userId: presence.userId,
      userName: presence.userName,
      status: presence.status || 'online',
      typing: !!presence.typingIn,
      lastSeen: presence.lastSeen || Date.now()
    };
  }

  static fromPluvPresence(data: any): UserPresence {
    return {
      userId: data.userId,
      userName: data.userName,
      status: data.status || 'online',
      lastSeen: data.lastSeen || Date.now(),
      currentRoom: data.roomId
    };
  }

  // Legacy ALASql thread conversions (for backward compatibility)
  static fromLegacyThread(thread: any): UnifiedRoom {
    return {
      id: thread.threadId,
      name: thread.title,
      type: 'private',
      participants: [],
      admins: [],
      creator: 'legacy_user',
      isActive: thread.status !== 'archived',
      lastActivity: thread.updatedAt,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
    };
  }

  static toLegacyThread(room: UnifiedRoom): any {
    return {
      threadId: room.id,
      status: room.isActive ? 'regular' : 'archived',
      title: room.name,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  }

  static fromLegacyMessage(msg: any, roomId: string, authorId: string, authorName: string): UnifiedMessage {
    return {
      id: msg.id,
      text: msg.text,
      authorId,
      authorName,
      roomId,
      timestamp: msg.timestamp,
      status: 'synced',
      messageType: 'text',
      metadata: {},
      role: msg.role === 'assistant' ? 'assistant' : 'user'
    };
  }

  static toLegacyMessage(message: UnifiedMessage): any {
    return {
      id: message.id,
      role: message.role || 'user',
      text: message.text,
      timestamp: message.timestamp,
      threadId: message.roomId,
    };
  }

  // Validation helpers
  static validateMessage(data: any): boolean {
    return !!(data.id && data.text && data.authorId && data.roomId && data.timestamp);
  }

  static validateRoom(data: any): boolean {
    return !!(data.id && data.name && data.type);
  }

  static validatePresence(data: any): boolean {
    return !!(data.userId && data.userName);
  }
}

// Error types for better error handling
export class ChatDataError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ChatDataError';
  }
}

export enum ChatErrorCodes {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  OPERATION_TIMEOUT = 'OPERATION_TIMEOUT',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
  MESSAGE_NOT_FOUND = 'MESSAGE_NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
} 