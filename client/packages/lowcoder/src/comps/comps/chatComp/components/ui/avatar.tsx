"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import styled from "styled-components"

const StyledAvatarRoot = styled(AvatarPrimitive.Root)`
  position: relative;
  display: flex;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 50%;
`;

const StyledAvatarImage = styled(AvatarPrimitive.Image)`
  aspect-ratio: 1;
  width: 100%;
  height: 100%;
`;

const StyledAvatarFallback = styled(AvatarPrimitive.Fallback)`
  background-color: #f1f5f9;
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
`;

function Avatar({
  className,
  ...props
}: Omit<React.ComponentProps<typeof AvatarPrimitive.Root>, 'ref'>) {
  return (
    <StyledAvatarRoot
      data-slot="avatar"
      className={className}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: Omit<React.ComponentProps<typeof AvatarPrimitive.Image>, 'ref'>) {
  return (
    <StyledAvatarImage
      data-slot="avatar-image"
      className={className}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: Omit<React.ComponentProps<typeof AvatarPrimitive.Fallback>, 'ref'>) {
  return (
    <StyledAvatarFallback
      data-slot="avatar-fallback"
      className={className}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }