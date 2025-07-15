// client/packages/lowcoder/src/comps/comps/chatComp/chatComp.tsx

import { UICompBuilder } from "comps/generators";
import { NameConfig, withExposingConfigs } from "comps/generators/withExposing";
import { StringControl } from "comps/controls/codeControl";
import { arrayObjectExposingStateControl, stringExposingStateControl } from "comps/controls/codeStateControl";
import { withDefault } from "comps/generators";
import { BoolControl } from "comps/controls/boolControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import QuerySelectControl from "comps/controls/querySelectControl";
import { eventHandlerControl, EventConfigType } from "comps/controls/eventHandlerControl";
import { ChatCore } from "./components/ChatCore";
import { ChatPropertyView } from "./chatPropertyView";
import { createChatStorage } from "./utils/storageFactory";
import { QueryHandler, createMessageHandler } from "./handlers/messageHandlers";
import { useMemo, useRef, useEffect } from "react";  
import { changeChildAction } from "lowcoder-core";
import { ChatMessage } from "./types/chatTypes";

import "@assistant-ui/styles/index.css";
import "@assistant-ui/styles/markdown.css";

// ============================================================================
// CHAT-SPECIFIC EVENTS
// ============================================================================

export const componentLoadEvent: EventConfigType = {
  label: "Component Load",
  value: "componentLoad",
  description: "Triggered when the chat component finishes loading - Load existing data from backend",
};

export const messageSentEvent: EventConfigType = {
  label: "Message Sent",
  value: "messageSent",
  description: "Triggered when a user sends a message - Auto-save user messages",
};

export const messageReceivedEvent: EventConfigType = {
  label: "Message Received", 
  value: "messageReceived",
  description: "Triggered when a response is received from the AI - Auto-save AI responses",
};

export const threadCreatedEvent: EventConfigType = {
  label: "Thread Created",
  value: "threadCreated",
  description: "Triggered when a new thread is created - Auto-save new threads",
};

export const threadUpdatedEvent: EventConfigType = {
  label: "Thread Updated",
  value: "threadUpdated",
  description: "Triggered when a thread is updated - Auto-save thread changes",
};

export const threadDeletedEvent: EventConfigType = {
  label: "Thread Deleted",
  value: "threadDeleted",
  description: "Triggered when a thread is deleted - Delete thread from backend",
};

const ChatEventOptions = [
  componentLoadEvent,
  messageSentEvent,
  messageReceivedEvent,
  threadCreatedEvent,
  threadUpdatedEvent,
  threadDeletedEvent,
] as const;

export const ChatEventHandlerControl = eventHandlerControl(ChatEventOptions);

// ============================================================================
// SIMPLIFIED CHILDREN MAP - WITH EVENT HANDLERS
// ============================================================================


export function addSystemPromptToHistory(
  conversationHistory: ChatMessage[], 
  systemPrompt: string
): Array<{ role: string; content: string; timestamp: number }> {
  // Format conversation history for use in queries
  const formattedHistory = conversationHistory.map(msg => ({
    role: msg.role,
    content: msg.text,
    timestamp: msg.timestamp
  }));
  
  // Create system message (always exists since we have default)
  const systemMessage = [{
    role: "system" as const,
    content: systemPrompt,
    timestamp: Date.now() - 1000000 // Ensure it's always first chronologically
  }];
  
  // Return complete history with system prompt prepended
  return [...systemMessage, ...formattedHistory];
}


function generateUniqueTableName(): string {
  return `chat${Math.floor(1000 + Math.random() * 9000)}`;
 }

const ModelTypeOptions = [
  { label: "Query", value: "query" },
  { label: "N8N Workflow", value: "n8n" },
] as const;

