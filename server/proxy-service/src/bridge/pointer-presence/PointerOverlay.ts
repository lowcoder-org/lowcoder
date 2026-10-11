import type {
  AwarenessPointerState,
  PointerPresenceData,
  SelectionRectRatio,
  TextSelectionPresenceData,
} from "./types";

export class PointerOverlay {
  private readonly root: HTMLDivElement;
  private readonly cursors = new Map<string, HTMLDivElement>();
  private readonly selections = new Map<string, HTMLDivElement>();
  private showRemoteCursors = true;
  private destroyed = false;

  constructor() {
    this.root = document.createElement("div");
    this.root.id = "lowcoder-pointer-overlay";
    Object.assign(this.root.style, {
      position: "fixed",
      inset: "0",
      pointerEvents: "none",
      zIndex: "2147483646",
      overflow: "hidden",
    });
    document.documentElement.appendChild(this.root);
  }

  setShowRemoteCursors(show: boolean): void {
    this.showRemoteCursors = show;
    if (!show) {
      for (const id of Array.from(this.cursors.keys())) {
        this.removeCursor(id);
      }
    }
  }

  syncFromStates(states: AwarenessPointerState[]): void {
    if (this.destroyed) return;
    const seenCursors = new Set<string>();
    const seenSelections = new Set<string>();

    for (const state of states) {
      const id = state.user.id;

      if (this.showRemoteCursors && state.pointer) {
        seenCursors.add(id);
        this.upsertCursor(id, state.user.name, state.user.color, state.pointer);
      }

      if (state.selection && state.selection.rects.length > 0) {
        seenSelections.add(id);
        this.upsertSelection(id, state.user.name, state.user.color, state.selection);
      }
    }

    for (const id of Array.from(this.cursors.keys())) {
      if (!seenCursors.has(id)) this.removeCursor(id);
    }
    for (const id of Array.from(this.selections.keys())) {
      if (!seenSelections.has(id)) this.removeSelection(id);
    }
  }

  showClickRipple(xRatio: number, yRatio: number, color = "#1E88E5"): void {
    if (this.destroyed) return;
    const ripple = document.createElement("div");
    const x = clamp(xRatio, 0, 1) * window.innerWidth;
    const y = clamp(yRatio, 0, 1) * window.innerHeight;
    Object.assign(ripple.style, {
      position: "absolute",
      left: `${x}px`,
      top: `${y}px`,
      width: "12px",
      height: "12px",
      marginLeft: "-6px",
      marginTop: "-6px",
      borderRadius: "50%",
      border: `2px solid ${color}`,
      background: `${color}33`,
      transform: "scale(0.4)",
      opacity: "0.9",
      transition: "transform 420ms ease-out, opacity 420ms ease-out",
      pointerEvents: "none",
    });
    this.root.appendChild(ripple);
    requestAnimationFrame(() => {
      ripple.style.transform = "scale(3.2)";
      ripple.style.opacity = "0";
    });
    window.setTimeout(() => ripple.remove(), 480);
  }

