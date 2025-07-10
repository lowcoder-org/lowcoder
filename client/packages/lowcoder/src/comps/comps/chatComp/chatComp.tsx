// client/packages/lowcoder/src/comps/comps/chatComp/chatComp.tsx

import { UICompBuilder } from "comps/generators";
import { NameConfig, withExposingConfigs } from "comps/generators/withExposing";
import { StringControl } from "comps/controls/codeControl";
import { stringExposingStateControl } from "comps/controls/codeStateControl";
import { withDefault } from "comps/generators";
import { BoolControl } from "comps/controls/boolControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import QuerySelectControl from "comps/controls/querySelectControl";
import { ChatCore } from "./components/ChatCore";
import { ChatPropertyView } from "./chatPropertyView";
import { createChatStorage } from "./utils/storageFactory";
import { QueryHandler, createMessageHandler } from "./handlers/messageHandlers";
import { useMemo } from "react";
import { changeChildAction } from "lowcoder-core";

import "@assistant-ui/styles/index.css";
import "@assistant-ui/styles/markdown.css";

// ============================================================================
// SIMPLIFIED CHILDREN MAP - ONLY ESSENTIAL PROPS
// ============================================================================

const ModelTypeOptions = [
  { label: "Query", value: "query" },
  { label: "N8N Workflow", value: "n8n" },
] as const;

export const chatChildrenMap = {
  // Storage
  tableName: withDefault(StringControl, "default"),
  
  // Message Handler Configuration
  handlerType: dropdownControl(ModelTypeOptions, "query"),
  chatQuery: QuerySelectControl,                    // Only used for "query" type
  modelHost: withDefault(StringControl, ""),        // Only used for "n8n" type
  systemPrompt: withDefault(StringControl, "You are a helpful assistant."),
  streaming: BoolControl.DEFAULT_TRUE,
  
  // UI Configuration  
  placeholder: withDefault(StringControl, "Chat Component"),
  
  // Exposed Variables (not shown in Property View)
  currentMessage: stringExposingStateControl("currentMessage", ""),
};

// ============================================================================
// CLEAN CHATCOMP - USES NEW ARCHITECTURE
// ============================================================================

const ChatTmpComp = new UICompBuilder(
  chatChildrenMap,
  (props, dispatch) => {
    // Create storage from tableName
    const storage = useMemo(() => 
      createChatStorage(props.tableName), 
      [props.tableName]
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

    return (
      <ChatCore
        storage={storage}
        messageHandler={messageHandler}
        onMessageUpdate={handleMessageUpdate}
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
]);