import {
  ThreadListItemMorePrimitive,
  ThreadListItemPrimitive,
  ThreadListPrimitive,
} from "@assistant-ui/react";
import styled from "styled-components";

import { Button } from "./ui/button";

export const StyledThreadListRoot = styled(ThreadListPrimitive.Root)`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  overflow: hidden;
`;

export const SkeletonStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const SkeletonRow = styled.div`
  align-items: center;
  display: flex;
  height: 36px;
  padding: 0 12px;
`;

export const SkeletonBar = styled.div`
  background: #eef0f3;
  border-radius: 4px;
  height: 16px;
  width: 100%;
`;

export const StyledNewThreadButton = styled(Button)`
  justify-content: flex-start;
  width: 100%;
`;

export const StyledThreadListItem = styled(ThreadListItemPrimitive.Root)`
  align-items: center;
  border-radius: 8px;
  display: flex;
  gap: 6px;
  height: 36px;
  min-width: 0;
  transition: background-color 0.2s ease;

  &:hover,
  &:focus-within,
  &[data-active],
  &[data-active="true"] {
    background: #f3f4f6;
  }

  .aui-thread-list-item-more {
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &:hover .aui-thread-list-item-more,
  &:focus-within .aui-thread-list-item-more,
  &[data-active] .aui-thread-list-item-more,
  &[data-active="true"] .aui-thread-list-item-more {
    opacity: 1;
  }
`;

export const StyledThreadListTrigger = styled(ThreadListItemPrimitive.Trigger)`
  align-items: center;
  background: transparent;
  border: 0;
  color: #1f2937;
  cursor: pointer;
  display: flex;
  flex: 1;
  font-size: 14px;
  height: 100%;
  min-width: 0;
  overflow: hidden;
  padding: 0 12px;
  text-align: left;
`;

export const ThreadTitle = styled.span`
  display: block;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StyledThreadRenameForm = styled.form`
  align-items: center;
  display: flex;
  flex: 1;
  height: 100%;
  min-width: 0;
  padding: 0 6px;
`;

export const StyledThreadRenameInput = styled.input`
  background: #ffffff;
  border: 1px solid #1677ff;
  border-radius: 6px;
  color: #1f2937;
  flex: 1;
  font-size: 14px;
  height: 28px;
  min-width: 0;
  outline: none;
  padding: 0 8px;

  &:focus {
    box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.14);
  }
`;

export const StyledMenuContent = styled(ThreadListItemMorePrimitive.Content)`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  min-width: 144px;
  padding: 4px;
  z-index: 1000;
`;

export const StyledMenuItem = styled(ThreadListItemMorePrimitive.Item)<{
  $danger?: boolean;
}>`
  align-items: center;
  border-radius: 6px;
  color: ${(props) => (props.$danger ? "#cf1322" : "#1f2937")};
  cursor: pointer;
  display: flex;
  font-size: 14px;
  gap: 8px;
  outline: none;
  padding: 7px 8px;

  &:hover,
  &:focus {
    background: ${(props) => (props.$danger ? "#fff1f0" : "#f3f4f6")};
  }

  svg {
    height: 16px;
    width: 16px;
  }
`;
