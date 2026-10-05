import styled from "styled-components";
import { default as AntdButton } from "antd/es/button";
import type {
  ChatBoxContainerStyleType,
  ChatBoxSidebarStyleType,
  ChatBoxHeaderStyleType,
  ChatBoxMessageAreaStyleType,
  ChatBoxMessageRoleStyleType,
  ChatBoxAiMessageStyleType,
  ChatBoxInputAreaStyleType,
  ChatBoxInputFieldStyleType,
  ChatBoxInputSendButtonStyleType,
  ChatBoxInputAttachButtonStyleType,
  AnimationStyleType,
} from "comps/controls/styleControlConstants";

const messageBoxShadow = (style?: { boxShadow?: string; boxShadowColor?: string }) =>
  `${style?.boxShadow ?? ""} ${style?.boxShadowColor ?? ""}`.trim() || "none";

export const Wrapper = styled.div<{ $style: ChatBoxContainerStyleType; $anim: AnimationStyleType }>`
  height: 100%;
  display: flex;
  overflow: hidden;
  border-radius: ${(p) => p.$style.radius || "8px"};
  border: ${(p) => p.$style.borderWidth || "1px"} ${(p) => p.$style.borderStyle || "solid"} ${(p) => p.$style.border || "#e0e0e0"};
  background: ${(p) => p.$style.background || "#fff"};
  margin: ${(p) => p.$style.margin || "0"};
  padding: ${(p) => p.$style.padding || "0"};
  box-shadow: ${(p) => messageBoxShadow(p.$style)};
  ${(p) => p.$anim}
`;

export const RoomPanelContainer = styled.div<{
  $width: string;
  $sidebarStyle?: ChatBoxSidebarStyleType;
}>`
  width: ${(p) => p.$width};
  min-width: 160px;
  border-right: 1px solid ${(p) => p.$sidebarStyle?.sidebarBorder || "#eee"};
  display: flex;
  flex-direction: column;
  background: ${(p) => p.$sidebarStyle?.sidebarBackground || "#fafbfc"};
  color: ${(p) => p.$sidebarStyle?.sidebarText || "inherit"};
  border-radius: ${(p) => p.$sidebarStyle?.radius || "0"};
`;

export const RoomPanelHeader = styled.div<{ $sidebarStyle?: ChatBoxSidebarStyleType }>`
  padding: 12px;
  font-weight: 600;
  font-size: 13px;
  color: ${(p) => p.$sidebarStyle?.sidebarText || "#555"};
  background: ${(p) => p.$sidebarStyle?.sidebarHeaderBackground || "transparent"};
  border-bottom: 1px solid ${(p) => p.$sidebarStyle?.sidebarBorder || "#eee"};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const RoomListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px;
`;

export const RoomItemStyled = styled.div<{
  $active: boolean;
  $sidebarStyle?: ChatBoxSidebarStyleType;
}>`
  padding: ${(p) => p.$sidebarStyle?.padding || "8px 10px"};
  margin-bottom: 4px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  background: ${(p) =>
    p.$active
      ? p.$sidebarStyle?.sidebarActiveItemBackground || "#1890ff"
      : "#fff"};
  color: ${(p) =>
    p.$active
      ? p.$sidebarStyle?.sidebarActiveItemText || "#fff"
      : p.$sidebarStyle?.sidebarText || "#333"};
  border: 1px solid ${(p) =>
    p.$active
      ? p.$sidebarStyle?.sidebarActiveItemBackground || "#1890ff"
      : "#f0f0f0"};

  &:hover {
    background: ${(p) =>
      p.$active
        ? p.$sidebarStyle?.sidebarActiveItemBackground || "#1890ff"
        : "#f5f5f5"};
  }
`;

export const SearchResultBadge = styled.span`
  font-size: 10px;
  background: #e6f7ff;
  color: #1890ff;
  padding: 1px 6px;
  border-radius: 8px;
  font-weight: 500;
  margin-left: auto;
`;

export const ChatPanelContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

