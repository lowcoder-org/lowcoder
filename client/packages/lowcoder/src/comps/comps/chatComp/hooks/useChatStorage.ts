import { useEffect, useState } from "react";
import { chatStorage, ThreadData as StoredThreadData } from "../utils/chatStorage";
import { MyMessage } from "../components/context/ThreadContext";

// Thread data interfaces (matching ChatWithThreads)
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

interface UseChatStorageParams {
  threadList: ThreadData[];
  threads: Map<string, MyMessage[]>;
  setThreadList: React.Dispatch<React.SetStateAction<ThreadData[]>>;
  setThreads: React.Dispatch<React.SetStateAction<Map<string, MyMessage[]>>>;
  setCurrentThreadId: (id: string) => void;
}

export function useChatStorage({
  threadList,
  threads,
  setThreadList,
  setThreads,
  setCurrentThreadId,
}: UseChatStorageParams) {
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
  }, [setCurrentThreadId, setThreads, setThreadList]);

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

  return {
    isInitialized,
  };
}