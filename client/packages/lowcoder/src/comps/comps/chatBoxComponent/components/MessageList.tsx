import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Tooltip } from "antd";
import { CopyOutlined, CheckOutlined, FileOutlined, RobotOutlined } from "@ant-design/icons";
import { Sparkles } from "lucide-react";
import dayjs from "dayjs";
import { parseMessageTimestamp, formatChatTime } from "util/dateTimeUtils";
import { LLM_BOT_AUTHOR_ID } from "../store";
import { parseMessageIntoParts } from "../mentionUtils";
import type {
  ChatBoxMessageAreaStyleType,
  ChatBoxOwnMessageStyleType,
  ChatBoxOtherMessageStyleType,
  ChatBoxAiMessageStyleType,
  ChatBoxOwnAvatarStyleType,
  ChatBoxOtherAvatarStyleType,
  ChatBoxAiAvatarStyleType,
  ChatBoxAvatarRoleStyleType,
} from "comps/controls/styleControlConstants";
import { trans } from "i18n";
import {
  MessagesArea,
  MessageRow,
  MessageContentColumn,
  MessageAvatar,
  Bubble,
  BubbleMeta,
  BubbleTime,
  EmptyChat,
  TypingIndicatorWrapper,
  TypingDots,
  TypingLabel,
  AiBubbleWrapper,
  AiBadge,
  AiBubble,
  AiCopyButton,
  LlmLoadingBubble,
  MentionSpan,
} from "../styles";

const AI_AVATAR_DEFAULTS = {
  bg: "#f3e8ff",
  color: "#7c3aed",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "#e9d5ff",
} as const;

function resolveAvatarColors(
  style: ChatBoxAvatarRoleStyleType | undefined,
  isAi: boolean,
  isOwn?: boolean,
): { bg: string; color: string; border?: string } {
  const bg =
    style?.background ??
    (isAi ? AI_AVATAR_DEFAULTS.bg : isOwn ? "#1890ff" : "#f0f0f0");
  const color =
    style?.text ??
    (isAi ? AI_AVATAR_DEFAULTS.color : isOwn ? "#fff" : "#333");
  const borderWidth = style?.borderWidth ?? (isAi ? AI_AVATAR_DEFAULTS.borderWidth : "0");
  const borderStyle = style?.borderStyle || "solid";
  const borderColor = style?.border ?? (isAi ? AI_AVATAR_DEFAULTS.borderColor : "transparent");
  const border =
    borderWidth && borderWidth !== "0"
      ? `${borderWidth} ${borderStyle} ${borderColor}`
      : undefined;
  return { bg, color, border };
}

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

function readField(msg: any, ...keys: string[]): string {
  for (const k of keys) {
    if (msg[k] != null && msg[k] !== "") return String(msg[k]);
  }
  return "";
}

export type MessageFileItem = { name: string; url: string; type?: string };

function normalizeMessageFiles(msg: any): MessageFileItem[] {
  const raw = msg?.files ?? msg?.attachments;
  if (!Array.isArray(raw)) return [];
  const out: MessageFileItem[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const url = String(
      (item as any).url ?? (item as any).href ?? (item as any).link ?? (item as any).src ?? "",
    ).trim();
    if (!url) continue;
    const name =
      String(
        (item as any).name ?? (item as any).fileName ?? (item as any).title ?? "file",
      ).trim() || "file";
    const type = (item as any).type != null ? String((item as any).type) : undefined;
    out.push({ name, url, type });
  }
  return out;
}

function isProbablyImage(url: string, type?: string): boolean {
  if (type && /^image\//i.test(type)) return true;
  const path = url.split("?")[0] ?? "";
  return /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(path);
}

const MessageAttachmentsPreview = React.memo(
  ({
    files,
    tone,
  }: {
    files: MessageFileItem[];
    tone: "own" | "other" | "ai";
  }) => {
    if (files.length === 0) return null;

    const chipBg =
      tone === "own"
        ? "rgba(255,255,255,0.22)"
        : tone === "ai"
          ? "rgba(124, 58, 237, 0.08)"
          : "rgba(0,0,0,0.06)";
    const chipColor =
      tone === "own" ? "rgba(255,255,255,0.98)" : tone === "ai" ? "#4c1d95" : "#333";
    const chipBorder =
      tone === "own"
        ? "1px solid rgba(255,255,255,0.35)"
        : tone === "ai"
          ? "1px solid #e9d5ff"
          : "1px solid rgba(0,0,0,0.08)";

    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          width: "100%",
          marginBottom: 6,
        }}
      >
        {files.map((f, i) =>
          isProbablyImage(f.url, f.type) ? (
            <a
              key={`${f.url}_${i}`}
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              title={f.name}
              style={{ display: "block", lineHeight: 0, borderRadius: 8, overflow: "hidden" }}
            >
              <img
                src={f.url}
                alt={f.name}
                loading="lazy"
                style={{
                  maxWidth: 220,
                  maxHeight: 180,
                  width: "auto",
                  height: "auto",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </a>
          ) : (
            <a
              key={`${f.url}_${i}`}
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              title={f.name}
              aria-label={trans("chatBox.openAttachment", { name: f.name })}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                maxWidth: "100%",
                padding: "6px 10px",
                borderRadius: 8,
                background: chipBg,
                color: chipColor,
                border: chipBorder,
                textDecoration: "none",
                fontSize: 13,
                minWidth: 0,
              }}
            >
              <FileOutlined style={{ flexShrink: 0, opacity: 0.85 }} />
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  minWidth: 0,
                }}
              >
                {f.name}
              </span>
            </a>
          ),
        )}
      </div>
    );
  },
);

