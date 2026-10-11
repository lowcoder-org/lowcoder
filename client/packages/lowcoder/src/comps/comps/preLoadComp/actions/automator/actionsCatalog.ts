// client/packages/lowcoder/src/comps/comps/preLoadComp/actions/automator/actionsCatalog.ts

/**
 * Machine-readable catalog of ALL actions the Automator may emit.
 *
 * Each entry tells the model:
 *   - the canonical action name (matches ACTION_REGISTRY in ChatPanelContainer)
 *   - the required and optional payload fields
 *   - one example
 *
 * This is the source of truth for "what the Automator can do".
 */

export type AutomatorActionName =
  | "place_component"
  | "nest_component"
  | "move_component"
  | "resize_component"
  | "delete_component"
  | "delete_query"
  | "rename_component"
  | "set_properties"
  | "set_style"
  | "set_theme"
  | "set_app_metadata"
  | "set_canvas_setting"
  | "set_global_css"
  | "set_global_javascript"
  | "add_event_handler"
  | "publish_app"
  | "align_component";

export interface ActionCatalogEntry {
  action: AutomatorActionName;
  purpose: string;
  required: string[];
  optional?: string[];
  example: Record<string, unknown>;
}

export const ACTIONS_CATALOG: ActionCatalogEntry[] = [
  // ── Component Management ──────────────────────────────────────────
  {
    action: "place_component",
    purpose: "Place a new component on the root canvas.",
    required: ["component", "component_name", "layout", "action_parameters"],
    example: {
      action: "place_component",
      component: "button",
      component_name: "submitBtn",
      layout: { x: 0, y: 0, w: 6, h: 5 },
      action_parameters: { text: "Submit" },
    },
  },
  {
    action: "nest_component",
    purpose:
      "Create a NEW component inside an existing container. Do not use this to move or reparent an existing component; if the requested component already exists, ask/explain instead of duplicating it.",
    required: ["component", "component_name", "parent_component_name", "layout", "action_parameters"],
    example: {
      action: "nest_component",
      component: "input",
      component_name: "emailInput",
      parent_component_name: "loginForm.container.body.0.view",
      layout: { x: 0, y: 0, w: 24, h: 6 },
      action_parameters: {
        label: { text: "Email", position: "row", align: "left" },
        placeholder: "you@example.com",
      },
    },
  },
  {
    action: "move_component",
    purpose: "Move an existing component to a new grid position.",
    required: ["component_name", "layout"],
    example: {
      action: "move_component",
      component_name: "submitBtn",
      layout: { x: 6, y: 0 },
    },
  },
  {
    action: "resize_component",
    purpose: "Change the width/height of an existing component.",
    required: ["component_name", "layout"],
    example: {
      action: "resize_component",
      component_name: "todoTable",
      layout: { w: 24, h: 30 },
    },
  },
  {
    action: "delete_component",
    purpose: "Remove an existing component from the canvas.",
    required: ["component_name"],
    example: {
      action: "delete_component",
      component_name: "oldButton",
    },
  },
  {
    action: "delete_query",
    purpose:
      "Delete an existing bottom-panel data query by name. This action only needs the query name and does not read the query configuration or body.",
    required: ["query_name"],
    example: {
      action: "delete_query",
      query_name: "getUsers",
    },
  },
  {
    action: "rename_component",
    purpose: "Rename an existing component.",
    required: ["component_name", "action_parameters"],
    example: {
      action: "rename_component",
      component_name: "button1",
      action_parameters: { new_name: "submitButton" },
    },
  },
  {
    action: "align_component",
    purpose:
      "Move a component horizontally on the canvas grid (left, center, right). This positions the COMPONENT in the canvas — it does NOT change text alignment INSIDE a component. For text/content alignment, use `set_properties` with the component's `horizontalAlignment` / `verticalAlignment` layoutProperties.",
    required: ["component_name", "action_parameters"],
    example: {
      action: "align_component",
      component_name: "title1",
      action_parameters: { alignment: "center" },
    },
  },

  // ── Properties & Styling ──────────────────────────────────────────
  {
    action: "set_properties",
    purpose:
      "Update top-level properties on an existing component (text, alignment, autoHeight, type, disabled, label, options, …). Use this for behaviour and layout-style props listed in the component's `layoutProperties`. Use `set_style` for CSS-like visual props.",
    required: ["component_name", "action_parameters"],
    example: {
      action: "set_properties",
      component_name: "title1",
      action_parameters: { horizontalAlignment: "center", verticalAlignment: "center" },
    },
  },
  {
    action: "set_style",
    purpose:
      "Apply basic visual styles to a component. Pass an object grouped by explicit style namespace (`style`, `labelStyle`, `inputFieldStyle`, `headerStyle`, `bodyStyle`, etc.). Do not pass flat style keys and do not use animation styles.",
    required: ["component_name", "action_parameters"],
    example: {
      action: "set_style",
      component_name: "submitBtn",
      action_parameters: {
        style: {
          background: "#1677ff",
          text: "#ffffff",
          radius: "8px",
          textSize: "14px",
          textWeight: "600",
          padding: "8px 16px",
        },
      },
    },
  },

  // ── Events ────────────────────────────────────────────────────────
  {
    action: "add_event_handler",
    purpose: "Add an event handler (click, change, etc.) to a component.",
    required: ["component_name", "action_parameters"],
    example: {
      action: "add_event_handler",
      component_name: "submitBtn",
      action_parameters: { event: "click", action_type: "message" },
    },
    optional: ["action_parameters.config"],
  },

  // ── App-Level Configuration ───────────────────────────────────────
  {
    action: "set_theme",
    purpose: "Apply a theme to the whole app.",
    required: ["action_parameters"],
    example: {
      action: "set_theme",
      action_parameters: { theme: "default" },
    },
  },
  {
    action: "set_app_metadata",
    purpose: "Set app title, description, or category.",
    required: ["action_parameters"],
    example: {
      action: "set_app_metadata",
      action_parameters: { title: "My Todo App", description: "A task tracker." },
    },
  },
  {
    action: "set_canvas_setting",
    purpose: "Update canvas grid settings (columns, row height, padding, bg).",
    required: ["action_parameters"],
    example: {
      action: "set_canvas_setting",
      action_parameters: { gridColumns: 24, gridRowHeight: 8, maxWidth: "1440" },
    },
  },
  {
    action: "set_global_css",
    purpose: "Set global CSS rules for the entire app.",
    required: ["action_parameters"],
    example: {
      action: "set_global_css",
      action_parameters: { code: "body { font-family: 'Inter', sans-serif; }" },
    },
  },
  {
    action: "set_global_javascript",
    purpose: "Set global JavaScript that runs on app load.",
    required: ["action_parameters"],
    example: {
      action: "set_global_javascript",
      action_parameters: { code: "console.log('App loaded');" },
    },
  },
  {
    action: "publish_app",
    purpose: "Publish the current app so end-users can access it.",
    required: [],
    example: { action: "publish_app" },
  },
];

export const SUPPORTED_ACTIONS = new Set<AutomatorActionName>(
  ACTIONS_CATALOG.map((a) => a.action)
);
