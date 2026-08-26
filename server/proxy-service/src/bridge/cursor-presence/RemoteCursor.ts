import type { RemoteCursorRenderState } from "./types";

const CURSOR_CLASS = "lowcoder-remote-cursor";
const LABEL_CLASS = "lowcoder-remote-cursor-label";
const CARET_CLASS = "lowcoder-remote-cursor-caret";
const SELECTION_CLASS = "lowcoder-remote-cursor-selection";
const CARET_VERTICAL_OFFSET_PX = -6;

export class RemoteCursor {
  readonly clientId: number;
  private root: HTMLDivElement;
  private label: HTMLDivElement;
  private caret: HTMLDivElement;
  private selectionHighlights: HTMLDivElement[] = [];
  private selectionKey = "";
  private visible = false;

  constructor(clientId: number) {
    this.clientId = clientId;
    this.root = document.createElement("div");
    this.root.className = CURSOR_CLASS;
    this.root.dataset.clientId = String(clientId);
    this.root.style.cssText =
      "position:fixed;pointer-events:none;z-index:2147483646;transition:opacity 120ms ease;";

    this.label = document.createElement("div");
    this.label.className = LABEL_CLASS;
    this.label.style.cssText =
      "position:absolute;transform:translate(-2px,calc(-100% - 4px));" +
      "padding:1px 6px;border-radius:3px;font:500 11px/16px system-ui,sans-serif;" +
      "color:#fff;white-space:nowrap;max-width:160px;overflow:hidden;text-overflow:ellipsis;";

    this.caret = document.createElement("div");
    this.caret.className = CARET_CLASS;
    this.caret.style.cssText =
      "position:absolute;width:2px;border-radius:1px;transform:translateX(-1px);";

    this.root.append(this.caret, this.label);
    this.hide();
  }

  mount(container: HTMLElement): void {
    if (!this.root.isConnected) container.appendChild(this.root);
  }

  update(state: RemoteCursorRenderState, overlayContainer: HTMLElement): void {
    if (!state.online || !state.cursor?.typing) {
      this.hide();
      return;
    }

    this.visible = true;
    this.root.style.opacity = "1";
    this.root.style.display = "block";

    const { user, x, y, height, selectionRects } = state;
    this.root.style.transform = `translate(${x}px, ${y}px)`;
    this.label.textContent = user.name;
    this.label.style.backgroundColor = user.color;
    this.caret.style.backgroundColor = user.color;
    this.caret.style.height = `${Math.max(6, height)}px`;
    this.caret.style.top = `${CARET_VERTICAL_OFFSET_PX}px`;
    this.renderSelectionHighlights(user.color, selectionRects, overlayContainer);
  }

  updatePosition(x: number, y: number): void {
    if (!this.visible) return;
    this.root.style.transform = `translate(${x}px, ${y}px)`;
  }

  hide(): void {
    this.visible = false;
    this.root.style.opacity = "0";
    this.root.style.display = "none";
    this.selectionKey = "";
    this.clearSelectionHighlights();
  }

  destroy(): void {
    this.clearSelectionHighlights();
    this.root.remove();
  }

  private renderSelectionHighlights(
    color: string,
    selectionRects: RemoteCursorRenderState["selectionRects"],
    overlayContainer: HTMLElement
  ): void {
    const key = selectionRects.map((r) => `${r.left},${r.top},${r.width},${r.height}`).join("|");
    if (key === this.selectionKey) return;
    this.selectionKey = key;
    this.clearSelectionHighlights();
    for (const rect of selectionRects) {
      const highlight = document.createElement("div");
      highlight.className = SELECTION_CLASS;
      highlight.style.cssText =
        `position:fixed;left:${rect.left}px;top:${rect.top}px;` +
        `width:${rect.width}px;height:${rect.height}px;` +
        `background:${color};opacity:0.28;border-radius:2px;pointer-events:none;z-index:2147483644;`;
      overlayContainer.appendChild(highlight);
      this.selectionHighlights.push(highlight);
    }
  }

  private clearSelectionHighlights(): void {
    for (const el of this.selectionHighlights) el.remove();
    this.selectionHighlights = [];
  }
}

export function ensureCursorStyles(): void {
  if (document.getElementById("lowcoder-cursor-presence-styles")) return;
  const style = document.createElement("style");
  style.id = "lowcoder-cursor-presence-styles";
  style.textContent = `
    .${CURSOR_CLASS} { contain: layout style; }
    .${LABEL_CLASS} { box-shadow: 0 1px 3px rgba(0,0,0,0.25); }
    .${CARET_CLASS} { animation: lowcoder-cursor-blink 1s step-end infinite; }
    @keyframes lowcoder-cursor-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
  `;
  document.head.appendChild(style);
}
