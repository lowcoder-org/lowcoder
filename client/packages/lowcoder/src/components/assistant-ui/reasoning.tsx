"use client";

import { memo, useCallback, useRef, useState } from "react";
import { BrainIcon, ChevronDownIcon } from "lucide-react";
import {
  useScrollLock,
  useAuiState,
  type ReasoningMessagePartComponent,
  type ReasoningGroupComponent,
} from "@assistant-ui/react";
import styled, { keyframes } from "styled-components";
import { MarkdownText } from "./markdown-text";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

const ANIMATION_DURATION = 200;

type ReasoningVariant = "outline" | "ghost" | "muted";

const shimmer = keyframes`
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
`;

const StyledReasoningRoot = styled(Collapsible)<{ $variant: ReasoningVariant }>`
  border: ${({ $variant }) => ($variant === "outline" ? "1px solid #e5e7eb" : "0")};
  border-radius: ${({ $variant }) => ($variant === "ghost" ? "0" : "8px")};
  background: ${({ $variant }) => ($variant === "muted" ? "#f3f4f6" : "transparent")};
  margin-bottom: 16px;
  padding: ${({ $variant }) => ($variant === "ghost" ? "0" : "8px 12px")};
  width: 100%;
`;

const StyledReasoningTrigger = styled(CollapsibleTrigger)`
  align-items: center;
  background: transparent;
  border: 0;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  font-size: 14px;
  gap: 8px;
  line-height: 20px;
  max-width: 75%;
  padding: 4px 0;
  text-align: left;
  transition: color 0.2s ease;

  &:hover {
    color: #1f2937;
  }

  .aui-reasoning-trigger-icon,
  .aui-reasoning-trigger-chevron {
    flex: 0 0 auto;
    height: 16px;
    width: 16px;
  }

  .aui-reasoning-trigger-label-wrapper {
    display: inline-block;
    line-height: 1;
    position: relative;
  }

  .aui-reasoning-trigger-shimmer {
    background: linear-gradient(90deg, transparent, rgba(22, 119, 255, 0.35), transparent);
    background-size: 200% 100%;
    inset: 0;
    pointer-events: none;
    position: absolute;
    -webkit-background-clip: text;
    color: transparent;
    animation: ${shimmer} 1.6s linear infinite;
  }

  .aui-reasoning-trigger-chevron {
    margin-top: 2px;
    transform: rotate(0deg);
    transition: transform var(--animation-duration, 200ms) ease-out;
  }

  &[data-state="closed"] .aui-reasoning-trigger-chevron {
    transform: rotate(-90deg);
  }
`;

const StyledReasoningContent = styled(CollapsibleContent)`
  color: #6b7280;
  font-size: 14px;
  line-height: 22px;
  outline: none;
  overflow: hidden;
  position: relative;
`;

const StyledReasoningText = styled.div`
  max-height: 256px;
  overflow-y: auto;
  padding: 8px 0 8px 24px;
  position: relative;
  z-index: 0;

  > * + * {
    margin-top: 16px;
  }
`;

const StyledReasoningFade = styled.div`
  background: linear-gradient(to top, #f9fafb, rgba(249, 250, 251, 0));
  bottom: 0;
  height: 32px;
  left: 0;
  pointer-events: none;
  position: absolute;
  right: 0;
  z-index: 1;
`;

export type ReasoningRootProps = Omit<
  React.ComponentPropsWithoutRef<typeof Collapsible>,
  "open" | "onOpenChange"
> &
  {
    variant?: ReasoningVariant;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    defaultOpen?: boolean;
  };

