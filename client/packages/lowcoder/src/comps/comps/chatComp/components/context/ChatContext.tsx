import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import { chatStorage, ThreadData as StoredThreadData } from "../../utils/chatStorage";

// Define thread-specific message type
export interface MyMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
}

// Thread data interfaces
export interface RegularThreadData {
  threadId: string;
  status: "regular";
  title: string;
}

export interface ArchivedThreadData {
  threadId: string;
  status: "archived";
  title: string;
}

export type ThreadData = RegularThreadData | ArchivedThreadData;

// Chat state interface
interface ChatState {
  isInitialized: boolean;
  isLoading: boolean;
  currentThreadId: string;
  threadList: ThreadData[];
  threads: Map<string, MyMessage[]>;
  lastSaved: number; // Timestamp for tracking when data was last saved
}

// Action types
type ChatAction =
  | { type: "INITIALIZE_START" }
  | { type: "INITIALIZE_SUCCESS"; threadList: ThreadData[]; threads: Map<string, MyMessage[]>; currentThreadId: string }
  | { type: "INITIALIZE_ERROR" }
  | { type: "SET_CURRENT_THREAD"; threadId: string }
  | { type: "ADD_THREAD"; thread: ThreadData }
  | { type: "UPDATE_THREAD"; threadId: string; updates: Partial<ThreadData> }
  | { type: "DELETE_THREAD"; threadId: string }
  | { type: "SET_MESSAGES"; threadId: string; messages: MyMessage[] }
  | { type: "ADD_MESSAGE"; threadId: string; message: MyMessage }
  | { type: "UPDATE_MESSAGES"; threadId: string; messages: MyMessage[] }
  | { type: "MARK_SAVED" };

// Initial state
const initialState: ChatState = {
  isInitialized: false,
  isLoading: false,
  currentThreadId: "default",
  threadList: [{ threadId: "default", status: "regular", title: "New Chat" }],
  threads: new Map([["default", []]]),
  lastSaved: 0,
};

// Reducer function
function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "INITIALIZE_START":
      return {
        ...state,
        isLoading: true,
      };

    case "INITIALIZE_SUCCESS":
      return {
        ...state,
        isInitialized: true,
        isLoading: false,
        threadList: action.threadList,
        threads: action.threads,
        currentThreadId: action.currentThreadId,
        lastSaved: Date.now(),
      };

    case "INITIALIZE_ERROR":
      return {
        ...state,
        isInitialized: true,
        isLoading: false,
      };

    case "SET_CURRENT_THREAD":
      return {
        ...state,
        currentThreadId: action.threadId,
      };

    case "ADD_THREAD":
      return {
        ...state,
        threadList: [...state.threadList, action.thread],
        threads: new Map(state.threads).set(action.thread.threadId, []),
      };

    case "UPDATE_THREAD":
      return {
        ...state,
        threadList: state.threadList.map(thread =>
          thread.threadId === action.threadId
            ? { ...thread, ...action.updates }
            : thread
        ),
      };

    case "DELETE_THREAD":
      const newThreads = new Map(state.threads);
      newThreads.delete(action.threadId);
      return {
        ...state,
        threadList: state.threadList.filter(t => t.threadId !== action.threadId),
        threads: newThreads,
        currentThreadId: state.currentThreadId === action.threadId 
          ? "default" 
          : state.currentThreadId,
      };

    case "SET_MESSAGES":
      return {
        ...state,
        threads: new Map(state.threads).set(action.threadId, action.messages),
      };

    case "ADD_MESSAGE":
      const currentMessages = state.threads.get(action.threadId) || [];
      return {
        ...state,
        threads: new Map(state.threads).set(action.threadId, [...currentMessages, action.message]),
      };

    case "UPDATE_MESSAGES":
      return {
        ...state,
        threads: new Map(state.threads).set(action.threadId, action.messages),
      };

    case "MARK_SAVED":
      return {
        ...state,
        lastSaved: Date.now(),
      };

    default:
      return state;
  }
}

// Context type
interface ChatContextType {
  state: ChatState;
  actions: {
    // Initialization
    initialize: () => Promise<void>;
    
    // Thread management
    setCurrentThread: (threadId: string) => void;
    createThread: (title?: string) => Promise<string>;
    updateThread: (threadId: string, updates: Partial<ThreadData>) => Promise<void>;
    deleteThread: (threadId: string) => Promise<void>;
    
    // Message management  
    addMessage: (threadId: string, message: MyMessage) => Promise<void>;
    updateMessages: (threadId: string, messages: MyMessage[]) => Promise<void>;
    
    // Utility
    getCurrentMessages: () => MyMessage[];
  };
}

