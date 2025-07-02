import { useState } from "react";
import {
  useExternalStoreRuntime,
  ThreadMessageLike,
  AppendMessage,
  AssistantRuntimeProvider,
} from "@assistant-ui/react";

// Define your custom message type
interface MyMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const callYourAPI = async (text: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simple responses
    return {
      content: "This is a mock response from your backend. You typed: " + text
    };
};

export function MyRuntimeProvider({ children }: { children: React.ReactNode }) {
    // Use your custom message type in state
    const [myMessages, setMyMessages] = useState<MyMessage[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    // Convert your custom format to ThreadMessageLike
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

      // Add user message in your custom format
      const userMessage: MyMessage = {
        id: generateId(),
        role: "user",
        text: message.content[0].text,
        timestamp: Date.now(),
      };
      
      setMyMessages(prev => [...prev, userMessage]);
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
        
        setMyMessages(prev => [...prev, assistantMessage]);
      } catch (error) {
        // Handle errors gracefully
        const errorMessage: MyMessage = {
          id: generateId(),
          role: "assistant", 
          text: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. This is expected in mock mode for testing error handling.`,
          timestamp: Date.now(),
        };
        
        setMyMessages(prev => [...prev, errorMessage]);
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
      const index = myMessages.findIndex((m) => m.id === message.parentId) + 1;

      // Keep messages up to the parent
      const newMessages = [...myMessages.slice(0, index)];

      // Add the edited message in your custom format
      const editedMessage: MyMessage = {
        id: generateId(), // Always generate new ID for edited messages
        role: "user",
        text: message.content[0].text,
        timestamp: Date.now(),
      };
      newMessages.push(editedMessage);

      setMyMessages(newMessages);
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
        setMyMessages(newMessages);
      } catch (error) {
        // Handle errors gracefully
        const errorMessage: MyMessage = {
          id: generateId(),
          role: "assistant", 
          text: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: Date.now(),
        };
        
        newMessages.push(errorMessage);
        setMyMessages(newMessages);
      } finally {
        setIsRunning(false);
      }
    };
  
    const runtime = useExternalStoreRuntime({
      messages: myMessages,        // Your custom message array
      convertMessage,              // Conversion function
      isRunning,
      onNew,
      onEdit,                     // Enable message editing
    });
  
    return (
      <AssistantRuntimeProvider runtime={runtime}>
        {children}
      </AssistantRuntimeProvider>
    );
}