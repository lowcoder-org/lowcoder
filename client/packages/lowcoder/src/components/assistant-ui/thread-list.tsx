import { Button } from "./ui/button";
import {
  AuiIf,
  ThreadListItemMorePrimitive,
  ThreadListItemPrimitive,
  ThreadListPrimitive,
  useAui,
  useAuiState,
} from "@assistant-ui/react";
import {
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "lucide-react";
import { trans } from "i18n";
import type { FC, KeyboardEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  SkeletonBar,
  SkeletonRow,
  SkeletonStack,
  StyledMenuContent,
  StyledMenuItem,
  StyledThreadRenameForm,
  StyledThreadRenameInput,
  StyledNewThreadButton,
  StyledThreadListItem,
  StyledThreadListRoot,
  StyledThreadListTrigger,
  ThreadTitle,
} from "./thread-list.styles";

const ThreadListSkeleton: FC = () => {
  return (
    <SkeletonStack>
      {Array.from({ length: 5 }, (_, i) => (
        <SkeletonRow key={i} role="status" aria-label="Loading threads">
          <SkeletonBar />
        </SkeletonRow>
      ))}
    </SkeletonStack>
  );
};

export const ThreadList: FC = () => {
  return (
    <StyledThreadListRoot className="aui-root aui-thread-list-root">
      <ThreadListNew />
      <AuiIf condition={(s) => s.threads.isLoading}>
        <ThreadListSkeleton />
      </AuiIf>
      <AuiIf condition={(s) => !s.threads.isLoading}>
        <ThreadListPrimitive.Items>
          {() => <ThreadListItem />}
        </ThreadListPrimitive.Items>
      </AuiIf>
    </StyledThreadListRoot>
  );
};

const ThreadListNew: FC = () => {
  return (
    <ThreadListPrimitive.New asChild>
      <StyledNewThreadButton variant="default">
        <PlusIcon />
        {trans("chat.newThread")}
      </StyledNewThreadButton>
    </ThreadListPrimitive.New>
  );
};

const ThreadListItem: FC = () => {
  const aui = useAui();
  const title =
    useAuiState((s) => s.threadListItem.title) || trans("chat.newChatTitle");
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);
  const isSavingRef = useRef(false);
  const skipNextBlurSaveRef = useRef(false);

  useEffect(() => {
    if (!isEditing) setDraftTitle(title);
  }, [isEditing, title]);

  useEffect(() => {
    if (!isEditing) return;

    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isEditing]);

  const startEditing = useCallback(() => {
    skipNextBlurSaveRef.current = false;
    setDraftTitle(title);
    setIsEditing(true);
  }, [title]);

  const cancelEditing = useCallback(() => {
    skipNextBlurSaveRef.current = true;
    setDraftTitle(title);
    setIsEditing(false);
  }, [title]);

  const saveTitle = useCallback(async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;

    const nextTitle = draftTitle.trim();

    try {
      if (nextTitle && nextTitle !== title) {
        await aui.threadListItem().rename(nextTitle);
      }
      setIsEditing(false);
    } finally {
      isSavingRef.current = false;
    }
  }, [aui, draftTitle, title]);

  const handleRenameKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void saveTitle();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      cancelEditing();
    }
  };

  return (
    <StyledThreadListItem className="aui-thread-list-item">
      {isEditing ? (
        <StyledThreadRenameForm
          onSubmit={(event) => {
            event.preventDefault();
            void saveTitle();
          }}
        >
          <StyledThreadRenameInput
            ref={inputRef}
            aria-label={trans("rename")}
            value={draftTitle}
            onBlur={() => {
              if (skipNextBlurSaveRef.current) {
                skipNextBlurSaveRef.current = false;
                return;
              }

              void saveTitle();
            }}
            onChange={(event) => setDraftTitle(event.target.value)}
            onKeyDown={handleRenameKeyDown}
          />
        </StyledThreadRenameForm>
      ) : (
        <StyledThreadListTrigger className="aui-thread-list-item-trigger">
          <ThreadTitle className="aui-thread-list-item-title">
            <ThreadListItemPrimitive.Title
              fallback={trans("chat.newChatTitle")}
            />
          </ThreadTitle>
        </StyledThreadListTrigger>
      )}
      <ThreadListItemMore onRename={startEditing} />
    </StyledThreadListItem>
  );
};

const ThreadListItemMore: FC<{ onRename: () => void }> = ({ onRename }) => {
  return (
    <ThreadListItemMorePrimitive.Root>
      <ThreadListItemMorePrimitive.Trigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          className="aui-thread-list-item-more"
          aria-label="More thread options"
        >
          <MoreHorizontalIcon />
        </Button>
      </ThreadListItemMorePrimitive.Trigger>
      <StyledMenuContent side="bottom" align="start">
        <StyledMenuItem onSelect={onRename}>
          <PencilIcon />
          {trans("rename")}
        </StyledMenuItem>
        <ThreadListItemPrimitive.Delete asChild>
          <StyledMenuItem $danger>
            <TrashIcon />
            Delete
          </StyledMenuItem>
        </ThreadListItemPrimitive.Delete>
      </StyledMenuContent>
    </ThreadListItemMorePrimitive.Root>
  );
};
