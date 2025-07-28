// client/packages/lowcoder/src/comps/comps/chatComp/components/ChatCoreMain.tsx

import React, { useState, useEffect, useRef, useContext } from "react";
import {
  useExternalStoreRuntime,
  ThreadMessageLike,
  AppendMessage,
  AssistantRuntimeProvider,
  ExternalStoreThreadListAdapter,
} from "@assistant-ui/react";
import { Thread } from "./assistant-ui/thread";
import { ThreadList } from "./assistant-ui/thread-list";
import { 
  useChatContext, 
  ChatMessage, 
  RegularThreadData, 
  ArchivedThreadData 
} from "./context/ChatContext";
import { MessageHandler } from "../types/chatTypes";
import styled from "styled-components";
import { trans } from "i18n";
import { EditorContext, EditorState } from "@lowcoder-ee/comps/editorState";
import { configureComponentAction } from "../../preLoadComp/actions/componentConfiguration";
import { addComponentAction, moveComponentAction, nestComponentAction, resizeComponentAction } from "../../preLoadComp/actions/componentManagement";
import { applyThemeAction, configureAppMetaAction, setCanvasSettingsAction } from "../../preLoadComp/actions/appConfiguration";

// ============================================================================
// STYLED COMPONENTS (same as your current ChatMain)
// ============================================================================

const ChatContainer = styled.div`
  display: flex;
  height: 500px;

  p {
    margin: 0;
  }

  .aui-thread-list-root {
    width: 250px;
    background-color: #fff;
    padding: 10px;
  }

  .aui-thread-root {
    flex: 1;
    background-color: #f9fafb;
  }

  .aui-thread-list-item {
    cursor: pointer;
    transition: background-color 0.2s ease;

    &[data-active="true"] {
      background-color: #dbeafe;
      border: 1px solid #bfdbfe;
    }
  }
`;

// ============================================================================
// CHAT CORE MAIN - CLEAN PROPS, FOCUSED RESPONSIBILITY
// ============================================================================

interface ChatCoreMainProps {
  messageHandler: MessageHandler;
  placeholder?: string;
  onMessageUpdate?: (message: string) => void;
  onConversationUpdate?: (conversationHistory: ChatMessage[]) => void;
  // STANDARD LOWCODER EVENT PATTERN - SINGLE CALLBACK (OPTIONAL)
  onEvent?: (eventName: string) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export function ChatCoreMain({ 
  messageHandler, 
  placeholder,
  onMessageUpdate, 
  onConversationUpdate,
  onEvent
}: ChatCoreMainProps) {
  const { state, actions } = useChatContext();
  const [isRunning, setIsRunning] = useState(false);
  const editorState = useContext(EditorContext);
  const editorStateRef = useRef(editorState);

  // Keep the ref updated with the latest editorState
  useEffect(() => {
    // console.log("EDITOR STATE CHANGE ---> ", editorState);
    editorStateRef.current = editorState;
  }, [editorState]);

  // Get messages for current thread
  const currentMessages = actions.getCurrentMessages();

  // Notify parent component of conversation changes
  useEffect(() => {
    onConversationUpdate?.(currentMessages);
  }, [currentMessages]);

  // Trigger component load event on mount
  useEffect(() => {
    onEvent?.("componentLoad");
  }, [onEvent]);

  const performAction = async (actions: any[]) => {
    if (!editorStateRef.current) {
      console.error("No editorStateRef found");
      return;
    }
  
    const comp = editorStateRef.current.getUIComp().children.comp;
    if (!comp) {
      console.error("No comp found");
      return;
    }
    // const layout = comp.children.layout.getView();
    // console.log("LAYOUT", layout);
  
    for (const actionItem of actions) {
      const { action, component, ...action_payload } = actionItem;
  
      switch (action) {
        case "place_component":
          await addComponentAction.execute({
            actionKey: action,
            actionValue: "",
            actionPayload: action_payload,
            selectedComponent: component,
            selectedEditorComponent: null,
            selectedNestComponent: null,
            editorState: editorStateRef.current,
            selectedDynamicLayoutIndex: null,
            selectedTheme: null,
            selectedCustomShortcutAction: null
          });
          break;
        case "nest_component":
          await nestComponentAction.execute({
            actionKey: action,
            actionValue: "",
            actionPayload: action_payload,
            selectedComponent: component,
            selectedEditorComponent: null,
            selectedNestComponent: null,
            editorState: editorStateRef.current,
            selectedDynamicLayoutIndex: null,
            selectedTheme: null,
            selectedCustomShortcutAction: null
          });
          break;
        case "move_component":
          await moveComponentAction.execute({
            actionKey: action,
            actionValue: "",
            actionPayload: action_payload,
            selectedComponent: component,
            selectedEditorComponent: null,
            selectedNestComponent: null,
            editorState: editorStateRef.current,
            selectedDynamicLayoutIndex: null,
            selectedTheme: null,
            selectedCustomShortcutAction: null
          });
          break;
        case "resize_component":
          await resizeComponentAction.execute({
            actionKey: action,
            actionValue: "",
            actionPayload: action_payload,
            selectedComponent: component,
            selectedEditorComponent: null,
            selectedNestComponent: null,
            editorState: editorStateRef.current,
            selectedDynamicLayoutIndex: null,
            selectedTheme: null,
            selectedCustomShortcutAction: null
          });
          break;
        case "set_properties":
          await configureComponentAction.execute({
            actionKey: action,
            actionValue: component,
            actionPayload: action_payload,
            selectedEditorComponent: null,
            selectedComponent: null,
            selectedNestComponent: null,
            editorState: editorStateRef.current,
            selectedDynamicLayoutIndex: null,
            selectedTheme: null,
            selectedCustomShortcutAction: null
          });
          break;
        case "set_theme":
          await applyThemeAction.execute({
            actionKey: action,
            actionValue: component,
            actionPayload: action_payload,
            selectedEditorComponent: null,
            selectedComponent: null,
            selectedNestComponent: null,
            editorState: editorStateRef.current,
            selectedDynamicLayoutIndex: null,
            selectedTheme: null,
            selectedCustomShortcutAction: null
          });
          break;
        case "set_app_metadata":
          await configureAppMetaAction.execute({
            actionKey: action,
            actionValue: component,
            actionPayload: action_payload,
            selectedEditorComponent: null,
            selectedComponent: null,
            selectedNestComponent: null,
            editorState: editorStateRef.current,
            selectedDynamicLayoutIndex: null,
            selectedTheme: null,
            selectedCustomShortcutAction: null
          });
          break;
        case "set_canvas_setting":
          await setCanvasSettingsAction.execute({
            actionKey: action,
            actionValue: component,
            actionPayload: action_payload,
            selectedEditorComponent: null,
            selectedComponent: null,
            selectedNestComponent: null,
            editorState: editorStateRef.current,
            selectedDynamicLayoutIndex: null,
            selectedTheme: null,
            selectedCustomShortcutAction: null
          });
          break;
        default:
          break;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  // Convert custom format to ThreadMessageLike (same as your current implementation)
  const convertMessage = (message: ChatMessage): ThreadMessageLike => ({
    role: message.role,
    content: [{ type: "text", text: message.text }],
    id: message.id,
    createdAt: new Date(message.timestamp),
  });

  // Handle new message - MUCH CLEANER with messageHandler
  const onNew = async (message: AppendMessage) => {
    // Extract text from AppendMessage content array
    if (message.content.length !== 1 || message.content[0]?.type !== "text") {
      throw new Error("Only text content is supported");
    }

    // Add user message in custom format
    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      text: message.content[0].text,
      timestamp: Date.now(),
    };
    
    // Update currentMessage state to expose to queries
    onMessageUpdate?.(userMessage.text);
    
    // Update current thread with new user message
    await actions.addMessage(state.currentThreadId, userMessage);
    setIsRunning(true);

    try {
      // Use the message handler (no more complex logic here!)
      const response = await messageHandler.sendMessage(
        userMessage.text,
        state.currentThreadId,
      );

      if (response?.actions?.length) {
        performAction(response.actions);
      }

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        text: response.content,
        timestamp: Date.now(),
      };
      
      // Update current thread with assistant response
      await actions.addMessage(state.currentThreadId, assistantMessage);
    } catch (error) {
      // Handle errors gracefully
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: "assistant", 
        text: trans("chat.errorUnknown"),
        timestamp: Date.now(),
      };
      
      await actions.addMessage(state.currentThreadId, errorMessage);
    } finally {
      setIsRunning(false);
    }
  };

  // Handle edit message - CLEANER with messageHandler
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
    const editedMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      text: message.content[0].text,
      timestamp: Date.now(),
    };
    newMessages.push(editedMessage);

