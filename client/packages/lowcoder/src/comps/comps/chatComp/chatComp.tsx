// client/packages/lowcoder/src/comps/comps/chatComp/chatComp.tsx

import { UICompBuilder } from "comps/generators";
import { NameConfig, withExposingConfigs } from "comps/generators/withExposing";
import { StringControl } from "comps/controls/codeControl";
import { arrayObjectExposingStateControl, stringExposingStateControl } from "comps/controls/codeStateControl";
import { withDefault } from "comps/generators";
import { BoolControl } from "comps/controls/boolControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import QuerySelectControl from "comps/controls/querySelectControl";
import { ChatCore } from "./components/ChatCore";
import { ChatPropertyView } from "./chatPropertyView";
import { createChatStorage } from "./utils/storageFactory";
import { QueryHandler, createMessageHandler } from "./handlers/messageHandlers";
import { useMemo, useRef, useEffect } from "react";  
import { changeChildAction } from "lowcoder-core";

import "@assistant-ui/styles/index.css";
import "@assistant-ui/styles/markdown.css";

// ============================================================================
// SIMPLIFIED CHILDREN MAP - ONLY ESSENTIAL PROPS
// ============================================================================

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
          streaming: props.streaming
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
      dispatch
    ]);

    // Handle message updates for exposed variable
    const handleMessageUpdate = (message: string) => {
      dispatch(changeChildAction("currentMessage", message, false));
    };

    // Handle conversation history updates for exposed variable
    const handleConversationUpdate = (conversationHistory: any[]) => {
      // Format conversation history for use in queries
      const formattedHistory = conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.text,
        timestamp: msg.timestamp
      }));
      dispatch(changeChildAction("conversationHistory", JSON.stringify(formattedHistory), false));
    };

       // Cleanup on unmount
       useEffect(() => {
        console.log("cleanup on unmount");
        return () => {
          console.log("cleanup on unmount");
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
        onMessageUpdate={handleMessageUpdate}
        onConversationUpdate={handleConversationUpdate}
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
  new NameConfig("conversationHistory", "Full conversation history as JSON array"),
]);