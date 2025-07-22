"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"
import styled from "styled-components"

const StyledDialogOverlay = styled(DialogPrimitive.Overlay)`
  position: fixed;
  inset: 0;
  z-index: 50;
  background-color: rgba(0, 0, 0, 0.5);
`;

const StyledDialogContent = styled(DialogPrimitive.Content)`
  background-color: white;
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 50;
  display: grid;
  width: 100%;
  max-width: calc(100% - 2rem);
  transform: translate(-50%, -50%);
  gap: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 24px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);

  @media (min-width: 640px) {
    max-width: 512px;
  }
`;

const StyledDialogClose = styled(DialogPrimitive.Close)`
  position: absolute;
  top: 16px;
  right: 16px;
  border-radius: 4px;
  opacity: 0.7;
  transition: opacity 0.2s;
  border: none;
  background: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    opacity: 1;
  }

  & svg {
    width: 16px;
    height: 16px;
  }
`;

const StyledDialogHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: center;

  @media (min-width: 640px) {
    text-align: left;
  }
`;

const StyledDialogFooter = styled.div`
  display: flex;
  flex-direction: column-reverse;
  gap: 8px;

  @media (min-width: 640px) {
    flex-direction: row;
    justify-content: flex-end;
  }
`;

const StyledDialogTitle = styled(DialogPrimitive.Title)`
  font-size: 18px;
  line-height: 1;
  font-weight: 600;
`;

const StyledDialogDescription = styled(DialogPrimitive.Description)`
  color: #64748b;
  font-size: 14px;
`;

const ScreenReaderOnly = styled.span`
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
`;

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: Omit<React.ComponentProps<typeof DialogPrimitive.Overlay>, 'ref'>) {
  return (
    <StyledDialogOverlay
      data-slot="dialog-overlay"
      className={className}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: Omit<React.ComponentProps<typeof DialogPrimitive.Content>, 'ref'> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <StyledDialogContent
        data-slot="dialog-content"
        className={className}
        {...props}
      >
        {children}
        {showCloseButton && (
          <StyledDialogClose data-slot="dialog-close">
            <XIcon />
            <ScreenReaderOnly>Close</ScreenReaderOnly>
          </StyledDialogClose>
        )}
      </StyledDialogContent>
    </DialogPortal>
  )
}

function DialogHeader({ 
  className, 
  ...props 
}: React.ComponentProps<"div">) {
  return (
    <StyledDialogHeader
      data-slot="dialog-header"
      className={className}
      {...props}
    />
  )
}

function DialogFooter({ 
  className, 
  ...props 
}: React.ComponentProps<"div">) {
  return (
    <StyledDialogFooter
      data-slot="dialog-footer"
      className={className}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: Omit<React.ComponentProps<typeof DialogPrimitive.Title>, 'ref'>) {
  return (
    <StyledDialogTitle
      data-slot="dialog-title"
      className={className}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: Omit<React.ComponentProps<typeof DialogPrimitive.Description>, 'ref'>) {
  return (
    <StyledDialogDescription
      data-slot="dialog-description"
      className={className}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}