    // Update currentMessage state to expose to queries
    onMessageUpdate?.(editedMessage.text);

    // Update messages using the new context action
    await actions.updateMessages(state.currentThreadId, newMessages);
    setIsRunning(true);

    try {
      // Use the message handler (clean!)
      const response = await messageHandler.sendMessage(
        editedMessage.text,
        state.currentThreadId,
      );
      
      if (response?.actions?.length) {
        performAction(response.actions);
      }

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        text: response.content,
        timestamp: Date.now(),
      };
      
      newMessages.push(assistantMessage);
      await actions.updateMessages(state.currentThreadId, newMessages);
    } catch (error) {
      // Handle errors gracefully
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: "assistant", 
        text: trans("chat.errorUnknown"),
        timestamp: Date.now(),
      };
      
      newMessages.push(errorMessage);
      await actions.updateMessages(state.currentThreadId, newMessages);
    } finally {
      setIsRunning(false);
    }
  };

  // Thread list adapter for managing multiple threads (same as your current implementation)
  const threadListAdapter: ExternalStoreThreadListAdapter = {
    threadId: state.currentThreadId,
    threads: state.threadList.filter((t): t is RegularThreadData => t.status === "regular"),
    archivedThreads: state.threadList.filter((t): t is ArchivedThreadData => t.status === "archived"),

    onSwitchToNewThread: async () => {
      const threadId = await actions.createThread(trans("chat.newChatTitle"));
      actions.setCurrentThread(threadId);
      onEvent?.("threadCreated");
    },

    onSwitchToThread: (threadId) => {
      actions.setCurrentThread(threadId);
    },

    onRename: async (threadId, newTitle) => {
      await actions.updateThread(threadId, { title: newTitle });
      onEvent?.("threadUpdated");
    },

    onArchive: async (threadId) => {
      await actions.updateThread(threadId, { status: "archived" });
      onEvent?.("threadUpdated");
    },

    onDelete: async (threadId) => {
      await actions.deleteThread(threadId);
      onEvent?.("threadDeleted");
    },
  };

  const runtime = useExternalStoreRuntime({
    messages: currentMessages,
    setMessages: (messages) => {
      actions.updateMessages(state.currentThreadId, messages);
    },
    convertMessage,
    isRunning,
    onNew,
    onEdit,
    adapters: {
      threadList: threadListAdapter,
    },
  });

  if (!state.isInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ChatContainer>
        <ThreadList />
        <Thread placeholder={placeholder} />
      </ChatContainer>
    </AssistantRuntimeProvider>
  );
}
