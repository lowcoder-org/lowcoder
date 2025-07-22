import {
    ActionBarPrimitive,
    BranchPickerPrimitive,
    ComposerPrimitive,
    MessagePrimitive,
    ThreadPrimitive,
  } from "@assistant-ui/react";
  import type { FC } from "react";
  import { trans } from "i18n";
  import {
    ArrowDownIcon,
    CheckIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    CopyIcon,
    PencilIcon,
    RefreshCwIcon,
    SendHorizontalIcon,
  } from "lucide-react";
  import { cn } from "../../utils/cn";
  
  import { Button } from "../ui/button";
  import { MarkdownText } from "./markdown-text";
  import { TooltipIconButton } from "./tooltip-icon-button";
  import { Spin, Flex } from "antd";
  import { LoadingOutlined } from "@ant-design/icons";
  import styled from "styled-components";
import { ComposerAddAttachment, ComposerAttachments } from "../ui/attachment";
  const SimpleANTDLoader = () => {
    const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;
    
    return (
      <div style={{ textAlign: 'left', width: '100%' }}>
        <Flex align="center" gap={12} style={{ paddingLeft: '16px' }}>
          <Spin indicator={antIcon} size="small" />
          <span style={{ color: '#666', fontSize: '14px' }}>Working on it...</span>
        </Flex>
      </div>
    );
  };

  const StyledThreadRoot = styled(ThreadPrimitive.Root)`
  /* Hide entire assistant message container when it contains running status */
  .aui-assistant-message-root:has([data-status="running"]) {
    display: none;
  }
  
  /* Fallback for older browsers that don't support :has() */
  .aui-assistant-message-content [data-status="running"] {
    display: none;
  }
`;

  
  interface ThreadProps {
    placeholder?: string;
  }
  
  export const Thread: FC<ThreadProps> = ({ placeholder = trans("chat.composerPlaceholder") }) => {
    return (
      <StyledThreadRoot
        className="aui-root aui-thread-root"
        style={{
          ["--thread-max-width" as string]: "42rem",
        }}
      >
        <ThreadPrimitive.Viewport className="aui-thread-viewport">
          <ThreadWelcome />
  
          <ThreadPrimitive.Messages
            components={{
              UserMessage: UserMessage,
              EditComposer: EditComposer,
              AssistantMessage: AssistantMessage,
            }}
          />

          <ThreadPrimitive.If running>
            <SimpleANTDLoader />
          </ThreadPrimitive.If>
  
          <ThreadPrimitive.If empty={false}>
            <div className="aui-thread-viewport-spacer" />
          </ThreadPrimitive.If>
  
          <div className="aui-thread-viewport-footer">
            <ThreadScrollToBottom />
            <Composer placeholder={placeholder} />
          </div>
        </ThreadPrimitive.Viewport>
      </StyledThreadRoot>
    );
  };
  
  const ThreadScrollToBottom: FC = () => {
    return (
      <ThreadPrimitive.ScrollToBottom asChild>
        <TooltipIconButton
          tooltip="Scroll to bottom"
          variant="outline"
          className="aui-thread-scroll-to-bottom"
        >
          <ArrowDownIcon />
        </TooltipIconButton>
      </ThreadPrimitive.ScrollToBottom>
    );
  };
  
  const ThreadWelcome: FC = () => {
    return (
      <ThreadPrimitive.Empty>
        <div className="aui-thread-welcome-root">
          <div className="aui-thread-welcome-center">
            <p className="aui-thread-welcome-message">
              {trans("chat.welcomeMessage")}
            </p>
          </div>
          <ThreadWelcomeSuggestions />
        </div>
      </ThreadPrimitive.Empty>
    );
  };
  
  const ThreadWelcomeSuggestions: FC = () => {
    return (
      <div className="aui-thread-welcome-suggestions">
        <ThreadPrimitive.Suggestion
          className="aui-thread-welcome-suggestion"
          prompt={trans("chat.suggestionWeather")}
          method="replace"
          autoSend
        >
          <span className="aui-thread-welcome-suggestion-text">
            {trans("chat.suggestionWeather")}
          </span>
        </ThreadPrimitive.Suggestion>
        <ThreadPrimitive.Suggestion
          className="aui-thread-welcome-suggestion"
          prompt={trans("chat.suggestionAssistant")}
          method="replace"
          autoSend
        >
          <span className="aui-thread-welcome-suggestion-text">
            {trans("chat.suggestionAssistant")}
          </span>
        </ThreadPrimitive.Suggestion>
      </div>
    );
  };
  
  const Composer: FC<{ placeholder?: string }> = ({ placeholder = trans("chat.composerPlaceholder") }) => {
    return (
      <ComposerPrimitive.Root className="aui-composer-root">
        <ComposerAttachments />
        <ComposerAddAttachment />
        <ComposerPrimitive.Input
          rows={1}
          autoFocus
          placeholder={placeholder}
          className="aui-composer-input"
        />
        <ComposerAction />
      </ComposerPrimitive.Root>
    );
  };
  
  const ComposerAction: FC = () => {
    return (
      <>
        <ThreadPrimitive.If running={false}>
          <ComposerPrimitive.Send asChild>
            <TooltipIconButton
              tooltip="Send"
              variant="default"
              className="aui-composer-send"
            >
              <SendHorizontalIcon />
            </TooltipIconButton>
          </ComposerPrimitive.Send>
        </ThreadPrimitive.If>
        <ThreadPrimitive.If running>
          <ComposerPrimitive.Cancel asChild>
            <TooltipIconButton
              tooltip="Cancel"
              variant="default"
              className="aui-composer-cancel"
            >
              <CircleStopIcon />
            </TooltipIconButton>
          </ComposerPrimitive.Cancel>
        </ThreadPrimitive.If>
      </>
    );
  };
  
  const UserMessage: FC = () => {
    return (
      <MessagePrimitive.Root className="aui-user-message-root">
        <UserActionBar />
  
        <div className="aui-user-message-content">
          <MessagePrimitive.Content />
        </div>
  
        <BranchPicker className="aui-user-branch-picker" />
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
          <TooltipIconButton tooltip="Edit">
            <PencilIcon />
          </TooltipIconButton>
        </ActionBarPrimitive.Edit>
      </ActionBarPrimitive.Root>
    );
  };
  
  const EditComposer: FC = () => {
    return (
      <ComposerPrimitive.Root className="aui-edit-composer-root">
        <ComposerPrimitive.Input className="aui-edit-composer-input" />
  
        <div className="aui-edit-composer-footer">
          <ComposerPrimitive.Cancel asChild>
            <Button variant="ghost">Cancel</Button>
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send asChild>
            <Button>Send</Button>
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    );
  };
  
  const AssistantMessage: FC = () => {
    return (
      <MessagePrimitive.Root className="aui-assistant-message-root">
        <div className="aui-assistant-message-content">
          <MessagePrimitive.Content components={{ Text: MarkdownText }} />
        </div>
  
        <AssistantActionBar />
  
        <BranchPicker className="aui-assistant-branch-picker" />
      </MessagePrimitive.Root>
    );
  };
  
  const AssistantActionBar: FC = () => {
    return (
      <ActionBarPrimitive.Root
        hideWhenRunning
        autohide="not-last"
        autohideFloat="single-branch"
        className="aui-assistant-action-bar-root"
      >
        <ActionBarPrimitive.Copy asChild>
          <TooltipIconButton tooltip="Copy">
            <MessagePrimitive.If copied>
              <CheckIcon />
            </MessagePrimitive.If>
            <MessagePrimitive.If copied={false}>
              <CopyIcon />
            </MessagePrimitive.If>
          </TooltipIconButton>
        </ActionBarPrimitive.Copy>
        <ActionBarPrimitive.Reload asChild>
          <TooltipIconButton tooltip="Refresh">
            <RefreshCwIcon />
          </TooltipIconButton>
        </ActionBarPrimitive.Reload>
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
        className={cn("aui-branch-picker-root", className)}
        {...rest}
      >
        <BranchPickerPrimitive.Previous asChild>
          <TooltipIconButton tooltip="Previous">
            <ChevronLeftIcon />
          </TooltipIconButton>
        </BranchPickerPrimitive.Previous>
        <span className="aui-branch-picker-state">
          <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
        </span>
        <BranchPickerPrimitive.Next asChild>
          <TooltipIconButton tooltip="Next">
            <ChevronRightIcon />
          </TooltipIconButton>
        </BranchPickerPrimitive.Next>
      </BranchPickerPrimitive.Root>
    );
  };
  
  const CircleStopIcon = () => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        width="16"
        height="16"
      >
        <rect width="10" height="10" x="3" y="3" rx="2" />
      </svg>
    );
  };