import type {
    AttachmentAdapter,
    PendingAttachment,
    CompleteAttachment,
    Attachment,
    ThreadUserContentPart
  } from "@assistant-ui/react";
  
  export const universalAttachmentAdapter: AttachmentAdapter = {
    accept: "*/*",
  
    async add({ file }): Promise<PendingAttachment> {
      const MAX_SIZE = 10 * 1024 * 1024;
  
      if (file.size > MAX_SIZE) {
        return {
          id: crypto.randomUUID(),
          type: getAttachmentType(file.type),
          name: file.name,
          file,
          contentType: file.type,
          status: {
            type: "incomplete",
            reason: "error"
          }
        };
      }
  
      return {
        id: crypto.randomUUID(),
        type: getAttachmentType(file.type),
        name: file.name,
        file,
        contentType: file.type,
        status: {
          type: "running",
          reason: "uploading",
          progress: 0
        }
      };
    },
  
    async send(attachment: PendingAttachment): Promise<CompleteAttachment> {
      const isImage = attachment.contentType.startsWith("image/");
  
      const content: ThreadUserContentPart[] = isImage
        ? [{
            type: "image",
            image: await fileToBase64(attachment.file)
          }]
        : [{
            type: "file",
            data: URL.createObjectURL(attachment.file),
            mimeType: attachment.file.type
          }];
  
      return {
        ...attachment,
        content,
        status: {
          type: "complete"
        }
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
  