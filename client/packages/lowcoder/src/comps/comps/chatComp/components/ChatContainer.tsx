// client/packages/lowcoder/src/comps/comps/chatComp/components/ChatContainer.tsx

import React, { useState, useEffect, useRef } from "react";
import {
  useExternalStoreRuntime,
  ThreadMessageLike,
  AssistantRuntimeProvider,
} from "@assistant-ui/react";
import type {
  AppendMessage,
  CompleteAttachment,
  ExternalStoreThreadListAdapter,
} from "@assistant-ui/react";
import { Thread } from "components/assistant-ui/thread";
import { ThreadList } from "components/assistant-ui/thread-list";
import { 
  useChatContext, 
  RegularThreadData,
  NEW_THREAD_ID,
} from "./context/ChatContext";
import { MessageHandler, ChatMessage, ChatCoreProps } from "../types/chatTypes";
import { trans } from "i18n";
import { universalAttachmentAdapter } from "../utils/attachmentAdapter";
import {
  createAssistantErrorMessage,
  createUserMessage,
  getTextFromAppendMessage,
  getTextFromThreadContent,
  maybeUpdateInitialThreadTitle,
  toChatMessage,
  toExternalThreadData,
} from "../utils/assistantMessages";
import { StyledChatContainer } from "./ChatContainerStyles";

// ============================================================================
//   CHAT CONTAINER 
// ============================================================================

function ChatContainerView(props: ChatCoreProps) {
  const { state, actions } = useChatContext();
  const [isRunning, setIsRunning] = useState(false);

  // callback props in refs so useEffects don't re-fire
  const onConversationUpdateRef = useRef(props.onConversationUpdate);
  onConversationUpdateRef.current = props.onConversationUpdate;

  const onEventRef = useRef(props.onEvent);
  onEventRef.current = props.onEvent;

  const currentMessages = actions.getCurrentMessages();

  useEffect(() => {
    onConversationUpdateRef.current?.(currentMessages);
  }, [state.currentThreadId, currentMessages]);

  useEffect(() => {
    onEventRef.current?.("componentLoad");
  }, []);

  const convertMessage = (message: ChatMessage): ThreadMessageLike => message;

  const updateInitialThreadTitle = async (userMessage: ChatMessage, threadId: string) => {
    const updated = await maybeUpdateInitialThreadTitle(
      userMessage,
      state.threadList,
      threadId,
      currentMessages.length,
      actions.updateThread
    );
    if (updated) props.onEvent?.("threadUpdated");
  };

  const onNew = async (message: AppendMessage) => {
    const text = getTextFromAppendMessage(message);
    const completeAttachments = (message.attachments ?? []).filter(
      (att): att is CompleteAttachment => att.status.type === "complete"
    );
  
    if (!text && !completeAttachments.length) {
      throw new Error("Cannot send an empty message");
    }
  
    const userMessage = createUserMessage(text, completeAttachments);
    const conversationHistory = [...currentMessages, userMessage];

    let threadId = state.currentThreadId;
    if (threadId === NEW_THREAD_ID) {
      threadId = await actions.createThread(trans("chat.newChatTitle"));
      actions.setCurrentThread(threadId);
      props.onEvent?.("threadCreated");
    }

    await actions.addMessage(threadId, userMessage);
    await updateInitialThreadTitle(userMessage, threadId);
    setIsRunning(true);
  
    try {
      const assistantMessage = await props.messageHandler.sendMessage(
        userMessage,
        conversationHistory
      );
      props.onMessageUpdate?.(getTextFromThreadContent(userMessage.content));
  
      await actions.addMessage(threadId, assistantMessage);
    } catch (error) {
      await actions.addMessage(
        threadId,
        createAssistantErrorMessage(trans("chat.errorUnknown"))
      );
    } finally {
      setIsRunning(false);
    }
  };

  const onEdit = async (message: AppendMessage) => {
    const text = getTextFromAppendMessage(message);
    const completeAttachments = (message.attachments ?? []).filter(
      (att): att is CompleteAttachment => att.status.type === "complete"
    );
  
    if (!text && !completeAttachments.length) {
      throw new Error("Cannot send an empty message");
    }
  
    const index = currentMessages.findIndex((m) => m.id === message.parentId) + 1;
    const newMessages = [...currentMessages.slice(0, index)];
  
    const editedMessage = createUserMessage(text, completeAttachments);
  
    newMessages.push(editedMessage);
    await actions.updateMessages(state.currentThreadId, newMessages);
    setIsRunning(true);
  
    try {
      const assistantMessage = await props.messageHandler.sendMessage(
        editedMessage,
        newMessages
      );
      props.onMessageUpdate?.(getTextFromThreadContent(editedMessage.content));
  
      newMessages.push(assistantMessage);
      await actions.updateMessages(state.currentThreadId, newMessages);
    } catch (error) {
      newMessages.push(createAssistantErrorMessage(trans("chat.errorUnknown")));
      await actions.updateMessages(state.currentThreadId, newMessages);
    } finally {
      setIsRunning(false);
    }
  };

  const threadListAdapter: ExternalStoreThreadListAdapter = {
    threadId: state.currentThreadId,
    threads: state.threadList
      .filter((t): t is RegularThreadData => t.status === "regular")
      .map(toExternalThreadData),

    onSwitchToNewThread: () => {
      actions.setCurrentThread(NEW_THREAD_ID);
    },

    onSwitchToThread: (threadId) => {
      actions.setCurrentThread(threadId);
    },

    onRename: async (threadId, newTitle) => {
      await actions.updateThread(threadId, { title: newTitle });
      props.onEvent?.("threadUpdated");
    },

    onDelete: async (threadId) => {
      await actions.deleteThread(threadId);
      props.onEvent?.("threadDeleted");
    },
  };

  const runtime = useExternalStoreRuntime({
    messages: currentMessages,
    setMessages: (messages) =>
      actions.updateMessages(
        state.currentThreadId,
        messages.map(toChatMessage)
      ),
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
      <StyledChatContainer
        style={props.style}
        $autoHeight={props.autoHeight}
        $sidebarWidth={props.sidebarWidth}
        $sidebarStyle={props.sidebarStyle}
        $messagesStyle={props.messagesStyle}
        $inputStyle={props.inputStyle}
        $sendButtonStyle={props.sendButtonStyle}
        $newThreadButtonStyle={props.newThreadButtonStyle}
        $threadItemStyle={props.threadItemStyle}
        $animationStyle={props.animationStyle}
      >
        <ThreadList />
        <Thread placeholder={props.placeholder} autoHeight={props.autoHeight} />
      </StyledChatContainer>
    </AssistantRuntimeProvider>
  );
}

// ============================================================================
//   EXPORT 
// ============================================================================

export const ChatContainer = ChatContainerView;