export const ChatHeaderBar = styled.div<{ $headerStyle?: ChatBoxHeaderStyleType }>`
  padding: ${(p) => p.$headerStyle?.padding || "12px 16px"};
  border-bottom: 1px solid ${(p) => p.$headerStyle?.headerBorder || "#eee"};
  background: ${(p) => p.$headerStyle?.headerBackground || "transparent"};
  color: ${(p) => p.$headerStyle?.headerText || "inherit"};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const MessagesArea = styled.div<{ $areaStyle?: ChatBoxMessageAreaStyleType }>`
  flex: 1;
  overflow-y: auto;
  padding: ${(p) => p.$areaStyle?.padding || "16px"};
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: ${(p) => p.$areaStyle?.messageAreaBackground || "transparent"};
`;

export const MessageRow = styled.div<{ $own: boolean }>`
  display: flex;
  flex-direction: ${(p) => (p.$own ? "row-reverse" : "row")};
  align-items: flex-end;
  gap: 8px;
  align-self: ${(p) => (p.$own ? "flex-end" : "flex-start")};
  max-width: 85%;
  width: 100%;
`;

export const MessageContentColumn = styled.div<{ $own: boolean }>`
  display: flex;
  flex-direction: column;
  min-width: 0;
  // flex: 1;
  max-width: calc(100% - 40px);
`;

export const MessageAvatar = styled.div<{
  $bg: string;
  $textColor: string;
  $border?: string;
}>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${(p) => p.$bg};
  color: ${(p) => p.$textColor};
  border: ${(p) => p.$border || "none"};
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  letter-spacing: 0.02em;
  user-select: none;
  margin-bottom: 19px;
`;

export const Bubble = styled.div<{
  $own: boolean;
  $style?: ChatBoxMessageRoleStyleType;
}>`
  padding: ${(p) => p.$style?.padding || "10px 14px"};
  border-radius: ${(p) => {
    const r = p.$style?.radius;
    if (r && r !== "0") return r;
    return p.$own ? "16px 16px 4px 16px" : "16px 16px 16px 4px";
  }};
  ${(p) => !p.$own ?
    `border-bottom-left-radius: 0;` :
    `border-bottom-right-radius: 0;`
  }
  border-width: ${(p) => p.$style?.borderWidth || "0"};
  border-style: ${(p) => p.$style?.borderStyle || "solid"};
  border-color: ${(p) => p.$style?.border || "transparent"};
  background: ${(p) =>
    p.$style?.background || (p.$own ? "#1890ff" : "#f0f0f0")};
  color: ${(p) => p.$style?.text || (p.$own ? "#fff" : "#333")};
  font-size: ${(p) => p.$style?.textSize || "14px"};
  box-shadow: ${(p) => messageBoxShadow(p.$style)};
  word-break: break-word;
`;

export const BubbleMeta = styled.div<{
  $own: boolean;
  $style?: ChatBoxMessageRoleStyleType;
}>`
  font-size: 11px;
  color: ${(p) => p.$style?.messageMetaText || "inherit"};
  opacity: ${(p) => (p.$style?.messageMetaText ? 1 : 0.7)};
  margin-bottom: 2px;
  text-align: ${(p) => (p.$own ? "right" : "left")};
`;

export const BubbleTime = styled.div<{
  $own: boolean;
  $style?: ChatBoxMessageRoleStyleType;
}>`
  font-size: 10px;
  color: ${(p) => p.$style?.messageMetaText || "inherit"};
  opacity: ${(p) => (p.$style?.messageMetaText ? 0.8 : 0.6)};
  margin-top: 4px;
  text-align: ${(p) => (p.$own ? "right" : "left")};
`;

export const InputBarContainer = styled.div<{ $areaStyle?: ChatBoxInputAreaStyleType }>`
  margin: ${(p) => p.$areaStyle?.margin ?? "0"};
  padding: ${(p) => p.$areaStyle?.padding || "12px 16px"};
  border-top-width: ${(p) => p.$areaStyle?.borderWidth || "1px"};
  border-top-style: ${(p) => p.$areaStyle?.borderStyle || "solid"};
  border-top-color: ${(p) => p.$areaStyle?.border || "#eee"};
  background: ${(p) => p.$areaStyle?.inputAreaBackground || "transparent"};
  display: flex;
  align-items: stretch;
  box-sizing: border-box;
  flex-direction: column;
`;

