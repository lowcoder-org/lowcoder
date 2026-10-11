/**
 * Self-contained cursor presence bootstrap for the Typeform bridge.
 *
 * - Broadcast caret while THIS user is actively editing.
 * - Do not clear during form-sync (avoids per-keystroke flicker).
 * - Clear after idle / blur so peers stop seeing a stuck caret.
 * - Render only REMOTE users' cursors.
 */

import type { TypeformCursorPresenceInit } from "./types";
import { getUserColor } from "./userColor";
import { CursorPresenceProvider } from "./CursorPresenceProvider";
import { CursorOverlay } from "./CursorOverlay";
import {
  getCursorFieldKey,
  getFocusedTextField,
  getFieldSelection,
  isTextFieldElement,
} from "./textField";

/** Hide collaborative caret this long after the last real keystroke. */
const TYPING_IDLE_MS = 2500;

function readUserName(editorId: string): string {
  const params = new URLSearchParams(window.location.search);
  return (
    params.get("username") ||
    document.documentElement.getAttribute("data-lowcoder-username") ||
    editorId
  );
}

/** Real user input only — ignore synthetic events from form sync. */
function isRealUserActivity(event: Event): boolean {
  return event.isTrusted === true;
}

export function initTypeformCursorPresence(config: TypeformCursorPresenceInit): () => void {
  const userName = readUserName(config.editorId);
  const user = {
    id: config.editorId,
    name: userName,
    color: getUserColor(config.editorId),
    role: config.role,
  };

  const canBroadcast = (): boolean =>
    !config.isWelcomeScreen() && !(config.isSyncing?.() ?? false);

  const overlay = new CursorOverlay({
    findFieldByKey: config.findFieldByKey,
    getCurrentStep: config.getCurrentStep,
    localUserId: config.editorId,
  });

  const presence = new CursorPresenceProvider(
    config.provider,
    user,
    () => {
      presence.syncOverlayFromAwareness((awareness) => overlay.syncFromAwareness(awareness));
    },
    33
  );

  let isActive = false;
  let idleTimer: number | undefined;

  const clearCursor = (): void => {
    isActive = false;
    window.clearTimeout(idleTimer);
    idleTimer = undefined;
    presence.setLocalCursor(null);
  };

  const syncOverlay = (): void => {
    presence.syncOverlayFromAwareness((awareness) => overlay.syncFromAwareness(awareness));
  };

  const scheduleIdleClear = (): void => {
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => {
      clearCursor();
      syncOverlay();
    }, TYPING_IDLE_MS);
  };

  const publishCursor = (): void => {
    if (!isActive) return;
    // During form sync, keep the last published cursor — do not clear.
    if (!canBroadcast()) return;
    const field = getFocusedTextField();
    if (!field) return;
    const step = config.getCurrentStep();
    presence.setLocalCursor({
      fieldKey: getCursorFieldKey(field, step, config.getFieldKey),
      step,
      selection: getFieldSelection(field),
      typing: true,
      updatedAt: Date.now(),
    });
  };

  const activateCursor = (event: Event): void => {
    if (!isRealUserActivity(event)) return;
    // During form sync, ignore — but never clear an existing cursor.
    if (!canBroadcast()) return;

    const target = event.target;
    if (target instanceof Element && !isTextFieldElement(target) && !getFocusedTextField()) {
      return;
    }
    if (!getFocusedTextField()) return;

    isActive = true;
    publishCursor();
    // Only real typing resets idle — poll/sync must not keep the cursor forever.
    scheduleIdleClear();
  };

  const listenerOpts: AddEventListenerOptions = { capture: true, passive: true };

  const onInput = (event: Event): void => activateCursor(event);
  const onCompositionUpdate = (event: Event): void => activateCursor(event);
  const onKeyDown = (event: Event): void => {
    if (!isRealUserActivity(event)) return;
    if (!getFocusedTextField()) return;
    activateCursor(event);
  };
  const onSelectionChange = (): void => {
    if (!isActive) return;
    publishCursor();
  };

  const onFocusOut = (): void => {
    window.setTimeout(() => {
      if (!getFocusedTextField()) clearCursor();
    }, 0);
  };

  const onScroll = (): void => {
    if (isActive) publishCursor();
    syncOverlay();
  };
  const onResize = (): void => syncOverlay();

  // Typing only — not focusin (Typeform keeps focus and would leave a stuck caret).
  document.addEventListener("input", onInput, listenerOpts);
  document.addEventListener("compositionupdate", onCompositionUpdate, listenerOpts);
  document.addEventListener("keydown", onKeyDown, listenerOpts);
  document.addEventListener("selectionchange", onSelectionChange);
  document.addEventListener("focusout", onFocusOut, listenerOpts);
  document.addEventListener("scroll", onScroll, listenerOpts);
  window.addEventListener("resize", onResize, { passive: true });

  let layoutTimer: number | undefined;
  const domObserver = new MutationObserver(() => {
    window.clearTimeout(layoutTimer);
    layoutTimer = window.setTimeout(() => {
      if (isActive) publishCursor();
      syncOverlay();
    }, 100);
  });
  domObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
  });

  const pollTimer = window.setInterval(() => {
    if (isActive) publishCursor();
    syncOverlay();
  }, 100);

  const onProviderStatus = (): void => syncOverlay();
  config.provider.on("synced", onProviderStatus);

  presence.setLocalCursor(null);
  syncOverlay();

  if (config.debug) {
    console.log("[typeform-cursor-presence] started (idle-clear, no sync-clear)", {
      userName,
      editorId: config.editorId,
    });
  }

  const destroy = (): void => {
    window.clearInterval(pollTimer);
    window.clearTimeout(layoutTimer);
    window.clearTimeout(idleTimer);
    config.provider.off("synced", onProviderStatus);
    document.removeEventListener("input", onInput, listenerOpts);
    document.removeEventListener("compositionupdate", onCompositionUpdate, listenerOpts);
    document.removeEventListener("keydown", onKeyDown, listenerOpts);
    document.removeEventListener("selectionchange", onSelectionChange);
    document.removeEventListener("focusout", onFocusOut, listenerOpts);
    document.removeEventListener("scroll", onScroll, listenerOpts);
    window.removeEventListener("resize", onResize);
    domObserver.disconnect();
    clearCursor();
    presence.destroy();
    overlay.destroy();
  };

  window.addEventListener("beforeunload", destroy, { once: true });
  return destroy;
}