// Create the context
const ChatContext = createContext<ChatContextType | null>(null);

// Chat provider component
export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Initialize data from storage
  const initialize = async () => {
    dispatch({ type: "INITIALIZE_START" });
    
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
        
        // Find the most recently updated thread
        const latestThread = storedThreads.sort((a, b) => b.updatedAt - a.updatedAt)[0];
        const currentThreadId = latestThread ? latestThread.threadId : "default";
        
        dispatch({ 
          type: "INITIALIZE_SUCCESS", 
          threadList: uiThreads, 
          threads: threadMessages, 
          currentThreadId 
        });
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
        
        dispatch({ 
          type: "INITIALIZE_SUCCESS", 
          threadList: initialState.threadList, 
          threads: initialState.threads, 
          currentThreadId: "default" 
        });
      }
    } catch (error) {
      console.error("Failed to initialize chat data:", error);
      dispatch({ type: "INITIALIZE_ERROR" });
    }
  };

  // Thread management actions
  const setCurrentThread = (threadId: string) => {
    dispatch({ type: "SET_CURRENT_THREAD", threadId });
  };

  const createThread = async (title: string = "New Chat"): Promise<string> => {
    const threadId = `thread-${Date.now()}`;
    const newThread: ThreadData = {
      threadId,
      status: "regular",
      title,
    };
    
    // Update local state first
    dispatch({ type: "ADD_THREAD", thread: newThread });
    
    // Save to storage
    try {
      const storedThread: StoredThreadData = {
        threadId,
        status: "regular",
        title,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await chatStorage.saveThread(storedThread);
      dispatch({ type: "MARK_SAVED" });
    } catch (error) {
      console.error("Failed to save new thread:", error);
    }
    
    return threadId;
  };

  const updateThread = async (threadId: string, updates: Partial<ThreadData>) => {
    // Update local state first
    dispatch({ type: "UPDATE_THREAD", threadId, updates });
    
    // Save to storage
    try {
      const existingThread = await chatStorage.getThread(threadId);
      if (existingThread) {
        const updatedThread: StoredThreadData = {
          ...existingThread,
          ...updates,
          updatedAt: Date.now(),
        };
        await chatStorage.saveThread(updatedThread);
        dispatch({ type: "MARK_SAVED" });
      }
    } catch (error) {
      console.error("Failed to update thread:", error);
    }
  };

  const deleteThread = async (threadId: string) => {
    // Update local state first
    dispatch({ type: "DELETE_THREAD", threadId });
    
    // Delete from storage
    try {
      await chatStorage.deleteThread(threadId);
      dispatch({ type: "MARK_SAVED" });
    } catch (error) {
      console.error("Failed to delete thread:", error);
    }
  };

  // Message management actions
  const addMessage = async (threadId: string, message: MyMessage) => {
    // Update local state first
    dispatch({ type: "ADD_MESSAGE", threadId, message });
    
    // Save to storage
    try {
      await chatStorage.saveMessage(message, threadId);
      dispatch({ type: "MARK_SAVED" });
    } catch (error) {
      console.error("Failed to save message:", error);
    }
  };

  const updateMessages = async (threadId: string, messages: MyMessage[]) => {
    // Update local state first
    dispatch({ type: "UPDATE_MESSAGES", threadId, messages });
    
    // Save to storage
    try {
      await chatStorage.saveMessages(messages, threadId);
      dispatch({ type: "MARK_SAVED" });
    } catch (error) {
      console.error("Failed to save messages:", error);
    }
  };

  // Utility functions
  const getCurrentMessages = (): MyMessage[] => {
    return state.threads.get(state.currentThreadId) || [];
  };

  // Auto-initialize on mount
  useEffect(() => {
    if (!state.isInitialized && !state.isLoading) {
      initialize();
    }
  }, [state.isInitialized, state.isLoading]);

  const actions = {
    initialize,
    setCurrentThread,
    createThread,
    updateThread,
    deleteThread,
    addMessage,
    updateMessages,
    getCurrentMessages,
  };

  return (
    <ChatContext.Provider value={{ state, actions }}>
      {children}
    </ChatContext.Provider>
  );
}

// Hook for accessing chat context
export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within ChatProvider");
  }
  return context;
} 