export const StyledTextArea = styled.textarea<{
  $fieldStyle?: ChatBoxInputFieldStyleType;
  $sendStyle?: ChatBoxInputSendButtonStyleType;
}>`
  flex: 1;
  width: 100%;
  margin: ${(p) => p.$fieldStyle?.margin ?? "0"};
  padding: ${(p) => p.$fieldStyle?.padding || "8px 14px"};
  border-width: ${(p) => p.$fieldStyle?.borderWidth || "1px"};
  border-style: ${(p) => p.$fieldStyle?.borderStyle || "solid"};
  border-color: ${(p) => p.$fieldStyle?.border || "#d9d9d9"};
  border-radius: ${(p) => p.$fieldStyle?.radius || "18px"};
  background: ${(p) => p.$fieldStyle?.inputBackground || "#fff"};
  color: ${(p) => p.$fieldStyle?.text || "inherit"};
  resize: none;
  min-height: 36px;
  max-height: 96px;
  font-size: 14px;
  outline: none;
  font-family: inherit;
  line-height: 1.4;
  box-sizing: border-box;
  box-shadow: ${(p) =>
    `${p.$fieldStyle?.boxShadow ?? ""} ${p.$fieldStyle?.boxShadowColor ?? ""}`.trim() || "none"};
  &:focus {
    border-color: ${(p) => p.$sendStyle?.sendButtonBackground || "#1890ff"};
  }
`;

export const InputBarFieldWrap = styled.div<{ $fieldStyle?: ChatBoxInputFieldStyleType }>`
  flex: 1;
  min-width: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  box-sizing: border-box;
  margin: ${(p) => p.$fieldStyle?.margin ?? "0"};
  padding: ${(p) => p.$fieldStyle?.padding ?? "10px 12px"};
  border-width: ${(p) => p.$fieldStyle?.borderWidth ?? "1px"};
  border-style: ${(p) => p.$fieldStyle?.borderStyle ?? "solid"};
  border-color: ${(p) => p.$fieldStyle?.border ?? "#e5e7eb"};
  border-radius: ${(p) => p.$fieldStyle?.radius ?? "10px"};
  background: ${(p) => p.$fieldStyle?.inputBackground ?? "#ffffff"};
  box-shadow: ${(p) =>
    `${p.$fieldStyle?.boxShadow ?? ""} ${p.$fieldStyle?.boxShadowColor ?? ""}`.trim() || "none"};
`;

export const InputBarAttachmentList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
`;

export const InputBarAttachmentCard = styled.div<{ $fieldStyle?: ChatBoxInputFieldStyleType }>`
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  max-width: min(280px, 100%);
  padding: 8px 32px 8px 8px;
  border-width: ${(p) => p.$fieldStyle?.borderWidth ?? "1px"};
  border-style: ${(p) => p.$fieldStyle?.borderStyle ?? "solid"};
  border-color: ${(p) => p.$fieldStyle?.border ?? "#e5e7eb"};
  border-radius: 8px;
  background: ${(p) => p.$fieldStyle?.inputBackground ?? "#fff"};
  box-sizing: border-box;
