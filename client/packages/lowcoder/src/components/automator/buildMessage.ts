import type { ChatMessage } from "comps/comps/chatComp/types/chatTypes";
import { getAutomatorActionsFromMessage } from "comps/comps/chatComp/utils/assistantMessages";
import type { AutomatorBuildState, AutomatorRecipeAction } from "./buildState";

// Keep the result with the tool call so the finish card survives tab switches and reloads.
export function withAutomatorBuildResult(
  message: ChatMessage,
  build: AutomatorBuildState,
  applicationId: string,
): ChatMessage {
  const { recipe, current, ...report } = build;
  let attached = false;
  return {
    ...message,
    content: message.content.map((part) => {
      if (
        attached ||
        part.type !== "tool-call" ||
        part.toolName !== "execute_automator_actions"
      )
        return part;
      attached = true;
      return {
        ...part,
        result: { automatorBuild: { version: 1, applicationId, ...report } },
      };
    }),
  };
}

export function readAutomatorBuildResult(
  message: ChatMessage | undefined,
  applicationId: string,
): AutomatorBuildState | undefined {
  if (!message || message.role !== "assistant") return;
  const part = message.content.find(
    (part) =>
      part.type === "tool-call" &&
      part.toolName === "execute_automator_actions",
  );
  if (part?.type !== "tool-call") return;
  return readAutomatorBuildReport(
    part.result,
    getAutomatorActionsFromMessage(message),
    applicationId,
  );
}

export function readAutomatorBuildReport(
  result: unknown,
  recipe: AutomatorRecipeAction[],
  applicationId: string,
): AutomatorBuildState | undefined {
  const report = (result as any)?.automatorBuild;
  if (
    report?.version !== 1 ||
    report.applicationId !== applicationId ||
    !Array.isArray(report.steps) ||
    !["complete", "partial", "failed"].includes(report.phase) ||
    !Number.isFinite(report.startedAt) ||
    !Number.isFinite(report.finishedAt)
  )
    return;
  return {
    phase: report.phase,
    startedAt: report.startedAt,
    finishedAt: report.finishedAt,
    steps: report.steps,
    recipe,
  };
}
