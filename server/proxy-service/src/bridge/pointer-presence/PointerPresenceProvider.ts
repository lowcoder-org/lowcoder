import type { HocuspocusProvider } from "@hocuspocus/provider";
import type {
  AwarenessPointerState,
  PointerPresenceData,
  PointerPresenceUser,
  TextSelectionPresenceData,
} from "./types";

export class PointerPresenceProvider {
  private localState: AwarenessPointerState;
  private pendingFlush = false;
  private throttleTimer: number | undefined;
  private lastBroadcastAt = 0;
  private destroyed = false;
  private readonly throttleMs: number;
  private readonly onRemoteChange: () => void;
  private boundAwarenessChange = (): void => this.onRemoteChange();

  constructor(
    private readonly provider: HocuspocusProvider,
    user: PointerPresenceUser,
    onRemoteChange: () => void,
    throttleMs = 33
  ) {
    this.throttleMs = throttleMs;
    this.onRemoteChange = onRemoteChange;
    this.localState = {
      user,
      pointer: null,
      selection: null,
    };
    this.provider.awareness?.setLocalState(this.localState);
    this.provider.awareness?.on("change", this.boundAwarenessChange);
  }

  setLocalPointer(pointer: PointerPresenceData | null): void {
    if (this.destroyed) return;
    this.localState = { ...this.localState, pointer };
    this.scheduleFlush();
  }

  setLocalSelection(selection: TextSelectionPresenceData | null): void {
    if (this.destroyed) return;
    this.localState = { ...this.localState, selection };
    this.scheduleFlush();
  }

  getRemoteStates(): AwarenessPointerState[] {
    const states: AwarenessPointerState[] = [];
    const awareness = this.provider.awareness;
    if (!awareness) return states;
    const localId = awareness.clientID;
    awareness.getStates().forEach((raw, clientId) => {
      if (clientId === localId) return;
      const state = raw as AwarenessPointerState;
      if (!state?.user) return;
      states.push({
        user: state.user,
        pointer: state.pointer ?? null,
        selection: state.selection ?? null,
      });
    });
    return states;
  }

  destroy(): void {
    this.destroyed = true;
    window.clearTimeout(this.throttleTimer);
    this.provider.awareness?.off("change", this.boundAwarenessChange);
    this.provider.awareness?.setLocalState(null);
  }

  private scheduleFlush(): void {
    this.pendingFlush = true;
    const now = Date.now();
    const elapsed = now - this.lastBroadcastAt;
    if (elapsed >= this.throttleMs) {
      this.flushBroadcast();
      return;
    }
    if (this.throttleTimer === undefined) {
      this.throttleTimer = window.setTimeout(
        () => this.flushBroadcast(),
        this.throttleMs - elapsed
      );
    }
  }

  private flushBroadcast(): void {
    if (this.destroyed) return;
    window.clearTimeout(this.throttleTimer);
    this.throttleTimer = undefined;
    if (!this.pendingFlush) return;
    this.pendingFlush = false;
    this.lastBroadcastAt = Date.now();
    this.provider.awareness?.setLocalState({ ...this.localState });
  }
}
