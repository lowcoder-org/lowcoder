import styled from "styled-components";
import { AutomatorRecipeMessage } from "components/automator/AutomatorRecipeMessage";
import { trans } from "i18n";
import {
  ActionBarMorePrimitive,
  ActionBarPrimitive,
  AuiIf,
  BranchPickerPrimitive,
  ErrorPrimitive,
  getMcpAppFromToolPart,
  MessagePrimitive,
  useAuiState,
} from "@assistant-ui/react";
import {
  CheckIcon,
  Sparkles,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  MoreHorizontalIcon,
  PencilIcon,
} from "lucide-react";
import type { FC } from "react";

import { AssistantMessageLoader } from "./assistant-message-loader";
import { MarkdownText } from "./markdown-text";
import { EditComposer } from "./thread-composer";
import {
  Reasoning,
  ReasoningContent,
  ReasoningRoot,
  ReasoningText,
  ReasoningTrigger,
} from "./reasoning";
import {
  ToolGroupContent,
  ToolGroupRoot,
  ToolGroupTrigger,
} from "./tool-group";
import { ToolFallback } from "./tool-fallback";
import { TooltipIconButton } from "./tooltip-icon-button";
import { UserMessageAttachments } from "./ui/attachment";

export const ThreadMessage: FC<{ showAttachments?: boolean; showLoadingIndicator?: boolean; presentation?: "chat" | "automator" }> = ({
  showAttachments = true,
  showLoadingIndicator = true,
  presentation = "chat",
}) => {
  const role = useAuiState((s) => s.message.role);
  const isEditing = useAuiState((s) => s.message.composer.isEditing);

  if (isEditing) return <EditComposer />;
  if (role === "user") return <UserMessage showAttachments={showAttachments} />;
  return <AssistantMessage showLoadingIndicator={showLoadingIndicator} automator={presentation === "automator"} />;
};

const MessageError: FC = () => {
  return (
    <MessagePrimitive.Error>
      <ErrorPrimitive.Root className="aui-message-error-root">
        <ErrorPrimitive.Message className="aui-message-error-message" />
      </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
  );
};

const AssistantMessage: FC<{ showLoadingIndicator: boolean; automator: boolean }> = ({ showLoadingIndicator, automator }) => {
  const hasText = useAuiState(s => s.message.parts.some(part => part.type === "text" && part.text.trim().length > 0));
  const hasContent = useAuiState(s => s.message.parts.length > 0);
  const isEmptyRunningMessage = useAuiState(
    (s) =>
      s.message.parts.length === 0 &&
      (s.message.status?.type ?? "complete") === "running"
  );

  return (
    <MessagePrimitive.Root
      data-slot="aui_assistant-message-root"
      data-role="assistant"
      className="aui-assistant-message-root"
    >
      {automator && hasContent && <div className="automator-speaker"><Sparkles size={12} />Automator</div>}
      <div
        data-slot="aui_assistant-message-content"
        className="aui-assistant-message-content"
      >
        {showLoadingIndicator && isEmptyRunningMessage && <AssistantMessageLoader />}
        <MessagePrimitive.GroupedParts
          groupBy={(part) => {
            if (part.type === "reasoning")
              return ["group-chainOfThought", "group-reasoning"];
            if (part.type === "tool-call") {
              if (automator && part.toolName === "execute_automator_actions") return null;
              if (getMcpAppFromToolPart(part)) return null;
              return ["group-chainOfThought", "group-tool"];
            }
            return null;
          }}
        >
          {({ part, children }) => {
            switch (part.type) {
              case "group-chainOfThought":
                return <div data-slot="aui_chain-of-thought">{children}</div>;
              case "group-reasoning": {
                const running = part.status.type === "running";
                return (
                  <ReasoningRoot defaultOpen={running}>
                    <ReasoningTrigger active={running} />
                    <ReasoningContent aria-busy={running}>
                      <ReasoningText>{children}</ReasoningText>
                    </ReasoningContent>
                  </ReasoningRoot>
                );
              }
              case "group-tool":
                return (
                  <ToolGroupRoot>
                    <ToolGroupTrigger
                      count={part.indices.length}
                      active={part.status.type === "running"}
                    />
                    <ToolGroupContent>{children}</ToolGroupContent>
                  </ToolGroupRoot>
                );
              case "text":
                if (part.status?.type === "running" && part.text === "") {
                  return showLoadingIndicator ? <AssistantMessageLoader /> : null;
                }
                return <MarkdownText />;
              case "reasoning":
                return <Reasoning {...part} />;
              case "tool-call":
                if (automator && part.toolName === "execute_automator_actions") return <AutomatorRecipeMessage {...part} />;
                return part.toolUI ?? <ToolFallback {...part} />;
              default:
                return null;
            }
          }}
        </MessagePrimitive.GroupedParts>
        <MessageError />
      </div>

      {(!automator || hasText) && <div
        data-slot="aui_assistant-message-footer"
        className="aui-assistant-message-footer"
      >
        <BranchPicker />
        <AssistantActionBar />
      </div>}
    </MessagePrimitive.Root>
  );
};

// The menu is portaled outside the thread root, so its styles must travel with it.
const ActionMenuContent = styled(ActionBarMorePrimitive.Content)`
  background: #fff; border: 1px solid #e3e9f2; border-radius: 10px; box-shadow: 0 8px 28px #2039641a;
  min-width: 168px; padding: 5px; z-index: 1000;
`;
const ActionMenuItem = styled(ActionBarMorePrimitive.Item)`
  display: flex; align-items: center; gap: 9px; padding: 8px 10px; font-size: 12px; color: #526581;
  border-radius: 6px; cursor: pointer; outline: none;
  &[data-highlighted], &:hover, &:focus { background: #f1f5fb; }
  svg { width: 15px; height: 15px; flex: 0 0 auto; }
`;

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="aui-assistant-action-bar-root"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip={trans("copy")}>
          <AuiIf condition={(s) => s.message.isCopied}>
            <CheckIcon />
          </AuiIf>
          <AuiIf condition={(s) => !s.message.isCopied}>
            <CopyIcon />
          </AuiIf>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarMorePrimitive.Root>
        <ActionBarMorePrimitive.Trigger asChild>
          <TooltipIconButton
            tooltip={trans("automator.chat.more")}
            className="aui-action-bar-more-trigger"
          >
            <MoreHorizontalIcon />
          </TooltipIconButton>
        </ActionBarMorePrimitive.Trigger>
        <ActionMenuContent
          side="bottom"
          align="start"
          className="aui-action-bar-more-content"
          style={{
            zIndex: 999,
            cursor: "pointer",
          }}
        >
          <ActionBarPrimitive.ExportMarkdown asChild>
            <ActionMenuItem className="aui-action-bar-more-item">
              <DownloadIcon />
              {trans("automator.chat.exportMarkdown")}
            </ActionMenuItem>
          </ActionBarPrimitive.ExportMarkdown>
        </ActionMenuContent>
      </ActionBarMorePrimitive.Root>
    </ActionBarPrimitive.Root>
  );
};

const UserMessage: FC<{ showAttachments?: boolean }> = ({
  showAttachments = true,
}) => {
  return (
    <MessagePrimitive.Root
      data-slot="aui_user-message-root"
      className="aui-user-message-root"
      data-role="user"
    >
      {showAttachments && <UserMessageAttachments />}

      <div className="aui-user-message-content-wrapper">
        <div className="aui-user-message-content">
          <MessagePrimitive.Parts />
        </div>
        <div className="aui-user-action-bar-wrapper">
          <UserActionBar />
        </div>
      </div>

      <BranchPicker
        data-slot="aui_user-branch-picker"
        className="aui-user-branch-picker"
      />
    </MessagePrimitive.Root>
  );
};

const UserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="aui-user-action-bar-root"
    >
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip={trans("edit")} className="aui-user-action-edit">
          <PencilIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
  className,
  ...rest
}) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={
        className
          ? `aui-branch-picker-root ${className}`
          : "aui-branch-picker-root"
      }
      {...rest}
    >
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip={trans("automator.chat.previous")}>
          <ChevronLeftIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      <span className="aui-branch-picker-state">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip={trans("automator.chat.next")}>
          <ChevronRightIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};