export const chatChildrenMap = {
  // Storage
  // Storage (add the hidden property here)
  _internalDbName: withDefault(StringControl, ""),
  // Message Handler Configuration
  handlerType: dropdownControl(ModelTypeOptions, "query"),
  chatQuery: QuerySelectControl,                    // Only used for "query" type
  modelHost: withDefault(StringControl, ""),        // Only used for "n8n" type
  systemPrompt: withDefault(StringControl, "You are a helpful assistant."),
  streaming: BoolControl.DEFAULT_TRUE,
  
  // UI Configuration  
  placeholder: withDefault(StringControl, "Chat Component"),
  
  // Database Information (read-only)
  databaseName: withDefault(StringControl, ""),
  
  // Event Handlers
  onEvent: ChatEventHandlerControl,
  
  // Exposed Variables (not shown in Property View)
  currentMessage: stringExposingStateControl("currentMessage", ""),
  conversationHistory: stringExposingStateControl("conversationHistory", "[]"),
};

// ============================================================================
// CLEAN CHATCOMP - USES NEW ARCHITECTURE
// ============================================================================

const ChatTmpComp = new UICompBuilder(
  chatChildrenMap,
  (props, dispatch) => {

    const uniqueTableName = useRef<string>();
      // Generate unique table name once (with persistence)
    if (!uniqueTableName.current) {
      // Use persisted name if exists, otherwise generate new one
      uniqueTableName.current = props._internalDbName || generateUniqueTableName();
      
      // Save the name for future refreshes
      if (!props._internalDbName) {
        dispatch(changeChildAction("_internalDbName", uniqueTableName.current, false));
      }
      
      // Update the database name in the props for display
      const dbName = `ChatDB_${uniqueTableName.current}`;
      dispatch(changeChildAction("databaseName", dbName, false));
    }
     // Create storage with unique table name
     const storage = useMemo(() => 
      createChatStorage(uniqueTableName.current!), 
      []
    );
    
    // Create message handler based on type
    const messageHandler = useMemo(() => {
      const handlerType = props.handlerType;
      
      if (handlerType === "query") {
        return new QueryHandler({
          chatQuery: props.chatQuery.value,
          dispatch,
          streaming: props.streaming,
        });
      } else if (handlerType === "n8n") {
        return createMessageHandler("n8n", {
          modelHost: props.modelHost,
          systemPrompt: props.systemPrompt,
          streaming: props.streaming
        });
      } else {
        // Fallback to mock handler
        return createMessageHandler("mock", {
          chatQuery: props.chatQuery.value,
          dispatch,
          streaming: props.streaming
        });
      }
    }, [
      props.handlerType,
      props.chatQuery, 
      props.modelHost,
      props.systemPrompt,
      props.streaming,
      dispatch,
    ]);

    // Handle message updates for exposed variable
    const handleMessageUpdate = (message: string) => {
      dispatch(changeChildAction("currentMessage", message, false));
      // Trigger messageSent event
      props.onEvent("messageSent");
    };

    // Handle conversation history updates for exposed variable
   // Handle conversation history updates for exposed variable
const handleConversationUpdate = (conversationHistory: any[]) => {
  // Use utility function to create complete history with system prompt
  const historyWithSystemPrompt = addSystemPromptToHistory(
    conversationHistory, 
    props.systemPrompt
  );
  
  // Expose the complete history (with system prompt) for use in queries
  dispatch(changeChildAction("conversationHistory", JSON.stringify(historyWithSystemPrompt), false));
  
  // Trigger messageReceived event when bot responds
  const lastMessage = conversationHistory[conversationHistory.length - 1];
  if (lastMessage && lastMessage.role === 'assistant') {
    props.onEvent("messageReceived");
  }
};

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        const tableName = uniqueTableName.current;
        if (tableName) {
          storage.cleanup();
        }
      };
    }, []);

    return (
      <ChatCore
        storage={storage}
        messageHandler={messageHandler}
        placeholder={props.placeholder}
        onMessageUpdate={handleMessageUpdate}
        onConversationUpdate={handleConversationUpdate}
        onEvent={props.onEvent}
      />
    );
  }
)
.setPropertyViewFn((children) => <ChatPropertyView children={children} />)
.build();

// ============================================================================
// EXPORT WITH EXPOSED VARIABLES
// ============================================================================

export const ChatComp = withExposingConfigs(ChatTmpComp, [
  new NameConfig("currentMessage", "Current user message"),
  new NameConfig("conversationHistory", "Full conversation history as JSON array (includes system prompt for API calls)"),
]);