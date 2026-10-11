import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  CloseOutlined,
  FileOutlined,
  PaperClipOutlined,
  RobotOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { default as AntdUpload } from "antd/es/upload";
import type { UploadChangeParam, UploadFile } from "antd/es/upload/interface";
import type { UploadRequestOption } from "rc-upload/lib/interface";
import { default as Mentions, type MentionsOptionProps } from "antd/es/mentions";
import type { MentionsProps } from "antd/es/mentions";
import type {
  ChatBoxInputAreaStyleType,
  ChatBoxInputFieldStyleType,
  ChatBoxInputSendButtonStyleType,
  ChatBoxInputAttachButtonStyleType,
} from "comps/controls/styleControlConstants";
import {
  InputBarAttachmentCard,
  InputBarAttachmentKind,
  InputBarAttachmentList,
  InputBarAttachmentMeta,
  InputBarAttachmentName,
  InputBarAttachmentRemove,
  InputBarAttachmentThumb,
  InputBarAttachmentThumbImg,
  InputBarAttachButton,
  InputBarContainer,
  InputBarFieldWrap,
  InputBarInputRow,
  InputBarSendButton,
} from "../styles";
import { trans } from "i18n";
import type { ChatBoxMessageUploadHandle } from "../ChatBoxContext";
import type { MentionCandidate } from "../mentionUtils";
import { mentionInsertValue } from "../mentionUtils";
import { resolveValue, validateFile } from "../../fileComp/fileComp";
import type { JSONObject } from "util/jsonTypes";

function fileAttachmentKindLabel(mimeType: string | undefined, fileName: string): string {
  const m = (mimeType || "").toLowerCase();
  if (m.startsWith("image/")) return "Image";
  if (m === "application/pdf") return "PDF";
  if (m.startsWith("video/")) return "Video";
  if (m.startsWith("audio/")) return "Audio";
  const ext = fileName.includes(".") ? fileName.split(".").pop() : "";
  return ext && /^[a-z0-9]+$/i.test(ext) ? ext.toUpperCase() : "File";
}

function imageDataUrl(mimeType: string | undefined, base64: string | null): string | null {
  if (!base64 || !(mimeType || "").toLowerCase().startsWith("image/")) return null;
  return `data:${mimeType};base64,${base64}`;
}

export interface InputBarProps {
  onSend: (text: string) => void;
  onStartTyping: () => void;
  onStopTyping: () => void;
  onDraftChange: (text: string) => void;
  inputAreaStyle?: ChatBoxInputAreaStyleType;
  inputFieldStyle?: ChatBoxInputFieldStyleType;
  inputSendButtonStyle?: ChatBoxInputSendButtonStyleType;
  inputAttachButtonStyle?: ChatBoxInputAttachButtonStyleType;
  mentionCandidates?: MentionCandidate[];
  allowMessageFileUpload?: boolean;
  maxMessageFiles?: number;
  messageFileType?: string[];
  messageFiles: JSONObject[];
  messageFileValues: Array<string | null>;
  onAttachmentsChange: (files: JSONObject[], values: Array<string | null>) => void;
  onFileUpload: () => void;
  messageUploadRef?: (instance: ChatBoxMessageUploadHandle | null) => void;
}

