import type {
  AwarenessPresenceState,
  CursorPresenceData,
  CursorPresenceUser,
  RemoteCursorRenderState,
} from "./types";
import {
  getCaretCoordinatesForField,
  getFieldFallbackCaret,
  getSelectionRectsForField,
  destroyCaretMirror,
} from "./caretMetrics";
import {
  findFieldByCursorKey,
  type TextFieldElement,
} from "./textField";
import { RemoteCursor, ensureCursorStyles } from "./RemoteCursor";

interface AwarenessLike {
  clientID: number;
  getStates(): Map<number, unknown>;
}

interface CursorOverlayOptions {
  getCurrentStep: () => number;
  findFieldByKey: (key: string) => HTMLInputElement | HTMLTextAreaElement | null;
  /** Local user id — never render a collaborative cursor for this user. */
  localUserId: string;
}

const LERP_FACTOR = 0.35;

export class CursorOverlay {
  private container: HTMLDivElement;
  private cursors = new Map<number, RemoteCursor>();
  private renderStates = new Map<number, RemoteCursorRenderState>();
  private rafId: number | null = null;
  private destroyed = false;

  constructor(private readonly options: CursorOverlayOptions) {
    ensureCursorStyles();
    this.container = document.createElement("div");
    this.container.id = "lowcoder-cursor-overlay";
    this.container.style.cssText =
      "position:fixed;inset:0;pointer-events:none;z-index:2147483647;overflow:visible;";
    document.documentElement.appendChild(this.container);
    this.startAnimationLoop();
  }

  /**
   * Render cursors for other connected users only.
   * The local typist never sees their own collaborative caret/label.
   * Null / inactive remote cursors are hidden (no time-based timeout).
   */
  syncFromAwareness(awareness: AwarenessLike): void {
    const localClientId = awareness.clientID;
    const localUserId = this.options.localUserId;
    const active = new Set<number>();

    awareness.getStates().forEach((rawState, clientId) => {
      if (clientId === localClientId) return;

      const state = rawState as AwarenessPresenceState | null;
      if (!state?.user) return;
      if (state.user.id === localUserId) return;

      if (!this.isActiveRemoteCursor(state.cursor)) {
        this.removeRemote(clientId);
        return;
      }

      active.add(clientId);
      this.upsertRemoteState(clientId, state.user, state.cursor!);
    });

    for (const clientId of this.cursors.keys()) {
      if (!active.has(clientId)) this.removeRemote(clientId);
    }
    this.renderAll();
  }

  private isActiveRemoteCursor(cursor: CursorPresenceData | null | undefined): boolean {
    return cursor != null && cursor.typing === true;
  }

  private upsertRemoteState(
    clientId: number,
    user: CursorPresenceUser,
    cursor: CursorPresenceData | null
  ): void {
    const existing = this.renderStates.get(clientId);
    const metrics = this.resolveCursorMetrics(cursor);
    const hasCursor = cursor?.typing === true && metrics != null;

    this.renderStates.set(clientId, {
      clientId,
      user,
      cursor,
      x: existing?.x ?? metrics?.x ?? 0,
      y: existing?.y ?? metrics?.y ?? 0,
      targetX: metrics?.x ?? existing?.targetX ?? 0,
      targetY: metrics?.y ?? existing?.targetY ?? 0,
      height: metrics?.height ?? existing?.height ?? 16,
      selectionRects: metrics?.selectionRects ?? [],
      online: hasCursor,
    });

    if (!this.cursors.has(clientId)) {
      const remoteCursor = new RemoteCursor(clientId);
      remoteCursor.mount(this.container);
      this.cursors.set(clientId, remoteCursor);
    }
  }

  private removeRemote(clientId: number): void {
    this.renderStates.delete(clientId);
    this.cursors.get(clientId)?.destroy();
    this.cursors.delete(clientId);
  }

  private resolveField(key: string): TextFieldElement | null {
    return findFieldByCursorKey(
      key,
      this.options.getCurrentStep(),
      this.options.findFieldByKey
    );
  }

  private resolveCursorMetrics(cursor: CursorPresenceData | null) {
    if (!this.isActiveRemoteCursor(cursor)) return null;
    if (cursor!.step !== this.options.getCurrentStep()) return null;

    const field = this.resolveField(cursor!.fieldKey);
    if (!field?.isConnected) return null;

    let caret =
      getCaretCoordinatesForField(field, cursor!.selection.head) ??
      getFieldFallbackCaret(field);

    if (!caret || !Number.isFinite(caret.left)) {
      caret = getFieldFallbackCaret(field);
    }

    return {
      x: caret.left,
      y: caret.top,
      height: caret.height,
      selectionRects: getSelectionRectsForField(
        field,
        cursor!.selection.anchor,
        cursor!.selection.head
      ),
    };
  }

  private renderAll(): void {
    for (const state of this.renderStates.values()) {
      this.cursors.get(state.clientId)?.update(state, this.container);
    }
  }

  private startAnimationLoop(): void {
    const tick = () => {
      if (this.destroyed) return;
      for (const state of this.renderStates.values()) {
        const dx = state.targetX - state.x;
        const dy = state.targetY - state.y;
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          state.x += dx * LERP_FACTOR;
          state.y += dy * LERP_FACTOR;
        } else {
          state.x = state.targetX;
          state.y = state.targetY;
        }
        this.cursors.get(state.clientId)?.updatePosition(state.x, state.y);
      }
      this.rafId = window.requestAnimationFrame(tick);
    };
    this.rafId = window.requestAnimationFrame(tick);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.rafId != null) window.cancelAnimationFrame(this.rafId);
    for (const cursor of this.cursors.values()) cursor.destroy();
    this.cursors.clear();
    this.renderStates.clear();
    this.container.remove();
    destroyCaretMirror();
  }
}
