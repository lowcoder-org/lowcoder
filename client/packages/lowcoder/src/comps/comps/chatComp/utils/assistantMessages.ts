import type {
  AppendMessage,
  CompleteAttachment,
  ExternalStoreThreadData,
  TextMessagePart,
  ThreadAssistantMessagePart,
  ThreadMessageLike,
  ThreadUserMessagePart,
} from "@assistant-ui/react";
import { trans } from "i18n";

import type { ChatMessage, ChatMessageContent } from "../types/chatTypes";

export const generateMessageId = () => Math.random().toString(36).substr(2, 9);

export const getTextFromThreadContent = (
  content: ThreadMessageLike["content"]
) => {
  if (typeof content === "string") return content;

  return content
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
};

export const addSystemPromptToHistory = (
  conversationHistory: ChatMessage[],
  systemPrompt: string
) => {
  const messages = conversationHistory.map((message) => {
    const baseMessage = {
      role: message.role,
      content: getTextFromThreadContent(message.content),
      timestamp: message.createdAt.getTime(),
    };

    if (!message.attachments?.length) {
      return baseMessage;
    }

    return {
      ...baseMessage,
      attachments: message.attachments.map((attachment) => ({
        id: attachment.id,
        type: attachment.type,
        name: attachment.name,
        contentType: attachment.contentType,
        ...(attachment.type === "image" &&
          attachment.content && {
            content: attachment.content.map((part) => ({
              type: part.type,
              ...(part.type === "image" && { image: part.image }),
            })),
          }),
      })),
    };
  });

  return [
    {
      role: "system" as const,
      content: systemPrompt,
      timestamp: Date.now() - 1_000_000,
    },
    ...messages,
  ];
};

export const buildChatQueryArgs = (
  message: ChatMessage,
  conversationHistory: ChatMessage[],
  systemPrompt: string
) => ({
  message: { value: message },
  prompt: { value: getTextFromThreadContent(message.content) },
  conversationHistory: {
    value: addSystemPromptToHistory(conversationHistory, systemPrompt),
  },
});

export const generateThreadTitle = (message: ChatMessage) => {
  const text = getTextFromThreadContent(message.content)
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return "";
  if (text.length <= 50) return text;

  const clipped = text.slice(0, 50).replace(/\s+\S*$/, "").trim();
  return `${clipped || text.slice(0, 50).trim()}...`;
};

export const shouldGenerateThreadTitle = (
  existingTitle: string | undefined,
  defaultTitle: string,
  existingMessageCount: number
) => {
  return (
    existingMessageCount === 0 &&
    (!existingTitle || existingTitle.trim() === defaultTitle.trim())
  );
};

export const getTextFromAppendMessage = (message: AppendMessage) => {
  const textPart = message.content.find(
    (part): part is TextMessagePart => part.type === "text"
  );
  return textPart?.text?.trim() ?? "";
};

export const createUserMessage = (
  text: string,
  attachments: CompleteAttachment[] = []
): ChatMessage => {
  const content: ThreadUserMessagePart[] = text
    ? [{ type: "text", text }]
    : [];

  return {
    id: generateMessageId(),
    role: "user",
    content,
    createdAt: new Date(),
    ...(attachments.length && { attachments }),
  };
};

export const createAssistantErrorMessage = (text: string): ChatMessage => ({
  id: generateMessageId(),
  role: "assistant",
  content: [{ type: "text", text }],
  createdAt: new Date(),
});

export const toChatMessage = (message: ThreadMessageLike): ChatMessage => {
  if (message.role === "system") {
    throw new Error("System messages are not stored in chat threads");
  }

  const content =
    typeof message.content === "string"
      ? ([{ type: "text", text: message.content }] as ChatMessageContent)
      : (message.content as ChatMessageContent);

  return {
    ...message,
    id: message.id ?? generateMessageId(),
    role: message.role,
    content,
    createdAt: message.createdAt ?? new Date(),
  };
};

export const toAssistantMessage = (message: ThreadMessageLike): ChatMessage => {
  const chatMessage = toChatMessage(message);
  if (chatMessage.role !== "assistant") {
    throw new Error("Query must return an assistant message");
  }
  return chatMessage;
};

export const toExternalThreadData = (
  thread: { threadId: string; title: string }
): ExternalStoreThreadData<"regular"> => ({
  id: thread.threadId,
  status: "regular",
  title: thread.title,
});

// Generates a thread title from the first user message, once. Returns
// whether the title was actually changed, so callers can decide whether
// to fire a threadUpdated event.
export const maybeUpdateInitialThreadTitle = async (
  userMessage: ChatMessage,
  threadList: Array<{ threadId: string; title: string }>,
  currentThreadId: string,
  currentMessageCount: number,
  updateThread: (threadId: string, updates: { title: string }) => Promise<void>
): Promise<boolean> => {
  const currentThread = threadList.find((t) => t.threadId === currentThreadId);
  const defaultTitle = trans("chat.newChatTitle");

  if (!shouldGenerateThreadTitle(currentThread?.title, defaultTitle, currentMessageCount)) {
    return false;
  }

  const title = generateThreadTitle(userMessage);
  if (!title || title === currentThread?.title) return false;

  await updateThread(currentThreadId, { title });
  return true;
};

export const getAutomatorActionsFromMessage = (message: ChatMessage) => {
  const toolPart = message.content.find(
    (part): part is Extract<ThreadAssistantMessagePart, { type: "tool-call" }> =>
      part.type === "tool-call" &&
      part.toolName === "execute_automator_actions"
  );

  if (!toolPart) return [];

  const actions = (toolPart.args as any)?.actions;
  return Array.isArray(actions) ? actions : [];
};
