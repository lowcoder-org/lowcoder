import {
  AuiIf,
  ComposerPrimitive,
  MessagePrimitive,
} from "@assistant-ui/react";
import { ArrowUpIcon, SquareIcon } from "lucide-react";
import type { FC } from "react";
import { trans } from "i18n";

import {
  ComposerAddAttachment,
  ComposerAttachments,
} from "./ui/attachment";
import { Button } from "./ui/button";
import { TooltipIconButton } from "./tooltip-icon-button";

export const Composer: FC<{
  placeholder?: string;
  showAttachments?: boolean;
}> = ({
  placeholder = trans("chat.composerPlaceholder"),
  showAttachments = true,
}) => {
  return (
    <ComposerPrimitive.Root className="aui-composer-root">
      <ComposerPrimitive.AttachmentDropzone asChild>
        <div data-slot="aui_composer-shell" className="aui-composer-shell">
          {showAttachments && <ComposerAttachments />}
          <ComposerPrimitive.Input
            placeholder={placeholder}
            className="aui-composer-input"
            rows={1}
            autoFocus
            aria-label="Message input"
          />
          <ComposerAction showAttachments={showAttachments} />
        </div>
      </ComposerPrimitive.AttachmentDropzone>
    </ComposerPrimitive.Root>
  );
};

export const EditComposer: FC = () => {
  return (
    <MessagePrimitive.Root
      data-slot="aui_edit-composer-wrapper"
      className="aui-edit-composer-wrapper"
    >
      <ComposerPrimitive.Root className="aui-edit-composer-root">
        <ComposerPrimitive.Input
          className="aui-edit-composer-input"
          autoFocus
        />
        <div className="aui-edit-composer-footer">
          <ComposerPrimitive.Cancel asChild>
            <Button variant="ghost">Cancel</Button>
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send asChild>
            <Button>Update</Button>
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </MessagePrimitive.Root>
  );
};

const ComposerAction: FC<{ showAttachments?: boolean }> = ({
  showAttachments = true,
}) => {
  return (
    <div className="aui-composer-action-wrapper">
      {showAttachments ? <ComposerAddAttachment /> : <span />}
      <AuiIf condition={(s) => !s.thread.isRunning}>
        <ComposerPrimitive.Send asChild>
          <TooltipIconButton
            tooltip="Send message"
            side="bottom"
            type="button"
            variant="default"
            size="icon"
            className="aui-composer-send"
            aria-label="Send message"
          >
            <ArrowUpIcon className="aui-composer-send-icon" />
          </TooltipIconButton>
        </ComposerPrimitive.Send>
      </AuiIf>
      <AuiIf condition={(s) => s.thread.isRunning}>
        <ComposerPrimitive.Cancel asChild>
          <Button
            type="button"
            variant="default"
            size="icon"
            className="aui-composer-cancel"
            aria-label="Stop generating"
          >
            <SquareIcon className="aui-composer-cancel-icon" />
          </Button>
        </ComposerPrimitive.Cancel>
      </AuiIf>
    </div>
  );
};
