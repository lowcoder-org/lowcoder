import type { FC } from "react";
import { useState } from "react";
import {
  ThreadListItemPrimitive,
  ThreadListPrimitive,
  useThreadListItem,
} from "@assistant-ui/react";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { TooltipIconButton } from "./tooltip-icon-button";
import { useThreadListItemRuntime } from "@assistant-ui/react";
import { Button, Flex, Input } from "antd";
import { trans } from "i18n";

import styled from "styled-components";

const StyledPrimaryButton = styled(Button)`
  // padding: 20px;
  // margin-bottom: 20px;
`;


export const ThreadList: FC = () => {
  return (
    <ThreadListPrimitive.Root className="aui-root aui-thread-list-root">
      <ThreadListNew />
      <Flex vertical style={{flex: 1, overflow: 'auto', gap: 4}}>
        <ThreadListItems />
      </Flex>
    </ThreadListPrimitive.Root>
  );
};

const ThreadListNew: FC = () => {
  return (
    <ThreadListPrimitive.New asChild>
      <StyledPrimaryButton size="middle" type="primary" icon={<PlusIcon size={16}/>}>
        {trans("chat.newThread")}
      </StyledPrimaryButton>
    </ThreadListPrimitive.New>
  );
};

const ThreadListItems: FC = () => {
  return <ThreadListPrimitive.Items components={{ ThreadListItem }} />;
};

const ThreadListItem: FC = () => {
  const [editing, setEditing] = useState(false);
  
  return (
    <ThreadListItemPrimitive.Root className="aui-thread-list-item">
      <ThreadListItemPrimitive.Trigger className="aui-thread-list-item-trigger">
        {editing ? (
          <ThreadListItemEditInput 
            onFinish={() => setEditing(false)} 
          />
        ) : (
          <ThreadListItemTitle />
        )}
      </ThreadListItemPrimitive.Trigger>
      <ThreadListItemRename 
        onStartEdit={() => setEditing(true)} 
        editing={editing}
      />
      <ThreadListItemDelete />
    </ThreadListItemPrimitive.Root>
  );
};

const ThreadListItemTitle: FC = () => {
  return (
    <p className="aui-thread-list-item-title" style={{margin: 0}}>
      <ThreadListItemPrimitive.Title fallback={trans("chat.newChatTitle")} />
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



const ThreadListItemEditInput: FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const threadItem = useThreadListItem();
  const threadRuntime = useThreadListItemRuntime();
  
  const currentTitle = threadItem?.title || trans("chat.newChatTitle");
  
  const handleRename = async (newTitle: string) => {
    if (!newTitle.trim() || newTitle === currentTitle){
      onFinish();
      return;
    }
    
    try {
      await threadRuntime.rename(newTitle);
      onFinish();
    } catch (error) {
      console.error("Failed to rename thread:", error);
    }
  };

  return (
    <Input
      size="small"
      defaultValue={currentTitle}
      onBlur={(e) => handleRename(e.target.value)}
      onPressEnter={(e) => handleRename((e.target as HTMLInputElement).value)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onFinish();
      }}
      autoFocus
      style={{ fontSize: '14px', padding: '2px 8px' }}
    />
  );
};


const ThreadListItemRename: FC<{ onStartEdit: () => void; editing: boolean }> = ({ 
  onStartEdit, 
  editing 
}) => {
  if (editing) return null;

  return (
    <TooltipIconButton
      variant="ghost"
      tooltip="Rename thread"
      onClick={onStartEdit}
    >
      <PencilIcon />
    </TooltipIconButton>
  );
};
  
