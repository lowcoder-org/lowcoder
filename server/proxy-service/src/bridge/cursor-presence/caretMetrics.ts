import type { TextFieldElement } from "./textField";

const MIRROR_PROPERTIES = [
  "direction", "boxSizing", "width", "height", "overflowX", "overflowY",
  "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
  "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
  "fontStyle", "fontVariant", "fontWeight", "fontStretch", "fontSize",
  "fontSizeAdjust", "lineHeight", "fontFamily", "textAlign", "textTransform",
  "textIndent", "textDecoration", "letterSpacing", "wordSpacing", "tabSize",
  "whiteSpace", "wordWrap", "wordBreak",
] as const;

let mirrorDiv: HTMLDivElement | null = null;

function getMirrorDiv(): HTMLDivElement {
  if (!mirrorDiv) {
    mirrorDiv = document.createElement("div");
    mirrorDiv.id = "lowcoder-cursor-mirror";
    mirrorDiv.setAttribute("aria-hidden", "true");
    mirrorDiv.style.cssText =
      "position:absolute;visibility:hidden;white-space:pre-wrap;word-wrap:break-word;top:0;left:-9999px;";
    document.body.appendChild(mirrorDiv);
  }
  return mirrorDiv;
}

function toKebabCase(prop: string): string {
  return prop.replace(/([A-Z])/g, "-$1").toLowerCase();
}

function copyInputStyles(element: HTMLInputElement | HTMLTextAreaElement, div: HTMLDivElement): void {
  const computed = window.getComputedStyle(element);
  for (const prop of MIRROR_PROPERTIES) {
    const kebab = toKebabCase(prop);
    div.style.setProperty(kebab, computed.getPropertyValue(kebab));
  }
  div.style.width = `${element.clientWidth}px`;
  div.style.whiteSpace = element instanceof HTMLTextAreaElement ? "pre-wrap" : "nowrap";
}

export interface CaretCoordinates {
  left: number;
  top: number;
  height: number;
}

export interface SelectionRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

function fieldLineHeight(field: TextFieldElement): number {
  const style = window.getComputedStyle(field);
  return parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2 || 20;
}

/** Fallback caret at the start of the visible field bounds. */
export function getFieldFallbackCaret(field: TextFieldElement): CaretCoordinates {
  const rect = field.getBoundingClientRect();
  const height = fieldLineHeight(field);
  const style = window.getComputedStyle(field);
  const padL = parseFloat(style.paddingLeft || "0");
  const padT = parseFloat(style.paddingTop || "0");
  return {
    left: rect.left + padL + 4,
    top: rect.top + padT + 2,
    height,
  };
}

export function getContentEditableCaret(field: HTMLElement): CaretCoordinates | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return getFieldFallbackCaret(field);
  const range = sel.getRangeAt(0);
  if (!field.contains(range.startContainer)) return getFieldFallbackCaret(field);
  const collapsed = range.cloneRange();
  collapsed.collapse(true);
  const rects = collapsed.getClientRects();
  const rect = rects.length > 0 ? rects[0] : collapsed.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return getFieldFallbackCaret(field);
  return { left: rect.left, top: rect.top, height: Math.max(rect.height, fieldLineHeight(field)) };
}

export function getCaretCoordinatesForField(
  field: TextFieldElement,
  position?: number
): CaretCoordinates | null {
  if (field instanceof HTMLElement && field.isContentEditable && !(field instanceof HTMLInputElement) && !(field instanceof HTMLTextAreaElement)) {
    return getContentEditableCaret(field);
  }
  if (position == null) return getFieldFallbackCaret(field);
  const exact = getCaretCoordinates(field as HTMLInputElement | HTMLTextAreaElement, position);
  return exact ?? getFieldFallbackCaret(field);
}

export function getCaretCoordinates(
  element: HTMLInputElement | HTMLTextAreaElement,
  position: number
): CaretCoordinates | null {
  if (!element.isConnected) return null;

  const div = getMirrorDiv();
  copyInputStyles(element, div);

  const value = element.value;
  const clamped = Math.max(0, Math.min(position, value.length));
  const before = value.slice(0, clamped);
  const after = value.slice(clamped) || ".";

  div.textContent = before;
  const span = document.createElement("span");
  span.textContent = after;
  div.appendChild(span);

  const elementRect = element.getBoundingClientRect();
  const spanRect = span.getBoundingClientRect();
  const divRect = div.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2;

  const left =
    elementRect.left -
    element.scrollLeft +
    (spanRect.left - divRect.left) +
    parseFloat(style.borderLeftWidth || "0") +
    parseFloat(style.paddingLeft || "0");
  const top =
    elementRect.top -
    element.scrollTop +
    (spanRect.top - divRect.top) +
    parseFloat(style.borderTopWidth || "0") +
    parseFloat(style.paddingTop || "0");

  div.textContent = "";
  const coords = { left, top, height: lineHeight };
  if (!Number.isFinite(coords.left) || !Number.isFinite(coords.top)) {
    return null;
  }
  return coords;
}

export function getSelectionRectsForField(
  field: TextFieldElement,
  anchor: number,
  head: number
): SelectionRect[] {
  if (field instanceof HTMLElement && field.isContentEditable && !(field instanceof HTMLInputElement) && !(field instanceof HTMLTextAreaElement)) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || anchor === head) return [];
    const range = sel.getRangeAt(0);
    if (!field.contains(range.startContainer)) return [];
    const rects: SelectionRect[] = [];
    for (const r of Array.from(range.getClientRects())) {
      rects.push({ left: r.left, top: r.top, width: r.width, height: r.height });
    }
    return rects;
  }
  return getSelectionRects(field as HTMLInputElement | HTMLTextAreaElement, anchor, head);
}

export function getSelectionRects(
  element: HTMLInputElement | HTMLTextAreaElement,
  anchor: number,
  head: number
): SelectionRect[] {
  const start = Math.min(anchor, head);
  const end = Math.max(anchor, head);
  if (start === end) return [];

  const startCoords = getCaretCoordinates(element, start);
  const endCoords = getCaretCoordinates(element, end);
  if (!startCoords || !endCoords) return [];

  const height = startCoords.height;
  if (Math.abs(startCoords.top - endCoords.top) < height * 0.5) {
    return [{
      left: startCoords.left,
      top: startCoords.top,
      width: Math.max(2, endCoords.left - startCoords.left),
      height,
    }];
  }

  const value = element.value;
  const lineStart = value.lastIndexOf("\n", start) + 1;
  const lineEnd = value.indexOf("\n", end);
  const lineEndIndex = lineEnd === -1 ? value.length : lineEnd;
  const lineEndCoords = getCaretCoordinates(element, lineEndIndex);
  const lineStartCoords = getCaretCoordinates(element, lineStart);
  const rects: SelectionRect[] = [];

  if (lineEndCoords) {
    rects.push({
      left: startCoords.left,
      top: startCoords.top,
      width: Math.max(2, lineEndCoords.left - startCoords.left),
      height,
    });
  }
  if (lineStartCoords) {
    rects.push({
      left: lineStartCoords.left,
      top: endCoords.top,
      width: Math.max(2, endCoords.left - lineStartCoords.left),
      height,
    });
  }
  return rects;
}

export function destroyCaretMirror(): void {
  mirrorDiv?.remove();
  mirrorDiv = null;
}