`;

export const InputBarAttachmentThumb = styled.div`
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 18px;
`;

export const InputBarAttachmentThumbImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

export const InputBarAttachmentMeta = styled.div`
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const InputBarAttachmentName = styled.div<{ $fieldStyle?: ChatBoxInputFieldStyleType }>`
  font-size: 13px;
  font-weight: 600;
  color: ${(p) => p.$fieldStyle?.text ?? "#374151"};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const InputBarAttachmentKind = styled.div`
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.2;
`;

export const InputBarAttachmentRemove = styled.button`
  position: absolute;
  top: -6px;
  right: -6px;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 1px solid #e5e7eb;
  border-radius: 50%;
  background: #fff;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  line-height: 1;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  z-index: 1;

  &:hover {
    color: #111827;
    border-color: #d1d5db;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const InputBarInputRow = styled.div<{ $fieldStyle?: ChatBoxInputFieldStyleType }>`
  display: flex;
  gap: 4px;
  align-items: center;
  width: 100%;
  min-width: 0;

  .ant-upload {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  textarea::placeholder {
    color: ${(p) => p.$fieldStyle?.inputPlaceholder || "#9ca3af"};
    opacity: 1;
  }
`;

export const InputBarAttachButton = styled(AntdButton).attrs({ type: "text" })<{
  $attachStyle?: ChatBoxInputAttachButtonStyleType;
}>`
  &&.ant-btn.ant-btn-text {
    margin: ${(p) => p.$attachStyle?.margin ?? "0"} !important;
    padding: ${(p) => p.$attachStyle?.padding ?? "4px 6px"} !important;
    border-radius: ${(p) => p.$attachStyle?.radius?.trim() || "8px"} !important;
    border-width: ${(p) => p.$attachStyle?.borderWidth ?? "0"} !important;
    border-style: ${(p) => p.$attachStyle?.borderStyle ?? "solid"} !important;
    border-color: ${(p) =>
      p.$attachStyle?.borderColor?.trim()
        ? p.$attachStyle.borderColor
        : "transparent"} !important;
    color: ${(p) => p.$attachStyle?.attachButtonIcon ?? "#1f2937"} !important;
  }
  &&.ant-btn.ant-btn-text:not(:disabled):hover {
    background: ${(p) => p.$attachStyle?.attachButtonHoverBackground ?? "rgba(0, 0, 0, 0.06)"} !important;
    color: ${(p) => p.$attachStyle?.attachButtonIcon ?? "#1f2937"} !important;
  }
`;

export const InputBarSendButton = styled(AntdButton).attrs({ type: "primary" })<{
  $sendStyle?: ChatBoxInputSendButtonStyleType;
}>`
  &&.ant-btn.ant-btn-primary {
    flex-shrink: 0;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    min-width: 36px;
    min-height: 36px;
    margin: ${(p) => p.$sendStyle?.margin ?? "0"} !important;
    padding: ${(p) => p.$sendStyle?.padding ?? "0"} !important;
    border-radius: ${(p) => p.$sendStyle?.radius?.trim() || "8px"} !important;
    border-width: ${(p) => p.$sendStyle?.borderWidth ?? "1px"} !important;
    border-style: ${(p) => p.$sendStyle?.borderStyle ?? "solid"} !important;
    border-color: ${(p) =>
      p.$sendStyle?.borderColor?.trim()
        ? p.$sendStyle.borderColor
        : p.$sendStyle?.sendButtonBackground ?? "#93c5fd"} !important;
    background: ${(p) => p.$sendStyle?.sendButtonBackground ?? "#93c5fd"} !important;
    color: ${(p) => p.$sendStyle?.sendButtonIcon ?? "#fff"} !important;
    line-height: 1 !important;
  }

  &&.ant-btn.ant-btn-primary:disabled {
    background: ${(p) => p.$sendStyle?.sendButtonBackground ?? "#93c5fd"} !important;
    border-color: ${(p) =>
      p.$sendStyle?.borderColor?.trim()
        ? p.$sendStyle.borderColor
        : p.$sendStyle?.sendButtonBackground ?? "#93c5fd"} !important;
    color: ${(p) => p.$sendStyle?.sendButtonIcon ?? "#fff"} !important;
    opacity: 0.45;
  }
`;

export const MentionSpan = styled.span<{ $own?: boolean; $inAi?: boolean }>`
  font-weight: 600;
  border-radius: 4px;
  padding: 0 3px;
  display: inline;
  color: ${(p) =>
    p.$inAi ? "#722ed1" : p.$own ? "rgba(255, 255, 255, 0.98)" : "#0958d9"};
  background: ${(p) =>
    p.$inAi
      ? "rgba(114, 46, 209, 0.12)"
      : p.$own
        ? "rgba(255, 255, 255, 0.18)"
        : "rgba(9, 88, 217, 0.1)"};
`;

export const EmptyChat = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  gap: 4px;
`;

export const TypingIndicatorWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  align-self: flex-start;
`;

export const TypingDots = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: #e8e8e8;
  border-radius: 12px;
  padding: 8px 12px;

  span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #999;
    animation: typingBounce 1.4s infinite ease-in-out both;
  }

  span:nth-child(1) { animation-delay: 0s; }
  span:nth-child(2) { animation-delay: 0.2s; }
  span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes typingBounce {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40% { transform: scale(1); opacity: 1; }
  }
`;

export const TypingLabel = styled.span`
  font-size: 12px;
  color: #999;
  font-style: italic;
`;

export const ConnectionBanner = styled.div<{ $status: "online" | "offline" | "connecting" }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: ${(p) =>
    p.$status === "online" ? "#52c41a" : p.$status === "offline" ? "#fa541c" : "#999"};
`;

export const ConnectionDot = styled.span<{ $status: "online" | "offline" | "connecting" }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(p) =>
    p.$status === "online" ? "#52c41a" : p.$status === "offline" ? "#fa541c" : "#d9d9d9"};
`;

// ── LLM / AI message styles ────────────────────────────────────────────────

export const AiBubbleWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  width: 100%;
  position: relative;

  &:hover .ai-copy-btn {
    opacity: 1;
  }
`;

export const AiBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 600;
  color: #7c3aed;
  // background: #f3e8ff;
  border-radius: 8px;
  // padding: 2px 7px;
  margin-bottom: 4px;
  align-self: flex-start;
  letter-spacing: 0.4px;
  text-transform: uppercase;
`;

export const AiBubble = styled.div<{ $style?: ChatBoxAiMessageStyleType }>`
  background: ${(p) => p.$style?.background || "#faf5ff"};
  border-width: ${(p) => p.$style?.borderWidth || "1px"};
  border-style: ${(p) => p.$style?.borderStyle || "solid"};
  border-color: ${(p) => p.$style?.border || "#e9d5ff"};
  border-radius: ${(p) => {
    const r = p.$style?.radius;
    if (r && r !== "0") return r;
    return "16px 16px 16px 4px";
  }};
  border-bottom-left-radius: 0;
  padding: ${(p) => p.$style?.padding || "10px 14px"};
  font-size: ${(p) => p.$style?.textSize || "14px"};
  color: ${(p) => p.$style?.text || "#1f1f1f"};
  line-height: 1.6;
  box-shadow: ${(p) => messageBoxShadow(p.$style)};
  word-break: break-word;

  p { margin: 0 0 8px; }
  p:last-child { margin-bottom: 0; }
  pre {
    background: #f1f5f9;
    border-radius: 6px;
    padding: 10px 12px;
    overflow-x: auto;
    font-size: 13px;
  }
  code {
    background: #f1f5f9;
    border-radius: 3px;
    padding: 1px 5px;
    font-size: 13px;
    font-family: "Fira Mono", "Cascadia Code", monospace;
  }
  pre code {
    background: none;
    padding: 0;
  }
  ul, ol { padding-left: 20px; margin: 6px 0; }
  li { margin-bottom: 2px; }
  blockquote {
    border-left: 3px solid #c084fc;
    margin: 6px 0;
    padding-left: 10px;
    color: #666;
  }
  a { color: #7c3aed; }
  strong { font-weight: 600; }
  h1, h2, h3, h4 { margin: 8px 0 4px; font-weight: 600; }
  table { border-collapse: collapse; width: 100%; margin: 6px 0; }
  th, td { border: 1px solid #e9d5ff; padding: 4px 8px; }
  th { background: #f3e8ff; }
`;

export const AiCopyButton = styled.button<{ $style?: ChatBoxAiMessageStyleType }>`
  position: absolute;
  top: 28px;
  right: -34px;
  width: 26px;
  height: 26px;
  border: none;
  background: ${(p) => p.$style?.background || "#f3e8ff"};
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s ease, background 0.15s ease;
  color: ${(p) => p.$style?.text || "#7c3aed"};
  font-size: 13px;
  box-shadow: ${(p) => messageBoxShadow(p.$style)};

  &:hover {
    background: ${(p) => p.$style?.background || "#f3e8ff"};
  }
`;

export const LlmLoadingBubble = styled.div`
  align-self: flex-start;
  background: #faf5ff;
  border: 1px solid #e9d5ff;
  border-radius: 4px 16px 16px 16px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 5px;

  span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #c084fc;
    animation: llmThink 1.4s infinite ease-in-out both;
  }
  span:nth-child(1) { animation-delay: 0s; }
  span:nth-child(2) { animation-delay: 0.2s; }
  span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes llmThink {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40% { transform: scale(1.1); opacity: 1; }
  }
`;

export const LlmRoomBadge = styled.span`
  font-size: 10px;
  font-weight: 600;
  color: #7c3aed;
  background: #f3e8ff;
  border-radius: 6px;
  padding: 1px 5px;
  flex-shrink: 0;
`;

// ── Online Presence styles ──────────────────────────────────────────────────

export const OnlinePresenceSection = styled.div`
  border-top: 1px solid #eee;
  padding: 8px;
  flex-shrink: 0;
`;

export const OnlinePresenceLabel = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: #aaa;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  padding: 4px 2px 6px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const OnlineUserItem = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 4px 2px;
  font-size: 12px;
  color: #444;
  overflow: hidden;
`;

export const OnlineAvatar = styled.div<{ $color: string }>`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: ${(p) => p.$color};
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
`;

export const OnlineDot = styled.span`
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #52c41a;
  border: 1.5px solid #fafbfc;
`;

export const OnlineUserName = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const OnlineCountBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #52c41a;
  font-weight: 500;
`;

export const OnlineCountDot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #52c41a;
  display: inline-block;
`;
