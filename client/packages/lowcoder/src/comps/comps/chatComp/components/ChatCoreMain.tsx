// client/packages/lowcoder/src/comps/comps/chatComp/components/ChatCoreMain.tsx

import React, { useState, useEffect } from "react";
import {
  useExternalStoreRuntime,
  ThreadMessageLike,
  AppendMessage,
  AssistantRuntimeProvider,
  ExternalStoreThreadListAdapter,
  CompleteAttachment,
  TextContentPart,
  ThreadUserContentPart
} from "@assistant-ui/react";
import { Thread } from "./assistant-ui/thread";
import { ThreadList } from "./assistant-ui/thread-list";
import { 
  useChatContext, 
  RegularThreadData, 
  ArchivedThreadData 
} from "./context/ChatContext";
import { MessageHandler, ChatMessage } from "../types/chatTypes";
import styled from "styled-components";
import { trans } from "i18n";
import { universalAttachmentAdapter } from "../utils/attachmentAdapter";

// ============================================================================
// STYLED COMPONENTS (same as your current ChatMain)
// ============================================================================

const ChatContainer = styled.div`
  display: flex;
  height: 500px;

  p {
    margin: 0;
  }

  .aui-thread-list-root {
    width: 250px;
    background-color: #fff;
    padding: 10px;
  }

  .aui-thread-root {
    flex: 1;
    background-color: #f9fafb;
  }

  .aui-thread-list-item {
    cursor: pointer;
    transition: background-color 0.2s ease;

    &[data-active="true"] {
      background-color: #dbeafe;
      border: 1px solid #bfdbfe;
    }
  }
`;

// ============================================================================
// CHAT CORE MAIN - CLEAN PROPS, FOCUSED RESPONSIBILITY
// ============================================================================

interface ChatCoreMainProps {
  messageHandler: MessageHandler;
  placeholder?: string;
  onMessageUpdate?: (message: string) => void;
  onConversationUpdate?: (conversationHistory: ChatMessage[]) => void;
  // STANDARD LOWCODER EVENT PATTERN - SINGLE CALLBACK (OPTIONAL)
  onEvent?: (eventName: string) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export function ChatCoreMain({ 
  messageHandler, 
  placeholder,
  onMessageUpdate, 
  onConversationUpdate,
  onEvent
}: ChatCoreMainProps) {
  const { state, actions } = useChatContext();
  const [isRunning, setIsRunning] = useState(false);

  console.log("RENDERING CHAT CORE MAIN");

  // Get messages for current thread
  const currentMessages = actions.getCurrentMessages();

  // Notify parent component of conversation changes
  useEffect(() => {
    onConversationUpdate?.(currentMessages);
  }, [currentMessages]);

  // Trigger component load event on mount
  useEffect(() => {
    onEvent?.("componentLoad");
  }, [onEvent]);

  // Convert custom format to ThreadMessageLike (same as your current implementation)
  const convertMessage = (message: ChatMessage): ThreadMessageLike => {
    const content: ThreadUserContentPart[] = [{ type: "text", text: message.text }];
    
    // Add attachment content if attachments exist
    if (message.attachments && message.attachments.length > 0) {
      for (const attachment of message.attachments) {
        if (attachment.content) {
          content.push(...attachment.content);
        }
      }
    }
    
    return {
      role: message.role,
      content,
      id: message.id,
      createdAt: new Date(message.timestamp),
      ...(message.attachments && message.attachments.length > 0 && { attachments: message.attachments }),
    };
  };

  // Handle new message - MUCH CLEANER with messageHandler
  const onNew = async (message: AppendMessage) => {
    const textPart = (message.content as ThreadUserContentPart[]).find(
      (part): part is TextContentPart => part.type === "text"
    );
  
    const text = textPart?.text?.trim() ?? "";
  
    const completeAttachments = (message.attachments ?? []).filter(
      (att): att is CompleteAttachment => att.status.type === "complete"
    );
  
    const hasText = text.length > 0;
    const hasAttachments = completeAttachments.length > 0;
  
    if (!hasText && !hasAttachments) {
      throw new Error("Cannot send an empty message");
    }
  
    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      text,
      timestamp: Date.now(),
      attachments: completeAttachments,
    };
  
    onMessageUpdate?.(text);
    await actions.addMessage(state.currentThreadId, userMessage);
    setIsRunning(true);
  
    try {
      const response = await messageHandler.sendMessage(userMessage); // Send full message object with attachments
  
      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        text: response.content,
        timestamp: Date.now(),
      };
  
      await actions.addMessage(state.currentThreadId, assistantMessage);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        text: trans("chat.errorUnknown"),
        timestamp: Date.now(),
      };
  