function ReasoningRoot({
  className,
  variant,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  defaultOpen = false,
  children,
  ...props
}: ReasoningRootProps) {
  const collapsibleRef = useRef<HTMLDivElement>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const lockScroll = useScrollLock(collapsibleRef, ANIMATION_DURATION);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        lockScroll();
      }
      if (!isControlled) {
        setUncontrolledOpen(open);
      }
      controlledOnOpenChange?.(open);
    },
    [lockScroll, isControlled, controlledOnOpenChange],
  );

  return (
    <StyledReasoningRoot
      ref={collapsibleRef}
      data-slot="reasoning-root"
      data-variant={variant ?? "outline"}
      $variant={variant ?? "outline"}
      open={isOpen}
      onOpenChange={handleOpenChange}
      className={className ? `aui-reasoning-root ${className}` : "aui-reasoning-root"}
      style={
        {
          "--animation-duration": `${ANIMATION_DURATION}ms`,
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </StyledReasoningRoot>
  );
}

function ReasoningFade({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return (
    <StyledReasoningFade
      data-slot="reasoning-fade"
      className={className ? `aui-reasoning-fade ${className}` : "aui-reasoning-fade"}
      {...props}
    />
  );
}

function ReasoningTrigger({
  active,
  duration,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof CollapsibleTrigger> & {
  active?: boolean;
  duration?: number;
}) {
  const durationText = duration ? ` (${duration}s)` : "";

  return (
    <StyledReasoningTrigger
      data-slot="reasoning-trigger"
      className={className ? `aui-reasoning-trigger ${className}` : "aui-reasoning-trigger"}
      {...props}
    >
      <BrainIcon
        data-slot="reasoning-trigger-icon"
        className="aui-reasoning-trigger-icon"
      />
      <span
        data-slot="reasoning-trigger-label"
        className="aui-reasoning-trigger-label-wrapper"
      >
        <span>Reasoning{durationText}</span>
        {active ? (
          <span
            aria-hidden
            data-slot="reasoning-trigger-shimmer"
            className="aui-reasoning-trigger-shimmer"
          >
            Reasoning{durationText}
          </span>
        ) : null}
      </span>
      <ChevronDownIcon
        data-slot="reasoning-trigger-chevron"
        className="aui-reasoning-trigger-chevron"
      />
    </StyledReasoningTrigger>
  );
}

function ReasoningContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof CollapsibleContent>) {
  return (
    <StyledReasoningContent
      data-slot="reasoning-content"
      className={className ? `aui-reasoning-content ${className}` : "aui-reasoning-content"}
      {...props}
    >
      {children}
      <ReasoningFade />
    </StyledReasoningContent>
  );
}

function ReasoningText({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return (
    <StyledReasoningText
      data-slot="reasoning-text"
      className={className ? `aui-reasoning-text ${className}` : "aui-reasoning-text"}
      {...props}
    />
  );
}

const ReasoningImpl: ReasoningMessagePartComponent = () => <MarkdownText />;

const ReasoningGroupImpl: ReasoningGroupComponent = ({
  children,
  startIndex,
  endIndex,
}) => {
  const isReasoningStreaming = useAuiState((s) => {
    if (s.message.status?.type !== "running") return false;
    const lastIndex = s.message.parts.length - 1;
    if (lastIndex < 0) return false;
    const lastType = s.message.parts[lastIndex]?.type;
    if (lastType !== "reasoning") return false;
    return lastIndex >= startIndex && lastIndex <= endIndex;
  });

  return (
    <ReasoningRoot defaultOpen={isReasoningStreaming}>
      <ReasoningTrigger active={isReasoningStreaming} />
      <ReasoningContent aria-busy={isReasoningStreaming}>
        <ReasoningText>{children}</ReasoningText>
      </ReasoningContent>
    </ReasoningRoot>
  );
};

const Reasoning = memo(
  ReasoningImpl,
) as unknown as ReasoningMessagePartComponent & {
  Root: typeof ReasoningRoot;
  Trigger: typeof ReasoningTrigger;
  Content: typeof ReasoningContent;
  Text: typeof ReasoningText;
  Fade: typeof ReasoningFade;
};

Reasoning.displayName = "Reasoning";
Reasoning.Root = ReasoningRoot;
Reasoning.Trigger = ReasoningTrigger;
Reasoning.Content = ReasoningContent;
Reasoning.Text = ReasoningText;
Reasoning.Fade = ReasoningFade;

/**
 * @deprecated This wrapper targets the legacy `components.ReasoningGroup`
 * prop on `<MessagePrimitive.Parts>`. Use `<MessagePrimitive.GroupedParts>`
 * with a `groupBy` returning `"group-reasoning"` and compose `ReasoningRoot`
 * / `ReasoningTrigger` / `ReasoningContent` / `ReasoningText` directly.
 * See `thread.tsx` for an example.
 */
const ReasoningGroup = memo(ReasoningGroupImpl);
ReasoningGroup.displayName = "ReasoningGroup";

export {
  Reasoning,
  ReasoningGroup,
  ReasoningRoot,
  ReasoningTrigger,
  ReasoningContent,
  ReasoningText,
  ReasoningFade,
};
