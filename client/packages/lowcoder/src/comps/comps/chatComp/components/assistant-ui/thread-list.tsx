import type { FC } from "react";
import {
  ThreadListItemPrimitive,
  ThreadListPrimitive,
} from "@assistant-ui/react";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { TooltipIconButton } from "./tooltip-icon-button";
import { useThreadListItemRuntime } from "@assistant-ui/react";
import { Button } from "antd";

import styled from "styled-components";
import { useChatContext } from "../context/ChatContext";

const StyledPrimaryButton = styled(Button)`
  padding: 20px;
  margin-bottom: 20px;
`;


export const ThreadList: FC = () => {
  return (
    <ThreadListPrimitive.Root className="aui-root aui-thread-list-root">
      <ThreadListNew />
      <ThreadListItems />
    </ThreadListPrimitive.Root>
  );
};

const ThreadListNew: FC = () => {
  return (
    <ThreadListPrimitive.New asChild>
      <StyledPrimaryButton size="large" type="primary" icon={<PlusIcon />}>
        New Thread
      </StyledPrimaryButton>
    </ThreadListPrimitive.New>
  );
};

const ThreadListItems: FC = () => {
  return <ThreadListPrimitive.Items components={{ ThreadListItem }} />;
};

const ThreadListItem: FC = () => {
  return (
    <ThreadListItemPrimitive.Root className="aui-thread-list-item">
      <ThreadListItemPrimitive.Trigger className="aui-thread-list-item-trigger">
        <ThreadListItemTitle />
      </ThreadListItemPrimitive.Trigger>
      <ThreadListItemRename />
      <ThreadListItemDelete />
    </ThreadListItemPrimitive.Root>
  );
};

const ThreadListItemTitle: FC = () => {

  return (
    <p className="aui-thread-list-item-title">
      <ThreadListItemPrimitive.Title fallback="New Chat" />
    </p>
  );
};

const ThreadListItemDelete: FC = () => {
  return (
    <ThreadListItemPrimitive.Delete asChild>
      <TooltipIconButton
        className="aui-thread-list-item-delete"
        variant="ghost"
        tooltip="Delete thread"
      >
        <Trash2Icon />
      </TooltipIconButton>
    </ThreadListItemPrimitive.Delete>
  );
};


const ThreadListItemRename: FC = () => {
  const runtime = useThreadListItemRuntime();
  
  const handleClick = async () => {
    // runtime doesn't expose a direct `title` prop; read it from its state
    let current = "";
    try {
      // getState is part of the public runtime surface
      current = (runtime.getState?.() as any)?.title ?? "";
    } catch {
      // fallback – generate a title if the runtime provides a helper
      if (typeof (runtime as any).generateTitle === "function") {
        // generateTitle(threadId) in older builds, generateTitle() in newer ones
        current = (runtime as any).generateTitle((runtime as any).threadId ?? undefined);
      }
    }

    const next = prompt("Rename thread", current)?.trim();
    if (next && next !== current) {
      await runtime.rename(next);
    }
  };

  return (
    <TooltipIconButton
      tooltip="Rename thread"
      variant="ghost"
      onClick={handleClick}
      className="aui-thread-list-item-rename"
    >
      <PencilIcon />
    </TooltipIconButton>
  );
};