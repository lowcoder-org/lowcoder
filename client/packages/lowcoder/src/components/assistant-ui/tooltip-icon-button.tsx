import { forwardRef } from "react";
import { Tooltip } from "antd";

import { Button, type ButtonProps } from "./ui/button";
import { cn } from "./utils/cn";

export type TooltipIconButtonProps = ButtonProps & {
  tooltip: string;
  side?: "top" | "bottom" | "left" | "right";
};

export const TooltipIconButton = forwardRef<
  HTMLButtonElement,
  TooltipIconButtonProps
>(
  (
    {
      children,
      tooltip,
      side = "bottom",
      className,
      variant = "ghost",
      size = "icon-sm",
      "aria-label": ariaLabel,
      ...rest
    },
    ref,
  ) => {
    return (
      <Tooltip title={tooltip} placement={side}>
        <Button
          {...rest}
          ref={ref}
          variant={variant}
          size={size}
          className={cn("aui-tooltip-icon-button", className)}
          aria-label={ariaLabel ?? tooltip}
        >
          {children}
        </Button>
      </Tooltip>
    );
  },
);

TooltipIconButton.displayName = "TooltipIconButton";
