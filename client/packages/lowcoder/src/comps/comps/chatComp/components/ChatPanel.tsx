// client/packages/lowcoder/src/comps/comps/chatComp/components/ChatPanel.tsx

import { useMemo, useContext, useRef, useEffect } from "react";
import { ChatPanelContainer } from "./ChatPanelContainer";
import { createChatStorage } from "../utils/storageFactory";
import { AIAssistantQueryHandler } from "../handlers/messageHandlers";
import { ChatPanelProps } from "../types/chatTypes";
import { EditorContext } from "@lowcoder-ee/comps/editorState";

// ============================================================================
// CHAT PANEL - SIMPLIFIED BOTTOM PANEL (QUERY-BASED + AUTOMATOR)
// ----------------------------------------------------------------------------
// We capture the EditorState in a ref so the message handler always reads
// the *latest* canvas snapshot at send-time (instead of being frozen at
// mount time, which would defeat the whole point of context awareness).
// ============================================================================

export function ChatPanel({
  tableName,
  chatQuery,
  onMessageUpdate,
}: ChatPanelProps) {
  const editorState = useContext(EditorContext);
  const editorStateRef = useRef(editorState);

  useEffect(() => {
    editorStateRef.current = editorState;
  }, [editorState]);

  const storage = useMemo(() =>
    createChatStorage(tableName),
    [tableName]
  );

  const messageHandler = useMemo(
    () =>
      new AIAssistantQueryHandler({
        chatQuery,
        dispatch: editorState?.rootComp?.dispatch,
        getEditorState: () => editorStateRef.current,
      }),
    [chatQuery, editorState?.rootComp?.dispatch]
  );

  return (
    <ChatPanelContainer
      storage={storage}
      messageHandler={messageHandler}
      onMessageUpdate={onMessageUpdate}
    />
  );
}
