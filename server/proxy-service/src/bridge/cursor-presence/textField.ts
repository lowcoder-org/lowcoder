/**
 * Unified text-field target helpers for cursor presence.
 * Supports input, textarea, and contenteditable (used by some Typeform builds).
 */

export type TextFieldElement =
  | HTMLInputElement
  | HTMLTextAreaElement
  | (HTMLElement & { contentEditable: "true" });

const IGNORED_INPUT_TYPES = new Set([
  "hidden", "checkbox", "radio", "button", "submit", "file", "password",
]);

export function isTextFieldElement(el: Element | null): el is TextFieldElement {
  if (!el) return false;
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement) {
    const type = (el.getAttribute("type") || el.type || "text").toLowerCase();
    return !IGNORED_INPUT_TYPES.has(type);
  }
  if (el instanceof HTMLElement && el.isContentEditable) return true;
  return false;
}

export function getFocusedTextField(): TextFieldElement | null {
  const el = document.activeElement;
  if (isTextFieldElement(el)) return el;
  // Typeform sometimes focuses a wrapper; look for editable descendant.
  if (el instanceof HTMLElement) {
    const inner = el.querySelector<HTMLElement>(
      'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]'
    );
    if (isTextFieldElement(inner)) return inner;
  }
  return null;
}

export function listEditableFields(container: ParentNode = document): TextFieldElement[] {
  const nodes = container.querySelectorAll<TextFieldElement>(
    [
      'input[type="text"]',
      'input[type="email"]',
      'input[type="number"]',
      'input[type="tel"]',
      'input[type="url"]',
      'input[type="search"]',
      'input[type="short_text"]',
      'input[type="long_text"]',
      'input[type="phone_number"]',
      'input[name]',
      'input:not([type])',
      "textarea",
      '[contenteditable="true"]',
      '[role="textbox"]',
    ].join(", ")
  );
  return Array.from(nodes).filter((field) => {
    if (!isTextFieldElement(field)) return false;
    const rect = field.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });
}

export function getFieldText(field: TextFieldElement): string {
  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
    return field.value;
  }
  return field.textContent ?? "";
}

export function getFieldSelection(field: TextFieldElement): { anchor: number; head: number } {
  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
    return {
      anchor: field.selectionStart ?? 0,
      head: field.selectionEnd ?? 0,
    };
  }
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    const len = getFieldText(field).length;
    return { anchor: len, head: len };
  }
  const range = sel.getRangeAt(0);
  if (!field.contains(range.startContainer)) {
    const len = getFieldText(field).length;
    return { anchor: len, head: len };
  }
  const pre = range.cloneRange();
  pre.selectNodeContents(field);
  pre.setEnd(range.startContainer, range.startOffset);
  const anchor = pre.toString().length;
  pre.setEnd(range.endContainer, range.endOffset);
  const head = pre.toString().length;
  return { anchor, head };
}

export function extractQuestionUuid(value: string): string | null {
  const match = value.match(
    /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
  );
  return match?.[1] ?? null;
}

/** Field key compatible with the Typeform bridge key scheme. */
export function getCursorFieldKey(
  field: TextFieldElement,
  step: number,
  bridgeGetFieldKey?: (f: HTMLInputElement | HTMLTextAreaElement) => string
): string {
  if (
    bridgeGetFieldKey &&
    (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)
  ) {
    return bridgeGetFieldKey(field);
  }
  const name = field.getAttribute("name")?.trim();
  if (name) return `name:${name}`;
  const labelledBy = field.getAttribute("aria-labelledby") || "";
  const fromLabel = extractQuestionUuid(labelledBy);
  if (fromLabel) return `qid:${fromLabel}`;
  const id = field.getAttribute("id") || "";
  const fromId = extractQuestionUuid(id);
  if (fromId) return `qid:${fromId}`;
  const qa = field.getAttribute("data-qa");
  if (qa) return `qa:${qa}:step:${step}`;
  return `ce:step:${step}`;
}

export function findFieldByCursorKey(
  key: string,
  step: number,
  bridgeFindFieldByKey?: (key: string) => HTMLInputElement | HTMLTextAreaElement | null
): TextFieldElement | null {
  if (bridgeFindFieldByKey) {
    const bridged = bridgeFindFieldByKey(key);
    if (bridged) return bridged;
  }
  for (const field of listEditableFields()) {
    if (getCursorFieldKey(field, step) === key) return field;
  }
  if (key.startsWith("name:")) {
    const name = key.slice("name:".length);
    const el = document.querySelector(`input[name="${CSS.escape(name)}"], textarea[name="${CSS.escape(name)}"]`);
    if (isTextFieldElement(el)) return el;
  }
  if (key.startsWith("qid:")) {
    const qid = key.slice("qid:".length);
    const sel = `[aria-labelledby*="${CSS.escape(qid)}"], [id*="${CSS.escape(qid)}"]`;
    for (const el of document.querySelectorAll(sel)) {
      if (isTextFieldElement(el)) return el;
    }
  }
  return null;
}
