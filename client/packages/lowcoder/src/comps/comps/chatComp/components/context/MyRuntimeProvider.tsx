import { useState } from "react";
import {
  useExternalStoreRuntime,
  ThreadMessageLike,
  AppendMessage,
  AssistantRuntimeProvider,
} from "@assistant-ui/react";

const callYourAPI = async (message: AppendMessage) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simple responses
    return {
      content: "This is a mock response from your backend. You typed: " + 
      (typeof message.content === 'string' ? message.content : 'something')
    };
  };

export function MyRuntimeProvider({ children }: { children: React.ReactNode }) {
    const [messages, setMessages] = useState<ThreadMessageLike[]>([]);
    const [isRunning, setIsRunning] = useState(false);
  
    const onNew = async (message: AppendMessage) => {
      // Add user message
      const userMessage: ThreadMessageLike = {
        role: "user",
        content: message.content,
      };
      
      setMessages(prev => [...prev, userMessage]);
      setIsRunning(true);
  
      try {
        // Call mock API
        const response = await callYourAPI(message);
        
        const assistantMessage: ThreadMessageLike = {
          role: "assistant",
          content: response.content,
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      } catch (error) {
        // Handle errors gracefully
        const errorMessage: ThreadMessageLike = {
          role: "assistant", 
          content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. This is expected in mock mode for testing error handling.`,
        };
        
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsRunning(false);
      }
    };
  
    const runtime = useExternalStoreRuntime<ThreadMessageLike>({
      messages,
      setMessages,
      isRunning,
      onNew,
      convertMessage: (message) => message,
    });
  
    return (
      <AssistantRuntimeProvider runtime={runtime}>
        {children}
      </AssistantRuntimeProvider>
    );
  }