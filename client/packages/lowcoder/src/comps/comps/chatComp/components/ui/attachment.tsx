"use client";

import { PropsWithChildren, useCallback, useEffect, useRef, useState, type FC } from "react";
import { CircleXIcon, FileIcon, PaperclipIcon } from "lucide-react";
import {
  AttachmentPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  useAttachment,
} from "@assistant-ui/react";
import styled from "styled-components";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./tooltip";
import {
  Dialog,
  DialogTitle,
  DialogTrigger,
  DialogOverlay,
  DialogPortal,
  DialogContent,
} from "./dialog";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";
import { TooltipIconButton } from "../assistant-ui/tooltip-icon-button";

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const StyledDialogTrigger = styled(DialogTrigger)`
  cursor: pointer;
  transition: background-color 0.2s;
  padding: 2px;
  border-radius: 4px;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

const StyledAvatar = styled(Avatar)`
  background-color: #f1f5f9;
  display: flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  font-size: 14px;
`;

const AttachmentContainer = styled.div`
  display: flex;
  height: 48px;
  width: 160px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 4px;
`;

const AttachmentTextContainer = styled.div`
  flex-grow: 1;
  flex-basis: 0;
  overflow: hidden;
`;

const AttachmentName = styled.p`
  color: #64748b;
  font-size: 12px;
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  word-break: break-all;
  margin: 0;
  line-height: 16px;
`;

const AttachmentType = styled.p`
  color: #64748b;
  font-size: 12px;
  margin: 0;
  line-height: 16px;
`;

const AttachmentRoot = styled(AttachmentPrimitive.Root)`
  position: relative;
  margin-top: 12px;
`;

const StyledTooltipIconButton = styled(TooltipIconButton)`
  color: #64748b;
  position: absolute;
  right: -12px;
  top: -12px;
  width: 24px;
  height: 24px;

  & svg {
    background-color: white;
    width: 16px;
    height: 16px;
    border-radius: 50%;
  }
`;

const UserAttachmentsContainer = styled.div`
  display: flex;
  width: 100%;
  flex-direction: row;
  gap: 12px;
  grid-column: 1 / -1;
  grid-row-start: 1;
  justify-content: flex-end;
`;

const ComposerAttachmentsContainer = styled.div`
  display: flex;
  width: 100%;
  flex-direction: row;
  gap: 12px;
  overflow-x: auto;
`;

const StyledComposerButton = styled(TooltipIconButton)`
  margin: 10px 0;
  width: 32px;
  height: 32px;
  padding: 8px;
  transition: opacity 0.2s ease-in;
