import React, { useState, useEffect } from "react";
import {
  useExternalStoreRuntime,
  ThreadMessageLike,
  AppendMessage,
  AssistantRuntimeProvider,
  ExternalStoreThreadListAdapter,
} from "@assistant-ui/react";
import { useThreadContext, MyMessage, ThreadProvider } from "./context/ThreadContext";
import { Thread } from "./assistant-ui/thread";
import { ThreadList } from "./assistant-ui/thread-list";
import { chatStorage, ThreadData as StoredThreadData } from "../utils/chatStorage";

// Define thread data interfaces to match ExternalStoreThreadData requirements
interface RegularThreadData {
  threadId: string;
  status: "regular";
  title: string;
}

interface ArchivedThreadData {
  threadId: string;
  status: "archived";
  title: string;
}

type ThreadData = RegularThreadData | ArchivedThreadData;

const generateId = () => Math.random().toString(36).substr(2, 9);

const callYourAPI = async (text: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simple responses
  return {
    content: "This is a mock response from your backend. You typed: " + text
  };
};

function ChatWithThreads() {
  const { currentThreadId, setCurrentThreadId, threads, setThreads } =
    useThreadContext();
  const [isRunning, setIsRunning] = useState(false);
  const [threadList, setThreadList] = useState<ThreadData[]>([
    { threadId: "default", status: "regular", title: "New Chat" } as RegularThreadData,
  ]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load data from persistent storage on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await chatStorage.initialize();
        
        // Load all threads from storage
        const storedThreads = await chatStorage.getAllThreads();
        if (storedThreads.length > 0) {
          // Convert stored threads to UI format
          const uiThreads: ThreadData[] = storedThreads.map(stored => ({
            threadId: stored.threadId,
            status: stored.status as "regular" | "archived",
            title: stored.title,
          }));
          setThreadList(uiThreads);
          
          // Load messages for each thread
          const threadMessages = new Map<string, MyMessage[]>();
          for (const thread of storedThreads) {
            const messages = await chatStorage.getMessages(thread.threadId);
            threadMessages.set(thread.threadId, messages);
          }
          
          // Ensure default thread exists
          if (!threadMessages.has("default")) {
            threadMessages.set("default", []);
          }
          
          setThreads(threadMessages);
          
          // Set current thread to the most recently updated one
          const latestThread = storedThreads.sort((a, b) => b.updatedAt - a.updatedAt)[0];
          if (latestThread) {
            setCurrentThreadId(latestThread.threadId);
          }
        } else {
          // Initialize with default thread
          const defaultThread: StoredThreadData = {
            threadId: "default",
            status: "regular",
            title: "New Chat",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          await chatStorage.saveThread(defaultThread);
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to load chat data:", error);
        setIsInitialized(true); // Continue with default state
      }
    };

    loadData();
  }, [setCurrentThreadId, setThreads]);

  // Save thread data whenever threadList changes
  useEffect(() => {
    if (!isInitialized) return;
    
    const saveThreads = async () => {
      try {
        for (const thread of threadList) {
          const storedThread: StoredThreadData = {
            threadId: thread.threadId,
            status: thread.status,
            title: thread.title,
            createdAt: Date.now(), // In real app, preserve original createdAt
            updatedAt: Date.now(),
          };
          await chatStorage.saveThread(storedThread);
        }
      } catch (error) {
        console.error("Failed to save threads:", error);
      }
    };

    saveThreads();
  }, [threadList, isInitialized]);

  // Save messages whenever threads change
  useEffect(() => {
    if (!isInitialized) return;
    
    const saveMessages = async () => {
      try {
        for (const [threadId, messages] of threads.entries()) {
          await chatStorage.saveMessages(messages, threadId);
        }
      } catch (error) {
        console.error("Failed to save messages:", error);
      }
    };

    saveMessages();
  }, [threads, isInitialized]);

  

  // Get messages for current thread
  const currentMessages = threads.get(currentThreadId) || [];

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
    const updatedMessages = [...currentMessages, userMessage];
    setThreads(prev => new Map(prev).set(currentThreadId, updatedMessages));
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
      const finalMessages = [...updatedMessages, assistantMessage];
      setThreads(prev => new Map(prev).set(currentThreadId, finalMessages));
    } catch (error) {
      // Handle errors gracefully
      const errorMessage: MyMessage = {
        id: generateId(),
        role: "assistant", 
        text: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
      };
      
      const finalMessages = [...updatedMessages, errorMessage];
      setThreads(prev => new Map(prev).set(currentThreadId, finalMessages));
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

    setThreads(prev => new Map(prev).set(currentThreadId, newMessages));
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
      setThreads(prev => new Map(prev).set(currentThreadId, newMessages));
    } catch (error) {
      // Handle errors gracefully
      const errorMessage: MyMessage = {
        id: generateId(),
        role: "assistant", 
        text: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
      };
      
      newMessages.push(errorMessage);
      setThreads(prev => new Map(prev).set(currentThreadId, newMessages));
    } finally {
      setIsRunning(false);
    }
  };

  // Thread list adapter for managing multiple threads
  const threadListAdapter: ExternalStoreThreadListAdapter = {
    threadId: currentThreadId,
    threads: threadList.filter((t): t is RegularThreadData => t.status === "regular"),
    archivedThreads: threadList.filter((t): t is ArchivedThreadData => t.status === "archived"),

    onSwitchToNewThread: async () => {
      const newId = `thread-${Date.now()}`;
      const newThread: RegularThreadData = {
        threadId: newId,
        status: "regular",
        title: "New Chat",
      };
      
      setThreadList((prev) => [...prev, newThread]);
      setThreads((prev) => new Map(prev).set(newId, []));
      setCurrentThreadId(newId);
      
      // Save new thread to storage
      try {
        const storedThread: StoredThreadData = {
          threadId: newId,
          status: "regular",
          title: "New Chat",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await chatStorage.saveThread(storedThread);
      } catch (error) {
        console.error("Failed to save new thread:", error);
      }
    },

    onSwitchToThread: (threadId) => {
      setCurrentThreadId(threadId);
    },

    onRename: (threadId, newTitle) => {
      setThreadList((prev) =>
        prev.map((t) =>
          t.threadId === threadId ? { ...t, title: newTitle } : t,
        ),
      );
    },

    onArchive: (threadId) => {
      setThreadList((prev) =>
        prev.map((t) =>
          t.threadId === threadId ? { ...t, status: "archived" } : t,
        ),
      );
    },

    onDelete: async (threadId) => {
      setThreadList((prev) => prev.filter((t) => t.threadId !== threadId));
      setThreads((prev) => {
        const next = new Map(prev);
        next.delete(threadId);
        return next;
      });
      if (currentThreadId === threadId) {
        setCurrentThreadId("default");
      }
      
      // Delete thread from storage
      try {
        await chatStorage.deleteThread(threadId);
      } catch (error) {
        console.error("Failed to delete thread from storage:", error);
      }
    },
  };

  const runtime = useExternalStoreRuntime({
    messages: currentMessages,
    setMessages: (messages) => {
      setThreads((prev) => new Map(prev).set(currentThreadId, messages));
    },
    convertMessage,
    isRunning,
    onNew,
    onEdit,
    adapters: {
      threadList: threadListAdapter,
    },
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ThreadList />
      <Thread />
    </AssistantRuntimeProvider>
  );
}

// Main App component with proper context wrapping
export function ChatApp() {
  return (
    <ThreadProvider>
      <ChatWithThreads />
    </ThreadProvider>
  );
}

export { ChatWithThreads }; 