export interface ChatMessage {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  timestamp: number;
  authorType?: "user" | "assistant";
  [key: string]: any;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: "public" | "private" | "llm";
  description: string | null;
  members: string[];
  createdBy: string;
  createdAt: number;
  llmQueryName: string | null;
}

export interface PendingRoomInvite {
  id: string;
  roomId: string;
  roomName: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  timestamp: number;
}

export interface TypingUser {
  userId: string;
  userName: string;
  roomId?: string;
}

export interface OnlineUser {
  userId: string;
  userName: string;
  currentRoomId: string | null;
}

export interface AiThinkingState {
  roomId: string;
  isThinking: boolean;
  timestamp: number;
}

export const LLM_BOT_AUTHOR_ID = "__llm_bot__";

export function uid(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}
