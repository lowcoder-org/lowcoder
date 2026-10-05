// client/packages/lowcoder/src/comps/comps/chatComp/chatComp.tsx

import { UICompBuilder } from "comps/generators";
import { NameConfig, withExposingConfigs } from "comps/generators/withExposing";
import { StringControl } from "comps/controls/codeControl";
import { arrayObjectExposingStateControl, stringExposingStateControl } from "comps/controls/codeStateControl";
import { JSONObject } from "util/jsonTypes";
import { withDefault } from "comps/generators";
import QuerySelectControl from "comps/controls/querySelectControl";
import { eventHandlerControl, EventConfigType } from "comps/controls/eventHandlerControl";
import { AutoHeightControl } from "comps/controls/autoHeightControl";
import { ChatContainer } from "./components/ChatContainer";
import { ChatProvider } from "./components/context/ChatContext";
import { ChatPropertyView } from "./chatPropertyView";
import { createChatStorage } from "./utils/storageFactory";
import { QueryHandler } from "./handlers/messageHandlers";
import { useMemo, useRef } from "react";
import { changeChildAction } from "lowcoder-core";
import { ChatMessage } from "./types/chatTypes";
import { addSystemPromptToHistory } from "./utils/assistantMessages";
import { trans } from "i18n";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { styleControl } from "comps/controls/styleControl";
import {
  ChatStyle,
  ChatSidebarStyle,
  ChatMessagesStyle,
  ChatInputStyle,
  ChatSendButtonStyle,
  ChatNewThreadButtonStyle,
  ChatThreadItemStyle,
} from "comps/controls/styleControlConstants";
import { AnimationStyle } from "comps/controls/styleControlConstants";

// Assistant UI layout is styled locally with AntD and styled-components.
// Markdown-specific styles are imported by components/assistant-ui/markdown-text.tsx.

// ============================================================================
// CHAT-SPECIFIC EVENTS
// ============================================================================

export const componentLoadEvent: EventConfigType = {
  label: trans("chat.componentLoad"),
  value: "componentLoad",
  description: trans("chat.componentLoadDesc"),
};

export const messageSentEvent: EventConfigType = {
  label: trans("chat.messageSent"),
  value: "messageSent",
  description: trans("chat.messageSentDesc"),
};

export const messageReceivedEvent: EventConfigType = {
  label: trans("chat.messageReceived"),
  value: "messageReceived", 
  description: trans("chat.messageReceivedDesc"),
};

export const threadCreatedEvent: EventConfigType = {
  label: trans("chat.threadCreated"),
  value: "threadCreated",
  description: trans("chat.threadCreatedDesc"),
};

export const threadUpdatedEvent: EventConfigType = {
  label: trans("chat.threadUpdated"),
  value: "threadUpdated",
  description: trans("chat.threadUpdatedDesc"),
};

