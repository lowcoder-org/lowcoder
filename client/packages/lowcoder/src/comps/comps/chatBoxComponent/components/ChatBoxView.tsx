import React, { useMemo, useState } from "react";
import {
  Wrapper,
  ChatPanelContainer,
  ChatHeaderBar,
  OnlineCountBadge,
  OnlineCountDot,
} from "../styles";
import { MessageList } from "./MessageList";
import { InputBar } from "./InputBar";
import { RoomPanel } from "./RoomPanel";
import { CreateRoomModal } from "./CreateRoomModal";
import { InviteUserModal } from "./InviteUserModal";
import { useChatBox } from "../ChatBoxContext";
import { LLM_BOT_AUTHOR_ID, type ChatRoom } from "../store";
import {
  messageContainsLlmMention,
  type MentionCandidate,
} from "../mentionUtils";
import { trans } from "i18n";

export const ChatBoxView = React.memo(() => {
  const ctx = useChatBox();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const headerTitle = ctx.currentRoom
    ? ctx.currentRoom.name
    : ctx.chatTitle.value;

  const roomOnlineCount = useMemo(() => {
    if (!ctx.currentRoomId) return 0;
    return ctx.onlineUsers.filter(
      (u) => u.currentRoomId === ctx.currentRoomId && u.userId !== ctx.currentUserId,
    ).length + 1;
  }, [ctx.onlineUsers, ctx.currentRoomId, ctx.currentUserId]);

  const mentionCandidates = useMemo<MentionCandidate[]>(() => {
    const list: MentionCandidate[] = [];
    const seen = new Set<string>();

    const add = (id: string, label: string, kind: "user" | "llm") => {
      const sid = String(id).trim();
      if (!sid || seen.has(sid)) return;
      seen.add(sid);
      list.push({
        id: sid,
        label: String(label ?? sid).trim() || sid,
        kind,
      });
    };

    const customConfig = ctx.mentionCandidatesConfig;
    if (Array.isArray(customConfig) && customConfig.length > 0) {
      for (const item of customConfig) {
        if (item == null || typeof item !== "object") continue;
        const row = item as Record<string, unknown>;
        const id = String(row.id ?? row.userId ?? "").trim();
        if (!id) continue;
        const label =
          String(row.label ?? row.userName ?? row.name ?? id).trim() || id;
        add(id, label, "user");
      }
      add(LLM_BOT_AUTHOR_ID, trans("chatBox.aiShortLabel"), "llm");
      return list;
    }

    add(LLM_BOT_AUTHOR_ID, trans("chatBox.aiShortLabel"), "llm");

    const room = ctx.currentRoom;
    if (room?.members?.length) {
      for (const mid of room.members) {
        if (String(mid) === String(ctx.currentUserId)) continue;
        const online = ctx.onlineUsers.find(
          (u) => String(u.userId) === String(mid),
        );
        add(String(mid), online?.userName ?? String(mid), "user");
      }
    }

    for (const u of ctx.onlineUsers) {
      if (String(u.userId) === String(ctx.currentUserId)) continue;
      if (
        ctx.currentRoomId &&
        u.currentRoomId != null &&
        String(u.currentRoomId) !== String(ctx.currentRoomId)
      ) {
        continue;
      }
      add(String(u.userId), u.userName ?? String(u.userId), "user");
    }

    return list;
  }, [
    ctx.mentionCandidatesConfig,
    ctx.currentRoom,
    ctx.onlineUsers,
    ctx.currentRoomId,
    ctx.currentUserId,
  ]);

  return (
    <Wrapper $style={ctx.style} $anim={ctx.animationStyle}>
      {/* ── Rooms sidebar ───────────────────────────────────────── */}
      {ctx.showRoomsPanel && (
        <RoomPanel
          onCreateModalOpen={() => setCreateModalOpen(true)}
          onInviteModalOpen={
            ctx.currentRoom?.type === "private"
              ? () => setInviteModalOpen(true)
              : undefined
          }
        />
      )}

      {/* ── Chat area ───────────────────────────────────────────── */}
      <ChatPanelContainer>
        {ctx.showHeader && (
          <ChatHeaderBar $headerStyle={ctx.headerStyle}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>
                {headerTitle}
              </div>
              {ctx.currentRoom?.description && (
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                  {ctx.currentRoom.description}
                </div>
              )}
            </div>
            {ctx.currentRoomId && roomOnlineCount > 0 && (
              <OnlineCountBadge>
                <OnlineCountDot />
                {trans("chatBox.onlineCount", { count: roomOnlineCount })}
              </OnlineCountBadge>
            )}
          </ChatHeaderBar>
        )}

        <MessageList
          messages={ctx.messages}
          typingUsers={ctx.typingUsers}
          currentUserId={ctx.currentUserId}
          currentUserName={ctx.currentUserName}
          isAiThinking={ctx.isAiThinking}
          messageAreaStyle={ctx.messageAreaStyle}
          ownMessageStyle={ctx.ownMessageStyle}
          otherMessageStyle={ctx.otherMessageStyle}
          aiMessageStyle={ctx.aiMessageStyle}
          ownAvatarStyle={ctx.ownAvatarStyle}
          otherAvatarStyle={ctx.otherAvatarStyle}
          aiAvatarStyle={ctx.aiAvatarStyle}
        />

        <InputBar
          mentionCandidates={mentionCandidates}
          allowMessageFileUpload={ctx.allowMessageFileUpload}
          maxMessageFiles={ctx.maxMessageFiles}
          messageFileType={ctx.messageFileType}
          messageFiles={ctx.messageFiles}
          messageFileValues={ctx.messageFileValues}
          onAttachmentsChange={ctx.setMessageAttachments}
          onFileUpload={ctx.onFileUploadEvent}
          messageUploadRef={ctx.messageUploadRef}
          onSend={(text) => {
            ctx.lastSentMessageText.onChange(text);
            ctx.lastSentMessageTagsLlm.onChange(
              messageContainsLlmMention(
                text,
                LLM_BOT_AUTHOR_ID,
                trans("chatBox.aiShortLabel"),
              ),
            );
            ctx.onEvent("messageSent");
            ctx.clearMessageAttachments();
          }}
          onStartTyping={() => ctx.onEvent("startTyping")}
          onStopTyping={() => ctx.onEvent("stopTyping")}
          onDraftChange={(text) => ctx.messageText.onChange(text)}
          inputAreaStyle={ctx.inputAreaStyle}
          inputFieldStyle={ctx.inputFieldStyle}
          inputSendButtonStyle={ctx.inputSendButtonStyle}
          inputAttachButtonStyle={ctx.inputAttachButtonStyle}
        />
      </ChatPanelContainer>

      {/* ── Modals ──────────────────────────────────────────────── */}
      <CreateRoomModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreateRoom={async (name, type, description, llmQueryName) => {
          ctx.onRoomCreate(name, type, description, llmQueryName);
          const placeholder: ChatRoom = {
            id: "__pending__",
            name,
            type,
            description: description || null,
            members: [ctx.currentUserId],
            createdBy: ctx.currentUserId,
            createdAt: Date.now(),
            llmQueryName: llmQueryName || null,
          };
          return placeholder;
        }}
        onRoomCreatedEvent={() => {}}
      />

      <InviteUserModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        currentRoom={ctx.currentRoom}
        onSendInvite={async (toUserId) => {
          ctx.onInviteSend(toUserId);
          return true;
        }}
      />
    </Wrapper>
  );
});

ChatBoxView.displayName = "ChatBoxView";
