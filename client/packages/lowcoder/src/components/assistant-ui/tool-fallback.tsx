"use client";

import { memo, useCallback, useRef, useState } from "react";
import {
  AlertCircleIcon,
  CheckIcon,
  LoaderIcon,
  XCircleIcon,
} from "lucide-react";
import {
  useScrollLock,
  type ToolCallMessagePartStatus,
  type ToolCallMessagePartComponent,
} from "@assistant-ui/react";
import styled, { keyframes } from "styled-components";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

const ANIMATION_DURATION = 200;

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
`;

const StyledToolFallbackRoot = styled(Collapsible)<{ $cancelled?: boolean }>`
  background: ${({ $cancelled }) => ($cancelled ? "#f9fafb" : "#ffffff")};
  border: 1px solid ${({ $cancelled }) => ($cancelled ? "#d1d5db" : "#e5e7eb")};
  border-radius: 8px;
  padding: 12px 0;
  width: 100%;
`;

const StyledToolFallbackTrigger = styled(CollapsibleTrigger)`
  align-items: center;
  background: transparent;
  border: 0;
  color: #4b5563;
  cursor: pointer;
  display: flex;
  font-size: 14px;
  gap: 8px;
  line-height: 20px;
  padding: 0 16px;
  text-align: left;
  transition: color 0.2s ease;
  width: 100%;

  &:hover {
    color: #111827;
  }

  .aui-tool-fallback-trigger-icon,
  .aui-tool-fallback-trigger-chevron {
    flex: 0 0 auto;
    height: 16px;
    width: 16px;
  }

  .aui-tool-fallback-trigger-icon-running {
    animation: ${spin} 1s linear infinite;
  }

  .aui-tool-fallback-trigger-icon-cancelled,
  .aui-tool-fallback-trigger-label-cancelled {
    color: #8c8c8c;
  }

  .aui-tool-fallback-trigger-label-cancelled {
    text-decoration: line-through;
  }

  .aui-tool-fallback-trigger-label-wrapper {
    display: inline-block;
    flex: 1;
    line-height: 1;
    min-width: 0;
    position: relative;
    text-align: start;
  }

  .aui-tool-fallback-trigger-shimmer {
    background: linear-gradient(90deg, transparent, rgba(22, 119, 255, 0.35), transparent);
    background-size: 200% 100%;
    color: transparent;
    inset: 0;
    pointer-events: none;
    position: absolute;
    -webkit-background-clip: text;
    animation: ${shimmer} 1.6s linear infinite;
  }

  .aui-tool-fallback-trigger-chevron {
    transform: rotate(0deg);
    transition: transform var(--animation-duration, 200ms) ease-out;
  }

  &[data-state="closed"] .aui-tool-fallback-trigger-chevron {
    transform: rotate(-90deg);
  }
`;

const StyledToolFallbackContent = styled(CollapsibleContent)`
  color: #1f2937;
  font-size: 14px;
  outline: none;
  overflow: hidden;
  position: relative;
`;

const ToolFallbackContentInner = styled.div`
  border-top: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  padding-top: 8px;
`;

const ToolFallbackSection = styled.div`
  padding: 0 16px;
`;

const ToolFallbackDashedSection = styled(ToolFallbackSection)`
  border-top: 1px dashed #e5e7eb;
  padding-top: 8px;
`;

const ToolFallbackHeader = styled.p`
  color: #4b5563;
  font-weight: 600;
  margin: 0 0 4px;
`;

const ToolFallbackText = styled.p`
  color: #6b7280;
  margin: 0;