  showButtonClickFlash(
    rect: { left: number; top: number; width: number; height: number },
    color: string,
    label: string
  ): void {
    if (this.destroyed) return;
    const flash = document.createElement("div");
    Object.assign(flash.style, {
      position: "absolute",
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${Math.max(rect.width, 8)}px`,
      height: `${Math.max(rect.height, 8)}px`,
      borderRadius: "6px",
      border: `2px solid ${color}`,
      background: `${color}33`,
      boxShadow: `0 0 0 3px ${color}22`,
      pointerEvents: "none",
      opacity: "1",
      transition: "opacity 500ms ease-out",
    });
    if (label) {
      const badge = document.createElement("div");
      badge.textContent = label;
      Object.assign(badge.style, {
        position: "absolute",
        left: "0",
        top: "-22px",
        padding: "1px 6px",
        borderRadius: "4px",
        background: color,
        color: "#fff",
        font: "11px/16px system-ui,sans-serif",
        whiteSpace: "nowrap",
        maxWidth: "180px",
        overflow: "hidden",
        textOverflow: "ellipsis",
      });
      flash.appendChild(badge);
    }
    this.root.appendChild(flash);
    window.setTimeout(() => {
      flash.style.opacity = "0";
    }, 40);
    window.setTimeout(() => flash.remove(), 560);
  }

  destroy(): void {
    this.destroyed = true;
    this.root.remove();
    this.cursors.clear();
    this.selections.clear();
  }

  private upsertCursor(
    id: string,
    name: string,
    color: string,
    pointer: PointerPresenceData
  ): void {
    let el = this.cursors.get(id);
    if (!el) {
      el = document.createElement("div");
      el.innerHTML =
        `<svg width="18" height="22" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">` +
        `<path d="M1 1L16.5 10.5L9.5 12.5L6.5 20.5L1 1Z" fill="${color}" stroke="#fff" stroke-width="1.2"/>` +
        `</svg>` +
        `<span style="display:inline-block;margin-left:2px;margin-top:10px;padding:1px 6px;` +
        `border-radius:4px;background:${color};color:#fff;font:11px/16px system-ui,sans-serif;` +
        `white-space:nowrap;box-shadow:0 1px 2px rgba(0,0,0,.25)">${escapeHtml(name)}</span>`;
      Object.assign(el.style, {
        position: "absolute",
        left: "0",
        top: "0",
        transform: "translate(-2px, -2px)",
        pointerEvents: "none",
        display: "flex",
        alignItems: "flex-start",
        willChange: "left, top",
      });
      this.root.appendChild(el);
      this.cursors.set(id, el);
    }
    const x = clamp(pointer.xRatio, 0, 1) * window.innerWidth;
    const y = clamp(pointer.yRatio, 0, 1) * window.innerHeight;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  }

  private upsertSelection(
    id: string,
    name: string,
    color: string,
    selection: TextSelectionPresenceData
  ): void {
    let group = this.selections.get(id);
    if (!group) {
      group = document.createElement("div");
      group.dataset.selectionUser = id;
      Object.assign(group.style, {
        position: "absolute",
        inset: "0",
        pointerEvents: "none",
      });
      this.root.appendChild(group);
      this.selections.set(id, group);
    }
    group.innerHTML = "";
    for (const rect of selection.rects) {
      group.appendChild(this.buildSelectionRect(rect, color));
    }
    if (selection.rects[0]) {
      const label = document.createElement("div");
      label.textContent = name;
      const first = selection.rects[0];
      Object.assign(label.style, {
        position: "absolute",
        left: `${clamp(first.xRatio, 0, 1) * window.innerWidth}px`,
        top: `${Math.max(0, clamp(first.yRatio, 0, 1) * window.innerHeight - 18)}px`,
        padding: "0 5px",
        borderRadius: "3px",
        background: color,
        color: "#fff",
        font: "10px/16px system-ui,sans-serif",
        whiteSpace: "nowrap",
      });
      group.appendChild(label);
    }
  }

  private buildSelectionRect(rect: SelectionRectRatio, color: string): HTMLDivElement {
    const el = document.createElement("div");
    Object.assign(el.style, {
      position: "absolute",
      left: `${clamp(rect.xRatio, 0, 1) * window.innerWidth}px`,
      top: `${clamp(rect.yRatio, 0, 1) * window.innerHeight}px`,
      width: `${Math.max(2, clamp(rect.wRatio, 0, 1) * window.innerWidth)}px`,
      height: `${Math.max(2, clamp(rect.hRatio, 0, 1) * window.innerHeight)}px`,
      background: `${color}55`,
      outline: `1px solid ${color}`,
      pointerEvents: "none",
    });
    return el;
  }

  private removeCursor(id: string): void {
    const el = this.cursors.get(id);
    if (!el) return;
    el.remove();
    this.cursors.delete(id);
  }

  private removeSelection(id: string): void {
    const el = this.selections.get(id);
    if (!el) return;
    el.remove();
    this.selections.delete(id);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
