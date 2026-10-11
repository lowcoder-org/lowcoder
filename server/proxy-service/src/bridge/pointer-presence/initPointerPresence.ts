import { getUserColor } from "../cursor-presence/userColor";
import { PointerOverlay } from "./PointerOverlay";
import { PointerPresenceProvider } from "./PointerPresenceProvider";
import type { PointerPresenceInit, SelectionRectRatio } from "./types";

const SHOW_MICE_STORAGE_KEY = "lowcoder-website-show-remote-mice";

export function initPointerPresence(config: PointerPresenceInit): {
  destroy: () => void;
  showClickRipple: (xRatio: number, yRatio: number, color?: string) => void;
  showButtonClickFlash: (
    rect: { left: number; top: number; width: number; height: number },
    color: string,
    label: string
  ) => void;
} {
  const username =
    config.username ||
    new URLSearchParams(window.location.search).get("username") ||
    document.documentElement.getAttribute("data-lowcoder-username") ||
    config.editorId;

  const user = {
    id: config.editorId,
    name: username,
    color: getUserColor(config.editorId),
    role: config.role,
  };

  const overlay = new PointerOverlay();
  const presence = new PointerPresenceProvider(config.provider, user, () => {
    overlay.syncFromStates(presence.getRemoteStates());
  });

  let showRemoteMice = readShowMicePreference();
  overlay.setShowRemoteCursors(showRemoteMice);

  const chrome = createMiceToggleChrome(showRemoteMice, (next) => {
    showRemoteMice = next;
    writeShowMicePreference(next);
    overlay.setShowRemoteCursors(next);
    overlay.syncFromStates(presence.getRemoteStates());
  });

  const onPointerMove = (event: PointerEvent): void => {
    if (!event.isTrusted) return;
    const xRatio = window.innerWidth > 0 ? event.clientX / window.innerWidth : 0;
    const yRatio = window.innerHeight > 0 ? event.clientY / window.innerHeight : 0;
    presence.setLocalPointer({
      xRatio,
      yRatio,
      updatedAt: Date.now(),
    });
  };

  const onPointerLeave = (): void => {
    presence.setLocalPointer(null);
  };

  const publishLocalSelection = (): void => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      presence.setLocalSelection(null);
      return;
    }

    const anchorNode = selection.anchorNode;
    if (anchorNode && isInsideEditable(anchorNode)) {
      presence.setLocalSelection(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();
    if (!text) {
      presence.setLocalSelection(null);
      return;
    }

    const rects = clientRectsToRatios(range.getClientRects());
    if (rects.length === 0) {
      presence.setLocalSelection(null);
      return;
    }

    presence.setLocalSelection({
      text: text.slice(0, 200),
      rects,
      updatedAt: Date.now(),
    });
  };

  const onSelectionChange = (): void => {
    window.requestAnimationFrame(publishLocalSelection);
  };

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("blur", onPointerLeave);
  document.addEventListener("mouseleave", onPointerLeave);
  document.addEventListener("selectionchange", onSelectionChange);

  return {
    showClickRipple: (xRatio, yRatio, color) =>
      overlay.showClickRipple(xRatio, yRatio, color ?? user.color),
    showButtonClickFlash: (rect, color, label) =>
      overlay.showButtonClickFlash(rect, color, label),
    destroy: () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("blur", onPointerLeave);
      document.removeEventListener("mouseleave", onPointerLeave);
      document.removeEventListener("selectionchange", onSelectionChange);
      chrome.remove();
      presence.destroy();
      overlay.destroy();
    },
  };
}

function createMiceToggleChrome(
  initial: boolean,
  onChange: (show: boolean) => void
): HTMLDivElement {
  const chrome = document.createElement("div");
  chrome.id = "lowcoder-website-mice-toggle";
  Object.assign(chrome.style, {
    position: "fixed",
    left: "50%",
    top: "12px",
    transform: "translateX(-50%)",
    zIndex: "2147483647",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 10px",
    borderRadius: "8px",
    background: "rgba(20, 24, 28, 0.88)",
    color: "#fff",
    font: "12px/1.3 system-ui,sans-serif",
    boxShadow: "0 2px 10px rgba(0,0,0,.28)",
    pointerEvents: "auto",
    userSelect: "none",
  });

  const label = document.createElement("label");
  Object.assign(label.style, {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer",
  });

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = initial;
  checkbox.addEventListener("change", () => onChange(checkbox.checked));

  const text = document.createElement("span");
  text.textContent = "Show others' mice";

  label.appendChild(checkbox);
  label.appendChild(text);
  chrome.appendChild(label);
  document.documentElement.appendChild(chrome);
  return chrome;
}

function readShowMicePreference(): boolean {
  try {
    const raw = window.localStorage.getItem(SHOW_MICE_STORAGE_KEY);
    if (raw === null) return true;
    return raw === "1";
  } catch {
    return true;
  }
}

function writeShowMicePreference(show: boolean): void {
  try {
    window.localStorage.setItem(SHOW_MICE_STORAGE_KEY, show ? "1" : "0");
  } catch {
    // ignore
  }
}

function isInsideEditable(node: Node): boolean {
  const el = node instanceof Element ? node : node.parentElement;
  if (!el) return false;
  return Boolean(
    el.closest("input, textarea, select, [contenteditable=''], [contenteditable='true']")
  );
}

function clientRectsToRatios(clientRects: DOMRectList): SelectionRectRatio[] {
  const width = window.innerWidth || 1;
  const height = window.innerHeight || 1;
  const rects: SelectionRectRatio[] = [];
  for (let i = 0; i < clientRects.length; i += 1) {
    const rect = clientRects.item(i);
    if (!rect || rect.width <= 0 || rect.height <= 0) continue;
    rects.push({
      xRatio: rect.left / width,
      yRatio: rect.top / height,
      wRatio: rect.width / width,
      hRatio: rect.height / height,
    });
    if (rects.length >= 24) break;
  }
  return rects;
}
