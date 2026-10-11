import type { HocuspocusProvider } from "@hocuspocus/provider";
import type {
  AwarenessPresenceState,
  CursorPresenceData,
  CursorPresenceUser,
} from "./types";

const DEFAULT_THROTTLE_MS = 33;

export class CursorPresenceProvider {
  private pendingCursor: CursorPresenceData | null | undefined;
  private throttleTimer: number | undefined;
  private lastBroadcastAt = 0;
  private destroyed = false;
  private readonly throttleMs: number;
  private readonly onRemoteChange: () => void;
  private boundAwarenessChange = (): void => this.onRemoteChange();

  constructor(
    private readonly provider: HocuspocusProvider,
    user: CursorPresenceUser,
    onRemoteChange: () => void,
    throttleMs = DEFAULT_THROTTLE_MS
  ) {
    this.onRemoteChange = onRemoteChange;
    this.throttleMs = throttleMs;
    this.provider.setAwarenessField("user", user);
    this.provider.setAwarenessField("cursor", null);
    this.provider.awareness?.on("change", this.boundAwarenessChange);
  }

  /**
   * Broadcast typing caret to peers via awareness.
   * Does not create any local DOM — peers render it; the typist does not.
   * Passing `null` clears immediately (no throttle) so inactive cursors vanish.
   */
  setLocalCursor(cursor: CursorPresenceData | null): void {
    if (this.destroyed) return;

    if (cursor === null) {
      window.clearTimeout(this.throttleTimer);
      this.pendingCursor = null;
      this.flushBroadcast();
      return;
    }

    this.pendingCursor = cursor;
    const elapsed = performance.now() - this.lastBroadcastAt;
    if (elapsed >= this.throttleMs) {
      this.flushBroadcast();
      return;
    }
    window.clearTimeout(this.throttleTimer);
    this.throttleTimer = window.setTimeout(() => this.flushBroadcast(), this.throttleMs - elapsed);
  }

  private flushBroadcast(): void {
    if (this.destroyed || this.pendingCursor === undefined) return;
    this.lastBroadcastAt = performance.now();
    this.provider.setAwarenessField("cursor", this.pendingCursor);
    this.pendingCursor = undefined;
  }

  syncOverlayFromAwareness(
    sync: (awareness: NonNullable<HocuspocusProvider["awareness"]>) => void
  ): void {
    const awareness = this.provider.awareness;
    if (awareness) sync(awareness);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    window.clearTimeout(this.throttleTimer);
    this.provider.setAwarenessField("cursor", null);
    this.provider.awareness?.off("change", this.boundAwarenessChange);
  }
}

export type { AwarenessPresenceState };
