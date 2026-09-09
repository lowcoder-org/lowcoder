// client/packages/lowcoder/src/comps/comps/chatComp/components/ChatPanelContainer.tsx

import React, { useState, useEffect, useRef, useContext } from "react";
import {
  useExternalStoreRuntime,
  ThreadMessageLike,
  AssistantRuntimeProvider,
} from "@assistant-ui/react";
import type {
  AppendMessage,
  ExternalStoreThreadListAdapter,
} from "@assistant-ui/react";
import { Thread } from "components/assistant-ui/thread";
import { ThreadList } from "components/assistant-ui/thread-list";
import { 
  ChatProvider,
  useChatContext, 
  RegularThreadData,
} from "./context/ChatContext";
import { AIAssistantMessageHandler, ChatMessage } from "../types/chatTypes";
import styled from "styled-components";
import { trans } from "i18n";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import {
  createAssistantErrorMessage,
  createUserMessage,
  getAutomatorActionsFromMessage,
  getTextFromAppendMessage,
  getTextFromThreadContent,
  maybeUpdateInitialThreadTitle,
  toChatMessage,
  toExternalThreadData,
} from "../utils/assistantMessages";

import { EditorContext } from "@lowcoder-ee/comps/editorState";
import { ActionConfig, ActionExecuteParams } from "../../preLoadComp/types";
import { configureComponentAction } from "../../preLoadComp/actions/componentConfiguration";
import {
  addComponentAction,
  moveComponentAction,
  nestComponentAction,
  resizeComponentAction,
  deleteComponentAction,
  renameComponentAction,
} from "../../preLoadComp/actions/componentManagement";
import {
  applyThemeAction,
  configureAppMetaAction,
  setCanvasSettingsAction,
  applyGlobalJSAction,
  applyCSSAction,
  publishAppAction,
} from "../../preLoadComp/actions/appConfiguration";
import { applyStyleAction } from "../../preLoadComp/actions/componentStyling";
import { addEventHandlerAction } from "../../preLoadComp/actions/componentEvents";
import { alignComponentAction } from "../../preLoadComp/actions/componentLayout";
import { deleteQueryAction } from "../../preLoadComp/actions/queryManagement";

// ============================================================================
// ACTION REGISTRY — maps LLM action names to their executor configs.
// Adding a new action is one line here + one entry in actionsCatalog.ts.
// ============================================================================

const ACTION_REGISTRY: Record<string, ActionConfig> = {
  place_component: addComponentAction,
  nest_component: nestComponentAction,
  move_component: moveComponentAction,
  resize_component: resizeComponentAction,
  delete_component: deleteComponentAction,
  delete_query: deleteQueryAction,
  rename_component: renameComponentAction,
  set_properties: configureComponentAction,
  set_style: applyStyleAction,
  set_theme: applyThemeAction,
  set_app_metadata: configureAppMetaAction,
  set_canvas_setting: setCanvasSettingsAction,
  set_global_javascript: applyGlobalJSAction,
  set_global_css: applyCSSAction,
  publish_app: publishAppAction,
  add_event_handler: addEventHandlerAction,
  align_component: alignComponentAction,
};

/**
 * Translate an LLM action object into the ActionExecuteParams shape that
 * the legacy executor functions expect. Centralises the field-mapping so
 * each executor doesn't need to know about the automator format.
 */
function buildExecuteParams(
  actionItem: Record<string, any>,
  editorState: any
): ActionExecuteParams {
  const ap = actionItem.action_parameters || {};

  let actionValue = "";
  switch (actionItem.action) {
    case "rename_component":       actionValue = ap.new_name || ""; break;
    case "align_component":        actionValue = ap.alignment || "center"; break;
    case "add_event_handler":      actionValue = `${ap.event || "click"}: ${ap.action_type || "message"}`; break;
    case "set_global_javascript":  actionValue = ap.code || ""; break;
    case "set_global_css":         actionValue = ap.code || ""; break;
  }

  return {
    actionKey: actionItem.action,
    actionValue,
    actionPayload: actionItem,
    selectedComponent: actionItem.component || null,
    selectedEditorComponent: actionItem.component_name || null,
    selectedNestComponent: null,
    editorState,
    selectedDynamicLayoutIndex: null,
    selectedTheme: null,
    selectedCustomShortcutAction: null,
  };
}

// ============================================================================
// STYLED CONTAINER - SIMPLE FIXED STYLING FOR BOTTOM PANEL
// ============================================================================

