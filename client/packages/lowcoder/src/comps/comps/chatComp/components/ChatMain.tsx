import React, { useState } from "react";
import {
  useExternalStoreRuntime,
  ThreadMessageLike,
  AppendMessage,
  AssistantRuntimeProvider,
  ExternalStoreThreadListAdapter,
} from "@assistant-ui/react";
import { Thread } from "./assistant-ui/thread";
import { ThreadList } from "./assistant-ui/thread-list";
import { 
  useChatContext, 
  MyMessage, 
  ThreadData, 
  RegularThreadData, 
  ArchivedThreadData 
} from "./context/ChatContext";
import styled from "styled-components";

const ChatContainer = styled.div`
  display: flex;
  height: 500px;

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

const generateId = () => Math.random().toString(36).substr(2, 9);

const callYourAPI = async (text: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simple responses
  return {
    content: "This is a mock response from your backend. You typed: " + text
  };
};

export function ChatMain() {
  const { state, actions } = useChatContext();
  const [isRunning, setIsRunning] = useState(false);

  console.log("STATE", state);

  // Get messages for current thread
  const currentMessages = actions.getCurrentMessages();

  // Convert custom format to ThreadMessageLike
  const convertMessage = (message: MyMessage): ThreadMessageLike => ({
    role: message.role,
    content: [{ type: "text", text: message.text }],
    id: message.id,
    createdAt: new Date(message.timestamp),
  });

  const onNew = async (message: AppendMessage) => {
    // Extract text from AppendMessage content array
    if (message.content.length !== 1 || message.content[0]?.type !== "text") {
      throw new Error("Only text content is supported");
    }

    // Add user message in custom format
    const userMessage: MyMessage = {
      id: generateId(),
      role: "user",
      text: message.content[0].text,
      timestamp: Date.now(),
    };
    
    // Update current thread with new user message
    await actions.addMessage(state.currentThreadId, userMessage);
    setIsRunning(true);

    try {
      // Call mock API
      const response = await callYourAPI(userMessage.text);
      
      const assistantMessage: MyMessage = {
        id: generateId(),
        role: "assistant",
        text: response.content,
        timestamp: Date.now(),
      };
      
      // Update current thread with assistant response
      await actions.addMessage(state.currentThreadId, assistantMessage);
    } catch (error) {
      // Handle errors gracefully
      const errorMessage: MyMessage = {
        id: generateId(),
        role: "assistant", 
        text: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
      };
      
      await actions.addMessage(state.currentThreadId, errorMessage);
    } finally {
      setIsRunning(false);
    }
  };

  // Add onEdit functionality
  const onEdit = async (message: AppendMessage) => {
    // Extract text from AppendMessage content array
    if (message.content.length !== 1 || message.content[0]?.type !== "text") {
      throw new Error("Only text content is supported");
    }

    // Find the index where to insert the edited message
    const index = currentMessages.findIndex((m) => m.id === message.parentId) + 1;

    // Keep messages up to the parent
    const newMessages = [...currentMessages.slice(0, index)];

    // Add the edited message in custom format
    const editedMessage: MyMessage = {
      id: generateId(),
      role: "user",
      text: message.content[0].text,
      timestamp: Date.now(),
    };
    newMessages.push(editedMessage);

    // Update messages using the new context action
    await actions.updateMessages(state.currentThreadId, newMessages);
    setIsRunning(true);

    try {
      // Generate new response
      const response = await callYourAPI(editedMessage.text);
      
      const assistantMessage: MyMessage = {
        id: generateId(),
        role: "assistant",
        text: response.content,
        timestamp: Date.now(),
      };
      
      newMessages.push(assistantMessage);
      await actions.updateMessages(state.currentThreadId, newMessages);
    } catch (error) {
      // Handle errors gracefully
      const errorMessage: MyMessage = {
        id: generateId(),
        role: "assistant", 
        text: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
      };
      
      newMessages.push(errorMessage);
      await actions.updateMessages(state.currentThreadId, newMessages);
    } finally {
      setIsRunning(false);
    }
  };

  // Thread list adapter for managing multiple threads
  const threadListAdapter: ExternalStoreThreadListAdapter = {
    threadId: state.currentThreadId,
    threads: state.threadList.filter((t): t is RegularThreadData => t.status === "regular"),
    archivedThreads: state.threadList.filter((t): t is ArchivedThreadData => t.status === "archived"),

    onSwitchToNewThread: async () => {
      const threadId = await actions.createThread("New Chat");
      actions.setCurrentThread(threadId);
    },

    onSwitchToThread: (threadId) => {
      actions.setCurrentThread(threadId);
    },

    onRename: async (threadId, newTitle) => {
      await actions.updateThread(threadId, { title: newTitle });
    },

    onArchive: async (threadId) => {
      await actions.updateThread(threadId, { status: "archived" });
    },

    onDelete: async (threadId) => {
      await actions.deleteThread(threadId);
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
    },
  });

  if (!state.isInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ChatContainer>
        <ThreadList />
        <Thread />
      </ChatContainer>
    </AssistantRuntimeProvider>
  );
}