export const threadDeletedEvent: EventConfigType = {
  label: trans("chat.threadDeleted"),
  value: "threadDeleted",
  description: trans("chat.threadDeletedDesc"),
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

function generateUniqueTableName(): string {
  return `chat${Math.floor(1000 + Math.random() * 9000)}`;
 }

export const chatChildrenMap = {
  // Storage (internal, hidden)
  _internalDbName: withDefault(StringControl, ""),
  
  // Message Handler Configuration
  chatQuery: QuerySelectControl,
  systemPrompt: withDefault(StringControl, trans("chat.defaultSystemPrompt")),
  
  // UI Configuration  
  placeholder: withDefault(StringControl, trans("chat.defaultPlaceholder")),
  
  // Layout Configuration
  autoHeight: AutoHeightControl,
  leftPanelWidth: withDefault(StringControl, "250px"),
  
  // Database Information (read-only)
  databaseName: withDefault(StringControl, ""),
  
  // Event Handlers
  onEvent: ChatEventHandlerControl,
  
  // Style Controls - Consolidated to reduce prop count
  style: styleControl(ChatStyle),                      // Main container
  sidebarStyle: styleControl(ChatSidebarStyle),        // Sidebar (includes threads & new button)
  messagesStyle: styleControl(ChatMessagesStyle),      // Messages area
  inputStyle: styleControl(ChatInputStyle),            // Input + send button area
  animationStyle: styleControl(AnimationStyle),        // Animations
  
  // Legacy style props (kept for backward compatibility, consolidated internally)
  sendButtonStyle: styleControl(ChatSendButtonStyle),
  newThreadButtonStyle: styleControl(ChatNewThreadButtonStyle),
  threadItemStyle: styleControl(ChatThreadItemStyle),
  
  // Exposed Variables (not shown in Property View)
  currentMessage: stringExposingStateControl("currentMessage", ""),
  // Use arrayObjectExposingStateControl for proper Lowcoder pattern
  // This exposes: conversationHistory.value, setConversationHistory(), clearConversationHistory(), resetConversationHistory()
  conversationHistory: arrayObjectExposingStateControl("conversationHistory", [] as JSONObject[]),
};

// ============================================================================
//   CHATCOMP 
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
    
    // Create message handler (Query only)
    const messageHandler = useMemo(() => {
      return new QueryHandler({
        chatQuery: props.chatQuery.value,
        dispatch,
        systemPrompt: props.systemPrompt,
      });
    }, [
      props.chatQuery,
      props.systemPrompt,
      dispatch,
    ]);

    // Handle message updates for exposed variable
    // Using Lowcoder pattern: props.currentMessage.onChange()
    const handleMessageUpdate = (message: string) => {
      props.currentMessage.onChange(message);
      // Trigger messageSent event
      props.onEvent("messageSent");
    };

    // Handle conversation history updates for exposed variable
    // Using Lowcoder pattern: props.conversationHistory.onChange() instead of dispatch(changeChildAction(...))
    const handleConversationUpdate = (messages: ChatMessage[]) => {
      // Use utility function to create complete history with system prompt
      const historyWithSystemPrompt = addSystemPromptToHistory(
        messages, 
        props.systemPrompt
      );
      
      // Update using proper Lowcoder pattern - calling onChange on the control
      // This properly updates the exposed variable and triggers reactivity
      props.conversationHistory.onChange(historyWithSystemPrompt as JSONObject[]);
      
      // Trigger messageReceived event when bot responds
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        props.onEvent("messageReceived");
      }
    };

    // custom styles
    const styles = {
      style: props.style,
      sidebarStyle: props.sidebarStyle,
      messagesStyle: props.messagesStyle,
      inputStyle: props.inputStyle,
      sendButtonStyle: props.sendButtonStyle,
      newThreadButtonStyle: props.newThreadButtonStyle,
      threadItemStyle: props.threadItemStyle,
      animationStyle: props.animationStyle,
    };

    return (
      <TooltipProvider>
        <ChatProvider storage={storage}>
          <ChatContainer
            messageHandler={messageHandler}
            placeholder={props.placeholder}
            autoHeight={props.autoHeight}
            sidebarWidth={props.leftPanelWidth}
            onMessageUpdate={handleMessageUpdate}
            onConversationUpdate={handleConversationUpdate}
            onEvent={props.onEvent}
            {...styles}
          />
        </ChatProvider>
      </TooltipProvider>
    );
  }
)
.setPropertyViewFn((children) => <ChatPropertyView children={children} />)
.build();

// Override autoHeight to support AUTO/FIXED height mode
const ChatCompWithAutoHeight = class extends ChatTmpComp {
  override autoHeight(): boolean {
    return this.children.autoHeight.getView();
  }
};

// ============================================================================
//  EXPOSED VARIABLES
// ============================================================================

export const ChatComp = withExposingConfigs(ChatCompWithAutoHeight, [
  new NameConfig("currentMessage", "Current user message"),
  // conversationHistory is now a proper array (not JSON string) - supports setConversationHistory(), clearConversationHistory(), resetConversationHistory()
  new NameConfig("conversationHistory", "Reactive conversation history array with system prompt (no JSON.parse needed)"),
  new NameConfig("databaseName", "Database name for SQL queries (ChatDB_<componentName>)"),
]);
