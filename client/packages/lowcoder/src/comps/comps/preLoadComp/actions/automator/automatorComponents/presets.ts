import type { AutomatorLayoutPropertyDescriptor } from "./types";

// ── Style key presets ────────────────────────────────────────────────────────
// Mirror the field lists from `comps/controls/styleControlConstants.tsx` so the
// model knows what keys it can pass to `set_style`. Keep these compact — they
// are inlined into the system prompt.

export const COMMON_STYLE_KEYS = [
  "background",
  "text",
  "textTransform",
  "textDecoration",
  "textSize",
  "textWeight",
  "fontFamily",
  "fontStyle",
  "border",
  "borderStyle",
  "borderWidth",
  "radius",
  "margin",
  "padding",
  "lineHeight",
] as const;

export const CONTAINER_STYLE_KEYS = [
  "background",
  "border",
  "borderStyle",
  "borderWidth",
  "radius",
  "margin",
  "padding",
  "boxShadow",
  "boxShadowColor",
  "opacity",
] as const;

export const INPUT_LIKE_STYLE_KEYS = [
  "background",
  "boxShadow",
  "boxShadowColor",
  "text",
  "textTransform",
  "textDecoration",
  "textSize",
  "textWeight",
  "fontFamily",
  "fontStyle",
  "border",
  "borderStyle",
  "borderWidth",
  "radius",
  "margin",
  "padding",
  "placeholder",
  "accent",
  "validate",
] as const;

export const LABEL_STYLE_KEYS = [
  "background",
  "label",
  "textTransform",
  "textDecoration",
  "textSize",
  "textWeight",
  "fontFamily",
  "fontStyle",
  "borderStyle",
  "borderWidth",
  "margin",
  "padding",
  "placeholder",
  "accent",
  "validate",
] as const;

export const IMAGE_STYLE_KEYS = [
  "margin",
  "padding",
  "border",
  "borderStyle",
  "borderWidth",
  "radius",
  "opacity",
  "boxShadow",
  "boxShadowColor",
] as const;

export const NAVIGATION_STYLE_KEYS = [
  "background",
  "border",
  "borderStyle",
  "borderWidth",
  "radius",
  "margin",
  "padding",
  "accent",
] as const;

// ── Layout property presets ─────────────────────────────────────────────────

export const TEXT_HORIZONTAL_ALIGNMENT: AutomatorLayoutPropertyDescriptor = {
  description: "Horizontal text alignment inside the component.",
  enum: ["left", "center", "right", "justify"],
};

export const ALIGN_HORIZONTAL: AutomatorLayoutPropertyDescriptor = {
  description: "Horizontal alignment.",
  enum: ["left", "center", "right"],
};

export const VERTICAL_ALIGNMENT: AutomatorLayoutPropertyDescriptor = {
  description: "Vertical alignment.",
  enum: ["flex-start", "center", "flex-end"],
};

export const AUTO_HEIGHT: AutomatorLayoutPropertyDescriptor = {
  description: "Whether the component auto-sizes its height to its content.",
  enum: ["auto", "fixed"],
};

export const HIDDEN: AutomatorLayoutPropertyDescriptor = {
  description: "Hide the component at runtime.",
  type: "boolean",
};

export const DISABLED: AutomatorLayoutPropertyDescriptor = {
  description: "Disable the component at runtime.",
  type: "boolean",
};

export const LOADING: AutomatorLayoutPropertyDescriptor = {
  description: "Show a loading indicator on the component.",
  type: "boolean",
};

export const LABEL_OBJECT: AutomatorLayoutPropertyDescriptor = {
  description:
    "Field label config: { text, position: 'row'|'column', align: 'left'|'center'|'right', width: number, hidden?: boolean, tooltip?: string }.",
  type: "object",
  example: { text: "Email", position: "row", align: "left" },
};
