"use client";

import {
  memo,
  useCallback,
  useRef,
  useState,
  type FC,
  type PropsWithChildren,
} from "react";
import { ChevronDownIcon, LoaderIcon } from "lucide-react";
import { useScrollLock } from "@assistant-ui/react";
import styled, { keyframes } from "styled-components";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

const ANIMATION_DURATION = 200;

type ToolGroupVariant = "outline" | "ghost" | "muted";

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

const StyledToolGroupRoot = styled(Collapsible)<{ $variant: ToolGroupVariant }>`
  background: ${({ $variant }) => ($variant === "muted" ? "#f3f4f6" : "transparent")};
  border: ${({ $variant }) => ($variant === "ghost" ? "0" : "1px solid #e5e7eb")};
  border-radius: ${({ $variant }) => ($variant === "ghost" ? "0" : "8px")};
  padding: ${({ $variant }) => ($variant === "ghost" ? "0" : "12px 0")};
  width: 100%;
`;

const StyledToolGroupTrigger = styled(CollapsibleTrigger)`
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

  .aui-tool-group-trigger-loader,
  .aui-tool-group-trigger-chevron {
    flex: 0 0 auto;
    height: 16px;
    width: 16px;
  }

  .aui-tool-group-trigger-loader {
    animation: ${spin} 1s linear infinite;
  }

  .aui-tool-group-trigger-label-wrapper {
    display: inline-block;
    flex: 1;
    font-weight: 500;
    line-height: 1;
    min-width: 0;
    position: relative;
    text-align: start;
  }

  .aui-tool-group-trigger-shimmer {
    background: linear-gradient(90deg, transparent, rgba(22, 119, 255, 0.35), transparent);
    background-size: 200% 100%;
    color: transparent;
    inset: 0;
    pointer-events: none;
    position: absolute;
    -webkit-background-clip: text;
    animation: ${shimmer} 1.6s linear infinite;
  }

  .aui-tool-group-trigger-chevron {
    transform: rotate(0deg);
    transition: transform var(--animation-duration, 200ms) ease-out;
  }

  &[data-state="closed"] .aui-tool-group-trigger-chevron {
    transform: rotate(-90deg);
  }
`;

const StyledToolGroupContent = styled(CollapsibleContent)`
  color: #1f2937;
  font-size: 14px;
  outline: none;
  overflow: hidden;
  position: relative;
`;

const ToolGroupContentInner = styled.div`
  border-top: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  padding: 12px 16px 0;
`;

export type ToolGroupRootProps = Omit<
  React.ComponentPropsWithoutRef<typeof Collapsible>,
  "open" | "onOpenChange"
> &
  {
    variant?: ToolGroupVariant;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    defaultOpen?: boolean;
  };

function ToolGroupRoot({
  className,
  variant,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  defaultOpen = false,
  children,
  ...props
}: ToolGroupRootProps) {
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
    <StyledToolGroupRoot
      ref={collapsibleRef}
      data-slot="tool-group-root"
      data-variant={variant ?? "outline"}
      $variant={variant ?? "outline"}
      open={isOpen}
      onOpenChange={handleOpenChange}
      className={className ? `aui-tool-group-root ${className}` : "aui-tool-group-root"}
      style={
        {
          "--animation-duration": `${ANIMATION_DURATION}ms`,
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </StyledToolGroupRoot>
  );
}

function ToolGroupTrigger({
  count,
  active = false,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof CollapsibleTrigger> & {
  count: number;
  active?: boolean;
}) {
  const label = `${count} tool ${count === 1 ? "call" : "calls"}`;

  return (
    <StyledToolGroupTrigger
      data-slot="tool-group-trigger"
      className={className ? `aui-tool-group-trigger ${className}` : "aui-tool-group-trigger"}
      {...props}
    >
      {active && (
        <LoaderIcon
          data-slot="tool-group-trigger-loader"
          className="aui-tool-group-trigger-loader"
        />
      )}
      <span
        data-slot="tool-group-trigger-label"
        className="aui-tool-group-trigger-label-wrapper"
      >
        <span>{label}</span>
        {active && (
          <span
            aria-hidden
            data-slot="tool-group-trigger-shimmer"
            className="aui-tool-group-trigger-shimmer"
          >
            {label}
          </span>
        )}
      </span>
      <ChevronDownIcon
        data-slot="tool-group-trigger-chevron"
        className="aui-tool-group-trigger-chevron"
      />
    </StyledToolGroupTrigger>
  );
}

function ToolGroupContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof CollapsibleContent>) {
  return (
    <StyledToolGroupContent
      data-slot="tool-group-content"
      className={className ? `aui-tool-group-content ${className}` : "aui-tool-group-content"}
      {...props}
    >
      <ToolGroupContentInner>{children}</ToolGroupContentInner>
    </StyledToolGroupContent>
  );
}

type ToolGroupComponent = FC<
  PropsWithChildren<{ startIndex: number; endIndex: number }>
> & {
  Root: typeof ToolGroupRoot;
  Trigger: typeof ToolGroupTrigger;
  Content: typeof ToolGroupContent;
};

const ToolGroupImpl: FC<
  PropsWithChildren<{ startIndex: number; endIndex: number }>
> = ({ children, startIndex, endIndex }) => {
  const toolCount = endIndex - startIndex + 1;

  return (
    <ToolGroupRoot>
      <ToolGroupTrigger count={toolCount} />
      <ToolGroupContent>{children}</ToolGroupContent>
    </ToolGroupRoot>
  );
};

/**
 * @deprecated This wrapper targets the legacy `components.ToolGroup` prop
 * on `<MessagePrimitive.Parts>`. Use `<MessagePrimitive.GroupedParts>` with
 * a `groupBy` returning `"group-tool"` and compose `ToolGroupRoot` /
 * `ToolGroupTrigger` / `ToolGroupContent` directly. See `thread.tsx`.
 */
const ToolGroup = memo(ToolGroupImpl) as unknown as ToolGroupComponent;

ToolGroup.displayName = "ToolGroup";
ToolGroup.Root = ToolGroupRoot;
ToolGroup.Trigger = ToolGroupTrigger;
ToolGroup.Content = ToolGroupContent;

export {
  ToolGroup,
  ToolGroupRoot,
  ToolGroupTrigger,
  ToolGroupContent,
};