MessageAttachmentsPreview.displayName = "MessageAttachmentsPreview";

const MessageAvatarBadge = React.memo(
  ({
    displayName,
    isAi,
    isOwn,
    avatarStyle,
  }: {
    displayName: string;
    isAi?: boolean;
    isOwn?: boolean;
    avatarStyle?: ChatBoxAvatarRoleStyleType;
  }) => {
    const { bg, color, border } = resolveAvatarColors(avatarStyle, !!isAi, isOwn);
    return (
      <MessageAvatar $bg={bg} $textColor={color} $border={border} aria-hidden>
        {isAi ? (
          <Sparkles size={14} strokeWidth={2.2} />
        ) : (
          getInitials(displayName)
        )}
      </MessageAvatar>
    );
  },
);

MessageAvatarBadge.displayName = "MessageAvatarBadge";

// ── AI message bubble with copy button ───────────────────────────────────────

const AiMessageBubble = React.memo(
  ({
    text,
    authorName,
    ts,
    files,
    aiMessageStyle,
    aiAvatarStyle,
  }: {
    text: string;
    authorName: string;
    ts: dayjs.Dayjs | null;
    files: MessageFileItem[];
    aiMessageStyle?: ChatBoxAiMessageStyleType;
    aiAvatarStyle?: ChatBoxAiAvatarStyleType;
  }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      });
    }, [text]);

    const aiParts = parseMessageIntoParts(text);

    return (
      <MessageRow $own={false}>
        <MessageAvatarBadge
          displayName={authorName}
          isAi
          avatarStyle={aiAvatarStyle}
        />
        <MessageContentColumn $own={false}>
          {/* <AiBadge>
            {authorName}
          </AiBadge> */}
          <BubbleMeta $own={false} $style={aiMessageStyle}>{authorName}</BubbleMeta>
          <AiBubbleWrapper>
            {files.length > 0 && <MessageAttachmentsPreview files={files} tone="ai" />}
            <div style={{ position: "relative" }}>
              <AiBubble $style={aiMessageStyle}>
                {aiParts.map((p, i) =>
                  p.type === "mention" ? (
                    <MentionSpan key={i} $inAi>
                      @{p.label}
                    </MentionSpan>
                  ) : p.text ? (
                    <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>
                      {p.text}
                    </ReactMarkdown>
                  ) : null,
                )}
              </AiBubble>
              <Tooltip
                title={copied ? trans("chatBox.copied") : trans("chatBox.copyAction")}
                placement="right"
              >
                <AiCopyButton
                  className="ai-copy-btn"
                  onClick={handleCopy}
                  aria-label={trans("chatBox.copyAiResponse")}
                  $style={aiMessageStyle}
                >
                  {copied ? (
                    <CheckOutlined style={{ fontSize: 11, color: "#52c41a" }} />
                  ) : (
                    <CopyOutlined style={{ fontSize: 11 }} />
                  )}
                </AiCopyButton>
              </Tooltip>
            </div>
            {ts && (
              <BubbleTime $own={false} $style={aiMessageStyle}>
                {formatChatTime(ts)}
              </BubbleTime>
            )}
          </AiBubbleWrapper>
        </MessageContentColumn>
      </MessageRow>
    );
  },
);

AiMessageBubble.displayName = "AiMessageBubble";

const UserMessageBody = React.memo(({ text }: { text: string }) => (
  <span>{text}</span>
));

UserMessageBody.displayName = "UserMessageBody";

// ── Main component ───────────────────────────────────────────────────────────

export interface MessageListProps {
  messages: any[];
  typingUsers: any[];
  currentUserId: string;
  currentUserName?: string;
  isAiThinking?: boolean;
  messageAreaStyle?: ChatBoxMessageAreaStyleType;
  ownMessageStyle?: ChatBoxOwnMessageStyleType;
  otherMessageStyle?: ChatBoxOtherMessageStyleType;
  aiMessageStyle?: ChatBoxAiMessageStyleType;
  ownAvatarStyle?: ChatBoxOwnAvatarStyleType;
  otherAvatarStyle?: ChatBoxOtherAvatarStyleType;
  aiAvatarStyle?: ChatBoxAiAvatarStyleType;
}

