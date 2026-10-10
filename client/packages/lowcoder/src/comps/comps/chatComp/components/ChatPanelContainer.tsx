import { AutomatorBuildCard } from "components/automator/AutomatorBuildCard";
import { AutomatorLanguageGuide } from "components/automator/AutomatorLanguageGuide";
import { applyAutomatorRecipe, AutomatorBuildState } from "components/automator/buildState";
import { readAutomatorBuildResult, withAutomatorBuildResult } from "components/automator/buildMessage";
import { preview } from "constants/routesURL";
import { assertAiRobotAccess } from "util/assertAiRobotAccess";
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
import { AutomatorHistory } from "components/automator/AutomatorHistory";
import { AutomatorStart } from "components/automator/AutomatorStart";
import { AutomatorStudio } from "components/automator/AutomatorStudio.styles";
import { Sparkles } from "lucide-react";
import { 
  ChatProvider,
  useChatContext, 
  RegularThreadData,
  NEW_THREAD_ID,
} from "./context/ChatContext";
import { AIAssistantMessageHandler, ChatMessage } from "../types/chatTypes";
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
    suppressSuccessNotifications: true,
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
  const [run, setRun] = useState<{ threadId: string; build: AutomatorBuildState }>();
  const [recipeOpen, setRecipeOpen] = useState(false);
  const editorState = useContext(EditorContext);
  const editorStateRef = useRef(editorState);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const currentMessages = actions.getCurrentMessages();

  // Keep the ref updated with the latest editorState
  useEffect(() => {
    // console.log("EDITOR STATE CHANGE ---> ", editorState);
    editorStateRef.current = editorState;
  }, [editorState]);

  const applicationId = editorState?.rootComp.preloadId.replace(/^app-/, "") || "";
  const storedBuild = readAutomatorBuildResult(currentMessages[currentMessages.length - 1], applicationId);
  // Completed reports render with their own message; only the current live run sits below the conversation.
  const visibleBuild = run?.threadId === state.currentThreadId && run.build.startedAt !== storedBuild?.startedAt ? run.build : undefined;

  const requestBuild = async (userMessage: ChatMessage, threadId: string, history: ChatMessage[]) => {
    const workspaceId = assertAiRobotAccess();
    let build: AutomatorBuildState = { phase: "planning", startedAt: Date.now(), recipe: [], steps: [] };
    const updateBuild = (changes: Partial<AutomatorBuildState>) => {
      build = { ...build, ...changes };
      if (mounted.current) setRun({ threadId, build });
    };
    updateBuild({});
    let assistantMessage: ChatMessage | undefined;
    try {
      assistantMessage = await messageHandler.sendMessage(userMessage, threadId, history);
      onMessageUpdate?.(getTextFromThreadContent(userMessage.content));
      const recipe = getAutomatorActionsFromMessage(assistantMessage);
      if (!recipe.length) {
        if (mounted.current) setRun(undefined);
        return assistantMessage;
      }
      updateBuild({ phase: "applying", recipe });
      const steps = await applyAutomatorRecipe(recipe, async (actionItem, onError) => {
        const executor = ACTION_REGISTRY[actionItem.action];
        if (!executor) throw new Error(trans("automator.build.unsupported", { action: String(actionItem.action) }));
        await executor.execute({ ...buildExecuteParams(actionItem, editorStateRef.current), onError });
      }, () => {
        if (!mounted.current || !editorStateRef.current) throw new Error(trans("automator.build.interrupted"));
        assertAiRobotAccess(workspaceId);
      }, (steps, current) => updateBuild({ steps, current }));
      const succeeded = steps.filter(step => step.status === "done").length;
      updateBuild({ phase: succeeded === steps.length ? "complete" : succeeded ? "partial" : "failed", finishedAt: Date.now() });
      return withAutomatorBuildResult(assistantMessage, build, applicationId);
    } catch (error) {
      updateBuild({ phase: "failed", current: undefined, finishedAt: Date.now() });
      const failure = createAssistantErrorMessage(trans("chat.errorUnknown"), error);
      return assistantMessage && build.recipe.length
        ? withAutomatorBuildResult({ ...failure, content: [...assistantMessage.content, ...failure.content] }, build, applicationId)
        : failure;
    }
  };

  const convertMessage = (message: ChatMessage): ThreadMessageLike => message;

  const updateInitialThreadTitle = async (userMessage: ChatMessage, threadId: string) => {
    await maybeUpdateInitialThreadTitle(
      userMessage,
      state.threadList,
      threadId,
      currentMessages.length,
      actions.updateThread
    );
  };

  const onNew = async (message: AppendMessage) => {
    assertAiRobotAccess();
    const text = getTextFromAppendMessage(message);
  
    if (!text) {
      throw new Error(trans("automator.chat.emptyMessage"));
    }
  
    const userMessage = createUserMessage(text);
    const conversationHistory = [...currentMessages, userMessage];

    let threadId = state.currentThreadId;
    if (threadId === NEW_THREAD_ID) {
      threadId = await actions.createThread(trans("chat.newChatTitle"));
      actions.setCurrentThread(threadId);
    }

    await actions.addMessage(threadId, userMessage);
    await updateInitialThreadTitle(userMessage, threadId);
    setIsRunning(true);
  
    try {
      const assistantMessage = await requestBuild(userMessage, threadId, conversationHistory);

      await actions.addMessage(
        threadId,
        assistantMessage
      );
    } catch (error) {
      await actions.addMessage(
        threadId,
        createAssistantErrorMessage(trans("chat.errorUnknown"), error)
      );
    } finally {
      setIsRunning(false);
    }
  };

  const onEdit = async (message: AppendMessage) => {
    assertAiRobotAccess();
    const text = getTextFromAppendMessage(message);
  
    if (!text) {
      throw new Error(trans("automator.chat.emptyMessage"));
    }
  
    const index = currentMessages.findIndex((m) => m.id === message.parentId) + 1;
    const newMessages = [...currentMessages.slice(0, index)];
  
    newMessages.push(createUserMessage(text));
  
    await actions.updateMessages(state.currentThreadId, newMessages);
    setIsRunning(true);
  
    try {
      const assistantMessage = await requestBuild(newMessages[newMessages.length - 1], state.currentThreadId, newMessages);

      newMessages.push(assistantMessage);
      await actions.updateMessages(state.currentThreadId, newMessages);
    } catch (error) {
      newMessages.push(createAssistantErrorMessage(trans("chat.errorUnknown"), error));
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

    onSwitchToNewThread: () => {
      actions.setCurrentThread(NEW_THREAD_ID);
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
    return <div>{trans("automator.chat.loading")}</div>;
  }

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <AutomatorStudio>
        <AutomatorHistory />
        <Thread
          placeholder={placeholder || trans("automator.studio.placeholder")}
          presentation="automator"
          welcome={<AutomatorStart />}
          composerFooter={<div className="automator-composer-note"><Sparkles size={10} />{trans("automator.studio.composerNote")}</div>}
          showAttachments={false}
          suggestionMode="automator"
          showLoadingIndicator={false}
          activity={visibleBuild && <AutomatorBuildCard build={visibleBuild}
            onPreview={() => preview(applicationId)} onRecipe={() => setRecipeOpen(true)} />}
        />
      </AutomatorStudio>
      {recipeOpen && visibleBuild && <AutomatorLanguageGuide recipe={visibleBuild.recipe} onClose={() => setRecipeOpen(false)} />}
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
          placeholder={placeholder || trans("automator.studio.placeholder")}
          onMessageUpdate={onMessageUpdate}
        />
      </ChatProvider>
    </TooltipProvider>
  );
}