      await actions.addMessage(state.currentThreadId, errorMessage);
    } finally {
      setIsRunning(false);
    }
  };
  

  // Handle edit message - CLEANER with messageHandler
  const onEdit = async (message: AppendMessage) => {
    // Extract the first text content part (if any)
    const textPart = (message.content as ThreadUserContentPart[]).find(
      (part): part is TextContentPart => part.type === "text"
    );
  
    const text = textPart?.text?.trim() ?? "";
  
    // Filter only complete attachments
    const completeAttachments = (message.attachments ?? []).filter(
      (att): att is CompleteAttachment => att.status.type === "complete"
    );
  
    const hasText = text.length > 0;
    const hasAttachments = completeAttachments.length > 0;
  
    if (!hasText && !hasAttachments) {
      throw new Error("Cannot send an empty message");
    }
  
    // Find the index of the message being edited
    const index = currentMessages.findIndex((m) => m.id === message.parentId) + 1;
  
    // Build a new messages array: messages up to and including the one being edited
    const newMessages = [...currentMessages.slice(0, index)];
  
    // Build the edited user message
    const editedMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      text,
      timestamp: Date.now(),
      attachments: completeAttachments,
    };
  
    newMessages.push(editedMessage);
  
    // Expose message update to parent
    onMessageUpdate?.(editedMessage.text);
  
    // Update state with edited context
    await actions.updateMessages(state.currentThreadId, newMessages);
    setIsRunning(true);
  
    try {
      const response = await messageHandler.sendMessage(editedMessage); // Send full message object with attachments
  
      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        text: response.content,
        timestamp: Date.now(),
      };
  
      newMessages.push(assistantMessage);
      await actions.updateMessages(state.currentThreadId, newMessages);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        text: trans("chat.errorUnknown"),
        timestamp: Date.now(),
      };
  
      newMessages.push(errorMessage);
      await actions.updateMessages(state.currentThreadId, newMessages);
    } finally {
      setIsRunning(false);
    }
  };

  // Thread list adapter for managing multiple threads (same as your current implementation)
  const threadListAdapter: ExternalStoreThreadListAdapter = {
    threadId: state.currentThreadId,
    threads: state.threadList.filter((t): t is RegularThreadData => t.status === "regular"),
    archivedThreads: state.threadList.filter((t): t is ArchivedThreadData => t.status === "archived"),

    onSwitchToNewThread: async () => {
      const threadId = await actions.createThread(trans("chat.newChatTitle"));
      actions.setCurrentThread(threadId);
      onEvent?.("threadCreated");
    },

    onSwitchToThread: (threadId) => {
      actions.setCurrentThread(threadId);
    },

    onRename: async (threadId, newTitle) => {
      await actions.updateThread(threadId, { title: newTitle });
      onEvent?.("threadUpdated");
    },

    onArchive: async (threadId) => {
      await actions.updateThread(threadId, { status: "archived" });
      onEvent?.("threadUpdated");
    },

    onDelete: async (threadId) => {
      await actions.deleteThread(threadId);
      onEvent?.("threadDeleted");
    },
  };

  const runtime = useExternalStoreRuntime({
    messages: currentMessages,
    setMessages: (messages) => {
      actions.updateMessages(state.currentThreadId, messages);
    },
    convertMessage,
    isRunning,
    onNew,
    onEdit,
    adapters: {
      threadList: threadListAdapter,
      attachments: universalAttachmentAdapter,
    },
  });

  if (!state.isInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ChatContainer>
        <ThreadList />
        <Thread placeholder={placeholder} />
      </ChatContainer>
    </AssistantRuntimeProvider>
  );
}

