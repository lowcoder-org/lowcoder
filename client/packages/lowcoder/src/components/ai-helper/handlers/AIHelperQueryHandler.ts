import { executeQueryAction, routeByNameAction } from "lowcoder-core";
import { getPromiseAfterDispatch } from "util/promiseUtils";

import type { ChatMessage } from "comps/comps/chatComp/types/chatTypes";
import {
  getTextFromThreadContent,
  toAssistantMessage,
} from "comps/comps/chatComp/utils/assistantMessages";

import {
  buildAIHelperTargetContext,
  buildAIHelperSystemMessage,
  buildAIHelperTools,
  type AIHelperTargetContext,
} from "../context/buildAIHelperContext";
import type { AIHelperTarget } from "../types";

interface AIHelperQueryHandlerConfig {
  helperQueryName: string;
  dispatch: any;
  getDatasourceStructures: () => Record<string, any> | undefined;
  target: AIHelperTarget;
}

function buildHelperPayload(args: {
  conversationHistory: ChatMessage[];
  target: AIHelperTargetContext;
}) {
  const { conversationHistory, target } = args;
  const messagesWithoutSystem = conversationHistory.map((msg) => ({
    role: msg.role,
    content: getTextFromThreadContent(msg.content),
  }));
  const system = buildAIHelperSystemMessage(target);
  const tools = buildAIHelperTools();
  const messages = [
    { role: "system" as const, content: system },
    ...messagesWithoutSystem,
  ];

  return {
    mode: "helper" as const,
    messages,
    tools,
    target,
  };
}

export class AIHelperQueryHandler {
  constructor(private readonly config: AIHelperQueryHandlerConfig) {}

  async sendMessage(conversationHistory: ChatMessage[]): Promise<ChatMessage> {
    const {
      helperQueryName,
      dispatch,
      getDatasourceStructures,
      target,
    } = this.config;

    if (!helperQueryName) {
      throw new Error("Select an AI query before sending a message");
    }
    if (!dispatch) {
      throw new Error("AI Helper dispatch is unavailable");
    }

    const targetContext = buildAIHelperTargetContext({
      datasourceStructures: getDatasourceStructures(),
      target,
    });
    const ai = buildHelperPayload({
      conversationHistory,
      target: targetContext,
    });

    const result: any = await getPromiseAfterDispatch(
      dispatch,
      routeByNameAction(
        helperQueryName,
        executeQueryAction({
          args: {
            ai: { value: ai },
          },
        })
      )
    );

    return toAssistantMessage(result);
  }
}