export const MessageList = React.memo((props: MessageListProps) => {
  const {
    messages,
    typingUsers,
    currentUserId,
    currentUserName = "",
    isAiThinking = false,
    messageAreaStyle,
    ownMessageStyle,
    otherMessageStyle,
    aiMessageStyle,
    ownAvatarStyle,
    otherAvatarStyle,
    aiAvatarStyle,
  } = props;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages.length, isAiThinking]);

  return (
    <MessagesArea ref={containerRef} $areaStyle={messageAreaStyle}>
      {messages.length === 0 ? (
        <EmptyChat>
          <div style={{ fontSize: 24 }}>💬</div>
          <div>{trans("chatBox.noMessagesYet")}</div>
          <div style={{ fontSize: 12 }}>{trans("chatBox.startConversation")}</div>
        </EmptyChat>
      ) : (
        messages.map((msg, idx) => {
          const id = readField(msg, "id", "_id") || `msg_${idx}`;
          const text = readField(msg, "text", "message", "content");
          const fileItems = normalizeMessageFiles(msg);
          const authorId = readField(
            msg,
            "authorId",
            "userId",
            "author_id",
            "sender",
          );
          const authorName =
            readField(
              msg,
              "authorName",
              "userName",
              "author_name",
              "senderName",
            ) || authorId;
          const ts = parseMessageTimestamp(msg);
          const authorType = msg.authorType || msg.role || "";

          const isAssistant =
            authorType === "assistant" ||
            authorId === LLM_BOT_AUTHOR_ID;
          const isOwn = !isAssistant && authorId === currentUserId;

          if (isAssistant) {
            return (
              <AiMessageBubble
                key={id}
                text={text}
                authorName={authorName}
                ts={ts}
                files={fileItems}
                aiMessageStyle={aiMessageStyle}
                aiAvatarStyle={aiAvatarStyle}
              />
            );
          }

          const avatarName = isOwn
            ? authorName || currentUserName || currentUserId
            : authorName || authorId;
          const roleStyle = isOwn ? ownMessageStyle : otherMessageStyle;
          const avatarStyle = isOwn ? ownAvatarStyle : otherAvatarStyle;

          return (
            <MessageRow key={id} $own={isOwn}>
              <MessageAvatarBadge
                displayName={avatarName}
                isOwn={isOwn}
                avatarStyle={avatarStyle}
              />
              <MessageContentColumn $own={isOwn}>
                <BubbleMeta $own={isOwn} $style={roleStyle}>{authorName}</BubbleMeta>
                <Bubble $own={isOwn} $style={roleStyle}>
                  {fileItems.length > 0 && (
                    <MessageAttachmentsPreview files={fileItems} tone={isOwn ? "own" : "other"} />
                  )}
                  {text ? <UserMessageBody text={text} /> : null}
                  {!text && fileItems.length === 0 ? (
                    <span style={{ opacity: 0.75 }}>{trans("chatBox.emptyMessagePlaceholder")}</span>
                  ) : null}
                </Bubble>
                {ts && (
                  <BubbleTime $own={isOwn} $style={roleStyle}>
                    {formatChatTime(ts)}
                  </BubbleTime>
                )}
              </MessageContentColumn>
            </MessageRow>
          );
        })
      )}

      {isAiThinking && (
        <MessageRow $own={false}>
          <MessageAvatarBadge
            displayName={trans("chatBox.aiThinking")}
            isAi
            avatarStyle={aiAvatarStyle}
          />
          <MessageContentColumn $own={false}>
            <AiBadge>
              <RobotOutlined style={{ fontSize: 9 }} />
              {trans("chatBox.aiThinking")}
            </AiBadge>
            <LlmLoadingBubble>
              <span />
              <span />
              <span />
            </LlmLoadingBubble>
          </MessageContentColumn>
        </MessageRow>
      )}

      {typingUsers.length > 0 && (
        <TypingIndicatorWrapper>
          <TypingDots>
            <span />
            <span />
            <span />
          </TypingDots>
          <TypingLabel>
            {typingUsers.length === 1
              ? trans("chatBox.singleUserTyping", {
                  userName:
                    typingUsers[0].userName ||
                    typingUsers[0].userId ||
                    trans("chatBox.someoneLabel"),
                })
              : trans("chatBox.multipleUsersTyping", { count: typingUsers.length })}
          </TypingLabel>
        </TypingIndicatorWrapper>
      )}

    </MessagesArea>
  );
});

MessageList.displayName = "MessageList";