const StyledChatContainer = styled.div<{
  autoHeight?: boolean;
  sidebarWidth?: string;
}>`
  display: flex;
  height: ${(props) => (props.autoHeight ? "auto" : "100%")};
  min-height: ${(props) => (props.autoHeight ? "300px" : "unset")};
  min-width: 0;
  overflow: hidden;

  p {
    margin: 0;
  }

  .aui-thread-list-root {
    width: ${(props) => props.sidebarWidth || "250px"};
    background-color: #fff;
    padding: 10px;
    min-height: 0;
    overflow-y: auto;
  }

  .aui-thread-root {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 0;
    background-color: #f9fafb;
    height: 100%;
    overflow: hidden;
  }

  .aui-thread-viewport {
    min-height: 0;
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
// CHAT PANEL CONTAINER - DIRECT RENDERING
// ============================================================================

export interface ChatPanelContainerProps {
  storage: any;
  messageHandler: AIAssistantMessageHandler;
  placeholder?: string;
  onMessageUpdate?: (message: string) => void;
}

function ChatPanelView({ messageHandler, placeholder, onMessageUpdate }: Omit<ChatPanelContainerProps, 'storage'>) {
  const { state, actions } = useChatContext();
  const [isRunning, setIsRunning] = useState(false);
  const editorState = useContext(EditorContext);
  const editorStateRef = useRef(editorState);

  const currentMessages = actions.getCurrentMessages();

  // Keep the ref updated with the latest editorState
  useEffect(() => {
    // console.log("EDITOR STATE CHANGE ---> ", editorState);
    editorStateRef.current = editorState;
  }, [editorState]);

  const performAction = async (actions: any[]) => {
    if (!editorStateRef.current) {
      console.error("[Automator] no editorState — skipping actions");
      return;
    }

    console.log(`[Automator] executing ${actions.length} action(s)`);
    let executed = 0;

    for (const actionItem of actions) {
      const executor = ACTION_REGISTRY[actionItem.action];
      if (!executor) {
        console.warn(`[Automator] unsupported action: ${actionItem.action}`);
        continue;
      }
      try {
        const params = buildExecuteParams(actionItem, editorStateRef.current);
        await executor.execute(params);
        executed++;
      } catch (err) {
        console.error(`[Automator] action "${actionItem.action}" failed:`, err);
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    console.log(`[Automator] done: ${executed}/${actions.length} succeeded`);
  };

  const convertMessage = (message: ChatMessage): ThreadMessageLike => message;

  const updateInitialThreadTitle = async (userMessage: ChatMessage) => {
    await maybeUpdateInitialThreadTitle(
      userMessage,
      state.threadList,
      state.currentThreadId,
      currentMessages.length,
      actions.updateThread
    );
  };

  const onNew = async (message: AppendMessage) => {
    const text = getTextFromAppendMessage(message);
  
    if (!text) {
      throw new Error("Cannot send an empty message");
    }
  
    const userMessage = createUserMessage(text);
  
    const conversationHistory = [...currentMessages, userMessage];
  
    await actions.addMessage(state.currentThreadId, userMessage);
    await updateInitialThreadTitle(userMessage);
    setIsRunning(true);
  
    try {
      const assistantMessage = await messageHandler.sendMessage(
        userMessage,
        state.currentThreadId,
        conversationHistory
      );
      onMessageUpdate?.(getTextFromThreadContent(userMessage.content));

      const automatorActions = getAutomatorActionsFromMessage(assistantMessage);
      if (automatorActions.length) {
        await performAction(automatorActions);
      }

      await actions.addMessage(
        state.currentThreadId,
        assistantMessage
      );
    } catch (error) {
      await actions.addMessage(
        state.currentThreadId,
        createAssistantErrorMessage(trans("chat.errorUnknown"))
      );
    } finally {
      setIsRunning(false);
    }
  };

  const onEdit = async (message: AppendMessage) => {
    const text = getTextFromAppendMessage(message);
  
    if (!text) {
      throw new Error("Cannot send an empty message");
    }
  
    const index = currentMessages.findIndex((m) => m.id === message.parentId) + 1;
    const newMessages = [...currentMessages.slice(0, index)];
  
    newMessages.push(createUserMessage(text));
  
    await actions.updateMessages(state.currentThreadId, newMessages);
    setIsRunning(true);
  
    try {
      const assistantMessage = await messageHandler.sendMessage(
        newMessages[newMessages.length - 1],
        state.currentThreadId,
        newMessages
      );
      onMessageUpdate?.(text);

      const automatorActions = getAutomatorActionsFromMessage(assistantMessage);
      if (automatorActions.length) {
        await performAction(automatorActions);
      }

      newMessages.push(assistantMessage);
      await actions.updateMessages(state.currentThreadId, newMessages);
    } catch (error) {
      newMessages.push(createAssistantErrorMessage(trans("chat.errorUnknown")));
      await actions.updateMessages(state.currentThreadId, newMessages);
    } finally {
      setIsRunning(false);
    }
  };

  const threadListAdapter: ExternalStoreThreadListAdapter = {
    threadId: state.currentThreadId,
    threads: state.threadList
      .filter((t): t is RegularThreadData => t.status === "regular")
      .map(toExternalThreadData),

    onSwitchToNewThread: async () => {
      const threadId = await actions.createThread(trans("chat.newChatTitle"));
      actions.setCurrentThread(threadId);
    },

    onSwitchToThread: (threadId) => {
      actions.setCurrentThread(threadId);
    },

    onRename: async (threadId, newTitle) => {
      await actions.updateThread(threadId, { title: newTitle });
    },

    onDelete: async (threadId) => {
      await actions.deleteThread(threadId);
    },
  };

  const runtime = useExternalStoreRuntime({
    messages: currentMessages,
    setMessages: (messages) =>
      actions.updateMessages(
        state.currentThreadId,
        messages.map(toChatMessage)
      ),
    convertMessage,
    isRunning,
    onNew,
    onEdit,
    adapters: {
      threadList: threadListAdapter,
      // No attachments support for bottom panel chat
    },
  });

  if (!state.isInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <StyledChatContainer>
        <ThreadList />
        <Thread
          placeholder={placeholder}
          showAttachments={false}
          suggestionMode="automator"
        />
      </StyledChatContainer>
    </AssistantRuntimeProvider>
  );
}

// ============================================================================
// EXPORT - WITH PROVIDERS
// ============================================================================

export function ChatPanelContainer({ storage, messageHandler, placeholder, onMessageUpdate }: ChatPanelContainerProps) {
  return (
    <TooltipProvider>
      <ChatProvider storage={storage}>
        <ChatPanelView 
          messageHandler={messageHandler}
          placeholder={placeholder}
          onMessageUpdate={onMessageUpdate}
        />
      </ChatProvider>
    </TooltipProvider>
  );
}
