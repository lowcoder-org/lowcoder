import type {
    AttachmentAdapter,
    PendingAttachment,
    CompleteAttachment,
    Attachment,
    ThreadUserMessagePart
  } from "@assistant-ui/react";
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";
  
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  export const universalAttachmentAdapter: AttachmentAdapter = {
    accept: "*",
  
    async add({ file }): Promise<PendingAttachment> {
      if (file.size > MAX_FILE_SIZE) {
        messageInstance.error(
          `File "${file.name}" exceeds the 10 MB size limit (${(file.size / 1024 / 1024).toFixed(1)} MB).`
        );
        throw new Error(
          `File "${file.name}" exceeds the 10 MB size limit (${(file.size / 1024 / 1024).toFixed(1)} MB).`
        );
      }
  
      return {
        id: crypto.randomUUID(),
        type: getAttachmentType(file.type),
        name: file.name,
        file,
        contentType: file.type,
        status: {
          type: "requires-action",
          reason: "composer-send",
        },
      };
    },
  
    async send(attachment: PendingAttachment): Promise<CompleteAttachment> {
      const isImage = attachment.contentType?.startsWith("image/");

      let content: ThreadUserMessagePart[];

      try {
        content = isImage
          ? [{
              type: "image",
              image: await fileToBase64(attachment.file),
            }]
          : [{
              type: "file",
              data: URL.createObjectURL(attachment.file),
              mimeType: attachment.file.type,
            }];
      } catch (err) {
        const errorMessage = `Failed to process attachment "${attachment.name}": ${err instanceof Error ? err.message : "unknown error"}`;
        messageInstance.error(errorMessage);
        throw new Error(errorMessage);
      }

      return {
        ...attachment,
        content,
        status: {
          type: "complete",
        },
      };
    },
  
    async remove(attachment: Attachment): Promise<void> {
      if (!attachment.content) return;
  
      for (const part of attachment.content) {
        if (part.type === "file" && part.data.startsWith("blob:")) {
            try {
              URL.revokeObjectURL(part.data);
            } catch {
              // Ignore errors
            }
          }
      }
    }
  };
  
  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  
  function getAttachmentType(mime: string): "image" | "file" {
    return mime.startsWith("image/") ? "image" : "file";
  }
  
