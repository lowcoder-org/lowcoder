/**
 * Page-level presence via Yjs Awareness (not Y.Doc):
 * mouse pointer + text selection highlights.
 */

export interface PointerPresenceUser {
  id: string;
  name: string;
  color: string;
  role?: string;
}

export interface PointerPresenceData {
  xRatio: number;
  yRatio: number;
  updatedAt: number;
}

export interface SelectionRectRatio {
  xRatio: number;
  yRatio: number;
  wRatio: number;
  hRatio: number;
}

export interface TextSelectionPresenceData {
  text: string;
  rects: SelectionRectRatio[];
  updatedAt: number;
}

export interface AwarenessPointerState {
  user: PointerPresenceUser;
  pointer: PointerPresenceData | null;
  selection: TextSelectionPresenceData | null;
}

export interface PointerPresenceInit {
  provider: import("@hocuspocus/provider").HocuspocusProvider;
  editorId: string;
  role: string;
  username?: string;
  debug?: boolean;
}
