/**
 * Yjs Awareness state shapes for real-time cursor presence.
 * Stored in awareness only — never written to the shared Y.Doc.
 */

export interface CursorPresenceUser {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  role?: string;
}

export interface CursorSelection {
  anchor: number;
  head: number;
}

export interface CursorPresenceData {
  fieldKey: string;
  step: number;
  selection: CursorSelection;
  /** True while the user is actively typing; caret hidden when false. */
  typing: boolean;
  /** Epoch ms when this cursor was last updated by a real user action. */
  updatedAt: number;
}

export interface AwarenessPresenceState {
  user: CursorPresenceUser;
  cursor: CursorPresenceData | null;
}

export interface RemoteCursorRenderState {
  clientId: number;
  user: CursorPresenceUser;
  cursor: CursorPresenceData | null;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  height: number;
  selectionRects: Array<{ left: number; top: number; width: number; height: number }>;
  online: boolean;
}

export interface CursorPresenceFieldResolver {
  getFieldKey: (field: HTMLInputElement | HTMLTextAreaElement) => string;
  findFieldByKey: (key: string) => HTMLInputElement | HTMLTextAreaElement | null;
  getCurrentStep: () => number;
}

export interface TypeformCursorPresenceInit extends CursorPresenceFieldResolver {
  provider: import("@hocuspocus/provider").HocuspocusProvider;
  editorId: string;
  role: string;
  debug?: boolean;
  getSessionStarted: () => boolean;
  isWelcomeScreen: () => boolean;
  /** When true, pause local cursor broadcasts (read-only peek at sync flags). */
  isSyncing?: () => boolean;
}
