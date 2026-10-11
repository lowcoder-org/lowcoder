import {
  AssistantRuntimeProvider,
  type AppendMessage,
  type ThreadMessageLike,
  useAssistantToolUI,
  useExternalStoreRuntime,
} from "@assistant-ui/react";
import { useCallback, useMemo, useState } from "react";

import { Thread } from "components/assistant-ui/thread";
import type { ChatMessage } from "comps/comps/chatComp/types/chatTypes";
import {
  createAssistantErrorMessage,
  createUserMessage,
  getTextFromAppendMessage,
  toChatMessage,
} from "comps/comps/chatComp/utils/assistantMessages";

import { ApplyActions } from "./components/ApplyActions";
import { AIHelperQueryHandler } from "./handlers/AIHelperQueryHandler";
import { useAIHelper } from "./context/AIHelperController";
import {
  AI_HELPER_APPLY_TOOL,
  type AIHelperApplyAction,
  type AIHelperTarget,
} from "./types";

interface ApplyToolArgs {
  value: string;
  mode: AIHelperApplyAction["mode"];
  label?: string;
  language?: string;
}

function AIHelperApplyToolUI() {
  const helper = useAIHelper();

  const render = useCallback(
    ({ args }: { args: ApplyToolArgs }) => {
      const action: AIHelperApplyAction = {
        id: AI_HELPER_APPLY_TOOL,
        label: args.label ?? "Apply",
        value: args.value,
        mode: args.mode,
        language: args.language,
      };

      return (
        <ApplyActions
          actions={[action]}
          onApply={(action) => helper?.applyResult(action)}
        />
      );
    },
    [helper]
  );

  const tool = useMemo(
    () => ({
      toolName: AI_HELPER_APPLY_TOOL,
      render,
    }),
    [render]
  );

  useAssistantToolUI(tool);

  return null;
}

export function AIHelperRuntime({
  helperQueryName,
  dispatch,
  getDatasourceStructures,
  target,
}: {
  helperQueryName: string;
  dispatch: any;
  getDatasourceStructures: () => Record<string, any> | undefined;
  target: AIHelperTarget;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const handler = useMemo(
    () =>
      new AIHelperQueryHandler({
        helperQueryName,
        dispatch,
        getDatasourceStructures,
        target,
      }),
    [
      helperQueryName,
      dispatch,
      getDatasourceStructures,
      target,
    ]
  );

  const onNew = useCallback(
    async (message: AppendMessage) => {
      const text = getTextFromAppendMessage(message);
      if (!text) throw new Error("Cannot send an empty message");

      const userMessage = createUserMessage(text);
      const conversationHistory = [...messages, userMessage];
      setMessages(conversationHistory);
      setIsRunning(true);

      try {
        const assistantMessage = await handler.sendMessage(conversationHistory);
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error: any) {
        setMessages((prev) => [
          ...prev,
          createAssistantErrorMessage(error?.message || "AI Helper failed"),
        ]);
      } finally {
        setIsRunning(false);
      }
    },
    [handler, messages]
  );

  const runtime = useExternalStoreRuntime({
    messages,
    setMessages: (next) => setMessages(next.map(toChatMessage)),
    convertMessage: (message: ChatMessage): ThreadMessageLike => message,
    isRunning,
    onNew,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <AIHelperApplyToolUI />
      <Thread placeholder="Ask about this field..." showAttachments={false} />
    </AssistantRuntimeProvider>
  );
}