export const InputBar = React.memo((props: InputBarProps) => {
  const {
    onSend,
    onStartTyping,
    onStopTyping,
    onDraftChange,
    inputAreaStyle,
    inputFieldStyle,
    inputSendButtonStyle,
    inputAttachButtonStyle,
    mentionCandidates = [],
    allowMessageFileUpload = false,
    maxMessageFiles = 10,
    messageFileType = [],
    messageFiles,
    messageFileValues,
    onAttachmentsChange,
    onFileUpload,
    messageUploadRef,
  } = props;
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const fieldWrapRef = useRef<HTMLDivElement>(null);
  const uploadHostRef = useRef<HTMLSpanElement>(null);
  const allowMessageFileUploadRef = useRef(allowMessageFileUpload);
  const maxMessageFilesRef = useRef(maxMessageFiles);
  const messageFilesRef = useRef(messageFiles);
  const messageFileValuesRef = useRef(messageFileValues);

  useEffect(() => {
    messageFilesRef.current = messageFiles;
    messageFileValuesRef.current = messageFileValues;
  }, [messageFiles, messageFileValues]);

  useEffect(() => {
    allowMessageFileUploadRef.current = allowMessageFileUpload;
  }, [allowMessageFileUpload]);

  useEffect(() => {
    maxMessageFilesRef.current = maxMessageFiles;
  }, [maxMessageFiles]);

  const [draft, setDraft] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState<UploadFile[]>([]);

  const effectiveMax =
    typeof maxMessageFiles === "number" && maxMessageFiles > 0 ? maxMessageFiles : 100;

  const accept =
    Array.isArray(messageFileType) && messageFileType.length > 0
      ? messageFileType.join(",")
      : undefined;

  const clearTypingTimeout = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, []);

  const handleStopTyping = useCallback(() => {
    clearTypingTimeout();
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onStopTyping();
    }
  }, [onStopTyping, clearTypingTimeout]);

  const processChange = useCallback(
    (value: string) => {
      setDraft(value);
      onDraftChange(value);

      if (!value.trim()) {
        handleStopTyping();
        return;
      }

      if (!isTypingRef.current) {
        isTypingRef.current = true;
        onStartTyping();
      }

      clearTypingTimeout();
      typingTimeoutRef.current = setTimeout(() => {
        handleStopTyping();
      }, 2000);
    },
    [onDraftChange, handleStopTyping, onStartTyping, clearTypingTimeout],
  );

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text && messageFiles.length === 0) return;
    handleStopTyping();
    onSend(text);
    setDraft("");
    onDraftChange("");
  }, [draft, messageFiles.length, onSend, handleStopTyping, onDraftChange]);

  const removeAttachmentAt = useCallback(
    (index: number) => {
      const files = messageFilesRef.current;
      const values = messageFileValuesRef.current;
      onAttachmentsChange(
        files.filter((_, i) => i !== index),
        values.filter((_, i) => i !== index),
      );
    },
    [onAttachmentsChange],
  );

  const handleUploadChange = useCallback(
    (param: UploadChangeParam) => {
      const currentlyUploading = param.fileList.filter((f) => f.status === "uploading");
      if (currentlyUploading.length !== 0) {
        setUploadingFiles(currentlyUploading);
        return;
      }
      setUploadingFiles([]);

      const uploadedFiles = param.fileList.filter((f) => f.status === "done");

      if (param.file.status === "removed") {
        const index = messageFilesRef.current.findIndex((f) => f.uid === param.file.uid);
        if (index >= 0) {
          removeAttachmentAt(index);
        }
        return;
      }

      const prevMeta = messageFilesRef.current;
      const prevValues = messageFileValuesRef.current;
      const prevUids = new Set(prevMeta.map((f) => String(f.uid ?? "")));
      const newEntries = uploadedFiles.filter((f) => !prevUids.has(String(f.uid ?? "")));

      if (newEntries.length === 0) {
        return;
      }

      resolveValue(newEntries).then((newValues) => {
        const snapMeta = messageFilesRef.current;
        const snapValues = messageFileValuesRef.current;
        const snapUids = new Set(snapMeta.map((f) => String(f.uid ?? "")));

        const pairs: { meta: JSONObject; value: string | null }[] = [];
        for (let i = 0; i < newEntries.length; i++) {
          const file = newEntries[i];
          const uid = String(file.uid ?? "");
          if (snapUids.has(uid)) continue;
          const meta: JSONObject = {
            uid: file.uid,
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified,
          };
          pairs.push({ meta, value: newValues[i] ?? null });
        }

        if (pairs.length === 0) {
          return;
        }

        const nextMeta = [...snapMeta, ...pairs.map((p) => p.meta)].slice(-effectiveMax);
        const mergedValues = [...snapValues, ...pairs.map((p) => p.value)].slice(-effectiveMax);
        onAttachmentsChange(nextMeta, mergedValues);
        onFileUpload();
      });
    },
    [effectiveMax, onAttachmentsChange, onFileUpload, removeAttachmentAt],
  );

  const uploadFileList = useMemo<UploadFile[]>(
    () => [
      ...(messageFiles.map((f) => ({ ...f, status: "done" as const })) as UploadFile[]),
      ...uploadingFiles,
    ],
    [messageFiles, uploadingFiles],
  );

  const mentionOptions = useMemo(
    () =>
      mentionCandidates.map((c) => ({
        key: `${c.kind}:${c.id}`,
        value: mentionInsertValue(c.label, c.id),
        label: (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              minWidth: 0,
            }}
          >
            {c.kind === "llm" ? (
              <RobotOutlined style={{ color: "#722ed1", fontSize: 14, flexShrink: 0 }} />
            ) : null}
            <span
              style={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {mentionInsertValue(c.label, c.id)}
            </span>
            {c.kind === "llm" ? (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "1px 6px",
                  borderRadius: 4,
                  marginLeft: "auto",
                  flexShrink: 0,
                  background: "#f9f0ff",
                  color: "#722ed1",
                }}
              >
                {trans("chatBox.mentionLlmBadge")}
              </span>
            ) : null}
          </span>
        ),
      })),
    [mentionCandidates],
  );
  const filterOption = useCallback(
    (input: string, option: MentionsOptionProps) => {
      const key = String(option?.key ?? "");
      const cand = mentionCandidates.find((x) => `${x.kind}:${x.id}` === key);
      if (!cand) return false;
      const q = input.toLowerCase();
      return (
        cand.label.toLowerCase().includes(q) || cand.id.toLowerCase().includes(q)
      );
    },
    [mentionCandidates],
  );

  const attachStyleResolved = useMemo(() => {
    if (!inputAttachButtonStyle) return undefined;
    const icon =
      inputAttachButtonStyle.attachButtonIcon?.trim() ||
      inputFieldStyle?.text ||
      "#1f2937";
    return { ...inputAttachButtonStyle, attachButtonIcon: icon };
  }, [inputAttachButtonStyle, inputFieldStyle]);

  const placeholderText = trans("chatBox.typeMessagePlaceholder");

  const mentionsStyles = useMemo(() => {
    const s = inputFieldStyle;
    return {
      textarea: {
        padding: "8px 6px",
        fontSize: 14,
        lineHeight: 1.45,
        borderRadius: 0,
        border: "none",
        boxShadow: "none",
        outline: "none",
        background: "transparent",
        color: s?.text ?? "inherit",
        resize: "none" as const,
        minHeight: 28,
        maxHeight: 96,
      },
    } satisfies NonNullable<MentionsProps["styles"]>;
  }, [inputFieldStyle]);

  const canAddMore = messageFiles.length < effectiveMax;
  const isUploading = uploadingFiles.length > 0;

  const openFilePicker = useCallback(() => {
    if (!allowMessageFileUploadRef.current) {
      return;
    }
    const max =
      typeof maxMessageFilesRef.current === "number" && maxMessageFilesRef.current > 0
        ? maxMessageFilesRef.current
        : 100;
    if (messageFilesRef.current.length >= max) {
      return;
    }
    const input = uploadHostRef.current?.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement | null;
    input?.click();
  }, []);

  useLayoutEffect(() => {
    if (!messageUploadRef) {
      return;
    }
    messageUploadRef({ openFilePicker });
    return () => messageUploadRef(null);
  }, [messageUploadRef, openFilePicker]);

  return (
    <InputBarContainer $areaStyle={inputAreaStyle}>
      {allowMessageFileUpload && messageFiles.length > 0 && (
        <InputBarAttachmentList>
          {messageFiles.map((f, i) => {
            const name = String(f.name ?? f.uid ?? i);
            const mimeType = typeof f.type === "string" ? f.type : undefined;
            const b64 = messageFileValues[i] ?? null;
            const imgSrc = imageDataUrl(mimeType, b64);
            return (
              <InputBarAttachmentCard key={String(f.uid ?? i)} $fieldStyle={inputFieldStyle}>
                <InputBarAttachmentRemove
                  type="button"
                  aria-label={trans("remove")}
                  title={trans("remove")}
                  onClick={(e) => {
                    e.preventDefault();
                    removeAttachmentAt(i);
                  }}
                >
                  <CloseOutlined />
                </InputBarAttachmentRemove>
                <InputBarAttachmentThumb>
                  {imgSrc ? (
                    <InputBarAttachmentThumbImg src={imgSrc} alt="" />
                  ) : (
                    <FileOutlined />
                  )}
                </InputBarAttachmentThumb>
                <InputBarAttachmentMeta>
                  <InputBarAttachmentName $fieldStyle={inputFieldStyle} title={name}>
                    {name}
                  </InputBarAttachmentName>
                  <InputBarAttachmentKind>
                    {fileAttachmentKindLabel(mimeType, name)}
                  </InputBarAttachmentKind>
                </InputBarAttachmentMeta>
              </InputBarAttachmentCard>
            );
          })}
        </InputBarAttachmentList>
      )}
      <InputBarFieldWrap ref={fieldWrapRef} $fieldStyle={inputFieldStyle}>
        <InputBarInputRow $fieldStyle={inputFieldStyle}>
          {allowMessageFileUpload && (
            <span ref={uploadHostRef} style={{ display: "inline-flex" }}>
              <AntdUpload
                key={JSON.stringify(messageFiles.map((f) => String(f.uid ?? "")))}
                accept={accept}
                multiple={effectiveMax > 1}
                showUploadList={false}
                fileList={uploadFileList}
                disabled={!canAddMore}
                customRequest={(options: UploadRequestOption) =>
                  options.onSuccess && options.onSuccess({})
                }
                beforeUpload={(file) => validateFile(file, {})}
                onChange={handleUploadChange}
              >
                <InputBarAttachButton
                  icon={<PaperClipOutlined />}
                  loading={isUploading}
                  disabled={!canAddMore}
                  $attachStyle={attachStyleResolved}
                  title={trans("chatBox.attachFileTooltip")}
                  aria-label={trans("chatBox.attachFileTooltip")}
                />
              </AntdUpload>
            </span>
          )}
          <Mentions
            value={draft}
            onChange={processChange}
            prefix="@"
            placement="top"
            options={mentionOptions}
            filterOption={mentionCandidates.length > 0 ? filterOption : false}
            notFoundContent={trans("chatBox.mentionNoMatches")}
            getPopupContainer={() =>
              fieldWrapRef.current ?? document.body
            }
            variant="borderless"
            placeholder={placeholderText}
            autoSize={{ minRows: 1, maxRows: 4 }}
            style={{ flex: 1, minWidth: 0, width: "100%" }}
            styles={mentionsStyles}
            onPressEnter={(e) => {
              if (e.shiftKey) {
                return;
              }
              e.preventDefault();
              handleSend();
            }}
          />
          <InputBarSendButton
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={!draft.trim() && messageFiles.length === 0}
            $sendStyle={inputSendButtonStyle}
            aria-label="Send"
            title="Send"
          />
        </InputBarInputRow>
      </InputBarFieldWrap>
    </InputBarContainer>
  );
});

InputBar.displayName = "InputBar";
