import * as React from "react";
import { Button as AntButton } from "antd";
import type { ButtonProps as AntButtonProps } from "antd";
import styled from "styled-components";

import { cn } from "../utils/cn";

type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
type ButtonSize = "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";

export type ButtonProps = Omit<AntButtonProps, "type" | "size" | "variant"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  type?: React.ButtonHTMLAttributes<HTMLButtonElement>["type"];
};

const StyledButton = styled(AntButton)<{
  $variant: ButtonVariant;
  $size: ButtonSize;
}>`
  align-items: center;
  border-radius: 8px;
  display: inline-flex;
  font-size: 14px;
  font-weight: 500;
  gap: 8px;
  justify-content: center;
  line-height: 20px;
  min-width: 0;
  white-space: nowrap;

  ${({ $size }) => {
    if ($size === "icon-xs") return "height: 24px; width: 24px; padding: 0;";
    if ($size === "icon-sm") return "height: 32px; width: 32px; padding: 0;";
    if ($size === "icon" || $size === "icon-lg") {
      return `${$size === "icon-lg" ? "height: 40px; width: 40px;" : "height: 36px; width: 36px;"} padding: 0;`;
    }
    if ($size === "xs") return "height: 24px; padding: 0 8px; font-size: 12px;";
    if ($size === "sm") return "height: 32px; padding: 0 12px;";
    if ($size === "lg") return "height: 40px; padding: 0 20px;";
    return "height: 36px; padding: 0 16px;";
  }}

  ${({ $variant }) => {
    if ($variant === "default") {
      return `
        background: #1677ff;
        border-color: #1677ff;
        color: #ffffff;

        &:hover:not(:disabled) {
          background: #4096ff !important;
          border-color: #4096ff !important;
          color: #ffffff !important;
        }
      `;
    }

    if ($variant === "destructive") {
      return `
        background: #ff4d4f;
        border-color: #ff4d4f;
        color: #ffffff;

        &:hover:not(:disabled) {
          background: #ff7875 !important;
          border-color: #ff7875 !important;
          color: #ffffff !important;
        }
      `;
    }

    if ($variant === "ghost" || $variant === "link") {
      return `
        background: transparent;
        border-color: transparent;
        box-shadow: none;
        color: #4b5563;

        &:hover:not(:disabled) {
          background: rgba(0, 0, 0, 0.04) !important;
          border-color: transparent !important;
          color: #111827 !important;
        }
      `;
    }

    return `
      background: #ffffff;
      border-color: #d9d9d9;
      color: #1f2937;

      &:hover:not(:disabled) {
        background: #f9fafb !important;
        border-color: #1677ff !important;
        color: #1677ff !important;
      }
    `;
  }}

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  svg {
    height: 16px;
    width: 16px;
    flex: 0 0 auto;
  }
`;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      asChild: _asChild,
      children,
      className,
      variant = "default",
      size = "default",
      type = "button",
      ...props
    },
    ref,
  ) => {
    return (
      <StyledButton
        ref={ref}
        htmlType={type}
        $variant={variant}
        $size={size}
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn("aui-button", className)}
        {...props}
      >
        {children}
      </StyledButton>
    );
  },
);

Button.displayName = "Button";

export { Button };