`;

const ScreenReaderOnly = styled.span`
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
`;

// ============================================================================
// UTILITY HOOKS
// ============================================================================


const useFileSrc = (file: File | undefined) => {
  const [src, setSrc] = useState<string | undefined>();
  const lastFileRef = useRef<File>();

  useEffect(() => {
    if (!file || file === lastFileRef.current) return;

    const objectUrl = URL.createObjectURL(file);
    setSrc(objectUrl);
    lastFileRef.current = file;

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  return src;
};



const useAttachmentSrc = () => {
  const attachment = useAttachment(
    useCallback((a: any) => {
      if (a.type !== "image") return undefined;
      return a;
    }, [])
  );

  const [src, setSrc] = useState<string | undefined>();
  const lastAttachmentRef = useRef<any>();

  useEffect(() => {
    if (!attachment || attachment === lastAttachmentRef.current) return;

    // Handle new/pending attachments with File objects
    if (attachment.file && attachment.file instanceof File) {
      const objectUrl = URL.createObjectURL(attachment.file);
      setSrc(objectUrl);
      lastAttachmentRef.current = attachment;

      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }

    // Handle saved attachments with base64 data
    const imageContent = attachment.content?.find((c: any) => c.type === "image");
    if (imageContent?.image) {
      setSrc(imageContent.image);
      lastAttachmentRef.current = attachment;
      return;
    }

    // If no valid source found, clear the src
    setSrc(undefined);
    lastAttachmentRef.current = attachment;
  }, [attachment]);

  return src;
};

// ============================================================================
// ATTACHMENT COMPONENTS
// ============================================================================

type AttachmentPreviewProps = {
  src: string;
};

const AttachmentPreview: FC<AttachmentPreviewProps> = ({ src }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <img
      src={src}
      style={{
        width: "auto",
        height: "auto",
        maxWidth: "75dvh",
        maxHeight: "75dvh",
        display: isLoaded ? "block" : "none",
        overflow: "clip",
      }}
      onLoad={() => setIsLoaded(true)}
      alt="Preview"
    />
  );
};

const AttachmentPreviewDialog: FC<PropsWithChildren> = ({ children }) => {
  const src = useAttachmentSrc();

  if (!src) return <>{children}</>;

  return (
    <Dialog>
      <StyledDialogTrigger asChild>
        {children}
      </StyledDialogTrigger>
      <AttachmentDialogContent>
        <DialogTitle>
          <ScreenReaderOnly>Image Attachment Preview</ScreenReaderOnly>
        </DialogTitle>
        <AttachmentPreview src={src} />
      </AttachmentDialogContent>
    </Dialog>
  );
};

const AttachmentThumb: FC = () => {
  const isImage = useAttachment((a) => a.type === "image");
  const src = useAttachmentSrc();
  return (
    <StyledAvatar>
      <AvatarFallback delayMs={isImage ? 200 : 0}>
        <FileIcon />
      </AvatarFallback>
      <AvatarImage src={src} />
    </StyledAvatar>
  );
};

const AttachmentUI: FC = () => {
  const canRemove = useAttachment((a) => a.source !== "message");
  const typeLabel = useAttachment((a) => {
    const type = a.type;
    switch (type) {
      case "image":
        return "Image";
      case "document":
        return "Document";
      case "file":
        return "File";
      default:
        const _exhaustiveCheck: never = type;
        throw new Error(`Unknown attachment type: ${_exhaustiveCheck}`);
    }
  });
  
  return (
    <Tooltip>
      <AttachmentRoot>
        <AttachmentPreviewDialog>
          <TooltipTrigger asChild>
            <AttachmentContainer>
              <AttachmentThumb />
              <AttachmentTextContainer>
                <AttachmentName>
                  <AttachmentPrimitive.Name />
                </AttachmentName>
                <AttachmentType>{typeLabel}</AttachmentType>
              </AttachmentTextContainer>
            </AttachmentContainer>
          </TooltipTrigger>
        </AttachmentPreviewDialog>
        {canRemove && <AttachmentRemove />}
      </AttachmentRoot>
      <TooltipContent side="top">
        <AttachmentPrimitive.Name />
      </TooltipContent>
    </Tooltip>
  );
};

const AttachmentRemove: FC = () => {
  return (
    <AttachmentPrimitive.Remove asChild>
      <StyledTooltipIconButton
        tooltip="Remove file"
        side="top"
      >
        <CircleXIcon />
      </StyledTooltipIconButton>
    </AttachmentPrimitive.Remove>
  );
};

// ============================================================================
// EXPORTED COMPONENTS
// ============================================================================

export const UserMessageAttachments: FC = () => {
  return (
    <UserAttachmentsContainer>
      <MessagePrimitive.Attachments components={{ Attachment: AttachmentUI }} />
    </UserAttachmentsContainer>
  );
};

export const ComposerAttachments: FC = () => {
  return (
    <ComposerAttachmentsContainer>
      <ComposerPrimitive.Attachments
        components={{ Attachment: AttachmentUI }}
      />
    </ComposerAttachmentsContainer>
  );
};

export const ComposerAddAttachment: FC = () => {
  return (
    <ComposerPrimitive.AddAttachment asChild>
      <StyledComposerButton
        tooltip="Add Attachment"
        variant="ghost"
      >
        <PaperclipIcon />
      </StyledComposerButton>
    </ComposerPrimitive.AddAttachment>
  );
};

const AttachmentDialogContent: FC<PropsWithChildren> = ({ children }) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogContent className="aui-dialog-content">
      {children}
    </DialogContent>
  </DialogPortal>
);