`;

const ToolFallbackPre = styled.pre`
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
`;

export type ToolFallbackRootProps = Omit<
  React.ComponentPropsWithoutRef<typeof Collapsible>,
  "open" | "onOpenChange"
> & {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  cancelled?: boolean;
};

function ToolFallbackRoot({
  className,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  defaultOpen = false,
  cancelled = false,
  children,
  ...props
}: ToolFallbackRootProps) {
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
    <StyledToolFallbackRoot
      ref={collapsibleRef}
      data-slot="tool-fallback-root"
      $cancelled={cancelled}
      open={isOpen}
      onOpenChange={handleOpenChange}
      className={className ? `aui-tool-fallback-root ${className}` : "aui-tool-fallback-root"}
      style={
        {
          "--animation-duration": `${ANIMATION_DURATION}ms`,
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </StyledToolFallbackRoot>
  );
}

type ToolStatus = ToolCallMessagePartStatus["type"];

const statusIconMap: Record<ToolStatus, React.ElementType> = {
  running: LoaderIcon,
  complete: CheckIcon,
  incomplete: XCircleIcon,
  "requires-action": AlertCircleIcon,
};

function ToolFallbackTrigger({
  toolName,
  status,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof CollapsibleTrigger> & {
  toolName: string;
  status?: ToolCallMessagePartStatus;
}) {
  const statusType = status?.type ?? "complete";
  const isRunning = statusType === "running";
  const isCancelled =
    status?.type === "incomplete" && status.reason === "cancelled";

  const Icon = statusIconMap[statusType];
  const label = isCancelled ? "Cancelled tool" : "Used tool";

  return (
    <StyledToolFallbackTrigger
      data-slot="tool-fallback-trigger"
      className={className ? `aui-tool-fallback-trigger ${className}` : "aui-tool-fallback-trigger"}
      {...props}
    >
      <Icon
        data-slot="tool-fallback-trigger-icon"
        className={[
          "aui-tool-fallback-trigger-icon",
          isCancelled ? "aui-tool-fallback-trigger-icon-cancelled" : "",
          isRunning ? "aui-tool-fallback-trigger-icon-running" : "",
        ].filter(Boolean).join(" ")}
      />
      <span
        data-slot="tool-fallback-trigger-label"
        className={[
          "aui-tool-fallback-trigger-label-wrapper",
          isCancelled ? "aui-tool-fallback-trigger-label-cancelled" : "",
        ].filter(Boolean).join(" ")}
      >
        <span>
          {label}: <b>{toolName}</b>
        </span>
        {isRunning && (
          <span
            aria-hidden
            data-slot="tool-fallback-trigger-shimmer"
            className="aui-tool-fallback-trigger-shimmer"
          >
            {label}: <b>{toolName}</b>
          </span>
        )}
      </span>
    </StyledToolFallbackTrigger>
  );
}

function ToolFallbackContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof CollapsibleContent>) {
  return (
    <StyledToolFallbackContent
      data-slot="tool-fallback-content"
      className={className ? `aui-tool-fallback-content ${className}` : "aui-tool-fallback-content"}
      {...props}
    >
      <ToolFallbackContentInner>{children}</ToolFallbackContentInner>
    </StyledToolFallbackContent>
  );
}

function ToolFallbackArgs({
  argsText,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & {
  argsText?: string;
}) {
  if (!argsText) return null;

  return (
    <ToolFallbackSection
      data-slot="tool-fallback-args"
      className={className ? `aui-tool-fallback-args ${className}` : "aui-tool-fallback-args"}
      {...props}
    >
      <ToolFallbackPre className="aui-tool-fallback-args-value">
        {argsText}
      </ToolFallbackPre>
    </ToolFallbackSection>
  );
}

function ToolFallbackResult({
  result,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & {
  result?: unknown;
}) {
  if (result === undefined) return null;

  return (
    <ToolFallbackDashedSection
      data-slot="tool-fallback-result"
      className={className ? `aui-tool-fallback-result ${className}` : "aui-tool-fallback-result"}
      {...props}
    >
      <ToolFallbackHeader className="aui-tool-fallback-result-header">Result:</ToolFallbackHeader>
      <ToolFallbackPre className="aui-tool-fallback-result-content">
        {typeof result === "string" ? result : JSON.stringify(result, null, 2)}
      </ToolFallbackPre>
    </ToolFallbackDashedSection>
  );
}

function ToolFallbackError({
  status,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & {
  status?: ToolCallMessagePartStatus;
}) {
  if (status?.type !== "incomplete") return null;

  const error = status.error;
  const errorText = error
    ? typeof error === "string"
      ? error
      : JSON.stringify(error)
    : null;

  if (!errorText) return null;

  const isCancelled = status.reason === "cancelled";
  const headerText = isCancelled ? "Cancelled reason:" : "Error:";

  return (
    <ToolFallbackSection
      data-slot="tool-fallback-error"
      className={className ? `aui-tool-fallback-error ${className}` : "aui-tool-fallback-error"}
      {...props}
    >
      <ToolFallbackHeader className="aui-tool-fallback-error-header">
        {headerText}
      </ToolFallbackHeader>
      <ToolFallbackText className="aui-tool-fallback-error-reason">
        {errorText}
      </ToolFallbackText>
    </ToolFallbackSection>
  );
}

const ToolFallbackImpl: ToolCallMessagePartComponent = ({
  toolName,
  status,
}) => {
  const isCancelled =
    status?.type === "incomplete" && status.reason === "cancelled";

  return (
    <ToolFallbackRoot cancelled={isCancelled}>
      <ToolFallbackTrigger toolName={toolName} status={status} />
    </ToolFallbackRoot>
  );
};

const ToolFallback = memo(
  ToolFallbackImpl,
) as unknown as ToolCallMessagePartComponent & {
  Root: typeof ToolFallbackRoot;
  Trigger: typeof ToolFallbackTrigger;
  Content: typeof ToolFallbackContent;
  Args: typeof ToolFallbackArgs;
  Result: typeof ToolFallbackResult;
  Error: typeof ToolFallbackError;
};

ToolFallback.displayName = "ToolFallback";
ToolFallback.Root = ToolFallbackRoot;
ToolFallback.Trigger = ToolFallbackTrigger;
ToolFallback.Content = ToolFallbackContent;
ToolFallback.Args = ToolFallbackArgs;
ToolFallback.Result = ToolFallbackResult;
ToolFallback.Error = ToolFallbackError;

export {
  ToolFallback,
  ToolFallbackRoot,
  ToolFallbackTrigger,
  ToolFallbackContent,
  ToolFallbackArgs,
  ToolFallbackResult,
  ToolFallbackError,
};
