import React, { createContext, useContext, useState, ReactNode } from "react";

// Define thread-specific message type
interface MyMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
}

// Thread context type
interface ThreadContextType {
  currentThreadId: string;
  setCurrentThreadId: (id: string) => void;
  threads: Map<string, MyMessage[]>;
  setThreads: React.Dispatch<React.SetStateAction<Map<string, MyMessage[]>>>;
}

// Create the context
const ThreadContext = createContext<ThreadContextType>({
  currentThreadId: "default",
  setCurrentThreadId: () => {},
  threads: new Map(),
  setThreads: () => {},
});

// Thread provider component
export function ThreadProvider({ children }: { children: ReactNode }) {
  const [threads, setThreads] = useState<Map<string, MyMessage[]>>(
    new Map([["default", []]]),
  );
  const [currentThreadId, setCurrentThreadId] = useState("default");

  return (
    <ThreadContext.Provider
      value={{ currentThreadId, setCurrentThreadId, threads, setThreads }}
    >
      {children}
    </ThreadContext.Provider>
  );
}

// Hook for accessing thread context
export function useThreadContext() {
  const context = useContext(ThreadContext);
  if (!context) {
    throw new Error("useThreadContext must be used within ThreadProvider");
  }
  return context;
}

// Export the MyMessage type for use in other files
export type { MyMessage }; 